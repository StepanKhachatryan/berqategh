import { useState } from 'react';
import Modal from './Modal';
import { produceEmoji } from '../data/produce';
import { formatPrice, timeLeft } from '../lib/format';
import { listingColor, SALE_TYPE_SHORT } from './markers';
import { IconArchive, IconRefresh, IconTrash } from './Icons';
import { listingTitle, type Listing } from '../lib/types';


interface MyListingsProps {
  listings: Listing[];
  loading: boolean;
  now: number;
  onArchive: (listing: Listing) => Promise<void>;
  onDelete: (listing: Listing) => Promise<void>;
  onRepublish: (listing: Listing) => Promise<void>;
  onClose: () => void;
}

export default function MyListings({
  listings,
  loading,
  now,
  onArchive,
  onDelete,
  onRepublish,
  onClose,
}: MyListingsProps) {
  const [busyId, setBusyId] = useState<string | null>(null);

  const live = listings.filter(
    (listing) => !listing.archivedAt && new Date(listing.expiresAt).getTime() > now,
  );
  const past = listings.filter((listing) => !live.includes(listing));

  const run = async (listing: Listing, action: (listing: Listing) => Promise<void>) => {
    setBusyId(listing.id);
    try {
      await action(listing);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Modal
      title="Իմ հայտարարությունները"
      subtitle={`${live.length} ակտիվ · ${past.length} արխիվում`}
      onClose={onClose}
    >
      {loading ? (
        <p className="empty-note">Բեռնվում է…</p>
      ) : listings.length === 0 ? (
        <p className="empty-note">
          Դուք դեռ հայտարարություն չեք տեղադրել։
          <br />
          Սեղմե՛ք «Տեղադրել բերք»՝ սկսելու համար։
        </p>
      ) : (
        <div className="mine-list">
          {live.map((listing) => (
            <MyListingCard
              key={listing.id}
              listing={listing}
              now={now}
              busy={busyId === listing.id}
              actions={
                <>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => run(listing, onArchive)}
                    disabled={busyId === listing.id}
                  >
                    <IconArchive />
                    Հանել քարտեզից
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={() => run(listing, onDelete)}
                    disabled={busyId === listing.id}
                  >
                    <IconTrash />
                    Ջնջել
                  </button>
                </>
              }
            />
          ))}

          {past.length > 0 ? (
            <h4
              style={{
                marginTop: live.length > 0 ? 10 : 0,
                fontSize: 11.5,
                textTransform: 'uppercase',
                letterSpacing: '0.07em',
                color: 'var(--ink-faint)',
              }}
            >
              Արխիվ
            </h4>
          ) : null}

          {past.map((listing) => (
            <MyListingCard
              key={listing.id}
              listing={listing}
              now={now}
              archived
              busy={busyId === listing.id}
              actions={
                <>
                  <button
                    type="button"
                    className="btn btn-green btn-sm"
                    onClick={() => run(listing, onRepublish)}
                    disabled={busyId === listing.id}
                  >
                    <IconRefresh />
                    Կրկին հրապարակել
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={() => run(listing, onDelete)}
                    disabled={busyId === listing.id}
                  >
                    <IconTrash />
                    Ջնջել
                  </button>
                </>
              }
            />
          ))}
        </div>
      )}
    </Modal>
  );
}

function MyListingCard({
  listing,
  now,
  archived = false,
  busy,
  actions,
}: {
  listing: Listing;
  now: number;
  archived?: boolean;
  busy: boolean;
  actions: React.ReactNode;
}) {
  const remaining = new Date(listing.expiresAt).getTime() - now;
  const total = new Date(listing.expiresAt).getTime() - new Date(listing.createdAt).getTime();
  const percent = Math.max(0, Math.min(100, (remaining / total) * 100));

  return (
    <article className={`mine-card${archived ? ' is-archived' : ''}`} aria-busy={busy}>
      {!archived ? (
        <div className="progress">
          <i style={{ width: `${percent}%` }} />
        </div>
      ) : null}

      <div className="mine-top">
        <span
          className="listing-thumb"
          style={{ background: `${listingColor(listing.productId, listing.form)}22` }}
          aria-hidden="true"
        >
          {listing.form === 'dried' ? '☀️' : produceEmoji(listing.productId)}
        </span>
        <div className="listing-main">
          <div className="listing-title">
            <h4>{listingTitle(listing)}</h4>
            <span className={`chip chip-${listing.saleType}`}>
              {SALE_TYPE_SHORT[listing.saleType]}
            </span>
          </div>
          <div className="listing-prices">
            {listing.retailPrice !== null ? (
              <span className="price retail">
                <b>{formatPrice(listing.retailPrice)}</b>
                <small>մանրածախ</small>
              </span>
            ) : null}
            {listing.wholesalePrice !== null ? (
              <span className="price wholesale">
                <b>{formatPrice(listing.wholesalePrice)}</b>
                <small>մեծածախ</small>
              </span>
            ) : null}
          </div>
          <div className="listing-meta">
            <span>
              {archived
                ? `Արխիվացված՝ ${new Date(listing.archivedAt ?? listing.expiresAt).toLocaleDateString('hy-AM')}`
                : timeLeft(listing.expiresAt, now)}
            </span>
          </div>
        </div>
      </div>

      <div className="mine-actions">{actions}</div>
    </article>
  );
}
