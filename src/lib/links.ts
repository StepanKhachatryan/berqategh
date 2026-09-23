/**
 * A link an advertiser gave us, made safe and made readable.
 *
 * Only http and https survive: anything else - a javascript: URL above all -
 * is dropped rather than rendered, because these will one day be typed in by
 * advertisers rather than by us. Facebook is named as Facebook, since the page
 * slug says nothing to a farmer; anything else is shown as its bare domain.
 */
export interface ReadableLink {
  href: string;
  /** The row's label: "Facebook" or "Կայք". */
  label: string;
  text: string;
}

export function readLink(raw: string | null): ReadableLink | null {
  if (!raw) return null;

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;

  const host = url.hostname.replace(/^www\./, '').replace(/^m\./, '');
  if (host === 'facebook.com' || host === 'fb.com' || host.endsWith('.facebook.com')) {
    return { href: url.href, label: 'Facebook', text: 'Բացել Facebook էջը' };
  }
  return { href: url.href, label: 'Կայք', text: host };
}
