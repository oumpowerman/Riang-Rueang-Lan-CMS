import { isStagingTagId } from '../../../services/seedData';
import { Episode } from '../../../types/episode.types';
import { CategoryTag } from '../../../types/tag.types';
import {
  DEFAULT_EXEMPT_SERIES_KEYWORDS,
  isExemptSeriesName,
  normalizeKnownSeriesAliases,
} from '../../../utils/episodeTemplateStandardizer';
import {
  extractEpisodeSeriesInfo,
  findMatchedTagsForSeries,
  stripSeriesMoodSuffixes,
} from '../../../utils/seriesExtractor';
import { BuilderSeriesCatalogItem } from './builder.types';

const THAI_COLLATOR = new Intl.Collator('th');

/**
 * Cleans a raw series name (typed by user or derived from a tag) into a canonical display name
 * without leading "5 อันดับ" or trailing "EP.n".
 */
export function cleanSeriesDisplayName(raw: string): string {
  const cleaned = (raw || '')
    .replace(/^[5๕\d]+\s*(?:อันดับ|จัดอันดับ|ดับ)\s*/i, '')
    .replace(/^(?:จัดอันดับ)\s*/i, '')
    .replace(/\s*\(?(?:EP\.?\s*|ตอนที่\s*|#)\d+\b\)?.*$/i, '')
    .replace(/\s+[-–—]\s*$/, '')
    .replace(/[!！]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  return normalizeKnownSeriesAliases(cleaned);
}

/**
 * Produces the same canonical grouping key used by Master Episode Archive (`SERIES::<normalized>`).
 */
export function buildCanonicalSeriesKeyFromName(rawName: string): string {
  const display = cleanSeriesDisplayName(rawName) || 'รายการทั่วไป';
  const normalizedKey = display.toLowerCase().replace(/[!！.\s]+/g, '');
  return `SERIES::${normalizedKey}`;
}

/**
 * Formats the canonical seriesTitle (without EP.n), matching Archive standards:
 * - Exempt (e.g. คนไทยเป็นคนตลก, คนไทยในตำนาน): "5 อันดับ คนไทยเป็นคนตลก"
 * - Already ends with "สุดฮา": "5 อันดับ [ชื่อ] สุดฮา!"
 * - Standard: "5 อันดับ [ชื่อ] สุดฮา!"
 */
export function buildCanonicalSeriesTitle(rawName: string): string {
  const display = cleanSeriesDisplayName(rawName) || 'รายการทั่วไป';
  const isExempt = isExemptSeriesName(display, DEFAULT_EXEMPT_SERIES_KEYWORDS);

  if (isExempt) {
    const withoutSudHa = display.replace(/\s*สุดฮา[!！]*$/i, '').trim();
    return `5 อันดับ ${withoutSudHa || display}`;
  }

  if (/สุดฮา[!！]*$/i.test(display)) {
    const baseWithoutBang = display
      .replace(/[!！]+$/g, '')
      .replace(/\s*สุดฮา$/i, '')
      .trim();
    return baseWithoutBang
      ? `5 อันดับ ${baseWithoutBang} สุดฮา!`
      : `5 อันดับ ${display}!`;
  }

  return `5 อันดับ ${display} สุดฮา!`;
}

/**
 * Builds the standardized Episode Title matching Master Episode Archive template:
 * - Standard: "5 อันดับ [ชื่อซีรีส์] สุดฮา! EP.n"
 * - Exempt ("คนไทยเป็นคนตลก", "คนไทยในตำนาน"): "5 อันดับ [ชื่อซีรีส์] EP.n"
 */
export function buildStandardizedSeriesEpisodeTitle(
  seriesName: string,
  episodeNo: number
): string {
  const safeEpNo = Math.max(1, Math.floor(episodeNo || 1));
  const seriesTitle = buildCanonicalSeriesTitle(seriesName);
  return `${seriesTitle} EP.${safeEpNo}`;
}

/**
 * Replaces an existing EP number token inside a custom-edited title when the user adjusts EP.n,
 * preserving their custom wording/hashtags. Returns null if no EP token exists.
 */
export function replaceEpisodeNoInCustomTitle(
  currentTitle: string,
  nextEpisodeNo: number
): string | null {
  const safeEpNo = Math.max(1, Math.floor(nextEpisodeNo || 1));
  const pattern = /(\bEP\.?\s*|ตอนที่\s*)(\d+)\b/i;
  if (!pattern.test(currentTitle)) {
    return null;
  }
  return currentTitle.replace(pattern, (_full, prefix: string) => {
    const cleanPrefix = /ตอนที่/i.test(prefix) ? 'ตอนที่ ' : 'EP.';
    return `${cleanPrefix}${safeEpNo}`;
  });
}

/**
 * Aggregates all existing episodes into canonical Series Catalog items with exact max(EP)+1 numbering
 * and 3-Tier tag bindings (100% aligned with Master Episode Archive).
 */
export function buildBuilderSeriesCatalog(
  episodes: Episode[],
  tags: CategoryTag[],
  tagMap: Record<string, CategoryTag>,
  customSeriesTagMap?: Record<string, string[]>
): BuilderSeriesCatalogItem[] {
  const buckets = new Map<
    string,
    {
      seriesKey: string;
      seriesName: string;
      fullSeriesTitle: string;
      episodes: Episode[];
      maxEpisodeNo: number;
      existingEpisodeNos: Set<number>;
      primaryTagCounts: Record<string, number>;
      latestPublishDate: string;
      latestEpisodeId: string;
    }
  >();

  for (const ep of episodes) {
    const info = extractEpisodeSeriesInfo(ep, tagMap);
    const parsedNo = Math.max(1, info.parsedEpisodeNo || ep.categoryEpisodeNo || 1);

    let bucket = buckets.get(info.seriesKey);
    if (!bucket) {
      bucket = {
        seriesKey: info.seriesKey,
        seriesName: info.seriesName,
        fullSeriesTitle: info.fullSeriesTitle,
        episodes: [],
        maxEpisodeNo: parsedNo,
        existingEpisodeNos: new Set<number>(),
        primaryTagCounts: {},
        latestPublishDate: ep.publishDate || '',
        latestEpisodeId: ep.id,
      };
      buckets.set(info.seriesKey, bucket);
    }

    bucket.episodes.push(ep);
    bucket.existingEpisodeNos.add(parsedNo);

    if (parsedNo > bucket.maxEpisodeNo) {
      bucket.maxEpisodeNo = parsedNo;
      bucket.latestEpisodeId = ep.id;
      if (ep.publishDate) {
        bucket.latestPublishDate = ep.publishDate;
      }
    } else if (
      ep.publishDate &&
      ep.publishDate > bucket.latestPublishDate &&
      parsedNo >= bucket.maxEpisodeNo
    ) {
      bucket.latestPublishDate = ep.publishDate;
      bucket.latestEpisodeId = ep.id;
    }

    if (ep.mainCategoryTagId && !isStagingTagId(ep.mainCategoryTagId)) {
      bucket.primaryTagCounts[ep.mainCategoryTagId] =
        (bucket.primaryTagCounts[ep.mainCategoryTagId] || 0) + 1;
    }
  }

  const items: BuilderSeriesCatalogItem[] = [];

  for (const bucket of buckets.values()) {
    const tagMatch = findMatchedTagsForSeries(
      bucket.seriesKey,
      bucket.seriesName,
      tags,
      tagMap,
      customSeriesTagMap,
      isStagingTagId
    );

    const mostFrequentPrimaryTagId = Object.entries(bucket.primaryTagCounts).sort(
      (a, b) => b[1] - a[1]
    )[0]?.[0];

    const resolvedTagIds =
      tagMatch.matchedTagIds.length > 0
        ? tagMatch.matchedTagIds
        : mostFrequentPrimaryTagId && tagMap[mostFrequentPrimaryTagId]
          ? [mostFrequentPrimaryTagId]
          : [];

    const resolvedTagNames = resolvedTagIds
      .map((id) => tagMap[id]?.name)
      .filter((name): name is string => Boolean(name));

    items.push({
      seriesKey: bucket.seriesKey,
      seriesName: bucket.seriesName,
      fullSeriesTitle: buildCanonicalSeriesTitle(bucket.seriesName),
      episodeCount: bucket.episodes.length,
      maxEpisodeNo: bucket.maxEpisodeNo,
      nextEpisodeNo: bucket.maxEpisodeNo + 1,
      existingEpisodeNos: bucket.existingEpisodeNos,
      matchedTagIds: resolvedTagIds,
      matchedTagNames: resolvedTagNames,
      isCustomTagBound: tagMatch.isCustomTagBound,
      latestPublishDate: bucket.latestPublishDate,
      latestEpisodeId: bucket.latestEpisodeId,
    });
  }

  items.sort((a, b) => {
    if (b.episodeCount !== a.episodeCount) {
      return b.episodeCount - a.episodeCount;
    }
    return THAI_COLLATOR.compare(a.seriesName, b.seriesName);
  });

  return items;
}

function normalizeCompareBase(text: string): string {
  return stripSeriesMoodSuffixes(cleanSeriesDisplayName(text))
    .toLowerCase()
    .replace(/[!！.\s_-]+/g, '');
}

/**
 * Checks whether a user-typed new series name matches an existing series in the archive
 * (either by exact canonical key or stripped base name without "สุดฮา!").
 */
export function findExistingSeriesByName(
  typedName: string,
  catalog: BuilderSeriesCatalogItem[]
): BuilderSeriesCatalogItem | null {
  const trimmed = typedName.trim();
  if (trimmed.length < 2) return null;

  const candidateKey = buildCanonicalSeriesKeyFromName(trimmed);
  const candidateBase = normalizeCompareBase(trimmed);

  for (const item of catalog) {
    if (item.seriesKey === candidateKey) {
      return item;
    }
  }

  if (candidateBase.length >= 2) {
    for (const item of catalog) {
      if (normalizeCompareBase(item.seriesName) === candidateBase) {
        return item;
      }
    }
  }

  return null;
}

/**
 * Suggests up to 3 existing Archive series that match the currently selected Step 1 primary tag.
 */
export function findSuggestedSeriesForTag(
  tagId: string,
  tagName: string | undefined,
  catalog: BuilderSeriesCatalogItem[],
  excludeSeriesKey?: string | null
): BuilderSeriesCatalogItem[] {
  const normTagBase = tagName ? normalizeCompareBase(tagName) : '';
  const scored: { item: BuilderSeriesCatalogItem; score: number }[] = [];

  for (const item of catalog) {
    if (excludeSeriesKey && item.seriesKey === excludeSeriesKey) continue;

    let score = 0;
    const itemBase = normalizeCompareBase(item.seriesName);

    if (item.isCustomTagBound && item.matchedTagIds.includes(tagId)) {
      score += 100;
    } else if (item.matchedTagIds.includes(tagId)) {
      score += 60;
    }

    if (normTagBase.length >= 2 && itemBase === normTagBase) {
      score += 80;
    } else if (
      normTagBase.length >= 3 &&
      itemBase.length >= 3 &&
      (itemBase.includes(normTagBase) || normTagBase.includes(itemBase))
    ) {
      score += 30;
    }

    if (score > 0) {
      scored.push({ item, score });
    }
  }

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return b.item.episodeCount - a.item.episodeCount;
  });

  return scored.slice(0, 3).map((s) => s.item);
}
