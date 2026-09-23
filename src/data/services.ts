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
  /** A website or a Facebook page; the sheet tells the two apart itself. */
  link: string | null;
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
 * Four trial entries, one for each case the design has to survive: a shop and
 * a person, a website and a Facebook page and no link at all, and two premium
 * cards - one verified, with a promotion running and five things turning on
 * its bubble; one unverified, with no promotion and three.
 *
 * None of the phone numbers can ring anyone. An invented Armenian mobile
 * number is not a placeholder - it is somebody's real number, and a farmer
 * who rings it, or messages it on WhatsApp, is contacting a stranger. These use
 * 00 where the operator code goes, which no operator has, so the call and
 * messenger buttons can be seen working without reaching a person. The website
 * is example.com, which exists for exactly this. The names say plainly that
 * they are trials, for the same reason: a plausible shop name invented here
 * could collide with a real shop that never agreed to be listed.
 *
 * Replace each the moment a real advertiser takes its place.
 */
export const SERVICES: AgriService[] = [
  {
    id: 'trial-armavir',
    name: 'Փորձնական - ագրոխանութ',
    phone: '+37400000001',
    link: 'https://example.com',
    address: 'Արմավիրի մարզ, Արմավիր',
    lat: 40.1554,
    lng: 44.0378,
    offerings: ['pesticide', 'fertilizer', 'seeds', 'tools', 'spare-parts'],
    premium: null,
    trial: true,
  },
  {
    id: 'trial-ararat',
    name: 'Փորձնական - անհատ ձեռներեց',
    phone: '+37400000002',
    link: 'https://www.facebook.com/berqategh',
    address: 'Արարատի մարզ, Արտաշատ',
    lat: 39.9539,
    lng: 44.5461,
    offerings: ['tillage', 'harvesting'],
    premium: null,
    trial: true,
  },
  {
    // The case described when premium was first asked for - chemicals, turning
    // over to seed - with everything a premium card can carry.
    id: 'trial-vagharshapat',
    name: 'Փորձնական - ագրոկենտրոն',
    phone: '+37400000003',
    link: 'https://example.com',
    address: 'Արմավիրի մարզ, Վաղարշապատ',
    lat: 40.165,
    lng: 44.292,
    offerings: ['pesticide', 'seeds', 'fertilizer', 'seedlings', 'agronomist'],
    premium: {
      brandColor: '#166534',
      tagline: 'Բույսերի պաշտպանություն և սերմեր՝ ագրոնոմի խորհրդով',
      highlights: [
        '🚚 Առաքում մարզով մեկ',
        '💬 Անվճար խորհրդատվություն',
        '💳 Ապառիկ վճարում',
        '🕗 Բաց է նաև շաբաթ օրը',
      ],
      promotion: {
        title: '-10% բոլոր սերմերի վրա',
        detail: 'Գարնանային ցանքի նախապատրաստում՝ զեղչը գործում է 10 կգ-ից ավելի գնումների դեպքում։',
        until: '2026-12-31',
      },
      prices: {
        pesticide: 'սկսած 3 500 ֏',
        seeds: 'սկսած 1 200 ֏/կգ',
        fertilizer: 'սկսած 9 000 ֏/պարկ',
        seedlings: 'սկսած 600 ֏',
      },
      // Shown on this trial so the badge can be judged. A real advertiser
      // gets it only after the business has been checked.
      verified: true,
    },
    trial: true,
  },
  {
    // Three faces on a four-sided box - the arithmetic that has to come out
    // right for every count that is not two or four. No link and no running
    // offer, to show a premium card without either.
    id: 'trial-ashtarak',
    name: 'Փորձնական - ոռոգման ընկերություն',
    phone: '+37400000004',
    link: null,
    address: 'Արագածոտնի մարզ, Աշտարակ',
    lat: 40.299,
    lng: 44.361,
    offerings: ['irrigation-systems', 'irrigation-install', 'drone-spraying'],
    premium: {
      brandColor: '#075985',
      tagline: 'Կաթիլային ոռոգում՝ նախագծից մինչև մոնտաժ',
      highlights: ['📐 Անվճար չափագրում', '🛠️ 1 տարի երաշխիք', '🚁 Սրսկում 1 օրում'],
      // No offer running: the card has to look finished without one.
      promotion: null,
      prices: {
        'irrigation-systems': 'սկսած 450 000 ֏/հա',
        'drone-spraying': 'սկսած 8 000 ֏/հա',
      },
      // Not verified, to show the card without the badge.
      verified: false,
    },
    trial: true,
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
