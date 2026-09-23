import Modal from './Modal';
import { formatLocalPhone } from '../lib/format';
import { contactLinks } from '../lib/contact';
import { IconPhone, IconPin, IconTelegram, IconViber, IconWarn, IconWhatsApp } from './Icons';
import { OFFERINGS, primaryOffering, type AgriService } from '../data/services';

interface ServiceDetailProps {
  service: AgriService;
  onClose: () => void;
}

const MESSENGER_ICONS: Record<string, JSX.Element> = {
  whatsapp: <IconWhatsApp />,
  viber: <IconViber />,
  telegram: <IconTelegram />,
};

/**
 * A link an advertiser gave us, made safe and made readable.
 *
 * Only http and https survive: anything else - a javascript: URL above all -
 * is dropped rather than rendered, because these will one day be typed in by
 * advertisers rather than by us. Facebook is named as Facebook, since the page
 * slug says nothing to a farmer; anything else is shown as its bare domain.
 */
function readLink(raw: string | null): { href: string; label: string; text: string } | null {
  if (!raw) return null;

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;

  const host = url.hostname.replace(/^www\./, '').replace(/^m\./, '');
  if (host === 'facebook.com' || host === 'fb.com' || host.endsWith('.facebook.com')) {
    return { href: url.href, label: 'Facebook', text: 'Բացել Facebook էջը' };
  }
  return { href: url.href, label: 'Կայք', text: host };
}

/**
 * What a farmer needs before driving somewhere, in the order they need it:
 * who it is, how to reach them, where to read more, where to go, and what they
 * will find there.
 *
 * The name is the heading rather than a row, because it is the first line and
 * a row saying the same thing under it would be the heading twice.
 */
export default function ServiceDetail({ service, onClose }: ServiceDetailProps) {
  const point = `${service.lat.toFixed(5)},${service.lng.toFixed(5)}`;
  const yandexUrl = `https://yandex.com/maps/?rtext=~${point}&rtt=auto&z=16`;
  const googleUrl = `https://www.google.com/maps/dir/?api=1&destination=${point}`;
  const link = readLink(service.link);

  return (
    <Modal
      title={service.name}
      headerMedia={
        <div className="header-thumb service-mark" aria-hidden="true">
          {primaryOffering(service).emoji}
        </div>
      }
      onClose={onClose}
    >
      {/* The badge is the point of the whole entry while the data is trial. */}
      {service.trial ? (
        <p className="trial-note" style={{ marginTop: 0, marginBottom: 14 }}>
          <IconWarn size={15} />
          Փորձնական գրառում։ Այս կետը ցուցադրական է, իրական ծառայություն չի ներկայացնում,
          և հեռախոսահամարը գոյություն չունի։
        </p>
      ) : null}

      {/* The same row as a listing's: the number stays readable on the call
          button, and a shop is as likely to answer on WhatsApp as on a call. */}
      {service.phone ? (
        <div className="contact-row" style={{ marginBottom: 14 }}>
          <a className="btn btn-cta btn-lg call-btn" href={`tel:${service.phone}`}>
            <IconPhone />
            Զանգել՝ {formatLocalPhone(service.phone)}
          </a>

          {contactLinks(service.phone).map((entry) => (
            <a
              key={entry.id}
              className={`btn contact-app app-${entry.id}`}
              href={entry.href}
              target="_blank"
              rel="noreferrer noopener"
              title={entry.label}
              aria-label={entry.label}
            >
              {MESSENGER_ICONS[entry.id]}
            </a>
          ))}
        </div>
      ) : (
        <p className="detail-plain" style={{ marginBottom: 14 }}>
          Հեռախոսահամար դեռ չկա։
        </p>
      )}

      <div className="detail-rows">
        {link ? (
          <div className="detail-row">
            <span className="k">{link.label}</span>
            <a className="v detail-link" href={link.href} target="_blank" rel="noreferrer noopener">
              {link.text}
            </a>
          </div>
        ) : null}

        <div className="detail-row">
          <span className="k">Հասցե</span>
          <span className="v">{service.address}</span>
        </div>
      </div>

      {/* Symbol and name together: there is no emoji for a hail net or for
          fertiliser, and a symbol a farmer has to guess at is no help. */}
      <h4 className="offering-heading">Ապրանքներ և ծառայություններ</h4>
      <ul className="offering-grid">
        {service.offerings.map((id) => (
          <li key={id} className="offering">
            <span className="offering-emoji" aria-hidden="true">
              {OFFERINGS[id].emoji}
            </span>
            <span className="offering-label">{OFFERINGS[id].label}</span>
          </li>
        ))}
      </ul>

      <div className="nav-block">
        <span className="nav-label">
          <IconPin /> Ինչպես հասնել
        </span>
        <div className="nav-links">
          <a className="btn btn-ghost" href={yandexUrl} target="_blank" rel="noreferrer noopener">
            Yandex Maps
          </a>
          <a className="btn btn-ghost" href={googleUrl} target="_blank" rel="noreferrer noopener">
            Google Maps
          </a>
        </div>
      </div>
    </Modal>
  );
}
