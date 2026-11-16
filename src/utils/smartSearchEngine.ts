import { Episode } from '../types/episode.types';
import { ComputedFootage, Footage } from '../types/footage.types';
import { CategoryTag } from '../types/tag.types';

/**
 * Strips spaces and common punctuation (! . , # - _ ( ) [ ] " ' : ; / ? \)
 * and lowercases the string in a single pass.
 * This allows space-insensitive and punctuation-insensitive matching:
 * e.g. "มายเมทเนท สุดฮา! EP.12" -> "มายเมทเนทสุดฮาep12"
 */
const STRIP_PUNCT_AND_SPACE_REGEX = /[\s!！.,#\-_()[\]"':;/?\\+~|<>]+/g;

export function normalizeCompactSearchText(raw: string): string {
  if (!raw) return '';
  return raw.toLowerCase().replace(STRIP_PUNCT_AND_SPACE_REGEX, '');
}

/**
 * Parses a raw user search query ONCE before filtering 10,000+ rows.
 * Splits by whitespace so multi-word queries work across non-adjacent words,
 * and strips punctuation (! . # - _) from each token.
 *
 * Example:
 * - "คนไทย ep.12!" -> ["คนไทย", "ep12"]
 * - "#แมวส้ม ตลก" -> ["แมวส้ม", "ตลก"]
 * - "มายเมทเนทสุดฮา" -> ["มายเมทเนทสุดฮา"]
 */
export function parseSmartSearchQuery(rawQuery: string): string[] {
  const trimmed = rawQuery.trim();
  if (!trimmed) return [];

  const parts = trimmed.split(/\s+/);
  const tokens: string[] = [];

  for (let i = 0; i < parts.length; i++) {
    const clean = normalizeCompactSearchText(parts[i]);
    if (clean.length > 0 && !tokens.includes(clean)) {
      tokens.push(clean);
    }
  }

  return tokens;
}

/**
 * Ultra-fast O(K) token check (where K is number of query words, typically 1-3).
 * Returns true if ALL normalized query tokens appear anywhere in the item's compact index.
 */
export function matchesSmartSearchTokens(
  compactIndex: string,
  queryTokens: string[]
): boolean {
  for (let i = 0; i < queryTokens.length; i++) {
    if (!compactIndex.includes(queryTokens[i])) {
      return false;
    }
  }
  return true;
}

// ==========================================
// 1. EPISODE SMART SEARCH INDEX CACHE (WeakMap)
// ==========================================

const episodeIndexCache = new WeakMap<
  Episode,
  { sig: string; compactIndex: string }
>();

/**
 * Returns a memoized, space- & punctuation-normalized search index for an Episode.
 * Includes:
 * - Episode ID (e.g. EP-0001 & ep0001)
 * - Episode Title & Series Title
 * - Master File Name
 * - Episode number aliases (ep12, ตอนที่12)
 * - Main Category & Target Subcategory tag names
 * - All 3-Tier Footage Tag names & subcategories attached to its 5 slots
 * - All 5 slot Footage IDs, snapshot titles, and snapshot notes
 */
export function getEpisodeSmartSearchIndex(
  ep: Episode,
  tagMap: Record<string, CategoryTag>,
  epFootageTagSet?: Set<string>
): string {
  const mainCatName = tagMap[ep.mainCategoryTagId]?.name || '';
  const subCatName = ep.targetSubcategoryId
    ? tagMap[ep.targetSubcategoryId]?.name || ''
    : '';
  const masterFile = ep.masterVideoInfo?.masterFileName || '';

  // Build tag names string from all 3-Tier tags present in this episode
  let footageTagNames = '';
  if (epFootageTagSet && epFootageTagSet.size > 0) {
    epFootageTagSet.forEach((tid) => {
      const t = tagMap[tid];
      if (t) {
        footageTagNames += ` ${t.name} ${t.subCategory || ''}`;
      }
    });
  }

  const rankings = ep.rankings || [];
  let slotsSignature = '';
  for (let i = 0; i < rankings.length; i++) {
    const r = rankings[i];
    if (r.footageId || r.snapshotNote) {
      slotsSignature += `${r.footageId || ''}|${r.snapshotNote || ''};`;
    }
  }

  const sig = `${ep.id}|${ep.title || ''}|${ep.seriesTitle || ''}|${masterFile}|${mainCatName}|${subCatName}|${ep.categoryEpisodeNo || ''}|${footageTagNames}|${slotsSignature}`;
  const cached = episodeIndexCache.get(ep);
  if (cached && cached.sig === sig) {
    return cached.compactIndex;
  }

  const epNo = ep.categoryEpisodeNo;
  const epNoAliases = epNo ? `ep${epNo} ตอนที่${epNo}` : '';

  const rawCombined = [
    ep.id,
    ep.title || '',
    ep.seriesTitle || '',
    masterFile,
    mainCatName,
    subCatName,
    epNoAliases,
    footageTagNames,
    slotsSignature,
  ].join(' ');

  const compactIndex = normalizeCompactSearchText(rawCombined);
  episodeIndexCache.set(ep, { sig, compactIndex });
  return compactIndex;
}

// ==========================================
// 2. FOOTAGE SMART SEARCH INDEX CACHE (WeakMap)
// ==========================================

const footageIndexCache = new WeakMap<
  Footage,
  { sig: string; compactIndex: string }
>();

/**
 * Returns a memoized, space- & punctuation-normalized search index for a Footage item.
 * Includes:
 * - Footage ID (e.g. FT-0001 / CLP-0001)
 * - Footage Title & Standard File Name
 * - Mascot Notes / Description
 * - Source ID (SRC-XXXX)
 * - All attached 3-Tier Tag names & subcategories
 */
export function getFootageSmartSearchIndex(
  ft: ComputedFootage | Footage,
  tagMap: Record<string, CategoryTag>
): string {
  const ftTags = ft.tags || [];
  let tagNamesPart = '';
  for (let i = 0; i < ftTags.length; i++) {
    const t = tagMap[ftTags[i]];
    if (t) {
      tagNamesPart += ` ${t.name} ${t.subCategory || ''}`;
    } else {
      tagNamesPart += ` ${ftTags[i]}`;
    }
  }

  const sig = `${ft.id}|${ft.title || ''}|${ft.standardFileName || ''}|${ft.mascotNotes || ''}|${ft.sourceId || ''}|${tagNamesPart}`;
  const cached = footageIndexCache.get(ft);
  if (cached && cached.sig === sig) {
    return cached.compactIndex;
  }

  const rawCombined = [
    ft.id,
    ft.title || '',
    ft.standardFileName || '',
    ft.mascotNotes || '',
    ft.sourceId || '',
    tagNamesPart,
  ].join(' ');

  const compactIndex = normalizeCompactSearchText(rawCombined);
  footageIndexCache.set(ft, { sig, compactIndex });
  return compactIndex;
}
