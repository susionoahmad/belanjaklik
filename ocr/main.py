import os
import sys
import argparse
from pathlib import Path
from typing import List, Dict, Any

# Ensure current directory is in sys.path
BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))

# Force UTF-8 encoding for stdout on Windows
if sys.platform.startswith("win"):
    sys.stdout.reconfigure(encoding="utf-8")

from ocr_engine import extract_ocr_from_image
from excel_exporter import export_to_excel
from config import GEMINI_API_KEY

SUPPORTED_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.webp'}

def process_images_batch(input_path: str, output_excel: str, api_key: str = "", force_local: bool = False):
    path = Path(input_path)

    if not path.exists():
        print(f"[ERROR] Path input '{input_path}' tidak ditemukan!")
        sys.exit(1)

    image_files: List[Path] = []
    if path.is_file():
        if path.suffix.lower() in SUPPORTED_EXTENSIONS:
            image_files.append(path)
        else:
            print(f"[ERROR] Format file '{path.name}' tidak didukung! Gunakan .jpg, .png, atau .webp")
            sys.exit(1)
    elif path.is_dir():
        for file in path.iterdir():
            if file.is_file() and file.suffix.lower() in SUPPORTED_EXTENSIONS:
                image_files.append(file)
        image_files.sort()

    if not image_files:
        print(f"[WARNING] Tidak ada file gambar (.jpg, .png, .webp) ditemukan di '{input_path}'!")
        sys.exit(1)

    print("=" * 70)
    print(" ALFAMIND OCR & PROMO EXTRACTOR FOR ADMIN IMPORT")
    print("=" * 70)
    print(f" Total Gambar Ditemukan : {len(image_files)}")
    print(f" Status Gemini API Key  : {'Tersedia (AI Vision Enabled)' if (api_key or GEMINI_API_KEY) and not force_local else 'Tidak Aktif (Local OCR Fallback)'}")
    print(f" Target File Excel      : {output_excel}")
    print("=" * 70)

    all_products: List[Dict[str, Any]] = []

    for idx, img_file in enumerate(image_files, 1):
        print(f"\n[{idx}/{len(image_files)}] Memproses: {img_file.name} ...")
        products = extract_ocr_from_image(str(img_file), api_key=api_key, force_local=force_local)
        all_products.extend(products)

    if not all_products:
        print("\n[WARNING] Tidak ada data produk yang berhasil diekstrak!")
        sys.exit(1)

    print("\n" + "=" * 70)
    print(f" HASIL EKSTRAKSI TOTAL: {len(all_products)} produk terdeteksi.")
    print("=" * 70)
    
    # Print sample of extracted products
    print(f"{'No':<3} | {'Nama Produk':<32} | {'Harga':<10} | {'Harga Coret':<11} | {'Promo':<6} | {'Kategori'}")
    print("-" * 75)
    for i, p in enumerate(all_products[:15], 1):
        p_name = str(p.get('product_name', ''))[:30]
        price_val = p.get('price')
        orig_val = p.get('original_price')
        price = f"Rp{price_val:,}" if isinstance(price_val, (int, float)) and price_val > 0 else "-"
        orig_price = f"Rp{orig_val:,}" if isinstance(orig_val, (int, float)) and orig_val > 0 else str(orig_val or "-")
        promo = str(p.get('promo_type', '-'))
        cat = str(p.get('category', 'Umum'))
        print(f"{i:<3} | {p_name:<32} | {price:<10} | {orig_price:<11} | {promo:<6} | {cat}")

    if len(all_products) > 15:
        print(f"... dan {len(all_products) - 15} produk lainnya.")

    # Export to Excel
    final_output_path = export_to_excel(all_products, output_excel)
    
    print("\n" + "=" * 70)
    print(" PROSES SELESAI!")
    print(f" File Excel telah dibuat: {final_output_path}")
    print(" PETUNJUK IMPORT KE ADMIN:")
    print("    1. Buka Menu Admin Alfamind -> Import Produk / Excel Import")
    print(f"    2. Upload file: {final_output_path}")
    print("    3. Sistem akan otomatis membaca seluruh produk & detail promo JSM!")
    print("=" * 70)

def main():
    parser = argparse.ArgumentParser(description="Alfamind OCR & Promo Extractor (JSM & Product Catalog to Excel)")
    parser.add_argument("-i", "--input", default=str(BASE_DIR / "sample_images"), help="Path ke file gambar atau folder gambar promo/produk.")
    parser.add_argument("-o", "--output", default=str(BASE_DIR / "hasil_ocr_import.xlsx"), help="Path target file hasil Excel (.xlsx).")
    parser.add_argument("-k", "--api-key", default="", help="Google Gemini API Key (Opsional, jika tidak diset di .env).")
    parser.add_argument("--local", action="store_true", help="Paksa gunakan Local OCR tanpa Gemini API.")

    args = parser.parse_args()

    # Create sample folder if input default folder doesn't exist
    input_dir = Path(args.input)
    if not input_dir.exists() and args.input == str(BASE_DIR / "sample_images"):
        input_dir.mkdir(parents=True, exist_ok=True)
        print(f"[INFO] Folder '{input_dir}' dibuat. Masukkan gambar promo/produk ke folder tersebut.")

    process_images_batch(args.input, args.output, api_key=args.api_key, force_local=args.local)

if __name__ == "__main__":
    main()
