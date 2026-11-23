import { contactLinks } from '../lib/contact';
import { formatLocalPhone } from '../lib/format';
import { IconMail, IconPhone, IconTelegram, IconViber, IconWhatsApp } from './Icons';

const MESSENGER_ICONS: Record<string, JSX.Element> = {
  whatsapp: <IconWhatsApp />,
  viber: <IconViber />,
  telegram: <IconTelegram />,
};

interface ContactRowProps {
  /** International form, "+374...". */
  phone: string;
  /**
   * An advertiser's address, as a mail square right after the call button.
   * The call button gives up the width for it, as it does for the messengers.
   */
  email?: string;
  /** Called on any of the buttons with which one, for whoever is counting. */
  onContact?: (via: 'call' | 'email' | 'whatsapp' | 'viber' | 'telegram') => void;
}

/**
 * Call, and the three messengers beside it - one row, everywhere a number is
 * shown: a listing, a service, a premium card.
 *
 * Calling takes the rest of the width and shows the number, because it is the
 * route that always works and the number is worth reading. The messengers are
 * square, in their own colours; see .contact-row for how it fits a phone.
 */
export default function ContactRow({ phone, email, onContact }: ContactRowProps) {
  return (
    <div className={`contact-row${email ? ' has-email' : ''}`}>
      <a className="btn btn-3d btn-call btn-lg call-btn" href={`tel:${phone}`} onClick={() => onContact?.('call')}>
        <IconPhone />
        <span className="call-word">Զանգել՝</span>
        <span className="call-number">{formatLocalPhone(phone)}</span>
      </a>

      {email ? (
        <a
          className="btn contact-app app-email"
          href={`mailto:${email}`}
          title={email}
          aria-label={`Գրել նամակ՝ ${email}`}
          onClick={() => onContact?.('email')}
        >
          <IconMail />
        </a>
      ) : null}

      {contactLinks(phone).map((link) => (
        <a
          key={link.id}
          className={`btn contact-app app-${link.id}`}
          href={link.href}
          target="_blank"
          rel="noreferrer noopener"
          title={link.label}
          aria-label={link.label}
          onClick={() => onContact?.(link.id as 'whatsapp' | 'viber' | 'telegram')}
        >
          {MESSENGER_ICONS[link.id]}
        </a>
      ))}
    </div>
  );
}
