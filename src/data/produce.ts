export type ProduceCategory = 'fruit' | 'berry' | 'vegetable' | 'green' | 'nut';

export interface Produce {
  id: string;
  /** Armenian name — what the seller picks and the buyer reads. */
  hy: string;
  /** Latin/Russian spellings people actually type when searching. */
  aliases: string[];
  category: ProduceCategory;
  /** Marker colour, chosen to sit close to the real colour of the produce. */
  color: string;
  emoji: string;
}

export const CATEGORY_LABELS: Record<ProduceCategory, string> = {
  fruit: 'Մրգեր',
  berry: 'Հատապտուղներ',
  vegetable: 'Բանջարեղեն',
  green: 'Կանաչի և համեմունք',
  nut: 'Ընկուզեղեն',
};

export const CATEGORY_ORDER: ProduceCategory[] = ['fruit', 'berry', 'vegetable', 'green', 'nut'];

export const PRODUCE: Produce[] = [
  // ─── Մրգեր ────────────────────────────────────────────────────────────────
  { id: 'apple', hy: 'Խնձոր', aliases: ['apple', 'khndzor', 'yabloko'], category: 'fruit', color: '#D64545', emoji: '🍎' },
  { id: 'pear', hy: 'Տանձ', aliases: ['pear', 'tandz', 'grusha'], category: 'fruit', color: '#C3C24A', emoji: '🍐' },
  { id: 'quince', hy: 'Սերկևիլ', aliases: ['quince', 'serkevil', 'ayva'], category: 'fruit', color: '#E3B23C', emoji: '🍐' },
  { id: 'peach', hy: 'Դեղձ', aliases: ['peach', 'deghdz', 'persik'], category: 'fruit', color: '#F58E5B', emoji: '🍑' },
  { id: 'nectarine', hy: 'Նեկտարին', aliases: ['nectarine', 'nektarin'], category: 'fruit', color: '#E8615C', emoji: '🍑' },
  { id: 'apricot', hy: 'Ծիրան', aliases: ['apricot', 'tsiran', 'abrikos'], category: 'fruit', color: '#F2A03D', emoji: '🍑' },
  { id: 'plum', hy: 'Սալոր', aliases: ['plum', 'salor', 'sliva'], category: 'fruit', color: '#6D4C8C', emoji: '🫐' },
  { id: 'cherry-plum', hy: 'Բխի', aliases: ['cherry plum', 'bkhi', 'tkemali', 'alycha'], category: 'fruit', color: '#8FA33E', emoji: '🫒' },
  { id: 'sweet-cherry', hy: 'Կեռաս', aliases: ['sweet cherry', 'keras', 'chereshnya'], category: 'fruit', color: '#C21F3A', emoji: '🍒' },
  { id: 'sour-cherry', hy: 'Բալ', aliases: ['sour cherry', 'bal', 'vishnya'], category: 'fruit', color: '#9E1029', emoji: '🍒' },
  { id: 'grape', hy: 'Խաղող (կարմիր)', aliases: ['grape', 'khaghogh', 'vinograd'], category: 'fruit', color: '#7A3E9D', emoji: '🍇' },
  { id: 'grape-white', hy: 'Խաղող (սպիտակ)', aliases: ['white grape', 'khaghogh spitak'], category: 'fruit', color: '#BFCB63', emoji: '🍇' },
  { id: 'watermelon', hy: 'Ձմերուկ', aliases: ['watermelon', 'dzmeruk', 'arbuz'], category: 'fruit', color: '#E24A4A', emoji: '🍉' },
  { id: 'melon', hy: 'Սեխ', aliases: ['melon', 'sekh', 'dynya'], category: 'fruit', color: '#EFCB68', emoji: '🍈' },
  { id: 'fig', hy: 'Թուզ', aliases: ['fig', 'tuz', 'inzhir'], category: 'fruit', color: '#7A4E7E', emoji: '🫒' },
  { id: 'pomegranate', hy: 'Նուռ', aliases: ['pomegranate', 'nur', 'granat'], category: 'fruit', color: '#C42B3A', emoji: '🍎' },
  { id: 'persimmon', hy: 'Խուրմա', aliases: ['persimmon', 'khurma'], category: 'fruit', color: '#F07B22', emoji: '🟠' },
  { id: 'mulberry', hy: 'Թութ', aliases: ['mulberry', 'tut', 'shelkovica'], category: 'fruit', color: '#5B2C6F', emoji: '🫐' },
  { id: 'cornelian-cherry', hy: 'Հոն', aliases: ['cornelian cherry', 'hon', 'kizil'], category: 'fruit', color: '#B01A33', emoji: '🔴' },
  { id: 'rosehip', hy: 'Մասուր', aliases: ['rosehip', 'masur', 'shipovnik'], category: 'fruit', color: '#C0392B', emoji: '🌹' },
  { id: 'hawthorn', hy: 'Ալոճ', aliases: ['hawthorn', 'aloch', 'boyarishnik'], category: 'fruit', color: '#B5452F', emoji: '🔴' },
  { id: 'medlar', hy: 'Զկեռ', aliases: ['medlar', 'zker'], category: 'fruit', color: '#A9613C', emoji: '🟤' },
  { id: 'jujube', hy: 'Ունաբ', aliases: ['jujube', 'unab'], category: 'fruit', color: '#9C3B2E', emoji: '🟤' },
  { id: 'sea-buckthorn', hy: 'Չիչխան', aliases: ['sea buckthorn', 'chichkhan', 'oblepikha'], category: 'fruit', color: '#F2A007', emoji: '🟡' },
  { id: 'lemon', hy: 'Կիտրոն', aliases: ['lemon', 'kitron', 'limon'], category: 'fruit', color: '#F5D411', emoji: '🍋' },

  // ─── Հատապտուղներ ─────────────────────────────────────────────────────────
  { id: 'strawberry', hy: 'Ելակ', aliases: ['strawberry', 'yelak', 'klubnika'], category: 'berry', color: '#E0364B', emoji: '🍓' },
  { id: 'raspberry', hy: 'Ազնվամորի', aliases: ['raspberry', 'aznvamori', 'malina'], category: 'berry', color: '#C42B5A', emoji: '🍇' },
  { id: 'blackberry', hy: 'Մոշ', aliases: ['blackberry', 'mosh', 'ezhevika'], category: 'berry', color: '#3D2352', emoji: '🫐' },
  { id: 'blackcurrant', hy: 'Սև հաղարջ', aliases: ['blackcurrant', 'sev hagharj', 'smorodina'], category: 'berry', color: '#4A2545', emoji: '🫐' },
  { id: 'redcurrant', hy: 'Կարմիր հաղարջ', aliases: ['redcurrant', 'karmir hagharj'], category: 'berry', color: '#C8102E', emoji: '🔴' },
  { id: 'gooseberry', hy: 'Կոկռոշ', aliases: ['gooseberry', 'kokrosh', 'kryzhovnik'], category: 'berry', color: '#9BBF4A', emoji: '🟢' },
  { id: 'blueberry', hy: 'Հապալաս', aliases: ['blueberry', 'hapalas', 'chernika'], category: 'berry', color: '#4059AD', emoji: '🫐' },

  // ─── Բանջարեղեն ───────────────────────────────────────────────────────────
  { id: 'tomato', hy: 'Լոլիկ', aliases: ['tomato', 'lolik', 'pomidor'], category: 'vegetable', color: '#E63946', emoji: '🍅' },
  { id: 'cherry-tomato', hy: 'Չերի լոլիկ', aliases: ['cherry tomato', 'cheri lolik'], category: 'vegetable', color: '#D62839', emoji: '🍅' },
  { id: 'cucumber', hy: 'Վարունգ', aliases: ['cucumber', 'varung', 'ogurec'], category: 'vegetable', color: '#4E9F3D', emoji: '🥒' },
  { id: 'potato', hy: 'Կարտոֆիլ', aliases: ['potato', 'kartofil', 'kartoshka'], category: 'vegetable', color: '#C9A227', emoji: '🥔' },
  { id: 'onion', hy: 'Սոխ', aliases: ['onion', 'sokh', 'luk'], category: 'vegetable', color: '#C7A76C', emoji: '🧅' },
  { id: 'red-onion', hy: 'Կարմիր սոխ', aliases: ['red onion', 'karmir sokh'], category: 'vegetable', color: '#9E2A5B', emoji: '🧅' },
  { id: 'spring-onion', hy: 'Կանաչ սոխ', aliases: ['spring onion', 'kanach sokh'], category: 'vegetable', color: '#7CB518', emoji: '🌿' },
  { id: 'garlic', hy: 'Սխտոր', aliases: ['garlic', 'skhtor', 'chesnok'], category: 'vegetable', color: '#DCCFB8', emoji: '🧄' },
  { id: 'carrot', hy: 'Գազար', aliases: ['carrot', 'gazar', 'morkov'], category: 'vegetable', color: '#F2721C', emoji: '🥕' },
  { id: 'cabbage', hy: 'Կաղամբ', aliases: ['cabbage', 'kaghamb', 'kapusta'], category: 'vegetable', color: '#9BC17C', emoji: '🥬' },
  { id: 'red-cabbage', hy: 'Կարմիր կաղամբ', aliases: ['red cabbage', 'karmir kaghamb'], category: 'vegetable', color: '#7E3F8F', emoji: '🥬' },
  { id: 'cauliflower', hy: 'Ծաղկակաղամբ', aliases: ['cauliflower', 'tsaghkakaghamb'], category: 'vegetable', color: '#E5D9BE', emoji: '🥦' },
  { id: 'broccoli', hy: 'Բրոկոլի', aliases: ['broccoli', 'brokoli'], category: 'vegetable', color: '#3E7C36', emoji: '🥦' },
  { id: 'beetroot', hy: 'Բազուկ', aliases: ['beetroot', 'bazuk', 'svekla'], category: 'vegetable', color: '#8E1B4A', emoji: '🟣' },
  { id: 'radish', hy: 'Բողկ', aliases: ['radish', 'boghk', 'redis'], category: 'vegetable', color: '#E03B48', emoji: '🔴' },
  { id: 'white-radish', hy: 'Սպիտակ բողկ', aliases: ['white radish', 'spitak boghk', 'daikon'], category: 'vegetable', color: '#E8E0D0', emoji: '⚪' },
  { id: 'turnip', hy: 'Շաղգամ', aliases: ['turnip', 'shaghgam', 'repa'], category: 'vegetable', color: '#DCC7A8', emoji: '🥔' },
  { id: 'eggplant', hy: 'Բադրիջան', aliases: ['eggplant', 'badrijan', 'baklazhan'], category: 'vegetable', color: '#6A4C93', emoji: '🍆' },
  { id: 'pepper', hy: 'Պղպեղ (կանաչ)', aliases: ['bell pepper', 'peghpegh', 'perec'], category: 'vegetable', color: '#3FA34D', emoji: '🫑' },
  { id: 'red-pepper', hy: 'Պղպեղ (կարմիր)', aliases: ['red pepper', 'karmir peghpegh'], category: 'vegetable', color: '#D62828', emoji: '🫑' },
  { id: 'chili', hy: 'Կծու պղպեղ', aliases: ['chili', 'ktsu peghpegh', 'ostryy perec'], category: 'vegetable', color: '#C1121F', emoji: '🌶️' },
  { id: 'pumpkin', hy: 'Դդում', aliases: ['pumpkin', 'ddum', 'tykva'], category: 'vegetable', color: '#EE7B12', emoji: '🎃' },
  { id: 'zucchini', hy: 'Դդմիկ', aliases: ['zucchini', 'ddmik', 'kabachok'], category: 'vegetable', color: '#6A994E', emoji: '🥒' },
  { id: 'green-beans', hy: 'Կանաչ լոբի', aliases: ['green beans', 'kanach lobi'], category: 'vegetable', color: '#6FA34C', emoji: '🫛' },
  { id: 'beans', hy: 'Լոբի', aliases: ['beans', 'lobi', 'fasol'], category: 'vegetable', color: '#A9744F', emoji: '🫘' },
  { id: 'peas', hy: 'Ոլոռ', aliases: ['peas', 'volor', 'goroh'], category: 'vegetable', color: '#6BAF4A', emoji: '🫛' },
  { id: 'corn', hy: 'Եգիպտացորեն', aliases: ['corn', 'yegiptacoren', 'kukuruza'], category: 'vegetable', color: '#F5C518', emoji: '🌽' },
  { id: 'okra', hy: 'Բամիա', aliases: ['okra', 'bamia'], category: 'vegetable', color: '#5E8C31', emoji: '🌿' },
  { id: 'mushroom', hy: 'Սունկ', aliases: ['mushroom', 'sunk', 'griby'], category: 'vegetable', color: '#B08968', emoji: '🍄' },
  { id: 'lettuce', hy: 'Սալաթ', aliases: ['lettuce', 'salat'], category: 'vegetable', color: '#96C93D', emoji: '🥬' },
  { id: 'celery', hy: 'Նեխուր', aliases: ['celery', 'nekhur', 'seldirey'], category: 'vegetable', color: '#7FB069', emoji: '🌿' },
  { id: 'leek', hy: 'Պրաս', aliases: ['leek', 'pras'], category: 'vegetable', color: '#93C572', emoji: '🌿' },
  { id: 'asparagus', hy: 'Ծնեբեկ', aliases: ['asparagus', 'tsnebek', 'sparzha'], category: 'vegetable', color: '#7BA05B', emoji: '🌿' },
  { id: 'artichoke', hy: 'Արտիճուկ', aliases: ['artichoke', 'artichuk'], category: 'vegetable', color: '#7E8C57', emoji: '🌿' },
  { id: 'sweet-potato', hy: 'Բատատ', aliases: ['sweet potato', 'batat'], category: 'vegetable', color: '#D1743F', emoji: '🍠' },
  { id: 'jerusalem-artichoke', hy: 'Գետնախնձոր', aliases: ['jerusalem artichoke', 'getnakhndzor', 'topinambur'], category: 'vegetable', color: '#C8A165', emoji: '🥔' },

  // ─── Կանաչի և համեմունք ───────────────────────────────────────────────────
  { id: 'parsley', hy: 'Մաղադանոս', aliases: ['parsley', 'maghadanos', 'petrushka'], category: 'green', color: '#3B7A2A', emoji: '🌿' },
  { id: 'dill', hy: 'Սամիթ', aliases: ['dill', 'samit', 'ukrop'], category: 'green', color: '#6A994E', emoji: '🌿' },
  { id: 'coriander', hy: 'Համեմ', aliases: ['coriander', 'cilantro', 'hamem', 'kinza'], category: 'green', color: '#4F772D', emoji: '🌿' },
  { id: 'basil', hy: 'Ռեհան', aliases: ['basil', 'rehan', 'bazilik'], category: 'green', color: '#6B3FA0', emoji: '🌿' },
  { id: 'tarragon', hy: 'Տարխուն', aliases: ['tarragon', 'tarkhun'], category: 'green', color: '#74A12E', emoji: '🌿' },
  { id: 'mint', hy: 'Անանուխ', aliases: ['mint', 'ananukh', 'myata'], category: 'green', color: '#45B36B', emoji: '🌿' },
  { id: 'sorrel', hy: 'Ավելուկ', aliases: ['sorrel', 'aveluk'], category: 'green', color: '#5A7D2A', emoji: '🌿' },
  { id: 'spinach', hy: 'Սպանախ', aliases: ['spinach', 'spanakh', 'shpinat'], category: 'green', color: '#2F6B34', emoji: '🥬' },
  { id: 'purslane', hy: 'Դանդուռ', aliases: ['purslane', 'dandur'], category: 'green', color: '#6F9B41', emoji: '🌿' },
  { id: 'cress', hy: 'Կոտեմ', aliases: ['cress', 'kotem'], category: 'green', color: '#4C8B3F', emoji: '🌿' },
  { id: 'arugula', hy: 'Ռուկոլա', aliases: ['arugula', 'rukola'], category: 'green', color: '#55803A', emoji: '🌿' },
  { id: 'thyme', hy: 'Ուրց', aliases: ['thyme', 'urc', 'chabrec'], category: 'green', color: '#7D8C4F', emoji: '🌿' },
  { id: 'nettle', hy: 'Եղինջ', aliases: ['nettle', 'yeghinj', 'krapiva'], category: 'green', color: '#3E6B2F', emoji: '🌿' },
  { id: 'wild-garlic', hy: 'Սիբեխ', aliases: ['wild garlic', 'sibekh'], category: 'green', color: '#4A7C3A', emoji: '🌿' },
  { id: 'mallow', hy: 'Փիփերթ', aliases: ['mallow', 'pipert'], category: 'green', color: '#5F8C4A', emoji: '🌿' },

  // ─── Ընկուզեղեն ───────────────────────────────────────────────────────────
  { id: 'walnut', hy: 'Ընկույզ', aliases: ['walnut', 'ynkuyz', 'greckiy oreh'], category: 'nut', color: '#8B6B45', emoji: '🌰' },
  { id: 'hazelnut', hy: 'Պնդուկ', aliases: ['hazelnut', 'pnduk', 'fundur'], category: 'nut', color: '#A9713F', emoji: '🌰' },
  { id: 'almond', hy: 'Նուշ', aliases: ['almond', 'nush', 'mindal'], category: 'nut', color: '#C9A66B', emoji: '🌰' },
  { id: 'chestnut', hy: 'Շագանակ', aliases: ['chestnut', 'shaganak', 'kashtan'], category: 'nut', color: '#7B4A2D', emoji: '🌰' },
  { id: 'pistachio', hy: 'Պիստակ', aliases: ['pistachio', 'pistak', 'fistashka'], category: 'nut', color: '#93C572', emoji: '🥜' },
  { id: 'sunflower-seed', hy: 'Արևածաղկի սերմ', aliases: ['sunflower seeds', 'arevatsaghki serm', 'semechki'], category: 'nut', color: '#6B4423', emoji: '🌻' },
];

const BY_ID = new Map(PRODUCE.map((p) => [p.id, p]));

export function getProduce(id: string): Produce | undefined {
  return BY_ID.get(id);
}

/** Colour for a listing whose product id may predate the current catalogue. */
export function produceColor(id: string): string {
  return BY_ID.get(id)?.color ?? '#7A8B6F';
}

export function produceEmoji(id: string): string {
  return BY_ID.get(id)?.emoji ?? '🧺';
}

/** Case- and script-insensitive search across Armenian names and aliases. */
export function searchProduce(query: string): Produce[] {
  const q = query.trim().toLowerCase();
  if (!q) return PRODUCE;
  return PRODUCE.filter(
    (p) => p.hy.toLowerCase().includes(q) || p.aliases.some((a) => a.includes(q)),
  );
}
