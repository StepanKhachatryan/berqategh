import Modal from './Modal';
import Directions from './Directions';
import ContactRow from './ContactRow';
import OfferingMark from './OfferingMark';
import { readLink } from '../lib/links';
import { IconWarn } from './Icons';
import { OFFERINGS, type AgriService } from '../data/services';

interface ServiceDetailProps {
  service: AgriService;
  onClose: () => void;
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
  const links = service.links.map(readLink).filter((link) => link !== null);

  return (
    <Modal
      title={service.name}
      headerMedia={
        <div className="header-thumb service-mark" aria-hidden="true">
          <OfferingMark id={service.offerings[0]} />
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
        <div style={{ marginBottom: 14 }}>
          <ContactRow phone={service.phone} />
        </div>
      ) : (
        <p className="detail-plain" style={{ marginBottom: 14 }}>
          Հեռախոսահամար դեռ չկա։
        </p>
      )}

      <div className="detail-rows">
        {links.map((link) => (
          <div key={link.href} className="detail-row">
            <span className="k">{link.label}</span>
            <a className="v detail-link" href={link.href} target="_blank" rel="noreferrer noopener">
              {link.text}
            </a>
          </div>
        ))}

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
              <OfferingMark id={id} />
            </span>
            <span className="offering-label">{OFFERINGS[id].label}</span>
          </li>
        ))}
      </ul>

      <Directions lat={service.lat} lng={service.lng} />
    </Modal>
  );
}
