import type { AffiliateProduct } from '../types';

export interface CapturedAffiliateProduct extends Partial<AffiliateProduct> {
  name: string;
  affiliate_url: string;
}

const captureScript = `(() => {
  const text = (el) => (el?.innerText || '').replace(/\\s+/g, ' ').trim();
  const money = (value) => { const m = String(value || '').match(/Rp\\s*([\\d.]+)/i); return m ? Number(m[1].replace(/\\./g, '')) : undefined; };
  const cards = [...document.querySelectorAll('a,button,[role=button],div,span')].filter(el => /get\\s*link/i.test(text(el)) && text(el).length < 40 && el.children.length < 4);
  const products = cards.map((linkButton, index) => {
    let card = linkButton;
    for (let i = 0; i < 12 && card.parentElement; i++) {
      const candidate = card.parentElement;
      if (candidate.querySelector('img') && /Rp/i.test(text(candidate))) { card = candidate; break; }
      card = candidate;
    }
    const raw = text(card);
    const prices = [...raw.matchAll(/Rp\\s*[\\d.]+/gi)].map(m => money(m[0])).filter(Boolean);
    const discount = raw.match(/(\\d+(?:[.,]\\d+)?)\\s*%/);
    const commissionLine = raw.match(/(?:Up to|Komisi)[^%]{0,30}(\\d+(?:[.,]\\d+)?)\\s*%/i);
    const image = card.querySelector('img')?.src || '';
    const productLink = [...card.querySelectorAll('a[href]')].map(a => a.href).find(h => /tokopedia|shopee|lazada|tiktok/i.test(h)) || '';
    const lines = (card.innerText || '').split(/\\n+/).map(v => v.trim()).filter(Boolean);
    const name = lines.find(v => !/^Rp|GET LINK|Up to|Earn|Tersedia|[\\d.,]+%/i.test(v) && v.length > 5) || '';
    const affiliateUrl = linkButton.href || linkButton.dataset.href || linkButton.getAttribute('data-url') || [...card.querySelectorAll('a[href]')].map(a => a.href).find(h => /atid|accesstrade/i.test(h)) || (productLink ? 'https://accesstrade.co.id/click?site_id=127950&url=' + encodeURIComponent(productLink) + '&sub_id=belanjaklik_app' : '');
    return { name, merchant: /tokopedia/i.test(location.hostname) ? 'tokopedia' : 'other', product_url: productLink || null, affiliate_url: affiliateUrl, image_url: image || null, price: prices[0], original_price: prices[1], discount_percent: discount ? Number(discount[1].replace(',', '.')) : undefined, commission_rate: commissionLine ? Number(commissionLine[1].replace(',', '.')) : undefined, shop_name: lines.find(v => /store|shop|official/i.test(v)) || null, source: 'accesstrade_browser_capture', campaign_id: 'accesstrade', site_id: '127950', site_url: 'https://belanjaklik.my.id', is_active: true };
  }).filter(p => p.name && (p.affiliate_url || p.product_url));
  const payload = JSON.stringify({ source: 'accesstrade_browser_capture', products });\n  const target = '__TARGET__';\n  const encoded = btoa(unescape(encodeURIComponent(payload)));\n  if (target) window.open(target + '#affiliate-capture=' + encodeURIComponent(encoded), '_blank');
  navigator.clipboard?.writeText(payload).then(() => alert('Belanjaklik: ' + products.length + ' produk disalin. Kembali ke Admin lalu klik Import Clipboard.')).catch(() => prompt('Salin data ini ke Belanjaklik:', payload));
})();`;

export function getAccesstradeCaptureBookmarklet(targetOrigin = 'https://belanjaklik.my.id/admin'): string {
  const script = captureScript.replace('__TARGET__', targetOrigin.replace(/'/g, '%27'));
  return `javascript:${encodeURIComponent(script).replace(/%20/g, ' ')}`;
}
export function readAffiliateCaptureFromHash(): CapturedAffiliateProduct[] {
  const encoded = new URLSearchParams(window.location.hash.replace(/^#/, '')).get('affiliate-capture');
  if (!encoded) return [];
  const payload = decodeURIComponent(encoded);
  const raw = decodeURIComponent(escape(atob(payload)));
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed?.products)) throw new Error('Payload capture tidak valid.');
  return parsed.products.filter((p: CapturedAffiliateProduct) => p.name?.trim() && p.affiliate_url?.trim());
}
export async function readCapturedAffiliateProducts(): Promise<CapturedAffiliateProduct[]> {
  const raw = await navigator.clipboard.readText();
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed?.products)) throw new Error('Clipboard tidak berisi hasil capture ACCESSTRADE.');
  const products = parsed.products.filter((p: CapturedAffiliateProduct) => p.name?.trim() && p.affiliate_url?.trim());
  if (!products.length) throw new Error('Tidak ada produk valid pada hasil capture.');
  return products;
}