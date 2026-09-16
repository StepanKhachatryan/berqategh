import { useState } from 'react';
import {
  copyCurrentLink,
  detectInAppBrowser,
  IN_APP_LABELS,
  isAndroid,
  isIOS,
  openInExternalBrowser,
} from '../lib/environment';
import { IconArrowRight, IconCheck, IconInfo } from './Icons';

/**
 * Shown only inside an in-app browser, and only where location matters.
 *
 * The message leads with what still works — picking the place by name — because
 * that path needs no permission and no app switching. Jumping to the real
 * browser is offered second, since both routes out of a WebView are
 * best-effort and can be swallowed silently by the host app; the copy-link
 * fallback is always left visible for that reason.
 */
export default function InAppBrowserNotice() {
  const [copied, setCopied] = useState(false);
  const [tried, setTried] = useState(false);

  const kind = detectInAppBrowser();
  if (!kind) return null;

  const canJump = isAndroid() || isIOS();
  const manualHint = isIOS()
    ? 'կամ ներքևի «⋯» կոճակից ընտրե՛ք «Open in browser»'
    : 'կամ վերևի «⋮» կոճակից ընտրե՛ք «Open in browser»';

  return (
    <div className="inapp-notice">
      <div className="inapp-head">
        <IconInfo size={17} />
        <strong>{IN_APP_LABELS[kind]}-ի ներսում տեղադիրքը չի որոշվում ավտոմատ</strong>
      </div>

      <p>
        Դա {IN_APP_LABELS[kind]}-ի սահմանափակումն է, ոչ թե կայքի։ <b>Ոչինչ չեք կորցնում</b> —
        գրե՛ք ձեր գյուղի կամ քաղաքի անունը ներքևի դաշտում, և կետը կհայտնվի քարտեզին։
        Հետո կարող եք շարժել քարտեզը՝ ճշգրիտ տեղը նշելու համար։
      </p>

      <div className="inapp-actions">
        {canJump ? (
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => {
              setTried(true);
              openInExternalBrowser();
            }}
          >
            Բացել բրաուզերում <IconArrowRight size={15} />
          </button>
        ) : null}

        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={async () => {
            const done = await copyCurrentLink();
            setCopied(done);
            if (done) window.setTimeout(() => setCopied(false), 4000);
          }}
        >
          {copied ? <IconCheck size={15} /> : null}
          {copied ? 'Պատճենվեց' : 'Պատճենել հղումը'}
        </button>
      </div>

      {tried ? <p className="inapp-hint">Եթե ոչինչ չբացվեց՝ {manualHint}։</p> : null}
    </div>
  );
}
