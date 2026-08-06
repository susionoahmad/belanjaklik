import os
from PIL import Image
import easyocr

def inspect_jsm6_exact_layout():
    img_path = "ocr/JSM6.jpeg"
    if not os.path.exists(img_path):
        print("File not found")
        return

    with Image.open(img_path) as img:
        w, h = img.size
        print(f"JSM6 Resolution: {w} x {h}")

        # Header banner is top ~14%, Footer disclaimer is bottom ~7%
        top_header_h = int(h * 0.14)
        bottom_footer_h = int(h * 0.93)
        grid_h = bottom_footer_h - top_header_h

        num_cols = 4
        num_rows = 4
        card_w = w / num_cols
        card_h = grid_h / num_rows

        reader = easyocr.Reader(['id', 'en'], gpu=False)
        os.makedirs("ocr/test_jsm6_exact", exist_ok=True)

        count = 0
        for r in range(num_rows):
            for c in range(num_cols):
                count += 1
                x1 = int(c * card_w)
                y1 = top_header_h + int(r * card_h)
                x2 = int((c + 1) * card_w)
                y2 = top_header_h + int((r + 1) * card_h)

                card_img = img.crop((x1, y1, x2, y2))
                save_path = f"ocr/test_jsm6_exact/card_{count:02d}.png"
                card_img.save(save_path)

                ocr_res = reader.readtext(save_path, detail=0)
                print(f"Card {count:02d} (r{r+1}c{c+1}): {' | '.join(ocr_res)}")

if __name__ == "__main__":
    inspect_jsm6_exact_layout()
