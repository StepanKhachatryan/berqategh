import Modal from './Modal';
import ProduceMark from './ProduceMark';
import { produceImage } from '../data/produceImages';
import { record } from '../lib/analytics';
import { formatDistance } from '../lib/geo';
import { formatLocalPhone, formatPrice, formatQuantity, postedAge } from '../lib/format';
import { listingColor, swatchStyle } from './markers';
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
  const posted = postedAge(listing.createdAt, now);

  const place = usePlaceName({ lat: listing.lat, lng: listing.lng });

  // Yandex and Google are what people actually navigate with in Armenia, so
  // both are offered directly; each deep-links into the installed app on a
  // phone and falls back to the web map on a desktop.
  const point = `${listing.lat.toFixed(5)},${listing.lng.toFixed(5)}`;
  const yandexUrl = `https://yandex.com/maps/?rtext=~${point}&rtt=auto&z=16`;
  const googleUrl = `https://www.google.com/maps/dir/?api=1&destination=${point}`;

  /*
   * A photograph needs no frame around it. The ring exists so a bare emoji has
   * somewhere to sit and so a 23px dot on the map reads as a thing rather than
   * a smudge; at this size, with a real apricot in hand, it is just a circle
   * drawn around a picture. Dried fruit keeps the ring, because what it holds
   * is the sun rather than a crop.
   */
  const photo = listing.form === 'fresh' ? produceImage(listing.productId) : null;

  return (
    <Modal
      title={title}
      subtitle={listing.form === 'dried' ? 'Չիր — չորացրած' : undefined}
      onClose={onClose}
    >
      {/* The picture and what the crop costs, side by side. Prices used to run
          the full width of the sheet and take a third of it to say two
          numbers. */}
      <div className="detail-media">
        {photo ? (
          <img className="detail-photo" src={photo} alt="" />
        ) : (
          <div className="produce-swatch detail-mark" style={swatchStyle(color)} aria-hidden="true">
            <ProduceMark productId={listing.productId} form={listing.form} />
          </div>
        )}

        <div className="price-grid">
          {listing.retailPrice !== null ? (
            <div className="price-box retail">
              <div className="label">Մանրածախ</div>
              <div className="value">
                {formatPrice(listing.retailPrice)} <span className="per">/ կգ</span>
              </div>
            </div>
          ) : null}
          {listing.wholesalePrice !== null ? (
            <div className="price-box wholesale">
              <div className="label">Մեծածախ</div>
              <div className="value">
                {formatPrice(listing.wholesalePrice)} <span className="per">/ կգ</span>
              </div>
            </div>
          ) : null}
        </div>
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

        {/* Deliberately the age and not the time left. See postedAge. */}
        <div className="detail-row">
          <span className="k">Հրապարակվել է</span>
          <span className="v">
            {posted.relative}
            {posted.exact ? (
              <span style={{ color: 'var(--ink-faint)', fontWeight: 500, fontSize: 12 }}>
                {' '}
                ({posted.exact})
              </span>
            ) : null}
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
        {/* The number is cleared once a listing leaves the map, so the call
            button only exists while there is somebody to call. */}
        {listing.phone ? (
          <a
            className="btn btn-cta btn-lg btn-block call-btn"
            href={`tel:${listing.phone}`}
            onClick={() =>
              record({
                kind: 'call_click',
                listingAt: { lat: listing.lat, lng: listing.lng },
                productId: listing.productId,
              })
            }
          >
            <IconPhone />
            Զանգահարել՝ {formatLocalPhone(listing.phone)}
          </a>
        ) : null}

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
