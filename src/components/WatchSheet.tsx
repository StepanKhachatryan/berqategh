import { useEffect, useState } from 'react';
import Modal from './Modal';
import ProducePicker from './ProducePicker';
import ProduceMark from './ProduceMark';
import { IconBell, IconCrosshair } from './Icons';
import { getProduce } from '../data/produce';
import {
  pushErrorText,
  pushStatus,
  pushSupport,
  pushUnavailableText,
  setWatch,
  type PushStatus,
} from '../lib/push';
import type { LatLng } from '../lib/types';

const RADII = [10, 25, 50, 100] as const;

interface WatchSheetProps {
  /** Products the buyer is filtering by now: the natural first choice. */
  initialProducts: string[];
  position: LatLng | null;
  onLocate: () => Promise<LatLng | null>;
  onDone: (message: string) => void;
  onClose: () => void;
}

/**
 * "Tell me when there is new X near me." One watch per phone: products (or
 * every product), and a radius around the buyer, or the whole country. At
 * most three notifications a day, so it never becomes noise.
 */
export default function WatchSheet({ initialProducts, position, onLocate, onDone, onClose }: WatchSheetProps) {
  const support = pushSupport();
  const unavailable = pushUnavailableText(support);
  const [status, setStatus] = useState<PushStatus | null>(null);
  const [products, setProducts] = useState<string[]>(initialProducts);
  const [radius, setRadius] = useState<number | null>(50);
  const [point, setPoint] = useState<LatLng | null>(position);
  const [locating, setLocating] = useState(false);
  const [picking, setPicking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (support !== 'ok') return;
    pushStatus().then((current) => {
      setStatus(current);
      // Editing an existing watch starts from what it is.
      if (current.watch && initialProducts.length === 0) setProducts(current.watch.products);
      if (current.watch && !current.watch.hasPoint) setRadius(null);
    }, () => setStatus({ seller: false, watch: null }));
  }, [support, initialProducts.length]);

  const locate = async () => {
    setLocating(true);
    try {
      const found = await onLocate();
      if (found) setPoint(found);
    } finally {
      setLocating(false);
    }
  };

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      await setWatch({ products, point: radius === null ? null : point, radiusKm: radius });
      onDone('Ծանուցումները միացված են։ Նոր առաջարկի դեպքում կստանաք հաղորդագրություն։');
      onClose();
    } catch (e) {
      setError(pushErrorText(e));
      setBusy(false);
    }
  };

  const stop = async () => {
    setBusy(true);
    try {
      await setWatch(null);
      onDone('Նոր առաջարկների ծանուցումներն անջատված են։');
      onClose();
    } catch (e) {
      setError(pushErrorText(e));
      setBusy(false);
    }
  };

  const needsPoint = radius !== null && !point;

  return (
    <>
      <Modal
        title="Նոր առաջարկների ծանուցում"
        onClose={onClose}
        footer={
          support === 'ok' ? (
            <div style={{ display: 'grid', gap: 8 }}>
              <button
                type="button"
                className="btn btn-green btn-lg btn-block"
                disabled={busy || needsPoint || status === null}
                onClick={() => void save()}
              >
                <IconBell size={18} />
                {status?.watch ? 'Պահպանել' : 'Միացնել ծանուցումները'}
              </button>
              {status?.watch ? (
                <button type="button" className="btn btn-ghost btn-block" disabled={busy} onClick={() => void stop()}>
                  Անջատել
                </button>
              ) : null}
            </div>
          ) : undefined
        }
      >
        <p className="watch-intro">
          Ծանուցում կստանաք, երբ ձեր ընտրած բերքը նոր տեղադրվի ձեր մոտակայքում՝ օրական ոչ ավելի, քան 3։
        </p>

        {unavailable ? <p className="notify-hint">{unavailable}</p> : null}

        {support === 'ok' ? (
          <>
            <h4 className="watch-label">Ինչ բերք</h4>
            <div className="watch-products">
              {products.length === 0 ? (
                <span className="watch-chip">Բոլոր ապրանքները</span>
              ) : (
                products.map((id) => (
                  <span key={id} className="watch-chip">
                    <ProduceMark productId={id} />
                    {getProduce(id)?.hy ?? id}
                  </span>
                ))
              )}
              <button type="button" className="watch-change" onClick={() => setPicking(true)}>
                Փոխել
              </button>
              {products.length > 0 ? (
                <button type="button" className="watch-change" onClick={() => setProducts([])}>
                  Բոլորը
                </button>
              ) : null}
            </div>

            <h4 className="watch-label">Որտեղ</h4>
            <div className="watch-radius" role="group" aria-label="Շառավիղ">
              {RADII.map((km) => (
                <button key={km} type="button" className="seg" aria-pressed={radius === km} onClick={() => setRadius(km)}>
                  <span className="seg-label">{km} կմ</span>
                </button>
              ))}
              <button type="button" className="seg" aria-pressed={radius === null} onClick={() => setRadius(null)}>
                <span className="seg-label">Ամբողջ ՀՀ</span>
              </button>
            </div>

            {radius !== null ? (
              point ? (
                <p className="watch-point">Ձեր տեղադիրքից {radius} կմ շառավղում։</p>
              ) : (
                <div className="watch-point">
                  <span>Շառավղի համար պետք է ձեր տեղադիրքը։</span>
                  <button type="button" className="btn btn-ghost btn-sm" disabled={locating} onClick={() => void locate()}>
                    <IconCrosshair size={15} />
                    {locating ? 'Որոշվում է…' : 'Որոշել տեղադիրքը'}
                  </button>
                </div>
              )
            ) : null}

            {error ? <p className="notify-error">{error}</p> : null}
          </>
        ) : null}
      </Modal>

      {picking ? (
        <ProducePicker
          multiple
          title="Ընտրել ապրանքները"
          selected={products}
          onToggle={(picked) =>
            setProducts((current) =>
              current.includes(picked.id) ? current.filter((id) => id !== picked.id) : [...current, picked.id],
            )
          }
          onClose={() => setPicking(false)}
        />
      ) : null}
    </>
  );
}
