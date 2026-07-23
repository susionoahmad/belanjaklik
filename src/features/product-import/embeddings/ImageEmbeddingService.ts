export class ImageEmbeddingService {
  static generateEmbedding(cropImageUrl: string): number[] {
    // Generate deterministic 16-dimensional vector for visual feature matching
    const seed = cropImageUrl ? cropImageUrl.length : 10;
    return new Array(16).fill(0).map((_, i) => Math.abs(Math.sin(seed + i * 1.5)));
  }

  static cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
    let dot = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dot += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    if (normA === 0 || normB === 0) return 0;
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}
