/**
 * A link an advertiser gave us, made safe and made readable.
 *
 * Only http and https survive: anything else - a javascript: URL above all -
 * is dropped rather than rendered, because these will one day be typed in by
 * advertisers rather than by us. A known network is named by its own name and
 * shown with its own mark, since a page slug says nothing to a farmer;
 * anything else is a website, shown as its bare domain.
 */
export type LinkKind = 'site' | 'facebook' | 'instagram' | 'youtube' | 'tiktok' | 'telegram';

export interface ReadableLink {
  href: string;
  kind: LinkKind;
  /** What the button says: "Facebook", "Instagram", or the site's domain. */
  text: string;
}

const NETWORKS: { kind: Exclude<LinkKind, 'site'>; hosts: string[]; text: string }[] = [
  { kind: 'facebook', hosts: ['facebook.com', 'fb.com', 'fb.me'], text: 'Facebook' },
  { kind: 'instagram', hosts: ['instagram.com', 'instagr.am'], text: 'Instagram' },
  { kind: 'youtube', hosts: ['youtube.com', 'youtu.be'], text: 'YouTube' },
  { kind: 'tiktok', hosts: ['tiktok.com'], text: 'TikTok' },
  { kind: 'telegram', hosts: ['t.me', 'telegram.me'], text: 'Telegram' },
];

export function readLink(raw: string | null): ReadableLink | null {
  if (!raw) return null;

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;

  const host = url.hostname.replace(/^(www|m|web)\./, '');
  const network = NETWORKS.find(({ hosts }) => hosts.some((h) => host === h || host.endsWith(`.${h}`)));
  if (network) return { href: url.href, kind: network.kind, text: network.text };
  return { href: url.href, kind: 'site', text: host };
}
