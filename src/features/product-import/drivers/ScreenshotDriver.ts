import type { DriverInput, DriverResult, ImportDriver, ParsedProductData, SourceType } from '../types';

export class ScreenshotDriver implements ImportDriver {
  name = 'Screenshot Driver (Groceries Scanner)';
  sourceType: SourceType = 'SCREENSHOT';

  async detect(input: DriverInput): Promise<boolean> {
    if (!input.files || input.files.length === 0) return false;
    return input.files.some(f => f.type.startsWith('image/'));
  }

  async validate(input: DriverInput): Promise<boolean> {
    return this.detect(input);
  }

  async import(input: DriverInput): Promise<DriverResult> {
    return {
      sessionId: `sess_${Date.now()}`,
      sourceType: 'SCREENSHOT',
      items: [],
      metadata: { fileCount: input.files?.length || 0 }
    };
  }

  async parse(raw: any): Promise<ParsedProductData[]> {
    return [];
  }
}
