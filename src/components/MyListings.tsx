import { useState } from 'react';
import Modal from './Modal';
import ProduceMark from './ProduceMark';
import { formatPrice, timeLeft } from '../lib/format';
import { listingColor, swatchStyle } from './markers';
import { IconArchive, IconTrash } from './Icons';
import { listingTitle, type Listing } from '../lib/types';


/* An upload in progress is not worth a line: it either finishes as pending
   in a moment or is cleaned away within the hour. */
const PHOTO_STATUS: Partial<Record<NonNullable<Listing['photoStatus']>, string>> = {
  pending: '📷 Լուսանկարը ստուգվում է',
  approved: '📷 Լուսանկարը հաստատված է',
  rejected: '📷 Լուսանկարը չի հաստատվել',
};

interface MyListingsProps {
  listings: Listing[];
  loading: boolean;
  now: number;
  onArchive: (listing: Listing) => Promise<void>;
  onDelete: (listing: Listing) => Promise<void>;
  /** The seller's recovery code, once the server has issued one. */
  recoveryCode: string | null;
  /** The seller opted in to agricultural offers. */
  offersConsent: boolean;
  onWithdrawOffers: () => Promise<void>;
  onRecover: () => void;
  onClose: () => void;
}

export default function MyListings({
  listings,
  loading,
  now,
  onArchive,
  onDelete,
  recoveryCode,
  offersConsent,
  onWithdrawOffers,
  onRecover,
  onClose,
}: MyListingsProps) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [withdrawing, setWithdrawing] = useState(false);

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
      {recoveryCode ? (
        <div className="code-card">
          <div className="code-card-text">
            <b>Ձեր վերականգնման կոդը</b>
            <span>
              Պահե՛ք այս կոդը։ Հեռախոսահամարի հետ միասին այն վերադարձնում է ձեր
              հայտարարությունները ցանկացած սարքի վրա, եթե բրաուզերի հիշողությունը մաքրվի։
            </span>
          </div>
          <div className="code-card-code">{recoveryCode}</div>
        </div>
      ) : null}

      {/* Withdrawing has to be as easy as agreeing was, and in the place a
          seller already goes to manage what they have on the site. */}
      {offersConsent ? (
        <div className="consent-card">
          <span>
            📣 Դուք համաձայնել եք ստանալ գյուղատնտեսական առաջարկներ ձեր բերքի համար։
          </span>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            disabled={withdrawing}
            onClick={async () => {
              setWithdrawing(true);
              try {
                await onWithdrawOffers();
              } finally {
                setWithdrawing(false);
              }
            }}
          >
            Հրաժարվել
          </button>
        </div>
      ) : null}

      {loading ? (
        <p className="empty-note">Բեռնվում է…</p>
      ) : listings.length === 0 ? (
        <>
          <p className="empty-note">
            Դուք դեռ հայտարարություն չեք տեղադրել։
            <br />
            Սեղմե՛ք «Տեղադրել բերք»՝ սկսելու համար։
          </p>
        </>
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
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  onClick={() => run(listing, onDelete)}
                  disabled={busyId === listing.id}
                >
                  <IconTrash />
                  Ջնջել
                </button>
              }
            />
          ))}
        </div>
      )}

      {/* The only way into recovery. There used to be a second button in the
          empty state, worded differently, doing the identical thing - two
          names for one action read as two actions. */}
      <button
        type="button"
        className="btn btn-ghost btn-block"
        style={{ marginTop: 14 }}
        onClick={onRecover}
      >
        Վերականգնել իմ հայտարարությունները
      </button>
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
          className="produce-swatch listing-thumb"
          style={swatchStyle(listingColor(listing.productId, listing.form))}
          aria-hidden="true"
        >
          <ProduceMark productId={listing.productId} form={listing.form} />
        </span>
        <div className="listing-main">
          <div className="listing-title">
            <h4>{listingTitle(listing)}</h4>
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
          {/* Only the seller sees this: where their photo stands in review. */}
          {!archived && listing.photoStatus && PHOTO_STATUS[listing.photoStatus] ? (
            <div className={`photo-status is-${listing.photoStatus}`}>
              {PHOTO_STATUS[listing.photoStatus]}
            </div>
          ) : null}
        </div>
      </div>

      <div className="mine-actions">{actions}</div>
    </article>
  );
}
