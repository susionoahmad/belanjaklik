import type { BoundingBox } from '../types';

export class CropEngine {
  static async cropRegion(
    imageSrc: string | HTMLImageElement, 
    box: BoundingBox, 
    refWidth = 800, 
    refHeight = 1400,
    minTargetDimension = 400
  ): Promise<string> {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        try {
          const scaleX = img.naturalWidth / refWidth;
          const scaleY = img.naturalHeight / refHeight;

          const sourceX = Math.round(box.x * scaleX);
          const sourceY = Math.round(box.y * scaleY);
          const sourceW = Math.max(1, Math.round(box.width * scaleX));
          const sourceH = Math.max(1, Math.round(box.height * scaleY));

          // Ensure minimum 400x400 resolution canvas for crisp product cards
          const maxDim = Math.max(sourceW, sourceH, minTargetDimension);
          const targetW = maxDim;
          const targetH = maxDim;

          const canvas = document.createElement('canvas');
          canvas.width = targetW;
          canvas.height = targetH;

          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';

            // Fill white clean background
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, targetW, targetH);

            // Center image within square canvas while preserving aspect ratio
            const aspect = sourceW / sourceH;
            let drawW = targetW;
            let drawH = targetH;
            if (aspect > 1) {
              drawH = targetW / aspect;
            } else {
              drawW = targetH * aspect;
            }
            const offsetX = (targetW - drawW) / 2;
            const offsetY = (targetH - drawH) / 2;

            ctx.drawImage(img, sourceX, sourceY, sourceW, sourceH, offsetX, offsetY, drawW, drawH);
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

