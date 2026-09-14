import Modal from './Modal';
import { formatLocalPhone } from '../lib/format';
import { swatchStyle } from './markers';
import { IconPhone, IconPin, IconWarn } from './Icons';
import {
  PROVIDER_LABELS,
  SERVICE_EMOJI,
  SERVICE_LABELS,
  serviceColor,
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
  const color = serviceColor(service.category);

  const point = `${service.lat.toFixed(5)},${service.lng.toFixed(5)}`;
  const yandexUrl = `https://yandex.com/maps/?rtext=~${point}&rtt=auto&z=16`;
  const googleUrl = `https://www.google.com/maps/dir/?api=1&destination=${point}`;

  return (
    <Modal title={service.name} subtitle={SERVICE_LABELS[service.category]} onClose={onClose}>
      <div className="detail-hero" style={{ background: `${color}1f` }}>
        <div
          className="produce-swatch detail-thumb"
          style={swatchStyle(color)}
          aria-hidden="true"
        >
          <span>{SERVICE_EMOJI[service.category]}</span>
        </div>
        <div>
          <h2>{service.name}</h2>
          {/* The category is already the sheet's subtitle and has a row of its
              own below; a third copy here would just be noise. */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            <span className="chip">{PROVIDER_LABELS[service.provider]}</span>
          </div>
        </div>
      </div>

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
          <a className="btn btn-cta btn-lg btn-block call-btn" href={`tel:${service.phone}`}>
            <IconPhone />
            Զանգահարել՝ {formatLocalPhone(service.phone)}
          </a>
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
