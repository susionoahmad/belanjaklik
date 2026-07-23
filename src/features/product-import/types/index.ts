import type { Product } from '../../shared/types';

export type SourceType = 'SCREENSHOT' | 'FLYER' | 'URL' | 'EXCEL' | 'API' | 'MARKETPLACE' | 'DISTRIBUTOR';

export type JobStatus = 'Pending' | 'Processing' | 'Completed' | 'Failed' | 'Cancelled';

export interface DriverInput {
  files?: File[];
  fileUrls?: string[];
  sourceUrl?: string;
  apiConfig?: Record<string, any>;
  rawContent?: any;
}

export interface DriverResult {
  sessionId: string;
  sourceType: SourceType;
  items: DetectedCard[];
  metadata?: Record<string, any>;
}

export interface ImportDriver {
  name: string;
  sourceType: SourceType;
  detect(input: DriverInput): Promise<boolean>;
  import(input: DriverInput): Promise<DriverResult>;
  validate(input: DriverInput): Promise<boolean>;
  parse(raw: any): Promise<ParsedProductData[]>;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DetectedCard {
  id: string;
  cardIndex: number;
  boundingBox: BoundingBox;
  cropImageUrl: string;
  rawOcrText?: string;
  extractedData?: ParsedProductData;
  normalizedData?: NormalizedProductData;
  aiCorrectedData?: AICorrectedData;
  attributes?: ExtractedAttributes;
  aiCategoryRecommendation?: AICategoryRecommendation;
  matchResult?: MatchResult;
  confidence: number; // 0 - 100
}

export interface VisionProvider {
  name: string;
  detectObjects(imageUrl: string): Promise<BoundingBox[]>;
  extractText(imageUrl: string): Promise<string>;
  classify(imageUrl: string): Promise<string[]>;
  generateEmbeddings(imageUrl: string): Promise<number[]>;
}

export interface RawOCRResult {
  text: string;
  confidence: number;
  lines: string[];
}

export interface ParsedProductData {
  extracted_brand?: string;
  extracted_name: string;
  variant?: string;
  package_size?: string;
  current_price: number;
  original_price?: number;
  has_strikethrough_price?: boolean;
  strikethrough_price?: number;
  discount_percentage?: number;
  is_promo?: boolean;
  promo_badge?: string;
  discount_badge?: string;
  barcode?: string;
  external_product_code?: string;
}

export interface NormalizedProductData extends ParsedProductData {
  normalized_name: string;
  normalized_brand: string;
  normalized_unit: string;
  normalized_size: string;
  normalized_price: number;
}

export interface AICorrectedData {
  corrected_name: string;
  corrected_brand: string;
  corrected_variant?: string;
  is_corrected: boolean;
  correction_notes?: string;
}

export interface ExtractedAttributes {
  brand?: string;
  category?: string;
  variant?: string;
  packaging?: string;
  volume?: string;
  weight?: string;
  unit?: string;
  target_audience?: string;
  usage?: string;
  storage_recommendation?: string;
  shelf_life?: string;
}

export interface AICategoryRecommendation {
  category: string;
  subcategory: string;
  tags: string[];
  keywords: string[];
  shelf_group: string;
  confidence: number;
}

export interface MatchReason {
  matched_by_barcode: boolean;
  matched_by_external_code: boolean;
  matched_by_brand_name: boolean;
  matched_by_image: boolean;
  matched_by_embedding: boolean;
  matched_by_category: boolean;
  notes: string[];
}

export interface MatchResult {
  candidateProduct?: Product;
  confidence: number; // 0 - 100
  recommendedAction: 'UPDATE_EXISTING' | 'CREATE_NEW' | 'MERGE';
  matchReason: MatchReason;
}

export interface ReviewItem {
  id: string;
  sessionId: string;
  card: DetectedCard;
  action: 'ACCEPT' | 'EDIT' | 'IGNORE' | 'CREATE_PRODUCT' | 'MERGE_PRODUCT';
  editedData?: Partial<Product>;
  status: 'NEEDS_REVIEW' | 'ACCEPTED' | 'IGNORED' | 'PUBLISHED';
}

export interface PipelineContext {
  sessionId: string;
  jobId: string;
  sourceType: SourceType;
  input: DriverInput;
  detectedCards: DetectedCard[];
  reviewQueue: ReviewItem[];
  duplicates: DetectedCard[];
  logs: string[];
  metadata: Record<string, any>;
  errors: string[];
}

export interface PipelineStage {
  name: string;
  enabled: boolean;
  execute(context: PipelineContext): Promise<PipelineContext>;
}

export interface ImportPlugin {
  id: string;
  name: string;
  execute(context: PipelineContext): Promise<PipelineContext>;
}

export interface ImportSession {
  id: string;
  source_type: SourceType;
  uploaded_files: string[];
  total_products: number;
  duplicated_products: number;
  imported_products: number;
  processing_status: JobStatus;
  created_at: string;
}

export interface ImportJob {
  id: string;
  session_id: string;
  status: JobStatus;
  current_stage: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface AuditRecord {
  id: string;
  session_id: string;
  stage_name: string;
  input_state: any;
  output_state: any;
  timestamp: string;
}

export interface CatalogVersion {
  id: string;
  version_number: number;
  description: string;
  snapshot_data: Product[];
  created_by: string;
  created_at: string;
}

export interface FeatureFlags {
  geminiVision: boolean;
  googleVision: boolean;
  embeddingMatcher: boolean;
  autoCategory: boolean;
  translationPlugin: boolean;
  backgroundRemoval: boolean;
  autoDeduplication: boolean;
}

export interface ImportAnalytics {
  totalSessions: number;
  totalJobs: number;
  totalUploadedFiles: number;
  productsDetected: number;
  productsCreated: number;
  productsUpdated: number;
  productsIgnored: number;
  ocrAccuracy: number;
  aiCorrectionRate: number;
  matchingAccuracy: number;
  duplicateRate: number;
  avgProcessingTimeMs: number;
  avgConfidence: number;
  publishSuccessRate: number;
  rollbackCount: number;
}
