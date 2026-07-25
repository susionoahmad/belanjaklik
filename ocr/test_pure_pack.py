import os
import numpy as np
from PIL import Image

def extract_pure_product_pack(pil_img: Image.Image, pos: str) -> Image.Image:
    """
    Extracts purely the physical product pack image using color saturation & bounding box isolation.
    Eliminates all UI buttons, faded outlines, grey bars, and text.
    """
    img = pil_img.convert('RGB')
    w, h = img.size

    # 1. Position-based initial crop to avoid adjacent row buttons
    if pos in ['TL', 'TR']:
        # Top Row Cards (Rice): Pack is between Y = 5% and 52%
        sub_crop = img.crop((int(w * 0.05), int(h * 0.02), int(w * 0.95), int(h * 0.52)))
    else:
        # Bottom Row Cards (Mujigae Topokki): Pack is strictly between Y = 22% and 68%
        sub_crop = img.crop((int(w * 0.05), int(h * 0.22), int(w * 0.95), int(h * 0.68)))

    arr = np.array(sub_crop)
    
    # Calculate color saturation (max(R,G,B) - min(R,G,B)) and darkness
    r, g, b = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2]
    saturation = np.maximum(r, np.maximum(g, b)).astype(int) - np.minimum(r, np.minimum(g, b)).astype(int)
    is_dark = (r < 220) | (g < 220) | (b < 220)
    
    # Product pixels are either colored (sat > 15) or dark/textured
    is_product = (saturation > 15) | is_dark

    # Exclude grey button bar shadows near bottom/top
    if np.any(is_product):
        rows = np.any(is_product, axis=1)
        cols = np.any(is_product, axis=0)
        ymin, ymax = np.where(rows)[0][[0, -1]]
        xmin, xmax = np.where(cols)[0][[0, -1]]

        # Crop tightly around the product pack
        pack_only = sub_crop.crop((xmin, ymin, xmax, ymax))
    else:
        pack_only = sub_crop

    # Create 400x400 canvas and scale product pack to fill 380x380 (95% fill)
    canvas = Image.new('RGB', (400, 400), (255, 255, 255))
    scaled = pack_only.copy()
    scaled.thumbnail((380, 380), Image.Resampling.LANCZOS)
    
    offset = ((400 - scaled.width) // 2, (400 - scaled.height) // 2)
    canvas.paste(scaled, offset)
    return canvas

def test_crop_pack_pure():
    img_path = "ocr/beras3.jpeg"
    with Image.open(img_path) as img:
        w, h = img.size
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

        os.makedirs("ocr/test_pure_packs", exist_ok=True)

        for pos, box in boxes.items():
            card_crop = img.crop(box)
            pure_canvas = extract_pure_product_pack(card_crop, pos)
            save_p = f"ocr/test_pure_packs/{pos}_pure_400x400.png"
            pure_canvas.save(save_p)
            print(f"Saved pure pack image: {save_p}")

if __name__ == "__main__":
    test_crop_pack_pure()
