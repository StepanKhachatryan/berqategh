import { contactLinks } from '../lib/contact';
import { formatLocalPhone } from '../lib/format';
import { IconPhone, IconTelegram, IconViber, IconWhatsApp } from './Icons';

const MESSENGER_ICONS: Record<string, JSX.Element> = {
  whatsapp: <IconWhatsApp />,
  viber: <IconViber />,
  telegram: <IconTelegram />,
};

interface ContactRowProps {
  /** International form, "+374...". */
  phone: string;
  /** Called on any of the four, for whoever is counting contacts. */
  onContact?: () => void;
}

/**
 * Call, and the three messengers beside it - one row, everywhere a number is
 * shown: a listing, a service, a premium card.
 *
 * Calling takes the rest of the width and shows the number, because it is the
 * route that always works and the number is worth reading. The messengers are
 * square, in their own colours; see .contact-row for how it fits a phone.
 */
export default function ContactRow({ phone, onContact }: ContactRowProps) {
  return (
    <div className="contact-row">
      <a className="btn btn-3d btn-call btn-lg call-btn" href={`tel:${phone}`} onClick={onContact}>
        <IconPhone />
        <span className="call-word">Զանգել՝</span>
        <span className="call-number">{formatLocalPhone(phone)}</span>
      </a>

      {contactLinks(phone).map((link) => (
        <a
          key={link.id}
          className={`btn contact-app app-${link.id}`}
          href={link.href}
          target="_blank"
          rel="noreferrer noopener"
          title={link.label}
          aria-label={link.label}
          onClick={onContact}
        >
          {MESSENGER_ICONS[link.id]}
        </a>
      ))}
    </div>
  );
}
