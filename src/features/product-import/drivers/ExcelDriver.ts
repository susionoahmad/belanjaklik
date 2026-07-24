import * as XLSX from 'xlsx';
import type { DetectedCard, DriverInput, DriverResult, ImportDriver, ParsedProductData, SourceType } from '../types';
import { ProductImageResolver } from '../services/ProductImageResolver';


export interface ExcelRowProduct {
  image?: string;
  product_name?: string;
  brand?: string;
  variant?: string;
  package_size?: string;
  price?: number | string;
  original_price?: number | string;
  discount_percentage?: number | string;
  stock_status?: string;
  category?: string;
  [key: string]: any;
}

export class ExcelDriver implements ImportDriver {
  name = 'Excel / CSV Import Driver';
  sourceType: SourceType = 'EXCEL';

  async detect(input: DriverInput): Promise<boolean> {
    if (input.files && input.files.length > 0) {
      const fileName = input.files[0].name.toLowerCase();
      return fileName.endsWith('.xlsx') || fileName.endsWith('.xls') || fileName.endsWith('.csv');
    }
    if (input.fileUrls && input.fileUrls.length > 0) {
      const url = input.fileUrls[0].toLowerCase();
      return url.includes('.xlsx') || url.includes('.xls') || url.includes('.csv');
    }
    return false;
  }

  async validate(input: DriverInput): Promise<boolean> {
    return (!!input.files && input.files.length > 0) || (!!input.fileUrls && input.fileUrls.length > 0) || !!input.rawContent;
  }

  async import(input: DriverInput): Promise<DriverResult> {
    const parsedData = await this.parseExcelInput(input);
    const items: DetectedCard[] = parsedData.map((row, idx) => this.convertToDetectedCard(row, idx));

    return {
      sessionId: `excel_${Date.now()}`,
      sourceType: 'EXCEL',
      items,
      metadata: {
        totalRowsParsed: parsedData.length
      }
    };
  }

  async parse(raw: any): Promise<ParsedProductData[]> {
    if (Array.isArray(raw)) {
      return raw.map(row => this.rowToParsedData(row));
    }
    return [];
  }

  public async parseExcelInput(input: DriverInput): Promise<ExcelRowProduct[]> {
    let workbook: XLSX.WorkBook | null = null;

    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const data = await file.arrayBuffer();
      workbook = XLSX.read(data, { type: 'array', bookFiles: true });
    } else if (input.fileUrls && input.fileUrls.length > 0) {
      try {
        const url = input.fileUrls[0];
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status} ${response.statusText}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        workbook = XLSX.read(arrayBuffer, { type: 'array', bookFiles: true });
      } catch (fetchErr) {
        console.error('[ExcelDriver] Failed to fetch Excel URL:', fetchErr);
      }
    } else if (input.rawContent) {
      const data = typeof input.rawContent === 'string' ? new TextEncoder().encode(input.rawContent) : input.rawContent;
      workbook = XLSX.read(data, { type: 'array', bookFiles: true });
    }

    if (!workbook || workbook.SheetNames.length === 0) {
      return [];
    }

    const embeddedImagesMap = this.extractEmbeddedImages(workbook);

    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawRows = XLSX.utils.sheet_to_json<any[]>(firstSheet, { header: 1 });

    if (!rawRows || rawRows.length === 0) {
      return [];
    }

    // Find header row dynamically (must have at least 2 distinct non-empty cells with column name match)
    let headerRowIdx = -1;
    for (let i = 0; i < Math.min(rawRows.length, 15); i++) {
      const row = rawRows[i];
      if (Array.isArray(row)) {
        const nonNullCells = row.filter(cell => cell != null && String(cell).trim() !== '');
        if (nonNullCells.length >= 2) {
          const cellsLower = row.map(cell => String(cell || '').trim().toLowerCase());
          const hasExactHeader = cellsLower.some(c => 
            c === 'product_name' || c === 'nama produk' || c === 'nama' || 
            c === 'price' || c === 'harga' || c === 'brand' || c === 'merek' || c === 'merk'
          );
          if (hasExactHeader) {
            headerRowIdx = i;
            break;
          }
        }
      }
    }

    if (headerRowIdx === -1) {
      headerRowIdx = 0; // Default to first row if no header detected
    }


    const headers = (rawRows[headerRowIdx] as any[]).map(h => String(h || '').trim().toLowerCase());
    const dataRows = rawRows.slice(headerRowIdx + 1);

    const result: ExcelRowProduct[] = [];

    dataRows.forEach((row, dataIdx) => {
      if (!Array.isArray(row) || row.length === 0 || row.every(cell => cell == null || String(cell).trim() === '')) {
        return; // Skip empty rows
      }

      const actualRowIndex = headerRowIdx + 1 + dataIdx;

      const obj: ExcelRowProduct = {};
      headers.forEach((header, colIdx) => {
        if (header) {
          obj[header] = row[colIdx] ?? null;
        }
      });

      const rawImg = embeddedImagesMap[actualRowIndex] || 
                     embeddedImagesMap[actualRowIndex - 1] || 
                     embeddedImagesMap[actualRowIndex + 1] || 
                     embeddedImagesMap[dataIdx] || 
                     embeddedImagesMap[dataIdx + 1] || 
                     obj.image || obj.gambar || obj.foto || obj.image_url || obj.thumbnail;

      const productName = String(obj.product_name || obj.nama_produk || obj.nama || obj.name || '').trim();
      const brand = obj.brand || obj.merek || obj.merk ? String(obj.brand || obj.merek || obj.merk).trim() : undefined;
      const extractedImg = ProductImageResolver.resolveImage(productName, brand, rawImg);

      // Standardize key names
      const standardized: ExcelRowProduct = {
        image: extractedImg,
        product_name: productName,
        brand,
        variant: obj.variant || obj.varian || obj.rasa ? String(obj.variant || obj.varian || obj.rasa).trim() : undefined,
        package_size: obj.package_size || obj.ukuran || obj.berat || obj.satuan ? String(obj.package_size || obj.ukuran || obj.berat || obj.satuan).trim() : undefined,
        price: this.parseNumericPrice(obj.price || obj.harga || obj.harga_jual),
        original_price: this.parseNumericPrice(obj.original_price || obj.harga_coret || obj.harga_asli),
        discount_percentage: this.parseDiscountPercentage(obj.discount_percentage || obj.diskon),
        stock_status: obj.stock_status || obj.stok || obj.status_stok ? String(obj.stock_status || obj.stok || obj.status_stok).trim() : 'Tersedia',
        category: obj.category || obj.kategori ? String(obj.category || obj.kategori).trim() : 'Mi Instan'
      };

      if (standardized.product_name) {
        result.push(standardized);
      }
    });


    return result;
  }

  private extractEmbeddedImages(wb: XLSX.WorkBook): Record<number, string> {
    const imagesByRow: Record<number, string> = {};
    const wbAny = wb as any;
    if (!wbAny.files) return imagesByRow;

    try {
      // 1. Build rId to media path map from drawings rels
      const relsMap: Record<string, string> = {};
      for (const k in wbAny.files) {
        if (k.includes('drawings/_rels/') && k.endsWith('.rels')) {
          const fileObj = wbAny.files[k];
          const rawBytes = fileObj.content || fileObj._data || fileObj;
          const xmlStr = typeof rawBytes === 'string' ? rawBytes : new TextDecoder().decode(rawBytes);
          const matches = xmlStr.matchAll(/Id="(rId\d+)"[^>]*Target="([^"]+)"/g);
          for (const m of matches) {
            let target = m[2].replace('../', 'xl/');
            if (!target.startsWith('xl/')) target = 'xl/' + target;
            relsMap[m[1]] = target;
          }
        }
      }

      // 2. Parse drawings XML to map row number to rId
      for (const k in wbAny.files) {
        if (k.includes('drawings/') && k.endsWith('.xml') && !k.includes('_rels')) {
          const fileObj = wbAny.files[k];
          const rawBytes = fileObj.content || fileObj._data || fileObj;
          const xmlStr = typeof rawBytes === 'string' ? rawBytes : new TextDecoder().decode(rawBytes);
          const anchorRegex = /<(?:xdr:)?oneCellAnchor[\s\S]*?<\/(?:xdr:)?oneCellAnchor>|<(?:xdr:)?twoCellAnchor[\s\S]*?<\/(?:xdr:)?twoCellAnchor>/g;
          const anchors = xmlStr.match(anchorRegex) || [];
          for (const anchor of anchors) {
            const rowMatch = anchor.match(/<(?:xdr:)?row>(\d+)<\/(?:xdr:)?row>/);
            const embedMatch = anchor.match(/r:embed="(rId\d+)"/);
            if (rowMatch && embedMatch) {
              const rowIdx = parseInt(rowMatch[1], 10);
              const rId = embedMatch[1];
              const mediaPath = relsMap[rId];
              if (mediaPath && wbAny.files[mediaPath]) {
                const targetObj = wbAny.files[mediaPath];
                const bytes = targetObj.content || targetObj._data || targetObj;
                let base64 = '';
                if (bytes instanceof Uint8Array || ArrayBuffer.isView(bytes)) {
                  const arr = new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength);
                  let binary = '';
                  const len = arr.length;
                  for (let i = 0; i < len; i++) {
                    binary += String.fromCharCode(arr[i]);
                  }
                  base64 = typeof btoa !== 'undefined' ? btoa(binary) : Buffer.from(arr).toString('base64');
                } else if (typeof bytes === 'string') {
                  base64 = typeof btoa !== 'undefined' ? btoa(bytes) : Buffer.from(bytes).toString('base64');
                }
                if (base64) {
                  const mime = mediaPath.endsWith('.jpg') || mediaPath.endsWith('.jpeg') ? 'image/jpeg' : 'image/png';
                  imagesByRow[rowIdx] = `data:${mime};base64,${base64}`;
                }
              }
            }
          }
        }
      }
    } catch (e) {
      console.warn('[ExcelDriver] Error extracting embedded images from workbook:', e);
    }
    return imagesByRow;
  }



  private parseNumericPrice(val: any): number {
    if (val == null) return 0;
    if (typeof val === 'number') return isNaN(val) ? 0 : val;
    const str = String(val).replace(/[^0-9]/g, '');
    const num = parseInt(str, 10);
    return isNaN(num) ? 0 : num;
  }

  private parseDiscountPercentage(val: any, originalPrice?: number, currentPrice?: number): number | undefined {
    if (originalPrice && currentPrice && originalPrice > currentPrice && currentPrice > 0) {
      return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
    }
    if (val == null) return undefined;
    if (typeof val === 'number') {
      let num = Math.abs(val);
      if (num > 0 && num < 1) num = num * 100;
      num = Math.round(num);
      return (num > 0 && num <= 99) ? num : undefined;
    }
    const str = String(val).replace(',', '.');
    const match = str.match(/[-+]?\d*\.?\d+/);
    if (match) {
      let num = Math.abs(parseFloat(match[0]));
      if (num > 0 && num < 1) num = num * 100;
      num = Math.round(num);
      return (num > 0 && num <= 99) ? num : undefined;
    }
    return undefined;
  }

  private rowToParsedData(row: ExcelRowProduct): ParsedProductData {
    const currentPrice = this.parseNumericPrice(row.price);
    const originalPrice = this.parseNumericPrice(row.original_price);
    const hasStrikethrough = originalPrice > currentPrice && currentPrice > 0;
    const discountPct = this.parseDiscountPercentage(row.discount_percentage, originalPrice, currentPrice);

    const isKosong = String(row.stock_status || '').toLowerCase().includes('kosong') || String(row.stock_status || '').toLowerCase().includes('out');
    const stockStatus: 'in_stock' | 'out_of_stock' = isKosong ? 'out_of_stock' : 'in_stock';
    const isAvailable = !isKosong;

    const isJsmItem = row.promo_type === 'JSM' || 
                      String(row.promo_badge || '').toUpperCase().includes('JSM') ||
                      String(row.promo_title || '').toUpperCase().includes('JSM') ||
                      String(row.category || '').toUpperCase().includes('JSM');

    const promoType = row.promo_type || (isJsmItem ? 'JSM' : undefined);
    const promoBadge = row.promo_badge || (isJsmItem ? 'PROMO JSM (3 HARI)' : (hasStrikethrough ? 'Diskon!' : undefined));
    const promoTitle = row.promo_title || row.campaign_title || (isJsmItem ? 'Promo Jumat Sabtu Minggu' : (hasStrikethrough ? 'Diskon Spesial' : undefined));
    const promoStartDate = row.promo_start_date || row.start_date;
    const promoEndDate = row.promo_end_date || row.end_date;



    return {
      extracted_brand: row.brand,
      extracted_name: row.product_name || 'Produk Tanpa Nama',
      variant: row.variant,
      package_size: row.package_size,
      current_price: currentPrice,
      original_price: originalPrice > 0 ? originalPrice : undefined,
      has_strikethrough_price: hasStrikethrough,
      strikethrough_price: originalPrice > 0 ? originalPrice : undefined,
      discount_percentage: discountPct,
      is_promo: hasStrikethrough || !!promoEndDate,
      promo_title: promoTitle,
      promo_start_date: promoStartDate,
      promo_end_date: promoEndDate,
      promo_badge: promoBadge,
      promo_type: promoType,
      discount_badge: discountPct ? `Diskon ${discountPct}%` : undefined,
      stock_status: stockStatus,
      is_available: isAvailable
    };
  }



  private convertToDetectedCard(row: ExcelRowProduct, idx: number): DetectedCard {
    const parsedData = this.rowToParsedData(row);

    return {
      id: `card_excel_${Date.now()}_${idx}`,
      cardIndex: idx,
      boundingBox: { x: 0, y: idx * 100, width: 100, height: 100 },
      cropImageUrl: row.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200',
      rawOcrText: `[Impor Excel] ${row.product_name}\nHarga: Rp ${row.price || 0}\nStok: ${row.stock_status || 'Tersedia'}`,
      extractedData: parsedData,
      normalizedData: {
        ...parsedData,
        normalized_name: parsedData.extracted_name,
        normalized_brand: parsedData.extracted_brand || 'Umum',
        normalized_unit: parsedData.package_size || 'pcs',
        normalized_size: parsedData.package_size || '88 g',
        normalized_price: parsedData.current_price,
        stock_status: parsedData.stock_status,
        is_available: parsedData.is_available
      },

      aiCorrectedData: {
        corrected_name: parsedData.extracted_name,
        corrected_brand: parsedData.extracted_brand || 'Umum',
        corrected_variant: parsedData.variant,
        is_corrected: true,
        correction_notes: 'Diimpor dari file Excel'
      },
      aiCategoryRecommendation: {
        category: row.category || 'Mi Instan',
        subcategory: row.category || 'Makanan Instan',
        tags: ['excel-import', row.brand || 'general'].filter(Boolean),
        keywords: [row.product_name, row.brand].filter(Boolean) as string[],
        shelf_group: row.category || 'Makanan Instan',
        confidence: 99
      },
      confidence: 100
    };
  }
}
