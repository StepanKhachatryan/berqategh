import { useEffect, useMemo, useRef, useState } from 'react';
import Modal from './Modal';
import ProducePicker from './ProducePicker';
import ProduceMark from './ProduceMark';
import LocationPicker from './LocationPicker';
import { CONSENT_DETAIL, CONSENT_LABEL, SELLER_MEMORY_KEY } from '../lib/marketing';
import { PHOTO_ACCEPT, PhotoError, preparePhoto, type PreparedPhoto } from '../lib/photo';
import { canBeDried, CATEGORY_LABELS, getProduce, type Produce } from '../data/produce';
import { isValidLocalPhone, PHONE_LOCAL_LENGTH, toE164 } from '../lib/format';
import { isInsideArmenia } from '../lib/geo';
import { LOCATE_MESSAGES, type LocateStatus } from '../lib/useGeolocation';
import type { LatLng, ListingDraft, ProduceForm, SaleType } from '../lib/types';
import { IconCheck, IconChevronDown, IconWarn } from './Icons';
import { swatchStyle } from './markers';

const SALE_OPTIONS: { value: SaleType; label: string; emoji: string }[] = [
  { value: 'retail', label: 'Միայն մանրածախ', emoji: '🛍️' },
  { value: 'wholesale', label: 'Միայն մեծածախ', emoji: '📦' },
  { value: 'both', label: 'Երկուսն էլ', emoji: '💎' },
];

const DURATION_OPTIONS: { value: number; label: string }[] = [
  { value: 5, label: '5 օր' },
  { value: 10, label: '10 օր' },
  { value: 30, label: '1 ամիս' },
  { value: 90, label: '3 ամիս' },
];

const REMEMBERED_KEY = SELLER_MEMORY_KEY;

interface Remembered {
  phone: string;
  name: string;
  /**
   * The seller's own last answer to the offers box. Starting the next form from
   * it is their choice carried forward, not a box ticked on their behalf; a
   * seller who has never answered starts from unticked.
   */
  offers: boolean;
}

function loadRemembered(): Remembered {
  const blank: Remembered = { phone: '', name: '', offers: false };
  try {
    const raw = localStorage.getItem(REMEMBERED_KEY);
    if (raw) return { ...blank, ...(JSON.parse(raw) as Partial<Remembered>) };
  } catch {
    // A corrupt entry is not worth failing the form over.
  }
  return blank;
}

interface SellerFormProps {
  initialLocation: LatLng | null;
  locateStatus: LocateStatus;
  /** `silent` suppresses the error toast for lookups the seller did not ask for. */
  onLocate: (silent?: boolean) => Promise<LatLng | null>;
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
  const [offers, setOffers] = useState(remembered.offers);
  const [photo, setPhoto] = useState<PreparedPhoto | null>(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  // The preview is an object URL; let it go when replaced or when the form closes.
  useEffect(() => () => {
    if (photo) URL.revokeObjectURL(photo.previewUrl);
  }, [photo]);

  async function handlePhotoPicked(input: HTMLInputElement) {
    const file = input.files?.[0];
    // Cleared at once, so picking the same file again still fires a change.
    input.value = '';
    if (!file) return;

    setPhotoError(null);
    setPhotoBusy(true);
    try {
      setPhoto(await preparePhoto(file));
    } catch (error) {
      setPhotoError(
        error instanceof PhotoError ? error.message : 'Չհաջողվեց մշակել նկարը։ Փորձե՛ք այլ լուսանկար։',
      );
    } finally {
      setPhotoBusy(false);
    }
  }

  function clearPhoto() {
    setPhoto(null);
    setPhotoError(null);
  }
  const [note, setNote] = useState('');
  const [location, setLocation] = useState<LatLng | null>(initialLocation);
  // Whether the pin came from a deliberate choice rather than from the device.
  // Once it did, the geolocation status stops being what the seller needs told.
  const [pickedByHand, setPickedByHand] = useState(false);
  const [durationDays, setDurationDays] = useState(30);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);

  const wantsRetail = saleType === 'retail' || saleType === 'both';
  const wantsWholesale = saleType === 'wholesale' || saleType === 'both';
  const dryable = product ? canBeDried(product.id) : false;

  /*
   * Ask for the seller's position as soon as the form opens - the common case
   * is a farmer standing at the stall who should not have to do anything.
   *
   * Exactly once per opening, guarded by a ref rather than by the dependency
   * list. A lookup changes state, state changes identities, and anything in the
   * dependencies that moves turns "on open" into "forever": the form asked
   * again, the answer failed again, and the failures stacked up over the fields
   * until nothing could be filled in. A ref cannot be invalidated by a re-render,
   * so the attempt happens on opening and never again.
   *
   * Silent, too. If it fails, the status line below says so and the village
   * search is right there; the seller asked to publish a harvest, not to be
   * located.
   */
  const askedOnOpen = useRef(false);

  useEffect(() => {
    if (initialLocation || askedOnOpen.current) return;
    askedOnOpen.current = true;

    let cancelled = false;
    setLocating(true);
    onLocate(true)
      .then((point) => {
        if (!cancelled && point) setLocation(point);
      })
      // Deliberately not gated on `cancelled`: React's strict mode runs an
      // effect, tears it down and runs it again, and the second run stops at
      // the ref above. If the spinner were switched off only by a run that was
      // never cancelled, it would be the torn-down first run that owned it and
      // the button would spin for ever.
      .finally(() => setLocating(false));

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
    if (!location) {
      found.location = 'Նշե՛ք վաճառքի կետը քարտեզի վրա';
    } else if (!isInsideArmenia(location)) {
      // The database refuses these too; catching it here means the seller can
      // still fix the pin instead of meeting an error on submit.
      found.location = 'Կետը Հայաստանից դուրս է - նշե՛ք վաճառքի կետը Հայաստանի ներսում';
    }

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
        durationDays,
        marketingConsent: offers,
        photo: photo?.blob ?? null,
      });

      localStorage.setItem(
        REMEMBERED_KEY,
        JSON.stringify({ phone, name: sellerName.trim(), offers } satisfies Remembered),
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
        subtitle={`Հայտարարությունը քարտեզին կմնա ${
          durationDays === 30 ? '1 ամիս' : durationDays === 90 ? '3 ամիս' : `${durationDays} օր`
        }`}
        onClose={onClose}
        footer={
          <>
            {/* Kept beside the button, not at the foot of the form. Down there it
                sat below the fold of a long scrolling sheet, so a rejected
                publish looked to the seller like the button did nothing. */}
            {failure ? (
              <div className="detail-note" style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                <IconWarn />
                <span>Չհաջողվեց հրապարակել՝ {failure}</span>
              </div>
            ) : showErrors && !isValid ? (
              <div className="detail-note" style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                <IconWarn />
                <span>Ձևը լրացված չէ․ վերևում կարմիրով նշված են լրացնելու դաշտերը։</span>
              </div>
            ) : null}
            <button
              type="button"
              className="btn btn-cta btn-lg btn-block"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? <span className="spinner" /> : <IconCheck />}
              {submitting ? 'Պահպանվում է…' : 'Հրապարակել քարտեզին'}
            </button>
          </>
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
              className="produce-swatch picker-swatch"
              style={swatchStyle(product?.color ?? '#9aa79c')}
              aria-hidden="true"
            >
              {/* Follows the fresh/dried choice below, so the preview is the
                  same picture the buyer will see on the map. */}
              <ProduceMark
                productId={product?.id ?? ''}
                form={dryable ? form : 'fresh'}
                fallback="🧺"
              />
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
            <p className="field-hint">Անջատված է - դուք ընտրել եք միայն մեծածախ վաճառք։</p>
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
            <p className="field-hint">Անջատված է - դուք ընտրել եք միայն մանրածախ վաճառք։</p>
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

        {/* ─── photo ───────────────────────────────────────────────────── */}
        <div className="field">
          <label className="field-label">
            Լուսանկար <span style={{ color: 'var(--ink-faint)', fontWeight: 500 }}>(ըստ ցանկության)</span>
          </label>

          {/* Two inputs rather than one, so the choice is two plain buttons:
              the camera, or a photo already on the phone. A single input
              leaves that choice to a system menu many sellers never see. */}
          <input
            ref={cameraRef}
            type="file"
            accept={PHOTO_ACCEPT}
            capture="environment"
            hidden
            onChange={(event) => void handlePhotoPicked(event.target)}
          />
          <input
            ref={galleryRef}
            type="file"
            accept={PHOTO_ACCEPT}
            hidden
            onChange={(event) => void handlePhotoPicked(event.target)}
          />

          {photo ? (
            <div className="photo-preview">
              <img src={photo.previewUrl} alt="Ձեր լուսանկարը" />
              <div className="photo-preview-actions">
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => galleryRef.current?.click()}>
                  Փոխել
                </button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={clearPhoto}>
                  Հեռացնել
                </button>
              </div>
            </div>
          ) : (
            <div className="photo-pick">
              <button
                type="button"
                className="btn btn-ghost"
                disabled={photoBusy}
                onClick={() => cameraRef.current?.click()}
              >
                📷 Նկարել
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                disabled={photoBusy}
                onClick={() => galleryRef.current?.click()}
              >
                🖼️ Ընտրել նկարներից
              </button>
            </div>
          )}

          {photoBusy ? <p className="field-hint">Նկարը մշակվում է…</p> : null}
          {photoError ? <p className="field-error">{photoError}</p> : null}
          <p className="field-hint">
            Մեկ լուսանկար՝ ձեր բերքի։ Անպատշաճ
            լուսանկարները կհեռացվեն։
          </p>
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

          {/* Right under the number it is about. Unticked unless the seller
              ticked it last time, and the whole of what it means is written
              out beside it rather than behind a link nobody opens. */}
          <label className="consent-check">
            <input
              type="checkbox"
              checked={offers}
              onChange={(event) => setOffers(event.target.checked)}
            />
            <span>
              <b>{CONSENT_LABEL}</b>
              <small>{CONSENT_DETAIL}</small>
            </span>
          </label>
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

        {/* ─── duration ────────────────────────────────────────────────── */}
        <div className="field">
          <label className="field-label">
            Հայտարարության տեւողությունը <span className="req">*</span>
          </label>
          <div className="segmented">
            {DURATION_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                className="seg"
                aria-pressed={durationDays === option.value}
                onClick={() => setDurationDays(option.value)}
              >
                <span className="seg-label">{option.label}</span>
              </button>
            ))}
          </div>
          <p className="field-hint">
            Ընտրե՛ք, թե քանի օր հայտարարությունը պետք է քարտեզին մնա։ Կարող եք նաև ավելի ուշ
            վերհրապարակել այն։
          </p>
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
        placeholder={disabled ? '-' : 'Օր․՝ 450'}
      />
      <span className="affix affix-end">֏ / կգ</span>
    </div>
  );
}

function isPositiveInteger(raw: string): boolean {
  const value = Number(raw);
  return raw.trim() !== '' && Number.isFinite(value) && value > 0 && value <= 1_000_000;
}
