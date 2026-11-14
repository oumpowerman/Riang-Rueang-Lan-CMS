import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useCMS } from '../../../context/CMSContext';
import { isStagingTagId } from '../../../services/seedData';
import {
  Episode,
  EpisodeProductionTarget,
  EpisodeRankingSlot,
  EpisodeWorkflowStage,
  PublishSlot,
} from '../../../types/episode.types';
import { DEFAULT_TIER_SUBCATEGORIES } from '../../../types/tag.types';
import {
  MixRecipeId,
  analyzeEpisodeCollisions,
  buildFootageToEpisodeIndex,
  generateSmartMixByRecipe,
} from '../../../utils/collisionDetector';
import { getReferenceTodayDate } from '../../../utils/cooldownCalculator';
import {
  generateMasterEpisodeFileName,
  generateNextId,
} from '../../../utils/fileNameGenerator';
import { extractDefaultRankFields } from '../../../utils/episodeScriptGenerator';
import {
  BuilderStepNumber,
  DEFAULT_RANKINGS_1_TO_5,
  DuplicateSubcategoryWarning,
  PickerSortBy,
  PoolQuickFilter,
  RANK_ORDER_1_TO_5,
  RankNumber,
  SlotDropPayload,
} from './builder.types';
import { useBuilderThreeTierScope } from './useBuilderThreeTierScope';

export function useEpisodeBuilder() {
  const {
    categoryGroups,
    categoryGroupMap,
    tags,
    tagMap,
    categoryMatrix,
    computedFootage,
    computedFootageMap,
    episodes,
    settings,
    saveEpisode,
    setActiveTab,
    setIsStatusRuleModalOpen,
    setIsThreeTierManagerOpen,
    builderPreselectRequest,
    clearBuilderPreselectRequest,
  } = useCMS();

  const nextEpisodeId = generateNextId(
    'EP',
    episodes.map((e) => e.id)
  );

  // Determine initial primary tag (prefer highest-stock real tag)
  const initialDefaultTagId = useMemo(() => {
    const nonStaging = categoryMatrix
      .filter((c) => !isStagingTagId(c.tag.id))
      .sort((a, b) => b.usableCount - a.usableCount);
    return (
      nonStaging[0]?.tag.id ||
      tags.find((t) => !isStagingTagId(t.id))?.id ||
      'TAG-0004'
    );
  }, [categoryMatrix, tags]);

  // Step 1: Primary Tag & Legacy Group Compatibility State
  const [selectedGroupId, setSelectedGroupId] = useState<string>(
    categoryGroups[0]?.id || 'GRP-PERSON'
  );
  const [mainCategoryTagId, setMainCategoryTagId] =
    useState<string>(initialDefaultTagId);
  const [productionTarget, setProductionTarget] =
    useState<EpisodeProductionTarget>('MAIN_CATEGORY_VARIETY');
  const [targetSubcategoryId, setTargetSubcategoryId] = useState<string | null>(
    null
  );

  // Active Progressive Accordion Step (1 | 2 | 3)
  const [activeBuilderStep, setActiveBuilderStep] =
    useState<BuilderStepNumber>(1);

  // Step 2: Active Recipe State & Rankings 1..5
  const [activeRecipe, setActiveRecipe] = useState<MixRecipeId>(
    'FORMULA_2_NEW_3_FRESH'
  );
  const [rankings, setRankings] = useState<EpisodeRankingSlot[]>(
    DEFAULT_RANKINGS_1_TO_5
  );
  const [activeSlotRank, setActiveSlotRank] = useState<RankNumber>(1);

  const selectedFootageIds = useMemo(
    () =>
      rankings
        .map((r) => r.footageId)
        .filter((id): id is string => Boolean(id)),
    [rankings]
  );

  const selectedFootageObjects = useMemo(
    () =>
      rankings.map((r) =>
        r.footageId ? computedFootageMap[r.footageId] || null : null
      ),
    [rankings, computedFootageMap]
  );

  // 3-Tier Independent Scope & Stock Hook
  const {
    resolveTagGroupId,
    tagStockMap,
    tier1Groups,
    tier2Groups,
    tier3Groups,
    selectedFacetTagIds,
    setSelectedFacetTagIds,
    scopeMatchMode,
    setScopeMatchMode,
    step1SearchQuery,
    setStep1SearchQuery,
    tagClickMode,
    setTagClickMode,
    activeScopeTagIds,
    scopedFootages,
    liveCategoryStock,
    currentSubcategories,
    sortedCategories,
    groupStockStats,
    categoriesInSelectedGroup,
  } = useBuilderThreeTierScope({
    categoryGroups,
    categoryGroupMap,
    tags,
    tagMap,
    categoryMatrix,
    computedFootage,
    selectedFootageIds,
    tierSubCategories: settings.tierSubCategories || DEFAULT_TIER_SUBCATEGORIES,
    mainCategoryTagId,
    selectedGroupId,
  });

  // Right Pool Filter & Pagination State
  const [allowCrossCategory, setAllowCrossCategory] = useState(false);
  const [poolFilterGroupId, setPoolFilterGroupId] = useState<string>('ALL');
  const [poolSubcategoryFilterId, setPoolSubcategoryFilterId] = useState<
    string | null
  >(null);
  const [poolQuickFilter, setPoolQuickFilter] =
    useState<PoolQuickFilter>('AVAILABLE_USABLE');
  const [pickerSearch, setPickerSearch] = useState('');
  const [pickerSortBy, setPickerSortBy] =
    useState<PickerSortBy>('REST_DAYS_DESC');
  const [pickerPage, setPickerPage] = useState(1);
  const [pickerPageSize, setPickerPageSize] = useState(6);

  // Flexible Episode Scope: 'MAIN_CATEGORY' or 'SUBCATEGORY'
  const [categoryEpisodeScope, setCategoryEpisodeScope] = useState<
    'MAIN_CATEGORY' | 'SUBCATEGORY'
  >('MAIN_CATEGORY');

  const categoryEpisodeCount = useMemo(() => {
    if (categoryEpisodeScope === 'SUBCATEGORY' && targetSubcategoryId) {
      return episodes.filter(
        (e) => e.targetSubcategoryId === targetSubcategoryId
      ).length;
    }
    return episodes.filter((e) => e.mainCategoryTagId === mainCategoryTagId)
      .length;
  }, [episodes, mainCategoryTagId, categoryEpisodeScope, targetSubcategoryId]);

  const nextCategoryEpisodeNo = categoryEpisodeCount + 1;

  // Build auto-title helper based on Primary Series Tag + Optional Facet Tags
  const buildEpisodeAutoTitle = useCallback(
    (primaryId: string, facetIds: string[]) => {
      const primaryName = tagMap[primaryId]?.name || 'หมวดรวม';
      const epNo =
        episodes.filter((e) => e.mainCategoryTagId === primaryId).length + 1;
      const facetNames = facetIds
        .filter((fid) => fid !== primaryId && Boolean(tagMap[fid]))
        .map((fid) => tagMap[fid].name);

      if (facetNames.length > 0) {
        return `5 อันดับ ${primaryName} (${facetNames.join(' · ')}) EP.${epNo} - จังหวะพีคคัดเน้นๆ`;
      }
      return `5 อันดับ ${primaryName} EP.${epNo} - จังหวะพีคคัดเน้นๆ`;
    },
    [tagMap, episodes]
  );

  const [title, setTitle] = useState(() =>
    buildEpisodeAutoTitle(initialDefaultTagId, [])
  );
  const [publishDate, setPublishDate] = useState<string>('2026-10-28');
  const [publishSlot, setPublishSlot] = useState<PublishSlot>('MORNING_0600');
  const workflowStage: EpisodeWorkflowStage = '4_PUBLISHED';
  const [isOptionalMasterOpen, setIsOptionalMasterOpen] = useState(false);
  const [masterDriveUrl, setMasterDriveUrl] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [facebookUrl, setFacebookUrl] = useState('');
  const [tiktokUrl, setTiktokUrl] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [introMascotScript, setIntroMascotScript] = useState(
    'สวัสดีครับชาวเรียงเรื่องลั่น! วันนี้เจ้าลั่นคัด 5 อันดับช็อตฮาจังหวะโบ๊ะบ๊ะมาให้ขำกันแบบจุกๆ!'
  );
  const [outroMascotScript, setOutroMascotScript] = useState(
    'ใครชอบอันดับไหนคอมเมนต์บอกกันได้ แล้วเจอกันคลิปหน้า เวลาเดิม 06:00 น. และ 18:00 น.!'
  );

  const [preselectNotice, setPreselectNotice] = useState<string | null>(null);
  const [savedBannerMessage, setSavedBannerMessage] = useState<string | null>(
    null
  );
  const [duplicateConfirmModalOpen, setDuplicateConfirmModalOpen] =
    useState(false);
  const [newlyCreatedEpisode, setNewlyCreatedEpisode] =
    useState<Episode | null>(null);

  const activeGroup = useMemo(
    () => categoryGroupMap[selectedGroupId] || categoryGroups[0] || null,
    [categoryGroupMap, selectedGroupId, categoryGroups]
  );

  const activeSubcategory = useMemo(
    () => (targetSubcategoryId ? tagMap[targetSubcategoryId] || null : null),
    [targetSubcategoryId, tagMap]
  );

  // Active Category Stat (works for Tier 1, Tier 2, or Tier 3 tags)
  const activeCategoryStat = useMemo(() => {
    const found = categoryMatrix.find((c) => c.tag.id === mainCategoryTagId);
    if (found) return found;
    const fallbackTag = tagMap[mainCategoryTagId];
    if (!fallbackTag) return null;
    const stock = tagStockMap[mainCategoryTagId];
    const allFt = computedFootage.filter((ft) =>
      ft.tags.includes(mainCategoryTagId)
    );
    const usableFt = allFt.filter(
      (ft) =>
        ft.cooldownStatus === 'NEW_UNTOUCHED' ||
        ft.cooldownStatus === 'READY_FRESH'
    );
    const newCount = stock?.newCount || 0;
    const readyCount = stock?.freshCount || 0;
    const usableCount = stock?.usable || usableFt.length;
    return {
      tag: fallbackTag,
      totalCount: stock?.total || allFt.length,
      newCount,
      readyCount,
      frequentCount: 0,
      cooldownCount: 0,
      directFlowCount: allFt.filter((f) => f.ingestionFlow === 'DIRECT_1_TO_1').length,
      splitFlowCount: allFt.filter((f) => f.ingestionFlow !== 'DIRECT_1_TO_1').length,
      usableCount,
      producibleEpisodesCount: stock?.producibleEpisodes || Math.floor(usableCount / 5),
      remainingForNextEp: 5 - (usableCount % 5),
      allNewEpisodesCount: Math.floor(newCount / 5),
      canMakeAllNew5: newCount >= 5,
      canMakeMix2New3Fresh: newCount >= 2 && usableCount >= 5,
      usableFootages: usableFt,
      allFootages: allFt,
      subcategoriesCount: 0,
      subcategoryStats: [],
      varietyEpisodeQuota: Math.floor(usableCount / 5),
      specialEpisodeSubcategories: [],
    };
  }, [
    categoryMatrix,
    mainCategoryTagId,
    tagMap,
    tagStockMap,
    computedFootage,
  ]);

  // Diversity Collision Guard
  const duplicateSubcategories = useMemo<DuplicateSubcategoryWarning[]>(() => {
    if (productionTarget !== 'MAIN_CATEGORY_VARIETY') return [];
    const entityUsage: Record<string, DuplicateSubcategoryWarning> = {};

    rankings.forEach((slot) => {
      if (!slot.footageId) return;
      const ft = computedFootageMap[slot.footageId];
      if (!ft) return;
      const child = currentSubcategories.find((s) => ft.tags.includes(s.id));
      if (child) {
        if (!entityUsage[child.id]) {
          entityUsage[child.id] = { tag: child, ranks: [] };
        }
        entityUsage[child.id].ranks.push(slot.rank);
      }
    });

    return Object.values(entityUsage).filter((item) => item.ranks.length > 1);
  }, [productionTarget, rankings, computedFootageMap, currentSubcategories]);

  // Populate rankings 1..5 using a recipe and the active 3-Tier Scope
  const applyRecipeForCategory = useCallback(
    (
      tagId: string,
      recipeId: MixRecipeId,
      overrideFacetIds?: string[],
      overrideMatchMode?: 'AND' | 'OR'
    ) => {
      setActiveRecipe(recipeId);
      const facets = overrideFacetIds ?? selectedFacetTagIds;
      const mode = overrideMatchMode ?? scopeMatchMode;
      const targetTags = allowCrossCategory
        ? []
        : [tagId, ...facets.filter((id) => id !== tagId)];

      const autoPicked = generateSmartMixByRecipe(
        computedFootage,
        recipeId,
        targetTags,
        allowCrossCategory,
        mode
      );

      const nextRankings: EpisodeRankingSlot[] = RANK_ORDER_1_TO_5.map(
        (rankNum, idx) => {
          const picked = autoPicked[idx] || null;
          const defaults = extractDefaultRankFields(picked);
          return {
            rank: rankNum,
            footageId: picked ? picked.id : null,
            rankTitle: defaults.rankTitle,
            punchlineNote: defaults.punchlineNote,
            mascotScript: picked
              ? `อันดับที่ ${rankNum}: ${picked.mascotNotes || picked.title}`
              : '',
            snapshotNote: picked
              ? picked.cooldownStatus === 'NEW_UNTOUCHED'
                ? 'ฟุตใหม่แกะกล่อง'
                : `วนใช้หลังพัก ${picked.daysSinceLastUsed ?? 0} วัน`
              : '',
          };
        }
      );

      setRankings(nextRankings);
    },
    [allowCrossCategory, computedFootage, scopeMatchMode, selectedFacetTagIds]
  );

  // Select Primary Series Tag (works for Tier 1, Tier 2, or Tier 3)
  const handleSelectCategory = (tagId: string, autoFillWithRecipe = false) => {
    const tagObj = tagMap[tagId];
    if (tagObj) {
      setSelectedGroupId(resolveTagGroupId(tagObj));
    }
    setMainCategoryTagId(tagId);
    const nextFacets = selectedFacetTagIds.filter((id) => id !== tagId);
    setSelectedFacetTagIds(nextFacets);
    setPoolSubcategoryFilterId(null);
    setProductionTarget('MAIN_CATEGORY_VARIETY');
    setTargetSubcategoryId(null);
    setAllowCrossCategory(false);
    setPickerPage(1);
    setTitle(buildEpisodeAutoTitle(tagId, nextFacets));

    if (autoFillWithRecipe) {
      applyRecipeForCategory(tagId, activeRecipe, nextFacets);
    }
  };

  // Toggle an additional Facet Tag across Tier 1 / Tier 2 / Tier 3
  const handleToggleFacetTag = (tagId: string) => {
    if (tagId === mainCategoryTagId) return;
    setSelectedFacetTagIds((prev) => {
      const exists = prev.includes(tagId);
      const next = exists
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId];
      setTitle(buildEpisodeAutoTitle(mainCategoryTagId, next));
      if (next.length === 1 && !exists) {
        setTargetSubcategoryId(tagId);
        setProductionTarget('SINGLE_SUBCATEGORY_SPECIAL');
      } else if (next.length === 0) {
        setTargetSubcategoryId(null);
        setProductionTarget('MAIN_CATEGORY_VARIETY');
      }
      return next;
    });
    setPickerPage(1);
  };

  const handleClearFacetTags = () => {
    setSelectedFacetTagIds([]);
    setTargetSubcategoryId(null);
    setProductionTarget('MAIN_CATEGORY_VARIETY');
    setTitle(buildEpisodeAutoTitle(mainCategoryTagId, []));
    setPickerPage(1);
  };

  const handleSelectGroup = (groupId: string) => {
    setSelectedGroupId(groupId);
    const groupCategories = sortedCategories.filter(
      (stat) => resolveTagGroupId(stat.tag) === groupId
    );
    const isCurrentInGroup = groupCategories.some(
      (stat) => stat.tag.id === mainCategoryTagId
    );
    if (!isCurrentInGroup && groupCategories.length > 0) {
      handleSelectCategory(groupCategories[0].tag.id, true);
    }
  };

  const handleSelectVarietyMode = () => {
    handleClearFacetTags();
  };

  const handleSelectSoloMode = () => {
    setProductionTarget('SINGLE_SUBCATEGORY_SPECIAL');
    const firstSub = currentSubcategories[0];
    if (firstSub) {
      setTargetSubcategoryId(firstSub.id);
      setSelectedFacetTagIds([firstSub.id]);
      setTitle(buildEpisodeAutoTitle(mainCategoryTagId, [firstSub.id]));
    }
  };

  const handleSelectSubcategory = (subId: string) => {
    setTargetSubcategoryId(subId);
    setSelectedFacetTagIds([subId]);
    setProductionTarget('SINGLE_SUBCATEGORY_SPECIAL');
    setTitle(buildEpisodeAutoTitle(mainCategoryTagId, [subId]));
    setPickerPage(1);
  };

  const handleToggleEpisodeScope = (
    scope: 'MAIN_CATEGORY' | 'SUBCATEGORY'
  ) => {
    setCategoryEpisodeScope(scope);
    if (
      scope === 'SUBCATEGORY' &&
      targetSubcategoryId &&
      tagMap[targetSubcategoryId]
    ) {
      const subName = tagMap[targetSubcategoryId].name;
      const subEpNo =
        episodes.filter((e) => e.targetSubcategoryId === targetSubcategoryId)
          .length + 1;
      setTitle(`5 อันดับ ${subName} EP.${subEpNo} - จังหวะพีคคัดเน้นๆ`);
    } else {
      setTitle(buildEpisodeAutoTitle(mainCategoryTagId, selectedFacetTagIds));
    }
  };

  // Handle cross-view category pre-selection from Footage Vault or Source Mining Studio
  useEffect(() => {
    if (!builderPreselectRequest) return;
    const {
      tagId,
      recipeId,
      productionTarget: reqTarget,
      targetSubcategoryId: reqSubId,
      customFootageIds,
      customEpisodeTitle,
    } = builderPreselectRequest;

    const targetTag = tagMap[tagId];
    if (targetTag) {
      setSelectedGroupId(resolveTagGroupId(targetTag));
    }
    setMainCategoryTagId(tagId);
    const nextFacets = reqSubId && reqSubId !== tagId ? [reqSubId] : [];
    setSelectedFacetTagIds(nextFacets);
    setProductionTarget(reqTarget || 'MAIN_CATEGORY_VARIETY');
    setTargetSubcategoryId(reqSubId || null);
    setAllowCrossCategory(false);
    setActiveRecipe(recipeId);

    if (customEpisodeTitle) {
      setTitle(customEpisodeTitle);
    } else {
      setTitle(buildEpisodeAutoTitle(tagId, nextFacets));
    }

    const filterTagIds = [tagId, ...nextFacets];

    if (customFootageIds && customFootageIds.length > 0) {
      const customPicked = customFootageIds
        .map((fid) => computedFootage.find((f) => f.id === fid) || null)
        .filter((f): f is NonNullable<typeof f> => f !== null);

      const fallbackPicked = generateSmartMixByRecipe(
        computedFootage.filter((f) => !customFootageIds.includes(f.id)),
        recipeId,
        filterTagIds,
        false,
        'AND'
      );

      const combinedPicked = [...customPicked, ...fallbackPicked].slice(0, 5);
      const nextRankings: EpisodeRankingSlot[] = RANK_ORDER_1_TO_5.map(
        (rankNum, idx) => {
          const picked = combinedPicked[idx] || null;
          const defaults = extractDefaultRankFields(picked);
          return {
            rank: rankNum,
            footageId: picked ? picked.id : null,
            rankTitle: defaults.rankTitle,
            punchlineNote: defaults.punchlineNote,
            mascotScript: picked
              ? `อันดับที่ ${rankNum}: ${picked.mascotNotes || picked.title}`
              : '',
            snapshotNote: picked
              ? customFootageIds.includes(picked.id)
                ? 'คัดตรงจากสตูดิโอหั่นไลฟ์สด (1:N)'
                : picked.cooldownStatus === 'NEW_UNTOUCHED'
                ? 'ฟุตใหม่แกะกล่อง'
                : `วนใช้หลังพัก ${picked.daysSinceLastUsed ?? 0} วัน`
              : '',
          };
        }
      );
      setRankings(nextRankings);
      setActiveBuilderStep(2);
      setPreselectNotice(
        `ส่งช็อตที่เลือกจากไลฟ์สด (${customPicked.length} ฟุต) เข้าช่องจัด 5 อันดับเรียบร้อยแล้ว!`
      );
      clearBuilderPreselectRequest();
      return;
    }

    const autoPicked = generateSmartMixByRecipe(
      computedFootage,
      recipeId,
      filterTagIds,
      false,
      'AND'
    );
    const nextRankings: EpisodeRankingSlot[] = RANK_ORDER_1_TO_5.map(
      (rankNum, idx) => {
        const picked = autoPicked[idx] || null;
        const defaults = extractDefaultRankFields(picked);
        return {
          rank: rankNum,
          footageId: picked ? picked.id : null,
          rankTitle: defaults.rankTitle,
          punchlineNote: defaults.punchlineNote,
          mascotScript: picked
            ? `อันดับที่ ${rankNum}: ${picked.mascotNotes || picked.title}`
            : '',
          snapshotNote: picked
            ? picked.cooldownStatus === 'NEW_UNTOUCHED'
              ? 'ฟุตใหม่แกะกล่อง'
              : `วนใช้หลังพัก ${picked.daysSinceLastUsed ?? 0} วัน`
            : '',
        };
      }
    );
    setRankings(nextRankings);
    setActiveBuilderStep(2);
    setPreselectNotice(
      `ดึงวัตถุดิบหมวด #${targetTag?.name || tagId} มาจัดเรียงช่องอันดับ 1–5 ครบ ${
        autoPicked.length
      }/5 อันดับอัตโนมัติแล้ว!`
    );
    clearBuilderPreselectRequest();
  }, [
    builderPreselectRequest,
    tagMap,
    computedFootage,
    clearBuilderPreselectRequest,
    resolveTagGroupId,
    buildEpisodeAutoTitle,
  ]);

  useEffect(() => {
    setPickerPage(1);
  }, [
    selectedGroupId,
    mainCategoryTagId,
    selectedFacetTagIds,
    scopeMatchMode,
    allowCrossCategory,
    poolFilterGroupId,
    poolSubcategoryFilterId,
    poolQuickFilter,
    pickerSearch,
    pickerSortBy,
  ]);

  const previewMasterFileName = generateMasterEpisodeFileName(
    nextEpisodeId,
    publishDate || getReferenceTodayDate(),
    publishSlot,
    title
  );

  const footageToEpisodeIndex = useMemo(
    () => buildFootageToEpisodeIndex(episodes),
    [episodes]
  );

  const validationReport = useMemo(
    () =>
      analyzeEpisodeCollisions(
        rankings,
        computedFootageMap,
        episodes,
        null,
        footageToEpisodeIndex
      ),
    [rankings, computedFootageMap, episodes, footageToEpisodeIndex]
  );

  const assignFootageToRank = (targetRank: RankNumber, footageId: string) => {
    const ft = computedFootageMap[footageId];
    const defaults = extractDefaultRankFields(ft);
    const snapText =
      ft?.cooldownStatus === 'NEW_UNTOUCHED'
        ? 'ฟุตใหม่แกะกล่อง (NEW)'
        : `นำฟุตเก่าพัก ${ft?.daysSinceLastUsed ?? 0} วันมาวนใช้`;

    setRankings((prev) =>
      prev.map((slot) => {
        if (slot.footageId === footageId && slot.rank !== targetRank) {
          return {
            ...slot,
            footageId: null,
            rankTitle: '',
            punchlineNote: '',
            mascotScript: '',
            snapshotNote: '',
          };
        }
        if (slot.rank !== targetRank) return slot;
        return {
          ...slot,
          footageId,
          rankTitle: defaults.rankTitle,
          punchlineNote: defaults.punchlineNote,
          mascotScript: ft?.mascotNotes
            ? `อันดับที่ ${slot.rank}: ${ft.mascotNotes}`
            : `มาต่อกันที่อันดับ ${slot.rank} ช็อตนี้บอกเลยว่าพีคจัด!`,
          snapshotNote: snapText,
        };
      })
    );

    const nextEmpty = rankings.find(
      (s) => s.rank !== targetRank && s.footageId === null
    );
    if (nextEmpty) {
      setActiveSlotRank(nextEmpty.rank);
    } else if (targetRank < 5) {
      setActiveSlotRank((targetRank + 1) as RankNumber);
    }
  };

  const swapRankSlots = (fromRank: RankNumber, toRank: RankNumber) => {
    if (fromRank === toRank) return;
    setRankings((prev) => {
      const fromSlot = prev.find((s) => s.rank === fromRank);
      const toSlot = prev.find((s) => s.rank === toRank);
      if (!fromSlot || !toSlot) return prev;

      return prev.map((s) => {
        if (s.rank === fromRank) {
          return {
            ...s,
            footageId: toSlot.footageId,
            rankTitle: toSlot.rankTitle,
            punchlineNote: toSlot.punchlineNote,
            isCustomOverride: toSlot.isCustomOverride,
            mascotScript: toSlot.mascotScript,
            snapshotNote: toSlot.snapshotNote,
          };
        }
        if (s.rank === toRank) {
          return {
            ...s,
            footageId: fromSlot.footageId,
            rankTitle: fromSlot.rankTitle,
            punchlineNote: fromSlot.punchlineNote,
            isCustomOverride: fromSlot.isCustomOverride,
            mascotScript: fromSlot.mascotScript,
            snapshotNote: fromSlot.snapshotNote,
          };
        }
        return s;
      });
    });
  };

  const handleDropItemOnSlot = (
    targetRank: RankNumber,
    payload: SlotDropPayload
  ) => {
    if (payload.type === 'SLOT') {
      swapRankSlots(payload.fromRank, targetRank);
    } else if (payload.type === 'FOOTAGE') {
      assignFootageToRank(targetRank, payload.footageId);
    }
  };

  const handleMoveSlotByIndex = (index: number, direction: 'UP' | 'DOWN') => {
    const targetIndex = direction === 'UP' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= rankings.length) return;
    swapRankSlots(rankings[index].rank, rankings[targetIndex].rank);
  };

  const clearSlotByRank = (rank: RankNumber) => {
    setRankings((prev) =>
      prev.map((s) =>
        s.rank === rank
          ? {
              ...s,
              footageId: null,
              rankTitle: '',
              punchlineNote: '',
              isCustomOverride: false,
              mascotScript: '',
              snapshotNote: '',
            }
          : s
      )
    );
  };

  const clearAllSlots = () => {
    setRankings(DEFAULT_RANKINGS_1_TO_5);
  };

  const updateSlotScript = (rank: RankNumber, script: string) => {
    setRankings((prev) =>
      prev.map((s) => (s.rank === rank ? { ...s, mascotScript: script } : s))
    );
  };

  const updateSlotRankFields = (
    rank: RankNumber,
    field: 'rankTitle' | 'punchlineNote' | 'mascotScript' | 'isCustomOverride',
    value: string | boolean
  ) => {
    setRankings((prev) =>
      prev.map((s) => {
        if (s.rank !== rank) return s;
        const ft = s.footageId ? computedFootageMap[s.footageId] : null;
        const defaults = extractDefaultRankFields(ft);

        if (field === 'isCustomOverride') {
          const nextCustom = Boolean(value);
          return {
            ...s,
            isCustomOverride: nextCustom,
            rankTitle: nextCustom
              ? s.rankTitle || defaults.rankTitle
              : defaults.rankTitle,
            punchlineNote: nextCustom
              ? s.punchlineNote ?? defaults.punchlineNote
              : defaults.punchlineNote,
          };
        }

        return { ...s, [field]: String(value) };
      })
    );
  };

  const footageToAssignedRankMap = useMemo(() => {
    const map: Record<string, RankNumber> = {};
    for (const slot of rankings) {
      if (slot.footageId) {
        map[slot.footageId] = slot.rank;
      }
    }
    return map;
  }, [rankings]);

  // Filtered & Sorted candidate footages in right-hand pool based on 3-Tier Scope
  const pickerCandidates = useMemo(() => {
    const selectedSet = new Set(selectedFootageIds);
    const basePool = allowCrossCategory ? computedFootage : scopedFootages;

    const filtered = basePool.filter((ft) => {
      if (allowCrossCategory && poolFilterGroupId !== 'ALL') {
        const belongsToSelectedPoolGroup = ft.tags.some((tid) => {
          const t = tagMap[tid];
          return t && resolveTagGroupId(t) === poolFilterGroupId;
        });
        if (!belongsToSelectedPoolGroup) return false;
      }

      if (poolSubcategoryFilterId) {
        if (!ft.tags.includes(poolSubcategoryFilterId)) return false;
      }

      if (poolQuickFilter === 'AVAILABLE_USABLE') {
        const isUsable =
          ft.cooldownStatus === 'NEW_UNTOUCHED' ||
          ft.cooldownStatus === 'READY_FRESH';
        if (!isUsable || selectedSet.has(ft.id)) return false;
      } else if (poolQuickFilter === 'ONLY_NEW') {
        if (ft.cooldownStatus !== 'NEW_UNTOUCHED' || selectedSet.has(ft.id)) {
          return false;
        }
      } else if (poolQuickFilter === 'ONLY_FRESH') {
        if (ft.cooldownStatus !== 'READY_FRESH' || selectedSet.has(ft.id)) {
          return false;
        }
      }

      if (pickerSearch.trim() !== '') {
        const q = pickerSearch.toLowerCase();
        if (
          !ft.id.toLowerCase().includes(q) &&
          !ft.title.toLowerCase().includes(q) &&
          !ft.mascotNotes.toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      return true;
    });

    return [...filtered].sort((a, b) => {
      if (pickerSortBy === 'REST_DAYS_DESC') {
        const daysA =
          a.daysSinceLastUsed === null ? 9999 : a.daysSinceLastUsed;
        const daysB =
          b.daysSinceLastUsed === null ? 9999 : b.daysSinceLastUsed;
        if (daysB !== daysA) return daysB - daysA;
        return a.usageLast90Days - b.usageLast90Days;
      }
      if (a.usageLast90Days !== b.usageLast90Days) {
        return a.usageLast90Days - b.usageLast90Days;
      }
      return a.totalUsageCount - b.totalUsageCount;
    });
  }, [
    allowCrossCategory,
    computedFootage,
    scopedFootages,
    poolFilterGroupId,
    poolSubcategoryFilterId,
    poolQuickFilter,
    selectedFootageIds,
    pickerSearch,
    pickerSortBy,
    tagMap,
    resolveTagGroupId,
  ]);

  const paginatedPickerCandidates = useMemo(() => {
    const start = (pickerPage - 1) * pickerPageSize;
    return pickerCandidates.slice(start, start + pickerPageSize);
  }, [pickerCandidates, pickerPage, pickerPageSize]);

  const performActualSave = () => {
    if (!title.trim() || selectedFootageIds.length < 5) return;

    const effectiveSeriesTitle =
      categoryEpisodeScope === 'SUBCATEGORY' &&
      targetSubcategoryId &&
      tagMap[targetSubcategoryId]
        ? `5 อันดับ ${tagMap[targetSubcategoryId].name}`
        : `5 อันดับ ${tagMap[mainCategoryTagId]?.name || ''}`;

    const effectiveSeriesId =
      categoryEpisodeScope === 'SUBCATEGORY' && targetSubcategoryId
        ? targetSubcategoryId
        : mainCategoryTagId;

    const resolvedRankings: EpisodeRankingSlot[] = rankings.map((slot) => {
      const ft = slot.footageId ? computedFootageMap[slot.footageId] : null;
      const defaults = extractDefaultRankFields(ft);
      const isCustom = Boolean(slot.isCustomOverride);
      return {
        ...slot,
        isCustomOverride: isCustom,
        rankTitle: isCustom ? slot.rankTitle : defaults.rankTitle,
        punchlineNote: isCustom ? slot.punchlineNote : defaults.punchlineNote,
      };
    });

    const created = saveEpisode({
      title: title.trim(),
      categoryGroupId: selectedGroupId,
      mainCategoryTagId,
      categoryEpisodeNo: nextCategoryEpisodeNo,
      categoryEpisodeScope,
      seriesId: effectiveSeriesId,
      seriesTitle: effectiveSeriesTitle,
      productionTarget,
      targetSubcategoryId:
        productionTarget === 'SINGLE_SUBCATEGORY_SPECIAL'
          ? targetSubcategoryId
          : null,
      publishDate,
      publishSlot,
      workflowStage,
      introMascotScript,
      outroMascotScript,
      rankings: resolvedRankings,
      masterVideoInfo: {
        masterFileName: previewMasterFileName,
        masterDriveUrl:
          masterDriveUrl.trim() ||
          `https://drive.google.com/file/d/MASTER-${nextEpisodeId}/view`,
        youtubeUrl: youtubeUrl.trim(),
        facebookUrl: facebookUrl.trim(),
        tiktokUrl: tiktokUrl.trim(),
        instagramUrl: instagramUrl.trim(),
        viewsCount: 0,
        performanceNote: 'สร้างจากหน้า Episode Builder พร้อมไฟล์รวม 5 ฟุต',
      },
    });

    setNewlyCreatedEpisode(created);
    setSavedBannerMessage(
      `บันทึกคลิป 5 อันดับ ${created.id} (EP.${
        created.categoryEpisodeNo || nextCategoryEpisodeNo
      } · ${created.title}) เข้าสู่คลังเรียบร้อยแล้ว!`
    );
    setPreselectNotice(null);
    setMasterDriveUrl('');
    setYoutubeUrl('');
    setFacebookUrl('');
    setTiktokUrl('');
    setInstagramUrl('');
    setDuplicateConfirmModalOpen(false);
  };

  const handleContinueNextEpisodeInCategory = () => {
    setNewlyCreatedEpisode(null);
    clearAllSlots();
    setTitle(buildEpisodeAutoTitle(mainCategoryTagId, selectedFacetTagIds));
    setActiveBuilderStep(2);
    applyRecipeForCategory(mainCategoryTagId, activeRecipe);
  };

  const handleSaveEpisode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || selectedFootageIds.length < 5) return;

    if (
      validationReport.topSimilarityMatch &&
      validationReport.topSimilarityMatch.similarityPercentage === 100
    ) {
      setDuplicateConfirmModalOpen(true);
      return;
    }

    performActualSave();
  };

  return {
    categoryGroups,
    categoryGroupMap,
    tagMap,
    computedFootage,
    computedFootageMap,
    settings,
    setActiveTab,
    setIsStatusRuleModalOpen,
    setIsThreeTierManagerOpen,

    nextEpisodeId,
    activeBuilderStep,
    setActiveBuilderStep,
    preselectNotice,
    setPreselectNotice,
    savedBannerMessage,

    // Step 1: 3-Tier Independent Scope & Actions
    tagStockMap,
    tier1Groups,
    tier2Groups,
    tier3Groups,
    selectedFacetTagIds,
    scopeMatchMode,
    setScopeMatchMode,
    step1SearchQuery,
    setStep1SearchQuery,
    tagClickMode,
    setTagClickMode,
    activeScopeTagIds,
    handleToggleFacetTag,
    handleClearFacetTags,

    groupStockStats,
    selectedGroupId,
    activeGroup,
    categoriesInSelectedGroup,
    sortedCategories,
    mainCategoryTagId,
    productionTarget,
    targetSubcategoryId,
    activeSubcategory,
    currentSubcategories,
    activeCategoryStat,
    liveCategoryStock,
    handleSelectGroup,
    handleSelectCategory,
    handleSelectVarietyMode,
    handleSelectSoloMode,
    handleSelectSubcategory,

    activeRecipe,
    selectedFootageObjects,
    applyRecipeForCategory,

    duplicateSubcategories,
    validationReport,
    duplicateConfirmModalOpen,
    setDuplicateConfirmModalOpen,

    rankings,
    selectedFootageIds,
    activeSlotRank,
    setActiveSlotRank,
    assignFootageToRank,
    handleDropItemOnSlot,
    handleMoveSlotByIndex,
    clearSlotByRank,
    clearAllSlots,
    updateSlotScript,
    updateSlotRankFields,
    footageToAssignedRankMap,
    allowCrossCategory,
    setAllowCrossCategory,
    poolFilterGroupId,
    setPoolFilterGroupId,
    poolSubcategoryFilterId,
    setPoolSubcategoryFilterId,
    poolQuickFilter,
    setPoolQuickFilter,
    pickerSearch,
    setPickerSearch,
    pickerSortBy,
    setPickerSortBy,
    pickerPage,
    setPickerPage,
    pickerPageSize,
    setPickerPageSize,
    pickerCandidates,
    paginatedPickerCandidates,

    title,
    setTitle,
    publishDate,
    setPublishDate,
    publishSlot,
    setPublishSlot,
    isOptionalMasterOpen,
    setIsOptionalMasterOpen,
    masterDriveUrl,
    setMasterDriveUrl,
    youtubeUrl,
    setYoutubeUrl,
    facebookUrl,
    setFacebookUrl,
    tiktokUrl,
    setTiktokUrl,
    instagramUrl,
    setInstagramUrl,
    introMascotScript,
    setIntroMascotScript,
    outroMascotScript,
    setOutroMascotScript,
    previewMasterFileName,
    handleSaveEpisode,
    performActualSave,

    categoryEpisodeNo: nextCategoryEpisodeNo,
    existingCategoryEpisodesCount: categoryEpisodeCount,
    categoryEpisodeScope,
    setCategoryEpisodeScope,
    handleToggleEpisodeScope,
    newlyCreatedEpisode,
    setNewlyCreatedEpisode,
    handleContinueNextEpisodeInCategory,
  };
}
