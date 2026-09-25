import { useCallback, useEffect, useMemo, useState } from 'react';
import MapView from './components/MapView';
import RoleGate from './components/RoleGate';
import ResultsPanel from './components/ResultsPanel';
import ServiceDetail from './components/ServiceDetail';
import { SERVICES, searchServices, type OfferingId } from './data/services';
import FilterSheet from './components/FilterSheet';
import SellerForm from './components/SellerForm';
import ListingDetail from './components/ListingDetail';
import MyListings from './components/MyListings';
import RecoverySheet from './components/RecoverySheet';
import GuideSheet from './components/GuideSheet';
import InstallPrompt from './components/InstallPrompt';
import { ToastStack, useToasts } from './components/Toasts';
import { IconArchive, IconHelp, IconPlus } from './components/Icons';

import {
  archiveListing,
  createListing,
  deleteListing,
  fetchActiveListings,
  fetchMyListings,
  issueRecoveryCode,
  uploadListingPhoto,
  claimListings,
} from './lib/listings';
import { isConfigured } from './lib/supabase';
import { record, recordVisit } from './lib/analytics';
import { applyFilters, countActiveFilters, sortListings, type SortKey } from './lib/filter';
import { useDistances } from './lib/useDistances';
import { useGeolocation } from './lib/useGeolocation';
import PublishedSheet from './components/PublishedSheet';
import PremiumServiceSheet from './components/PremiumServiceSheet';
import ServiceSearch from './components/ServiceSearch';
import {
  forgetOffersAnswer,
  marketingConsentStatus,
  recordMarketingConsent,
  withdrawMarketingConsent,
} from './lib/marketing';
import { DEFAULT_FILTERS } from './lib/types';
import type { Filters, LatLng, Listing, ListingDraft, MeasuredListing, Role } from './lib/types';

const ROLE_KEY = 'berqategh.role';
const REFRESH_MS = 60_000;
const TICK_MS = 30_000;

type Sheet = 'none' | 'filters' | 'seller' | 'mine' | 'guide' | 'recover';

/** Folded to its handle, sharing the screen with the map, or covering it. */
export type SheetStep = 'collapsed' | 'half' | 'full';

const NEXT_STEP: Record<SheetStep, SheetStep> = {
  collapsed: 'half',
  half: 'full',
  full: 'collapsed',
};

export default function App() {
  const [role, setRole] = useState<Role | null>(
    () => (localStorage.getItem(ROLE_KEY) as Role | null) ?? null,
  );

  const [listings, setListings] = useState<Listing[]>([]);
  const [mine, setMine] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMine, setLoadingMine] = useState(false);
  // Issued by the server on first publish and stable while anything is live.
  const [recoveryCode, setRecoveryCode] = useState<string | null>(null);
  /* Whether this seller has opted in to agricultural offers. Loaded with their
     listings; shown in «Իմ հայտարարությունները» with the way to withdraw. */
  const [offersConsent, setOffersConsent] = useState(false);
  /* Shown once, right after publishing, to put the recovery code in front of
     a seller who otherwise never opens the screen that holds it. */
  const [published, setPublished] = useState<{
    code: string;
    phone: string;
    span: string;
    photoSent: boolean;
  } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [sort, setSort] = useState<SortKey>('newest');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sheet, setSheet] = useState<Sheet>('none');
  /*
   * How tall the results pane is. Two states were not enough: at its only open
   * height the scrolling area came out shorter than a single card on a phone,
   * so somebody wanting to look through the offers could see less than one of
   * them at a time. The third step hands them the screen.
   */
  const [sheetStep, setSheetStep] = useState<SheetStep>('half');
  // How much of the map the results pane is covering. The pane reports it; the
  // map uses it to keep every pin out from behind the glass.
  const [sheetHeight, setSheetHeight] = useState(0);
  const [focus, setFocus] = useState<{ point: LatLng; zoom?: number; nonce: number } | null>(null);

  // ─── agricultural services (sellers only) ──────────────────────────────
  const [servicesOn, setServicesOn] = useState(false);
  const [serviceId, setServiceId] = useState<string | null>(null);
  /* The services search. Kept here rather than in the panel so the map can
     be handed the filtered list; memoised below, because the map refits
     whenever that list changes and a fresh array each render would refit it
     on every tick. */
  const [serviceQuery, setServiceQuery] = useState('');
  const [serviceOffering, setServiceOffering] = useState<OfferingId | null>(null);
  const serviceMatches = useMemo(
    () => searchServices(SERVICES, serviceQuery, serviceOffering),
    [serviceQuery, serviceOffering],
  );
  /*
   * Whether the seller has opened the services layer during *this* visit.
   *
   * It used to be remembered in localStorage — pressed once, never announced
   * again on that device, ever. Which is why the button behaved differently
   * everywhere: the desktop browser, the installed app and the phone browser
   * each keep their own storage, so it pulsed in whichever of them had not been
   * used yet and nowhere else. "Sometimes" is not a behaviour anyone can learn.
   *
   * In memory instead. Every visit starts with the cue and it stops as soon as
   * the layer is opened, the same way on every device.
   */
  const [servicesUsed, setServicesUsed] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  const { toasts, push } = useToasts();
  const { status: locateStatus, position, locate, setManualPosition } = useGeolocation();
  const locating = locateStatus === 'locating';

  // ─── data ────────────────────────────────────────────────────────────────
  const loadListings = useCallback(async () => {
    if (!isConfigured) {
      setLoading(false);
      return;
    }
    try {
      setListings(await fetchActiveListings());
      setLoadError(null);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Չհաջողվեց բեռնել');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMine = useCallback(async () => {
    if (!isConfigured) return;
    setLoadingMine(true);
    try {
      setMine(await fetchMyListings());
      // Best effort: a seller with nothing live has no code, which is fine.
      setRecoveryCode(await issueRecoveryCode().catch(() => null));
      setOffersConsent(await marketingConsentStatus().catch(() => false));
    } catch (error) {
      push('error', error instanceof Error ? error.message : 'Չհաջողվեց բեռնել');
    } finally {
      setLoadingMine(false);
    }
  }, [push]);

  useEffect(() => {
    void loadListings();
    const timer = window.setInterval(() => void loadListings(), REFRESH_MS);
    return () => window.clearInterval(timer);
  }, [loadListings]);

  useEffect(() => {
    if (role === 'seller') void loadMine();
  }, [role, loadMine]);

  // One visit per browser session. It waits a few seconds for a position so the
  // region can be filled in when the visitor let the app find them, then
  // records regardless — recordVisit ignores every call after the first.
  useEffect(() => {
    if (position) {
      recordVisit(position);
      return;
    }
    const timer = window.setTimeout(() => recordVisit(null), 6000);
    return () => window.clearTimeout(timer);
  }, [position]);

  // Countdowns and listing expiration both read this clock.
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), TICK_MS);
    return () => window.clearInterval(timer);
  }, []);

  // A listing that runs out mid-session leaves the map without waiting for the
  // next poll, matching what a fresh load would show.
  const liveListings = useMemo(
    () => listings.filter((listing) => new Date(listing.expiresAt).getTime() > now),
    [listings, now],
  );

  // ─── distances ───────────────────────────────────────────────────────────
  const { distances, measuring } = useDistances(position, liveListings);

  const measured = useMemo<MeasuredListing[]>(
    () =>
      liveListings.map((listing) => {
        const distance = distances.get(listing.id);
        return {
          ...listing,
          distanceKm: distance?.km ?? null,
          distanceMode: distance?.mode ?? null,
        };
      }),
    [liveListings, distances],
  );

  const visible = useMemo(() => {
    const filtered = applyFilters(measured, filters);
    return sortListings(filtered, sort, filters.saleType);
  }, [measured, filters, sort]);

  const selected = useMemo(
    () => measured.find((listing) => listing.id === selectedId) ?? null,
    [measured, selectedId],
  );

  const activeFilterCount = useMemo(() => countActiveFilters(filters), [filters]);

  // Once a position is known, "nearest first" is the ordering people expect.
  useEffect(() => {
    if (position && sort === 'newest') setSort('distance');
    // Only reacts to gaining a position, never to later sort changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [position]);

  // ─── actions ─────────────────────────────────────────────────────────────
  const handlePickRole = (picked: Role) => {
    localStorage.setItem(ROLE_KEY, picked);
    setRole(picked);
    setSelectedId(null);
    // The services layer belongs to the seller side; leaving it switched on
    // would hand the buyer a dimmed map the moment they switched back.
    setServicesOn(false);
    setServiceId(null);
    record({ kind: 'role', role: picked, origin: position });

    // Straight to the map. The guide used to open itself here, which put a
    // page of rules between somebody and the thing they came for, before they
    // had seen anything the rules were about. It is a button away whenever
    // they want it.
    setSheet('none');
  };

  const handleSelect = (id: string | null) => {
    setSelectedId(id);
    if (!id) return;
    const listing = liveListings.find((entry) => entry.id === id);
    if (listing) {
      setFocus({ point: { lat: listing.lat, lng: listing.lng }, zoom: 14, nonce: Date.now() });
      record({
        kind: 'listing_open',
        origin: position,
        listingAt: { lat: listing.lat, lng: listing.lng },
        productId: listing.productId,
      });
    }
  };

  /*
   * Find the visitor, and say so only when they asked to be found.
   *
   * `silent` is for the automatic attempt the seller form makes when it opens.
   * Nobody asked for that one, the form already carries an inline line saying
   * what happened, and the village search sits right underneath - so a red
   * banner over the form is pure noise for someone who simply keeps location
   * turned off.
   *
   * This callback must stay stable. It used to depend on locateStatus, which
   * changes on every step of a lookup (idle -> locating -> denied), handing a
   * new function identity to everything holding it. The seller form re-ran its
   * open-the-form lookup on that identity, so a failure started a lookup, which
   * changed the status, which changed the identity, which started a lookup. One
   * denied permission produced 154 geolocation calls and 78 stacked error
   * toasts that buried the form - which is what a seller filmed and sent in.
   *
   * The locateStatus read it depended on was stale anyway: locate() resolves
   * only once it has finished, so the status can never be 'locating' here.
   */
  const handleLocate = useCallback(
    async (silent = false) => {
      const point = await locate();
      if (point) {
        setFocus({ point, zoom: 12, nonce: Date.now() });
      } else if (!silent) {
        push('error', 'Չհաջողվեց որոշել ձեր տեղը։ Ստուգե՛ք բրաուզերի թույլտվությունը։');
      }
      return point;
    },
    [locate, push],
  );

  const handlePickLocation = useCallback(
    (point: LatLng) => {
      setManualPosition(point);
      setFocus({ point, zoom: 12, nonce: Date.now() });
    },
    [setManualPosition],
  );

  const handleCreate = async (draft: ListingDraft) => {
    const created = await createListing(draft);

    // After the listing exists, because consent is recorded against it - the
    // server reads the number from the listing, not from us. Best effort: a
    // failure here must never cost the seller the listing they just made.
    if (draft.marketingConsent) {
      const recorded = await recordMarketingConsent(created.id).catch(() => false);
      if (recorded) setOffersConsent(true);
    }

    // The photo, against the listing that now exists. Also best effort: the
    // listing is already live, and a failed upload says so rather than
    // taking the listing down with it.
    let photoSent = false;
    let listing = created;
    if (draft.photo) {
      try {
        const url = await uploadListingPhoto(created.id, draft.photo);
        listing = { ...created, photoUrl: url, photoStatus: 'approved' };
        photoSent = true;
      } catch {
        push('error', 'Հայտարարությունը հրապարակվեց, բայց լուսանկարը չհաջողվեց բեռնել։');
      }
    }

    setListings((current) => [listing, ...current]);
    setMine((current) => [listing, ...current]);
    setSheet('none');

    /*
     * The map flies to the new pin, but the listing is deliberately NOT
     * selected. Selecting opens its detail sheet, and the recovery code sheet
     * is about to open on top of it - two sheets stacked, the lower one
     * unreachable. A seller has no use for a sheet describing what they typed
     * thirty seconds ago; they need the code, and then to see their pin land.
     */
    setFocus({ point: { lat: created.lat, lng: created.lng }, zoom: 14, nonce: Date.now() });
    const days = draft.durationDays ?? 30;
    const span = days === 30 ? '1 ամիս' : days === 90 ? '3 ամիս' : `${days} օր`;

    /*
     * The code, then the confirmation - and a toast only if there is no code.
     *
     * A seller who has just published has no reason to open «Իմ
     * հայտարարությունները», so the first time they ever go looking for the
     * recovery code is after their storage has been cleared, when it is gone.
     * Showing it here is the difference between a listing they can get back
     * and one they cannot.
     */
    const code = await issueRecoveryCode().catch(() => null);
    if (code) {
      setRecoveryCode(code);
      setPublished({ code, phone: draft.phone, span, photoSent });
    } else {
      push('success', `Հայտարարությունը հրապարակվեց։ Այն ակտիվ կլինի ${span}։`);
    }

    void loadMine();
  };

  const handleWithdrawOffers = async () => {
    try {
      await withdrawMarketingConsent();
      setOffersConsent(false);
      forgetOffersAnswer();
      push('success', 'Դուք այլևս առաջարկներ չեք ստանա։ Ձեր համարը հեռացվեց ցուցակից։');
    } catch (error) {
      push('error', error instanceof Error ? error.message : 'Չհաջողվեց');
    }
  };

  const handleArchive = async (listing: Listing) => {
    try {
      await archiveListing(listing.id);
      const archivedAt = new Date().toISOString();
      setListings((current) => current.filter((entry) => entry.id !== listing.id));
      setMine((current) =>
        current.map((entry) => (entry.id === listing.id ? { ...entry, archivedAt } : entry)),
      );
      push('success', 'Հայտարարությունը հանվեց քարտեզից։');
    } catch (error) {
      push('error', error instanceof Error ? error.message : 'Չհաջողվեց');
    }
  };

  const handleDelete = async (listing: Listing) => {
    try {
      await deleteListing(listing.id);
      setListings((current) => current.filter((entry) => entry.id !== listing.id));
      setMine((current) => current.filter((entry) => entry.id !== listing.id));
      push('success', 'Հայտարարությունը ջնջվեց։');
    } catch (error) {
      push('error', error instanceof Error ? error.message : 'Չհաջողվեց');
    }
  };

  const handleRecover = async (phone: string, code: string): Promise<number> => {
    const claimed = await claimListings(phone, code);
    if (claimed > 0) {
      await Promise.all([loadMine(), loadListings()]);
      setSheet('mine');
      push('success', `Վերականգնվեց ${claimed} հայտարարություն։`);
    }
    return claimed;
  };

  if (!role) return <RoleGate onPick={handlePickRole} />;

  const isSeller = role === 'seller';

  const toggleServices = () => {
    setServicesOn((on) => !on);
    setServiceId(null);
    setServicesUsed(true);
    // A search belongs to one visit to the layer; the next starts with all.
    setServiceQuery('');
    setServiceOffering(null);
  };

  const openService = SERVICES.find((service) => service.id === serviceId) ?? null;

  return (
    <div className="app">
      <header className="app-header">
        <div className="brand">
          <img src="/logo.webp" alt="" className="brand-mark" />
          <span>
            ԲերքաՏեղ
            <span className="brand-sub" style={{ display: 'block' }}>
              {isSeller ? 'Վաճառողի էջ' : 'Գնորդի էջ'}
            </span>
          </span>
        </div>

        <div className="header-spacer" />

        {isSeller ? (
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            // The label is hidden on narrow screens, so the name lives here too.
            aria-label="Իմ հայտարարությունները"
            onClick={() => {
              void loadMine();
              setSheet('mine');
            }}
          >
            <IconArchive />
            <span className="hide-narrow">Իմ հայտարարությունները</span>
          </button>
        ) : null}

        <div className="role-switch" role="group" aria-label="Ընտրել դերը">
          <button
            type="button"
            aria-pressed={!isSeller}
            onClick={() => handlePickRole('buyer')}
          >
            Գնորդ
          </button>
          <button
            type="button"
            aria-pressed={isSeller}
            onClick={() => handlePickRole('seller')}
          >
            Վաճառող
          </button>
        </div>

        {/* The guide, off the map and into the header: the same place on
            every screen and in every mode, rather than one more button in a
            column that moves with the results sheet. */}
        <button
          type="button"
          className="header-guide"
          onClick={() => setSheet('guide')}
          title="Ինչպես օգտվել"
          aria-label="Ինչպես օգտվել"
        >
          <IconHelp size={19} />
        </button>
      </header>

      {!isConfigured ? (
        <div className="banner">
          Տվյալների բազան միացված չէ։ Netlify-ում ավելացրե՛ք{' '}
          <code>VITE_SUPABASE_URL</code> և <code>VITE_SUPABASE_ANON_KEY</code> միջավայրի
          փոփոխականները։
        </div>
      ) : loadError ? (
        <div className="banner">Չհաջողվեց բեռնել հայտարարությունները՝ {loadError}</div>
      ) : null}

      <div className="app-body">
        {/* The pane floats over the map, so the layout has to know how much of
            it is covered — for the attribution, and for the camera. */}
        <div
          className={`workspace${isSeller ? '' : ` sheet-${sheetStep}`}`}
        >
          <MapView
            listings={visible}
            selectedId={selectedId}
            onSelect={handleSelect}
            origin={position}
            radiusKm={filters.radiusKm}
            onLocate={() => void handleLocate()}
            locating={locating}
            focus={focus}
            bottomInset={isSeller ? 0 : sheetHeight}
            services={
              isSeller
                ? {
                    items: serviceMatches,
                    active: servicesOn,
                    onToggle: toggleServices,
                    selectedId: serviceId,
                    onSelect: setServiceId,
                    unseen: !servicesUsed,
                    panel: (
                      <ServiceSearch
                        all={SERVICES}
                        matches={serviceMatches}
                        query={serviceQuery}
                        onQueryChange={setServiceQuery}
                        offering={serviceOffering}
                        onOfferingChange={setServiceOffering}
                        onPick={setServiceId}
                      />
                    ),
                  }
                : null
            }
          />

          {/* Not while the services layer is up: the seller is shopping for
              seed there, not publishing a harvest, and the button sat on top
              of the very pins they were looking at. */}
          {isSeller && !servicesOn ? (
            <button type="button" className="btn btn-cta fab" onClick={() => setSheet('seller')}>
              <IconPlus />
              Տեղադրել բերք
            </button>
          ) : null}

          {loading ? (
            <div className="loading-veil">
              <span className="spinner spinner-dark" />
              Բեռնվում է քարտեզը…
            </div>
          ) : null}

          {!isSeller ? (
            <ResultsPanel
              listings={visible}
              totalCount={measured.length}
              selectedId={selectedId}
              onSelect={handleSelect}
              sort={sort}
              onSortChange={setSort}
              step={sheetStep}
              onStepChange={() => setSheetStep((current) => NEXT_STEP[current])}
              filters={filters}
              onFiltersChange={setFilters}
              onOpenFilters={() => setSheet('filters')}
              activeFilterCount={activeFilterCount}
              now={now}
              measuring={measuring}
              onHeightChange={setSheetHeight}
            />
          ) : null}
        </div>
      </div>

      {sheet === 'filters' ? (
        <FilterSheet
          filters={filters}
          onChange={setFilters}
          onClose={() => setSheet('none')}
          matchCount={visible.length}
          hasLocation={position !== null}
          onRequestLocation={() => void handleLocate()}
          onPickLocation={handlePickLocation}
          locating={locating}
        />
      ) : null}

      {sheet === 'seller' ? (
        <SellerForm
          initialLocation={position}
          locateStatus={locateStatus}
          onLocate={handleLocate}
          onSubmit={handleCreate}
          onClose={() => setSheet('none')}
        />
      ) : null}

      {published ? (
        <PublishedSheet
          code={published.code}
          phone={published.phone}
          span={published.span}
          photoSent={published.photoSent}
          onClose={() => setPublished(null)}
        />
      ) : null}

      {sheet === 'guide' ? <GuideSheet role={role} onClose={() => setSheet('none')} /> : null}

      {/* Premium advertisers open their own card; everyone else, the standard
          sheet. The check narrows the type, so the card can rely on it. */}
      {openService?.premium ? (
        <PremiumServiceSheet
          service={{ ...openService, premium: openService.premium }}
          onClose={() => setServiceId(null)}
        />
      ) : openService ? (
        <ServiceDetail service={openService} onClose={() => setServiceId(null)} />
      ) : null}

      {sheet === 'mine' ? (
        <MyListings
          listings={mine}
          loading={loadingMine}
          now={now}
          onArchive={handleArchive}
          onDelete={handleDelete}
          recoveryCode={recoveryCode}
          offersConsent={offersConsent}
          onWithdrawOffers={handleWithdrawOffers}
          onRecover={() => setSheet('recover')}
          onClose={() => setSheet('none')}
        />
      ) : null}

      {sheet === 'recover' ? (
        <RecoverySheet onRecover={handleRecover} onClose={() => setSheet('mine')} />
      ) : null}

      {selected && sheet === 'none' ? (
        <ListingDetail listing={selected} onClose={() => setSelectedId(null)} now={now} />
      ) : null}

      <InstallPrompt />

      <ToastStack toasts={toasts} />
    </div>
  );
}
