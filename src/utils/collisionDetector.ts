import { Episode, EpisodeRankingSlot } from '../types/episode.types';
import { ComputedFootage } from '../types/footage.types';

export type MixRecipeId =
  | 'FORMULA_2_NEW_3_FRESH'
  | 'FORMULA_3_NEW_2_FRESH'
  | 'FORMULA_CLASSIC_RETRO_60D'
  | 'FORMULA_ALL_NEW';

export interface PairwiseCollisionWarning {
  footageA: ComputedFootage;
  footageB: ComputedFootage;
  rankA: number;
  rankB: number;
  sharedEpisodes: {
    episodeId: string;
    episodeTitle: string;
    publishDate: string;
  }[];
}

export interface CooldownSlotViolation {
  footage: ComputedFootage;
  rank: number;
  daysSinceLastUsed: number | null;
  lastEpisodeId: string;
}

export interface VelocitySlotWarning {
  footage: ComputedFootage;
  rank: number;
  usageLast90Days: number;
  averageDaysBetweenUses: number | null;
}

export interface EpisodeSimilarityComparisonItem {
  currentRank: number;
  footageId: string;
  footageTitle: string;
  matchedRankInOriginal: number | null;
  status: 'EXACT_RANK' | 'SWAPPED_RANK' | 'NEW_CLIP';
}

export interface EpisodeSimilarityMatch {
  matchedEpisode: Episode;
  similarityPercentage: number; // 0..100%
  sharedCount: number;          // 0..5 clips
  isExactRankMatch: boolean;    // all 5 clips match in exact identical ranks
  isReordered100: boolean;      // all 5 clips match, but ranks were swapped
  severity:
    | 'EXACT_DUPLICATE_100'
    | 'REORDERED_DUPLICATE_100'
    | 'HIGH_SIMILARITY'
    | 'MODERATE_SIMILARITY'
    | 'LOW';
  rankComparisons: EpisodeSimilarityComparisonItem[];
}

export interface EpisodeValidationReport {
  cooldownViolations: CooldownSlotViolation[];
  velocityWarnings: VelocitySlotWarning[];
  pairwiseCollisions: PairwiseCollisionWarning[];
  topSimilarityMatch: EpisodeSimilarityMatch | null;
  similarityMatches: EpisodeSimilarityMatch[];
  isClean: boolean;
}

/**
 * High-performance Inverted Index Map: footageId -> array of { episode: Episode, rank: number }
 * Enables O(1) sub-millisecond candidate lookup even with 5,000+ footages and thousands of episodes.
 */
export function buildFootageToEpisodeIndex(
  episodes: Episode[],
  editingEpisodeId?: string | null
): Map<string, { episode: Episode; rank: number }[]> {
  const index = new Map<string, { episode: Episode; rank: number }[]>();
  for (const ep of episodes) {
    if (editingEpisodeId && ep.id === editingEpisodeId) continue;
    for (const slot of ep.rankings) {
      if (!slot.footageId) continue;
      const list = index.get(slot.footageId) || [];
      list.push({ episode: ep, rank: slot.rank });
      index.set(slot.footageId, list);
    }
  }
  return index;
}

/**
 * Calculates Episode-Level Similarity Index across all historical episodes using Inverted Index.
 */
export function calculateEpisodeSimilarity(
  filledSlots: { rank: number; footage: ComputedFootage }[],
  episodes: Episode[],
  editingEpisodeId?: string | null,
  prebuiltIndex?: Map<string, { episode: Episode; rank: number }[]>
): { topSimilarityMatch: EpisodeSimilarityMatch | null; similarityMatches: EpisodeSimilarityMatch[] } {
  if (filledSlots.length === 0) {
    return { topSimilarityMatch: null, similarityMatches: [] };
  }

  const index = prebuiltIndex || buildFootageToEpisodeIndex(episodes, editingEpisodeId);

  // Group candidate episodes that share at least one footage
  const candidateMap = new Map<
    string,
    {
      episode: Episode;
      sharedFootageIds: Set<string>;
      rankMap: Map<string, number>;
    }
  >();

  for (const slot of filledSlots) {
    const occurrences = index.get(slot.footage.id);
    if (!occurrences) continue;

    for (const item of occurrences) {
      const epId = item.episode.id;
      let candidate = candidateMap.get(epId);
      if (!candidate) {
        candidate = {
          episode: item.episode,
          sharedFootageIds: new Set<string>(),
          rankMap: new Map<string, number>(),
        };
        candidateMap.set(epId, candidate);
      }
      candidate.sharedFootageIds.add(slot.footage.id);
      candidate.rankMap.set(slot.footage.id, item.rank);
    }
  }

  const matches: EpisodeSimilarityMatch[] = [];

  for (const candidate of candidateMap.values()) {
    const sharedCount = candidate.sharedFootageIds.size;
    if (sharedCount < 2) continue; // Only evaluate if 2 or more clips collide

    const similarityPercentage = Math.round((sharedCount / 5) * 100);

    let exactRankCount = 0;
    const rankComparisons: EpisodeSimilarityComparisonItem[] = filledSlots.map((slot) => {
      const matchedRank = candidate.rankMap.get(slot.footage.id) ?? null;
      let status: 'EXACT_RANK' | 'SWAPPED_RANK' | 'NEW_CLIP' = 'NEW_CLIP';
      if (matchedRank !== null) {
        if (matchedRank === slot.rank) {
          status = 'EXACT_RANK';
          exactRankCount++;
        } else {
          status = 'SWAPPED_RANK';
        }
      }
      return {
        currentRank: slot.rank,
        footageId: slot.footage.id,
        footageTitle: slot.footage.title,
        matchedRankInOriginal: matchedRank,
        status,
      };
    });

    const isAll5Filled = filledSlots.length === 5;
    const isExactRankMatch = isAll5Filled && sharedCount === 5 && exactRankCount === 5;
    const isReordered100 = isAll5Filled && sharedCount === 5 && !isExactRankMatch;

    let severity: EpisodeSimilarityMatch['severity'] = 'LOW';
    if (isExactRankMatch) {
      severity = 'EXACT_DUPLICATE_100';
    } else if (isReordered100) {
      severity = 'REORDERED_DUPLICATE_100';
    } else if (similarityPercentage >= 60) {
      severity = 'HIGH_SIMILARITY';
    } else if (similarityPercentage >= 40) {
      severity = 'MODERATE_SIMILARITY';
    }

    matches.push({
      matchedEpisode: candidate.episode,
      similarityPercentage,
      sharedCount,
      isExactRankMatch,
      isReordered100,
      severity,
      rankComparisons,
    });
  }

  // Sort by highest similarity percentage descending, then exact match first
  matches.sort((a, b) => {
    if (b.similarityPercentage !== a.similarityPercentage) {
      return b.similarityPercentage - a.similarityPercentage;
    }
    if (a.isExactRankMatch !== b.isExactRankMatch) {
      return a.isExactRankMatch ? -1 : 1;
    }
    if (a.isReordered100 !== b.isReordered100) {
      return a.isReordered100 ? -1 : 1;
    }
    return new Date(b.matchedEpisode.publishDate).getTime() - new Date(a.matchedEpisode.publishDate).getTime();
  });

  const topMatch = matches.length > 0 && matches[0].similarityPercentage >= 40 ? matches[0] : null;

  return {
    topSimilarityMatch: topMatch,
    similarityMatches: matches,
  };
}

export function analyzeEpisodeCollisions(
  rankings: EpisodeRankingSlot[],
  computedFootageMap: Record<string, ComputedFootage>,
  episodes: Episode[],
  editingEpisodeId?: string | null,
  prebuiltIndex?: Map<string, { episode: Episode; rank: number }[]>
): EpisodeValidationReport {
  const cooldownViolations: CooldownSlotViolation[] = [];
  const velocityWarnings: VelocitySlotWarning[] = [];
  const pairwiseCollisions: PairwiseCollisionWarning[] = [];

  const filledSlots = rankings
    .filter((slot): slot is EpisodeRankingSlot & { footageId: string } => Boolean(slot.footageId))
    .map((slot) => ({
      rank: slot.rank,
      footage: computedFootageMap[slot.footageId],
    }))
    .filter((item) => Boolean(item.footage));

  for (const item of filledSlots) {
    if (item.footage.cooldownStatus === 'RECENT_COOLDOWN') {
      cooldownViolations.push({
        footage: item.footage,
        rank: item.rank,
        daysSinceLastUsed: item.footage.daysSinceLastUsed,
        lastEpisodeId: item.footage.usageHistory[0]?.episodeId || '-',
      });
    } else if (item.footage.cooldownStatus === 'HIGH_VELOCITY_WARNING') {
      velocityWarnings.push({
        footage: item.footage,
        rank: item.rank,
        usageLast90Days: item.footage.usageLast90Days,
        averageDaysBetweenUses: item.footage.averageDaysBetweenUses,
      });
    }
  }

  // Pairwise historical collision check
  for (let i = 0; i < filledSlots.length; i++) {
    for (let j = i + 1; j < filledSlots.length; j++) {
      const slotA = filledSlots[i];
      const slotB = filledSlots[j];

      if (slotA.footage.id === slotB.footage.id) continue;

      const sharedEpisodes = episodes
        .filter((ep) => ep.id !== editingEpisodeId)
        .filter((ep) => {
          const ids = ep.rankings.map((r) => r.footageId);
          return ids.includes(slotA.footage.id) && ids.includes(slotB.footage.id);
        })
        .map((ep) => ({
          episodeId: ep.id,
          episodeTitle: ep.title,
          publishDate: ep.publishDate,
        }));

      if (sharedEpisodes.length > 0) {
        pairwiseCollisions.push({
          footageA: slotA.footage,
          footageB: slotB.footage,
          rankA: slotA.rank,
          rankB: slotB.rank,
          sharedEpisodes,
        });
      }
    }
  }

  // High-performance Episode Similarity Index Analysis
  const { topSimilarityMatch, similarityMatches } = calculateEpisodeSimilarity(
    filledSlots,
    episodes,
    editingEpisodeId,
    prebuiltIndex
  );

  return {
    cooldownViolations,
    velocityWarnings,
    pairwiseCollisions,
    topSimilarityMatch,
    similarityMatches,
    isClean:
      cooldownViolations.length === 0 &&
      pairwiseCollisions.length === 0 &&
      velocityWarnings.length === 0 &&
      (!topSimilarityMatch || topSimilarityMatch.similarityPercentage < 60),
  };
}

/**
 * Helper to pick N non-colliding footages from a candidate pool, respecting already-selected items.
 */
function pickNonCollidingFromPool(
  pool: ComputedFootage[],
  countNeeded: number,
  alreadySelected: ComputedFootage[]
): ComputedFootage[] {
  const picked: ComputedFootage[] = [];
  const shuffled = [...pool].sort(() => Math.random() - 0.5);

  // Pass 1: Zero pairwise collision with alreadySelected + picked
  for (const candidate of shuffled) {
    if (picked.length >= countNeeded) break;
    if (
      alreadySelected.some((s) => s.id === candidate.id) ||
      picked.some((p) => p.id === candidate.id)
    ) {
      continue;
    }
    const allCurrent = [...alreadySelected, ...picked];
    const hasCollision = allCurrent.some(
      (existing) => (existing.coUsedWithMap[candidate.id] || 0) > 0
    );
    if (!hasCollision) {
      picked.push(candidate);
    }
  }

  // Pass 2: If still short, relax pairwise check within the eligible pool
  if (picked.length < countNeeded) {
    for (const candidate of shuffled) {
      if (picked.length >= countNeeded) break;
      if (
        !alreadySelected.some((s) => s.id === candidate.id) &&
        !picked.some((p) => p.id === candidate.id)
      ) {
        picked.push(candidate);
      }
    }
  }

  return picked;
}

/**
 * Smart Mix Recipe Engine:
 * Builds a 5-footage lineup according to the selected Mix Formula:
 * - FORMULA_2_NEW_3_FRESH: 2 NEW_UNTOUCHED + 3 READY_FRESH
 * - FORMULA_3_NEW_2_FRESH: 3 NEW_UNTOUCHED + 2 READY_FRESH
 * - FORMULA_CLASSIC_RETRO_60D: 5 READY_FRESH rested > 60 days
 * - FORMULA_ALL_NEW: 5 NEW_UNTOUCHED
 */
export function generateSmartMixByRecipe(
  allFootage: ComputedFootage[],
  recipeId: MixRecipeId,
  preferredTagIds: string[],
  allowCrossCategoryFallback = false
): ComputedFootage[] {
  const matchesTags = (ft: ComputedFootage) =>
    preferredTagIds.length === 0 || preferredTagIds.some((tid) => ft.tags.includes(tid));

  const tagMatchedNew = allFootage.filter(
    (ft) => ft.cooldownStatus === 'NEW_UNTOUCHED' && matchesTags(ft)
  );
  const allNew = allFootage.filter((ft) => ft.cooldownStatus === 'NEW_UNTOUCHED');

  const tagMatchedFresh = allFootage.filter(
    (ft) => ft.cooldownStatus === 'READY_FRESH' && matchesTags(ft)
  );
  const allFresh = allFootage.filter((ft) => ft.cooldownStatus === 'READY_FRESH');

  const tagMatchedUsable = [...tagMatchedNew, ...tagMatchedFresh];

  const tagMatchedRetro60 = allFootage.filter(
    (ft) =>
      ft.cooldownStatus === 'READY_FRESH' &&
      (ft.daysSinceLastUsed ?? 0) >= 60 &&
      matchesTags(ft)
  );
  const allRetro60 = allFootage.filter(
    (ft) => ft.cooldownStatus === 'READY_FRESH' && (ft.daysSinceLastUsed ?? 0) >= 60
  );

  let selected: ComputedFootage[] = [];

  if (recipeId === 'FORMULA_2_NEW_3_FRESH') {
    const newPool =
      allowCrossCategoryFallback && tagMatchedNew.length < 2
        ? [...tagMatchedNew, ...allNew]
        : tagMatchedNew;
    const newPicked = pickNonCollidingFromPool(newPool, 2, selected);
    selected = [...selected, ...newPicked];

    const freshPool =
      allowCrossCategoryFallback && tagMatchedFresh.length < 3
        ? [...tagMatchedFresh, ...allFresh]
        : [...tagMatchedFresh, ...tagMatchedNew];
    const freshPicked = pickNonCollidingFromPool(
      freshPool,
      5 - selected.length,
      selected
    );
    selected = [...selected, ...freshPicked];
  } else if (recipeId === 'FORMULA_3_NEW_2_FRESH') {
    const newPool =
      allowCrossCategoryFallback && tagMatchedNew.length < 3
        ? [...tagMatchedNew, ...allNew]
        : tagMatchedNew;
    const newPicked = pickNonCollidingFromPool(newPool, 3, selected);
    selected = [...selected, ...newPicked];

    const freshPool =
      allowCrossCategoryFallback && tagMatchedFresh.length < 2
        ? [...tagMatchedFresh, ...allFresh]
        : [...tagMatchedFresh, ...tagMatchedNew];
    const freshPicked = pickNonCollidingFromPool(
      freshPool,
      5 - selected.length,
      selected
    );
    selected = [...selected, ...freshPicked];
  } else if (recipeId === 'FORMULA_CLASSIC_RETRO_60D') {
    const retroPool = allowCrossCategoryFallback
      ? [...tagMatchedRetro60, ...allRetro60, ...allFresh]
      : [...tagMatchedRetro60, ...tagMatchedFresh, ...tagMatchedNew];
    selected = pickNonCollidingFromPool(retroPool, 5, []);
  } else if (recipeId === 'FORMULA_ALL_NEW') {
    const newPool = allowCrossCategoryFallback
      ? [...tagMatchedNew, ...allNew]
      : [...tagMatchedNew, ...tagMatchedFresh];
    selected = pickNonCollidingFromPool(newPool, 5, []);
  }

  // Fill remaining from the category's usable pool first
  if (selected.length < 5) {
    const extraInCat = pickNonCollidingFromPool(
      tagMatchedUsable,
      5 - selected.length,
      selected
    );
    selected = [...selected, ...extraInCat];
  }

  // Only fall back across categories if explicitly allowed or preferredTagIds is empty
  if (selected.length < 5 && (allowCrossCategoryFallback || preferredTagIds.length === 0)) {
    const fallbackPool = allFootage.filter((ft) => ft.cooldownStatus !== 'RECENT_COOLDOWN');
    const extra = pickNonCollidingFromPool(fallbackPool, 5 - selected.length, selected);
    selected = [...selected, ...extra];
  }

  return selected.slice(0, 5);
}
