import type { CSSProperties } from 'react';
import Modal from './Modal';
import ContactRow from './ContactRow';
import { readLink } from '../lib/links';
import { IconCheck, IconPin, IconWarn } from './Icons';
import {
  livePromotion,
  OFFERINGS,
  primaryOffering,
  type AgriService,
  type PremiumProfile,
} from '../data/services';

interface PremiumServiceSheetProps {
  service: AgriService & { premium: PremiumProfile };
  onClose: () => void;
}

/*
 * Written out rather than asked of Intl: browsers disagree about Armenian
 * date order, and "մինչև դեկտեմբերի 31-ը" is the form a person would say.
 */
const MONTHS_GENITIVE = [
  'հունվարի',
  'փետրվարի',
  'մարտի',
  'ապրիլի',
  'մայիսի',
  'հունիսի',
  'հուլիսի',
  'օգոստոսի',
  'սեպտեմբերի',
  'հոկտեմբերի',
  'նոյեմբերի',
  'դեկտեմբերի',
];

/*
 * Prices are the advertiser's own words, so they cannot be split into parts
 * reliably - but the only places a narrow card may break them are between
 * words, never inside "1 200", between a number and its ֏, or either side of
 * the slash in "֏/պարկ". Non-breaking spaces and word joiners there leave
 * "սկսած" as the only thing that can go to its own line.
 */
function keepTogether(price: string): string {
  return price
    .replace(/(\d) (?=\d)/g, '$1\u00A0')
    .replace(/ ֏/g, '\u00A0֏')
    .replace(/\//g, '\u2060/\u2060');
}

/*
 * A highlight is written as "🚚 Առաքում մարզով մեկ". The leading symbol is
 * pulled out so it can sit beside the text instead of wrapping with it; a
 * highlight written without one is shown as text alone.
 */
function splitHighlight(text: string): { icon: string | null; label: string } {
  const match = text.match(/^(\p{Extended_Pictographic}\uFE0F?)\s*(.*)$/u);
  return match ? { icon: match[1], label: match[2] } : { icon: null, label: text };
}

function untilText(isoDate: string): string {
  const [, month, day] = isoDate.split('-').map(Number);
  return `Գործում է մինչև ${MONTHS_GENITIVE[month - 1]} ${day}-ը`;
}

/**
 * A premium advertiser's card: theirs, not ours.
 *
 * The regular sheet is a form - rows of facts under a plain heading, the same
 * for every business, which is right when nobody is paying to stand out. This
 * one is built the way the big map directories build what they sell to
 * businesses, piece by piece:
 *
 *   - a cover in the advertiser's own colour, with their mark, their name and
 *     one line of their own words, as 2GIS sells a logo, a cover image and a
 *     line of ad copy;
 *   - up to six short highlights, as Yelp sells business highlights;
 *   - a running promotion with its end date, as Yandex sells promotions on the
 *     card;
 *   - what they sell as a carousel with prices, as Yandex sells a showcase of
 *     up to ten items;
 *   - and the call to action fixed to the bottom of the card, where it stays
 *     however far the farmer scrolls, which is what every one of them sells
 *     first.
 *
 * Marked «Գովազդ» on the cover. The same platforms all label paid placement,
 * and Armenian advertising law requires advertising to be recognisable as
 * advertising - so the card that looks most like the advertiser's own is the
 * one that most needs to say so.
 */
export default function PremiumServiceSheet({ service, onClose }: PremiumServiceSheetProps) {
  const { premium } = service;
  const brand = premium.brandColor;
  const promotion = livePromotion(service);
  const link = readLink(service.link);
  const mark = primaryOffering(service).emoji;

  const point = `${service.lat.toFixed(5)},${service.lng.toFixed(5)}`;
  const yandexUrl = `https://yandex.com/maps/?rtext=~${point}&rtt=auto&z=16`;
  const googleUrl = `https://www.google.com/maps/dir/?api=1&destination=${point}`;

  // The brand colour and two tints of it, as 8-digit hex rather than
  // color-mix(), which older Safari does not have.
  const brandStyle = {
    '--brand': brand,
    '--brand-soft': `${brand}14`,
    '--brand-line': `${brand}33`,
  } as CSSProperties;

  const hero = (
    <div className="ph" style={brandStyle}>
      {/* Stands in for a cover photograph until advertisers supply one. */}
      <span className="ph-watermark" aria-hidden="true">
        {mark}
      </span>

      <div className="ph-labels">
        <span className="ph-ad">Գովազդ</span>
        {premium.verified ? (
          <span className="ph-verified">
            <IconCheck size={12} />
            Ստուգված գործընկեր
          </span>
        ) : null}
      </div>

      <div className="ph-identity">
        <div className="ph-logo" aria-hidden="true">
          {mark}
        </div>
        <div className="ph-names">
          <h2 className="ph-name">{service.name}</h2>
          <p className="ph-tagline">{premium.tagline}</p>
        </div>
      </div>
    </div>
  );

  return (
    <Modal
      title={service.name}
      hero={hero}
      onClose={onClose}
      footer={
        service.phone ? (
          <div className="premium-cta">
            <ContactRow phone={service.phone} />
          </div>
        ) : undefined
      }
    >
      <div className="premium-body" style={brandStyle}>
        {service.trial ? (
          <p className="trial-note" style={{ marginTop: 0, marginBottom: 14 }}>
            <IconWarn size={15} />
            Փորձնական գրառում։ Այս քարտը ցուցադրական է, իրական ընկերություն, ակցիա կամ
            գներ չի ներկայացնում, և հեռախոսահամարը գոյություն չունի։
          </p>
        ) : null}

        {premium.highlights.length > 0 ? (
          <ul className="ph-highlights">
            {premium.highlights.slice(0, 6).map((text) => {
              const { icon, label } = splitHighlight(text);
              return (
                <li key={text}>
                  {icon ? (
                    <span className="ph-highlight-icon" aria-hidden="true">
                      {icon}
                    </span>
                  ) : null}
                  <span>{label}</span>
                </li>
              );
            })}
          </ul>
        ) : null}

        {promotion ? (
          <div className="promo">
            <span className="promo-tag">🏷️ Ակցիա</span>
            <strong className="promo-title">{promotion.title}</strong>
            <p className="promo-detail">{promotion.detail}</p>
            <span className="promo-until">{untilText(promotion.until)}</span>
          </div>
        ) : null}

        <h4 className="offering-heading">Տեսականի</h4>
        <div className="showcase" role="list">
          {service.offerings.slice(0, 10).map((id) => {
            const price = premium.prices[id];
            return (
              <div key={id} className="showcase-item" role="listitem">
                <span className="showcase-emoji" aria-hidden="true">
                  {OFFERINGS[id].emoji}
                </span>
                <span className="showcase-name">{OFFERINGS[id].label}</span>
                {price ? (
                  <span className="showcase-price">{keepTogether(price)}</span>
                ) : (
                  <span className="showcase-price is-ask">Գինը՝ զանգով</span>
                )}
              </div>
            );
          })}
        </div>

        <div className="detail-rows">
          {link ? (
            <div className="detail-row">
              <span className="k">{link.label}</span>
              <a
                className="v detail-link"
                href={link.href}
                target="_blank"
                rel="noreferrer noopener"
              >
                {link.text}
              </a>
            </div>
          ) : null}
          <div className="detail-row">
            <span className="k">Հասցե</span>
            <span className="v">{service.address}</span>
          </div>
        </div>

        <div className="nav-block">
          <span className="nav-label">
            <IconPin /> Ինչպես հասնել
          </span>
          <div className="nav-links">
            <a className="btn btn-ghost" href={yandexUrl} target="_blank" rel="noreferrer noopener">
              Yandex Maps
            </a>
            <a className="btn btn-ghost" href={googleUrl} target="_blank" rel="noreferrer noopener">
              Google Maps
            </a>
          </div>
        </div>
      </div>
    </Modal>
  );
}
