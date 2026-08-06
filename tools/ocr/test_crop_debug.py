import os
from PIL import Image

def clean_blue_buttons(pil_img: Image.Image) -> Image.Image:
    """Replaces blue button pixels (+ Keranjang) with white background."""
    img = pil_img.convert('RGB')
    pixels = img.load()
    w, h = img.size
    
    for x in range(w):
        for y in range(h):
            r, g, b = pixels[x, y]
            # Detect blue button color (High Blue, Moderate Green, Low Red)
            if b > 140 and r < 100 and g < 180:
                pixels[x, y] = (255, 255, 255)
            # Detect grey bar under button
            elif r > 220 and g > 220 and b > 220 and y > int(h * 0.6):
                pixels[x, y] = (255, 255, 255)
    return img

def test_crop_beras3():
    img_path = "ocr/beras3.jpeg"
    if not os.path.exists(img_path):
        print("File not found")
        return

    with Image.open(img_path) as img:
        w, h = img.size
        print(f"Image size: {w}x{h}")

        # Exact product pack coordinates for 4 cards in Alfamind app
        packs = {
            '1_Top_Anak_Raja': (int(w * 0.05), int(h * 0.02), int(w * 0.48), int(h * 0.27)),
            '2_Alfamart_Beras': (int(w * 0.52), int(h * 0.02), int(w * 0.95), int(h * 0.27)),
            '3_Mujigae_Topokki': (int(w * 0.05), int(h * 0.50), int(w * 0.48), int(h * 0.74)),
            '4_Mujigae_Spicy': (int(w * 0.52), int(h * 0.50), int(w * 0.95), int(h * 0.74))
        }

        os.makedirs("ocr/test_crops", exist_ok=True)

        for name, box in packs.items():
            cropped = img.crop(box)
            cleaned = clean_blue_buttons(cropped)

            canvas = Image.new('RGB', (400, 400), (255, 255, 255))
            scaled = cleaned.copy()
            scaled.thumbnail((360, 360), Image.Resampling.LANCZOS)
            offset = ((400 - scaled.width) // 2, (400 - scaled.height) // 2)
            canvas.paste(scaled, offset)

            save_p = f"ocr/test_crops/{name}.png"
            canvas.save(save_p)
            print(f"Saved: {save_p}")

if __name__ == "__main__":
    test_crop_beras3()
