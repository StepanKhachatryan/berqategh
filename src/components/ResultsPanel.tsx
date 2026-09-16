import { useEffect, useRef } from 'react';
import ListingCard from './ListingCard';
import type { SheetStep } from '../App';
import { SORT_LABELS, type SortKey } from '../lib/filter';
import { IconChevronDown, IconChevronUp, IconFilter, IconSearch } from './Icons';
import { FORM_LABELS, type Filters, type MeasuredListing } from '../lib/types';
import { getProduce } from '../data/produce';
import { SALE_TYPE_SHORT } from './markers';
import { formatPrice } from '../lib/format';

/** What pressing the handle does next, said out loud for screen readers. */
const STEP_ACTION: Record<SheetStep, string> = {
  collapsed: 'Բացել ցանկը',
  half: 'Մեծացնել ցանկը',
  full: 'Ծալել ցանկը',
};

interface ResultsPanelProps {
  listings: MeasuredListing[];
  totalCount: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
  sort: SortKey;
  onSortChange: (sort: SortKey) => void;
  step: SheetStep;
  /** Advances one step: folded, half the screen, then all of it. */
  onStepChange: () => void;
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  onOpenFilters: () => void;
  activeFilterCount: number;
  now: number;
  measuring: boolean;
  /** How much of the map this pane is covering, in pixels. */
  onHeightChange: (height: number) => void;
}

export default function ResultsPanel({
  listings,
  totalCount,
  selectedId,
  onSelect,
  sort,
  onSortChange,
  step,
  onStepChange,
  filters,
  onFiltersChange,
  onOpenFilters,
  activeFilterCount,
  now,
  measuring,
  onHeightChange,
}: ResultsPanelProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  // The map has to know what this pane is hiding, and only the pane itself
  // knows: its height is a share of the viewport when open and whatever its
  // chrome adds up to when folded. Measuring beats duplicating the arithmetic.
  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;

    const report = () => onHeightChange(node.offsetHeight);
    report();

    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(report);
    observer.observe(node);
    return () => observer.disconnect();
  }, [onHeightChange]);

  return (
    <div ref={rootRef} className={`results${step === 'collapsed' ? ' is-collapsed' : ''}`}>
      <button
        type="button"
        className="results-toggle"
        onClick={onStepChange}
        aria-label={STEP_ACTION[step]}
        title={STEP_ACTION[step]}
      >
        {/* Up while there is more list to show, down once it fills the screen. */}
        {step === 'full' ? <IconChevronDown /> : <IconChevronUp />}
      </button>

      <FilterBar
        filters={filters}
        onChange={onFiltersChange}
        onOpen={onOpenFilters}
        activeCount={activeFilterCount}
      />

      <div className="results-head">
        <h3>
          {listings.length} առաջարկ{' '}
          {listings.length !== totalCount ? (
            <span className="muted">/ {totalCount}-ից</span>
          ) : null}
          {measuring ? <span className="muted"> · չափվում է…</span> : null}
        </h3>
        <select
          className="sort-select"
          value={sort}
          onChange={(event) => onSortChange(event.target.value as SortKey)}
          aria-label="Դասավորել ըստ"
        >
          {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
            <option key={key} value={key}>
              {SORT_LABELS[key]}
            </option>
          ))}
        </select>
      </div>

      <div className="results-scroll">
        {listings.length === 0 ? (
          <p className="empty-note">
            {totalCount === 0
              ? 'Այս պահին քարտեզին ակտիվ հայտարարություն չկա։'
              : 'Ձեր ֆիլտրերին համապատասխան առաջարկ չգտնվեց։ Փորձե՛ք մեծացնել շառավիղը կամ գինը։'}
          </p>
        ) : (
          listings.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              selected={listing.id === selectedId}
              onSelect={() => onSelect(listing.id)}
              now={now}
            />
          ))
        )}
      </div>
    </div>
  );
}

function FilterBar({
  filters,
  onChange,
  onOpen,
  activeCount,
}: {
  filters: Filters;
  onChange: (filters: Filters) => void;
  onOpen: () => void;
  activeCount: number;
}) {
  const tags: { key: string; label: string; clear: () => void }[] = [];

  if (filters.radiusKm !== null) {
    tags.push({
      key: 'radius',
      label: `Մինչև ${filters.radiusKm} կմ`,
      clear: () => onChange({ ...filters, radiusKm: null }),
    });
  }
  if (filters.saleType !== 'any') {
    tags.push({
      key: 'sale',
      label: SALE_TYPE_SHORT[filters.saleType],
      clear: () => onChange({ ...filters, saleType: 'any' }),
    });
  }
  if (filters.form !== 'any') {
    tags.push({
      key: 'form',
      label: FORM_LABELS[filters.form],
      clear: () => onChange({ ...filters, form: 'any' }),
    });
  }
  if (filters.maxPrice !== null) {
    tags.push({
      key: 'price',
      label: `Մինչև ${formatPrice(filters.maxPrice)}`,
      clear: () => onChange({ ...filters, maxPrice: null }),
    });
  }
  for (const id of filters.productIds) {
    tags.push({
      key: `product-${id}`,
      label: getProduce(id)?.hy ?? id,
      clear: () =>
        onChange({ ...filters, productIds: filters.productIds.filter((entry) => entry !== id) }),
    });
  }

  return (
    <>
      <div className="filter-row">
        <button type="button" className="filter-btn" onClick={onOpen}>
          <IconFilter />
          Ֆիլտրեր
          {activeCount > 0 ? <span className="filter-count">{activeCount}</span> : null}
        </button>

        <div className="input-affix">
          <span className="affix" aria-hidden="true">
            <IconSearch />
          </span>
          <input
            type="search"
            value={filters.query}
            onChange={(event) => onChange({ ...filters, query: event.target.value })}
            placeholder="Փնտրել…"
            aria-label="Փնտրել ապրանք կամ վաճառող"
          />
        </div>
      </div>

      {tags.length > 0 ? (
        <div className="filter-summary">
          {tags.map((tag) => (
            <span className="filter-tag" key={tag.key}>
              {tag.label}
              <button type="button" onClick={tag.clear} aria-label={`Հեռացնել՝ ${tag.label}`}>
                ✕
              </button>
            </span>
          ))}
        </div>
      ) : null}
    </>
  );
}
