/**
 * ImageProxyService
 * Routes image URLs through a multi-provider CORS proxy pipeline so that
 * images from tokovirtualku.id (and similar hotlink-protected hosts) can be
 * displayed directly inside the browser on localhost and other origins.
 */

const BLOCKED_DOMAINS = [
  'wsrv.nl',
  'weserv.nl',
  'allorigins.win',
  'codetabs.com',
  'corsproxy.io',
  'thingproxy',
  'unsplash.com',  // Our placeholder images don't need proxying
  'supabase',      // Supabase Storage URLs are already public
  'localhost',
  '127.0.0.1'
];

/** Whether a URL needs to be proxied in the current environment. */
function needsProxy(url: string): boolean {
  if (!url || !url.startsWith('http')) return false;
  try {
    const u = new URL(url);
    if (BLOCKED_DOMAINS.some(d => u.hostname.includes(d))) return false;
    return true;
  } catch {
    return false;
  }
}

/**
 * Returns the best proxy URL for the given image source.
 * Automatically unwraps nested/double proxy URLs to prevent 404 errors.
 */
export function proxyImageUrl(originalUrl: string): string {
  if (!originalUrl || typeof originalUrl !== 'string') return '';
  
  let cleanUrl = originalUrl.trim();
  
  // Unwrap nested/double wsrv.nl or weserv.nl proxy URLs if present
  while (cleanUrl.includes('wsrv.nl/?url=') || cleanUrl.includes('weserv.nl/?url=')) {
    try {
      const match = cleanUrl.match(/[?&]url=([^&]+)/);
      if (match && match[1]) {
        cleanUrl = decodeURIComponent(match[1]);
      } else {
        break;
      }
    } catch {
      break;
    }
  }

  if (!needsProxy(cleanUrl)) return cleanUrl;

  return `https://wsrv.nl/?url=${encodeURIComponent(cleanUrl)}`;
}

/**
 * Proxi-fies an array of image URLs. Deduplicates and filters empty values.
 */
export function proxyImageUrls(urls: string[]): string[] {
  if (!Array.isArray(urls)) return [];
  return [...new Set(urls.filter(Boolean).map(proxyImageUrl))];
}
