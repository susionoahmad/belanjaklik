# Alfamind OCR & Promo Extractor (Python Module)

Folder khusus OCR berbasis Python yang didesain untuk membaca gambar produk maupun katalog flyer promo ritel (seperti **JSM Alfamart**, Indomaret, Superindo, dsb.) dan mengekstrak datanya secara otomatis ke format file **Excel (.xlsx)** yang **100% kompatibel** dengan sistem import admin Alfamind (`ExcelDriver.ts`).

---

## 📁 Struktur Folder `ocr/`

```text
ocr/
├── config.py           # Konfigurasi environment & pembacaan API Key dari .env
├── ocr_engine.py       # Engine OCR utama (Support AI Gemini Vision & Local OCR Fallback)
├── promo_parser.py     # Parser regex & rule-based (Deteksi JSM, Harga Coret, Diskon %, Ukuran, Brand)
├── excel_exporter.py   # Modul ekspor ke format Excel (.xlsx) sesuai skema ExcelDriver.ts
├── main.py             # CLI Tool untuk memproses gambar / folder gambar
├── test_demo.py        # Script pengujian otomatis & verifikasi skema Excel
└── requirements.txt    # Library Python yang dibutuhkan (openpyxl, requests, Pillow, dll)
```

---

## 🚀 Fitur Utama

1. **Dual OCR Engine**:
   - **Gemini AI Vision (Rekomendasi / Akurasi Tinggi)**: Menggunakan multimodal AI untuk membaca layout katalog promo yang kompleks (multi-produk dalam 1 lembar flyer JSM).
   - **Local OCR Engine (Tesseract / EasyOCR / PIL Fallback)**: Pemrosesan offline jika API key tidak tersedia.
2. **Deteksi Otomatis Promo JSM & Diskon**:
   - Mendeteksi jenis promo (**JSM**, **FLASHSALE**, **MEMBER**, **REGULAR**).
   - Mendeteksi **Harga Coret (Original Price)** dan **Harga Promo**.
   - Menghitung **Persentase Diskon (%)** secara otomatis.
   - Mengisi **Promo Badge** & **Judul Campaign Promo**.
   - Menguji dan mengekstrak **Brand**, **Varian**, **Ukuran Kemasan** (misal: *85g*, *1L*, *500ml*, *Pch 800ml*).
3. **Kompatibilitas Import Admin**:
   - Hasil file `.xlsx` menggunakan nama kolom standar yang langsung dapat dibaca oleh `ExcelDriver.ts` pada menu **Import Produk Admin Alfamind**:
     - `product_name`, `brand`, `variant`, `package_size`, `price`, `original_price`, `discount_percentage`, `stock_status`, `category`, `promo_type`, `promo_badge`, `promo_title`, `promo_start_date`, `promo_end_date`, `image`.

---

## 🛠️ Instalasi

1. Pastikan Python 3.10+ sudah terinstall pada sistem.
2. Buka terminal pada folder `ocr/` dan install dependensi:

```bash
pip install -r requirements.txt
```

3. (Opsional) Untuk akurasi terbaik membaca flyer JSM, pastikan `VITE_GEMINI_API_KEY` terisi di file `.env` yang berada di root project Alfamind:

```env
VITE_GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE
```

---

## 💻 Cara Penggunaan

### 1. Memproses 1 Gambar Promo / Produk

```bash
python ocr/main.py -i path/ke/gambar_promo.jpg -o hasil_ocr.xlsx
```

### 2. Memproses Seluruh Gambar dalam Satu Folder (Batch OCR)

```bash
python ocr/main.py -i path/ke/folder_gambar/ -o hasil_ocr_batch.xlsx
```

### 3. Menjalankan Demo & Testing

```bash
python ocr/test_demo.py
```

---

## 📥 Langkah Import ke Admin Alfamind

1. Jalankan script `python ocr/main.py` untuk menghasilkan file `hasil_ocr_import.xlsx`.
2. Buka aplikasi Alfamind -> Masuk ke Menu **Admin / Kelola Produk**.
3. Pilih menu **Import Produk** (Excel / CSV Import).
4. Upload file `hasil_ocr_import.xlsx`.
5. Sistem akan otomatis mendeteksi seluruh baris produk, detail promo JSM, harga coret, serta rekomendasi kategori!
