import Modal from './Modal';
import { formatLocalPhone } from '../lib/format';
import { IconPhone, IconPin, IconTelegram, IconViber, IconWarn, IconWhatsApp } from './Icons';
import { contactLinks } from '../lib/contact';
import {
  PROVIDER_LABELS,
  SERVICE_EMOJI,
  SERVICE_LABELS,
  type AgriService,
} from '../data/services';

interface ServiceDetailProps {
  service: AgriService;
  onClose: () => void;
}

/**
 * What a farmer needs before driving somewhere: who it is, what they do, the
 * number to ring first, and where to go.
 *
 * Deliberately the same shape as a listing's sheet, minus the prices — a seller
 * has already learned how to read one of those.
 */
export default function ServiceDetail({ service, onClose }: ServiceDetailProps) {
  const point = `${service.lat.toFixed(5)},${service.lng.toFixed(5)}`;
  const yandexUrl = `https://yandex.com/maps/?rtext=~${point}&rtt=auto&z=16`;
  const googleUrl = `https://www.google.com/maps/dir/?api=1&destination=${point}`;

  return (
    /* The same white, thinly outlined mark that was tapped on the map, on one
       line with the name and the close button. Who provides it is a row below,
       so it is not repeated here. */
    <Modal
      title={service.name}
      headerMedia={
        <div className="header-thumb service-mark" aria-hidden="true">
          {SERVICE_EMOJI[service.category]}
        </div>
      }
      onClose={onClose}
    >

      {/* The badge is the point of the whole entry while the data is trial. */}
      {service.trial ? (
        <p className="trial-note">
          <IconWarn size={15} />
          Փորձնական գրառում։ Այս կետը ցուցադրական է և իրական ծառայություն չի ներկայացնում։
        </p>
      ) : null}

      <div className="detail-rows">
        <div className="detail-row">
          <span className="k">Հասցե</span>
          <span className="v">{service.address}</span>
        </div>

        <div className="detail-row">
          <span className="k">Ծառայության տեսակ</span>
          <span className="v">{SERVICE_LABELS[service.category]}</span>
        </div>

        <div className="detail-row">
          <span className="k">Ով է մատուցում</span>
          <span className="v">{PROVIDER_LABELS[service.provider]}</span>
        </div>

        {service.hours ? (
          <div className="detail-row">
            <span className="k">Աշխատանքային ժամեր</span>
            <span className="v">{service.hours}</span>
          </div>
        ) : null}
      </div>

      {service.note ? <p className="detail-note">{service.note}</p> : null}

      <div style={{ display: 'grid', gap: 10 }}>
        {service.phone ? (
          /* The same row as a listing's, for the same reason: a shop is just
             as likely to answer on WhatsApp as on a call. */
          <div className="contact-row">
            <a className="btn btn-cta btn-lg call-btn" href={`tel:${service.phone}`}>
              <IconPhone />
              Զանգել՝ {formatLocalPhone(service.phone)}
            </a>

            {contactLinks(service.phone).map((link) => (
              <a
                key={link.id}
                className={`btn contact-app app-${link.id}`}
                href={link.href}
                target="_blank"
                rel="noreferrer noopener"
                title={link.label}
                aria-label={link.label}
              >
                {link.id === 'whatsapp' ? (
                  <IconWhatsApp />
                ) : link.id === 'viber' ? (
                  <IconViber />
                ) : (
                  <IconTelegram />
                )}
              </a>
            ))}
          </div>
        ) : (
          <p className="detail-plain">Հեռախոսահամար դեռ չկա։</p>
        )}

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
      </div>
    </Modal>
  );
}
