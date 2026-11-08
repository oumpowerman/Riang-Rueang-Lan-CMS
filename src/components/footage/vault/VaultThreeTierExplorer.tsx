import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, FolderOpen, Rocket, RotateCcw } from 'lucide-react';
import { isStagingGroupId, isStagingTagId } from '../../../services/seedData';
import { ComputedFootage } from '../../../types/footage.types';
import { MixRecipeId } from '../../../utils/collisionDetector';
import { CategoryGroupIcon } from '../../ui/CategoryGroupIcon';
import { TagPill } from '../../ui/TagPill';
import {
  CategoryGroupOverviewItem,
  MainCategoryOverviewItem,
} from './vault.types';

export interface VaultThreeTierExplorerProps {
  isExpanded: boolean;
  onToggleExpand: () => void;
  categoryGroupsOverview: CategoryGroupOverviewItem[];
  mainCategoriesCount: number;
  selectedGroupId: string | null;
  selectedTagFilter: string[];
  activeGroupOverview: CategoryGroupOverviewItem | null;
  activeMainCategory: MainCategoryOverviewItem | null;
  hasHierarchySelection: boolean;
  computedFootage: ComputedFootage[];
  activeDragFootageIds: string[];
  onQuickAssignCategory: (footageIds: string[], targetTagId: string) => void;
  onSelectGroup: (groupId: string) => void;
  onSelectMainCategory: (mainTagId: string) => void;
  onSelectSubcategory: (subTagId: string, mainTagId: string) => void;
  onClearMainCategoryFilter: () => void;
  onSelectAllInMainCategory: (mainTagId: string) => void;
  onClearHierarchySelection: () => void;
  onOpenThreeTierManager: () => void;
  onLaunchEpisodeBuilder: (categoryId: string, formula: MixRecipeId) => void;
}

export const VaultThreeTierExplorer: React.FC<VaultThreeTierExplorerProps> = ({
  isExpanded,
  onToggleExpand,
  categoryGroupsOverview,
  mainCategoriesCount,
  selectedGroupId,
  selectedTagFilter,
  activeGroupOverview,
  activeMainCategory,
  hasHierarchySelection,
  computedFootage,
  activeDragFootageIds,
  onQuickAssignCategory,
  onSelectGroup,
  onSelectMainCategory,
  onSelectSubcategory,
  onClearMainCategoryFilter,
  onSelectAllInMainCategory,
  onClearHierarchySelection,
  onOpenThreeTierManager,
  onLaunchEpisodeBuilder,
}) => {
  const [dragOverTagId, setDragOverTagId] = useState<string | null>(null);
  const isDragging = activeDragFootageIds.length > 0;

  const extractDraggedFootageIds = (e: React.DragEvent): string[] => {
    try {
      const raw = e.dataTransfer.getData('application/x-footage-ids');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // Fallback to activeDragFootageIds
    }
    return activeDragFootageIds;
  };

  const handleDragOverTag = (e: React.DragEvent, tagId: string) => {
    if (isStagingTagId(tagId)) return;
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverTagId !== tagId) {
      setDragOverTagId(tagId);
    }
  };

  const handleDragLeaveTag = (e: React.DragEvent, tagId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (dragOverTagId === tagId) {
      setDragOverTagId(null);
    }
  };

  const handleDropOnTag = (e: React.DragEvent, targetTagId: string) => {
    if (isStagingTagId(targetTagId)) return;
    e.preventDefault();
    e.stopPropagation();
    setDragOverTagId(null);
    const ids = extractDraggedFootageIds(e);
    if (ids.length > 0) {
      onQuickAssignCategory(ids, targetTagId);
    }
  };

  return (
    <div className="bg-[#faf8f5] border border-[#e5ded4] rounded-2xl shadow-2xs overflow-hidden">
      {/* Compact Explorer Header */}
      <div
        onClick={onToggleExpand}
        className="px-4 py-3 bg-[#faf7f2] hover:bg-[#f3ece0] transition-colors cursor-pointer flex flex-wrap items-center justify-between gap-2"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-[#eedbc0] text-[#523715] border border-[#dfc6a3] flex items-center justify-center shrink-0">
            <FolderOpen className="w-3.5 h-3.5 text-[#6e491c]" />
          </div>
          <span className="text-sm font-extrabold text-[#3d3326]">
            สำรวจมิติกลุ่มแท็ก (Multi-Dimensional Explorer)
          </span>
          <span className="text-xs font-mono text-[#786b5c] tabular-nums">
            {categoryGroupsOverview.length} มิติ · {mainCategoriesCount} แท็กหลัก
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {hasHierarchySelection && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClearHierarchySelection();
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-[#35593c] bg-[#eef6f0] border border-[#cbe3cf] rounded-lg hover:bg-[#dfefe3] cursor-pointer transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>ล้างตัวกรอง</span>
            </button>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand();
            }}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <span>{isExpanded ? 'ซ่อน' : 'กางดู'}</span>
            <motion.span
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="inline-flex"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </motion.span>
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t border-[#e5ded4] p-4 space-y-3.5 bg-[#faf8f5]">
              {/* STAGE 1: Category Groups / Dimensions */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#3e3427] flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-[#eedbc0] text-[#523715] text-[10px] font-mono font-bold flex items-center justify-center">
                      1
                    </span>
                    <span>มิติกลุ่มแท็ก (Dimensions)</span>
                  </span>
                </div>

                {categoryGroupsOverview.length === 0 ? (
                  <div className="p-4 bg-white rounded-xl border border-dashed border-[#dfd7ca] text-center space-y-2">
                    <p className="text-xs text-[#7d7162]">ยังไม่มีมิติกลุ่มแท็ก</p>
                    <button
                      type="button"
                      onClick={onOpenThreeTierManager}
                      className="px-3 py-1.5 bg-[#78593a] text-white text-xs font-bold rounded-lg hover:bg-[#62462a] cursor-pointer transition-colors"
                    >
                      + จัดการมิติกลุ่มแท็ก
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
                    {categoryGroupsOverview.map((groupItem) => {
                      const isGroupSelected = selectedGroupId === groupItem.group.id;
                      const isStagingGrp = isStagingGroupId(groupItem.group.id);

                      return (
                        <motion.button
                          key={groupItem.group.id}
                          type="button"
                          whileHover={{ y: -1.5 }}
                          whileTap={{ scale: 0.98 }}
                          transition={{ type: 'spring', stiffness: 420, damping: 28 }}
                          onClick={() => onSelectGroup(groupItem.group.id)}
                          onDragEnter={() => {
                            if (
                              isDragging &&
                              !isStagingGrp &&
                              selectedGroupId !== groupItem.group.id
                            ) {
                              onSelectGroup(groupItem.group.id);
                            }
                          }}
                          className={`relative text-left p-3 rounded-xl border transition-colors cursor-pointer flex flex-col justify-between gap-2 overflow-hidden ${
                            isGroupSelected
                              ? 'bg-[#f0e4d2] text-[#3d2912] border-[#dcbe93] shadow-2xs font-semibold ring-1 ring-[#e5cdab]'
                              : isStagingGrp
                              ? 'bg-[#fef8ed] hover:bg-[#faedd8] border-[#ebd6b2] text-[#63421b]'
                              : 'bg-white hover:bg-[#faf7f2] border-[#e8e2d8] text-[#4d4133]'
                          }`}
                        >
                          <div className="relative z-10 flex items-center justify-between gap-1.5">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <CategoryGroupIcon
                                icon={groupItem.group.icon}
                                className={`w-3.5 h-3.5 shrink-0 ${
                                  isGroupSelected
                                    ? 'text-[#6e491c]'
                                    : isStagingGrp
                                    ? 'text-[#a16828]'
                                    : 'text-[#6e491c]'
                                }`}
                              />
                              <span className="text-xs font-bold truncate">
                                {isStagingGrp ? 'ไม่มีหมวดหมู่' : groupItem.group.name}
                              </span>
                            </div>
                            {!isStagingGrp && (
                              <span
                                className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded shrink-0 tabular-nums ${
                                  isGroupSelected
                                    ? 'bg-[#dfc5a0] text-[#3d2912]'
                                    : 'bg-[#eee7dc] text-[#695d4f]'
                                }`}
                              >
                                {groupItem.mainCatCount}
                              </span>
                            )}
                          </div>

                          <div
                            className={`relative z-10 flex items-baseline justify-between pt-1.5 border-t text-[11px] font-mono tabular-nums ${
                              isGroupSelected
                                ? 'border-[#dfc8a7] text-[#614524]'
                                : 'border-[#eee8de] text-[#786b5c]'
                            }`}
                          >
                            <span>{groupItem.totalCount} คลิป</span>
                            {!isStagingGrp && (
                              <span
                                className={`font-bold ${
                                  isGroupSelected
                                    ? 'text-[#1e502a]'
                                    : groupItem.usableCount > 0
                                    ? 'text-[#285734]'
                                    : 'text-[#9c9182]'
                                }`}
                              >
                                พร้อม {groupItem.usableCount}
                              </span>
                            )}
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* STAGE 2: Main Categories under Selected Group */}
              <AnimatePresence initial={false}>
                {activeGroupOverview && !isStagingGroupId(activeGroupOverview.group.id) && (
                  <motion.div
                    key="vault-tier2-main-cats"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="p-3 rounded-xl bg-[#faf7f2] border border-[#e8dfd3] space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-bold text-[#3e3427] flex items-center gap-1.5">
                          <span className="w-4 h-4 rounded-full bg-[#dce9f4] text-[#1b3d5b] text-[10px] font-mono font-bold flex items-center justify-center">
                            2
                          </span>
                          <span>ป้ายแท็กหลักในมิติ: {activeGroupOverview.group.name}</span>
                        </span>

                        {activeMainCategory && (
                          <button
                            type="button"
                            onClick={onClearMainCategoryFilter}
                            className="text-[11px] font-semibold text-[#24496b] hover:text-[#14324d] cursor-pointer"
                          >
                            ดูทั้งมิติ ({activeGroupOverview.totalCount})
                          </button>
                        )}
                      </div>

                      {activeGroupOverview.mainCategories.length === 0 ? (
                        <div className="p-3 text-center text-xs text-[#7d7162] bg-white rounded-lg border border-dashed border-[#dfd7ca]">
                          ยังไม่มีป้ายแท็กหลักในมิตินี้
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                          {activeGroupOverview.mainCategories.map((item) => {
                            const isSelected =
                              activeMainCategory?.mainTag.id === item.mainTag.id;
                            const isStaging = isStagingTagId(item.mainTag.id);
                            const isReady5 = !isStaging && item.usableCount >= 5;
                            const isDropHover =
                              !isStaging && dragOverTagId === item.mainTag.id;

                            return (
                              <motion.button
                                key={item.mainTag.id}
                                type="button"
                                whileHover={{ y: -1 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => onSelectMainCategory(item.mainTag.id)}
                                onDragOver={(e) => handleDragOverTag(e, item.mainTag.id)}
                                onDragLeave={(e) => handleDragLeaveTag(e, item.mainTag.id)}
                                onDrop={(e) => handleDropOnTag(e, item.mainTag.id)}
                                className={`relative text-left p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-1.5 overflow-hidden ${
                                  isDropHover
                                    ? 'bg-[#edf6ef] border-2 border-[#549364] text-[#164121] scale-[1.02]'
                                    : isSelected
                                    ? 'bg-[#d8eaf6] text-[#143e62] border-[#a8cde8] ring-1 ring-[#bad7ee] shadow-2xs font-semibold'
                                    : 'bg-white hover:border-[#b8cfe3] border-[#e8e2d8] text-[#4d4133]'
                                }`}
                              >
                                <div className="relative z-10 flex items-center justify-between gap-1.5">
                                  <span className="text-xs font-bold truncate">
                                    #{item.mainTag.name}
                                  </span>
                                  {isReady5 && (
                                    <span
                                      className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded shrink-0 tabular-nums ${
                                        isSelected
                                          ? 'bg-[#cce5f7] text-[#14395a]'
                                          : 'bg-[#eaf5ed] text-[#245233] border border-[#c5e1cb]'
                                      }`}
                                    >
                                      {item.producibleEpisodes} EP
                                    </span>
                                  )}
                                </div>

                                <div
                                  className={`relative z-10 flex items-baseline justify-between pt-1 border-t text-[11px] font-mono tabular-nums ${
                                    isSelected
                                      ? 'border-[#bcdbee] text-[#2c5378]'
                                      : 'border-[#eee8de] text-[#786b5c]'
                                  }`}
                                >
                                  <span>{item.totalCount} คลิป</span>
                                  <span
                                    className={`font-bold ${
                                      isSelected
                                        ? 'text-[#1d4f29]'
                                        : isReady5
                                        ? 'text-[#245233]'
                                        : 'text-[#9c9182]'
                                    }`}
                                  >
                                    พร้อม {item.usableCount}
                                  </span>
                                </div>
                              </motion.button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* STAGE 3: Subcategories under Selected Main Category */}
              <AnimatePresence initial={false}>
                {activeMainCategory && !isStagingTagId(activeMainCategory.mainTag.id) && (
                  <motion.div
                    key="vault-tier3-subcats"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 bg-[#eef6f0] p-3 rounded-xl border border-[#cbe3cf]">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="w-4 h-4 rounded-full bg-[#d8eedc] text-[#194523] text-[10px] font-mono font-bold flex items-center justify-center">
                            3
                          </span>
                          <span className="text-xs font-bold text-[#1f4828]">
                            ป้ายแท็กย่อย / คุณลักษณะใน #{activeMainCategory.mainTag.name}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              onSelectAllInMainCategory(activeMainCategory.mainTag.id)
                            }
                            className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                              selectedTagFilter.length === 1 &&
                              selectedTagFilter[0] === activeMainCategory.mainTag.id
                                ? 'bg-[#2d5d39] text-white border-[#2d5d39]'
                                : 'bg-white text-[#4d4133] border-[#dfd7ca] hover:border-[#b8d6be]'
                            }`}
                          >
                            ทั้งหมด ({activeMainCategory.totalCount})
                          </button>

                          {activeMainCategory.subTags.map((sub) => {
                            const subCount = computedFootage.filter((ft) =>
                              ft.tags.includes(sub.id)
                            ).length;
                            const isSubSelected = selectedTagFilter.includes(sub.id);
                            const isSubDropHover = dragOverTagId === sub.id;

                            return (
                              <div
                                key={sub.id}
                                onDragOver={(e) => handleDragOverTag(e, sub.id)}
                                onDragLeave={(e) => handleDragLeaveTag(e, sub.id)}
                                onDrop={(e) => handleDropOnTag(e, sub.id)}
                                className={`inline-flex rounded-lg transition-transform ${
                                  isSubDropHover
                                    ? 'ring-2 ring-[#4d8f5d] scale-105 bg-[#d8eedc]'
                                    : ''
                                }`}
                              >
                                <TagPill
                                  tag={sub}
                                  selected={isSubSelected}
                                  activeLayoutId="vault-active-subcat-pill"
                                  onClick={() =>
                                    onSelectSubcategory(
                                      sub.id,
                                      activeMainCategory.mainTag.id
                                    )
                                  }
                                  count={subCount}
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          onLaunchEpisodeBuilder(
                            activeMainCategory.mainTag.id,
                            activeMainCategory.newCount >= 5
                              ? 'FORMULA_ALL_NEW'
                              : 'FORMULA_2_NEW_3_FRESH'
                          )
                        }
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-[#78593a] hover:bg-[#62462a] rounded-xl shadow-2xs whitespace-nowrap shrink-0 cursor-pointer transition-colors"
                      >
                        <Rocket className="w-3.5 h-3.5 text-white" />
                        <span>จัด 5 อันดับ →</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
