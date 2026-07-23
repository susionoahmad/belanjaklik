import { OCRAdapter } from './OCRAdapter';
import type { RawOCRResult } from '../types';

export class GoogleVisionAdapter extends OCRAdapter {
  name = 'Google Vision OCR Adapter';
  async processImage(cropImageUrl: string): Promise<RawOCRResult> {
    return {
      text: 'Indomie Goreng 85g\nRp 3.100',
      confidence: 90,
      lines: ['Indomie Goreng 85g', 'Rp 3.100']
    };
  }
}

export class OpenAIVisionAdapter extends OCRAdapter {
  name = 'OpenAI Vision OCR Adapter';
  async processImage(cropImageUrl: string): Promise<RawOCRResult> {
    return {
      text: 'Bimoli Minyak Goreng 2L\nRp 34.900',
      confidence: 93,
      lines: ['Bimoli Minyak Goreng 2L', 'Rp 34.900']
    };
  }
}

export class AzureVisionAdapter extends OCRAdapter {
  name = 'Azure Vision OCR Adapter';
  async processImage(cropImageUrl: string): Promise<RawOCRResult> {
    return {
      text: 'Gulaku 1kg\nRp 16.800',
      confidence: 89,
      lines: ['Gulaku 1kg', 'Rp 16.800']
    };
  }
}
