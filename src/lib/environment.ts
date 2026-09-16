/**
 * In-app browsers — the WebView you land in when you tap a link inside
 * Messenger, Instagram or Facebook — usually cannot answer the Geolocation
 * API at all. The host app either never asked the operating system for
 * location permission, or does not hand it down to the WebView, and no amount
 * of JavaScript on our side can grant it.
 *
 * So the app does not try to fight it. It detects the situation, says so
 * plainly, and gives two ways out: pick the location by name on the map
 * (which needs no permission at all), or jump to the real browser.
 */

export type InAppBrowser = 'messenger' | 'facebook' | 'instagram' | 'other';

const SIGNATURES: { pattern: RegExp; kind: InAppBrowser }[] = [
  // Messenger's own WebView; FB_IAB=in-app browser, FBAN/FBAV=app + version.
  { pattern: /\bMessenger\b|FB_IAB\/MESSENGER/i, kind: 'messenger' },
  { pattern: /\bInstagram\b/i, kind: 'instagram' },
  { pattern: /FBAN|FBAV|FB_IAB|FBIOS/i, kind: 'facebook' },
  { pattern: /\bLine\/|MicroMessenger|\bTwitter\b|TikTok|musical_ly|\bViber\b/i, kind: 'other' },
];

export function detectInAppBrowser(): InAppBrowser | null {
  if (typeof navigator === 'undefined') return null;
  const ua = navigator.userAgent;

  for (const { pattern, kind } of SIGNATURES) {
    if (pattern.test(ua)) return kind;
  }

  // Bare Android WebView: "; wv)" and no Chrome browser branding.
  if (/Android/.test(ua) && /; wv\)/.test(ua)) return 'other';

  return null;
}

export const IN_APP_LABELS: Record<InAppBrowser, string> = {
  messenger: 'Messenger',
  facebook: 'Facebook',
  instagram: 'Instagram',
  other: 'հավելվածի ներսի բրաուզեր',
};

export function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    // iPadOS 13+ reports itself as a Mac with a touch screen.
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
}

export function isAndroid(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Android/.test(navigator.userAgent);
}

/**
 * Tries to hand the current page to the device's real browser.
 *
 * Both routes are best-effort — the host app can swallow them silently, and
 * there is no callback telling us whether it worked. The caller should always
 * keep the copy-link fallback visible rather than assuming success.
 */
export function openInExternalBrowser(): boolean {
  const { href, host, pathname, search } = window.location;

  try {
    if (isAndroid()) {
      // Android intent URL: hand the https link to Chrome explicitly.
      window.location.href =
        `intent://${host}${pathname}${search}#Intent;scheme=https;` +
        `package=com.android.chrome;S.browser_fallback_url=${encodeURIComponent(href)};end`;
      return true;
    }

    if (isIOS()) {
      // Undocumented but long-standing: opens the URL in Safari.
      window.location.href = `x-safari-https://${host}${pathname}${search}`;
      return true;
    }
  } catch {
    return false;
  }

  return false;
}

export async function copyCurrentLink(): Promise<boolean> {
  const url = window.location.href;

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url);
      return true;
    }
  } catch {
    // Clipboard API is blocked in some WebViews; fall through to the old way.
  }

  try {
    const field = document.createElement('textarea');
    field.value = url;
    field.setAttribute('readonly', '');
    field.style.position = 'fixed';
    field.style.opacity = '0';
    document.body.appendChild(field);
    field.select();
    const copied = document.execCommand('copy');
    document.body.removeChild(field);
    return copied;
  } catch {
    return false;
  }
}
