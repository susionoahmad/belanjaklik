import { OCRAdapter } from './OCRAdapter';
import type { RawOCRResult } from '../types';

export class GeminiVisionAdapter extends OCRAdapter {
  name = 'Gemini Vision OCR Adapter';

  // Prompt: explicit about price extraction
  private static readonly GEMINI_PROMPT =
    `You are an OCR tool for Indonesian grocery product cards. Analyze the image and extract ALL visible text.\n` +
    `IMPORTANT: You MUST find the price. Look for numbers like 2900, 14200, 44000, or text like "Rp 2.900" or "44.000".\n` +
    `Return ONLY this JSON (no markdown, no explanation):\n` +
    `{"product_name":"exact product name with brand and size","brand":"brand name","size":"package size e.g. 85g 1L 2L","current_price":14200,"original_price":null,"discount_percent":null,"promo_badge":null}\n` +
    `current_price: selling price as plain integer (e.g. 14200 not 14.200). original_price: strikethrough/harga coret price or null.`;

  // ─── Compress image to JPEG <512KB to avoid Gemini 400 ─────────────────────
  private async _compressImage(dataUrl: string): Promise<{ data: string; mimeType: string }> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        // Scale down if too large (max 800px wide)
        const MAX = 800;
        let { width, height } = img;
        if (width > MAX) {
          height = Math.round((height * MAX) / width);
          width = MAX;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, width, height);

        // Encode as JPEG 0.85 quality
        const compressed = canvas.toDataURL('image/jpeg', 0.85);
        const base64 = compressed.split(',')[1];
        console.log(`[GeminiVision] Image compressed: ${Math.round(base64.length / 1024)}KB`);
        resolve({ data: base64, mimeType: 'image/jpeg' });
      };
      img.onerror = () => {
        // Fallback: use original as-is
        const mimeType = dataUrl.startsWith('data:image/jpeg') ? 'image/jpeg' : 'image/png';
        const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
        resolve({ data: base64, mimeType });
      };
      img.src = dataUrl;
    });
  }

  // ─── Call Gemini API with 429 retry ────────────────────────────────────────
  private async _callGemini(
    model: string,
    apiKey: string,
    base64: string,
    mimeType: string,
    prompt?: string,
    maxTokens = 512
  ): Promise<{ ok: boolean; text?: string; error?: string; isRateLimit?: boolean }> {
    const body: Record<string, unknown> = {
      contents: [{
        parts: [
          { text: prompt ?? GeminiVisionAdapter.GEMINI_PROMPT },
          { inlineData: { mimeType, data: base64 } }
        ]
      }],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: maxTokens
      }
    };

    // thinkingConfig only for 2.5+ models (inside generationConfig)
    if (model.includes('2.5')) {
      (body.generationConfig as Record<string, unknown>).thinkingConfig = { thinkingBudget: 0 };
    }

    const attempt = async (): Promise<{ ok: boolean; text?: string; error?: string; isRateLimit?: boolean }> => {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
          }
        );

        const rawText = await res.text();

        if (res.status === 429) {
          console.warn(`[GeminiVision] ${model} rate limited (429), will retry after delay`);
          return { ok: false, isRateLimit: true, error: `${model}: Quota terlampaui` };
        }

        if (!res.ok) {
          let msg = `HTTP ${res.status}`;
          try { msg = JSON.parse(rawText)?.error?.message || msg; } catch { /* ignore */ }
          console.error(`[GeminiVision] ${model} → ${res.status}:`, rawText.slice(0, 300));
          return { ok: false, error: `${model}: ${msg}` };
        }

        const data = JSON.parse(rawText);
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
        console.log(`[GeminiVision] ${model} OK →`, text.slice(0, 150));
        return { ok: true, text };
      } catch (err) {
        console.error(`[GeminiVision] ${model} fetch error:`, err);
        return { ok: false, error: `${model}: network error` };
      }
    };

    // Try once, if rate limited wait 3s and retry once more
    const result = await attempt();
    if (result.isRateLimit) {
      await new Promise(r => setTimeout(r, 3000));
      return await attempt();
    }
    return result;
  }

  // ─── Full-screenshot batch OCR (1 call → all products) ───────────────────
  async processFullScreenshot(fullImageDataUrl: string, expectedCount: number): Promise<RawOCRResult[]> {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY?.trim();
    if (!apiKey || apiKey.length <= 20) return [];

    const BATCH_PROMPT =
      `This is a screenshot of an Indonesian grocery app (Alfamind) showing a product grid.\n` +
      `Find ALL product cards visible in the image. For each product card, extract:\n` +
      `- product_name: full name with brand and size/weight\n` +
      `- brand: brand name only\n` +
      `- size: package size (e.g. 2L, 85g, 1kg)\n` +
      `- current_price: the SELLING price as a plain integer (e.g. 42500 for "Rp 42.500")\n` +
      `- original_price: strikethrough/crossed-out price as integer, or null\n` +
      `- discount_percent: discount percentage as integer, or null\n` +
      `- promo_badge: promotional label text or null\n\n` +
      `CRITICAL: You MUST extract the price shown on each card. Prices are typically in thousands (e.g. 2.900, 14.200, 42.500, 44.000).\n` +
      `Return ONLY a JSON array of ${expectedCount} objects. No markdown, no explanation:\n` +
      `[{"product_name":"...","brand":"...","size":"...","current_price":42500,"original_price":null,"discount_percent":null,"promo_badge":null},...]`;

    const { data: base64, mimeType } = await this._compressImage(fullImageDataUrl);
    const result = await this._callGemini('gemini-2.5-flash', apiKey, base64, mimeType, BATCH_PROMPT, 2048);

    if (!result.ok || !result.text) {
      // Try fallback model
      const r2 = await this._callGemini('gemini-2.0-flash', apiKey, base64, mimeType, BATCH_PROMPT, 2048);
      if (!r2.ok || !r2.text) return [];
      return this._parseBatchResponse(r2.text);
    }

    return this._parseBatchResponse(result.text);
  }

  private _parseBatchResponse(raw: string): RawOCRResult[] {
    try {
      const cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
      const start = cleaned.indexOf('[');
      const end = cleaned.lastIndexOf(']');
      if (start === -1 || end === -1) return [];

      const arr = JSON.parse(cleaned.slice(start, end + 1)) as Record<string, unknown>[];
      return arr.map(p => {
        const lines = this._buildLines(p);
        return { text: lines.join('\n'), confidence: 96, lines };
      });
    } catch (err) {
      console.error('[GeminiVision] Batch JSON parse failed:', err);
      return [];
    }
  }

  // ─── Main entry point ───────────────────────────────────────────────────────
  async processImage(cropImageUrl: string): Promise<RawOCRResult> {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY?.trim();

    if (!apiKey || apiKey.length <= 20) {
      console.warn('[GeminiVision] API key missing or invalid');
      return this._noKeyFallback();
    }

    if (!cropImageUrl.startsWith('data:image')) {
      // Demo sample URL — use preset
      return this._sampleFallback(cropImageUrl);
    }

    // Compress image before sending
    const { data: base64, mimeType } = await this._compressImage(cropImageUrl);

    // Try models in order
    const MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
    const errors: string[] = [];

    for (const model of MODELS) {
      const result = await this._callGemini(model, apiKey, base64, mimeType);
      if (result.ok && result.text) {
        const parsed = this._parseJSON(result.text);
        if (parsed) {
          const lines = this._buildLines(parsed);
          return { text: lines.join('\n'), confidence: 97, lines };
        }
        // Raw text fallback
        const lines = result.text.split('\n').filter(l => l.trim());
        return { text: result.text, confidence: 82, lines };
      }
      errors.push(result.error ?? model);
    }

    // All failed
    const errSummary = errors.join(' | ');
    console.error('[GeminiVision] All models failed:', errSummary);
    return this._errorFallback(errSummary);
  }

  // ─── JSON Parser ─────────────────────────────────────────────────────────
  private _parseJSON(raw: string): Record<string, unknown> | null {
    try {
      const cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
      const start = cleaned.indexOf('{');
      const end = cleaned.lastIndexOf('}');
      if (start === -1 || end === -1) return null;
      return JSON.parse(cleaned.slice(start, end + 1));
    } catch {
      return null;
    }
  }

  private _buildLines(p: Record<string, unknown>): string[] {
    const lines: string[] = [];

    // Helper: parse price safely (handles integer, float, OR Indonesian string "2.900")
    const parsePrice = (val: unknown): number => {
      if (typeof val === 'number' && val > 0) return Math.round(val);
      if (typeof val === 'string' && val.trim()) {
        // Strip all non-digit chars → "Rp 2.900" → "2900" → 2900
        const digits = val.replace(/[^0-9]/g, '');
        return parseInt(digits, 10) || 0;
      }
      return 0;
    };

    let currentPrice = parsePrice(p.current_price);
    let originalPrice = parsePrice(p.original_price);
    const discount = p.discount_percent ? parseInt(String(p.discount_percent), 10) : 0;

    // Collect all raw lines provided by AI
    const rawLines: string[] = Array.isArray(p.all_lines)
      ? (p.all_lines as string[]).filter(l => Boolean(l && String(l).trim()))
      : [];

    // Fallback: if currentPrice is 0, extract price from rawLines
    if (currentPrice === 0 && rawLines.length > 0) {
      for (const line of rawLines) {
        const matches = line.match(/(?:Rp\.?\s*)?(\d{1,3}(?:[\.,]\d{3})+|\d{3,7})/gi);
        if (matches) {
          for (const m of matches) {
            const num = parseInt(m.replace(/[^0-9]/g, ''), 10);
            if (!isNaN(num) && num >= 500 && num <= 5000000) {
              currentPrice = num;
              break;
            }
          }
        }
        if (currentPrice > 0) break;
      }
    }

    if (p.product_name) lines.push(String(p.product_name));

    // Include raw lines for ProductParser context
    for (const rl of rawLines) {
      if (rl && !lines.includes(rl)) {
        lines.push(rl);
      }
    }

    if (currentPrice > 0) lines.push(`Rp ${currentPrice}`);
    if (originalPrice > 0 && originalPrice !== currentPrice) lines.push(`Rp ${originalPrice} (Harga Coret)`);
    if (discount > 0) lines.push(`Diskon ${discount}%`);
    if (p.promo_badge) lines.push(String(p.promo_badge));

    return lines.filter(l => l.trim());
  }

  // ─── Fallbacks ────────────────────────────────────────────────────────────
  private _errorFallback(reason: string): RawOCRResult {
    const lines = [`[OCR Gagal: ${reason}]`, 'Isi manual di kolom tabel'];
    return { text: lines.join('\n'), confidence: 0, lines };
  }

  private _noKeyFallback(): RawOCRResult {
    const lines = [
      '[GEMINI API KEY belum diisi]',
      'Set VITE_GEMINI_API_KEY di .env (format: AIzaSy...)',
      'Dapatkan gratis: aistudio.google.com/apikey'
    ];
    return { text: lines.join('\n'), confidence: 0, lines };
  }

  private _sampleFallback(url: string): RawOCRResult {
    const idx = parseInt(url.match(/#idx_(\d+)/)?.[1] ?? '0', 10);
    const lower = url.toLowerCase();

    const presets: Record<string, string[][]> = {
      snack: [
        ['Indomie Goreng Spesial 85g', 'Rp 2.900', 'BEST SELLER'],
        ['Chitato Sapi Panggang 68g', 'Rp 9.900', 'Rp 11.200 (Harga Coret)', 'Diskon 12%', 'PROMO'],
        ['Kapal Api Kopi Bubuk 165g', 'Rp 14.200'],
        ['Ultra Milk Full Cream 1L', 'Rp 18.900']
      ],
      oil: [
        ['Fortune Minyak Goreng Pouch 2L', 'Rp 42.500', 'Rp 42.600 (Harga Coret)', 'Diskon 1%'],
        ['FILMA Minyak Goreng Pouch 2L', 'Rp 44.000'],
        ['Bimoli Minyak Goreng Pouch 2L', 'Rp 42.800'],
        ['Vipco Minyak Goreng Pouch 2L', 'Rp 42.400']
      ],
      sembako: [
        ['Beras Sania Premium 5kg', 'Rp 69.900', 'Rp 74.000 (Harga Coret)', 'Diskon 5%'],
        ['Gulaku Gula Pasir Hijau 1kg', 'Rp 16.800'],
        ['Aqua Air Mineral 600ml', 'Rp 3.000'],
        ['Rinso Anti Noda Deterjen 770g', 'Rp 21.900']
      ],
      multi: [
        ['Vaseline Hand Body Lotion 200ml', 'Rp 28.900', 'Rp 32.000 (Harga Coret)', 'Diskon 10%'],
        ['Lifebuoy Sabun Mandi Cair 450ml', 'Rp 22.500', 'Rp 26.000 (Harga Coret)', 'Diskon 13%'],
        ["Pond's Facial Foam Bright 100g", 'Rp 31.500'],
        ['Sunsilk Shampoo Soft Smooth 160ml', 'Rp 24.000']
      ]
    };

    let group = presets.snack;
    if (lower.includes('oil') || lower.includes('minyak') || lower.includes('s1') || lower.includes('1474')) group = presets.oil;
    else if (lower.includes('beras') || lower.includes('s3') || lower.includes('1586')) group = presets.sembako;
    else if (lower.includes('multi') || lower.includes('s4') || lower.includes('1607')) group = presets.multi;

    const selected = group[idx % group.length];
    return { text: selected.join('\n'), confidence: 98, lines: [...selected] };
  }
}
