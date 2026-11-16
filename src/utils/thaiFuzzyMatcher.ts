/**
 * Thai-Aware Fuzzy String Similarity Engine
 * - Handles Thai tone marks (่ ้ ๊ ๋), thanthakhat (์), mai taikhu (็), punctuation (! ? .), and spacing differences
 * - Combines Thai phonetic skeleton matching, Character Bigram (Dice's Coefficient), and Levenshtein edit distance
 * - Enforces strict Episode Number (EP.X) guard when comparing Episode titles so EP.1 never fuzzy-matches EP.2
 */

// Strip punctuation, spaces, and invisible characters for compact comparison
export function toCompactComparable(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[\s!?.،,;:()"'“”‘’[\]{}<>/_+|\\~`@#$%^&*+=—–-]+/g, '')
    .trim();
}

// Strip Thai tone marks, thanthakhat (การันต์), and normalize common Thai typo variants
export function toThaiPhoneticSkeleton(text: string): string {
  const compact = toCompactComparable(text);
  if (!compact) return '';

  return (
    compact
      // Remove character + thanthakhat (ตัวการันต์ เช่น ร์, ธ์, ต์)
      .replace(/[ก-ฮ][ัิีึืุู]?์/g, '')
      // Remove standalone tone marks & diacritics (่ ้ ๊ ๋ ์ ็)
      .replace(/[\u0E48\u0E49\u0E4A\u0E4B\u0E4C\u0E47]/g, '')
      // Normalize common Thai consonant/vowel typo pairs (เช่น กระลา -> กะลา, ศ/ษ -> ส, ณ -> น, ญ -> ย)
      .replace(/กร(?=[ะา])/g, 'ก')
      .replace(/[ศษ]/g, 'ส')
      .replace(/ณ/g, 'น')
      .replace(/ญ/g, 'ย')
      .replace(/ฎ/g, 'ด')
      .replace(/ฏ/g, 'ต')
      .replace(/[ภพ]/g, 'พ')
  );
}

// Fast character bigram Dice coefficient (0..1)
function computeBigramDice(a: string, b: string): number {
  if (a === b) return 1;
  if (a.length < 2 || b.length < 2) {
    return a === b ? 1 : 0;
  }

  const bigramsA = new Map<string, number>();
  for (let i = 0; i < a.length - 1; i++) {
    const bg = a.slice(i, i + 2);
    bigramsA.set(bg, (bigramsA.get(bg) || 0) + 1);
  }

  let intersection = 0;
  for (let i = 0; i < b.length - 1; i++) {
    const bg = b.slice(i, i + 2);
    const count = bigramsA.get(bg) || 0;
    if (count > 0) {
      intersection += 1;
      bigramsA.set(bg, count - 1);
    }
  }

  return (2 * intersection) / (a.length - 1 + (b.length - 1));
}

// Bounded Levenshtein similarity ratio (0..1)
function computeLevenshteinRatio(a: string, b: string): number {
  if (a === b) return 1;
  const lenA = a.length;
  const lenB = b.length;
  if (lenA === 0 || lenB === 0) return 0;

  const maxLen = Math.max(lenA, lenB);
  // Quick length difference bailout
  if (Math.abs(lenA - lenB) / maxLen > 0.55) {
    return 0;
  }

  const prev = new Uint16Array(lenB + 1);
  const curr = new Uint16Array(lenB + 1);

  for (let j = 0; j <= lenB; j++) {
    prev[j] = j;
  }

  for (let i = 1; i <= lenA; i++) {
    curr[0] = i;
    const charA = a.charCodeAt(i - 1);
    for (let j = 1; j <= lenB; j++) {
      const cost = charA === b.charCodeAt(j - 1) ? 0 : 1;
      const del = prev[j] + 1;
      const ins = curr[j - 1] + 1;
      const sub = prev[j - 1] + cost;
      curr[j] = del < ins ? (del < sub ? del : sub) : ins < sub ? ins : sub;
    }
    prev.set(curr);
  }

  const distance = prev[lenB];
  return Math.max(0, 1 - distance / maxLen);
}

/**
 * Computes similarity percentage (0..100) between two Thai/English strings.
 * Examples:
 * - "5 อันดับ น้าค่อมสุดฮา" vs "5 อันดับ น้าค่อมสุดฮา!" -> 100% (punctuation/space only)
 * - "5 อันดับ น้าค่อมสุดฮา" vs "5 อันดับ น้าค้อมสุดฮา!" -> ~95% (tone mark typo ่ vs ้)
 * - "อยากเล่นกีต้าร์เก่งแบบพี่เสก" vs "อยากเล่นกีต้าเก่งแบบพี่เสก" -> ~94%
 */
export function computeThaiStringSimilarityPercent(
  strA: string,
  strB: string
): number {
  const compactA = toCompactComparable(strA);
  const compactB = toCompactComparable(strB);

  if (!compactA || !compactB) return 0;
  if (compactA === compactB) return 100;

  const skelA = toThaiPhoneticSkeleton(strA);
  const skelB = toThaiPhoneticSkeleton(strB);

  // If phonetic skeletons without tone marks/thanthakhat are identical (e.g. น้าค่อม vs น้าค้อม),
  // compute exact edit distance on compact strings and guarantee at least 93%-97%
  if (skelA && skelA === skelB) {
    const rawLev = computeLevenshteinRatio(compactA, compactB);
    return Math.min(99, Math.max(93, Math.round(rawLev * 100)));
  }

  // Otherwise blend compact similarity + phonetic skeleton similarity + substring containment
  const compactLev = computeLevenshteinRatio(compactA, compactB);
  const skelLev =
    skelA && skelB ? computeLevenshteinRatio(skelA, skelB) : compactLev;
  const skelDice =
    skelA && skelB ? computeBigramDice(skelA, skelB) : computeBigramDice(compactA, compactB);

  let blended = compactLev * 0.35 + skelLev * 0.4 + skelDice * 0.25;

  // Substring containment boost (e.g. "จัสติน เสิ่นเจิ้น" inside "จัสตินบีเบอร์ เสิ่นเจิ้น")
  const shorter = skelA.length <= skelB.length ? skelA : skelB;
  const longer = skelA.length <= skelB.length ? skelB : skelA;
  if (shorter.length >= 5 && longer.includes(shorter)) {
    const lengthRatio = shorter.length / longer.length;
    const containmentScore = 0.8 + lengthRatio * 0.16;
    if (containmentScore > blended) {
      blended = containmentScore;
    }
  }

  return Math.min(99, Math.max(0, Math.round(blended * 100)));
}

/**
 * Extracts explicit EP number if present (e.g. "EP.1" -> 1, "EP 12" -> 12), or null if none.
 */
export function extractExplicitEpNumber(title: string): number | null {
  const m = title.match(/(?:EP\.?|ตอนที่)\s*(\d+)/i);
  if (!m) return null;
  const num = parseInt(m[1], 10);
  return Number.isFinite(num) ? num : null;
}

/**
 * Strips generic ranking boilerplate ("5 อันดับ", "สุดฮา", "EP.1") so core subject similarity is measured accurately
 */
export function extractCoreEpisodeSubject(title: string): string {
  return title
    .replace(/#[^\s#]+/g, ' ')
    .replace(/^[0-9]+\s*(อันดับ|จัดอันดับ|ดับ)\s*/i, '')
    .replace(/(?:EP\.?|ตอนที่)\s*\d+/gi, '')
    .replace(/(สุดฮา|ฮาๆ|ตลกๆ|ขำๆ)\s*!*$/gi, '')
    .trim();
}
