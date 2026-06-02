export type Letter = { ch: string; id: string } | { space: true };
export type Verse = {
  ref: string;
  chapter: number;
  verse: number;
  letters: Letter[];
};
export type Parsha = {
  id: string;
  he: string;
  en: string;
  book: string;
  verses: Verse[];
  letterCount: number;
};

export function isSpace(l: Letter): l is { space: true } {
  return "space" in l;
}

// Hebrew consonant names, including final (sofit) forms.
const NAMES: Record<string, string> = {
  "א": "Alef", "ב": "Bet", "ג": "Gimel", "ד": "Dalet", "ה": "He",
  "ו": "Vav", "ז": "Zayin", "ח": "Chet", "ט": "Tet", "י": "Yod",
  "כ": "Kaf", "ך": "Kaf (final)", "ל": "Lamed", "מ": "Mem", "ם": "Mem (final)",
  "נ": "Nun", "ן": "Nun (final)", "ס": "Samech", "ע": "Ayin", "פ": "Pe",
  "ף": "Pe (final)", "צ": "Tsadi", "ץ": "Tsadi (final)", "ק": "Qof",
  "ר": "Resh", "ש": "Shin", "ת": "Tav",
};

export function letterName(ch: string): string {
  return NAMES[ch] ?? ch;
}

// Stable hash from a letter id so price/availability never change between renders.
function hash(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export type LetterInfo = {
  price: number;
  sold: boolean;
  dedication?: string;
  premium: boolean;
};

const DEDICATORS = [
  "In memory of Sarah bat Avraham",
  "Dedicated by the Levi family",
  "For the recovery of Yaakov ben Rachel",
  "In honor of our wedding",
  "L'ilui nishmat Moshe ben David",
];

// Deterministic mock economics for a letter. Real campaign would read a DB.
export function letterInfo(id: string, isParshaFirst: boolean): LetterInfo {
  const h = hash(id);
  const sold = h % 100 < 9; // ~9% already dedicated
  const premium = isParshaFirst || h % 100 >= 96; // first letter + a sprinkle
  let price = 18; // chai
  if (premium) price = isParshaFirst ? 1800 : 360;
  else if (h % 100 >= 80) price = 54;
  else if (h % 100 >= 50) price = 36;
  return {
    price,
    sold,
    premium,
    dedication: sold ? DEDICATORS[h % DEDICATORS.length] : undefined,
  };
}

export function formatUSD(n: number): string {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}
