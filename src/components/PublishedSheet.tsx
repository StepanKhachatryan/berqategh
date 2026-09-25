import Modal from './Modal';
import { formatLocalPhone } from '../lib/format';
import { IconCheck } from './Icons';

interface PublishedSheetProps {
  /** The three digits that, with the phone number, return the listings. */
  code: string;
  phone: string;
  /** How long the listing will stand, already in words. */
  span: string;
  /** A photo went up with the listing, and is now waiting for review. */
  photoSent: boolean;
  onClose: () => void;
}

/**
 * Shown once, the moment a harvest goes on the map.
 *
 * The recovery code has always existed, and it has always been in «Իմ
 * հայտարարությունները» - which is the problem. A seller who has just published
 * has no reason to open that screen, so the first time they ever look for the
 * code is after their browser storage has been cleared, when nothing is left
 * to look at and the code they needed is gone with it.
 *
 * So the code comes to them instead, at the one moment they are certainly
 * paying attention, in type large enough to read across a room and copy onto
 * whatever is to hand. Nothing else competes for the eye: what the number is
 * for is said underneath it, and the only button dismisses.
 */
export default function PublishedSheet({ code, phone, span, photoSent, onClose }: PublishedSheetProps) {
  return (
    <Modal
      title="Հայտարարությունը հրապարակվեց"
      onClose={onClose}
      footer={
        <button type="button" className="btn btn-cta btn-lg btn-block" onClick={onClose}>
          <IconCheck />
          Հասկացա
        </button>
      }
    >
      <p className="published-span">
        Այն քարտեզին կմնա {span}։
        {photoSent ? ' Լուսանկարն էլ արդեն տեղադրված է։' : ''}
      </p>

      <div className="published-code-card">
        <span className="published-code-label">Ձեր վերականգնման կոդը</span>
        <strong className="published-code">{code}</strong>
        <span className="published-code-phone">{formatLocalPhone(phone)}</span>
      </div>

      <p className="published-note">
        <b>Գրե՛ք այս թիվը կամ լուսանկարե՛ք էկրանը։</b> Եթե բրաուզերի հիշողությունը մաքրվի
        կամ մտնեք այլ հեռախոսից, «Իմ հայտարարությունները» բաժնում հավաքե՛ք ձեր
        հեռախոսահամարը և այս կոդը՝ հայտարարությունները վերադարձնելու համար։
      </p>

      <p className="published-note-soft">
        Կոդը նույնն է ձեր բոլոր հայտարարությունների համար և միշտ երևում է «Իմ
        հայտարարությունները» բաժնի վերևում։
      </p>
    </Modal>
  );
}
