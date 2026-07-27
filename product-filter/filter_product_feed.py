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

# ============================================================
# KONFIGURASI -- ubah bagian ini sesuai kebutuhanmu
# ============================================================

# Path file mentah hasil download dari ACCESSTRADE.
# Bisa .csv atau .xlsx -- script ini otomatis mendeteksi dari ekstensi.
INPUT_FILE = "product_list_966_20260727.csv"

# Nama file hasil filter (akan dibuat / ditimpa).
OUTPUT_FILE = "product_list_966_20260727_FILTERED.csv"

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


def load_dataframe(path: str) -> pd.DataFrame:
    """Baca file CSV atau XLSX. Untuk CSV, dibaca per-chunk supaya hemat RAM."""
    ext = os.path.splitext(path)[1].lower()

    if ext == ".csv":
        print(f"Membaca CSV per-chunk ({CHUNK_SIZE} baris per batch)...")
        chunks = []
        for i, chunk in enumerate(pd.read_csv(path, chunksize=CHUNK_SIZE, dtype=str)):
            chunks.append(chunk)
            print(f"  chunk {i + 1} dibaca ({len(chunk)} baris)")
        df = pd.concat(chunks, ignore_index=True)

    elif ext in (".xlsx", ".xls"):
        print("Membaca file Excel (read-only mode, ini bisa makan waktu untuk file besar)...")
        df = pd.read_excel(path, dtype=str, engine="openpyxl")

    else:
        raise ValueError(f"Ekstensi file tidak didukung: {ext}")

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

    # Pastikan kolom penting ada
    required_cols = ["Merchant Product Name", "item_sold", "Sub category Name"]
    missing = [c for c in required_cols if c not in df.columns]
    if missing:
        print(f"PERINGATAN: kolom berikut tidak ditemukan di file: {missing}")
        print(f"Kolom yang tersedia: {list(df.columns)}")
        return

    # Bersihkan kolom numerik
    df["item_sold"] = clean_numeric(df["item_sold"])
    if "item_rating" in df.columns:
        df["item_rating"] = clean_numeric(df["item_rating"])

    before = len(df)

    # Filter: hanya produk yang tersedia (kalau kolom Available ada)
    if "Available" in df.columns:
        df = df[df["Available"].astype(str).str.lower().isin(["true", "1", "yes", "ya"])]

    # Filter: minimum item_sold
    df = df[df["item_sold"] >= MIN_ITEM_SOLD]

    # Filter: minimum rating (opsional)
    if MIN_RATING is not None and "item_rating" in df.columns:
        df = df[df["item_rating"] >= MIN_RATING]

    # Filter: hanya sub kategori tertentu (opsional)
    if FILTER_SUBKATEGORI:
        df = df[df["Sub category Name"].isin(FILTER_SUBKATEGORI)]

    print(f"Setelah filter dasar (available, min item_sold, dst): {len(df):,} baris "
          f"(dari {before:,} baris awal)")

    if len(df) == 0:
        print("Tidak ada baris tersisa setelah filter. Coba turunkan MIN_ITEM_SOLD "
              "atau cek nama kolom/kategori yang kamu isi di konfigurasi.")
        return

    # Ambil top-N per sub kategori, urutkan dari item_sold tertinggi lalu rating
    sort_cols = ["item_sold"]
    if "item_rating" in df.columns:
        sort_cols.append("item_rating")

    df_sorted = df.sort_values(by=sort_cols, ascending=False)
    df_top = (
        df_sorted.groupby("Sub category Name", group_keys=False)
        .head(TOP_N_PER_SUBKATEGORI)
    )

    print(f"Hasil akhir setelah ambil top {TOP_N_PER_SUBKATEGORI} per sub kategori: "
          f"{len(df_top):,} baris")

    # Ringkasan per sub kategori
    print("\nRingkasan jumlah produk per sub kategori (10 teratas):")
    print(df_top["Sub category Name"].value_counts().head(10).to_string())

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


if __name__ == "__main__":
    main()