import Modal from './Modal';
import { produceEmoji } from '../data/produce';
import { formatDistance } from '../lib/geo';
import {
  formatLocalPhone,
  formatPrice,
  formatQuantity,
  isExpiringSoon,
  timeLeft,
} from '../lib/format';
import { listingColor, SALE_TYPE_LABELS, swatchStyle } from './markers';
import { IconPhone, IconPin } from './Icons';
import { usePlaceName } from '../lib/usePlaceName';
import { listingTitle, type MeasuredListing } from '../lib/types';

interface ListingDetailProps {
  listing: MeasuredListing;
  onClose: () => void;
  now: number;
}

export default function ListingDetail({ listing, onClose, now }: ListingDetailProps) {
  const color = listingColor(listing.productId, listing.form);
  const title = listingTitle(listing);
  const bothPrices = listing.retailPrice !== null && listing.wholesalePrice !== null;
  const soon = isExpiringSoon(listing.expiresAt, now);

  const place = usePlaceName({ lat: listing.lat, lng: listing.lng });

  // Yandex and Google are what people actually navigate with in Armenia, so
  // both are offered directly; each deep-links into the installed app on a
  // phone and falls back to the web map on a desktop.
  const point = `${listing.lat.toFixed(5)},${listing.lng.toFixed(5)}`;
  const yandexUrl = `https://yandex.com/maps/?rtext=~${point}&rtt=auto&z=16`;
  const googleUrl = `https://www.google.com/maps/dir/?api=1&destination=${point}`;

  return (
    <Modal title={title} subtitle={SALE_TYPE_LABELS[listing.saleType]} onClose={onClose}>
      <div className="detail-hero" style={{ background: `${color}1f` }}>
        <div
          className="produce-swatch detail-thumb"
          style={swatchStyle(color)}
          aria-hidden="true"
        >
          <span>{listing.form === 'dried' ? '☀️' : produceEmoji(listing.productId)}</span>
        </div>
        <div>
          <h2>{title}</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {listing.form === 'dried' ? (
              <span className="chip chip-dried">Չիր — չորացրած</span>
            ) : null}
            <span className={`chip chip-${listing.saleType}`}>
              {SALE_TYPE_LABELS[listing.saleType]}
            </span>
          </div>
        </div>
      </div>

      <div className={`price-grid${bothPrices ? ' two' : ''}`}>
        {listing.retailPrice !== null ? (
          <div className="price-box retail">
            <div className="label">Մանրածախ</div>
            <div className="value">{formatPrice(listing.retailPrice)}</div>
            <div className="per">1 կիլոգրամ</div>
          </div>
        ) : null}
        {listing.wholesalePrice !== null ? (
          <div className="price-box wholesale">
            <div className="label">Մեծածախ</div>
            <div className="value">{formatPrice(listing.wholesalePrice)}</div>
            <div className="per">1 կիլոգրամ</div>
          </div>
        ) : null}
      </div>

      <div className="detail-rows">
        {listing.sellerName ? (
          <div className="detail-row">
            <span className="k">Վաճառող</span>
            <span className="v">{listing.sellerName}</span>
          </div>
        ) : null}

        {listing.quantityKg !== null ? (
          <div className="detail-row">
            <span className="k">Առկա քանակ</span>
            <span className="v">{formatQuantity(listing.quantityKg)}</span>
          </div>
        ) : null}

        {listing.distanceKm !== null ? (
          <div className="detail-row">
            <span className="k">Հեռավորություն</span>
            <span className="v">
              {listing.distanceMode === 'straight' ? '≈ ' : ''}
              {formatDistance(listing.distanceKm)}
              <span style={{ color: 'var(--ink-faint)', fontWeight: 500, fontSize: 12 }}>
                {listing.distanceMode === 'road' ? ' ճանապարհով' : ' (մոտավոր)'}
              </span>
            </span>
          </div>
        ) : null}

        <div className="detail-row">
          <span className="k">Հասանելի է</span>
          <span className="v" style={soon ? { color: 'var(--cta-deep)' } : undefined}>
            {timeLeft(listing.expiresAt, now)}
          </span>
        </div>

        {/* Shown only once an address is known — a failed lookup leaves no row
            rather than falling back to coordinates nobody can use. */}
        {place.status === 'loading' ? (
          <div className="detail-row">
            <span className="k">Հասցե</span>
            <span className="v" style={{ color: 'var(--ink-faint)', fontWeight: 500 }}>
              Որոշվում է…
            </span>
          </div>
        ) : place.label ? (
          <div className="detail-row">
            <span className="k">Հասցե</span>
            <span className="v">{place.label}</span>
          </div>
        ) : null}
      </div>

      {listing.note ? <p className="detail-note">{listing.note}</p> : null}

      <div style={{ display: 'grid', gap: 10 }}>
        <a className="btn btn-cta btn-lg btn-block call-btn" href={`tel:${listing.phone}`}>
          <IconPhone />
          Զանգահարել՝ {formatLocalPhone(listing.phone)}
        </a>

        <div className="nav-block">
          <span className="nav-label">
            <IconPin /> Ինչպես հասնել
          </span>
          <div className="nav-links">
            <a
              className="btn btn-ghost"
              href={yandexUrl}
              target="_blank"
              rel="noreferrer noopener"
            >
              Yandex Maps
            </a>
            <a
              className="btn btn-ghost"
              href={googleUrl}
              target="_blank"
              rel="noreferrer noopener"
            >
              Google Maps
            </a>
          </div>
        </div>
      </div>
    </Modal>
  );
}
