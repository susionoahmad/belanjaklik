/** Utilities for preserving ACCESSTRADE links and their traffic-source identity. */
export function normaliseSiteId(value?: string | null): string | null {
  const siteId = String(value || '').replace(/^\uFEFF/, '').trim();
  return siteId || null;
}

function decodeRepeatedly(value: string): string {
  let decoded = value;
  for (let i = 0; i < 3; i++) {
    try {
      const next = decodeURIComponent(decoded);
      if (next === decoded) break;
      decoded = next;
    } catch {
      break;
    }
  }
  return decoded;
}

export function extractSiteIdFromAffiliateUrl(url?: string | null): string | null {
  if (!url) return null;
  const decoded = decodeRepeatedly(String(url));
  const direct = decoded.match(/[?&]site_id=([^&#]+)/i);
  if (direct?.[1]) return normaliseSiteId(direct[1]);

  // Some Shopee redirects carry the publisher site ID in the generated
  // utm_content/sub_id value instead of a top-level site_id parameter.
  const trackingValue = decoded.match(/(?:utm_content|sub_id)=([^&#]+)/i)?.[1] || '';
  const embedded = trackingValue.match(/^(\d+)(?:-|$)/);
  return embedded?.[1] || null;
}

/** Feed URLs from ACCESSTRADE must be opened unchanged; do not wrap them again. */
export function preserveAffiliateUrl(url?: string | null): string {
  return String(url || '').trim();
}
