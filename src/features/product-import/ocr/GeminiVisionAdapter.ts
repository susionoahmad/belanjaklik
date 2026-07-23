import { OCRAdapter } from './OCRAdapter';
import type { RawOCRResult } from '../types';

export class GeminiVisionAdapter extends OCRAdapter {
  name = 'Gemini Vision OCR Adapter';

  private static readonly GEMINI_PROMPT = `You are an expert OCR engine for Indonesian grocery/retail store screenshots.

Analyze this product card image carefully and extract ALL visible text.

Return a JSON object with this exact structure:
{
  "product_name": "Full product name including brand, variant, size (e.g. Indomie Goreng Spesial 85g)",
  "brand": "Brand name only (e.g. Indomie, Kapal Api, Ultra Milk)",
  "variant": "Variant/flavor if any (e.g. Goreng Spesial, Sapi Panggang, Full Cream)",
  "size": "Package size (e.g. 85g, 1L, 165g, 68g)",
  "current_price": 2900,
  "original_price": null,
  "has_strikethrough": false,
  "discount_percent": null,
  "promo_badge": null,
  "all_text_lines": ["line1", "line2", "line3"]
}

Rules:
- current_price: the promotional/selling price as an integer (without Rp or dots)
- original_price: the crossed-out / strikethrough price as integer, or null if none
- has_strikethrough: true if there is a price with strikethrough/harga coret
- discount_percent: integer like 12 for 12%, or null
- promo_badge: promo label text or null
- all_text_lines: every line of text visible in the image
- Use Indonesian product names exactly as shown
- If a field cannot be determined, use null

Return ONLY the JSON object, no markdown, no explanation.`;

  async processImage(cropImageUrl: string): Promise<RawOCRResult> {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY?.trim();

    // Only try Gemini API if key is present AND we have real image data
    if (apiKey && apiKey.length > 20 && cropImageUrl.startsWith('data:image')) {
      try {
        const base64Data = cropImageUrl.includes(',')
          ? cropImageUrl.split(',')[1]
          : cropImageUrl;

        const mimeType = cropImageUrl.startsWith('data:image/jpeg') ? 'image/jpeg' : 'image/png';

        // Try models in order: 2.5-flash → 2.0-flash (fallback)
        const MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash'];
        let response: Response | null = null;
        let lastError = '';

        for (const model of MODELS) {
          try {
            response = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  contents: [{
                    parts: [
                      { text: GeminiVisionAdapter.GEMINI_PROMPT },
                      { inlineData: { mimeType: mimeType, data: base64Data } }
                    ]
                  }],
                  generationConfig: {
                    temperature: 0.1,
                    maxOutputTokens: 1024
                  },
                  // Disable thinking for speed (2.5-flash supports this)
                  ...(model.includes('2.5') ? { thinkingConfig: { thinkingBudget: 0 } } : {})
                })
              }
            );
            if (response.ok) {
              console.log(`[GeminiVision] Using model: ${model}`);
              break;
            }
            const errText = await response.text();
            lastError = `${model} → ${response.status}`;
            console.warn(`[GeminiVision] ${model} failed (${response.status}):`, errText);
            response = null; // reset for next iteration
          } catch (fetchErr) {
            lastError = `${model} → network error`;
            console.warn(`[GeminiVision] ${model} fetch error:`, fetchErr);
          }
        }

        // All models failed
        if (!response) {
          return this._errorFallback(`Semua model gagal: ${lastError}`);
        }

        if (!response.ok) {
          const errBody = await response.text();
          let errMsg = `API Error ${response.status}`;
          try {
            const errJson = JSON.parse(errBody);
            errMsg = errJson?.error?.message || errMsg;
          } catch { /* ignore */ }
          console.error('[GeminiVision] API error', response.status, errBody);
          return this._errorFallback(errMsg);
        }

        const data = await response.json();
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

        // Parse structured JSON response
        const parsed = this._parseGeminiJSON(rawText);
        if (parsed) {
          const lines = this._buildLines(parsed);
          return {
            text: lines.join('\n'),
            confidence: 97,
            lines
          };
        }

        // JSON parse failed, still use raw text
        console.warn('[GeminiVision] JSON parse failed, using raw text:', rawText);
        const lines = rawText.split('\n').filter((l: string) => l.trim().length > 0);
        return { text: rawText, confidence: 85, lines };

      } catch (err) {
        console.error('[GeminiVision] Network/fetch error:', err);
        return this._errorFallback('Network Error');
      }
    }

    // No API key or not a real image → show clear message
    if (!apiKey || apiKey.length <= 20) {
      console.warn('[GeminiVision] API key not configured. Set VITE_GEMINI_API_KEY in .env');
      return this._noKeyFallback();
    }

    // URL-based image (demo sample) → use preset
    return this._sampleFallback(cropImageUrl);
  }

  // ─── JSON Parser ───────────────────────────────────────────────────────────

  private _parseGeminiJSON(raw: string): Record<string, unknown> | null {
    try {
      // Strip any markdown code fences
      const cleaned = raw
        .replace(/```json\s*/gi, '')
        .replace(/```\s*/g, '')
        .trim();

      // Find first { to last }
      const start = cleaned.indexOf('{');
      const end = cleaned.lastIndexOf('}');
      if (start === -1 || end === -1) return null;

      return JSON.parse(cleaned.slice(start, end + 1));
    } catch {
      return null;
    }
  }

  private _buildLines(parsed: Record<string, unknown>): string[] {
    const lines: string[] = [];

    if (parsed.product_name) lines.push(String(parsed.product_name));
    if (parsed.current_price) lines.push(`Rp ${Number(parsed.current_price).toLocaleString('id-ID')}`);
    if (parsed.original_price) lines.push(`Rp ${Number(parsed.original_price).toLocaleString('id-ID')} (Harga Coret)`);
    if (parsed.discount_percent) lines.push(`Diskon ${parsed.discount_percent}%`);
    if (parsed.promo_badge) lines.push(String(parsed.promo_badge));

    // Add all_text_lines that aren't already included
    if (Array.isArray(parsed.all_text_lines)) {
      const existing = new Set(lines.map(l => l.toLowerCase()));
      for (const tl of parsed.all_text_lines as string[]) {
        if (tl && !existing.has(tl.toLowerCase())) {
          lines.push(tl);
        }
      }
    }

    return lines.filter(l => l.trim().length > 0);
  }

  // ─── Fallbacks ─────────────────────────────────────────────────────────────

  private _errorFallback(reason: string): RawOCRResult {
    const lines = [`[OCR Gagal: ${reason}]`, 'Isi manual di kolom tabel'];
    return { text: lines.join('\n'), confidence: 0, lines };
  }

  private _noKeyFallback(): RawOCRResult {
    const lines = [
      '[GEMINI API KEY belum diisi]',
      'Isi VITE_GEMINI_API_KEY di file .env',
      'Dapatkan gratis: aistudio.google.com/apikey'
    ];
    return { text: lines.join('\n'), confidence: 0, lines };
  }

  // Sample preset images (for demo buttons only)
  private _sampleFallback(url: string): RawOCRResult {
    const idx = parseInt(url.match(/#idx_(\d+)/)?.[1] ?? '0', 10);
    const lower = url.toLowerCase();

    const presets: Record<string, string[][]> = {
      snack: [
        ['Indomie Goreng Spesial 85g', 'Rp 2.900', 'BEST SELLER'],
        ['Chitato Sapi Panggang 68g', 'Rp 9.900', 'Rp 11.200 (Harga Coret)', 'Diskon 12%', 'PROMO HARGA CORET'],
        ['Kapal Api Kopi Bubuk 165g', 'Rp 14.200'],
        ['Ultra Milk Full Cream 1L', 'Rp 18.900']
      ],
      oil: [
        ['Fortune Minyak Goreng Pouch 2L', 'Rp 42.500', 'Rp 42.600 (Harga Coret)', 'Diskon 1%', 'PROMO HARGA CORET'],
        ['FILMA Minyak Goreng Pouch 2L', 'Rp 44.000'],
        ['Bimoli Minyak Goreng Pouch 2L', 'Rp 42.800'],
        ['Vipco Minyak Goreng Pouch 2L', 'Rp 42.400']
      ],
      sembako: [
        ['Beras Sania Premium 5kg', 'Rp 69.900', 'Rp 74.000 (Harga Coret)', 'Diskon 5%', 'PROMO SEMBAKO'],
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

    let group: string[][] = presets.snack;
    if (lower.includes('oil') || lower.includes('minyak') || lower.includes('s1') || lower.includes('1474')) group = presets.oil;
    else if (lower.includes('snack') || lower.includes('s2') || lower.includes('1612')) group = presets.snack;
    else if (lower.includes('beras') || lower.includes('s3') || lower.includes('1586')) group = presets.sembako;
    else if (lower.includes('multi') || lower.includes('s4') || lower.includes('1607')) group = presets.multi;

    const selected = group[idx % group.length];
    return { text: selected.join('\n'), confidence: 98, lines: [...selected] };
  }
}
