import {
  isStagingTagId,
  normalizeFootageTags,
} from '../services/seedData';
import { Episode } from '../types/episode.types';
import { Footage } from '../types/footage.types';
import { RawSource } from '../types/source.types';
import {
  CategoryTag,
  CategoryTier,
  DEFAULT_UNCLASSIFIED_SUBCATEGORY,
} from '../types/tag.types';
import {
  STANDARD_DICTIONARY_TAGS,
  stripForbiddenHumorSuffixes,
} from './tagDictionaryRules';

const CANONICAL_DICTIONARY_TAG_IDS = new Set(
  STANDARD_DICTIONARY_TAGS.map((spec) => spec.id)
);

/**
 * Normalizes a tag name for duplicate comparison:
 * - trims leading/trailing whitespace
 * - removes any leading '#' characters
 * - collapses internal repeated whitespace into a single space
 * - lowercases for case-insensitive matching
 */
export function normalizeTagCompareKey(rawName: string): string {
  return rawName
    .trim()
    .replace(/^#+/, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

export function matchesTagSearchQuery(
  tag: CategoryTag,
  rawQuery: string
): boolean {
  const q = normalizeTagCompareKey(rawQuery);
  if (!q) return true;
  return (
    tag.name.toLowerCase().includes(q) ||
    tag.id.toLowerCase().includes(q) ||
    (tag.subCategory || '').toLowerCase().includes(q)
  );
}

export function isCanonicalDictionaryTagId(tagId: string): boolean {
  if (CANONICAL_DICTIONARY_TAG_IDS.has(tagId)) return true;
  return /^TAG-T[123]-[A-Z0-9]+$/i.test(tagId);
}

export interface TagDuplicateConflict {
  reason: 'EXACT' | 'HUMOR_STRIPPED';
  normalizedInput: string;
  resolvedTargetName: string;
  conflictingTag: CategoryTag;
  message: string;
}

function formatTagLocationHint(tag: CategoryTag): string {
  const tierNum = tag.tier === 2 || tag.tier === 3 ? tag.tier : 1;
  const sub = (tag.subCategory || DEFAULT_UNCLASSIFIED_SUBCATEGORY).trim();
  return `Tier ${tierNum} (${sub})`;
}

/**
 * Checks whether a candidate tag name conflicts with any existing tag in the catalog.
 * Covers:
 * 1. Exact normalized matches (case-insensitive, '#' & whitespace normalized)
 * 2. Forbidden humor-suffix stripped matches (e.g. "โควิดฮา" -> "โควิด")
 */
export function findDuplicateTagConflict(
  rawName: string,
  tags: CategoryTag[],
  excludeTagId?: string | null
): TagDuplicateConflict | null {
  const normalizedInput = normalizeTagCompareKey(rawName);
  if (!normalizedInput) return null;

  const activeTags = tags.filter(
    (t) => !isStagingTagId(t.id) && t.id !== excludeTagId
  );

  // 1. Direct exact normalized match across all tiers
  const exactMatch = activeTags.find(
    (t) => normalizeTagCompareKey(t.name) === normalizedInput
  );
  if (exactMatch) {
    return {
      reason: 'EXACT',
      normalizedInput,
      resolvedTargetName: exactMatch.name,
      conflictingTag: exactMatch,
      message: `ชื่อแท็กซ้ำกับ #${exactMatch.name} ที่มีอยู่แล้วใน ${formatTagLocationHint(exactMatch)}`,
    };
  }

  // 2. Humor-stripped match (e.g. typing "#โควิดฮา" when "#โควิด" exists)
  const { cleanedName, wasStripped } = stripForbiddenHumorSuffixes(rawName);
  const cleanedKey = normalizeTagCompareKey(cleanedName);
  if (wasStripped && cleanedKey) {
    const humorMatch = activeTags.find(
      (t) => normalizeTagCompareKey(t.name) === cleanedKey
    );
    if (humorMatch) {
      return {
        reason: 'HUMOR_STRIPPED',
        normalizedInput,
        resolvedTargetName: humorMatch.name,
        conflictingTag: humorMatch,
        message: `หลังตัดคำลงท้ายแล้วจะซ้ำกับ #${humorMatch.name} ที่มีอยู่แล้วใน ${formatTagLocationHint(humorMatch)}`,
      };
    }
  }

  return null;
}

export interface DuplicateTagGroup {
  normalizedKey: string;
  winner: CategoryTag;
  losers: CategoryTag[];
  winnerUsageCount: number;
  loserUsageCounts: Record<string, number>;
}

export interface DuplicateMergeSummaryItem {
  winnerId: string;
  winnerName: string;
  winnerTier: CategoryTier;
  winnerSubCategory: string;
  loserIds: string[];
  loserNames: string[];
  movedUsageCount: number;
}

export interface DuplicateTagMergeResult {
  nextTags: CategoryTag[];
  tagsToSave: CategoryTag[];
  tagIdsToDelete: string[];
  nextFootage: Footage[];
  changedFootages: Footage[];
  nextSources: RawSource[];
  changedSources: RawSource[];
  nextEpisodes: Episode[];
  changedEpisodes: Episode[];
  groups: DuplicateTagGroup[];
  stats: {
    duplicateGroupCount: number;
    mergedTagsCount: number;
    migratedFootagesCount: number;
    migratedSourcesCount: number;
    migratedEpisodesCount: number;
    mergedSummaries: DuplicateMergeSummaryItem[];
  };
}

function buildUsageCountMap(
  footage: Footage[],
  sources: RawSource[],
  episodes: Episode[]
): Map<string, number> {
  const counts = new Map<string, number>();

  for (const ft of footage) {
    const uniqueTags = new Set(ft.tags || []);
    for (const tid of uniqueTags) {
      counts.set(tid, (counts.get(tid) || 0) + 1);
    }
  }

  for (const src of sources) {
    const uniqueTags = new Set(src.tags || []);
    for (const tid of uniqueTags) {
      counts.set(tid, (counts.get(tid) || 0) + 1);
    }
  }

  for (const ep of episodes) {
    const refIds = new Set<string>();
    if (ep.mainCategoryTagId) refIds.add(ep.mainCategoryTagId);
    if (ep.targetSubcategoryId) refIds.add(ep.targetSubcategoryId);
    if (ep.seriesId) refIds.add(ep.seriesId);
    for (const tid of refIds) {
      counts.set(tid, (counts.get(tid) || 0) + 1);
    }
  }

  return counts;
}

function scoreTagMetadataCompleteness(tag: CategoryTag): number {
  let score = 0;
  const sub = (tag.subCategory || '').trim();
  if (sub && sub !== DEFAULT_UNCLASSIFIED_SUBCATEGORY) score += 2;
  if ((tag.description || '').trim().length > 0) score += 1;
  return score;
}

/**
 * Scans current tags for duplicate normalized names (excluding staging tag).
 * Picks the canonical winner in each duplicate group:
 * 1. Canonical Data Dictionary ID (TAG-T1/T2/T3-*) first
 * 2. Higher total usage count (footages + sources + episodes)
 * 3. Richer metadata (organized subCategory + description)
 * 4. Older createdAt / deterministic ID
 */
export function scanDuplicateTagGroups(
  tags: CategoryTag[],
  footage: Footage[] = [],
  sources: RawSource[] = [],
  episodes: Episode[] = []
): DuplicateTagGroup[] {
  const realTags = tags.filter((t) => t && t.id && !isStagingTagId(t.id));
  const byKey = new Map<string, CategoryTag[]>();

  for (const tag of realTags) {
    const key = normalizeTagCompareKey(tag.name);
    if (!key) continue;
    const list = byKey.get(key) || [];
    list.push(tag);
    byKey.set(key, list);
  }

  const usageCounts = buildUsageCountMap(footage, sources, episodes);
  const groups: DuplicateTagGroup[] = [];

  for (const [normalizedKey, candidates] of byKey.entries()) {
    if (candidates.length < 2) continue;

    const sorted = [...candidates].sort((a, b) => {
      const aCanonical = isCanonicalDictionaryTagId(a.id) ? 1 : 0;
      const bCanonical = isCanonicalDictionaryTagId(b.id) ? 1 : 0;
      if (aCanonical !== bCanonical) return bCanonical - aCanonical;

      const aUsage = usageCounts.get(a.id) || 0;
      const bUsage = usageCounts.get(b.id) || 0;
      if (aUsage !== bUsage) return bUsage - aUsage;

      const aMeta = scoreTagMetadataCompleteness(a);
      const bMeta = scoreTagMetadataCompleteness(b);
      if (aMeta !== bMeta) return bMeta - aMeta;

      const dateCompare = (a.createdAt || '').localeCompare(b.createdAt || '');
      if (dateCompare !== 0) return dateCompare;

      return a.id.localeCompare(b.id);
    });

    const [winner, ...losers] = sorted;
    const loserUsageCounts: Record<string, number> = {};
    for (const loser of losers) {
      loserUsageCounts[loser.id] = usageCounts.get(loser.id) || 0;
    }

    groups.push({
      normalizedKey,
      winner,
      losers,
      winnerUsageCount: usageCounts.get(winner.id) || 0,
      loserUsageCounts,
    });
  }

  return groups;
}

export function hasDuplicateTags(tags: CategoryTag[]): boolean {
  const seen = new Set<string>();
  for (const t of tags) {
    if (!t || !t.id || isStagingTagId(t.id)) continue;
    const key = normalizeTagCompareKey(t.name);
    if (!key) continue;
    if (seen.has(key)) return true;
    seen.add(key);
  }
  return false;
}

/**
 * Computes an atomic merge plan for all duplicate tag groups.
 * Preserves the winning canonical tag and remaps all footages, sources, and episodes
 * referencing any losing duplicate tag IDs.
 */
export function computeDuplicateTagMerge(params: {
  tags: CategoryTag[];
  footage: Footage[];
  sources: RawSource[];
  episodes: Episode[];
}): DuplicateTagMergeResult {
  const { tags, footage, sources, episodes } = params;
  const groups = scanDuplicateTagGroups(tags, footage, sources, episodes);

  if (groups.length === 0) {
    return {
      nextTags: tags,
      tagsToSave: [],
      tagIdsToDelete: [],
      nextFootage: footage,
      changedFootages: [],
      nextSources: sources,
      changedSources: [],
      nextEpisodes: episodes,
      changedEpisodes: [],
      groups: [],
      stats: {
        duplicateGroupCount: 0,
        mergedTagsCount: 0,
        migratedFootagesCount: 0,
        migratedSourcesCount: 0,
        migratedEpisodesCount: 0,
        mergedSummaries: [],
      },
    };
  }

  const replacementByLoserId = new Map<string, string>();
  const loserIdsSet = new Set<string>();
  const enrichedWinnerMap = new Map<string, CategoryTag>();
  const tagsToSave: CategoryTag[] = [];
  const mergedSummaries: DuplicateMergeSummaryItem[] = [];

  for (const group of groups) {
    let enrichedWinner = { ...group.winner };
    let winnerChanged = false;

    for (const loser of group.losers) {
      replacementByLoserId.set(loser.id, group.winner.id);
      loserIdsSet.add(loser.id);

      // Carry over missing description if canonical winner lacked one
      if (!enrichedWinner.description?.trim() && loser.description?.trim()) {
        enrichedWinner = {
          ...enrichedWinner,
          description: loser.description.trim(),
        };
        winnerChanged = true;
      }
    }

    if (winnerChanged) {
      enrichedWinnerMap.set(enrichedWinner.id, enrichedWinner);
      tagsToSave.push(enrichedWinner);
    }

    const movedUsageCount = group.losers.reduce(
      (sum, l) => sum + (group.loserUsageCounts[l.id] || 0),
      0
    );

    mergedSummaries.push({
      winnerId: enrichedWinner.id,
      winnerName: enrichedWinner.name,
      winnerTier: (enrichedWinner.tier === 2 || enrichedWinner.tier === 3
        ? enrichedWinner.tier
        : 1) as CategoryTier,
      winnerSubCategory:
        enrichedWinner.subCategory || DEFAULT_UNCLASSIFIED_SUBCATEGORY,
      loserIds: group.losers.map((l) => l.id),
      loserNames: group.losers.map((l) => l.name),
      movedUsageCount,
    });
  }

  const tagIdsToDelete = Array.from(loserIdsSet);
  const nextTags = tags
    .filter((t) => !loserIdsSet.has(t.id))
    .map((t) => enrichedWinnerMap.get(t.id) || t);

  // 1. Remap Footage tags
  const changedFootages: Footage[] = [];
  const nextFootage = footage.map((ft) => {
    let changed = false;
    const remapped = (ft.tags || []).map((tid) => {
      const winnerId = replacementByLoserId.get(tid);
      if (winnerId) {
        changed = true;
        return winnerId;
      }
      return tid;
    });

    if (!changed) return ft;

    const normalized = normalizeFootageTags(remapped);
    const updated: Footage = {
      ...ft,
      tags: normalized,
    };
    changedFootages.push(updated);
    return updated;
  });

  // 2. Remap RawSource tags
  const changedSources: RawSource[] = [];
  const nextSources = sources.map((src) => {
    let changed = false;
    const remapped = (src.tags || []).map((tid) => {
      const winnerId = replacementByLoserId.get(tid);
      if (winnerId) {
        changed = true;
        return winnerId;
      }
      return tid;
    });

    if (!changed) return src;

    const deduped = Array.from(new Set(remapped.filter(Boolean)));
    const updated: RawSource = {
      ...src,
      tags: deduped,
    };
    changedSources.push(updated);
    return updated;
  });

  // 3. Remap Episode references (mainCategoryTagId, targetSubcategoryId, seriesId)
  const changedEpisodes: Episode[] = [];
  const nextEpisodes = episodes.map((ep) => {
    let changed = false;
    let mainCategoryTagId = ep.mainCategoryTagId;
    let targetSubcategoryId = ep.targetSubcategoryId;
    let seriesId = ep.seriesId;

    const mainReplacement = mainCategoryTagId
      ? replacementByLoserId.get(mainCategoryTagId)
      : undefined;
    if (mainReplacement) {
      mainCategoryTagId = mainReplacement;
      changed = true;
    }

    const subReplacement = targetSubcategoryId
      ? replacementByLoserId.get(targetSubcategoryId)
      : undefined;
    if (subReplacement) {
      targetSubcategoryId = subReplacement;
      changed = true;
    }

    const seriesReplacement = seriesId
      ? replacementByLoserId.get(seriesId)
      : undefined;
    if (seriesReplacement) {
      seriesId = seriesReplacement;
      changed = true;
    }

    if (!changed) return ep;

    const updated: Episode = {
      ...ep,
      mainCategoryTagId,
      ...(targetSubcategoryId !== undefined ? { targetSubcategoryId } : {}),
      ...(seriesId !== undefined ? { seriesId } : {}),
    };
    changedEpisodes.push(updated);
    return updated;
  });

  return {
    nextTags,
    tagsToSave,
    tagIdsToDelete,
    nextFootage,
    changedFootages,
    nextSources,
    changedSources,
    nextEpisodes,
    changedEpisodes,
    groups,
    stats: {
      duplicateGroupCount: groups.length,
      mergedTagsCount: tagIdsToDelete.length,
      migratedFootagesCount: changedFootages.length,
      migratedSourcesCount: changedSources.length,
      migratedEpisodesCount: changedEpisodes.length,
      mergedSummaries,
    },
  };
}
