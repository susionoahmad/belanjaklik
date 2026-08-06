/**
 * Utility to safely open URLs and WhatsApp links without being blocked by browser popup blockers.
 * Supports synchronous opening with immediate fallback and asynchronous URL resolution using pre-opened windows.
 */

export interface OpenUrlOptions {
  target?: string;
  fallbackToCurrentTab?: boolean;
}

/**
 * Safely opens a URL synchronously.
 * If window.open is blocked by the browser popup blocker, automatically falls back to window.location.href.
 */
export function openUrl(url: string, options: OpenUrlOptions = {}): boolean {
  if (!url) return false;

  const target = options.target || '_blank';
  const fallback = options.fallbackToCurrentTab === true;

  try {
    const newWin = window.open(
      url,
      target,
      target === '_blank' ? 'noopener,noreferrer' : undefined
    );

    if (newWin && !newWin.closed && typeof newWin.closed !== 'undefined') {
      try {
        newWin.focus?.();
      } catch {}
      return true;
    }

    // Popup was blocked by browser. Fall back to anchor click in new window
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return true;
  } catch (err) {
    console.warn('[openUrl] window.open failed:', err);
    if (fallback) {
      window.location.href = url;
      return true;
    }
    try {
      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Safely opens a URL that requires asynchronous computation or network requests.
 * Synchronously pre-opens a window during the user interaction event to preserve user activation,
 * then navigates to the final URL once resolved.
 * Always maintains landing page context in current window.
 */
export async function openUrlAsync(
  asyncUrlResolver: () => Promise<string>,
  options: OpenUrlOptions = {}
): Promise<boolean> {
  const target = options.target || '_blank';
  const fallback = options.fallbackToCurrentTab === true;

  // 1. Synchronously pre-open popup window while user activation context is active
  let popupWin: Window | null = null;
  try {
    popupWin = window.open('about:blank', target);
    if (popupWin && popupWin.document) {
      popupWin.document.title = 'Mengarahkan ke Toko Virtual...';
      popupWin.document.body.style.fontFamily = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      popupWin.document.body.style.display = 'flex';
      popupWin.document.body.style.alignItems = 'center';
      popupWin.document.body.style.justifyContent = 'center';
      popupWin.document.body.style.height = '100vh';
      popupWin.document.body.style.margin = '0';
      popupWin.document.body.style.backgroundColor = '#f8fafc';
      popupWin.document.body.innerHTML = `
        <div style="text-align: center; padding: 24px; max-width: 360px; background: white; border-radius: 16px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1); border: 1px solid #e2e8f0;">
          <div style="width: 36px; height: 36px; border: 3px solid #e2e8f0; border-top-color: #2563eb; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 16px;"></div>
          <div style="font-size: 15px; font-weight: 700; color: #0f172a;">Mengarahkan ke Toko Virtual...</div>
          <div style="font-size: 12px; color: #64748b; margin-top: 6px;">Halaman akan otomatis dialihkan.</div>
        </div>
        <style>@keyframes spin { to { transform: rotate(360deg); } }</style>
      `;
    }
  } catch {
    popupWin = null;
  }

  try {
    const url = await asyncUrlResolver();
    if (!url) {
      if (popupWin && !popupWin.closed) popupWin.close();
      return false;
    }

    if (popupWin && !popupWin.closed && typeof popupWin.closed !== 'undefined') {
      popupWin.location.href = url;
      try {
        popupWin.focus?.();
      } catch {}
      return true;
    } else {
      if (fallback) {
        window.location.href = url;
        return true;
      }
      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return true;
    }
  } catch (err) {
    if (popupWin && !popupWin.closed) {
      popupWin.close();
    }
    throw err;
  }
}
