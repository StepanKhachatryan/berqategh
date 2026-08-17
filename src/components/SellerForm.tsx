import { useEffect, useMemo, useState } from 'react';
import Modal from './Modal';
import ProducePicker from './ProducePicker';
import LocationPicker from './LocationPicker';
import { canBeDried, CATEGORY_LABELS, getProduce, type Produce } from '../data/produce';
import { isValidLocalPhone, PHONE_LOCAL_LENGTH, toE164 } from '../lib/format';
import { LOCATE_MESSAGES, type LocateStatus } from '../lib/useGeolocation';
import type { LatLng, ListingDraft, ProduceForm, SaleType } from '../lib/types';
import { IconCheck, IconChevronDown, IconWarn } from './Icons';

const SALE_OPTIONS: { value: SaleType; label: string; emoji: string }[] = [
  { value: 'retail', label: 'Միայն մանրածախ', emoji: '🛍️' },
  { value: 'wholesale', label: 'Միայն մեծածախ', emoji: '📦' },
  { value: 'both', label: 'Երկուսն էլ', emoji: '💎' },
];

const REMEMBERED_KEY = 'berqategh.seller';

interface Remembered {
  phone: string;
  name: string;
}

function loadRemembered(): Remembered {
  try {
    const raw = localStorage.getItem(REMEMBERED_KEY);
    if (raw) return { phone: '', name: '', ...(JSON.parse(raw) as Partial<Remembered>) };
  } catch {
    // A corrupt entry is not worth failing the form over.
  }
  return { phone: '', name: '' };
}

interface SellerFormProps {
  initialLocation: LatLng | null;
  locateStatus: LocateStatus;
  onLocate: () => Promise<LatLng | null>;
  onSubmit: (draft: ListingDraft) => Promise<void>;
  onClose: () => void;
}

interface FormErrors {
  product?: string;
  retailPrice?: string;
  wholesalePrice?: string;
  phone?: string;
  location?: string;
}

export default function SellerForm({
  initialLocation,
  locateStatus,
  onLocate,
  onSubmit,
  onClose,
}: SellerFormProps) {
  const remembered = useMemo(loadRemembered, []);

  const [product, setProduct] = useState<Produce | null>(null);
  const [form, setForm] = useState<ProduceForm>('fresh');
  const [saleType, setSaleType] = useState<SaleType>('retail');
  const [retailPrice, setRetailPrice] = useState('');
  const [wholesalePrice, setWholesalePrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [phone, setPhone] = useState(remembered.phone);
  const [sellerName, setSellerName] = useState(remembered.name);
  const [note, setNote] = useState('');
  const [location, setLocation] = useState<LatLng | null>(initialLocation);
  // Whether the pin came from a deliberate choice rather than from the device.
  // Once it did, the geolocation status stops being what the seller needs told.
  const [pickedByHand, setPickedByHand] = useState(false);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);

  const wantsRetail = saleType === 'retail' || saleType === 'both';
  const wantsWholesale = saleType === 'wholesale' || saleType === 'both';
  const dryable = product ? canBeDried(product.id) : false;

  // Ask for the seller's position as soon as the form opens — the common case
  // is a farmer standing at the stall who should not have to do anything.
  useEffect(() => {
    if (initialLocation) return;
    let cancelled = false;
    setLocating(true);
    onLocate()
      .then((point) => {
        if (!cancelled && point) setLocation(point);
      })
      .finally(() => {
        if (!cancelled) setLocating(false);
      });
    return () => {
      cancelled = true;
    };
  }, [initialLocation, onLocate]);

  const errors = useMemo<FormErrors>(() => {
    const found: FormErrors = {};
    if (!product) found.product = 'Ընտրե՛ք ապրանքը';

    if (wantsRetail && !isPositiveInteger(retailPrice)) {
      found.retailPrice = 'Նշե՛ք մանրածախ գինը';
    }
    if (wantsWholesale && !isPositiveInteger(wholesalePrice)) {
      found.wholesalePrice = 'Նշե՛ք մեծածախ գինը';
    }
    if (!isValidLocalPhone(phone)) {
      found.phone = `Հեռախոսահամարը պետք է լինի ${PHONE_LOCAL_LENGTH} նիշ, առանց առջևի զրոյի`;
    }
    if (!location) found.location = 'Նշե՛ք վաճառքի կետը քարտեզի վրա';

    return found;
  }, [product, wantsRetail, wantsWholesale, retailPrice, wholesalePrice, phone, location]);

  const isValid = Object.keys(errors).length === 0;

  async function handleLocate() {
    setLocating(true);
    try {
      const point = await onLocate();
      if (point) {
        setLocation(point);
        setPickedByHand(false);
      }
    } finally {
      setLocating(false);
    }
  }

  async function handleSubmit() {
    setShowErrors(true);
    setFailure(null);
    if (!isValid || !product || !location) return;

    setSubmitting(true);
    try {
      await onSubmit({
        productId: product.id,
        productName: product.hy,
        category: product.category,
        saleType,
        form: dryable ? form : 'fresh',
        retailPrice: wantsRetail ? Number(retailPrice) : null,
        wholesalePrice: wantsWholesale ? Number(wholesalePrice) : null,
        quantityKg: quantity.trim() ? Number(quantity) : null,
        phone: toE164(phone),
        sellerName: sellerName.trim() || null,
        note: note.trim() || null,
        lat: location.lat,
        lng: location.lng,
      });

      localStorage.setItem(
        REMEMBERED_KEY,
        JSON.stringify({ phone, name: sellerName.trim() } satisfies Remembered),
      );
    } catch (error) {
      setFailure(error instanceof Error ? error.message : 'Չհաջողվեց պահպանել');
      setSubmitting(false);
    }
  }

  const locateMessage = pickedByHand
    ? LOCATE_MESSAGES.manual
    : locating
      ? LOCATE_MESSAGES.locating
      : LOCATE_MESSAGES[locateStatus];

  // A hand-picked point is correct by definition — a failed GPS attempt behind
  // it is no longer a problem worth colouring red.
  const locateIsError =
    !pickedByHand && ['denied', 'unavailable', 'outside'].includes(locateStatus);

  return (
    <>
      <Modal
        title="Տեղադրել բերք"
        subtitle="Հայտարարությունը քարտեզին կմնա 48 ժամ"
        onClose={onClose}
        footer={
          <button
            type="button"
            className="btn btn-cta btn-lg btn-block"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? <span className="spinner" /> : <IconCheck />}
            {submitting ? 'Պահպանվում է…' : 'Հրապարակել քարտեզին'}
          </button>
        }
      >
        {/* ─── product ─────────────────────────────────────────────────── */}
        <div className="field">
          <label className="field-label">
            Ի՞նչ եք վաճառում <span className="req">*</span>
          </label>
          <button
            type="button"
            className={`picker-trigger${showErrors && errors.product ? ' has-error' : ''}`}
            onClick={() => setPickerOpen(true)}
          >
            <span
              className="picker-swatch"
              style={{ background: product?.color ?? 'var(--bg-tint)' }}
              aria-hidden="true"
            >
              {product?.emoji ?? '🧺'}
            </span>
            <span className="picker-text">
              {product ? (
                <>
                  <span className="picker-name">{product.hy}</span>
                  <span className="picker-cat">{CATEGORY_LABELS[product.category]}</span>
                </>
              ) : (
                <span className="picker-name picker-placeholder">Ընտրե՛ք ցանկից…</span>
              )}
            </span>
            <IconChevronDown />
          </button>
          {showErrors && errors.product ? (
            <p className="field-error">{errors.product}</p>
          ) : null}
        </div>

        {/* ─── fresh or dried ──────────────────────────────────────────── */}
        {dryable ? (
          <div className="field">
            <label className="field-label">Թարմ է թե չիր</label>
            <div className="segmented" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <button
                type="button"
                className="seg"
                aria-pressed={form === 'fresh'}
                onClick={() => setForm('fresh')}
              >
                <span style={{ fontSize: 19 }} aria-hidden="true">
                  {product?.emoji ?? '🍎'}
                </span>
                <span className="seg-label">Թարմ</span>
              </button>
              <button
                type="button"
                className="seg"
                aria-pressed={form === 'dried'}
                onClick={() => setForm('dried')}
              >
                <span style={{ fontSize: 19 }} aria-hidden="true">
                  ☀️
                </span>
                <span className="seg-label">Չիր</span>
              </button>
            </div>
            <p className="field-hint">
              Չիր ընտրելիս հայտարարությունը կհրապարակվի «{product?.hy} (չիր)» անունով, և
              գնորդները կկարողանան առանձին փնտրել այն։
            </p>
          </div>
        ) : null}

        {/* ─── sale type ───────────────────────────────────────────────── */}
        <div className="field">
          <label className="field-label">
            Ինչպե՞ս եք վաճառում <span className="req">*</span>
          </label>
          <div className="segmented">
            {SALE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                className="seg"
                aria-pressed={saleType === option.value}
                onClick={() => setSaleType(option.value)}
              >
                <span style={{ fontSize: 19 }} aria-hidden="true">
                  {option.emoji}
                </span>
                <span className="seg-label">{option.label}</span>
              </button>
            ))}
          </div>
          <p className="field-hint">
            Ընտրությունից է կախված, թե որ գնի դաշտերն են ակտիվանում։
          </p>
        </div>

        {/* ─── prices ──────────────────────────────────────────────────── */}
        <div className="field">
          <label className="field-label" htmlFor="retail-price">
            Մանրածախ գին՝ 1 կգ {wantsRetail ? <span className="req">*</span> : null}
          </label>
          <PriceInput
            id="retail-price"
            value={retailPrice}
            onChange={setRetailPrice}
            disabled={!wantsRetail}
            hasError={showErrors && Boolean(errors.retailPrice)}
          />
          {!wantsRetail ? (
            <p className="field-hint">Անջատված է — դուք ընտրել եք միայն մեծածախ վաճառք։</p>
          ) : showErrors && errors.retailPrice ? (
            <p className="field-error">{errors.retailPrice}</p>
          ) : null}
        </div>

        <div className="field">
          <label className="field-label" htmlFor="wholesale-price">
            Մեծածախ գին՝ 1 կգ {wantsWholesale ? <span className="req">*</span> : null}
          </label>
          <PriceInput
            id="wholesale-price"
            value={wholesalePrice}
            onChange={setWholesalePrice}
            disabled={!wantsWholesale}
            hasError={showErrors && Boolean(errors.wholesalePrice)}
          />
          {!wantsWholesale ? (
            <p className="field-hint">Անջատված է — դուք ընտրել եք միայն մանրածախ վաճառք։</p>
          ) : showErrors && errors.wholesalePrice ? (
            <p className="field-error">{errors.wholesalePrice}</p>
          ) : null}
        </div>

        {/* ─── quantity ────────────────────────────────────────────────── */}
        <div className="field">
          <label className="field-label" htmlFor="quantity">
            Առկա քանակը <span style={{ color: 'var(--ink-faint)', fontWeight: 500 }}>(ըստ ցանկության)</span>
          </label>
          <div className="input-affix">
            <input
              id="quantity"
              type="number"
              inputMode="decimal"
              min="0"
              step="1"
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              placeholder="Օր․՝ 200"
            />
            <span className="affix affix-end">կգ</span>
          </div>
        </div>

        {/* ─── phone ───────────────────────────────────────────────────── */}
        <div className="field">
          <label className="field-label" htmlFor="phone">
            Հեռախոսահամար <span className="req">*</span>
          </label>
          <div
            className={`input-affix${showErrors && errors.phone ? ' has-error' : ''}`}
          >
            <span className="affix">+374</span>
            <input
              id="phone"
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              value={phone}
              onChange={(event) =>
                setPhone(event.target.value.replace(/\D/g, '').slice(0, PHONE_LOCAL_LENGTH))
              }
              placeholder="93123456"
              aria-describedby="phone-hint"
            />
          </div>
          {showErrors && errors.phone ? (
            <p className="field-error">{errors.phone}</p>
          ) : (
            <p className="field-hint" id="phone-hint">
              Գրե՛ք համարը առանց առջևի զրոյի։ Գնորդները կզանգեն ուղիղ այս համարին։
            </p>
          )}
        </div>

        {/* ─── location ────────────────────────────────────────────────── */}
        <div className="field">
          <label className="field-label">
            Վաճառքի կետը <span className="req">*</span>
          </label>
          <LocationPicker
            value={location}
            onChange={(point) => {
              setLocation(point);
              setPickedByHand(true);
            }}
            onLocate={handleLocate}
            locating={locating}
            statusMessage={locateMessage}
            statusIsError={locateIsError}
            saleType={saleType}
            productColor={product?.color ?? '#9aa79c'}
          />
          <p className="field-hint">
            Համակարգը փորձում է ինքը գտնել ձեր տեղը։ Եթե չստացվեց կամ այս պահին վաճառքի
            կետում չեք՝ գրե՛ք գյուղի անունը վերևի դաշտում, ապա շարժե՛ք քարտեզը՝ ճիշտ
            կետը նշելու համար։
          </p>
          {showErrors && errors.location ? (
            <p className="field-error">{errors.location}</p>
          ) : null}
        </div>

        {/* ─── optional extras ─────────────────────────────────────────── */}
        <div className="field">
          <label className="field-label" htmlFor="seller-name">
            Ձեր անունը <span style={{ color: 'var(--ink-faint)', fontWeight: 500 }}>(ըստ ցանկության)</span>
          </label>
          <input
            id="seller-name"
            className="input"
            maxLength={80}
            value={sellerName}
            onChange={(event) => setSellerName(event.target.value)}
            placeholder="Օր․՝ Արամի տնտեսություն"
          />
        </div>

        <div className="field">
          <label className="field-label" htmlFor="note">
            Լրացուցիչ նշում <span style={{ color: 'var(--ink-faint)', fontWeight: 500 }}>(ըստ ցանկության)</span>
          </label>
          <textarea
            id="note"
            className="input"
            maxLength={300}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Օր․՝ առանց քիմիկատների, հավաքված է այսօր առավոտյան"
          />
        </div>

        {failure ? (
          <div className="detail-note" style={{ display: 'flex', gap: 10 }}>
            <IconWarn />
            <span>Չհաջողվեց հրապարակել՝ {failure}</span>
          </div>
        ) : null}
      </Modal>

      {pickerOpen ? (
        <ProducePicker
          selected={product ? [product.id] : []}
          onToggle={(picked) => {
            setProduct(getProduce(picked.id) ?? picked);
            // A crop that is never sold dried must not carry a stale "չիր".
            if (!canBeDried(picked.id)) setForm('fresh');
          }}
          onClose={() => setPickerOpen(false)}
        />
      ) : null}
    </>
  );
}

function PriceInput({
  id,
  value,
  onChange,
  disabled,
  hasError,
}: {
  id: string;
  value: string;
  onChange: (next: string) => void;
  disabled: boolean;
  hasError: boolean;
}) {
  return (
    <div
      className={`input-affix${disabled ? ' is-disabled' : ''}${hasError ? ' has-error' : ''}`}
    >
      <input
        id={id}
        type="number"
        inputMode="numeric"
        min="1"
        step="10"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        placeholder={disabled ? '—' : 'Օր․՝ 450'}
      />
      <span className="affix affix-end">֏ / կգ</span>
    </div>
  );
}

function isPositiveInteger(raw: string): boolean {
  const value = Number(raw);
  return raw.trim() !== '' && Number.isFinite(value) && value > 0 && value <= 1_000_000;
}
