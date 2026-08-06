"""
generate_price_update_sql.py

Tujuan:
Membaca file CSV berisi harga terbaru (misal hasil penyesuaian kebijakan
PPh pemerintah), lalu MENGHASILKAN FILE .sql berisi statement UPDATE --
BUKAN langsung upload lewat REST API Supabase.

Kenapa harus lewat SQL Editor, bukan REST API:
- Update lewat REST API (script upload_to_supabase yang lama) tetap
  memakan kuota EGRESS Supabase, karena data bolak-balik lewat internet
  ke/dari laptop kamu.
- Menjalankan SQL langsung di Supabase SQL Editor itu dieksekusi DI SISI
  SERVER Supabase sendiri -- nyaris tidak memakan egress, karena cuma
  ada 1x kirim teks SQL dan 1x terima ringkasan hasil ("X rows updated"),
  bukan data produk bolak-balik per baris.
- Ini penting terutama saat kuota egress sudah mepet/overage (seperti
  kondisi sekarang), supaya update harga tidak memperparah overage.

Cara pakai:
1. Siapkan file CSV harga baru. Kolom yang WAJIB ada (nama kolom bisa
   disesuaikan di bagian KONFIGURASI di bawah):
     - external_product_id  (kunci pencocokan produk)
     - price                (harga baru)
   Kolom opsional:
     - original_price       (harga asli sebelum diskon, kalau ada)
     - discount_percent     (kalau mau override manual, kalau kosong akan
                              dihitung otomatis dari price vs original_price)
     - merchant             (shopee/tokopedia/lazada -- kalau CSV berisi
                              campuran beberapa merchant sekaligus)

2. Sesuaikan variabel di bagian KONFIGURASI di bawah.

3. Jalankan:
     python generate_price_update_sql.py

4. Buka file .sql hasilnya, COPY-PASTE isinya ke Supabase Dashboard ->
   SQL Editor, lalu klik Run. Kalau jumlah baris sangat banyak (ribuan),
   file akan otomatis dipecah jadi beberapa batch -- jalankan satu per
   satu supaya tidak membebani SQL Editor sekaligus.

PENTING -- lakukan dulu sebelum menjalankan hasil SQL-nya:
- Baca sekilas isi file .sql yang dihasilkan, pastikan angka harga masuk
  akal (tidak ada yang 0 atau negatif karena data CSV kosong/rusak).
- Jalankan dulu di jam sepi/traffic rendah, untuk jaga-jaga.
- Kalau ragu, jalankan dulu batch pertama saja (misal 50 baris) sebagai
  uji coba, cek di Table Editor apakah hasilnya sesuai, baru lanjutkan
  batch berikutnya.
"""

import pandas as pd
import os
import re
import html

# ============================================================
# KONFIGURASI -- ubah sesuai kebutuhanmu
# ============================================================

# Folder script, supaya path tetap benar meskipun dijalankan dari root project.
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Path file CSV berisi harga baru.
INPUT_FILE = os.path.join(BASE_DIR, "product_list_966_20260804.CSV")

# Nama file .sql hasil generate.
OUTPUT_FILE = os.path.join(BASE_DIR, "update_harga_agustus.sql")

# Nama kolom di CSV kamu -- sesuaikan kalau beda.
COL_EXTERNAL_ID = "Merchant Product ID"
COL_MERCHANT = None                   # CSV mentah ini tidak punya kolom merchant
COL_PRICE = "Discounted Price"        # harga terbaru/harga jual
COL_ORIGINAL_PRICE = "Price"          # harga normal sebelum diskon
COL_DISCOUNT_PERCENT = None            # dihitung dari Price dan Discounted Price

# Kalau CSV kamu TIDAK punya kolom merchant (semua produk 1 merchant saja),
# isi merchant tetapnya di sini. Kalau CSV SUDAH punya kolom merchant,
# biarkan ini None -- nilai per baris akan dipakai.
DEFAULT_MERCHANT = "shopee"
CAMPAIGN_ID = "direct_csv"          # harus sama dengan campaign_id di database
SITE_ID = "127950"                  # harus sama dengan site_id di database

# Kolom metadata untuk INSERT produk yang belum ada.
COL_NAME = "Merchant Product Name"
COL_AFFILIATE_URL = "Product URL Web (encoded)"
COL_PRODUCT_URL = "Product URL Mobile (encoded)"
COL_IMAGE_URL = "Image URL"
COL_BRAND = "Brand"
COL_CATEGORY = "Sub category Name"
COL_DESCRIPTION = "Description"

# Berapa banyak statement UPDATE per batch/file. Kalau data ribuan baris,
# ini memecah supaya tidak 1 file raksasa yang berat di-paste ke SQL Editor.
BATCH_SIZE = 500
MAX_BATCH_BYTES = 400_000  # batas aman untuk SQL Editor (termasuk deskripsi)

# Filter produk sebelum membuat SQL (mengikuti filter_product_feed.py).
TOP_N_PER_SUBKATEGORI = 25
MIN_ITEM_SOLD = 10                 # set 0 untuk menonaktifkan
MIN_RATING = 3                     # set None untuk menonaktifkan
FILTER_SUBKATEGORI = []            # [] = semua subkategori

COL_AVAILABLE = "Available"
COL_ITEM_SOLD = "Unit Sold"        # nama pada CSV mentah 20260804
COL_RATING = "Product rating"      # nama pada CSV mentah 20260804
COL_SUBKATEGORI = "Sub category Name"

# ============================================================


def clean_numeric_series(series):
    """Konversi kolom angka feed menjadi numeric; nilai kosong menjadi 0."""
    return pd.to_numeric(series, errors="coerce").fillna(0)


def apply_feed_filters(df):
    """Filter lokal saja; tidak melakukan request/upload ke Supabase."""
    before = len(df)

    if COL_AVAILABLE in df.columns:
        df = df[df[COL_AVAILABLE].astype(str).str.strip().str.lower().isin(
            ["true", "1", "yes", "ya"]
        )]

    sold_col = COL_ITEM_SOLD if COL_ITEM_SOLD in df.columns else (
        "item_sold" if "item_sold" in df.columns else None
    )
    rating_col = COL_RATING if COL_RATING in df.columns else (
        "item_rating" if "item_rating" in df.columns else None
    )
    subcategory_col = COL_SUBKATEGORI if COL_SUBKATEGORI in df.columns else (
        "Sub category Name" if "Sub category Name" in df.columns else (
            "sub_category" if "sub_category" in df.columns else (
                "Category Name" if "Category Name" in df.columns else "category"
            )
        )
    )

    if sold_col:
        df = df.copy()
        df[sold_col] = clean_numeric_series(df[sold_col])
        if MIN_ITEM_SOLD > 0:
            df = df[df[sold_col] >= MIN_ITEM_SOLD]

    if rating_col and MIN_RATING is not None:
        if not isinstance(df, pd.DataFrame):
            df = df.copy()
        df[rating_col] = clean_numeric_series(df[rating_col])
        df = df[df[rating_col] >= MIN_RATING]

    if FILTER_SUBKATEGORI and subcategory_col:
        df = df[df[subcategory_col].isin(FILTER_SUBKATEGORI)]

    # Sama seperti filter_product_feed: ambil Top-N per subkategori.
    if subcategory_col and TOP_N_PER_SUBKATEGORI > 0:
        sort_cols = []
        if sold_col:
            sort_cols.append(sold_col)
        if rating_col:
            sort_cols.append(rating_col)
        if sort_cols:
            df = df.sort_values(sort_cols, ascending=False)
        df = df.groupby(subcategory_col, dropna=False, group_keys=False).head(
            TOP_N_PER_SUBKATEGORI
        )

    print(
        f"Filter lokal: {before:,} -> {len(df):,} baris "
        f"(available, sold >= {MIN_ITEM_SOLD}, rating >= {MIN_RATING}, "
        f"top {TOP_N_PER_SUBKATEGORI}/subkategori)"
    )
    return df


def clean_price(value):
    """Bersihkan angka harga dari 'Rp', titik ribuan, koma, dll."""
    if pd.isna(value):
        return None
    s = str(value).strip()
    s = re.sub(r"[Rr][Pp]\.?\s*", "", s)
    s = s.replace(".", "").replace(",", "")
    s = re.sub(r"[^\d]", "", s)
    if not s:
        return None
    return int(float(s))


def sql_escape_string(value: str) -> str:
    """Escape single quote untuk string literal SQL."""
    return str(value).replace("'", "''")


def clean_text(value):
    if value is None or pd.isna(value):
        return ""
    text = str(value).replace("\ufeff", "").strip()
    return "" if text.lower() in ("nan", "none") else text


def clean_name(title: str) -> str:
    """Pembersihan nama yang sama seperti filter_product_feed.py."""
    if not isinstance(title, str) or not title.strip():
        return ""
    title = re.sub(r'^(\[[^\]]+\]\s*)+', '', title, flags=re.IGNORECASE)
    parts = [p.strip() for p in title.split('|') if p.strip()]
    if parts:
        title = parts[0]
    slash_parts = [p.strip() for p in title.split(' / ') if p.strip()]
    if len(slash_parts) > 1 and len(slash_parts[0]) >= 15:
        title = slash_parts[0]
    title = re.sub(r'\s+', ' ', title).strip()
    if len(title) > 90:
        title = title[:90].rsplit(' ', 1)[0].strip()
    return title


def clean_description(text: str) -> str:
    """Pembersihan deskripsi yang sama seperti filter_product_feed.py."""
    if not isinstance(text, str) or not text.strip():
        return ""
    text = re.sub(r'<br\s*/?>|</p>|</div>', '\n', text, flags=re.IGNORECASE)
    text = re.sub(r'<[^>]+>', '', text)
    text = html.unescape(text)
    cleaned_lines = []
    for line in text.split('\n'):
        line = line.strip()
        if not line:
            continue
        if re.search(r'#(?:[a-zA-Z0-9_]+)', line):
            continue
        if re.search(r'(unboxing|reseller|order sekarang|buka toko|jam operasional|syarat & ketentuan|disclaimer|wajib video|garansi retur|pembelian grosir)', line, re.IGNORECASE):
            continue
        cleaned_lines.append(line)
    return re.sub(r'\n{3,}', '\n\n', '\n'.join(cleaned_lines)).strip()

def sql_literal(value, required=False):
    """Buat literal PostgreSQL aman dari apostrof, newline, emoji, dan UTF-8."""
    text = clean_text(value).replace("\x00", "")
    if not text:
        if required:
            return "''"
        return "NULL"
    # Hex hanya berisi 0-9a-f, sehingga isi teks tidak mungkin memecah SQL.
    encoded = text.encode("utf-8").hex()
    return f"convert_from(decode('{encoded}', 'hex'), 'UTF8')"


def main():
    if not os.path.exists(INPUT_FILE):
        print(f"File tidak ditemukan: {INPUT_FILE}")
        print("Pastikan INPUT_FILE di bagian KONFIGURASI sudah sesuai nama/path filenya.")
        return

    df = pd.read_csv(INPUT_FILE, dtype=str, encoding="utf-8-sig")
    df.columns = [str(c).replace("\ufeff", "").strip() for c in df.columns]

    print(f"Total baris terbaca dari CSV: {len(df):,}")

    if COL_EXTERNAL_ID not in df.columns:
        print(f"PERINGATAN: kolom '{COL_EXTERNAL_ID}' tidak ditemukan di CSV!")
        print(f"Kolom yang tersedia: {list(df.columns)}")
        return
    if COL_PRICE not in df.columns:
        print(f"PERINGATAN: kolom '{COL_PRICE}' tidak ditemukan di CSV!")
        print(f"Kolom yang tersedia: {list(df.columns)}")
        return

    df = apply_feed_filters(df)
    if df.empty:
        print("Tidak ada produk setelah filter. SQL tidak dibuat.")
        return

    statements = []
    skipped = 0
    insert_skipped = 0

    for idx, row in df.iterrows():
        ext_id = str(row.get(COL_EXTERNAL_ID, "")).strip()
        if not ext_id or ext_id.lower() == "nan":
            skipped += 1
            continue

        # Harga jual terbaru ada di Discounted Price. Pada produk tanpa promo,
        # kolom ini kadang kosong sehingga gunakan Price sebagai fallback.
        price = clean_price(row.get(COL_PRICE))
        if price is None:
            price = clean_price(row.get(COL_ORIGINAL_PRICE))
        if price is None or price <= 0:
            skipped += 1
            continue

        merchant = DEFAULT_MERCHANT
        if COL_MERCHANT and COL_MERCHANT in df.columns:
            m = str(row.get(COL_MERCHANT, "")).strip().lower()
            if m and m != "nan":
                merchant = m

        original_price = None
        if COL_ORIGINAL_PRICE and COL_ORIGINAL_PRICE in df.columns:
            original_price = clean_price(row.get(COL_ORIGINAL_PRICE))

        # Jangan menampilkan harga coret jika tidak benar-benar lebih tinggi
        # dari harga jual terbaru.
        if not original_price or original_price <= price:
            original_price = None

        discount_percent = None
        if COL_DISCOUNT_PERCENT and COL_DISCOUNT_PERCENT in df.columns:
            raw_disc = row.get(COL_DISCOUNT_PERCENT)
            if pd.notna(raw_disc):
                try:
                    discount_percent = int(float(str(raw_disc).replace("%", "").strip()))
                except ValueError:
                    discount_percent = None

        # Kalau discount_percent tidak diisi manual, hitung otomatis dari
        # original_price vs price (kalau original_price tersedia dan > price).
        if discount_percent is None and original_price and original_price > price:
            discount_percent = round(((original_price - price) / original_price) * 100)

        # Metadata dipakai hanya saat INSERT produk baru.
        product_name = clean_name(clean_text(row.get(COL_NAME)) or ext_id)
        description = clean_description(clean_text(row.get(COL_DESCRIPTION)))
        affiliate_url = clean_text(row.get(COL_AFFILIATE_URL))
        if not affiliate_url:
            affiliate_url = clean_text(row.get("Product URL Web"))
        if not affiliate_url:
            affiliate_url = clean_text(row.get(COL_PRODUCT_URL))
        product_url = clean_text(row.get(COL_PRODUCT_URL)) or affiliate_url
        image_url = clean_text(row.get(COL_IMAGE_URL))
        brand = clean_text(row.get(COL_BRAND))
        category = clean_text(row.get(COL_CATEGORY))

        price_sql = str(price)
        original_sql = str(original_price) if original_price is not None else "NULL"
        discount_sql = str(discount_percent) if discount_percent is not None else "NULL"
        where_key = (
            f"merchant = {sql_literal(merchant, required=True)} AND "
            f"external_product_id = {sql_literal(ext_id, required=True)}"
        )

        # UPDATE semua record dengan merchant + external ID yang sama.
        # Ini juga menangani record lama yang campaign/site-nya berbeda.
        update_stmt = (
            f"UPDATE affiliate_products SET name = {sql_literal(product_name, required=True)}, "
            f"description = {sql_literal(description)}, price = {price_sql}, "
            f"original_price = {original_sql}, discount_percent = {discount_sql}, "
            f"last_synced_at = NOW(), updated_at = NOW() "
            f"WHERE {where_key};"
        )

        # INSERT hanya jika belum ada berdasarkan merchant + external ID.
        # ON CONFLICT menjadi pengaman tambahan terhadap unique constraint.
        insert_stmt = ""
        if affiliate_url:
            insert_stmt = (
                "INSERT INTO affiliate_products "
                "(source, merchant, campaign_id, site_id, external_product_id, "
                "name, description, image_url, product_url, affiliate_url, price, original_price, "
                "discount_percent, shop_name, category, is_active, last_synced_at, updated_at) "
                f"SELECT 'accesstrade', {sql_literal(merchant, required=True)}, "
                f"{sql_literal(CAMPAIGN_ID, required=True)}, {sql_literal(SITE_ID, required=True)}, "
                f"{sql_literal(ext_id, required=True)}, {sql_literal(product_name, required=True)}, "
                f"{sql_literal(description)}, {sql_literal(image_url)}, {sql_literal(product_url)}, {sql_literal(affiliate_url, required=True)}, "
                f"{price_sql}, {original_sql}, {discount_sql}, {sql_literal(brand)}, {sql_literal(category)}, "
                "true, NOW(), NOW() "
                "WHERE NOT EXISTS ("
                "SELECT 1 FROM affiliate_products "
                f"WHERE {where_key}"
                ") "
                "ON CONFLICT (merchant, campaign_id, external_product_id, site_id) DO NOTHING;"
            )
        else:
            insert_skipped += 1

        statements.append(update_stmt + ("\n" + insert_stmt if insert_stmt else ""))

    print(f"Statement UPDATE berhasil dibuat: {len(statements):,}")
    print(f"Baris dilewati (data kosong/tidak valid): {skipped:,}")
    print(f"INSERT dilewati karena URL affiliate kosong: {insert_skipped:,}")

    if not statements:
        print("Tidak ada statement yang dihasilkan. Cek isi CSV kamu.")
        return

    # Pecah berdasarkan jumlah statement DAN ukuran file. Deskripsi produk
    # dapat panjang, jadi jumlah baris saja tidak cukup untuk SQL Editor.
    batches = []
    current_batch = []
    current_bytes = 0
    for stmt in statements:
        stmt_bytes = len((stmt + "\n").encode("utf-8"))
        if current_batch and (
            len(current_batch) >= BATCH_SIZE
            or current_bytes + stmt_bytes > MAX_BATCH_BYTES
        ):
            batches.append(current_batch)
            current_batch = []
            current_bytes = 0
        current_batch.append(stmt)
        current_bytes += stmt_bytes
    if current_batch:
        batches.append(current_batch)

    total_batches = len(batches)
    base_name = OUTPUT_FILE.replace(".sql", "")

    for batch_num, batch_statements in enumerate(batches, start=1):
        if total_batches == 1:
            out_path = OUTPUT_FILE
        else:
            out_path = f"{base_name}_batch{batch_num}_of_{total_batches}.sql"

        with open(out_path, "w", encoding="utf-8") as f:

            f.write(f"-- Update harga produk affiliate_products\n")
            f.write(f"-- Batch {batch_num + 1} dari {total_batches} -- {len(batch_statements)} statement\n")
            f.write(f"-- Generated dari: {INPUT_FILE}\n\n")
            f.write("BEGIN;\n\n")
            for stmt in batch_statements:
                f.write(stmt + "\n")
            f.write("\nCOMMIT;\n")

        print(f"Disimpan: {out_path} ({len(batch_statements)} statement)")

    print(f"\nSelesai. {total_batches} file .sql siap dijalankan di Supabase SQL Editor.")
    print("Buka file-nya, copy semua isinya, paste ke SQL Editor, lalu klik Run.")
    print("Kalau ada beberapa batch, jalankan satu per satu -- jangan digabung sekaligus.")


if __name__ == "__main__":
    main()
