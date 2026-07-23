import { BaseVisionProvider } from './VisionProvider';
import type { BoundingBox } from '../types';

export class GoogleVisionProvider extends BaseVisionProvider {
  name = 'Google Cloud Vision Provider';

  async detectObjects(imageUrl: string): Promise<BoundingBox[]> {
    return [
      { x: 25, y: 140, width: 220, height: 280 },
      { x: 255, y: 140, width: 220, height: 280 }
    ];
  }

  async extractText(imageUrl: string): Promise<string> {
    return 'Google Vision OCR text';
  }

  async classify(imageUrl: string): Promise<string[]> {
    return ['Retail', 'Beverage', 'Food'];
  }

  async generateEmbeddings(imageUrl: string): Promise<number[]> {
    return new Array(16).fill(0.1);
  }
}

export class AzureVisionProvider extends BaseVisionProvider {
  name = 'Azure Computer Vision Provider';

  async detectObjects(imageUrl: string): Promise<BoundingBox[]> {
    return [{ x: 30, y: 150, width: 220, height: 280 }];
  }

  async extractText(imageUrl: string): Promise<string> {
    return 'Azure Vision OCR text';
  }

  async classify(imageUrl: string): Promise<string[]> {
    return ['Consumer Goods', 'Packaging'];
  }

  async generateEmbeddings(imageUrl: string): Promise<number[]> {
    return new Array(16).fill(0.2);
  }
}

export class OpenAIVisionProvider extends BaseVisionProvider {
  name = 'OpenAI GPT-4 Vision Provider';

  async detectObjects(imageUrl: string): Promise<BoundingBox[]> {
    return [{ x: 30, y: 150, width: 220, height: 280 }];
  }

  async extractText(imageUrl: string): Promise<string> {
    return 'OpenAI GPT-4 Vision text';
  }

  async classify(imageUrl: string): Promise<string[]> {
    return ['Smart Retail', 'Products'];
  }

  async generateEmbeddings(imageUrl: string): Promise<number[]> {
    return new Array(16).fill(0.3);
  }
}
