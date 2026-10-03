import { OFFERINGS, type OfferingId } from '../data/services';
import { offeringImage } from '../data/serviceImages';

/**
 * An offering's picture where one has been uploaded, its emoji otherwise.
 * Sized by the font-size around it, so the two are interchangeable anywhere.
 */
export default function OfferingMark({ id }: { id: OfferingId }) {
  const src = offeringImage(id);
  return src ? <img className="pin-photo" src={src} alt="" /> : <>{OFFERINGS[id].emoji}</>;
}
