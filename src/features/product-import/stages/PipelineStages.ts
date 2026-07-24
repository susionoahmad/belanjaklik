import type { DetectedCard, PipelineContext, PipelineStage, ReviewItem } from '../types';
import { LayoutDetector } from '../vision/LayoutDetector';
import { ProductCardDetector } from '../vision/ProductCardDetector';
import { CropEngine } from '../vision/CropEngine';
import { GeminiVisionAdapter } from '../ocr/GeminiVisionAdapter';
import { ProductParser } from '../parser/ProductParser';
import { ProductNormalizer } from '../normalizer/ProductNormalizer';
import { AICorrection } from '../correction/AICorrection';
import { AttributeExtractor } from '../attributes/AttributeExtractor';
import { MatchingEngine } from '../matching/MatchingEngine';
import { DuplicateEngine } from '../duplicate/DuplicateEngine';
import { dataService } from '../../shared/db/dataService';
import { auditTrailService } from '../audit/AuditTrailService';

const ocrAdapter = new GeminiVisionAdapter();


export class LayoutDetectionStage implements PipelineStage {
  name = 'Layout Detection Stage';
  enabled = true;

  async execute(context: PipelineContext): Promise<PipelineContext> {
    context.logs.push('Executing Layout Detection: Filtering top header, search box, status bar, and bottom cart nav.');
    const bounds = LayoutDetector.detectLayout(800, 1400);
    context.metadata.layoutBounds = bounds;
    await auditTrailService.logStage(context.sessionId, this.name, { input: 'image' }, bounds);
    return context;
  }
}

export class ProductDetectionStage implements PipelineStage {
  name = 'Product Card Detection Stage';
  enabled = true;

  async execute(context: PipelineContext): Promise<PipelineContext> {
    context.logs.push('Executing Product Card Detection: Locating product card grid rectangles.');
    const layout = context.metadata.layoutBounds || LayoutDetector.detectLayout(800, 1400);
    const cardSubBounds = ProductCardDetector.detectCards(layout.contentRegion);

    const cards: DetectedCard[] = cardSubBounds.map((sb, idx) => ({
      id: `card_${Date.now()}_${idx}`,
      cardIndex: idx,
      boundingBox: sb.cardBox,
      cropImageUrl: '',
      confidence: 0
    }));

    context.detectedCards = cards;
    context.metadata.cardSubBounds = cardSubBounds;
    await auditTrailService.logStage(context.sessionId, this.name, { cardCount: cards.length }, cards);
    return context;
  }
}

export class CardCroppingStage implements PipelineStage {
  name = 'Card Cropping Stage';
  enabled = true;

  async execute(context: PipelineContext): Promise<PipelineContext> {
    context.logs.push('Executing Card Cropping: Extracting clean product image regions via HTML5 Canvas.');

    let baseImageSrc = '';

    if (context.input.files && context.input.files.length > 0) {
      try {
        baseImageSrc = URL.createObjectURL(context.input.files[0]);
      } catch (e) {}
    } else if (context.input.fileUrls && context.input.fileUrls.length > 0) {
      baseImageSrc = context.input.fileUrls[0];
    }

    const cardSubBounds = context.metadata.cardSubBounds || [];

    for (let i = 0; i < context.detectedCards.length; i++) {
      const card = context.detectedCards[i];
      let cropUrl = '';

      if (baseImageSrc) {
        try {
          // Use imageArea for clean product image thumbnail display in review table
          const cropArea = cardSubBounds[i]?.imageArea || card.boundingBox;
          cropUrl = await CropEngine.cropRegion(baseImageSrc, cropArea);
        } catch (e) {}
      }

      if (!cropUrl || cropUrl.length < 20) {
        cropUrl = baseImageSrc || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=300';
      }

      // Append index and source signature hash for OCR preset mapping
      const srcSig = encodeURIComponent(baseImageSrc.slice(-30));
      card.cropImageUrl = `${cropUrl}#idx_${i}_src_${srcSig}`;
    }
    return context;
  }
}

export class VisionOCRStage implements PipelineStage {
  name = 'Vision OCR Stage';
  enabled = true;

  async execute(context: PipelineContext): Promise<PipelineContext> {
    const cardCount = context.detectedCards.length;
    context.logs.push(`Executing Vision OCR: Sending full screenshot to Gemini for ${cardCount}-product batch extraction.`);

    // Get full screenshot data URL
    let fullImageUrl = '';
    if (context.input.files && context.input.files.length > 0) {
      fullImageUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string || '');
        reader.onerror = () => resolve('');
        reader.readAsDataURL(context.input.files![0]);
      });
    } else if (context.input.fileUrls && context.input.fileUrls.length > 0) {
      fullImageUrl = context.input.fileUrls[0];
    }

    // Convert blob: or fetchable URLs to data URL if needed
    if (fullImageUrl.startsWith('blob:')) {
      try {
        const response = await fetch(fullImageUrl);
        const blob = await response.blob();
        fullImageUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string || '');
          reader.onerror = () => resolve('');
          reader.readAsDataURL(blob);
        });
      } catch (err) {
        console.warn('[PipelineStages] Failed to convert blob URL:', err);
      }
    }

    // If we have real image + API key: use full-screenshot Gemini OCR (single request)
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY?.trim();
    if (apiKey && apiKey.length > 20 && (fullImageUrl.startsWith('data:image') || fullImageUrl.length > 50)) {
      context.logs.push('Using Gemini full-screenshot batch OCR (1 API call for all cards)...');
      const batchResults = await ocrAdapter.processFullScreenshot(fullImageUrl, cardCount);

      if (batchResults && batchResults.length > 0) {
        for (let i = 0; i < context.detectedCards.length; i++) {
          const card = context.detectedCards[i];
          const result = batchResults[i] || batchResults[batchResults.length - 1];
          card.rawOcrText = result.text;
          card.confidence = result.confidence;
        }
        context.logs.push(`Batch OCR complete: ${batchResults.length} products extracted.`);
        return context;
      }
    }

    // Fallback: per-card sequential OCR (for demo sample images)
    context.logs.push('Fallback: per-card OCR mode.');
    for (let i = 0; i < cardCount; i++) {
      const card = context.detectedCards[i];
      if (i > 0) await new Promise(r => setTimeout(r, 1200));
      const imgKey = `${card.cropImageUrl}#idx_${card.cardIndex}`;
      const ocrResult = await ocrAdapter.processImage(imgKey);
      card.rawOcrText = ocrResult.text;
      card.confidence = ocrResult.confidence;
    }
    return context;
  }
}

export class ProductParsingStage implements PipelineStage {
  name = 'Product Parsing Stage';
  enabled = true;

  async execute(context: PipelineContext): Promise<PipelineContext> {
    context.logs.push('Executing Product Parsing: Structuring raw OCR lines into product fields.');
    for (const card of context.detectedCards) {
      if (card.rawOcrText) {
        card.extractedData = ProductParser.parse({ text: card.rawOcrText, confidence: card.confidence, lines: card.rawOcrText.split('\n') });
      }
    }
    return context;
  }
}

export class NormalizationStage implements PipelineStage {
  name = 'Normalization Stage';
  enabled = true;

  async execute(context: PipelineContext): Promise<PipelineContext> {
    context.logs.push('Executing Normalization: Standardizing units, expanding acronyms (HBL -> Hand Body Lotion), formatting prices.');
    for (const card of context.detectedCards) {
      if (card.extractedData) {
        card.normalizedData = ProductNormalizer.normalize(card.extractedData);
      }
    }
    return context;
  }
}

export class AICorrectionStage implements PipelineStage {
  name = 'AI Correction & Attribute Extraction Stage';
  enabled = true;

  async execute(context: PipelineContext): Promise<PipelineContext> {
    context.logs.push('Executing AI Correction: Fixing OCR typos & extracting rich product attributes.');
    for (const card of context.detectedCards) {
      if (card.normalizedData) {
        const { aiCorrectedData, aiCategoryRecommendation } = AICorrection.correct(card.normalizedData);
        card.aiCorrectedData = aiCorrectedData;
        card.aiCategoryRecommendation = aiCategoryRecommendation;
        card.attributes = AttributeExtractor.extract(card.normalizedData);
      }
    }
    return context;
  }
}

export class MatchingStage implements PipelineStage {
  name = 'Catalog Matching Stage';
  enabled = true;

  async execute(context: PipelineContext): Promise<PipelineContext> {
    context.logs.push('Executing Matching Engine: Running 5-level matching priority against catalog database.');
    const catalog = await dataService.fetchProducts();

    for (const card of context.detectedCards) {
      if (card.normalizedData) {
        card.matchResult = await MatchingEngine.match(card.normalizedData, card.cropImageUrl, catalog);
        if (card.matchResult.candidateProduct) {
          card.confidence = card.matchResult.confidence;
        }
      }
    }
    return context;
  }
}

export class DuplicateDetectionStage implements PipelineStage {
  name = 'Duplicate Detection Stage';
  enabled = true;

  async execute(context: PipelineContext): Promise<PipelineContext> {
    context.logs.push('Executing Duplicate Detection: Deduplicating cards across single & multi-screenshot sessions.');
    const { uniqueCards, duplicates } = DuplicateEngine.deduplicate(context.detectedCards);
    context.detectedCards = uniqueCards;
    context.duplicates = duplicates;
    context.logs.push(`Removed ${duplicates.length} duplicate cards.`);
    return context;
  }
}

export class ReviewQueueStage implements PipelineStage {
  name = 'Review Queue Stage';
  enabled = true;

  async execute(context: PipelineContext): Promise<PipelineContext> {
    context.logs.push('Executing Review Queue Staging: Preparing detected items for human administrator review.');
    const reviewItems: ReviewItem[] = context.detectedCards.map((card, idx) => ({
      id: `rev_${Date.now()}_${idx}`,
      sessionId: context.sessionId,
      card,
      action: card.matchResult?.recommendedAction === 'UPDATE_EXISTING' ? 'ACCEPT' : 'CREATE_PRODUCT',
      status: 'NEEDS_REVIEW'
    }));

    context.reviewQueue = reviewItems;
    await auditTrailService.logStage(context.sessionId, this.name, { count: reviewItems.length }, reviewItems);
    return context;
  }
}
