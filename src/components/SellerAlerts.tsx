import { useEffect, useState } from 'react';
import { IconBell, IconCheck } from './Icons';
import { pushErrorText, pushStatus, pushSupport, pushUnavailableText, setSellerAlerts } from '../lib/push';

/**
 * The seller's reminder: a notification two days before a listing leaves the
 * map. Offered right after publishing and kept in «Իմ հայտարարությունները».
 * Where the phone cannot receive notifications, it says why instead.
 */
export default function SellerAlerts() {
  const support = pushSupport();
  const [on, setOn] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (support !== 'ok') return;
    pushStatus().then((status) => setOn(status.seller), () => setOn(false));
  }, [support]);

  const unavailable = pushUnavailableText(support);

  const toggle = async (next: boolean) => {
    setBusy(true);
    setError(null);
    try {
      await setSellerAlerts(next);
      setOn(next);
    } catch (e) {
      setError(pushErrorText(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="notify-card">
      <IconBell size={20} />
      <div className="notify-text">
        <b>Հիշեցում ժամկետից առաջ</b>
        <span>
          Ծանուցում կստանաք 2 օր առաջ, երբ ձեր հայտարարությունը պետք է հանվի քարտեզից։
        </span>
        {unavailable ? <span className="notify-hint">{unavailable}</span> : null}
        {error ? <span className="notify-error">{error}</span> : null}
      </div>
      {support === 'ok' ? (
        on ? (
          <button type="button" className="notify-on" disabled={busy} onClick={() => void toggle(false)}>
            <IconCheck size={14} /> Միացված է
          </button>
        ) : (
          <button type="button" className="btn btn-ghost btn-sm" disabled={busy || on === null} onClick={() => void toggle(true)}>
            Միացնել
          </button>
        )
      ) : null}
    </div>
  );
}
