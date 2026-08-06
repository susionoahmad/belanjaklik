import os
from PIL import Image

def test_inspect_jsm6_dimensions():
    img_path = "ocr/JSM6.jpeg"
    if not os.path.exists(img_path):
        print(f"File {img_path} not found")
        return

    with Image.open(img_path) as img:
        w, h = img.size
        print(f"JSM6.jpeg Resolution: {w} x {h} px")

        # Test 4x4 Grid segmentation (16 product boxes)
        num_cols = 4
        num_rows = 4
        
        card_w = w / num_cols
        card_h = h / num_rows

        os.makedirs("ocr/test_16_cards", exist_ok=True)

        count = 0
        for r in range(num_rows):
            for c in range(num_cols):
                count += 1
                x1 = int(c * card_w)
                y1 = int(r * card_h)
                x2 = int((c + 1) * card_w)
                y2 = int((r + 1) * card_h)

                cropped = img.crop((x1, y1, x2, y2))
                save_p = f"ocr/test_16_cards/card_{count}_r{r+1}_c{c+1}.png"
                cropped.save(save_p)
                print(f"Saved card {count}: {save_p} ({cropped.width}x{cropped.height} px)")

if __name__ == "__main__":
    test_inspect_jsm6_dimensions()
