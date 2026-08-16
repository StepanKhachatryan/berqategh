import Modal from './Modal';
import { produceColor, produceEmoji } from '../data/produce';
import { formatDistance } from '../lib/geo';
import {
  formatLocalPhone,
  formatPrice,
  formatQuantity,
  isExpiringSoon,
  timeLeft,
} from '../lib/format';
import { SALE_TYPE_LABELS } from './markers';
import { IconPhone, IconPin } from './Icons';
import type { MeasuredListing } from '../lib/types';

interface ListingDetailProps {
  listing: MeasuredListing;
  onClose: () => void;
  now: number;
}

export default function ListingDetail({ listing, onClose, now }: ListingDetailProps) {
  const color = produceColor(listing.productId);
  const bothPrices = listing.retailPrice !== null && listing.wholesalePrice !== null;
  const soon = isExpiringSoon(listing.expiresAt, now);

  const directions =
    `https://www.openstreetmap.org/directions?to=${listing.lat.toFixed(5)}%2C${listing.lng.toFixed(5)}`;

  return (
    <Modal title={listing.productName} subtitle={SALE_TYPE_LABELS[listing.saleType]} onClose={onClose}>
      <div className="detail-hero" style={{ background: `${color}1f` }}>
        <div className="detail-thumb" aria-hidden="true">
          {produceEmoji(listing.productId)}
        </div>
        <div>
          <h2>{listing.productName}</h2>
          <span className={`chip chip-${listing.saleType}`}>
            {SALE_TYPE_LABELS[listing.saleType]}
          </span>
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

        <div className="detail-row">
          <span className="k">Կոորդինատներ</span>
          <span className="v" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {listing.lat.toFixed(5)}, {listing.lng.toFixed(5)}
          </span>
        </div>
      </div>

      {listing.note ? <p className="detail-note">{listing.note}</p> : null}

      <div style={{ display: 'grid', gap: 10 }}>
        <a className="btn btn-cta btn-lg btn-block call-btn" href={`tel:${listing.phone}`}>
          <IconPhone />
          Զանգահարել՝ {formatLocalPhone(listing.phone)}
        </a>
        <a
          className="btn btn-ghost btn-block"
          href={directions}
          target="_blank"
          rel="noreferrer noopener"
        >
          <IconPin />
          Ինչպես հասնել (OpenStreetMap)
        </a>
      </div>
    </Modal>
  );
}
