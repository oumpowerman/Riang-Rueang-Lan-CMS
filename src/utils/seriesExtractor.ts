import { Episode } from '../types/episode.types';
import { ComputedFootage } from '../types/footage.types';
import {
  ArchiveSeriesCategory,
  CategoryTag,
  DEFAULT_ARCHIVE_SERIES_CATEGORIES,
} from '../types/tag.types';
import { normalizeKnownSeriesAliases } from './episodeTemplateStandardizer';

export interface ExtractedSeriesInfo {
  seriesKey: string; // Canonical key e.g. "SERIES::มายเมทเนท"
  seriesName: string; // Clean base name e.g. "มายเมทเนท สุดฮา!" or "คนไทยเป็นคนตลก"
  fullSeriesTitle: string; // "5 อันดับ มายเมทเนท สุดฮา!"
  parsedEpisodeNo: number;
}

/**
 * Strips hashtags (#xxx), URLs, and trailing boilerplate descriptions from an episode title.
 */
function cleanRawSeriesText(raw: string): string {
  if (!raw) return '';
  const text = raw
    // Remove URLs
    .replace(/https?:\/\/\S+/gi, '')
    // Remove hashtags like #ตลก #funny #memes (keep #number for EP matching first)
    .replace(/#([^\s#,\t\n\r"']+)/g, (full, word) => {
      if (/^\d+$/.test(word)) return full;
      return '';
    })
    // Remove trailing suffixes like " - จังหวะพีคคัดเน้นๆ" or " - ช็อตเด็ดโดนใจ"
    .replace(/\s+[-–—]\s*(?:จังหวะพีค|ช็อตเด็ด|คัดเน้น|รวมช็อต).*$/i, '')
    .trim();

  return text.replace(/\s+/g, ' ').trim();
}

/**
 * Intelligently extracts the canonical "5 อันดับ [ชื่อรายการ]" series identity from an Episode.
 * Unifies variants like:
 * - "5อันดับ มายเมทเนทสุดฮา"
 * - "5 อันดับ มายเมทเนทสุดฮา!"
 * - "5 อันดับ มายเมทเนท สุดฮา"
 * into the same seriesKey.
 */
export function extractEpisodeSeriesInfo(
  ep: Episode,
  tagMap?: Record<string, CategoryTag>
): ExtractedSeriesInfo {
  const rawCandidate = cleanRawSeriesText(ep.title || ep.seriesTitle || '');

  // Match pattern: [optional "5 อันดับ"] [Series Base Name] [EP.1 / EP 1 / ตอนที่ 1 / #1]
  const epMatch = rawCandidate.match(
    /^(.*?)\s*(?:EP\.?\s*|ตอนที่\s*|#)(\d+)\b(.*)$/i
  );

  let baseName = '';
  let parsedEpNo = ep.categoryEpisodeNo || 1;

  if (epMatch) {
    baseName = epMatch[1].trim();
    const num = parseInt(epMatch[2], 10);
    if (Number.isFinite(num) && num > 0) {
      parsedEpNo = num;
    }
  } else {
    baseName = rawCandidate;
  }

  // Strip leading "5 อันดับ", "5อันดับ", "จัดอันดับ" and trailing exclamation marks
  baseName = baseName
    .replace(/^[5๕\d]+\s*(?:อันดับ|จัดอันดับ|ดับ)\s*/i, '')
    .replace(/^(?:จัดอันดับ)\s*/i, '')
    .replace(/\s+[-–—]\s*$/, '')
    .replace(/[!！]+$/g, '')
    .trim();

  // Fallback to seriesTitle or mainCategoryTag name if empty
  if (!baseName && ep.seriesTitle) {
    baseName = cleanRawSeriesText(ep.seriesTitle)
      .replace(/^[5๕\d]+\s*(?:อันดับ|จัดอันดับ|ดับ)\s*/i, '')
      .replace(/[!！]+$/g, '')
      .trim();
  }
  if (!baseName && tagMap && ep.mainCategoryTagId && tagMap[ep.mainCategoryTagId]) {
    baseName = tagMap[ep.mainCategoryTagId].name;
  }
  if (!baseName) {
    baseName = 'รายการทั่วไป';
  }

  // Normalize display name: unify "มายเมทเนทสุดฮา" / "มายเมทเนท สุดฮา" spacing and known typos
  const displaySeriesName = normalizeKnownSeriesAliases(
    baseName.replace(/\s+/g, ' ').trim()
  );

  // Normalize canonical grouping key (ignore spaces, exclamation marks, and optional trailing "สุดฮา" mismatch)
  const normalizedKey = displaySeriesName
    .toLowerCase()
    .replace(/[!！.\s]+/g, '');
  const seriesKey = `SERIES::${normalizedKey}`;

  return {
    seriesKey,
    seriesName: displaySeriesName,
    fullSeriesTitle: `5 อันดับ ${displaySeriesName}`,
    parsedEpisodeNo: parsedEpNo,
  };
}

/**
 * Smartly infers which ArchiveSeriesCategory a "5 อันดับ [ชื่อรายการ]" belongs to
 * if the user has not manually assigned it yet.
 */
export function resolveSeriesArchiveCategoryId(
  seriesKey: string,
  seriesName: string,
  episodeTagNames: string[],
  customMap?: Record<string, string>,
  categories: ArchiveSeriesCategory[] = DEFAULT_ARCHIVE_SERIES_CATEGORIES
): string {
  const validIds = new Set(categories.map((c) => c.id));

  // 1. Respect explicit user assignment if valid
  if (customMap && customMap[seriesKey] && validIds.has(customMap[seriesKey])) {
    return customMap[seriesKey];
  }

  const combinedText = `${seriesName} ${episodeTagNames.join(' ')}`.toLowerCase();

  // 2. Smart keyword classification
  if (
    /เมา|ยา|หลอน|บ้า|คลั่ง|เพี้ยน|รั่ว|ดีด|ขี้เมา|กาว/.test(combinedText) &&
    validIds.has('ARC-CAT-CHAOS')
  ) {
    return 'ARC-CAT-CHAOS';
  }

  if (
    /เสก|แจ๊ส|แก๊ปโบ้|แก๊บโบ้|โหนกระแส|หนุ่ม|ดารา|คนดัง|นักร้อง|ศิลปิน|สตรีมเมอร์|อินฟลู|ตลกคาเฟ่|พระ|หลวงพี่|อาจารย์|มายเมทเนท/.test(
      combinedText
    ) &&
    validIds.has('ARC-CAT-CELEB')
  ) {
    return 'ARC-CAT-CELEB';
  }

  if (
    /ตำรวจ|ทหาร|นักเรียน|ครู|หมอ|พยาบาล|แม่ค้า|ช่าง|อาชีพ|ข่าว|สัมภาษณ์|ผู้ประกาศ|งานบวช|งานแต่ง|รถแห่/.test(
      combinedText
    ) &&
    validIds.has('ARC-CAT-ROLE')
  ) {
    return 'ARC-CAT-ROLE';
  }

  if (
    /สัตว์|หมา|แมว|ลิง|งู|ผี|ลี้ลับ|แปลก/.test(combinedText) &&
    validIds.has('ARC-CAT-OTHER')
  ) {
    return 'ARC-CAT-OTHER';
  }

  if (
    /คนไทย|ชาวบ้าน|วิถี|ฮา|ตลก|ขำ|ช็อตฟีล|พูดผิด/.test(combinedText) &&
    validIds.has('ARC-CAT-LOCAL')
  ) {
    return 'ARC-CAT-LOCAL';
  }

  return categories[0]?.id || 'ARC-CAT-LOCAL';
}

const COMEDIC_SUFFIX_PATTERN =
  /(?:\s*(?:สุดฮา[!！]*|ฮาๆ+|สุดปั่น[!！]*|สุดกาว[!！]*|สุดขำ[!！]*|ขำๆ+|ตลกๆ+|สายปั่น|สายฮา|[!！]+))+$/gi;

/**
 * Strips leading ranking prefixes and trailing comedic/hype suffixes (e.g. "สุดฮา!", "ฮาๆ", "!")
 * to extract clean base subject keywords for matching 3-Tier footage tags and footage titles.
 */
export function stripSeriesMoodSuffixes(raw: string): string {
  if (!raw) return '';
  let text = raw
    .replace(/^[5๕\d]+\s*(?:อันดับ|จัดอันดับ|ดับ)\s*/i, '')
    .replace(/\s*(?:EP\.?\s*|ตอนที่\s*|#)\d+.*$/i, '')
    .trim();

  let prev = '';
  while (text !== prev) {
    prev = text;
    text = text.replace(COMEDIC_SUFFIX_PATTERN, '').trim();
  }
  return text.replace(/\s+/g, ' ').trim();
}

/**
 * Produces an ordered list of search keywords from a series name:
 * 1) Full normalized series name
 * 2) Base name with comedic suffixes ("สุดฮา!", "ฮาๆ", etc.) stripped
 * 3) Split compound parts around "&", "/", "+", "," (length >= 2)
 */
export function extractSeriesSearchKeywords(seriesName: string): string[] {
  const keywords: string[] = [];
  const pushUnique = (val: string) => {
    const clean = val.trim();
    if (clean.length >= 2 && !keywords.some((k) => k.toLowerCase() === clean.toLowerCase())) {
      keywords.push(clean);
    }
  };

  const fullClean = (seriesName || '').replace(/[!！]+$/g, '').replace(/\s+/g, ' ').trim();
  const baseStripped = stripSeriesMoodSuffixes(fullClean);

  if (baseStripped) {
    pushUnique(baseStripped);
  }
  if (fullClean) {
    pushUnique(fullClean);
  }

  if (baseStripped && /[&/+,]/.test(baseStripped)) {
    const parts = baseStripped.split(/[&/+,]/);
    for (const part of parts) {
      const cleanedPart = stripSeriesMoodSuffixes(part);
      if (cleanedPart.length >= 2) {
        pushUnique(cleanedPart);
      }
    }
  }

  return keywords;
}

function normalizeForTagCompare(text: string): string {
  return stripSeriesMoodSuffixes(text)
    .replace(/^#+/, '')
    .toLowerCase()
    .replace(/[!！.\s_-]+/g, '');
}

export interface SeriesTagMatchResult {
  matchedTags: CategoryTag[];
  matchedTagIds: string[];
  matchedTagNames: string[];
  isCustomTagBound: boolean;
  keywords: string[];
}

/**
 * Resolves 3-Tier footage tags linked to a series:
 * 1) User's custom binding (`seriesToTagIdsMap[seriesKey]`) if configured
 * 2) Automatic exact/base match after stripping comedic suffixes ("สุดฮา!", "ฮาๆ", etc.)
 * 3) Safe partial containment match for keywords >= 3 chars
 */
export function findMatchedTagsForSeries(
  seriesKey: string,
  seriesName: string,
  allTags: CategoryTag[],
  tagMap: Record<string, CategoryTag>,
  customSeriesTagMap?: Record<string, string[]>,
  isStagingFn?: (id: string) => boolean
): SeriesTagMatchResult {
  const keywords = extractSeriesSearchKeywords(seriesName);
  const validTags = allTags.filter((t) => !(isStagingFn && isStagingFn(t.id)));

  // 1. Respect explicit user binding
  const customIds = customSeriesTagMap?.[seriesKey];
  if (customIds && customIds.length > 0) {
    const resolved = customIds
      .map((id) => tagMap[id])
      .filter((t): t is CategoryTag => Boolean(t) && !(isStagingFn && isStagingFn(t.id)));
    if (resolved.length > 0) {
      return {
        matchedTags: resolved,
        matchedTagIds: resolved.map((t) => t.id),
        matchedTagNames: resolved.map((t) => t.name),
        isCustomTagBound: true,
        keywords,
      };
    }
  }

  // 2. Automatic matching after stripping suffixes
  const normKeywords = keywords.map(normalizeForTagCompare).filter((k) => k.length >= 2);
  const exactMatches: CategoryTag[] = [];
  const partialMatches: CategoryTag[] = [];

  for (const tag of validTags) {
    const tagNormFull = tag.name.replace(/^#+/, '').toLowerCase().replace(/[!！.\s_-]+/g, '');
    const tagNormBase = normalizeForTagCompare(tag.name);

    const isExact = normKeywords.some(
      (kw) => kw === tagNormFull || (tagNormBase.length >= 2 && kw === tagNormBase)
    );
    if (isExact) {
      exactMatches.push(tag);
      continue;
    }

    // Safe containment match (only when both sides are at least 3 chars)
    const isPartial = normKeywords.some(
      (kw) =>
        kw.length >= 3 &&
        tagNormBase.length >= 3 &&
        (tagNormBase.includes(kw) || kw.includes(tagNormBase))
    );
    if (isPartial) {
      partialMatches.push(tag);
    }
  }

  // Prefer exact matches; fall back to partial matches (prioritizing Tier 3 -> Tier 1 -> Tier 2)
  const chosen = (exactMatches.length > 0 ? exactMatches : partialMatches).sort((a, b) => {
    const tierOrder = (t: number) => (t === 3 ? 0 : t === 1 ? 1 : 2);
    return tierOrder(a.tier) - tierOrder(b.tier);
  });

  return {
    matchedTags: chosen,
    matchedTagIds: chosen.map((t) => t.id),
    matchedTagNames: chosen.map((t) => t.name),
    isCustomTagBound: false,
    keywords,
  };
}

/**
 * Computes the complete footage pool belonging to a series from:
 * - Footage already used in episodes of the series
 * - Footage carrying any matched/bound 3-Tier tag
 * - Footage whose title or mascotNotes matches the stripped base keywords
 */
export function computeSeriesRelatedFootagePool(
  allFootage: ComputedFootage[],
  seriesFootageIds: Set<string>,
  matchedTagIds: string[],
  keywords: string[]
): ComputedFootage[] {
  const matchedTagSet = new Set(matchedTagIds);
  const lowerKeywords = keywords
    .map((k) => k.toLowerCase().trim())
    .filter((k) => k.length >= 2);

  return allFootage.filter((ft) => {
    if (seriesFootageIds.has(ft.id)) return true;
    if (matchedTagSet.size > 0 && ft.tags.some((tid) => matchedTagSet.has(tid))) {
      return true;
    }
    const titleLower = (ft.title || '').toLowerCase();
    const notesLower = (ft.mascotNotes || '').toLowerCase();
    return lowerKeywords.some(
      (kw) => titleLower.includes(kw) || notesLower.includes(kw)
    );
  });
}
