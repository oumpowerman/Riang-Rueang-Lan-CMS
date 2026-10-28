import { useMemo } from 'react';
import { isFootageInStaging, isStagingTagId } from '../../services/seedData';
import { Episode } from '../../types/episode.types';
import { ComputedFootage, Footage } from '../../types/footage.types';
import { RawSource } from '../../types/source.types';
import { CategoryGroup, CategoryTag, SystemSettings } from '../../types/tag.types';
import { computeFootageAnalytics } from '../../utils/cooldownCalculator';
import { hasRealDriveLink } from '../../utils/fileNameGenerator';
import { CategoryMatrixStat, SubcategoryStat } from './cms.types';

interface UseCMSAnalyticsParams {
  categoryGroups: CategoryGroup[];
  tags: CategoryTag[];
  sources: RawSource[];
  footage: Footage[];
  episodes: Episode[];
  settings: SystemSettings;
}

export function useCMSAnalytics({
  categoryGroups,
  tags,
  sources,
  footage,
  episodes,
  settings,
}: UseCMSAnalyticsParams) {
  const categoryGroupMap = useMemo(() => {
    const map: Record<string, CategoryGroup> = {};
    categoryGroups.forEach((g) => {
      map[g.id] = g;
    });
    return map;
  }, [categoryGroups]);

  const tagMap = useMemo(() => {
    const map: Record<string, CategoryTag> = {};
    for (const t of tags) {
      map[t.id] = t;
    }
    return map;
  }, [tags]);

  const mainCategories = useMemo(() => {
    return tags.filter((t) => t.tier === 1 || (!t.parentId && !t.tier));
  }, [tags]);

  const subcategories = useMemo(() => {
    return tags.filter((t) => t.tier === 2 || !!t.parentId);
  }, [tags]);

  const getSubcategoriesByParent = (parentId: string): CategoryTag[] => {
    return tags.filter((t) => t.parentId === parentId);
  };

  const sourceMap = useMemo(() => {
    const map: Record<string, RawSource> = {};
    for (const s of sources) {
      map[s.id] = s;
    }
    return map;
  }, [sources]);

  const computedFootage = useMemo(() => {
    return computeFootageAnalytics(footage, episodes, settings);
  }, [footage, episodes, settings]);

  const computedFootageMap = useMemo(() => {
    const map: Record<string, ComputedFootage> = {};
    for (const ft of computedFootage) {
      map[ft.id] = ft;
    }
    return map;
  }, [computedFootage]);

  const untaggedFootages = useMemo(() => {
    return computedFootage.filter((ft) => isFootageInStaging(ft.tags));
  }, [computedFootage]);

  const missingDriveFootages = useMemo(() => {
    return computedFootage.filter((ft) => !hasRealDriveLink(ft.driveFileUrl));
  }, [computedFootage]);

  const categoryMatrix = useMemo<CategoryMatrixStat[]>(() => {
    return tags.map((tag) => {
      const isStaging = isStagingTagId(tag.id);

      // Direct and indirect (via subcategories) footage matching
      const matching = isStaging
        ? computedFootage.filter((ft) => isFootageInStaging(ft.tags))
        : computedFootage.filter((ft) => {
            if (isFootageInStaging(ft.tags)) return false;
            if (ft.tags.includes(tag.id)) return true;
            // If this is a main category, also include clips tagged with its children
            if (tag.tier === 1 || !tag.parentId) {
              const childTagIds = tags
                .filter((ct) => ct.parentId === tag.id)
                .map((ct) => ct.id);
              return ft.tags.some((tid) => childTagIds.includes(tid));
            }
            return false;
          });

      const newFootages = matching.filter((f) => f.cooldownStatus === 'NEW_UNTOUCHED');
      const readyFootages = matching.filter((f) => f.cooldownStatus === 'READY_FRESH');
      const usableFootages = [...newFootages, ...readyFootages];

      const newCount = newFootages.length;
      const readyCount = readyFootages.length;
      const usableCount = usableFootages.length;

      // Staging footage is strictly excluded from 5-footage-per-1-EP quota until assigned to a real category
      const producibleEpisodesCount = isStaging ? 0 : Math.floor(usableCount / 5);
      const remainingForNextEp = isStaging ? 5 : 5 - (usableCount % 5);
      const allNewEpisodesCount = isStaging ? 0 : Math.floor(newCount / 5);

      // Subcategory 2-tier breakdown
      const childCategories = tags.filter((t) => t.parentId === tag.id);
      const subcategoryStats: SubcategoryStat[] = childCategories.map((sub) => {
        const subMatching = computedFootage.filter(
          (ft) => !isFootageInStaging(ft.tags) && ft.tags.includes(sub.id)
        );
        const subNew = subMatching.filter((f) => f.cooldownStatus === 'NEW_UNTOUCHED').length;
        const subReady = subMatching.filter((f) => f.cooldownStatus === 'READY_FRESH').length;
        const subUsable = subNew + subReady;
        return {
          subcategory: sub,
          totalCount: subMatching.length,
          usableCount: subUsable,
          newCount: subNew,
          readyCount: subReady,
          producibleEpisodesCount: Math.floor(subUsable / 5),
        };
      });

      // Special Episode readiness: subcategories with >= 5 usable clips
      const specialEpisodeSubcategories = isStaging
        ? []
        : subcategoryStats
            .filter((s) => s.usableCount >= 5)
            .map((s) => ({ subcategory: s.subcategory, count: s.usableCount }));

      // Variety Episode Quota: subcategories with >= 1 usable clip
      const usableSubcategoryCount = subcategoryStats.filter((s) => s.usableCount >= 1).length;
      const varietyEpisodeQuota = isStaging ? 0 : usableSubcategoryCount >= 5 ? 1 : 0;

      return {
        tag,
        totalCount: matching.length,
        newCount,
        readyCount,
        frequentCount: matching.filter((f) => f.cooldownStatus === 'HIGH_VELOCITY_WARNING').length,
        cooldownCount: matching.filter((f) => f.cooldownStatus === 'RECENT_COOLDOWN').length,
        directFlowCount: matching.filter((f) => f.ingestionFlow === 'DIRECT_1_TO_1').length,
        splitFlowCount: matching.filter((f) => f.ingestionFlow === 'SPLIT_1_TO_N').length,
        usableCount,
        producibleEpisodesCount,
        remainingForNextEp,
        allNewEpisodesCount,
        canMakeAllNew5: isStaging ? false : newCount >= 5,
        canMakeMix2New3Fresh: isStaging ? false : newCount >= 2 && usableCount >= 5,
        usableFootages,
        allFootages: matching,
        subcategoriesCount: childCategories.length,
        subcategoryStats,
        varietyEpisodeQuota,
        specialEpisodeSubcategories,
      };
    });
  }, [tags, computedFootage]);

  return {
    categoryGroupMap,
    tagMap,
    mainCategories,
    subcategories,
    getSubcategoriesByParent,
    sourceMap,
    computedFootage,
    computedFootageMap,
    untaggedFootages,
    missingDriveFootages,
    categoryMatrix,
  };
}
