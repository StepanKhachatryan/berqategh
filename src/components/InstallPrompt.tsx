import { useEffect, useState } from 'react';
import { detectInAppBrowser, isAndroid } from '../lib/environment';
import { record } from '../lib/analytics';
import { IconClose, IconCheck } from './Icons';

/**
 * The offer to keep ԲերքաՏեղ on the home screen, shown to Android visitors who
 * arrived in a real browser.
 *
 * Chrome decides on its own whether to mention installing, and when it does the
 * hint is a thin bar that most people never notice. Catching the event instead
 * and asking properly is the difference between an install that happens by
 * accident and one that happens because somebody was asked.
 *
 * Narrow on purpose:
 *
 *   • Android only — iOS has no install API at all, and offering something
 *     Safari cannot do would just be a dead button.
 *   • Real browsers only — inside the Facebook and Instagram WebViews the event
 *     never fires, because those browsers cannot install anything.
 *   • Once. A declined offer stays declined; nothing here comes back to nag.
 */

const DISMISSED_KEY = 'berqategh.installDismissed';

interface PromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function wasDismissed(): boolean {
  try {
    return localStorage.getItem(DISMISSED_KEY) === '1';
  } catch {
    return false;
  }
}

function remember(): void {
  try {
    localStorage.setItem(DISMISSED_KEY, '1');
  } catch {
    // Storage refused; the offer may reappear next visit, which is acceptable.
  }
}

export default function InstallPrompt() {
  const [event, setEvent] = useState<PromptEvent | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isAndroid() || detectInAppBrowser() || wasDismissed()) return;

    const onPrompt = (e: Event) => {
      // Chrome shows its own bar unless told not to; ours replaces it.
      e.preventDefault();
      setEvent(e as PromptEvent);
      record({ kind: 'install_shown' });
    };

    window.addEventListener('beforeinstallprompt', onPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  if (!event) return null;

  const close = (accepted: boolean) => {
    remember();
    setEvent(null);
    record({ kind: accepted ? 'install_accepted' : 'install_dismissed' });
  };

  async function install() {
    if (!event || busy) return;
    setBusy(true);
    try {
      await event.prompt();
      const { outcome } = await event.userChoice;
      close(outcome === 'accepted');
    } catch {
      // Chrome refuses a second prompt on the same event; drop the offer
      // rather than leave a button that does nothing.
      close(false);
    }
  }

  return (
    <div className="install-card" role="dialog" aria-label="Տեղադրել հավելվածը">
      <img src="/icon-192.png" alt="" width={46} height={46} className="install-icon" />

      <div className="install-text">
        <strong>Տեղադրե՛ք ԲերքաՏեղը հեռախոսում</strong>
        <span>Կբացվի մեկ հպումով՝ առանց բրաուզերի։</span>
      </div>

      <button type="button" className="btn btn-cta btn-sm install-yes" onClick={install} disabled={busy}>
        {busy ? <span className="spinner" /> : <IconCheck size={15} />}
        Տեղադրել
      </button>

      <button
        type="button"
        className="icon-btn install-no"
        onClick={() => close(false)}
        aria-label="Փակել"
      >
        <IconClose size={15} />
      </button>
    </div>
  );
}
