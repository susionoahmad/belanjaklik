import type { MatchResult, NormalizedProductData } from '../types';
import type { Product } from '../../shared/types';
import { BarcodeMatcher } from '../matching/BarcodeMatcher';
import { TextMatcher } from '../matching/TextMatcher';
import { ImageMatcher, AIMatcher } from '../matching/ImageAndAIMatchers';

export class MatchingEngine {
  static async match(data: NormalizedProductData, cropImageUrl: string, catalog: Product[]): Promise<MatchResult> {
    const notes: string[] = [];

    // 1. Priority 1: Barcode Matcher
    const barcodeMatch = BarcodeMatcher.match(data, catalog);
    if (barcodeMatch) {
      notes.push('Exact 100% Barcode Match');
      return {
        candidateProduct: barcodeMatch,
        confidence: 99,
        recommendedAction: 'UPDATE_EXISTING',
        matchReason: {
          matched_by_barcode: true,
          matched_by_external_code: false,
          matched_by_brand_name: true,
          matched_by_image: true,
          matched_by_embedding: false,
          matched_by_category: true,
          notes
        }
      };
    }

    // 2. Priority 2: External Code Matcher
    if (data.external_product_code) {
      const extMatch = catalog.find(p => p.external_product_code === data.external_product_code);
      if (extMatch) {
        notes.push('Exact External Product Code Match');
        return {
          candidateProduct: extMatch,
          confidence: 98,
          recommendedAction: 'UPDATE_EXISTING',
          matchReason: {
            matched_by_barcode: false,
            matched_by_external_code: true,
            matched_by_brand_name: true,
            matched_by_image: true,
            matched_by_embedding: false,
            matched_by_category: true,
            notes
          }
        };
      }
    }

    // 3. Priority 3: Brand + Name Text Matcher
    const textResult = TextMatcher.match(data, catalog);
    if (textResult.candidate && textResult.score >= 0.75) {
      const confidence = Math.round(textResult.score * 100);
      notes.push(`Matched by Brand & Name similarity (${confidence}%)`);

      return {
        candidateProduct: textResult.candidate,
        confidence,
        recommendedAction: 'UPDATE_EXISTING',
        matchReason: {
          matched_by_barcode: false,
          matched_by_external_code: false,
          matched_by_brand_name: true,
          matched_by_image: confidence > 90,
          matched_by_embedding: false,
          matched_by_category: true,
          notes
        }
      };
    }

    // 4. Priority 4: Image Similarity Matcher (With Sanity Category Check)
    const imageResult = ImageMatcher.match(cropImageUrl, data, catalog);
    if (imageResult.candidate && imageResult.score >= 0.92) {
      const confidence = Math.round(imageResult.score * 90);
      notes.push(`Matched by Visual Feature Embedding (${confidence}%)`);

      return {
        candidateProduct: imageResult.candidate,
        confidence,
        recommendedAction: 'UPDATE_EXISTING',
        matchReason: {
          matched_by_barcode: false,
          matched_by_external_code: false,
          matched_by_brand_name: false,
          matched_by_image: true,
          matched_by_embedding: true,
          matched_by_category: true,
          notes
        }
      };
    }

    // 5. UNMATCHED (UNMATCHED_REQUIRES_CATALOG_PRODUCT) -> Recommend CREATE_NEW!
    notes.push('UNMATCHED_REQUIRES_CATALOG_PRODUCT: Produk belum ada di katalog, disarankan Tambah Produk Baru');
    return {
      candidateProduct: undefined,
      confidence: 100,
      recommendedAction: 'CREATE_NEW',
      matchReason: {
        matched_by_barcode: false,
        matched_by_external_code: false,
        matched_by_brand_name: false,
        matched_by_image: false,
        matched_by_embedding: false,
        matched_by_category: false,
        notes
      }
    };
  }
}
