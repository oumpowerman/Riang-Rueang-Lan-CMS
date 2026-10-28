import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useCMS } from '../../../context/CMSContext';
import { isStagingGroupId, isStagingTagId } from '../../../services/seedData';
import {
  EpisodeProductionTarget,
  EpisodeRankingSlot,
  EpisodeWorkflowStage,
  PublishSlot,
} from '../../../types/episode.types';
import { CategoryTag } from '../../../types/tag.types';
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
import {
  BuilderStepNumber,
  DEFAULT_RANKINGS_1_TO_5,
  DuplicateSubcategoryWarning,
  GroupStockStat,
  LiveCategoryStock,
  PickerSortBy,
  PoolQuickFilter,
  RANK_ORDER_1_TO_5,
  RankNumber,
  SlotDropPayload,
} from './builder.types';

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

  // Helper to resolve Tier 0 Group ID for any Tier 1 or Tier 2 tag
  const resolveTagGroupId = useCallback(
    (tag: CategoryTag | undefined | null): string => {
      if (!tag) return categoryGroups[0]?.id || 'GRP-PERSON';
      if (tag.groupId && categoryGroupMap[tag.groupId]) {
        return tag.groupId;
      }
      if (tag.parentId && tagMap[tag.parentId]) {
        const parent = tagMap[tag.parentId];
        if (parent.groupId && categoryGroupMap[parent.groupId]) {
          return parent.groupId;
        }
        const fallbackParentGrp = `GRP-${parent.groupType || 'GENERAL'}`;
        if (categoryGroupMap[fallbackParentGrp]) return fallbackParentGrp;
      }
      const fallbackGrp = `GRP-${tag.groupType || 'GENERAL'}`;
      if (categoryGroupMap[fallbackGrp]) return fallbackGrp;
      return categoryGroups[0]?.id || 'GRP-PERSON';
    },
    [categoryGroups, categoryGroupMap, tagMap]
  );

  // Sort categories so those with >=5 ready clips come first (only real Tier 1 main categories, excluding Staging Area)
  const sortedCategories = useMemo(() => {
    const mainList = categoryMatrix.filter(
      (c) =>
        !isStagingTagId(c.tag.id) &&
        (c.tag.tier === 1 || (!c.tag.parentId && !c.tag.tier))
    );
    return [...mainList].sort((a, b) => {
      if (b.producibleEpisodesCount !== a.producibleEpisodesCount) {
        return b.producibleEpisodesCount - a.producibleEpisodesCount;
      }
      return b.usableCount - a.usableCount;
    });
  }, [categoryMatrix]);

  const defaultCategoryId = sortedCategories[0]?.tag.id || tags[0]?.id || 'TAG-0004';
  const defaultGroupId = useMemo(() => {
    const defTag = tagMap[defaultCategoryId];
    return resolveTagGroupId(defTag);
  }, [tagMap, defaultCategoryId, resolveTagGroupId]);

  // Step 1: 3-Tier Selection State (Tier 0 Group -> Tier 1 Main Category -> Tier 2 Subcategory)
  const [selectedGroupId, setSelectedGroupId] = useState<string>(defaultGroupId);
  const [mainCategoryTagId, setMainCategoryTagId] = useState<string>(defaultCategoryId);
  const [productionTarget, setProductionTarget] =
    useState<EpisodeProductionTarget>('MAIN_CATEGORY_VARIETY');
  const [targetSubcategoryId, setTargetSubcategoryId] = useState<string | null>(null);

  // Compute Tier 0 Group Stock Stats (excluding Staging Group)
  const groupStockStats = useMemo<GroupStockStat[]>(() => {
    return categoryGroups
      .filter((group) => !isStagingGroupId(group.id))
      .map((group) => {
        const groupMainStats = sortedCategories.filter(
          (stat) => resolveTagGroupId(stat.tag) === group.id
        );
      const groupMainIds = new Set(groupMainStats.map((s) => s.tag.id));
      const subcategoriesCount = tags.filter(
        (t) => t.tier === 2 && t.parentId && groupMainIds.has(t.parentId)
      ).length;

      // Collect unique footages across all categories in this group
      const uniqueFootageIds = new Set<string>();
      const uniqueUsableIds = new Set<string>();
      const uniqueNewIds = new Set<string>();
      const uniqueReadyIds = new Set<string>();

      groupMainStats.forEach((stat) => {
        stat.allFootages.forEach((ft) => uniqueFootageIds.add(ft.id));
        stat.usableFootages.forEach((ft) => {
          uniqueUsableIds.add(ft.id);
          if (ft.cooldownStatus === 'NEW_UNTOUCHED') uniqueNewIds.add(ft.id);
          if (ft.cooldownStatus === 'READY_FRESH') uniqueReadyIds.add(ft.id);
        });
      });

      const usableCount = uniqueUsableIds.size;
      const producibleEpisodesCount = groupMainStats.reduce(
        (sum, s) => sum + s.producibleEpisodesCount,
        0
      );

      return {
        group,
        mainCategoriesCount: groupMainStats.length,
        subcategoriesCount,
        totalCount: uniqueFootageIds.size,
        usableCount,
        newCount: uniqueNewIds.size,
        readyCount: uniqueReadyIds.size,
        producibleEpisodesCount,
      };
    });
  }, [categoryGroups, sortedCategories, tags, resolveTagGroupId]);

  // Filter Tier 1 Main Categories by currently selected Tier 0 Group
  const categoriesInSelectedGroup = useMemo(() => {
    return sortedCategories.filter(
      (stat) => resolveTagGroupId(stat.tag) === selectedGroupId
    );
  }, [sortedCategories, selectedGroupId, resolveTagGroupId]);

  // Subcategories under currently selected mainCategoryTagId (Tier 2)
  const currentSubcategories = useMemo(() => {
    return tags.filter((t) => t.parentId === mainCategoryTagId);
  }, [tags, mainCategoryTagId]);

  // Active Tier 0 Group & Active Tier 2 Subcategory objects
  const activeGroup = useMemo(
    () => categoryGroupMap[selectedGroupId] || categoryGroups[0] || null,
    [categoryGroupMap, selectedGroupId, categoryGroups]
  );

  const activeSubcategory = useMemo(
    () => (targetSubcategoryId ? tagMap[targetSubcategoryId] || null : null),
    [targetSubcategoryId, tagMap]
  );

  // Active Progressive Accordion Step (1 | 2 | 3 | 4)
  const [activeBuilderStep, setActiveBuilderStep] = useState<BuilderStepNumber>(1);

  // Step 2: Active Recipe State
  const [activeRecipe, setActiveRecipe] = useState<MixRecipeId>('FORMULA_2_NEW_3_FRESH');

  // Step 3: Rankings 1 -> 2 -> 3 -> 4 -> 5
  const [rankings, setRankings] = useState<EpisodeRankingSlot[]>(DEFAULT_RANKINGS_1_TO_5);
  const [activeSlotRank, setActiveSlotRank] = useState<RankNumber>(1);

  // Right Pool Filter & Pagination State
  const [allowCrossCategory, setAllowCrossCategory] = useState(false);
  const [poolFilterGroupId, setPoolFilterGroupId] = useState<string>('ALL');
  const [poolQuickFilter, setPoolQuickFilter] =
    useState<PoolQuickFilter>('AVAILABLE_USABLE');
  const [pickerSearch, setPickerSearch] = useState('');
  const [pickerSortBy, setPickerSortBy] = useState<PickerSortBy>('REST_DAYS_DESC');
  const [pickerPage, setPickerPage] = useState(1);
  const [pickerPageSize, setPickerPageSize] = useState(5);

  // Step 4: Auto-Generated Headline, Schedule & Collapsible Optional Master Info
  const [title, setTitle] = useState(
    `5 อันดับ ${
      tagMap[defaultCategoryId]?.name || 'ดาราฮาๆ'
    } จังหวะพีคคัดเน้นๆ #${episodes.length + 1}`
  );
  const [publishDate, setPublishDate] = useState<string>('2026-10-28');
  const [publishSlot, setPublishSlot] = useState<PublishSlot>('MORNING_0600');
  const workflowStage: EpisodeWorkflowStage = '4_PUBLISHED';
  const [isOptionalMasterOpen, setIsOptionalMasterOpen] = useState(false);
  const [masterDriveUrl, setMasterDriveUrl] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [facebookUrl, setFacebookUrl] = useState('');
  const [introMascotScript, setIntroMascotScript] = useState(
    'สวัสดีครับชาวเรียงเรื่องลั่น! วันนี้เจ้าลั่นคัด 5 อันดับช็อตฮาจังหวะโบ๊ะบ๊ะมาให้ขำกันแบบจุกๆ!'
  );
  const [outroMascotScript, setOutroMascotScript] = useState(
    'ใครชอบอันดับไหนคอมเมนต์บอกกันได้ แล้วเจอกันคลิปหน้า เวลาเดิม 06:00 น. และ 18:00 น.!'
  );

  const [preselectNotice, setPreselectNotice] = useState<string | null>(null);
  const [savedBannerMessage, setSavedBannerMessage] = useState<string | null>(null);
  const [duplicateConfirmModalOpen, setDuplicateConfirmModalOpen] = useState(false);

  // Active Category Stat
  const activeCategoryStat = useMemo(
    () => categoryMatrix.find((c) => c.tag.id === mainCategoryTagId) || null,
    [categoryMatrix, mainCategoryTagId]
  );

  const selectedFootageIds = useMemo(
    () => rankings.map((r) => r.footageId).filter((id): id is string => Boolean(id)),
    [rankings]
  );

  const selectedFootageObjects = useMemo(
    () => rankings.map((r) => (r.footageId ? computedFootageMap[r.footageId] || null : null)),
    [rankings, computedFootageMap]
  );

  // Diversity Collision Guard: Detect duplicate subcategories/topics across slots in Variety mode
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

  // Live Remaining Stock Calculation for the selected category
  const liveCategoryStock = useMemo<LiveCategoryStock>(() => {
    if (!activeCategoryStat) {
      return {
        totalNew: 0,
        usedNew: 0,
        remainingNew: 0,
        totalFresh: 0,
        usedFresh: 0,
        remainingFresh: 0,
      };
    }

    const selectedSet = new Set(selectedFootageIds);
    const catFootages = activeCategoryStat.usableFootages;
    const catNew = catFootages.filter((f) => f.cooldownStatus === 'NEW_UNTOUCHED');
    const catFresh = catFootages.filter((f) => f.cooldownStatus === 'READY_FRESH');

    const usedNew = catNew.filter((f) => selectedSet.has(f.id)).length;
    const usedFresh = catFresh.filter((f) => selectedSet.has(f.id)).length;

    return {
      totalNew: catNew.length,
      usedNew,
      remainingNew: Math.max(0, catNew.length - usedNew),
      totalFresh: catFresh.length,
      usedFresh,
      remainingFresh: Math.max(0, catFresh.length - usedFresh),
    };
  }, [activeCategoryStat, selectedFootageIds]);

  // Helper to populate rankings 1..5 using a recipe and category
  const applyRecipeForCategory = (tagId: string, recipeId: MixRecipeId) => {
    setActiveRecipe(recipeId);
    const targetTags = allowCrossCategory ? [] : [tagId];
    const autoPicked = generateSmartMixByRecipe(computedFootage, recipeId, targetTags);

    const nextRankings: EpisodeRankingSlot[] = RANK_ORDER_1_TO_5.map((rankNum, idx) => {
      const picked = autoPicked[idx] || null;
      return {
        rank: rankNum,
        footageId: picked ? picked.id : null,
        mascotScript: picked
          ? `อันดับที่ ${rankNum}: ${picked.mascotNotes || picked.title}`
          : '',
        snapshotNote: picked
          ? picked.cooldownStatus === 'NEW_UNTOUCHED'
            ? 'ฟุตใหม่แกะกล่อง'
            : `วนใช้หลังพัก ${picked.daysSinceLastUsed ?? 0} วัน`
          : '',
      };
    });

    setRankings(nextRankings);
  };

  // Handle Step 1 Tier 1 Category Selection
  const handleSelectCategory = (tagId: string, autoFillWithRecipe = false) => {
    const tagObj = tagMap[tagId];
    if (tagObj) {
      const grpId = resolveTagGroupId(tagObj);
      setSelectedGroupId(grpId);
    }
    setMainCategoryTagId(tagId);
    setProductionTarget('MAIN_CATEGORY_VARIETY');
    setTargetSubcategoryId(null);
    setAllowCrossCategory(false);
    setPickerPage(1);
    if (tagObj) {
      setTitle(
        `5 อันดับ ${tagObj.name} จังหวะพีคคัดเน้นๆ #${episodes.length + 1}`
      );
    }
    if (autoFillWithRecipe) {
      applyRecipeForCategory(tagId, activeRecipe);
    }
  };

  // Handle Step 1 Tier 0 Group Selection
  const handleSelectGroup = (groupId: string) => {
    setSelectedGroupId(groupId);
    const groupCategories = sortedCategories.filter(
      (stat) => resolveTagGroupId(stat.tag) === groupId
    );
    const isCurrentInGroup = groupCategories.some(
      (stat) => stat.tag.id === mainCategoryTagId
    );
    if (!isCurrentInGroup && groupCategories.length > 0) {
      const firstCat = groupCategories[0].tag;
      setMainCategoryTagId(firstCat.id);
      setProductionTarget('MAIN_CATEGORY_VARIETY');
      setTargetSubcategoryId(null);
      setAllowCrossCategory(false);
      setPickerPage(1);
      setTitle(
        `5 อันดับ ${firstCat.name} จังหวะพีคคัดเน้นๆ #${episodes.length + 1}`
      );
      applyRecipeForCategory(firstCat.id, activeRecipe);
    }
  };

  // Handle Tier 2 Production Target Switcher
  const handleSelectVarietyMode = () => {
    setProductionTarget('MAIN_CATEGORY_VARIETY');
    setTargetSubcategoryId(null);
    const currentMain = tagMap[mainCategoryTagId];
    if (currentMain) {
      setTitle(`5 อันดับ ${currentMain.name} จังหวะพีคคัดเน้นๆ #${episodes.length + 1}`);
    }
  };

  const handleSelectSoloMode = () => {
    setProductionTarget('SINGLE_SUBCATEGORY_SPECIAL');
    const firstSub = currentSubcategories[0];
    if (firstSub) {
      setTargetSubcategoryId(firstSub.id);
      setTitle(`5 อันดับ ${firstSub.name} ช็อตเด็ดโดนใจ #${episodes.length + 1}`);
    }
  };

  const handleSelectSubcategory = (subId: string, subName: string) => {
    setTargetSubcategoryId(subId);
    setTitle(`5 อันดับ ${subName} ช็อตเด็ดโดนใจ #${episodes.length + 1}`);
    setPickerPage(1);
  };

  // Handle cross-view category pre-selection from E2E Pipeline or Footage Library
  useEffect(() => {
    if (!builderPreselectRequest) return;
    const {
      tagId,
      recipeId,
      productionTarget: reqTarget,
      targetSubcategoryId: reqSubId,
    } = builderPreselectRequest;
    const targetTag = tagMap[tagId];
    if (targetTag) {
      setSelectedGroupId(resolveTagGroupId(targetTag));
    }
    setMainCategoryTagId(tagId);
    setProductionTarget(reqTarget || 'MAIN_CATEGORY_VARIETY');
    setTargetSubcategoryId(reqSubId || null);
    setAllowCrossCategory(false);
    setActiveRecipe(recipeId);
    if (reqTarget === 'SINGLE_SUBCATEGORY_SPECIAL' && reqSubId && tagMap[reqSubId]) {
      setTitle(
        `5 อันดับ ${tagMap[reqSubId].name} ช็อตเด็ดโดนใจ #${episodes.length + 1}`
      );
    } else if (targetTag) {
      setTitle(
        `5 อันดับ ${targetTag.name} จังหวะพีคคัดเน้นๆ #${episodes.length + 1}`
      );
    }

    const filterTagId =
      reqTarget === 'SINGLE_SUBCATEGORY_SPECIAL' && reqSubId ? reqSubId : tagId;
    const autoPicked = generateSmartMixByRecipe(computedFootage, recipeId, [filterTagId]);
    const nextRankings: EpisodeRankingSlot[] = RANK_ORDER_1_TO_5.map((rankNum, idx) => {
      const picked = autoPicked[idx] || null;
      return {
        rank: rankNum,
        footageId: picked ? picked.id : null,
        mascotScript: picked
          ? `อันดับที่ ${rankNum}: ${picked.mascotNotes || picked.title}`
          : '',
        snapshotNote: picked
          ? picked.cooldownStatus === 'NEW_UNTOUCHED'
            ? 'ฟุตใหม่แกะกล่อง'
            : `วนใช้หลังพัก ${picked.daysSinceLastUsed ?? 0} วัน`
          : '',
      };
    });
    setRankings(nextRankings);
    setActiveBuilderStep(3);
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
    episodes.length,
    clearBuilderPreselectRequest,
    resolveTagGroupId,
  ]);

  useEffect(() => {
    setPickerPage(1);
  }, [
    selectedGroupId,
    mainCategoryTagId,
    allowCrossCategory,
    poolFilterGroupId,
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

  // High-performance O(1) Inverted Index for fast scaling
  const footageToEpisodeIndex = useMemo(
    () => buildFootageToEpisodeIndex(episodes),
    [episodes]
  );

  // Real-time Collision, Cooldown & Episode Similarity Validation Report
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

  // Assign a footage directly to a specific rank (1, 2, 3, 4, or 5)
  const assignFootageToRank = (targetRank: RankNumber, footageId: string) => {
    const ft = computedFootageMap[footageId];
    const snapText =
      ft?.cooldownStatus === 'NEW_UNTOUCHED'
        ? 'ฟุตใหม่แกะกล่อง (NEW)'
        : `นำฟุตเก่าพัก ${ft?.daysSinceLastUsed ?? 0} วันมาวนใช้`;

    setRankings((prev) =>
      prev.map((slot) => {
        if (slot.footageId === footageId && slot.rank !== targetRank) {
          return { ...slot, footageId: null, mascotScript: '', snapshotNote: '' };
        }
        if (slot.rank !== targetRank) return slot;
        return {
          ...slot,
          footageId,
          mascotScript:
            ft?.mascotNotes
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

  // Swap two rank slots (via Drag & Drop or Up/Down arrows)
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
            mascotScript: toSlot.mascotScript,
            snapshotNote: toSlot.snapshotNote,
          };
        }
        if (s.rank === toRank) {
          return {
            ...s,
            footageId: fromSlot.footageId,
            mascotScript: fromSlot.mascotScript,
            snapshotNote: fromSlot.snapshotNote,
          };
        }
        return s;
      });
    });
  };

  const handleDropItemOnSlot = (targetRank: RankNumber, payload: SlotDropPayload) => {
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
          ? { ...s, footageId: null, mascotScript: '', snapshotNote: '' }
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

  // Map footageId -> rank number (1..5) if currently selected
  const footageToAssignedRankMap = useMemo(() => {
    const map: Record<string, RankNumber> = {};
    for (const slot of rankings) {
      if (slot.footageId) {
        map[slot.footageId] = slot.rank;
      }
    }
    return map;
  }, [rankings]);

  // Filtered & Sorted candidate footages in right-hand pool
  const pickerCandidates = useMemo(() => {
    const selectedSet = new Set(selectedFootageIds);

    const filtered = computedFootage.filter((ft) => {
      if (!allowCrossCategory) {
        if (productionTarget === 'SINGLE_SUBCATEGORY_SPECIAL' && targetSubcategoryId) {
          if (!ft.tags.includes(targetSubcategoryId)) {
            return false;
          }
        } else {
          const childIds = currentSubcategories.map((c) => c.id);
          const inMainOrChild =
            ft.tags.includes(mainCategoryTagId) ||
            ft.tags.some((tid) => childIds.includes(tid));
          if (!inMainOrChild) return false;
        }
      } else if (poolFilterGroupId !== 'ALL') {
        // When cross-category is enabled and user filters by Tier 0 CategoryGroup
        const belongsToSelectedPoolGroup = ft.tags.some((tid) => {
          const t = tagMap[tid];
          return t && resolveTagGroupId(t) === poolFilterGroupId;
        });
        if (!belongsToSelectedPoolGroup) return false;
      }

      if (poolQuickFilter === 'AVAILABLE_USABLE') {
        const isUsable =
          ft.cooldownStatus === 'NEW_UNTOUCHED' || ft.cooldownStatus === 'READY_FRESH';
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
        const daysA = a.daysSinceLastUsed === null ? 9999 : a.daysSinceLastUsed;
        const daysB = b.daysSinceLastUsed === null ? 9999 : b.daysSinceLastUsed;
        if (daysB !== daysA) return daysB - daysA;
        return a.usageLast90Days - b.usageLast90Days;
      }
      if (a.usageLast90Days !== b.usageLast90Days) {
        return a.usageLast90Days - b.usageLast90Days;
      }
      return a.totalUsageCount - b.totalUsageCount;
    });
  }, [
    computedFootage,
    allowCrossCategory,
    poolFilterGroupId,
    productionTarget,
    targetSubcategoryId,
    currentSubcategories,
    mainCategoryTagId,
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

    const created = saveEpisode({
      title: title.trim(),
      categoryGroupId: selectedGroupId,
      mainCategoryTagId,
      productionTarget,
      targetSubcategoryId:
        productionTarget === 'SINGLE_SUBCATEGORY_SPECIAL' ? targetSubcategoryId : null,
      publishDate,
      publishSlot,
      workflowStage,
      introMascotScript,
      outroMascotScript,
      rankings,
      masterVideoInfo: {
        masterFileName: previewMasterFileName,
        masterDriveUrl:
          masterDriveUrl.trim() ||
          `https://drive.google.com/file/d/MASTER-${nextEpisodeId}/view`,
        youtubeUrl: youtubeUrl.trim(),
        facebookUrl: facebookUrl.trim(),
        viewsCount: 0,
        performanceNote: 'สร้างจากหน้า Episode Builder พร้อมไฟล์รวม 5 ฟุต',
      },
    });

    setSavedBannerMessage(
      `บันทึกคลิปหลัก ${created.id} (${created.masterVideoInfo.masterFileName}) เข้าสู่คลัง Master Episode Archive เรียบร้อยแล้ว!`
    );
    setPreselectNotice(null);
    setRankings(DEFAULT_RANKINGS_1_TO_5);
    setActiveBuilderStep(1);
    setMasterDriveUrl('');
    setYoutubeUrl('');
    setFacebookUrl('');
    setDuplicateConfirmModalOpen(false);
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
    // Context & Shared Data
    categoryGroups,
    categoryGroupMap,
    tagMap,
    computedFootage,
    computedFootageMap,
    settings,
    setActiveTab,
    setIsStatusRuleModalOpen,
    setIsThreeTierManagerOpen,

    // Identifiers & Notices
    nextEpisodeId,
    activeBuilderStep,
    setActiveBuilderStep,
    preselectNotice,
    setPreselectNotice,
    savedBannerMessage,

    // Step 1: 3-Tier State & Actions
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

    // Step 2 State & Actions
    activeRecipe,
    selectedFootageObjects,
    applyRecipeForCategory,

    // Collision & Diversity Validation
    duplicateSubcategories,
    validationReport,
    duplicateConfirmModalOpen,
    setDuplicateConfirmModalOpen,

    // Step 3 Rankings & Pool State/Actions
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
    footageToAssignedRankMap,
    allowCrossCategory,
    setAllowCrossCategory,
    poolFilterGroupId,
    setPoolFilterGroupId,
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

    // Step 4 Metadata Form State & Actions
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
    introMascotScript,
    setIntroMascotScript,
    outroMascotScript,
    setOutroMascotScript,
    previewMasterFileName,
    handleSaveEpisode,
    performActualSave,
  };
}
