import { useState } from 'react';
import Modal from './Modal';
import { signInWithGoogle, signOut, type Account } from '../lib/account';
import { detectInAppBrowser } from '../lib/environment';

interface AccountSheetProps {
  account: Account;
  onClose: () => void;
  onError: (message: string) => void;
}

/** Google's "G", for the sign-in button. */
export function GoogleG() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.6 5.4 2.7 13.2l7.9 6.1C12.5 13.6 17.8 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.4 5.7c4.3-4 6.9-9.9 6.9-17.1z" />
      <path fill="#FBBC05" d="M10.6 28.7c-.5-1.4-.8-2.9-.8-4.7s.3-3.3.8-4.7l-7.9-6.1C1 16.6 0 20.2 0 24s1 7.4 2.7 10.8l7.9-6.1z" />
      <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.8-5.8l-7.4-5.7c-2.1 1.4-4.8 2.3-8.4 2.3-6.2 0-11.5-4.1-13.4-9.8l-7.9 6.1C6.6 42.6 14.6 48 24 48z" />
    </svg>
  );
}

/** The sign-in button and what it is for, shared by this sheet and the publish popup. */
export function GoogleSignIn({ onError }: { onError: (message: string) => void }) {
  const [busy, setBusy] = useState(false);
  // Google refuses to sign in inside Messenger's and Facebook's own browsers.
  const inApp = detectInAppBrowser() !== null;

  return (
    <>
      <button
        type="button"
        className="btn btn-google btn-lg btn-block"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          try {
            await signInWithGoogle();
          } catch (error) {
            onError(error instanceof Error ? error.message : 'Չհաջողվեց մուտք գործել։');
            setBusy(false);
          }
        }}
      >
        <GoogleG />
        Մուտք Google-ով
      </button>
      {inApp ? (
        <p className="field-hint">
          Messenger-ի և Facebook-ի ներսում Google-ը մուտք չի թույլատրում։ Բացե՛ք կայքը Chrome-ում կամ
          Safari-ում։
        </p>
      ) : null}
    </>
  );
}

/**
 * Signing in is optional and changes nothing about posting. It is offered for
 * one thing: seeing and managing your listings from any phone or computer.
 */
export default function AccountSheet({ account, onClose, onError }: AccountSheetProps) {
  return (
    <Modal title="Իմ հաշիվը" onClose={onClose}>
      {account.email ? (
        <div className="account-body">
          <p className="account-email">{account.email}</p>
          <p className="field-hint" style={{ marginTop: 0 }}>
            Ձեր հայտարարությունները կապված են այս հաշվին։ Մուտք գործեք նույն Gmail-ով ցանկացած
            հեռախոսից կամ համակարգչից, և «Իմ հայտարարությունները» բաժնում կտեսնեք բոլորը։
          </p>
          <button
            type="button"
            className="btn btn-ghost btn-block"
            onClick={async () => {
              await signOut();
              onClose();
            }}
          >
            Ելք
          </button>
        </div>
      ) : (
        <div className="account-body">
          <p style={{ margin: 0, lineHeight: 1.5 }}>
            <b>Ոչ պարտադիր է։</b> Բերք տեղադրելու համար գրանցում պետք չէ։
          </p>
          <p className="field-hint" style={{ marginTop: 0 }}>
            Մուտք գործելով Gmail-ով՝ ձեր հայտարարությունները կտեսնեք և կկառավարեք ցանկացած հեռախոսից
            կամ համակարգչից, և 3-նիշանոց կոդն այլևս պետք չի լինի։
          </p>
          <GoogleSignIn onError={onError} />
        </div>
      )}
    </Modal>
  );
}
