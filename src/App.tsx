import { useCallback, useEffect, useMemo, useState } from 'react';
import MapView from './components/MapView';
import RoleGate from './components/RoleGate';
import ResultsPanel from './components/ResultsPanel';
import FilterSheet from './components/FilterSheet';
import SellerForm from './components/SellerForm';
import ListingDetail from './components/ListingDetail';
import MyListings from './components/MyListings';
import GuideSheet from './components/GuideSheet';
import { ToastStack, useToasts } from './components/Toasts';
import { IconArchive, IconPlus } from './components/Icons';

import {
  archiveListing,
  createListing,
  deleteListing,
  fetchActiveListings,
  fetchMyListings,
  republishListing,
} from './lib/listings';
import { isConfigured } from './lib/supabase';
import { applyFilters, countActiveFilters, sortListings, type SortKey } from './lib/filter';
import { useDistances } from './lib/useDistances';
import { useGeolocation } from './lib/useGeolocation';
import { DEFAULT_FILTERS } from './lib/types';
import type { Filters, LatLng, Listing, ListingDraft, MeasuredListing, Role } from './lib/types';

const ROLE_KEY = 'berqategh.role';
const GUIDE_KEY = 'berqategh.guideSeen';
const REFRESH_MS = 60_000;
const TICK_MS = 30_000;

type Sheet = 'none' | 'filters' | 'seller' | 'mine' | 'guide';

export default function App() {
  const [role, setRole] = useState<Role | null>(
    () => (localStorage.getItem(ROLE_KEY) as Role | null) ?? null,
  );

  const [listings, setListings] = useState<Listing[]>([]);
  const [mine, setMine] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMine, setLoadingMine] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [sort, setSort] = useState<SortKey>('newest');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sheet, setSheet] = useState<Sheet>('none');
  const [collapsed, setCollapsed] = useState(false);
  const [focus, setFocus] = useState<{ point: LatLng; zoom?: number; nonce: number } | null>(null);
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

    // The listing duration is core to how the platform works, so it is explained
    // once, unprompted, the first time somebody arrives — not left behind a
    // button they may never press.
    if (localStorage.getItem(GUIDE_KEY)) {
      setSheet('none');
    } else {
      setSheet('guide');
    }
  };

  const closeGuide = () => {
    localStorage.setItem(GUIDE_KEY, '1');
    setSheet('none');
  };

  const handleSelect = (id: string | null) => {
    setSelectedId(id);
    if (!id) return;
    const listing = liveListings.find((entry) => entry.id === id);
    if (listing) {
      setFocus({ point: { lat: listing.lat, lng: listing.lng }, zoom: 14, nonce: Date.now() });
    }
  };

  const handleLocate = useCallback(async () => {
    const point = await locate();
    if (point) {
      setFocus({ point, zoom: 12, nonce: Date.now() });
    } else if (locateStatus !== 'locating') {
      push('error', 'Չհաջողվեց որոշել ձեր տեղը։ Ստուգե՛ք բրաուզերի թույլտվությունը։');
    }
    return point;
  }, [locate, locateStatus, push]);

  const handlePickLocation = useCallback(
    (point: LatLng) => {
      setManualPosition(point);
      setFocus({ point, zoom: 12, nonce: Date.now() });
    },
    [setManualPosition],
  );

  const handleCreate = async (draft: ListingDraft) => {
    const created = await createListing(draft);
    setListings((current) => [created, ...current]);
    setMine((current) => [created, ...current]);
    setSheet('none');
    setSelectedId(created.id);
    setFocus({ point: { lat: created.lat, lng: created.lng }, zoom: 14, nonce: Date.now() });
    push('success', 'Հայտարարությունը հրապարակվեց։ Այն ակտիվ կլինի 5 օր։');
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

  const handleRepublish = async (listing: Listing) => {
    try {
      const created = await republishListing(listing);
      setListings((current) => [created, ...current]);
      setMine((current) => [created, ...current]);
      push('success', 'Հայտարարությունը կրկին ակտիվ է 5 օրով։');
    } catch (error) {
      push('error', error instanceof Error ? error.message : 'Չհաջողվեց');
    }
  };

  if (!role) return <RoleGate onPick={handlePickRole} />;

  const isSeller = role === 'seller';

  return (
    <div className="app">
      <header className="app-header">
        <div className="brand">
          <img src="/favicon.svg" alt="" className="brand-mark" />
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
        <div className="workspace">
          <MapView
            onOpenGuide={() => setSheet('guide')}
            listings={visible}
            selectedId={selectedId}
            onSelect={handleSelect}
            origin={position}
            radiusKm={filters.radiusKm}
            onLocate={() => void handleLocate()}
            locating={locating}
            focus={focus}
          />

          {isSeller ? (
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
              collapsed={collapsed}
              onToggleCollapsed={() => setCollapsed((current) => !current)}
              filters={filters}
              onFiltersChange={setFilters}
              onOpenFilters={() => setSheet('filters')}
              activeFilterCount={activeFilterCount}
              now={now}
              measuring={measuring}
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

      {sheet === 'guide' ? <GuideSheet role={role} onClose={closeGuide} /> : null}

      {sheet === 'mine' ? (
        <MyListings
          listings={mine}
          loading={loadingMine}
          now={now}
          onArchive={handleArchive}
          onDelete={handleDelete}
          onRepublish={handleRepublish}
          onClose={() => setSheet('none')}
        />
      ) : null}

      {selected && sheet === 'none' ? (
        <ListingDetail listing={selected} onClose={() => setSelectedId(null)} now={now} />
      ) : null}

      <ToastStack toasts={toasts} />
    </div>
  );
}
