import type { BoundingBox } from '../types';

export class CropEngine {
  static async cropRegion(imageSrc: string | HTMLImageElement, box: BoundingBox, refWidth = 800, refHeight = 1400): Promise<string> {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        try {
          const scaleX = img.naturalWidth / refWidth;
          const scaleY = img.naturalHeight / refHeight;

          const sourceX = Math.round(box.x * scaleX);
          const sourceY = Math.round(box.y * scaleY);
          const sourceW = Math.round(box.width * scaleX);
          const sourceH = Math.round(box.height * scaleY);

          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, sourceW);
          canvas.height = Math.max(1, sourceH);

          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, sourceX, sourceY, sourceW, sourceH, 0, 0, sourceW, sourceH);
            resolve(canvas.toDataURL('image/png'));
            return;
          }
        } catch (e) {}

        resolve(typeof imageSrc === 'string' ? imageSrc : img.src);
      };

      img.onerror = () => {
        resolve(typeof imageSrc === 'string' ? imageSrc : '');
      };

      if (typeof imageSrc === 'string') {
        img.src = imageSrc;
      } else {
        img.src = imageSrc.src;
      }
    });
  }
}
