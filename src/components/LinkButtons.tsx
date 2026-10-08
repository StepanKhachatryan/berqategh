import type { LinkKind, ReadableLink } from '../lib/links';
import { IconFacebook, IconGlobe, IconInstagram, IconTelegramBrand, IconTikTok, IconYouTube } from './Icons';

const MARKS: Record<LinkKind, JSX.Element> = {
  site: <IconGlobe />,
  facebook: <IconFacebook />,
  instagram: <IconInstagram />,
  youtube: <IconYouTube />,
  tiktok: <IconTikTok />,
  telegram: <IconTelegramBrand />,
};

/**
 * An advertiser's website and pages, one button each with the network's own
 * mark - recognised before it is read, the way the messenger buttons are.
 */
export default function LinkButtons({ links }: { links: ReadableLink[] }) {
  if (links.length === 0) return null;
  return (
    <div className="link-row">
      {links.map((link) => (
        <a
          key={link.href}
          className={`link-btn link-${link.kind}`}
          href={link.href}
          target="_blank"
          rel="noreferrer noopener"
        >
          {MARKS[link.kind]}
          <span>{link.text}</span>
        </a>
      ))}
    </div>
  );
}
