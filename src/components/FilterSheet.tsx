import { useState } from 'react';
import Modal from './Modal';
import ProducePicker from './ProducePicker';
import {
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  getProduce,
  type Produce,
  type ProduceCategory,
} from '../data/produce';
import { formatPrice } from '../lib/format';
import { SALE_TYPE_SHORT } from './markers';
import {
  DEFAULT_FILTERS,
  FORM_LABELS,
  type Filters,
  type LatLng,
  type SaleType,
} from '../lib/types';
import { IconChevronDown, IconRoute, IconWarn } from './Icons';
import PlaceSearch from './PlaceSearch';
import InAppBrowserNotice from './InAppBrowserNotice';

/** Above this the price filter stops constraining anything. */
export const PRICE_CEILING = 10000;
export const RADIUS_MAX = 100;

interface FilterSheetProps {
  filters: Filters;
  onChange: (next: Filters) => void;
  onClose: () => void;
  matchCount: number;
  hasLocation: boolean;
  onRequestLocation: () => void;
  onPickLocation: (point: LatLng) => void;
  locating: boolean;
}

export default function FilterSheet({
  filters,
  onChange,
  onClose,
  matchCount,
  hasLocation,
  onRequestLocation,
  onPickLocation,
  locating,
}: FilterSheetProps) {
  const [pickerOpen, setPickerOpen] = useState(false);

  const patch = (next: Partial<Filters>) => onChange({ ...filters, ...next });

  const toggleCategory = (category: ProduceCategory) =>
    patch({
      categories: filters.categories.includes(category)
        ? filters.categories.filter((entry) => entry !== category)
        : [...filters.categories, category],
    });

  const toggleProduct = (produce: Produce) =>
    patch({
      productIds: filters.productIds.includes(produce.id)
        ? filters.productIds.filter((id) => id !== produce.id)
        : [...filters.productIds, produce.id],
    });

  const reset = () => onChange({ ...DEFAULT_FILTERS });

  return (
    <>
      <Modal
        title="Ֆիլտրեր"
        subtitle={`${matchCount} հայտարարություն համապատասխանում է`}
        onClose={onClose}
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={reset}>
              Մաքրել
            </button>
            <button type="button" className="btn btn-cta btn-block" onClick={onClose}>
              Ցույց տալ ({matchCount})
            </button>
          </>
        }
      >
        {/* ─── distance ────────────────────────────────────────────────── */}
        <section className="filter-section">
          <h3>Հասանելիության շառավիղ</h3>

          {hasLocation ? (
            <>
              <div className="switch-row">
                <div className="switch-text">
                  <strong>Սահմանափակել հեռավորությամբ</strong>
                  <small>Հաշվարկվում է ճանապարհի երկարությամբ, ոչ թե ուղիղ գծով։</small>
                </div>
                <button
                  type="button"
                  className="switch"
                  aria-pressed={filters.radiusKm !== null}
                  aria-label="Միացնել հեռավորության սահմանափակումը"
                  onClick={() => patch({ radiusKm: filters.radiusKm === null ? 25 : null })}
                >
                  <i />
                </button>
              </div>

              {filters.radiusKm !== null ? (
                <div className="range-row" style={{ marginTop: 12 }}>
                  <input
                    type="range"
                    min={1}
                    max={RADIUS_MAX}
                    step={1}
                    value={filters.radiusKm}
                    onChange={(event) => patch({ radiusKm: Number(event.target.value) })}
                    aria-label="Շառավիղ կիլոմետրով"
                  />
                  <span className="range-value">
                    {filters.radiusKm} կմ
                  </span>
                </div>
              ) : null}

              <p className="field-hint" style={{ display: 'flex', gap: 7, marginTop: 10 }}>
                <IconRoute size={15} />
                <span>
                  Երբ երթուղիների ծառայությունը հասանելի չէ, ցուցադրվում է մոտավոր
                  հեռավորություն՝ համապատասխան նշումով։
                </span>
              </p>
            </>
          ) : (
            <>
              <InAppBrowserNotice />

              <div className="detail-note" style={{ display: 'flex', gap: 10 }}>
                <IconWarn />
                <div style={{ flex: 1 }}>
                  Հեռավորությամբ ֆիլտրելու համար պետք է իմանանք, թե որտեղից եք չափում։
                  <button
                    type="button"
                    className="btn btn-green btn-sm"
                    style={{ marginTop: 10 }}
                    onClick={onRequestLocation}
                    disabled={locating}
                  >
                    {locating ? <span className="spinner" /> : null}
                    Որոշել ավտոմատ
                  </button>
                </div>
              </div>

              {/* Works without any permission, so it is the reliable path when
                  the automatic one is blocked. */}
              <p className="field-hint" style={{ margin: '0 0 8px' }}>
                Կամ գրե՛ք, թե որտեղից եք փնտրում.
              </p>
              <PlaceSearch onPick={(point) => onPickLocation(point)} />
            </>
          )}
        </section>

        {/* ─── sale type ───────────────────────────────────────────────── */}
        <section className="filter-section">
          <h3>Վաճառքի ձևը</h3>
          <div className="cat-row">
            {(['any', 'retail', 'wholesale'] as const).map((value) => (
              <button
                key={value}
                type="button"
                className="cat-pill"
                aria-pressed={filters.saleType === value}
                onClick={() => patch({ saleType: value as SaleType | 'any' })}
              >
                {value === 'any' ? 'Բոլորը' : SALE_TYPE_SHORT[value]}
              </button>
            ))}
          </div>
          <p className="field-hint">
            «Մանրածախ»-ը ցույց է տալիս նաև այն վաճառողներին, ովքեր վաճառում են երկու ձևով։
          </p>
        </section>

        {/* ─── fresh or dried ──────────────────────────────────────────── */}
        <section className="filter-section">
          <h3>Թարմ թե չիր</h3>
          <div className="cat-row">
            {(['any', 'fresh', 'dried'] as const).map((value) => (
              <button
                key={value}
                type="button"
                className="cat-pill"
                aria-pressed={filters.form === value}
                onClick={() => patch({ form: value })}
              >
                {value === 'any' ? 'Բոլորը' : FORM_LABELS[value]}
              </button>
            ))}
          </div>
          <p className="field-hint">
            Չիրը առանձին ապրանք չէ՝ նույն մրգի կամ բանջարեղենի չորացրած տեսակն է։
          </p>
        </section>

        {/* ─── price ───────────────────────────────────────────────────── */}
        <section className="filter-section">
          <h3>Առավելագույն գին՝ 1 կգ</h3>
          <div className="range-row">
            <input
              type="range"
              min={100}
              max={PRICE_CEILING}
              step={100}
              value={filters.maxPrice ?? PRICE_CEILING}
              onChange={(event) => {
                const value = Number(event.target.value);
                patch({ maxPrice: value >= PRICE_CEILING ? null : value });
              }}
              aria-label="Առավելագույն գին"
            />
            <span className="range-value">
              {filters.maxPrice === null ? 'Առանց սահմանի' : formatPrice(filters.maxPrice)}
            </span>
          </div>
        </section>

        {/* ─── categories ──────────────────────────────────────────────── */}
        <section className="filter-section">
          <h3>Կատեգորիա</h3>
          <div className="cat-row">
            {CATEGORY_ORDER.map((category) => (
              <button
                key={category}
                type="button"
                className="cat-pill"
                aria-pressed={filters.categories.includes(category)}
                onClick={() => toggleCategory(category)}
              >
                {CATEGORY_LABELS[category]}
              </button>
            ))}
          </div>
        </section>

        {/* ─── specific products ───────────────────────────────────────── */}
        <section className="filter-section">
          <h3>Կոնկրետ ապրանքներ</h3>
          <button type="button" className="picker-trigger" onClick={() => setPickerOpen(true)}>
            <span className="picker-swatch" style={{ background: 'var(--bg-tint)' }} aria-hidden="true">
              🧺
            </span>
            <span className="picker-text">
              <span className="picker-name">
                {filters.productIds.length === 0
                  ? 'Բոլոր ապրանքները'
                  : `Ընտրված է ${filters.productIds.length}`}
              </span>
              <span className="picker-cat">
                {filters.productIds.length === 0
                  ? 'Հպե՛ք՝ կոնկրետ ապրանք ընտրելու համար'
                  : filters.productIds
                      .map((id) => getProduce(id)?.hy ?? id)
                      .slice(0, 4)
                      .join(', ') + (filters.productIds.length > 4 ? '…' : '')}
              </span>
            </span>
            <IconChevronDown />
          </button>
        </section>
      </Modal>

      {pickerOpen ? (
        <ProducePicker
          multiple
          title="Ընտրել ապրանքները"
          selected={filters.productIds}
          onToggle={toggleProduct}
          onClose={() => setPickerOpen(false)}
        />
      ) : null}
    </>
  );
}
