import { useMemo, useCallback } from 'react';
import { useCMS } from '../../../../context/CMSContext';
import { isStagingTagId } from '../../../../services/seedData';
import {
  ArchiveSeriesCategory,
  CategoryTag,
  DEFAULT_ARCHIVE_SERIES_CATEGORIES,
} from '../../../../types/tag.types';
import type { Episode, EpisodeRankingSlot } from '../../../../types/episode.types';
import {
  extractEpisodeSeriesInfo,
  resolveSeriesArchiveCategoryId,
  findMatchedTagsForSeries,
  computeSeriesRelatedFootagePool,
} from '../../../../utils/seriesExtractor';

export interface CategoryRankingItem {
  seriesKey: string; // Canonical series key (e.g. "SERIES::คนเมายาสุดฮา")
  seriesName: string; // Clean series name (e.g. "คนเมายาสุดฮา")
  fullSeriesTitle: string; // e.g. "5 อันดับ คนเมายาสุดฮา"
  archiveCategoryId: string; // Master Archive Category ID
  builderTargetTagId: string; // Tag ID to preselect when clicking "+ สร้าง EP ถัดไป"
  matchedTagIds: string[]; // All matched or custom-bound 3-Tier Tag IDs
  matchedTagNames: string[]; // Display names of matched/bound tags
  isCustomTagBound: boolean; // True if manually bound by user in settings.seriesToTagIdsMap
  mainTag: CategoryTag;
  episodeCount: number;
  complete5SlotEpisodeCount: number; // Episodes with all 5/5 ranking slots filled
  incompleteSlotEpisodeCount: number; // Episodes with < 5 ranking slots filled
  episodeSharePercent: number;
  totalFootageInCat: number;
  usedFootageInCat: number;
  untouchedFootageInCat: number;
  usableFootageInCat: number;
  utilizationPercent: number;
}

export interface ArchiveCategorySummary {
  category: ArchiveSeriesCategory;
  seriesCount: number;
  episodeCount: number;
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
  totalDistinctSeries: number;
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
    settings,
    updateSettings,
  } = useCMS();

  // Active Master Archive Categories (user-customizable in settings)
  const archiveCategories = useMemo<ArchiveSeriesCategory[]>(() => {
    if (
      settings.archiveSeriesCategories &&
      settings.archiveSeriesCategories.length > 0
    ) {
      return settings.archiveSeriesCategories;
    }
    return DEFAULT_ARCHIVE_SERIES_CATEGORIES;
  }, [settings.archiveSeriesCategories]);

  const archiveCategoryMap = useMemo<Record<string, ArchiveSeriesCategory>>(
    () => {
      const map: Record<string, ArchiveSeriesCategory> = {};
      archiveCategories.forEach((c) => {
        map[c.id] = c;
      });
      return map;
    },
    [archiveCategories]
  );

  // Precompute Footage Mix Map for all episodes
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
        recycledPercent:
          total > 0 ? Math.round((recycledCount / total) * 100) : 0,
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

  // Map each episode -> Set of all 3-Tier Footage Tag IDs present across its 5 ranked clips + main/target tags
  const { episodeFootageTagsMap, tagEpisodeCounts } = useMemo(() => {
    const epTagMap: Record<string, Set<string>> = {};
    const countsByTag: Record<string, number> = {};

    for (const ep of episodes) {
      const tagSet = new Set<string>();
      if (ep.mainCategoryTagId && !isStagingTagId(ep.mainCategoryTagId)) {
        tagSet.add(ep.mainCategoryTagId);
      }
      if (ep.targetSubcategoryId && !isStagingTagId(ep.targetSubcategoryId)) {
        tagSet.add(ep.targetSubcategoryId);
      }
      for (const slot of ep.rankings) {
        if (!slot.footageId) continue;
        const ft = computedFootageMap[slot.footageId];
        if (!ft) continue;
        ft.tags.forEach((tid) => {
          if (!isStagingTagId(tid)) {
            tagSet.add(tid);
          }
        });
      }
      epTagMap[ep.id] = tagSet;
      tagSet.forEach((tid) => {
        countsByTag[tid] = (countsByTag[tid] || 0) + 1;
      });
    }

    return {
      episodeFootageTagsMap: epTagMap,
      tagEpisodeCounts: countsByTag,
    };
  }, [episodes, computedFootageMap]);

  // Smart Series Extraction & Grouping across all Episodes
  const {
    episodeSeriesKeyMap,
    activeSeriesRanking,
    unproducedSeriesRanking,
    latestEpisodeBySeriesMap,
    archiveCategoryStats,
    groupEpisodeCounts,
  } = useMemo(() => {
    const epToSeriesKey: Record<string, string> = {};
    const seriesBuckets = new Map<
      string,
      {
        seriesKey: string;
        seriesName: string;
        fullSeriesTitle: string;
        episodes: Episode[];
        footageIdsInEpisodes: Set<string>;
        tagIdsInEpisodes: Set<string>;
        primaryTagCounts: Record<string, number>;
      }
    >();

    for (const ep of episodes) {
      const info = extractEpisodeSeriesInfo(ep, tagMap);
      epToSeriesKey[ep.id] = info.seriesKey;

      let bucket = seriesBuckets.get(info.seriesKey);
      if (!bucket) {
        bucket = {
          seriesKey: info.seriesKey,
          seriesName: info.seriesName,
          fullSeriesTitle: info.fullSeriesTitle,
          episodes: [],
          footageIdsInEpisodes: new Set<string>(),
          tagIdsInEpisodes: new Set<string>(),
          primaryTagCounts: {},
        };
        seriesBuckets.set(info.seriesKey, bucket);
      }

      bucket.episodes.push(ep);
      if (ep.mainCategoryTagId && !isStagingTagId(ep.mainCategoryTagId)) {
        bucket.primaryTagCounts[ep.mainCategoryTagId] =
          (bucket.primaryTagCounts[ep.mainCategoryTagId] || 0) + 1;
      }

      const epTags = episodeFootageTagsMap[ep.id];
      if (epTags) {
        epTags.forEach((tid) => bucket!.tagIdsInEpisodes.add(tid));
      }

      ep.rankings.forEach((r) => {
        if (r.footageId) {
          bucket!.footageIdsInEpisodes.add(r.footageId);
        }
      });
    }

    const totalEps = Math.max(1, episodes.length);
    const latestBySeries: Record<string, Episode> = {};
    const activeRows: CategoryRankingItem[] = [];

    for (const bucket of seriesBuckets.values()) {
      const epCount = bucket.episodes.length;
      const sharePct =
        episodes.length > 0 ? Math.round((epCount / totalEps) * 100) : 0;

      // Count episodes with full 5/5 ranking slots filled
      let complete5SlotEpisodeCount = 0;
      for (const ep of bucket.episodes) {
        const filledCount = (ep.rankings || []).filter((r) =>
          Boolean(r.footageId)
        ).length;
        if (filledCount >= 5) {
          complete5SlotEpisodeCount += 1;
        }
      }
      const incompleteSlotEpisodeCount = epCount - complete5SlotEpisodeCount;

      // Find latest episode in this series
      let latestEp = bucket.episodes[0];
      for (const ep of bucket.episodes) {
        const infoA = extractEpisodeSeriesInfo(ep, tagMap);
        const infoB = extractEpisodeSeriesInfo(latestEp, tagMap);
        if (
          infoA.parsedEpisodeNo > infoB.parsedEpisodeNo ||
          ep.publishDate > latestEp.publishDate
        ) {
          latestEp = ep;
        }
      }
      latestBySeries[bucket.seriesKey] = latestEp;

      // Smart suffix-stripped tag matching + manual custom binding override
      const tagMatch = findMatchedTagsForSeries(
        bucket.seriesKey,
        bucket.seriesName,
        tags,
        tagMap,
        settings.seriesToTagIdsMap,
        isStagingTagId
      );

      const mostFrequentPrimaryTagId = Object.entries(
        bucket.primaryTagCounts
      ).sort((a, b) => b[1] - a[1])[0]?.[0];

      const builderTargetTagId =
        tagMatch.matchedTagIds[0] ||
        mostFrequentPrimaryTagId ||
        tags.find((t) => !isStagingTagId(t.id))?.id ||
        'TAG-0001';

      // Resolve Archive Category ID (user custom assignment or smart auto-classification)
      const tagNamesList = Array.from(bucket.tagIdsInEpisodes)
        .map((tid) => tagMap[tid]?.name || '')
        .filter(Boolean);

      const archiveCategoryId = resolveSeriesArchiveCategoryId(
        bucket.seriesKey,
        bucket.seriesName,
        tagNamesList,
        settings.seriesToArchiveCategoryMap,
        archiveCategories
      );

      // Compute related footage pool from series episodes + matched/bound tags + stripped title/note keywords
      const relatedFootages = computeSeriesRelatedFootagePool(
        computedFootage,
        bucket.footageIdsInEpisodes,
        tagMatch.matchedTagIds,
        tagMatch.keywords
      );

      const poolFootages =
        relatedFootages.length > 0
          ? relatedFootages
          : computedFootage.filter((ft) =>
              ft.tags.includes(builderTargetTagId)
            );

      const totalFootageInCat = poolFootages.length;
      const usedFootageInCat = poolFootages.filter(
        (ft) => ft.totalUsageCount > 0
      ).length;
      const untouchedFootageInCat = poolFootages.filter(
        (ft) => ft.cooldownStatus === 'NEW_UNTOUCHED'
      ).length;
      const usableFootageInCat = poolFootages.filter(
        (ft) =>
          ft.cooldownStatus === 'NEW_UNTOUCHED' ||
          ft.cooldownStatus === 'READY_FRESH'
      ).length;

      const utilizationPercent =
        totalFootageInCat > 0
          ? Math.round((usedFootageInCat / totalFootageInCat) * 100)
          : 100;

      const syntheticTag: CategoryTag = {
        id: bucket.seriesKey,
        name: bucket.seriesName,
        color: archiveCategoryMap[archiveCategoryId]?.color || 'emerald',
        groupType: 'THEME',
        groupId: archiveCategoryId,
        description: `รายการ 5 อันดับ ${bucket.seriesName} (${epCount} ตอน)`,
        createdAt: latestEp.createdAt,
        tier: tagMatch.matchedTags[0]?.tier || 1,
        subCategory: archiveCategoryMap[archiveCategoryId]?.name || 'ทั่วไป',
        parentId: null,
      };

      activeRows.push({
        seriesKey: bucket.seriesKey,
        seriesName: bucket.seriesName,
        fullSeriesTitle: bucket.fullSeriesTitle,
        archiveCategoryId,
        builderTargetTagId,
        matchedTagIds: tagMatch.matchedTagIds,
        matchedTagNames: tagMatch.matchedTagNames,
        isCustomTagBound: tagMatch.isCustomTagBound,
        mainTag: syntheticTag,
        episodeCount: epCount,
        complete5SlotEpisodeCount,
        incompleteSlotEpisodeCount,
        episodeSharePercent: sharePct,
        totalFootageInCat,
        usedFootageInCat,
        untouchedFootageInCat,
        usableFootageInCat,
        utilizationPercent,
      });
    }

    // Sort active series from Most Episodes -> Least Episodes, then Thai alphabetical
    activeRows.sort((a, b) => {
      if (b.episodeCount !== a.episodeCount) {
        return b.episodeCount - a.episodeCount;
      }
      return a.seriesName.localeCompare(b.seriesName, 'th');
    });

    // Also build unproduced 0-EP tag series for the optional toggle in Series Shelf
    const activeLowerNames = new Set(
      activeRows.map((r) => r.seriesName.toLowerCase().trim())
    );
    const unproducedRows: CategoryRankingItem[] = tags
      .filter(
        (t) =>
          !isStagingTagId(t.id) &&
          !activeLowerNames.has(t.name.toLowerCase().trim())
      )
      .map((t) => {
        const sKey = `TAG_UNPRODUCED::${t.id}`;
        const archiveCategoryId = resolveSeriesArchiveCategoryId(
          sKey,
          t.name,
          [t.name, t.subCategory || ''],
          settings.seriesToArchiveCategoryMap,
          archiveCategories
        );
        const ftInTag = computedFootage.filter((ft) => ft.tags.includes(t.id));
        const usableFt = ftInTag.filter(
          (ft) =>
            ft.cooldownStatus === 'NEW_UNTOUCHED' ||
            ft.cooldownStatus === 'READY_FRESH'
        );
        const newFt = ftInTag.filter(
          (ft) => ft.cooldownStatus === 'NEW_UNTOUCHED'
        );
        return {
          seriesKey: sKey,
          seriesName: t.name,
          fullSeriesTitle: `5 อันดับ ${t.name}`,
          archiveCategoryId,
          builderTargetTagId: t.id,
          matchedTagIds: [t.id],
          matchedTagNames: [t.name],
          isCustomTagBound: false,
          mainTag: {
            ...t,
            id: sKey,
            groupId: archiveCategoryId,
          },
          episodeCount: 0,
          complete5SlotEpisodeCount: 0,
          incompleteSlotEpisodeCount: 0,
          episodeSharePercent: 0,
          totalFootageInCat: ftInTag.length,
          usedFootageInCat: ftInTag.filter((f) => f.totalUsageCount > 0).length,
          untouchedFootageInCat: newFt.length,
          usableFootageInCat: usableFt.length,
          utilizationPercent: 0,
        };
      })
      .filter((r) => r.totalFootageInCat > 0)
      .sort((a, b) => b.usableFootageInCat - a.usableFootageInCat);

    // Compute counts per ArchiveSeriesCategory
    const grpCounts: Record<string, number> = {};
    const catStats: ArchiveCategorySummary[] = archiveCategories.map((cat) => {
      const seriesInCat = activeRows.filter(
        (r) => r.archiveCategoryId === cat.id
      );
      const epsInCat = seriesInCat.reduce((sum, r) => sum + r.episodeCount, 0);
      grpCounts[cat.id] = epsInCat;
      return {
        category: cat,
        seriesCount: seriesInCat.length,
        episodeCount: epsInCat,
      };
    });

    return {
      episodeSeriesKeyMap: epToSeriesKey,
      activeSeriesRanking: activeRows,
      unproducedSeriesRanking: unproducedRows,
      latestEpisodeBySeriesMap: latestBySeries,
      archiveCategoryStats: catStats,
      groupEpisodeCounts: grpCounts,
    };
  }, [
    episodes,
    tagMap,
    episodeFootageTagsMap,
    tags,
    settings.seriesToArchiveCategoryMap,
    settings.seriesToTagIdsMap,
    archiveCategories,
    archiveCategoryMap,
    computedFootage,
  ]);

  const resolveTagGroupId = useCallback(
    (tag: CategoryTag | undefined): string => {
      if (!tag) return archiveCategories[0]?.id || 'ARC-CAT-LOCAL';
      if (tag.groupId && archiveCategoryMap[tag.groupId]) return tag.groupId;
      return archiveCategories[0]?.id || 'ARC-CAT-LOCAL';
    },
    [archiveCategories, archiveCategoryMap]
  );

  // Actions for managing custom Master Archive Categories & Series assignments
  const handleAssignSeriesToArchiveCategory = useCallback(
    (seriesKey: string, targetArchiveCategoryId: string) => {
      const currentMap = settings.seriesToArchiveCategoryMap || {};
      updateSettings({
        ...settings,
        archiveSeriesCategories: archiveCategories,
        seriesToArchiveCategoryMap: {
          ...currentMap,
          [seriesKey]: targetArchiveCategoryId,
        },
      });
    },
    [settings, archiveCategories, updateSettings]
  );

  const handleAddArchiveCategory = useCallback(
    (name: string, color = 'emerald') => {
      const cleanName = name.trim();
      if (!cleanName) return;
      const newCat: ArchiveSeriesCategory = {
        id: `ARC-CAT-${Date.now()}`,
        name: cleanName,
        color,
      };
      updateSettings({
        ...settings,
        archiveSeriesCategories: [...archiveCategories, newCat],
      });
    },
    [settings, archiveCategories, updateSettings]
  );

  const handleRenameArchiveCategory = useCallback(
    (categoryId: string, newName: string) => {
      const cleanName = newName.trim();
      if (!cleanName) return;
      updateSettings({
        ...settings,
        archiveSeriesCategories: archiveCategories.map((c) =>
          c.id === categoryId ? { ...c, name: cleanName } : c
        ),
      });
    },
    [settings, archiveCategories, updateSettings]
  );

  const handleDeleteArchiveCategory = useCallback(
    (categoryId: string) => {
      if (archiveCategories.length <= 1) return;
      const remaining = archiveCategories.filter((c) => c.id !== categoryId);
      const fallbackId = remaining[0].id;
      const nextMap: Record<string, string> = {
        ...(settings.seriesToArchiveCategoryMap || {}),
      };
      Object.keys(nextMap).forEach((sKey) => {
        if (nextMap[sKey] === categoryId) {
          nextMap[sKey] = fallbackId;
        }
      });
      updateSettings({
        ...settings,
        archiveSeriesCategories: remaining,
        seriesToArchiveCategoryMap: nextMap,
      });
    },
    [settings, archiveCategories, updateSettings]
  );

  const maxEpisodesInAnyCategory = useMemo(() => {
    return Math.max(1, ...activeSeriesRanking.map((r) => r.episodeCount));
  }, [activeSeriesRanking]);

  // Real Utilization & Overview Metrics (based strictly on Active Produced Series)
  const overviewMetrics = useMemo<OverviewMetrics>(() => {
    const totalEpisodes = episodes.length;
    const totalDistinctSeries = activeSeriesRanking.length;
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

    const topCategory = activeSeriesRanking[0] || null;
    const leastCategory =
      activeSeriesRanking.length > 0
        ? activeSeriesRanking[activeSeriesRanking.length - 1]
        : null;

    return {
      totalEpisodes,
      totalDistinctSeries,
      totalFootage,
      usedFootage,
      untouchedFootage,
      reusedMoreThanOnce,
      utilizationRate,
      topCategory,
      leastCategory,
    };
  }, [episodes.length, computedFootage, activeSeriesRanking]);

  const handleBindSeriesToTags = useCallback(
    (seriesKey: string, tagIds: string[] | null) => {
      const currentMap = { ...(settings.seriesToTagIdsMap || {}) };
      if (!tagIds || tagIds.length === 0) {
        delete currentMap[seriesKey];
      } else {
        currentMap[seriesKey] = Array.from(new Set(tagIds));
      }
      updateSettings({
        seriesToTagIdsMap: currentMap,
      });
    },
    [settings.seriesToTagIdsMap, updateSettings]
  );

  return {
    categoryRanking: activeSeriesRanking,
    unproducedSeriesRanking,
    episodeSeriesKeyMap,
    episodeFootageTagsMap,
    tagEpisodeCounts,
    archiveCategories,
    archiveCategoryMap,
    archiveCategoryStats,
    seriesToTagIdsMap: settings.seriesToTagIdsMap || {},
    handleAssignSeriesToArchiveCategory,
    handleAddArchiveCategory,
    handleRenameArchiveCategory,
    handleDeleteArchiveCategory,
    handleBindSeriesToTags,
    maxEpisodesInAnyCategory,
    overviewMetrics,
    getEpisodeFootageMix,
    resolveTagGroupId,
    groupEpisodeCounts,
    latestEpisodeByCategoryMap: latestEpisodeBySeriesMap,
  };
}
