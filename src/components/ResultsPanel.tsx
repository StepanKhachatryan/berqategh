import ListingCard from './ListingCard';
import { SORT_LABELS, type SortKey } from '../lib/filter';
import { IconChevronDown, IconChevronUp, IconFilter, IconSearch } from './Icons';
import type { Filters, MeasuredListing } from '../lib/types';
import { getProduce } from '../data/produce';
import { SALE_TYPE_SHORT } from './markers';
import { formatPrice } from '../lib/format';

interface ResultsPanelProps {
  listings: MeasuredListing[];
  totalCount: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
  sort: SortKey;
  onSortChange: (sort: SortKey) => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  onOpenFilters: () => void;
  activeFilterCount: number;
  now: number;
  measuring: boolean;
}

export default function ResultsPanel({
  listings,
  totalCount,
  selectedId,
  onSelect,
  sort,
  onSortChange,
  collapsed,
  onToggleCollapsed,
  filters,
  onFiltersChange,
  onOpenFilters,
  activeFilterCount,
  now,
  measuring,
}: ResultsPanelProps) {
  return (
    <div className={`results${collapsed ? ' is-collapsed' : ''}`}>
      <button
        type="button"
        className="results-toggle"
        onClick={onToggleCollapsed}
        aria-label={collapsed ? 'Բացել ցանկը' : 'Փակել ցանկը'}
        aria-expanded={!collapsed}
      >
        {collapsed ? <IconChevronUp /> : <IconChevronDown />}
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
