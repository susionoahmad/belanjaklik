"""
filter_product_feed.py

Tujuan:
Mengambil file Product Feed / Datafeed ACCESSTRADE yang isinya ratusan ribu
baris (misal 665.000 produk kategori "All Beauty & Health"), lalu memotongnya
jadi daftar produk terbaik saja -- siap diimport ke admin panel BelanjaKlik.

Kenapa perlu ini:
- Supabase free tier cuma 500 MB database, mengimport 665rb baris mentah
  hampir pasti nabrak limit itu.
- Kebanyakan dari 665rb produk itu tidak laku (item_sold rendah/kosong),
  jadi memang tidak layak dipromosikan.

Cara pakai:
1. Pastikan sudah install dependency:
     pip install pandas openpyxl --break-system-packages
2. Ubah variabel di bagian KONFIGURASI di bawah sesuai kebutuhanmu.
3. Jalankan:
     python filter_product_feed.py

Output:
File CSV baru berisi produk-produk terbaik saja, dengan kolom yang sudah
disederhanakan supaya gampang dipetakan ke tabel `affiliate_products`.
"""

import pandas as pd
import os
import re
import html
import json
import urllib.request
import urllib.parse
from datetime import datetime, timezone

def load_env_file():
    """Membaca file .env jika ada untuk mendapatkan kredensial Supabase secara otomatis."""
    env_path = os.path.join(os.path.dirname(__file__), "..", ".env")
    if os.path.exists(env_path):
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, val = line.split("=", 1)
                    os.environ[key.strip()] = val.strip()

load_env_file()

# ============================================================
# KONFIGURASI -- ubah bagian ini sesuai kebutuhanmu
# ============================================================

# Path file mentah hasil download dari ACCESSTRADE.
# Bisa .csv atau .xlsx -- script ini otomatis mendeteksi dari ekstensi.
INPUT_FILE = "product_list_966_20260727.csv"

# Nama file hasil filter (akan dibuat / ditimpa).
OUTPUT_FILE = "product_list_966_20260727_FILTERED.csv"

# Set True jika ingin hasil saringan LANGSUNG diupload ke Supabase!
AUTO_UPLOAD_TO_SUPABASE = True

# Supabase Credentials (otomatis dibaca dari file .env)
SUPABASE_URL = os.getenv("VITE_SUPABASE_URL") or os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("VITE_SUPABASE_ANON_KEY") or os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY")

# Ambil berapa produk terbaik PER SUB KATEGORI.
# Kenapa per sub kategori (bukan top N dari total): supaya variasi produk
# tetap luas -- misal "Skincare", "Haircare", "Personal Care" masing-masing
# tetap kebagian slot, bukan didominasi 1 sub kategori yang paling ramai.
TOP_N_PER_SUBKATEGORI = 10

# Minimum jumlah terjual supaya produk dianggap layak dipromosikan.
# Naikkan angka ini kalau hasil akhir masih terlalu banyak.
MIN_ITEM_SOLD = 10

# Minimum rating (skala umumnya 0-5). Set None kalau tidak mau filter rating
# (berguna kalau banyak produk bagus tapi rating-nya kosong/belum ada).
MIN_RATING = 3

# Kalau mau batasi hanya sub kategori tertentu saja, isi daftar di bawah
# (harus persis sama dengan isi kolom "Sub category Name" di file aslinya).
# Kosongkan list ini ( [] ) kalau mau proses semua sub kategori.
FILTER_SUBKATEGORI = []

# Ukuran chunk saat membaca file CSV besar (tidak dipakai untuk .xlsx).
CHUNK_SIZE = 50_000

# ============================================================
# Kolom yang dipakai & disederhanakan namanya untuk output akhir.
# Sesuaikan mapping ini kalau nama kolom asli di file kamu sedikit beda.
# ============================================================
COLUMN_MAPPING = {
    "Merchant Product ID": "external_product_id",
    "Merchant Product Name": "name",
    "Image URL": "image_url",
    "Product URL Web (encoded)": "product_url",
    "Description": "description",
    "Price": "price",
    "Discounted Price": "discounted_price",
    "Available": "available",
    "Category Name": "category",
    "Sub category Name": "sub_category",
    "Brand": "brand",
    "item_sold": "item_sold",
    "item_rating": "item_rating",
}


# Urutan indeks kolom standar jika file CSV Accesstrade tidak memiliki baris header
STANDARD_ACCESSTRADE_COLUMNS = [
    "Merchant Product ID",          # 0
    "Merchant Product Name",        # 1
    "Image URL",                   # 2
    "Image URL Additional",        # 3
    "Product URL Web (encoded)",   # 4
    "Product URL Mobile (encoded)", # 5
    "Description",                 # 6
    "Price",                       # 7
    "Discounted Price",            # 8
    "Available",                   # 9
    "Master Product ID",           # 10
    "Master Product Name",         # 11
    "Master Image URL",            # 12
    "Category Name",               # 13
    "Sub category ID",             # 14
    "Sub category Name",           # 15
    "Category Detail ID",          # 16
    "Category Detail Name",        # 17
    "Currency",                    # 18
    "Brand",                       # 19
    "item_sold",                   # 20
    "item_rating",                 # 21
]


def load_dataframe(path: str) -> pd.DataFrame:
    """Baca file CSV atau XLSX. Otomatis mendeteksi CSV tanpa header & memetakan kolom."""
    ext = os.path.splitext(path)[1].lower()

    if ext == ".csv":
        has_header = True
        with open(path, "r", encoding="utf-8", errors="ignore") as f:
            first_line = f.readline().lower()

        # Deteksi jika baris pertama adalah data mentah (bukan nama kolom)
        if not ("merchant product name" in first_line or "product_url" in first_line or "name" in first_line or "sub category name" in first_line):
            has_header = False

        mode_text = "[Header Terdeteksi]" if has_header else "[Tanpa Header - Auto Index Mapping]"
        print(f"Membaca CSV per-chunk ({CHUNK_SIZE:,} baris per batch)... {mode_text}")

        header_opt = 0 if has_header else None
        chunks = []

        for i, chunk in enumerate(pd.read_csv(path, chunksize=CHUNK_SIZE, dtype=str, header=header_opt, encoding="utf-8-sig", on_bad_lines="skip")):
            if not has_header:
                # Petakan kolom berdasarkan nomor indeks standar Accesstrade Feed
                col_rename = {}
                for idx, col_name in enumerate(STANDARD_ACCESSTRADE_COLUMNS):
                    if idx < len(chunk.columns):
                        col_rename[chunk.columns[idx]] = col_name
                chunk = chunk.rename(columns=col_rename)

            chunks.append(chunk)
            print(f"  chunk {i + 1} dibaca ({len(chunk):,} baris)")

        df = pd.concat(chunks, ignore_index=True)

    elif ext in (".xlsx", ".xls"):
        print("Membaca file Excel (read-only mode)...")
        df = pd.read_excel(path, dtype=str, engine="openpyxl")

    else:
        raise ValueError(f"Ekstensi file tidak didukung: {ext}")

    # Bersihkan nama kolom dari BOM (\ufeff) atau spasi liar
    df.columns = [str(col).replace('\ufeff', '').strip() for col in df.columns]

    print(f"Total baris terbaca: {len(df):,}")
    return df


def clean_numeric(series: pd.Series) -> pd.Series:
    """Bersihkan kolom angka yang mungkin berupa teks (mis. ada koma/spasi)."""
    return pd.to_numeric(series, errors="coerce").fillna(0)


def clean_name(title: str) -> str:
    """Membersihkan judul produk dari bracket tags, keyword stuffing Shopee, dan duplikasi slash."""
    if not isinstance(title, str) or not title.strip():
        return ""
    
    # 1. Hapus tag bracket diawal, misal: [Tone Up 00-01-02-03], [3PCS], [BPOM], [BUY 1 GET 1]
    title = re.sub(r'^(\[[^\]]+\]\s*)+', '', title, flags=re.IGNORECASE)
    
    # 2. Pisahkan berdasarkan pipe '|' (kalimat utama Shopee ada di segment pertama)
    parts = [p.strip() for p in title.split('|') if p.strip()]
    if parts:
        title = parts[0]
        
    # 3. Pisahkan jika ada duplikasi slash ' / ' berulang
    slash_parts = [p.strip() for p in title.split(' / ') if p.strip()]
    if len(slash_parts) > 1 and len(slash_parts[0]) >= 15:
        title = slash_parts[0]
        
    # 4. Rapikan spasi
    title = re.sub(r'\s+', ' ', title).strip()

    # 5. Potong judul jika masih lebih dari 90 karakter agar ringkas & ramah SEO
    if len(title) > 90:
        title = title[:90].rsplit(' ', 1)[0].strip()

    return title


def clean_description(text: str) -> str:
    """Membersihkan deskripsi produk dari HTML mentah, emoji, dan teks promosi toko/order."""
    if not isinstance(text, str) or not text.strip():
        return ""
    
    # Replace HTML break & line closing tags with newlines
    text = re.sub(r'<br\s*/?>|</p>|</div>', '\n', text, flags=re.IGNORECASE)
    # Remove all other HTML tags
    text = re.sub(r'<[^>]+>', '', text)
    # Unescape HTML entities (&amp;, &nbsp;, etc)
    text = html.unescape(text)
    
    lines = text.split('\n')
    cleaned_lines = []
    
    for line in lines:
        l = line.strip()
        if not l:
            continue
        # Skip hashtags
        if re.search(r'#(?:[a-zA-Z0-9_]+)', l):
            continue
        # Skip promo instructions & reseller disclaimers
        if re.search(r'(unboxing|reseller|order sekarang|buka toko|jam operasional|syarat & ketentuan|disclaimer|wajib video|garansi retur|pembelian grosir)', l, re.IGNORECASE):
            continue
        cleaned_lines.append(l)
        
    res = '\n'.join(cleaned_lines)
    # Reduce multiple empty newlines
    res = re.sub(r'\n{3,}', '\n\n', res).strip()
    return res


def main():
    if not os.path.exists(INPUT_FILE):
        print(f"File tidak ditemukan: {INPUT_FILE}")
        print("Pastikan INPUT_FILE di bagian KONFIGURASI sudah sesuai nama/path filenya.")
        return

    df = load_dataframe(INPUT_FILE)

    # Pastikan kolom penting nama produk ada
    if "Merchant Product Name" not in df.columns:
        print(f"PERINGATAN: Kolom 'Merchant Product Name' tidak ditemukan di file!")
        print(f"Kolom yang tersedia: {list(df.columns)}")
        return

    sub_cat_col = "Sub category Name" if "Sub category Name" in df.columns else ("Category Name" if "Category Name" in df.columns else None)
    if not sub_cat_col:
        print("PERINGATAN: Kolom kategori atau sub-kategori tidak ditemukan!")
        return

    has_item_sold = "item_sold" in df.columns
    if has_item_sold:
        df["item_sold"] = clean_numeric(df["item_sold"])
    else:
        df["item_sold"] = 0

    if "item_rating" in df.columns:
        df["item_rating"] = clean_numeric(df["item_rating"])

    before = len(df)

    # Filter: hanya produk yang tersedia (kalau kolom Available ada)
    if "Available" in df.columns:
        df = df[df["Available"].astype(str).str.lower().isin(["true", "1", "yes", "ya"])]

    # Filter: minimum item_sold (hanya jika file memiliki kolom item_sold)
    if has_item_sold and MIN_ITEM_SOLD > 0:
        df = df[df["item_sold"] >= MIN_ITEM_SOLD]

    # Filter: minimum rating (opsional)
    if MIN_RATING is not None and "item_rating" in df.columns:
        df = df[df["item_rating"] >= MIN_RATING]

    # Filter: hanya sub kategori tertentu (opsional)
    if FILTER_SUBKATEGORI:
        df = df[df[sub_cat_col].isin(FILTER_SUBKATEGORI)]

    print(f"Setelah filter dasar: {len(df):,} baris (dari {before:,} baris awal)")

    if len(df) == 0:
        print("Tidak ada baris tersisa setelah filter. Coba turunkan MIN_ITEM_SOLD "
              "atau cek nama kolom/kategori yang kamu isi di konfigurasi.")
        return

    # Ambil top-N per sub kategori
    if has_item_sold:
        sort_cols = ["item_sold"]
        if "item_rating" in df.columns:
            sort_cols.append("item_rating")
        df_sorted = df.sort_values(by=sort_cols, ascending=False)
    else:
        df_sorted = df

    df_top = (
        df_sorted.groupby(sub_cat_col, group_keys=False)
        .head(TOP_N_PER_SUBKATEGORI)
    )

    print(f"Hasil akhir setelah ambil top {TOP_N_PER_SUBKATEGORI} per sub kategori: "
          f"{len(df_top):,} baris")

    # Ringkasan per sub kategori
    print("\nRingkasan jumlah produk per sub kategori (10 teratas):")
    print(df_top[sub_cat_col].value_counts().head(10).to_string())

    # Sederhanakan kolom untuk output
    available_mapping = {k: v for k, v in COLUMN_MAPPING.items() if k in df_top.columns}
    df_output = df_top[list(available_mapping.keys())].rename(columns=available_mapping)

    # Bersihkan nama, deskripsi, dan format item_sold
    if "name" in df_output.columns:
        print("Pembersihan judul produk (menghapus tag bracket & keyword stuffing)...")
        df_output["name"] = df_output["name"].apply(clean_name)

    if "description" in df_output.columns:
        print("Pembersihan deskripsi (menghapus HTML mentah & disclaimer toko)...")
        df_output["description"] = df_output["description"].apply(clean_description)

    if "item_sold" in df_output.columns:
        df_output["item_sold"] = df_output["item_sold"].apply(
            lambda x: int(float(x)) if pd.notnull(x) and str(x).replace('.', '', 1).isdigit() else 0
        )

    try:
        df_output.to_csv(OUTPUT_FILE, index=False, encoding="utf-8-sig")
        final_path = OUTPUT_FILE
    except PermissionError:
        fallback_file = OUTPUT_FILE.replace(".csv", "_CLEAN.csv")
        print(f"PERINGATAN: File {OUTPUT_FILE} sedang dibuka program lain (Excel). Menyimpan ke {fallback_file}...")
        df_output.to_csv(fallback_file, index=False, encoding="utf-8-sig")
        final_path = fallback_file

    print(f"\nSelesai. File hasil filter disimpan di: {final_path}")
    print(f"Ukuran akhir: {len(df_output):,} baris -- jauh lebih aman untuk diimport ke Supabase.")

    if AUTO_UPLOAD_TO_SUPABASE:
        upload_to_supabase(df_output, SUPABASE_URL, SUPABASE_KEY)


import hashlib

def generate_slug(name: str, ext_id: str, merchant: str = "shopee") -> str:
    s = re.sub(r'[^a-zA-Z0-9\s-]', '', name.lower())
    s = re.sub(r'\s+', '-', s).strip('-')
    if not s:
        s = 'produk-afiliasi'
    clean_id = re.sub(r'[^a-zA-Z0-9]', '', str(ext_id)).strip()
    if len(clean_id) > 12:
        clean_id = clean_id[-12:]
    merch_tag = (merchant[:2] if merchant else "sp").lower()
    return f"{s[:45]}-{merch_tag}-{clean_id}"


def fetch_existing_products_map(supabase_url: str, supabase_key: str):
    """Mengambil peta ID produk yang sudah ada di Supabase berdasarkan product_url & external_product_id."""
    existing_map = {}
    headers = {
        "apikey": supabase_key,
        "Authorization": f"Bearer {supabase_key}"
    }

    try:
        page = 0
        while True:
            endpoint = f"{supabase_url.rstrip('/')}/rest/v1/affiliate_products?select=id,product_url,external_product_id,merchant,slug&limit=1000&offset={page*1000}"
            req = urllib.request.Request(endpoint, headers=headers, method='GET')
            with urllib.request.urlopen(req) as resp:
                rows = json.loads(resp.read().decode('utf-8'))
                if not rows:
                    break
                for r in rows:
                    p_url = str(r.get("product_url") or "").strip().lower()
                    raw_ext = str(r.get("external_product_id") or "").replace('\ufeff', '').strip().lower()
                    if p_url:
                        existing_map[p_url] = r
                    if raw_ext and raw_ext != "null" and raw_ext != "nan":
                        existing_map[raw_ext] = r
                page += 1
    except Exception as e:
        print(f"  ℹ Membaca data eksisting Supabase: {e}")

    return existing_map


def upload_to_supabase(df: pd.DataFrame, supabase_url: str, supabase_key: str):
    """Mengunggah data hasil saringan langsung ke tabel affiliate_products di Supabase."""
    if not supabase_url or not supabase_key:
        print("\n❌ [ERROR] Kredensial Supabase tidak ditemukan!")
        print("   Pastikan file .env berisi VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY.")
        return

    print(f"\n============================================================")
    print(f"Mengunggah {len(df):,} produk ke Supabase ({supabase_url})...")
    print(f"============================================================")

    # Ambil pemetaan data eksisting dari Supabase agar produk dengan product_url/ID yang sama ter-UPDATE di tempat
    print("Membaca data produk eksisting di Supabase untuk pencocokan URL & ID...")
    existing_map = fetch_existing_products_map(supabase_url, supabase_key)
    print(f"Ditemukan {len(existing_map):,} URL/ID produk eksisting di Supabase.")

    endpoint = f"{supabase_url.rstrip('/')}/rest/v1/affiliate_products?on_conflict=id"
    headers = {
        "apikey": supabase_key,
        "Authorization": f"Bearer {supabase_key}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates"
    }

    raw_records = []
    now_iso = datetime.now(timezone.utc).isoformat()
    updated_count = 0
    new_count = 0

    for idx, row in df.iterrows():
        raw_name = str(row.get("name", "")).strip()
        name = clean_name(raw_name)
        if not name:
            continue

        product_url = str(row.get("product_url", "")).strip()
        raw_ext_id = str(row.get("external_product_id", "")).replace('\ufeff', '').strip()

        if not raw_ext_id or raw_ext_id.lower() == "nan":
            if product_url and product_url.lower() != "nan":
                h = hashlib.md5(product_url.encode('utf-8')).hexdigest()[:12]
                ext_id = f"url_{h}"
            else:
                h = hashlib.md5(f"{name}_{idx}".encode('utf-8')).hexdigest()[:12]
                ext_id = f"prod_{h}"
        else:
            ext_id = raw_ext_id

        def parse_num(v):
            try:
                val = float(str(v).replace(',', ''))
                return val if not pd.isna(val) else 0.0
            except:
                return 0.0

        normal_price = parse_num(row.get("price"))
        promo_price = parse_num(row.get("discounted_price"))

        final_price = promo_price if promo_price > 0 else normal_price
        orig_price = normal_price if normal_price > final_price else None

        disc_percent = None
        if orig_price and final_price and orig_price > final_price:
            disc_percent = round(((orig_price - final_price) / orig_price) * 100)

        item_sold = int(parse_num(row.get("item_sold")))
        item_rating = parse_num(row.get("item_rating"))

        desc = clean_description(str(row.get("description", "")))
        cat = str(row.get("sub_category") or row.get("category") or "").strip()
        brand = str(row.get("brand", "")).strip()
        img_url = str(row.get("image_url", "")).strip()

        url_lower = product_url.lower()
        if "shopee" in url_lower:
            detected_merchant = "shopee"
        elif "tokopedia" in url_lower or "tokope" in url_lower:
            detected_merchant = "tokopedia"
        elif "lazada" in url_lower:
            detected_merchant = "lazada"
        else:
            detected_merchant = "accesstrade"

        record = {
            "source": "accesstrade",
            "merchant": detected_merchant,
            "campaign_id": "direct_csv",
            "external_product_id": ext_id,
            "name": name,
            "slug": generate_slug(name, ext_id, detected_merchant),
            "description": desc if desc and desc.lower() != "nan" else None,
            "image_url": img_url if img_url and img_url.lower() != "nan" else None,
            "product_url": product_url if product_url and product_url.lower() != "nan" else None,
            "affiliate_url": product_url if product_url and product_url.lower() != "nan" else None,
            "price": final_price,
            "original_price": orig_price,
            "discount_percent": disc_percent,
            "shop_name": brand if brand and brand.lower() != "nan" else None,
            "category": cat if cat and cat.lower() != "nan" else None,
            "is_active": True,
            "raw_data": {
                "item_sold": item_sold,
                "item_rating": item_rating if item_rating > 0 else None
            },
            "last_synced_at": now_iso
        }

        # Pencocokan Produk Eksisting Berdasarkan product_url & external_product_id
        url_key = product_url.strip().lower()
        ext_key = ext_id.replace('\ufeff', '').strip().lower()
        matched = existing_map.get(url_key) or existing_map.get(ext_key)

        if matched:
            record["id"] = matched["id"]
            if matched.get("slug"):
                record["slug"] = matched["slug"]
            updated_count += 1
        else:
            record["id"] = None
            new_count += 1

        raw_records.append(record)

    # Deduplikasi record berdasarkan (merchant, campaign_id, external_product_id) & slug unik
    seen_keys = set()
    seen_slugs = set()
    records = []

    for rec in raw_records:
        key = (rec["merchant"], rec["campaign_id"], rec["external_product_id"])
        if key in seen_keys:
            continue

        base_slug = rec["slug"]
        slug_candidate = base_slug
        counter = 1
        while slug_candidate in seen_slugs:
            slug_candidate = f"{base_slug[:45]}-{counter}"
            counter += 1

        rec["slug"] = slug_candidate
        seen_keys.add(key)
        seen_slugs.add(rec["slug"])
        records.append(rec)

    records_to_update = [dict(r) for r in records if r.get("id")]
    records_to_insert = [dict(r) for r in records if not r.get("id")]

    # Hapus key 'id' dari records_to_insert agar PostgreSQL gen_random_uuid() bekerja sempurna
    for r in records_to_insert:
        r.pop("id", None)

    batch_size = 500
    total_uploaded = 0

    # 1. Upload/Update Batch untuk Produk Eksisting (on_conflict=id)
    if records_to_update:
        print(f"\n[1/2] Meng-update {len(records_to_update):,} produk eksisting di Supabase...")
        endpoint_update = f"{supabase_url.rstrip('/')}/rest/v1/affiliate_products?on_conflict=id"
        headers_update = {
            "apikey": supabase_key,
            "Authorization": f"Bearer {supabase_key}",
            "Content-Type": "application/json",
            "Prefer": "resolution=merge-duplicates"
        }
        for i in range(0, len(records_to_update), batch_size):
            batch = records_to_update[i:i + batch_size]
            data_json = json.dumps(batch).encode('utf-8')
            req = urllib.request.Request(endpoint_update, data=data_json, headers=headers_update, method='POST')
            try:
                with urllib.request.urlopen(req) as resp:
                    if resp.status in (200, 201, 204):
                        total_uploaded += len(batch)
                        print(f"  [OK] Update Batch {i // batch_size + 1} ({len(batch)} produk) berhasil...")
            except urllib.error.HTTPError as e:
                err_body = e.read().decode('utf-8', errors='ignore')
                print(f"  [FAIL] HTTP Error Update {e.code}: {err_body}")
            except Exception as e:
                print(f"  [FAIL] Error update batch: {e}")

    # 2. Upload/Insert Batch untuk Produk Baru (on_conflict=merchant,campaign_id,external_product_id)
    if records_to_insert:
        print(f"\n[2/2] Meng-insert {len(records_to_insert):,} produk baru ke Supabase...")
        endpoint_insert = f"{supabase_url.rstrip('/')}/rest/v1/affiliate_products?on_conflict=merchant,campaign_id,external_product_id"
        headers_insert = {
            "apikey": supabase_key,
            "Authorization": f"Bearer {supabase_key}",
            "Content-Type": "application/json",
            "Prefer": "resolution=merge-duplicates"
        }
        for i in range(0, len(records_to_insert), batch_size):
            batch = records_to_insert[i:i + batch_size]
            data_json = json.dumps(batch).encode('utf-8')
            req = urllib.request.Request(endpoint_insert, data=data_json, headers=headers_insert, method='POST')
            try:
                with urllib.request.urlopen(req) as resp:
                    if resp.status in (200, 201, 204):
                        total_uploaded += len(batch)
                        print(f"  [OK] Insert Batch {i // batch_size + 1} ({len(batch)} produk) berhasil...")
            except urllib.error.HTTPError as e:
                err_body = e.read().decode('utf-8', errors='ignore')
                print(f"  [FAIL] HTTP Error Insert {e.code}: {err_body}")
            except Exception as e:
                print(f"  [FAIL] Error insert batch: {e}")

    print(f"\nSelesai! Total {total_uploaded:,} produk berhasil diproses ke Supabase.")


if __name__ == "__main__":
    main()