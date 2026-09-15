import { useState } from 'react';
import Modal from './Modal';
import { isValidLocalPhone, PHONE_LOCAL_LENGTH, toE164 } from '../lib/format';
import { IconCheck, IconWarn } from './Icons';

interface RecoverySheetProps {
  onRecover: (phone: string, code: string) => Promise<number>;
  onClose: () => void;
}

/**
 * Getting a seller's listings back onto a phone that lost them.
 *
 * There are no accounts, so ownership lives in browser storage — and iOS Safari
 * clears that after a week without a visit. A listing can now run for three
 * months, long enough for a seller to be locked out of taking down their own
 * offer while buyers keep calling about produce that sold weeks ago. The phone
 * number is already on the listing; the three-digit code is the half only the
 * seller has.
 */
export default function RecoverySheet({ onRecover, onClose }: RecoverySheetProps) {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  const ready = isValidLocalPhone(phone) && /^[0-9]{3}$/.test(code);

  async function handleSubmit() {
    if (!ready || busy) return;
    setBusy(true);
    setFailure(null);
    try {
      const found = await onRecover(toE164(phone), code);
      if (found === 0) {
        setFailure('Այս համարի և կոդի զույգը չհամընկավ։ Ստուգե՛ք և կրկին փորձե՛ք։');
        setBusy(false);
      }
      // A match closes the sheet from the caller, so nothing to do here.
    } catch (error) {
      setFailure(error instanceof Error ? error.message : 'Չհաջողվեց');
      setBusy(false);
    }
  }

  return (
    <Modal
      title="Վերականգնել իմ հայտարարությունները"
      subtitle="Եթե հեռախոսը փոխել եք կամ բրաուզերը մաքրվել է"
      onClose={onClose}
      footer={
        <>
          {failure ? (
            <div className="detail-note" style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
              <IconWarn />
              <span>{failure}</span>
            </div>
          ) : null}
          <button
            type="button"
            className="btn btn-cta btn-lg btn-block"
            onClick={handleSubmit}
            disabled={!ready || busy}
          >
            {busy ? <span className="spinner" /> : <IconCheck />}
            {busy ? 'Ստուգվում է…' : 'Վերականգնել'}
          </button>
        </>
      }
    >
      <p className="field-hint" style={{ marginBottom: 18 }}>
        Գրե՛ք այն հեռախոսահամարը, որով տեղադրել եք հայտարարությունը, և ձեր
        եռանիշ կոդը։ Հայտարարությունները կվերադառնան այս սարքին, և կկարողանաք
        դրանք հանել կամ ջնջել։
      </p>

      <div className="field">
        <label className="field-label" htmlFor="rec-phone">
          Հեռախոսահամար <span className="req">*</span>
        </label>
        <div className="input-affix">
          <span className="affix">+374</span>
          <input
            id="rec-phone"
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            value={phone}
            onChange={(event) =>
              setPhone(event.target.value.replace(/\D/g, '').slice(0, PHONE_LOCAL_LENGTH))
            }
            placeholder="93123456"
          />
        </div>
      </div>

      <div className="field">
        <label className="field-label" htmlFor="rec-code">
          Եռանիշ կոդ <span className="req">*</span>
        </label>
        <input
          id="rec-code"
          className="input code-input"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={3}
          value={code}
          onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 3))}
          placeholder="000"
        />
        <p className="field-hint">
          Կոդը ցուցադրվել է հայտարարությունը հրապարակելուց հետո և երևում է
          «Իմ հայտարարությունները» բաժնում։
        </p>
      </div>

      <div className="detail-note" style={{ display: 'flex', gap: 10 }}>
        <IconWarn />
        <span>
          Անվտանգության համար թույլատրվում է ժամում 5 փորձ։ Եթե կոդը մոռացել եք
          և մուտքն այլևս չեք վերականգնում, հայտարարությունն ինքնաշխատ կհեռանա
          քարտեզից իր ժամկետը լրանալուն պես։
        </span>
      </div>
    </Modal>
  );
}
