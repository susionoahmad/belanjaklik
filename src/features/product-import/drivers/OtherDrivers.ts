import type { DriverInput, DriverResult, ImportDriver, ParsedProductData, SourceType } from '../types';

export class FlyerDriver implements ImportDriver {
  name = 'Promo Flyer Driver';
  sourceType: SourceType = 'FLYER';
  async detect(input: DriverInput): Promise<boolean> { return true; }
  async validate(input: DriverInput): Promise<boolean> { return true; }
  async import(input: DriverInput): Promise<DriverResult> { return { sessionId: `flyer_${Date.now()}`, sourceType: 'FLYER', items: [] }; }
  async parse(raw: any): Promise<ParsedProductData[]> { return []; }
}

export class UrlDriver implements ImportDriver {
  name = 'URL Sync Driver';
  sourceType: SourceType = 'URL';
  async detect(input: DriverInput): Promise<boolean> { return !!input.sourceUrl; }
  async validate(input: DriverInput): Promise<boolean> { return true; }
  async import(input: DriverInput): Promise<DriverResult> { return { sessionId: `url_${Date.now()}`, sourceType: 'URL', items: [] }; }
  async parse(raw: any): Promise<ParsedProductData[]> { return []; }
}

export { ExcelDriver } from './ExcelDriver';

export class ApiDriver implements ImportDriver {
  name = 'Supplier API Driver';
  sourceType: SourceType = 'API';
  async detect(input: DriverInput): Promise<boolean> { return true; }
  async validate(input: DriverInput): Promise<boolean> { return true; }
  async import(input: DriverInput): Promise<DriverResult> { return { sessionId: `api_${Date.now()}`, sourceType: 'API', items: [] }; }
  async parse(raw: any): Promise<ParsedProductData[]> { return []; }
}
