/**
 * Agricultural services — the shops and people a farmer needs before there is
 * any harvest to sell: chemicals, seed, water, machinery.
 *
 * This is a separate map from the produce one, not a category within it. A
 * buyer looking for apricots has no use for a pesticide shop, and mixing the
 * two would make the map worse for both. It exists only on the seller side and
 * only when the seller asks for it.
 *
 * The entries live here rather than in the database on purpose. There are two
 * of them, they are marked as trial data, and nobody submits them through the
 * app yet — a table with row-level security is the right home once real
 * providers start adding themselves, and pointless before that.
 */

export type ServiceCategory =
  | 'chemicals'
  | 'seeds'
  | 'irrigation'
  | 'machinery'
  | 'other';

/** A shop has a sign over the door; a person has a phone and a van. */
export type ServiceProvider = 'person' | 'company';

export interface AgriService {
  id: string;
  name: string;
  category: ServiceCategory;
  provider: ServiceProvider;
  /** Null while nobody has confirmed a number we may publish. */
  phone: string | null;
  address: string;
  lat: number;
  lng: number;
  /** Opening hours, free text — "Երկ–Շբթ 09:00–18:00". */
  hours: string | null;
  /** What exactly they sell or do, in a sentence. */
  note: string | null;
  /** Not a confirmed provider: a placeholder for judging the feature. */
  trial: boolean;
}

export const SERVICE_ORDER: ServiceCategory[] = [
  'chemicals',
  'seeds',
  'irrigation',
  'machinery',
  'other',
];

export const SERVICE_LABELS: Record<ServiceCategory, string> = {
  chemicals: 'Թունաքիմիկատ և պարարտանյութ',
  seeds: 'Տնկիներ և սերմեր',
  irrigation: 'Ոռոգման ապահովում',
  machinery: 'Տեխնիկա',
  other: 'Այլ ծառայություն',
};

/** Short enough for a chip on the marker sheet. */
export const SERVICE_SHORT: Record<ServiceCategory, string> = {
  chemicals: 'Թունաքիմիկատ',
  seeds: 'Տնկի, սերմ',
  irrigation: 'Ոռոգում',
  machinery: 'Տեխնիկա',
  other: 'Այլ',
};

/*
 * No colours here, on purpose. Produce pins are solid blocks of the crop's own
 * colour and that colour means something; a service pin is white with a thin
 * outline, and the symbol carries the trade. Anything else would be arbitrary
 * decoration competing with the one palette on the map that is not arbitrary.
 */
export const SERVICE_EMOJI: Record<ServiceCategory, string> = {
  chemicals: '🧪',
  seeds: '🌱',
  irrigation: '💧',
  machinery: '🚜',
  other: '🧰',
};

export const PROVIDER_LABELS: Record<ServiceProvider, string> = {
  person: 'Ֆիզիկական անձ',
  company: 'Կազմակերպություն',
};

/*
 * Two trial entries, so the feature can be judged with something on the map.
 *
 * Neither carries a phone number. An invented Armenian mobile number is not a
 * placeholder — it is somebody's real number, and a farmer who rings it is
 * calling a stranger. The names say plainly that these are trials, for the same
 * reason: a plausible shop name invented here could collide with a real shop
 * that never agreed to be listed.
 *
 * Replace both the moment a real provider agrees to be on the map.
 */
export const SERVICES: AgriService[] = [
  {
    id: 'trial-armavir',
    name: 'Փորձնական կետ — ագրոխանութ',
    category: 'chemicals',
    provider: 'company',
    phone: null,
    address: 'Արմավիրի մարզ, Արմավիր',
    lat: 40.1554,
    lng: 44.0378,
    hours: 'Երկ–Շբթ 09:00–18:00',
    note: 'Այս տողում կերևա, թե կոնկրետ ինչ է առաջարկվում՝ բույսերի պաշտպանության միջոցներ, պարարտանյութ, աշխատանքային գործիքներ։',
    trial: true,
  },
  {
    id: 'trial-ararat',
    name: 'Փորձնական կետ — տեխնիկայի ծառայություն',
    category: 'machinery',
    provider: 'person',
    phone: null,
    address: 'Արարատի մարզ, Արտաշատ',
    lat: 39.9539,
    lng: 44.5461,
    hours: null,
    note: 'Այս տողում կերևա, թե կոնկրետ ինչ է առաջարկվում՝ հողի մշակում, հունձ, տրակտորի վարձույթ։',
    trial: true,
  },
];
