import Modal from './Modal';
import Directions from './Directions';
import ContactRow from './ContactRow';
import LinkButtons from './LinkButtons';
import OfferingMark from './OfferingMark';
import { readLink } from '../lib/links';
import { offeringImage } from '../data/serviceImages';
import { serviceLogo } from '../data/serviceLogos';
import { IconWarn } from './Icons';
import { OFFERINGS, type AgriService } from '../data/services';

interface ServiceDetailProps {
  service: AgriService;
  onClose: () => void;
}

/**
 * An advertiser's card, in the order a farmer reads it: who it is and what
 * they sell (the reason to call at all), then the buttons to reach them, then
 * their website and pages, the address and the way there.
 */
export default function ServiceDetail({ service, onClose }: ServiceDetailProps) {
  const links = service.links.map(readLink).filter((link) => link !== null);
  const logo = serviceLogo(service.id);

  return (
    <Modal
      title={service.name}
      headerMedia={
        logo ? (
          <div className="header-thumb service-logo" aria-hidden="true">
            <img src={logo} alt="" />
          </div>
        ) : (
          <div className="header-thumb service-mark" aria-hidden="true">
            <OfferingMark id={service.offerings[0]} />
          </div>
        )
      }
      onClose={onClose}
    >
      {service.trial ? (
        <p className="trial-note" style={{ marginTop: 0, marginBottom: 14 }}>
          <IconWarn size={15} />
          Փորձնական գրառում։ Այս կետը ցուցադրական է, իրական ծառայություն չի ներկայացնում,
          և հեռախոսահամարը գոյություն չունի։
        </p>
      ) : null}

      {/* A photo where one exists, the symbol otherwise: there is no emoji
          for a hail net or for fertiliser. */}
      <ul className="offering-grid">
        {service.offerings.map((id) => {
          const photo = offeringImage(id);
          return (
            <li key={id} className={`offering${photo ? ' has-photo' : ''}`}>
              {photo ? (
                <img className="offering-photo" src={photo} alt="" />
              ) : (
                <span className="offering-emoji" aria-hidden="true">
                  <OfferingMark id={id} />
                </span>
              )}
              <span className="offering-label">{OFFERINGS[id].label}</span>
            </li>
          );
        })}
      </ul>

      {service.phone ? (
        <div style={{ marginBottom: 12 }}>
          <ContactRow phone={service.phone} />
        </div>
      ) : (
        <p className="detail-plain" style={{ marginBottom: 12 }}>
          Հեռախոսահամար դեռ չկա։
        </p>
      )}

      <LinkButtons links={links} />

      <div className="detail-rows">
        <div className="detail-row">
          <span className="k">Հասցե</span>
          <span className="v">{service.address}</span>
        </div>
      </div>

      <Directions lat={service.lat} lng={service.lng} />
    </Modal>
  );
}
