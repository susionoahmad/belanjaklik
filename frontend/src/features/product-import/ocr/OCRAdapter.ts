import type { RawOCRResult } from '../types';

export abstract class OCRAdapter {
  abstract name: string;
  abstract processImage(cropImageUrl: string): Promise<RawOCRResult>;
}
