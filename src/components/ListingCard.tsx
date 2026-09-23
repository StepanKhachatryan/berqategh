import { formatDistance } from '../lib/geo';
import ProduceMark from './ProduceMark';
import { formatPrice, formatQuantity, postedAge } from '../lib/format';
import { listingColor, swatchStyle } from './markers';
import { IconClock, IconRoute } from './Icons';
import { listingTitle, type MeasuredListing } from '../lib/types';

interface ListingCardProps {
  listing: MeasuredListing;
  selected: boolean;
  onSelect: () => void;
  now: number;
}

export default function ListingCard({ listing, selected, onSelect, now }: ListingCardProps) {
  const posted = postedAge(listing.createdAt, now);

  return (
    <button
      type="button"
      className={`listing-card${selected ? ' is-selected' : ''}`}
      onClick={onSelect}
    >
      <span
        className="produce-swatch listing-thumb"
        style={swatchStyle(listingColor(listing.productId, listing.form))}
        aria-hidden="true"
      >
        <ProduceMark productId={listing.productId} form={listing.form} />
      </span>

      <span className="listing-main">
        {/* The name alone. listingTitle already renders "Ծիրան (չիր)", so a
            chip beside it saying Չիր was the same word twice on one line. */}
        <span className="listing-title">
          <h4>{listingTitle(listing)}</h4>
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

          <span title="Երբ է հրապարակվել">
            <IconClock />
            {posted.relative}
          </span>

          {listing.quantityKg !== null ? <span>{formatQuantity(listing.quantityKg)}</span> : null}
          {listing.sellerName ? <span>{listing.sellerName}</span> : null}
        </span>
      </span>
    </button>
  );
}
