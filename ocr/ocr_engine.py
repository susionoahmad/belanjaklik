import os
import re
import json
import base64
import requests
import numpy as np
from typing import List, Dict, Any
from pathlib import Path
from PIL import Image

from config import GEMINI_API_KEY
from promo_parser import normalize_product_dict, detect_jsm_promo, extract_brand, extract_package_size, clean_price, clean_product_name

PLACEHOLDER_KEYS = {
    "DUMMY_GEMINI_API_KEY",
    "YOUR_GEMINI_API_KEY",
    "PLACEHOLDER"
}

def is_valid_gemini_key(key: str) -> bool:
    if not key or key.strip() in PLACEHOLDER_KEYS:
        return False
    return len(key) > 20 and not key.startswith("YOUR_")

def encode_image_to_base64(image_path: str) -> tuple[str, str]:
    """Reads image file and returns (base64_string, mime_type)."""
    path = Path(image_path)
    if not path.exists():
        raise FileNotFoundError(f"File gambar tidak ditemukan: {image_path}")

    ext = path.suffix.lower()
    if ext in ['.jpg', '.jpeg']:
        mime_type = 'image/jpeg'
    elif ext == '.png':
        mime_type = 'image/png'
    elif ext == '.webp':
        mime_type = 'image/webp'
    else:
        mime_type = 'image/jpeg'

    with open(path, 'rb') as f:
        encoded = base64.b64encode(f.read()).decode('utf-8')
    
    return encoded, mime_type


def process_with_gemini_vision(image_path: str, api_key: str = "") -> List[Dict[str, Any]]:
    """
    Extracts structured product & promo data from images using Google Gemini Vision REST API.
    Supports single product images as well as complex Promo Flyers (JSM Alfamart, Indomaret, dsb.)
    """
    key = api_key or GEMINI_API_KEY
    filename = Path(image_path).name
    is_jsm_flyer = any(kw in filename.lower() for kw in ["jsm", "gantung", "gajian", "flyer", "katalog"])

    if not is_valid_gemini_key(key):
        print("[INFO] Gemini API Key tidak ditemukan atau masih berupa placeholder. Gunakan Local OCR Engine...")
        return process_with_local_ocr(image_path)

    base64_data, mime_type = encode_image_to_base64(image_path)

    prompt = """
    Kamu adalah sistem AI OCR khusus e-commerce dan katalog promo ritel Indonesia (seperti Alfamart JSM, Indomaret, Superindo).
    Tugasmu adalah menganalisis gambar ini (bisa berupa foto produk individual maupun brosur/flyer katalog promo JSM) dan mengekstrak SELURUH produk yang ada di dalamnya (sampai 16 produk jika berupa flyer grid 4x4).

    Format keluaran HARUS berupa JSON array murni tanpa markdown formatting (tanpa ```json ... ```), contoh:
    [
      {
        "product_name": "INDOMIE Goreng Spesial 85g",
        "brand": "Indomie",
        "variant": "Goreng Spesial",
        "package_size": "85g",
        "price": 3100,
        "original_price": 3500,
        "discount_percentage": 11,
        "stock_status": "Tersedia",
        "category": "Promo Merchant",
        "promo_type": "JSM",
        "promo_badge": "PROMO JSM (3 HARI)",
        "promo_title": "Promo JSM Alfamart Spesial Weekend",
        "promo_start_date": "2026-07-24",
        "promo_end_date": "2026-07-26",
        "image": ""
      }
    ]

    Petunjuk Ekstraksi:
    1. 'product_name': Nama lengkap produk berserta merek dan ukurannya jika ada.
    2. 'brand': Merek utama (contoh: Indomie, Bimoli, Sania, Ultra Milk, Biore, Lifebuoy, dll).
    3. 'variant': Varian rasa/jenis (contoh: Goreng Spesial, Chocolate, Lemon, Pouch 800ml).
    4. 'package_size': Ukuran/kemasan (contoh: 85g, 1L, 500ml, 800ml, 3x20g).
    5. 'price': Harga promo / harga jual saat ini (angka murni tanpa Rp/titik).
    6. 'original_price': Harga coret / harga asli sebelum diskon (jika ada, angka murni).
    7. 'discount_percentage': Persentase diskon (contoh: 15 untuk 15%).
    8. 'stock_status': 'Tersedia' atau 'Habis'.
    9. 'category': Kategori produk resmi Alfamart (contoh: Promo Merchant, Alfamart (Sembako), Makanan & Minuman).
    10. 'promo_type': 'GANTUNG' (jika promo gantung / gajian untung / gajian hemat), 'JSM' (jika promo Jumat Sabtu Minggu / weekend), 'FLASHSALE', 'MEMBER', 'SUPER_SAVER', atau 'REGULAR'.
    11. 'promo_badge': Badge/label promo (contoh: 'PROMO JSM (3 HARI)', 'Diskon Spesial', 'Hemat Minggu Ini').
    12. 'promo_title': Judul campaign promo katalog.
    13. 'promo_start_date' & 'promo_end_date': Tanggal promo jika terdeteksi pada header flyer.
    14. 'image': Path nama file gambar (dapat diisi dengan: """ + filename + """).
    """

    models_to_try = [
        "gemini-1.5-flash",
        "gemini-2.0-flash",
        "gemini-2.0-flash-exp"
    ]

    headers = {"Content-Type": "application/json"}
    payload = {
        "contents": [{
            "parts": [
                {"text": prompt},
                {
                    "inline_data": {
                        "mime_type": mime_type,
                        "data": base64_data
                    }
                }
            ]
        }],
        "generationConfig": {
            "temperature": 0.1,
            "topP": 0.95,
            "maxOutputTokens": 4096
        }
    }

    for model_name in models_to_try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={key}"
        print(f"[OCR-Gemini] Memproses gambar dengan {model_name}: {filename}...")
        try:
            response = requests.post(url, headers=headers, json=payload, timeout=30)
            if response.status_code == 200:
                res_data = response.json()
                candidates = res_data.get("candidates", [])
                if candidates:
                    text_out = candidates[0]["content"]["parts"][0]["text"].strip()
                    if text_out.startswith("```"):
                        text_out = text_out.split("\n", 1)[1]
                        if text_out.endswith("```"):
                            text_out = text_out.rsplit("```", 1)[0]

                    parsed_json = json.loads(text_out.strip())
                    if isinstance(parsed_json, dict):
                        parsed_json = [parsed_json]

                    normalized_results = []
                    for raw_item in parsed_json:
                        if not raw_item.get("image"):
                            raw_item["image"] = image_path
                        norm = normalize_product_dict(raw_item, global_jsm=is_jsm_flyer)
                        if norm["product_name"]:
                            normalized_results.append(norm)

                    print(f"[OCR-Gemini] Berhasil mendeteksi {len(normalized_results)} produk dari {filename}.")
                    return normalized_results
        except Exception as e:
            print(f"[OCR-Gemini WARNING] Gagal pada {model_name}: {e}")

    print("[OCR-Gemini] Beralih ke Local OCR Engine...")
    return process_with_local_ocr(image_path)


def crop_grid_product_cards(image_path: str) -> List[tuple[str, Image.Image]]:
    """
    Dynamically splits image into product cards:
    - 4x4 Grid (16 Cards) for Flyer images (e.g. JSM6.jpeg) with header (14%) & footer (7%) offsets
    - 2x2 Grid (4 Cards) for Mobile App Screenshot images (e.g. beras3.jpeg)
    """
    output_crops = []
    filename = Path(image_path).name.lower()
    is_flyer = any(kw in filename for kw in ["jsm", "gantung", "gajian", "flyer", "katalog", "promo"])

    try:
        with Image.open(image_path) as img:
            w, h = img.size
            
            if is_flyer or (w > 600 and h > 1000):
                # Precision Grid Segmentation for Catalog Flyers
                if "gantung4" in filename.lower():
                    top_header_h = int(h * 0.105)
                    bottom_footer_h = int(h * 0.938)
                    grid_h = bottom_footer_h - top_header_h
                    row_h = grid_h / 4
                    row_specs = [2, 3, 2, 3]
                    count = 0
                    for r, num_cols in enumerate(row_specs):
                        y1 = top_header_h + int(r * row_h)
                        y2 = top_header_h + int((r + 1) * row_h)
                        card_w = w / num_cols
                        for c in range(num_cols):
                            count += 1
                            x1 = int(c * card_w)
                            x2 = int((c + 1) * card_w)
                            cropped = img.crop((x1, y1, x2, y2))
                            output_crops.append((f"F_{count:02d}", cropped))
                elif "gantung5" in filename.lower():
                    top_header_h = int(h * 0.105)
                    bottom_footer_h = int(h * 0.938)
                    grid_h = bottom_footer_h - top_header_h
                    row_h = grid_h / 4
                    row_specs = [2, 3, 3, 3]
                    count = 0
                    for r, num_cols in enumerate(row_specs):
                        y1 = top_header_h + int(r * row_h)
                        y2 = top_header_h + int((r + 1) * row_h)
                        card_w = w / num_cols
                        for c in range(num_cols):
                            count += 1
                            x1 = int(c * card_w)
                            x2 = int((c + 1) * card_w)
                            cropped = img.crop((x1, y1, x2, y2))
                            output_crops.append((f"F_{count:02d}", cropped))
                elif "3col" in filename.lower() or "gantung1" in filename.lower():
                    num_cols = 3
                    top_header_h = int(h * 0.105)
                    bottom_footer_h = int(h * 0.938)
                    grid_h = bottom_footer_h - top_header_h
                    num_rows = 4
                    card_w = w / num_cols
                    card_h = grid_h / num_rows

                    count = 0
                    for r in range(num_rows):
                        for c in range(num_cols):
                            count += 1
                            x1 = int(c * card_w)
                            y1 = top_header_h + int(r * card_h)
                            x2 = int((c + 1) * card_w)
                            y2 = top_header_h + int((r + 1) * card_h)
                            cropped = img.crop((x1, y1, x2, y2))
                            output_crops.append((f"F_{count:02d}", cropped))
                else:
                    num_cols = 4
                    top_header_h = int(h * 0.105) if ("gantung" in filename.lower() or "gajian" in filename.lower()) else int(h * 0.14)
                    bottom_footer_h = int(h * 0.938) if ("gantung" in filename.lower() or "gajian" in filename.lower()) else int(h * 0.93)
                    grid_h = bottom_footer_h - top_header_h
                    num_rows = 4
                    card_w = w / num_cols
                    card_h = grid_h / num_rows

                    count = 0
                    for r in range(num_rows):
                        for c in range(num_cols):
                            count += 1
                            x1 = int(c * card_w)
                            y1 = top_header_h + int(r * card_h)
                            x2 = int((c + 1) * card_w)
                            y2 = top_header_h + int((r + 1) * card_h)
                            cropped = img.crop((x1, y1, x2, y2))
                            output_crops.append((f"F_{count:02d}", cropped))
            elif w > 300 and h > 400:
                top_offset = int(h * 0.02)
                bottom_offset = int(h * 0.95)
                active_h = bottom_offset - top_offset
                
                half_w = w // 2
                mid_h = top_offset + (active_h // 2)

                boxes = {
                    'TL': (int(w * 0.03), top_offset, half_w - int(w * 0.01), mid_h),
                    'TR': (half_w + int(w * 0.01), top_offset, int(w * 0.97), mid_h),
                    'BL': (int(w * 0.03), mid_h, half_w - int(w * 0.01), bottom_offset),
                    'BR': (half_w + int(w * 0.01), mid_h, int(w * 0.97), bottom_offset)
                }

                for pos, box in boxes.items():
                    cropped = img.crop(box)
                    output_crops.append((pos, cropped))
            else:
                output_crops.append(('FULL', img.copy()))
    except Exception as e:
        print(f"[OCR-Crop] Notice cropping image: {e}")
        output_crops.append(('FULL', Image.open(image_path)))
    return output_crops


def extract_pure_product_pack(pil_img: Image.Image, pos: str) -> Image.Image:
    """
    Extracts purely the physical product pack photo using color saturation & tight bounding box isolation.
    Eliminates all UI buttons (+ Keranjang), prices, and text.
    Scales up the product pack photo to fill 95% of the 400x400 px white canvas.
    """
    img = pil_img.convert('RGB')
    w, h = img.size

    if pos.startswith("F_"):
        sub_crop = img.crop((int(w * 0.04), int(h * 0.02), int(w * 0.96), int(h * 0.58)))
    elif pos in ['TL', 'TR']:
        sub_crop = img.crop((int(w * 0.04), int(h * 0.02), int(w * 0.96), int(h * 0.52)))
    else:
        sub_crop = img.crop((int(w * 0.04), int(h * 0.22), int(w * 0.96), int(h * 0.68)))

    arr = np.array(sub_crop)
    r, g, b = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2]
    
    saturation = np.maximum(r, np.maximum(g, b)).astype(int) - np.minimum(r, np.minimum(g, b)).astype(int)
    is_dark = (r < 225) | (g < 225) | (b < 225)
    is_product = (saturation > 14) | is_dark

    if np.any(is_product):
        rows = np.any(is_product, axis=1)
        cols = np.any(is_product, axis=0)
        ymin, ymax = np.where(rows)[0][[0, -1]]
        xmin, xmax = np.where(cols)[0][[0, -1]]

        pack_only = sub_crop.crop((xmin, ymin, xmax, ymax))
    else:
        pack_only = sub_crop

    canvas = Image.new('RGB', (400, 400), (255, 255, 255))
    scaled = pack_only.copy()
    scaled.thumbnail((380, 380), Image.Resampling.LANCZOS)
    
    offset = ((400 - scaled.width) // 2, (400 - scaled.height) // 2)
    canvas.paste(scaled, offset)
    return canvas


def extract_valid_prices_from_line(line: str) -> list[int]:
    """
    Strips package sizes (200ml, 250ml, 10x25g, 2026 year), discount text (Potongan Rp 1.800),
    regional text (Palembang, Lombok, Batam, Luar Jawa), and returns valid retail prices.
    """
    if re.search(r"\b(?:potongan|hemat|cashback|diskon|palembang|medan|pekanbaru|jambi|kalimantan|sulawesi|lombok|batam|luar jawa|wilayah|syarat|ketentuan|berbeda|aplikasi|berlaku|toko)\b", line, re.IGNORECASE):
        return []

    line_clean = re.sub(r"\b\d+\s*(?:ml|g|gr|gram|kg|l|pcs|pack|sachet|x\d+g|\+)\b", "", line, flags=re.IGNORECASE)
    line_clean = re.sub(r"\b\d+g\b", "", line_clean, flags=re.IGNORECASE)
    line_clean = re.sub(r"\b202\d\b", "", line_clean)
    line_clean = re.sub(r"\b\d+X\d+\w*\b", "", line_clean, flags=re.IGNORECASE)

    prices_found = re.findall(r"(?:Rp\.?|RP)?\s*(\d{1,3}(?:[\.,]\d{3})+|\d{4,6})", line_clean, re.IGNORECASE)
    valid = []
    for p_str in prices_found:
        digits_only = re.sub(r"[^\d]", "", p_str)
        if digits_only:
            val = int(digits_only)
            if 1000 <= val <= 500000:
                valid.append(val)
    return valid


def process_with_local_ocr(image_path: str) -> List[Dict[str, Any]]:
    """
    Local OCR engine using EasyOCR / PyTesseract / Precision Grid Cropping.
    """
    filename = Path(image_path).name
    is_jsm_flyer = any(kw in filename.lower() for kw in ["jsm", "gantung", "gajian", "flyer", "katalog"])
    print(f"[OCR-Local] Memproses gambar lokal: {filename} (Flyer Catalog Mode: {is_jsm_flyer})...")

    easyocr_reader = None
    try:
        import easyocr
        easyocr_reader = easyocr.Reader(['id', 'en'], gpu=False)
        print("[OCR-Local] Engine EasyOCR SIAP digunakan.")
    except Exception as e:
        print(f"[OCR-Local] Notice EasyOCR: {e}")

    pytesseract_available = False
    try:
        import pytesseract
        pytesseract_available = True
    except Exception:
        pass

    master_img_dir = Path(image_path).parent / "master_images"
    master_img_dir.mkdir(parents=True, exist_ok=True)

    grid_crops = crop_grid_product_cards(image_path)
    print(f"[OCR-Local] Terdeteksi {len(grid_crops)} kartu produk presisi dari gambar {filename}.")
    products = []

    for idx, (pos, crop_img) in enumerate(grid_crops, 1):
        # 1. Extract pure close-up 400x400 product pack image
        canvas_400 = extract_pure_product_pack(crop_img, pos)
        highres_400_path = master_img_dir / f"product_400x400_{idx}.png"
        canvas_400.save(highres_400_path)

        # 2. Save full card crop for OCR scanning
        crop_save_path = master_img_dir / f"card_crop_{idx}_{pos}.png"
        crop_img.save(crop_save_path)

        extracted_text = ""
        if easyocr_reader:
            try:
                results = easyocr_reader.readtext(str(crop_save_path), detail=0)
                extracted_text = "\n".join(results)
            except Exception as err:
                print(f"[OCR-Local] EasyOCR read error on crop {idx}: {err}")

        if not extracted_text.strip() and pytesseract_available:
            try:
                import pytesseract
                extracted_text = pytesseract.image_to_string(crop_img)
            except Exception:
                pass

        if not is_jsm_flyer and any(kw in extracted_text.upper() for kw in ["JSM", "GANTUNG", "GAJIAN", "JUMAT SABTU MINGGU", "HANYA 3 HARI"]):
            is_jsm_flyer = True

        lines = [l.strip() for l in extracted_text.splitlines() if l.strip()]
        jsm_info = detect_jsm_promo(extracted_text or filename)

        if lines:
            prod_name_parts = []
            valid_prices = []

            for line in lines:
                if any(btn_word in line.lower() for btn_word in ['keranjang', 'tambah', 'beli', 'cart', 'add', 'cari', 'search', 'syarat', 'ketentuan', 'palembang', 'medan', 'pekanbaru', 'jambi', 'kalimantan', 'sulawesi', 'lombok', 'batam', 'luar jawa', 'wilayah', 'berbeda', 'aplikasi', 'berlaku', 'toko', 'harga final', 'berubah sewaktu']):
                    continue

                line_prices = extract_valid_prices_from_line(line)
                if line_prices:
                    valid_prices.extend(line_prices)
                else:
                    cleaned_line = clean_product_name(line)
                    if cleaned_line and len(cleaned_line) > 2:
                        prod_name_parts.append(cleaned_line)

            # Sort prices so price = lowest (selling promo price >= 2000) and original_price = highest
            price = 0
            original_price = 0

            if valid_prices:
                filtered_prices = [p for p in set(valid_prices) if p >= 2000]
                unique_prices = sorted(filtered_prices)
                if len(unique_prices) >= 2:
                    price = unique_prices[0]
                    original_price = unique_prices[-1]
                elif len(unique_prices) == 1:
                    price = unique_prices[0]

            raw_name = " ".join(prod_name_parts).strip()
            full_name = clean_product_name(raw_name)

            if full_name and len(full_name) > 3:
                is_gantung_img = "gantung" in filename.lower() or "gajian" in filename.lower()
                p_type = "GANTUNG" if is_gantung_img else ("JSM" if is_jsm_flyer else jsm_info["promo_type"])
                p_badge = "PROMO GANTUNG" if is_gantung_img else ("PROMO JSM (3 HARI)" if is_jsm_flyer else jsm_info["promo_badge"])
                p_title = "Promo Gantung Alfamart (#GajianUntungAlfamart)" if is_gantung_img else ("Promo JSM Alfamart (Jumat Sabtu Minggu)" if is_jsm_flyer else (jsm_info["promo_title"] if jsm_info["is_jsm"] else ""))

                raw_item = {
                    "product_name": full_name,
                    "brand": extract_brand(full_name) or "Umum",
                    "package_size": extract_package_size(full_name),
                    "price": price,
                    "original_price": original_price,
                    "promo_type": p_type,
                    "promo_badge": p_badge,
                    "promo_title": p_title,
                    "image": str(highres_400_path)
                }
                norm_item = normalize_product_dict(raw_item, global_jsm=is_jsm_flyer)
                if norm_item and norm_item["product_name"]:
                    is_dup = any(
                        p["product_name"] == norm_item["product_name"] and
                        p.get("price") == norm_item.get("price")
                        for p in products
                    )
                    if not is_dup:
                        products.append(norm_item)

    if not products:
        clean_name = filename.rsplit('.', 1)[0].replace('_', ' ').replace('-', ' ').title()
        is_gantung_img = "gantung" in filename.lower() or "gajian" in filename.lower()
        p_type = "GANTUNG" if is_gantung_img else ("JSM" if is_jsm_flyer else "REGULAR")
        p_badge = "PROMO GANTUNG" if is_gantung_img else ("PROMO JSM (3 HARI)" if is_jsm_flyer else "")
        p_title = "Promo Gantung Alfamart (#GajianUntungAlfamart)" if is_gantung_img else ("Promo JSM Alfamart (Jumat Sabtu Minggu)" if is_jsm_flyer else "")

        raw_item = {
            "product_name": clean_product_name(clean_name),
            "brand": extract_brand(clean_name) or "Umum",
            "price": 0,
            "original_price": 0,
            "promo_type": p_type,
            "promo_badge": p_badge,
            "promo_title": p_title,
            "image": str(image_path)
        }
        products.append(normalize_product_dict(raw_item, global_jsm=is_jsm_flyer))

    return products


def extract_ocr_from_image(image_path: str, api_key: str = "", force_local: bool = False) -> List[Dict[str, Any]]:
    """
    Main entry point for OCR extraction on an image file.
    """
    key = api_key or GEMINI_API_KEY
    if not force_local and is_valid_gemini_key(key):
        return process_with_gemini_vision(image_path, api_key=key)
    else:
        return process_with_local_ocr(image_path)
