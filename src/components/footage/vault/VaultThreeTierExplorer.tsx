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
    <div className="bg-white border border-slate-200/90 rounded-2xl shadow-2xs overflow-hidden">
      {/* Compact Explorer Header */}
      <div
        onClick={onToggleExpand}
        className="px-4 py-3 bg-slate-50/70 hover:bg-slate-100/60 transition-colors cursor-pointer flex flex-wrap items-center justify-between gap-2"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
            <FolderOpen className="w-3.5 h-3.5" />
          </div>
          <span className="text-sm font-extrabold text-slate-900">
            สำรวจหมวดหมู่
          </span>
          <span className="text-xs font-mono text-slate-500 tabular-nums">
            {categoryGroupsOverview.length} กลุ่ม · {mainCategoriesCount} หมวด
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
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 cursor-pointer"
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
            <div className="border-t border-slate-200/80 p-4 space-y-3.5 bg-white">
              {/* STAGE 1: Category Groups */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[10px] font-mono font-bold flex items-center justify-center">
                      1
                    </span>
                    <span>กลุ่มหมวดหมู่</span>
                  </span>
                </div>

                {categoryGroupsOverview.length === 0 ? (
                  <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-center space-y-2">
                    <p className="text-xs text-slate-500">ยังไม่มีกลุ่มหมวดหมู่</p>
                    <button
                      type="button"
                      onClick={onOpenThreeTierManager}
                      className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 cursor-pointer"
                    >
                      + จัดการหมวดหมู่
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
                              ? 'text-white border-indigo-600 shadow-xs'
                              : isStagingGrp
                              ? 'bg-amber-50/60 hover:bg-amber-50 border-amber-200/90 text-slate-900'
                              : 'bg-slate-50/70 hover:bg-indigo-50/40 hover:border-indigo-300 border-slate-200/90 text-slate-900'
                          }`}
                        >
                          {isGroupSelected && (
                            <motion.span
                              layoutId="vault-active-group-bg"
                              transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                              className="absolute inset-0 bg-indigo-600 z-0"
                            />
                          )}
                          <div className="relative z-10 flex items-center justify-between gap-1.5">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <CategoryGroupIcon
                                icon={groupItem.group.icon}
                                className={`w-3.5 h-3.5 shrink-0 ${
                                  isGroupSelected
                                    ? 'text-white'
                                    : isStagingGrp
                                    ? 'text-amber-600'
                                    : 'text-indigo-600'
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
                                    ? 'bg-indigo-800 text-indigo-100'
                                    : 'bg-slate-200/80 text-slate-600'
                                }`}
                              >
                                {groupItem.mainCatCount}
                              </span>
                            )}
                          </div>

                          <div
                            className={`relative z-10 flex items-baseline justify-between pt-1.5 border-t text-[11px] font-mono tabular-nums ${
                              isGroupSelected
                                ? 'border-indigo-500/60 text-indigo-100'
                                : 'border-slate-200/70 text-slate-500'
                            }`}
                          >
                            <span>{groupItem.totalCount} คลิป</span>
                            {!isStagingGrp && (
                              <span
                                className={`font-bold ${
                                  isGroupSelected
                                    ? 'text-emerald-300'
                                    : groupItem.usableCount > 0
                                    ? 'text-emerald-700'
                                    : 'text-slate-400'
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
                    <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                          <span className="w-4 h-4 rounded-full bg-sky-600 text-white text-[10px] font-mono font-bold flex items-center justify-center">
                            2
                          </span>
                          <span>หมวดหลักใน {activeGroupOverview.group.name}</span>
                        </span>

                        {activeMainCategory && (
                          <button
                            type="button"
                            onClick={onClearMainCategoryFilter}
                            className="text-[11px] font-semibold text-sky-700 hover:text-sky-900 cursor-pointer"
                          >
                            ดูทั้งกลุ่ม ({activeGroupOverview.totalCount})
                          </button>
                        )}
                      </div>

                      {activeGroupOverview.mainCategories.length === 0 ? (
                        <div className="p-3 text-center text-xs text-slate-500 bg-white rounded-lg border border-dashed border-slate-200">
                          ยังไม่มีหมวดหลักในกลุ่มนี้
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
                                    ? 'bg-emerald-50 border-2 border-emerald-500 text-emerald-950 scale-[1.02]'
                                    : isSelected
                                    ? 'text-white border-sky-600 shadow-2xs'
                                    : 'bg-white hover:border-sky-300 border-slate-200/90 text-slate-900'
                                }`}
                              >
                                {isSelected && (
                                  <motion.span
                                    layoutId="vault-active-maincat-bg"
                                    transition={{
                                      type: 'spring',
                                      stiffness: 420,
                                      damping: 32,
                                    }}
                                    className="absolute inset-0 bg-sky-600 z-0"
                                  />
                                )}
                                <div className="relative z-10 flex items-center justify-between gap-1.5">
                                  <span className="text-xs font-bold truncate">
                                    #{item.mainTag.name}
                                  </span>
                                  {isReady5 && (
                                    <span
                                      className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded shrink-0 tabular-nums ${
                                        isSelected
                                          ? 'bg-emerald-400 text-slate-950'
                                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                      }`}
                                    >
                                      {item.producibleEpisodes} EP
                                    </span>
                                  )}
                                </div>

                                <div
                                  className={`relative z-10 flex items-baseline justify-between pt-1 border-t text-[11px] font-mono tabular-nums ${
                                    isSelected
                                      ? 'border-sky-500/60 text-sky-100'
                                      : 'border-slate-100 text-slate-500'
                                  }`}
                                >
                                  <span>{item.totalCount} คลิป</span>
                                  <span
                                    className={`font-bold ${
                                      isSelected
                                        ? 'text-emerald-300'
                                        : isReady5
                                        ? 'text-emerald-700'
                                        : 'text-slate-500'
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
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 bg-emerald-50/40 p-3 rounded-xl border border-emerald-200/80">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="w-4 h-4 rounded-full bg-emerald-600 text-white text-[10px] font-mono font-bold flex items-center justify-center">
                            3
                          </span>
                          <span className="text-xs font-bold text-emerald-950">
                            หมวดย่อยใน #{activeMainCategory.mainTag.name}
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
                                ? 'bg-indigo-600 text-white border-indigo-600'
                                : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-300'
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
                                    ? 'ring-2 ring-emerald-500 scale-105 bg-emerald-100'
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
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-2xs whitespace-nowrap shrink-0 cursor-pointer"
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
