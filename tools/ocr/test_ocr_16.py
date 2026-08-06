import os
import easyocr
from PIL import Image

def test_ocr_all_16_cards():
    reader = easyocr.Reader(['id', 'en'], gpu=False)
    print("EasyOCR initialized")

    img_dir = "ocr/test_16_cards"
    for i in range(1, 17):
        p = f"{img_dir}/card_{i}_r{(i-1)//4+1}_c{(i-1)%4+1}.png"
        if os.path.exists(p):
            results = reader.readtext(p, detail=0)
            text_str = " | ".join(results)
            print(f"Card {i:02d}: {text_str}")

if __name__ == "__main__":
    test_ocr_all_16_cards()
