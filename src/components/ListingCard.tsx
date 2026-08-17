import { produceEmoji } from '../data/produce';
import { formatDistance } from '../lib/geo';
import { formatPrice, formatQuantity, isExpiringSoon, timeLeft } from '../lib/format';
import { listingColor, SALE_TYPE_SHORT } from './markers';
import { IconClock, IconRoute } from './Icons';
import { listingTitle, type MeasuredListing } from '../lib/types';

interface ListingCardProps {
  listing: MeasuredListing;
  selected: boolean;
  onSelect: () => void;
  now: number;
}

export default function ListingCard({ listing, selected, onSelect, now }: ListingCardProps) {
  const soon = isExpiringSoon(listing.expiresAt, now);

  return (
    <button
      type="button"
      className={`listing-card${selected ? ' is-selected' : ''}`}
      onClick={onSelect}
    >
      <span
        className="listing-thumb"
        style={{ background: `${listingColor(listing.productId, listing.form)}22` }}
        aria-hidden="true"
      >
        {listing.form === 'dried' ? '☀️' : produceEmoji(listing.productId)}
      </span>

      <span className="listing-main">
        <span className="listing-title">
          <h4>{listingTitle(listing)}</h4>
          {listing.form === 'dried' ? <span className="chip chip-dried">Չիր</span> : null}
          <span className={`chip chip-${listing.saleType}`}>
            {SALE_TYPE_SHORT[listing.saleType]}
          </span>
        </span>

        <span className="listing-prices">
          {listing.retailPrice !== null ? (
            <span className="price retail">
              <b>{formatPrice(listing.retailPrice)}</b>
              <small>մանրածախ / կգ</small>
            </span>
          ) : null}
          {listing.wholesalePrice !== null ? (
            <span className="price wholesale">
              <b>{formatPrice(listing.wholesalePrice)}</b>
              <small>մեծածախ / կգ</small>
            </span>
          ) : null}
        </span>

        <span className="listing-meta">
          {listing.distanceKm !== null ? (
            <span
              className={`meta-dist${listing.distanceMode === 'straight' ? ' is-estimate' : ''}`}
              title={
                listing.distanceMode === 'road'
                  ? 'Ճանապարհի երկարությունը'
                  : 'Մոտավոր հեռավորություն՝ ուղիղ գծով'
              }
            >
              <IconRoute />
              {listing.distanceMode === 'straight' ? '≈' : ''}
              {formatDistance(listing.distanceKm)}
            </span>
          ) : null}

          <span className={soon ? 'meta-soon' : undefined}>
            <IconClock />
            {timeLeft(listing.expiresAt, now)}
          </span>

          {listing.quantityKg !== null ? <span>{formatQuantity(listing.quantityKg)}</span> : null}
          {listing.sellerName ? <span>{listing.sellerName}</span> : null}
        </span>
      </span>
    </button>
  );
}
