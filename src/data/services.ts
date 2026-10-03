/**
 * Agricultural services - the shops and people a farmer needs before there is
 * any harvest to sell: chemicals, seed, water, machinery, hands at harvest.
 *
 * This is a separate map from the produce one, not a category within it. A
 * buyer looking for apricots has no use for a pesticide shop, and mixing the
 * two would make the map worse for both. It exists only on the seller side and
 * only when the seller asks for it.
 *
 * Every entry here is an advertiser, at one of two tiers. A regular one is a
 * point on the map like any other. A premium one is a speech bubble that turns
 * over, face by face, through what the business sells - so a shop with seed
 * and chemicals says both without anyone having to tap it - and opens a card
 * of its own rather than the standard sheet.
 *
 * The entries live here rather than in the database on purpose. There are a
 * handful of them, placed by hand, and nobody submits them through the app yet.
 * A table with row-level security is the right home once advertisers edit
 * their own entries, and pointless before that.
 */

/*
 * What a business can offer, products and services alike.
 *
 * One list rather than two, because a single shop is often both: the place
 * that sells drip line is usually the one that lays it. The order is products
 * first, then work done for you, which is also roughly the order a season
 * runs in.
 *
 * Every entry carries a name as well as a symbol. There is no emoji for
 * fertiliser or for a hail net, and a symbol a farmer has to guess at is worse
 * than none - so the symbol helps the eye find it and the name says what it is.
 */
export type OfferingId =
  // things to buy
  | 'seeds'
  | 'seedlings'
  | 'fertilizer'
  | 'pesticide'
  | 'irrigation-systems'
  | 'hail-nets'
  | 'greenhouses'
  | 'machinery'
  | 'heavy-machinery'
  | 'spare-parts'
  | 'tools'
  | 'fodder'
  | 'beekeeping'
  | 'packaging'
  // work done for you
  | 'irrigation-install'
  | 'drone-spraying'
  | 'tillage'
  | 'harvesting'
  | 'transport'
  | 'cold-storage'
  | 'agronomist'
  | 'soil-testing'
  | 'veterinary';

export interface Offering {
  /**
   * The full name, as the sheet shows it. Long compounds carry a soft hyphen
   * (\u00AD) at their join, so a narrow square breaks Թունա-քիմիկատներ there
   * rather than leaving a single letter stranded on the next line.
   */
  label: string;
  /** Short enough to sit on the face of a premium bubble. */
  short: string;
  emoji: string;
}

/*
 * The other words people type for each offering, for search.
 *
 * Armenian keyboards are not a given - plenty of farmers type in Latin
 * transliteration or in Russian - and the words in use are not always the
 * catalogue's: a farmer asks for «դեղ» for their trees, not for
 * «թունաքիմիկատ». Matching is by prefix-free substring, so a stem such as
 * "удобр" covers every ending.
 */
export const OFFERING_ALIASES: Record<OfferingId, string[]> = {
  seeds: ['սերմ', 'seed', 'serm', 'semena', 'семен'],
  seedlings: ['տնկի', 'սածիլ', 'seedling', 'tnki', 'sazhen', 'саженц', 'рассад'],
  fertilizer: ['պարարտ', 'ազոտ', 'գոմաղբ', 'fertiliz', 'pararta', 'udobr', 'удобр'],
  pesticide: ['դեղ', 'սրսկ', 'թույն', 'pesticid', 'tunakimik', 'yadokhim', 'ядохим', 'пестиц', 'химик'],
  'irrigation-systems': ['ջուր', 'կաթիլային', 'ոռոգ', 'irrigat', 'drip', 'vorog', 'orog', 'полив', 'капельн', 'орош'],
  'hail-nets': ['կարկուտ', 'ցանց', 'hail', 'net', 'setka', 'сетк', 'град'],
  greenhouses: ['ջերմոց', 'greenhouse', 'jermoc', 'teplic', 'теплиц'],
  machinery: ['տրակտոր', 'տեխնիկա', 'tractor', 'traktor', 'tekhnik', 'technik', 'трактор', 'техник'],
  'heavy-machinery': ['կոմբայն', 'էքսկավատոր', 'combine', 'kombain', 'excavat', 'комбайн', 'экскават', 'техник'],
  'spare-parts': ['պահեստամաս', 'մաս', 'parts', 'zapchast', 'запчаст'],
  tools: ['գործիք', 'tool', 'instrument', 'инструмент'],
  fodder: ['անասնակեր', 'խոտ', 'կեր', 'fodder', 'feed', 'korm', 'корм', 'сено'],
  beekeeping: ['մեղու', 'փեթակ', 'bee', 'pchel', 'пчел', 'улей'],
  packaging: ['տուփ', 'արկղ', 'տարա', 'packag', 'box', 'upakov', 'упаков', 'ящик', 'тара'],
  'irrigation-install': ['մոնտաժ', 'տեղադր', 'install', 'montazh', 'монтаж'],
  'drone-spraying': ['դրոն', 'սրսկ', 'drone', 'dron', 'spray', 'дрон', 'опрыск'],
  // Ploughing is done with a tractor, and "tractor" is what gets typed.
  tillage: ['վար', 'հերկ', 'հող', 'տրակտոր', 'plough', 'plow', 'till', 'traktor', 'vspash', 'вспаш', 'пахот', 'трактор'],
  harvesting: ['բերքահավաք', 'հավաք', 'կոմբայն', 'harvest', 'uborka', 'уборк'],
  transport: ['բեռնափոխադր', 'մեքենա', 'տրանսպորտ', 'transport', 'truck', 'gruz', 'перевоз', 'груз'],
  'cold-storage': ['սառնարան', 'պահեստ', 'cold', 'storage', 'holodil', 'холодил', 'склад'],
  agronomist: ['ագրոնոմ', 'խորհրդատու', 'agronom', 'агроном', 'consult', 'консульт'],
  'soil-testing': ['հողի անալիզ', 'լաբորատոր', 'soil', 'analiz', 'почв', 'анализ', 'лаборат'],
  veterinary: ['անասնաբույժ', 'անասնաբուժ', 'vet', 'veterinar', 'ветеринар'],
};

export const OFFERINGS: Record<OfferingId, Offering> = {
  seeds: { label: 'Սերմեր', short: 'Սերմեր', emoji: '🫘' },
  seedlings: { label: 'Տնկիներ', short: 'Տնկիներ', emoji: '🌱' },
  fertilizer: { label: 'Պարարտ\u00ADանյութ', short: 'Պարարտանյութ', emoji: '⚗️' },
  pesticide: { label: 'Թունա\u00ADքիմիկատներ', short: 'Թունաքիմիկատ', emoji: '🧪' },
  'irrigation-systems': { label: 'Ոռոգման համակարգեր', short: 'Ոռոգում', emoji: '💧' },
  'hail-nets': { label: 'Հակա\u00ADկարկտային ցանց', short: 'Կարկտացանց', emoji: '🥅' },
  greenhouses: { label: 'Ջերմոցներ', short: 'Ջերմոց', emoji: '🏡' },
  machinery: { label: 'Գյուղ\u00ADտեխնիկա', short: 'Տեխնիկա', emoji: '🚜' },
  'heavy-machinery': { label: 'Ծանր գյուղ\u00ADտեխնիկա', short: 'Ծանր տեխնիկա', emoji: '🏗️' },
  'spare-parts': { label: 'Պահեստա\u00ADմասեր', short: 'Պահեստամաս', emoji: '⚙️' },
  tools: { label: 'Գործիքներ', short: 'Գործիքներ', emoji: '🛠️' },
  fodder: { label: 'Անասնա\u00ADկեր', short: 'Անասնակեր', emoji: '🐄' },
  beekeeping: { label: 'Մեղվա\u00ADբուծական պարագաներ', short: 'Մեղվապարագա', emoji: '🐝' },
  packaging: { label: 'Փաթեթա\u00ADվորում', short: 'Փաթեթավորում', emoji: '📦' },

  'irrigation-install': { label: 'Ոռոգման մոնտաժ', short: 'Մոնտաժ', emoji: '🔧' },
  // The helicopter carries "from the air"; the face only has to say what.
  'drone-spraying': { label: 'Դրոնով սրսկում', short: 'Սրսկում', emoji: '🚁' },
  tillage: { label: 'Հողի մշակում', short: 'Հողի մշակում', emoji: '⛏️' },
  harvesting: { label: 'Բերքա\u00ADհավաք', short: 'Բերքահավաք', emoji: '🌾' },
  transport: { label: 'Բեռնա\u00ADփոխադրում', short: 'Տրանսպորտ', emoji: '🚚' },
  'cold-storage': { label: 'Սառնա\u00ADրանային պահեստ', short: 'Սառնարան', emoji: '❄️' },
  agronomist: { label: 'Ագրոնոմի խորհրդա\u00ADտվություն', short: 'Ագրոնոմ', emoji: '📋' },
  'soil-testing': { label: 'Հողի անալիզ', short: 'Հողի անալիզ', emoji: '🔬' },
  veterinary: { label: 'Անասնա\u00ADբուժություն', short: 'Անասնաբույժ', emoji: '🩺' },
};

/*
 * What a premium advertiser gets beyond the turning bubble on the map: a card
 * that is theirs rather than ours.
 *
 * Modelled on what the large map directories sell, because they have tested
 * it on more businesses than anyone. Yandex Business sells promotions, a
 * product showcase shown as a carousel of up to ten items with prices, and a
 * call-to-action button on the card. 2GIS sells a logo, a cover image and a
 * short advertising line of at most 70 characters. Yelp sells a call-to-action
 * button and up to six business highlights, the short badges that say what
 * sets a business apart. Each piece is here in the form a farmer can use.
 */
export interface Promotion {
  /** The offer itself, short: "-10% բոլոր սերմերի վրա". */
  title: string;
  /** Terms, in a sentence. */
  detail: string;
  /**
   * Last day the offer stands, as YYYY-MM-DD. The card drops the promotion by
   * itself the day after: an expired offer on a card is worse than none,
   * because the farmer who rings about it is the one who gets told no.
   */
  until: string;
}

export interface PremiumProfile {
  /**
   * The advertiser's own colour, used for the card's cover and its accents.
   * Dark enough to carry white text; the card does not check.
   */
  brandColor: string;
  /** One line under the name, at most 70 characters - the 2GIS limit. */
  tagline: string;
  /** Up to six short facts - the Yelp limit. Emoji first, then words. */
  highlights: string[];
  promotion: Promotion | null;
  /** Prices for the showcase, by offering, as the advertiser words them. */
  prices: Partial<Record<OfferingId, string>>;
  /**
   * Set only once someone has actually confirmed the business exists and the
   * details are its own. The badge is a claim made by the platform, not by
   * the advertiser, and it is only worth anything while that stays true.
   */
  verified: boolean;
}

export interface AgriService {
  id: string;
  /** A shop's name or a person's - whichever the farmer would ask for. */
  name: string;
  /** International form, like every number on the site. Null until confirmed. */
  phone: string | null;
  /** Website, Facebook page, or both; the sheet tells them apart itself. */
  links: string[];
  address: string;
  lat: number;
  lng: number;
  /**
   * What they sell or do, most important first. The first one is the symbol on
   * a regular point; a premium bubble turns through them in this order.
   */
  offerings: OfferingId[];
  /**
   * Null for a regular advertiser. Present, the point is drawn as the turning
   * bubble and opens the branded card - one field, so the two can never
   * disagree about whether an advertiser is premium.
   */
  premium: PremiumProfile | null;
  /** Not a confirmed provider: a placeholder for judging the feature. */
  trial: boolean;
}

/*
 * The advertisers on the map. Replace or add entries here; the coordinates
 * place the point and are never shown on the card.
 */
export const SERVICES: AgriService[] = [
  {
    id: 'agro-plus',
    name: 'AGRO PLUS',
    phone: '+37494828402',
    links: ['https://agroplus.am', 'https://www.facebook.com/profile.php?id=100076204760563'],
    address: 'Լոռու մարզ, գ. Ագարակ, 1 փողոց, տուն 10',
    lat: 41.007496,
    lng: 44.463256,
    offerings: ['pesticide', 'fertilizer', 'seeds', 'machinery'],
    premium: null,
    trial: false,
  },
];

/** The symbol a regular point carries: the first thing they offer. */
export function primaryOffering(service: AgriService): Offering {
  return OFFERINGS[service.offerings[0]];
}

/** The promotion, if there is one and it has not run out. */
export function livePromotion(service: AgriService, now: number = Date.now()): Promotion | null {
  const promotion = service.premium?.promotion ?? null;
  if (!promotion) return null;
  // The whole last day counts, in local time.
  const [y, m, d] = promotion.until.split('-').map(Number);
  const end = new Date(y, m - 1, d + 1).getTime();
  return now < end ? promotion : null;
}

/** Lowercased, soft hyphens out, spaces squeezed: the form both sides are compared in. */
function fold(text: string): string {
  return text.toLowerCase().replace(/\u00AD/g, '').replace(/\s+/g, ' ').trim();
}

/**
 * Everything a service can be found by, folded once. The offerings contribute
 * their full name, their short name and every alias, so typing «դեղ» finds a
 * shop whose catalogue entry says «Թունաքիմիկատներ».
 */
function haystack(service: AgriService): string {
  const words = [service.name, service.address];
  for (const id of service.offerings) {
    words.push(OFFERINGS[id].label, OFFERINGS[id].short, ...OFFERING_ALIASES[id]);
  }
  return fold(words.join(' '));
}

/**
 * The services a search leaves on the map.
 *
 * Every word typed must appear somewhere - "սերմ արմավիր" is seed in Armavir,
 * not seed or Armavir - and a chosen offering must be one they actually offer.
 */
export function searchServices(
  services: AgriService[],
  query: string,
  offering: OfferingId | null,
): AgriService[] {
  const words = fold(query).split(' ').filter(Boolean);

  return services.filter((service) => {
    if (offering && !service.offerings.includes(offering)) return false;
    if (words.length === 0) return true;
    const text = haystack(service);
    return words.every((word) => text.includes(word));
  });
}

/**
 * The offerings worth a chip: those at least one service actually has, most
 * common first, so the row starts with what there is most of and never offers
 * a filter that would empty the map.
 */
export function offeringsInUse(services: AgriService[]): { id: OfferingId; count: number }[] {
  const counts = new Map<OfferingId, number>();
  for (const service of services) {
    for (const id of service.offerings) counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  const order = Object.keys(OFFERINGS) as OfferingId[];
  return [...counts.entries()]
    .map(([id, count]) => ({ id, count }))
    .sort((a, b) => b.count - a.count || order.indexOf(a.id) - order.indexOf(b.id));
}
