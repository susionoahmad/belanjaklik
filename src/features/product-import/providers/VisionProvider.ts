import type { BoundingBox, VisionProvider } from '../types';

export abstract class BaseVisionProvider implements VisionProvider {
  abstract name: string;

  abstract detectObjects(imageUrl: string): Promise<BoundingBox[]>;
  abstract extractText(imageUrl: string): Promise<string>;
  abstract classify(imageUrl: string): Promise<string[]>;
  abstract generateEmbeddings(imageUrl: string): Promise<number[]>;
}
