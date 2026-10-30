import { useMemo, useCallback } from 'react';
import { useCMS } from '../../../../context/CMSContext';
import type { CategoryTag } from '../../../../types/tag.types';
import type { Episode, EpisodeRankingSlot } from '../../../../types/episode.types';
import type { ComputedFootage } from '../../../../types/footage.types';

export interface CategoryRankingItem {
  mainTag: CategoryTag;
  episodeCount: number;
  episodeSharePercent: number;
  totalFootageInCat: number;
  usedFootageInCat: number;
  untouchedFootageInCat: number;
  usableFootageInCat: number;
  utilizationPercent: number;
}

export interface EpisodeFootageMix {
  newCount: number;
  recycledCount: number;
  total: number;
  newPercent: number;
  recycledPercent: number;
}

export interface OverviewMetrics {
  totalEpisodes: number;
  totalFootage: number;
  usedFootage: number;
  untouchedFootage: number;
  reusedMoreThanOnce: number;
  utilizationRate: number;
  topCategory: CategoryRankingItem | null;
  leastCategory: CategoryRankingItem | null;
}

export function useMasterArchiveMetrics() {
  const {
    episodes,
    computedFootage,
    computedFootageMap,
    tags,
    tagMap,
    categoryGroups,
    categoryGroupMap
  } = useCMS();

  // Resolve Tier 0 Group ID for any tag (memoized for O(1) stability)
  const resolveTagGroupId = useCallback(
    (tag: CategoryTag | undefined): string => {
      if (!tag) return categoryGroups[0]?.id || 'GRP-PERSON';
      if (tag.groupId && categoryGroupMap[tag.groupId]) return tag.groupId;
      if (tag.parentId && tagMap[tag.parentId]?.groupId) return tagMap[tag.parentId]!.groupId!;
      const fallback = `GRP-${tag.groupType || 'GENERAL'}`;
      if (categoryGroupMap[fallback]) return fallback;
      return categoryGroups[0]?.id || 'GRP-PERSON';
    },
    [categoryGroups, categoryGroupMap, tagMap]
  );

  // Precompute Footage Mix Map for all episodes (O(N) once, O(1) lookup for 1,000+ episodes)
  const episodeMixMap = useMemo<Record<string, EpisodeFootageMix>>(() => {
    const map: Record<string, EpisodeFootageMix> = {};
    for (let i = 0; i < episodes.length; i++) {
      const ep = episodes[i];
      let newCount = 0;
      let recycledCount = 0;
      for (let j = 0; j < ep.rankings.length; j++) {
        const slot: EpisodeRankingSlot = ep.rankings[j];
        const ft = slot.footageId ? computedFootageMap[slot.footageId] : null;
        const isMarkedNew =
          (slot.snapshotNote || '').includes('ใหม่') ||
          Boolean(ft && ft.totalUsageCount <= 1);
        if (isMarkedNew) {
          newCount += 1;
        } else if (slot.footageId) {
          recycledCount += 1;
        }
      }
      const total = newCount + recycledCount;
      map[ep.id] = {
        newCount,
        recycledCount,
        total,
        newPercent: total > 0 ? Math.round((newCount / total) * 100) : 100,
        recycledPercent: total > 0 ? Math.round((recycledCount / total) * 100) : 0,
      };
    }
    return map;
  }, [episodes, computedFootageMap]);

  const getEpisodeFootageMix = useCallback(
    (ep: Episode): EpisodeFootageMix => {
      return (
        episodeMixMap[ep.id] || {
          newCount: 0,
          recycledCount: 0,
          total: 0,
          newPercent: 100,
          recycledPercent: 0,
        }
      );
    },
    [episodeMixMap]
  );

  // Precompute episode counts per Tier 0 Group and latest episode per Main Category
  const { groupEpisodeCounts, latestEpisodeByCategoryMap } = useMemo(() => {
    const grpCounts: Record<string, number> = {};
    const latestByCat: Record<string, Episode> = {};

    for (let i = 0; i < episodes.length; i++) {
      const ep = episodes[i];
      const mainTag = tagMap[ep.mainCategoryTagId];
      const grpId = resolveTagGroupId(mainTag);
      grpCounts[grpId] = (grpCounts[grpId] || 0) + 1;

      const existing = latestByCat[ep.mainCategoryTagId];
      if (
        !existing ||
        (ep.categoryEpisodeNo || 0) > (existing.categoryEpisodeNo || 0) ||
        ep.publishDate > existing.publishDate
      ) {
        latestByCat[ep.mainCategoryTagId] = ep;
      }
    }

    return {
      groupEpisodeCounts: grpCounts,
      latestEpisodeByCategoryMap: latestByCat,
    };
  }, [episodes, tagMap, resolveTagGroupId]);

  // Main Category Comparison & Footage Utilization Ranking (Sorted Most -> Least Episodes)
  const categoryRanking = useMemo<CategoryRankingItem[]>(() => {
    const mainTags = tags.filter((t: CategoryTag) => t.tier === 1 || (!t.parentId && !t.tier));
    const totalEps = Math.max(1, episodes.length);

    // Pre-bucket episodes count by mainCategoryTagId in a single pass
    const epCountByMainTag: Record<string, number> = {};
    for (let i = 0; i < episodes.length; i++) {
      const catId = episodes[i].mainCategoryTagId;
      epCountByMainTag[catId] = (epCountByMainTag[catId] || 0) + 1;
    }

    const rows: CategoryRankingItem[] = mainTags.map((mainTag: CategoryTag) => {
      const subTags = tags.filter((t: CategoryTag) => t.parentId === mainTag.id);
      const familyIds = new Set([mainTag.id, ...subTags.map((s: CategoryTag) => s.id)]);

      const episodeCount = epCountByMainTag[mainTag.id] || 0;
      const episodeSharePercent =
        episodes.length > 0 ? Math.round((episodeCount / totalEps) * 100) : 0;

      // Footages belonging to this category family
      const footagesInCat = computedFootage.filter((ft: ComputedFootage) =>
        ft.tags.some((tid: string) => familyIds.has(tid))
      );
      const totalFootageInCat = footagesInCat.length;
      const usedFootageInCat = footagesInCat.filter((ft: ComputedFootage) => ft.totalUsageCount > 0).length;
      const untouchedFootageInCat = footagesInCat.filter(
        (ft: ComputedFootage) => ft.cooldownStatus === 'NEW_UNTOUCHED'
      ).length;
      const usableFootageInCat = footagesInCat.filter(
        (ft: ComputedFootage) =>
          ft.cooldownStatus === 'NEW_UNTOUCHED' || ft.cooldownStatus === 'READY_FRESH'
      ).length;

      const utilizationPercent =
        totalFootageInCat > 0
          ? Math.round((usedFootageInCat / totalFootageInCat) * 100)
          : 0;

      return {
        mainTag,
        episodeCount,
        episodeSharePercent,
        totalFootageInCat,
        usedFootageInCat,
        untouchedFootageInCat,
        usableFootageInCat,
        utilizationPercent,
      };
    });

    return rows.sort((a, b) => {
      if (b.episodeCount !== a.episodeCount) return b.episodeCount - a.episodeCount;
      if (b.utilizationPercent !== a.utilizationPercent) {
        return b.utilizationPercent - a.utilizationPercent;
      }
      return b.totalFootageInCat - a.totalFootageInCat;
    });
  }, [tags, episodes, computedFootage]);

  const maxEpisodesInAnyCategory = useMemo(() => {
    return Math.max(1, ...categoryRanking.map((r) => r.episodeCount));
  }, [categoryRanking]);

  // Real Utilization & Overview Metrics
  const overviewMetrics = useMemo<OverviewMetrics>(() => {
    const totalEpisodes = episodes.length;
    const totalFootage = computedFootage.length;
    let usedFootage = 0;
    let untouchedFootage = 0;
    let reusedMoreThanOnce = 0;

    for (let i = 0; i < computedFootage.length; i++) {
      const f = computedFootage[i];
      if (f.totalUsageCount > 0) usedFootage++;
      if (f.cooldownStatus === 'NEW_UNTOUCHED') untouchedFootage++;
      if (f.totalUsageCount >= 2) reusedMoreThanOnce++;
    }

    const utilizationRate =
      totalFootage > 0 ? Math.round((usedFootage / totalFootage) * 100) : 0;

    const topCategory = categoryRanking[0] || null;
    const leastCategory =
      categoryRanking.length > 0 ? categoryRanking[categoryRanking.length - 1] : null;

    return {
      totalEpisodes,
      totalFootage,
      usedFootage,
      untouchedFootage,
      reusedMoreThanOnce,
      utilizationRate,
      topCategory,
      leastCategory,
    };
  }, [episodes.length, computedFootage, categoryRanking]);

  return {
    categoryRanking,
    maxEpisodesInAnyCategory,
    overviewMetrics,
    getEpisodeFootageMix,
    resolveTagGroupId,
    groupEpisodeCounts,
    latestEpisodeByCategoryMap,
  };
}
