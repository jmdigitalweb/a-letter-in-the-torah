// Fetches Genesis text from Sefaria, strips nikud/cantillation/markup to a
// consonant-only "sefer Torah" form, and writes structured JSON with per-letter
// IDs. Run with: node scripts/fetch-text.mjs
import { writeFile, mkdir } from "node:fs/promises";

// Parshiyot to include in the prototype (book, start, end inclusive).
const PARSHIYOT = [
  { id: "bereshit", he: "בְּרֵאשִׁית", en: "Bereshit", book: "Genesis", start: [1, 1], end: [6, 8] },
  { id: "noach", he: "נֹחַ", en: "Noach", book: "Genesis", start: [6, 9], end: [11, 32] },
  { id: "lech-lecha", he: "לֶךְ לְךָ", en: "Lech Lecha", book: "Genesis", start: [12, 1], end: [17, 27] },
];

// Keep only Hebrew consonants (U+05D0–U+05EA) and collapse everything else to
// spaces. This removes vowels, cantillation, HTML, footnotes and break markers.
function toScroll(raw) {
  const noHtml = raw.replace(/<[^>]*>/g, "");
  // Delete combining marks (nikud + cantillation) so consonants stay adjacent.
  const noMarks = noHtml.normalize("NFC").replace(/\p{Mn}/gu, "");
  let out = "";
  for (const ch of noMarks) {
    const cp = ch.codePointAt(0);
    if (cp >= 0x05d0 && cp <= 0x05ea) out += ch;
    else out += " "; // spaces, maqaf, sof-pasuk, paseq -> word break
  }
  return out.replace(/\s+/g, " ").trim();
}

async function fetchChapter(book, chapter) {
  const url = `https://www.sefaria.org/api/v3/texts/${encodeURIComponent(book)}%20${chapter}?version=hebrew`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Sefaria ${book} ${chapter}: ${res.status}`);
  const data = await res.json();
  const text = data?.versions?.[0]?.text;
  if (!Array.isArray(text)) throw new Error(`Unexpected text shape for ${book} ${chapter}`);
  return text; // array of verse strings (with diacritics/markup)
}

function inRange(c, v, start, end) {
  if (c < start[0] || c > end[0]) return false;
  if (c === start[0] && v < start[1]) return false;
  if (c === end[0] && v > end[1]) return false;
  return true;
}

async function build() {
  const out = [];
  const chapterCache = new Map();

  for (const p of PARSHIYOT) {
    const verses = [];
    let letterCount = 0;
    for (let c = p.start[0]; c <= p.end[0]; c++) {
      const key = `${p.book} ${c}`;
      if (!chapterCache.has(key)) chapterCache.set(key, await fetchChapter(p.book, c));
      const chapterVerses = chapterCache.get(key);
      for (let i = 0; i < chapterVerses.length; i++) {
        const v = i + 1;
        if (!inRange(c, v, p.start, p.end)) continue;
        const scroll = toScroll(chapterVerses[i]);
        if (!scroll) continue;
        const letters = [];
        let pos = 0;
        for (const ch of scroll) {
          if (ch === " ") {
            letters.push({ space: true });
          } else {
            letters.push({ ch, id: `${p.book}.${c}.${v}.${pos}` });
            pos++;
            letterCount++;
          }
        }
        verses.push({ ref: `${c}:${v}`, chapter: c, verse: v, letters });
      }
    }
    out.push({ id: p.id, he: p.he, en: p.en, book: p.book, verses, letterCount });
    console.log(`${p.en}: ${verses.length} verses, ${letterCount} letters`);
  }

  await mkdir(new URL("../src/data", import.meta.url), { recursive: true });
  await writeFile(
    new URL("../src/data/parshiyot.json", import.meta.url),
    JSON.stringify(out)
  );
  console.log("Wrote src/data/parshiyot.json");
}

build().catch((e) => {
  console.error(e);
  process.exit(1);
});
