import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowDownToDot,
  CheckCircle2,
  ChevronDown,
  FolderInput,
  GripHorizontal,
  Inbox,
  Layers,
  Maximize2,
  RotateCcw,
  Search,
  Sparkles,
  Tag,
  X,
} from 'lucide-react';
import { isStagingGroupId, isStagingTagId } from '../../../services/seedData';
import { ComputedFootage } from '../../../types/footage.types';
import { CategoryGroupIcon } from '../../ui/CategoryGroupIcon';
import { getEntityIconNode } from '../../ui/TagPill';
import {
  CategoryGroupOverviewItem,
  MainCategoryOverviewItem,
  QuickSortUndoRecord,
} from './vault.types';

export interface VaultStagingQuickSortBarProps {
  isStagingFilterActive: boolean;
  stagingCount: number;
  selectedFootageIds: string[];
  activeDragFootageIds: string[];
  categoryGroupsOverview: CategoryGroupOverviewItem[];
  mainCategoriesOverview: MainCategoryOverviewItem[];
  computedFootage: ComputedFootage[];
  lastUndoRecord: QuickSortUndoRecord | null;
  onQuickAssignCategory: (footageIds: string[], targetTagId: string) => void;
  onUndoLastQuickSort: () => void;
  onDismissUndoRecord: () => void;
  onSelectAllInStaging: () => void;
  isAllStagingSelected: boolean;
  onClearSelection: () => void;
  onOpenFullscreenStudio?: () => void;
}

export const VaultStagingQuickSortBar: React.FC<VaultStagingQuickSortBarProps> = ({
  isStagingFilterActive,
  stagingCount,
  selectedFootageIds,
  activeDragFootageIds,
  categoryGroupsOverview,
  mainCategoriesOverview,
  computedFootage,
  lastUndoRecord,
  onQuickAssignCategory,
  onUndoLastQuickSort,
  onDismissUndoRecord,
  onSelectAllInStaging,
  isAllStagingSelected,
  onClearSelection,
  onOpenFullscreenStudio,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeGroupTab, setActiveGroupTab] = useState<string>('ALL');
  const [categorySearch, setCategorySearch] = useState('');
  const [dragOverTagId, setDragOverTagId] = useState<string | null>(null);
  const [expandedMainTagId, setExpandedMainTagId] = useState<string | null>(null);

  const isDragging = activeDragFootageIds.length > 0;
  const selectedCount = selectedFootageIds.length;
  const shouldShowWorkspace =
    isStagingFilterActive || selectedCount > 0 || isDragging;

  useEffect(() => {
    if (isDragging) {
      setIsExpanded(true);
    }
  }, [isDragging]);

  const realCategoryGroups = useMemo(() => {
    return categoryGroupsOverview.filter((g) => !isStagingGroupId(g.group.id));
  }, [categoryGroupsOverview]);

  const realMainCategories = useMemo(() => {
    return mainCategoriesOverview.filter((m) => !isStagingTagId(m.mainTag.id));
  }, [mainCategoriesOverview]);

  const visibleMainCategories = useMemo(() => {
    let list = realMainCategories;

    if (activeGroupTab !== 'ALL') {
      const groupObj = realCategoryGroups.find((g) => g.group.id === activeGroupTab);
      if (groupObj) {
        const allowedMainIds = new Set(
          groupObj.mainCategories
            .filter((mc) => !isStagingTagId(mc.mainTag.id))
            .map((mc) => mc.mainTag.id)
        );
        list = list.filter((m) => allowedMainIds.has(m.mainTag.id));
      }
    }

    if (categorySearch.trim() !== '') {
      const q = categorySearch.trim().toLowerCase();
      list = list.filter((item) => {
        const matchMain = item.mainTag.name.toLowerCase().includes(q);
        const matchSub = item.subTags.some((sub) =>
          sub.name.toLowerCase().includes(q)
        );
        return matchMain || matchSub;
      });
    }

    return list;
  }, [realMainCategories, realCategoryGroups, activeGroupTab, categorySearch]);

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
      // Fallback
    }
    return activeDragFootageIds;
  };

  const handleDragOverTarget = (e: React.DragEvent, tagId: string) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverTagId !== tagId) {
      setDragOverTagId(tagId);
    }
  };

  const handleDragLeaveTarget = (e: React.DragEvent, tagId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (dragOverTagId === tagId) {
      setDragOverTagId(null);
    }
  };

  const handleDropOnTarget = (e: React.DragEvent, targetTagId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverTagId(null);
    const idsToMove = extractDraggedFootageIds(e);
    if (idsToMove.length > 0) {
      onQuickAssignCategory(idsToMove, targetTagId);
    }
  };

  const handleClickCategoryTarget = (targetTagId: string, hasSubTags = false) => {
    if (selectedCount > 0) {
      onQuickAssignCategory(selectedFootageIds, targetTagId);
      return;
    }
    if (hasSubTags) {
      setExpandedMainTagId((prev) => (prev === targetTagId ? null : targetTagId));
    }
  };

  if (!shouldShowWorkspace && !lastUndoRecord) {
    return null;
  }

  const effectiveMoveCount = isDragging
    ? activeDragFootageIds.length
    : selectedCount;

  return (
    <div className="sticky top-2 z-30 space-y-2">
      {/* 1. Compact Undo Notification Toast */}
      <AnimatePresence>
        {lastUndoRecord && (
          <motion.div
            key={lastUndoRecord.id}
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 420, damping: 28 }}
            className="bg-emerald-50 text-emerald-950 border border-emerald-200 rounded-2xl px-3.5 py-2 shadow-xs flex flex-wrap items-center justify-between gap-2"
          >
            <div className="flex items-center gap-2 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                ย้าย <strong>{lastUndoRecord.movedCount} คลิป</strong> ➔{' '}
                <strong className="text-indigo-700">
                  {lastUndoRecord.targetTagName}
                </strong>
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={onUndoLastQuickSort}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>เลิกทำ</span>
              </button>
              <button
                type="button"
                onClick={onDismissUndoRecord}
                className="p-1 rounded-lg text-emerald-700 hover:bg-emerald-100 transition-colors cursor-pointer"
                title="ปิด"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Streamlined Quick-Sort & Drop Workspace */}
      {shouldShowWorkspace && (
        <motion.div
          layout
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-2xl border transition-all overflow-hidden ${
            isDragging
              ? 'bg-indigo-50/95 text-slate-900 border-indigo-300 ring-2 ring-indigo-200 shadow-md'
              : selectedCount > 0
              ? 'bg-white text-slate-900 border-indigo-300 shadow-sm'
              : 'bg-white text-slate-900 border-slate-200/90 shadow-2xs'
          }`}
        >
          {/* Compact Dock Header Bar */}
          <div className="px-3.5 py-2 flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 bg-slate-50/70">
            <div className="flex items-center gap-2 min-w-0">
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                  isDragging
                    ? 'bg-indigo-600 text-white animate-pulse'
                    : selectedCount > 0
                    ? 'bg-indigo-600 text-white'
                    : 'bg-amber-500 text-white'
                }`}
              >
                {isDragging ? (
                  <ArrowDownToDot className="w-3.5 h-3.5" />
                ) : selectedCount > 0 ? (
                  <FolderInput className="w-3.5 h-3.5" />
                ) : (
                  <Inbox className="w-3.5 h-3.5" />
                )}
              </div>

              <span className="text-xs sm:text-sm font-extrabold text-slate-900">
                จัดหมวดหมู่ด่วน
              </span>

              {isDragging ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold bg-indigo-100 text-indigo-900 border border-indigo-200">
                  <GripHorizontal className="w-3.5 h-3.5 text-indigo-600" />
                  <span>กำลังลาก {activeDragFootageIds.length} คลิป</span>
                </span>
              ) : selectedCount > 0 ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
                  <Sparkles className="w-3 h-3 text-indigo-600" />
                  <span>เลือก {selectedCount} คลิป</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200 tabular-nums">
                  <span>ไม่มีหมวด {stagingCount}</span>
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1.5 shrink-0">
              {stagingCount > 0 && (
                <button
                  type="button"
                  onClick={onSelectAllInStaging}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                    isAllStagingSelected
                      ? 'bg-amber-400 text-slate-950 border-amber-400'
                      : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-200'
                  }`}
                >
                  {isAllStagingSelected
                    ? `ยกเลิกเลือก (${stagingCount})`
                    : `เลือกไม่มีหมวด (${stagingCount})`}
                </button>
              )}

              {selectedCount > 0 && (
                <button
                  type="button"
                  onClick={onClearSelection}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 cursor-pointer"
                >
                  ล้าง ({selectedCount})
                </button>
              )}

              {onOpenFullscreenStudio && (
                <button
                  type="button"
                  onClick={onOpenFullscreenStudio}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors cursor-pointer"
                  title="เปิดโหมดคัดแยกเต็มจอ"
                >
                  <Maximize2 className="w-3 h-3" />
                  <span>เต็มจอ</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsExpanded((prev) => !prev)}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
              >
                <span>{isExpanded ? 'ย่อ' : 'กาง'}</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform ${
                    isExpanded ? 'rotate-180' : ''
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Expandable Destination Categories Body */}
          <AnimatePresence initial={false}>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="p-3 space-y-2.5 bg-white">
                  {/* Top Filter Row: Group Tabs + Search */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                      <Layers className="w-3.5 h-3.5 text-indigo-600 shrink-0 mr-1" />

                      <button
                        type="button"
                        onClick={() => setActiveGroupTab('ALL')}
                        onDragEnter={() => setActiveGroupTab('ALL')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
                          activeGroupTab === 'ALL'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        ทั้งหมด ({realMainCategories.length})
                      </button>

                      {realCategoryGroups.map((grp) => {
                        const isTabActive = activeGroupTab === grp.group.id;
                        return (
                          <button
                            key={grp.group.id}
                            type="button"
                            onClick={() => setActiveGroupTab(grp.group.id)}
                            onDragEnter={() => setActiveGroupTab(grp.group.id)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
                              isTabActive
                                ? 'bg-indigo-600 text-white'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                            }`}
                          >
                            <CategoryGroupIcon
                              icon={grp.group.icon}
                              className="w-3.5 h-3.5"
                            />
                            <span>{grp.group.name}</span>
                            <span className="text-[10px] font-mono opacity-80 tabular-nums">
                              ({grp.mainCatCount})
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Quick Search Input */}
                    <div className="relative w-full sm:w-52 shrink-0">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={categorySearch}
                        onChange={(e) => setCategorySearch(e.target.value)}
                        placeholder="ค้นหาหมวด..."
                        className="w-full pl-8 pr-7 py-1 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors"
                      />
                      {categorySearch && (
                        <button
                          type="button"
                          onClick={() => setCategorySearch('')}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Destination Category Cards */}
                  {visibleMainCategories.length === 0 ? (
                    <div className="p-3 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-500 bg-slate-50">
                      ไม่พบหมวดหมู่
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 max-h-52 overflow-y-auto pr-1">
                      {visibleMainCategories.map((item) => {
                        const isMainDragOver = dragOverTagId === item.mainTag.id;
                        const isSubDrawerOpen =
                          expandedMainTagId === item.mainTag.id ||
                          categorySearch.trim() !== '' ||
                          item.subTags.length <= 4;

                        return (
                          <div
                            key={item.mainTag.id}
                            onDragOver={(e) => handleDragOverTarget(e, item.mainTag.id)}
                            onDragLeave={(e) => handleDragLeaveTarget(e, item.mainTag.id)}
                            onDrop={(e) => handleDropOnTarget(e, item.mainTag.id)}
                            className={`rounded-xl border p-2.5 transition-all flex flex-col justify-between gap-2 ${
                              isMainDragOver
                                ? 'bg-emerald-50 border-2 border-emerald-500 text-emerald-950 scale-[1.01] shadow-xs'
                                : 'bg-slate-50/70 hover:bg-indigo-50/30 border-slate-200 hover:border-indigo-300'
                            }`}
                          >
                            {/* Tier 1 Main Category Target Row */}
                            <div className="flex items-center justify-between gap-1.5">
                              <button
                                type="button"
                                onClick={() =>
                                  handleClickCategoryTarget(
                                    item.mainTag.id,
                                    item.subTags.length > 0
                                  )
                                }
                                className="flex items-center gap-1.5 min-w-0 text-left flex-1 cursor-pointer group"
                              >
                                <Tag
                                  className={`w-3.5 h-3.5 shrink-0 ${
                                    isMainDragOver
                                      ? 'text-emerald-600'
                                      : 'text-indigo-600'
                                  }`}
                                />
                                <span className="text-xs font-bold text-slate-900 group-hover:text-indigo-700 truncate">
                                  #{item.mainTag.name}
                                </span>
                                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded shrink-0 tabular-nums bg-slate-200/80 text-slate-700">
                                  {item.totalCount}
                                </span>
                              </button>

                              {selectedCount > 0 ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    onQuickAssignCategory(
                                      selectedFootageIds,
                                      item.mainTag.id
                                    )
                                  }
                                  className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shrink-0 cursor-pointer"
                                >
                                  + ย้าย
                                </button>
                              ) : isMainDragOver ? (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-emerald-600 text-white shrink-0">
                                  วาง ({effectiveMoveCount})
                                </span>
                              ) : (
                                item.subTags.length > 4 && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setExpandedMainTagId((prev) =>
                                        prev === item.mainTag.id ? null : item.mainTag.id
                                      )
                                    }
                                    className="text-[10px] font-bold px-1.5 py-0.5 rounded text-indigo-700 hover:bg-indigo-100 cursor-pointer"
                                  >
                                    {isSubDrawerOpen
                                      ? 'ย่อ'
                                      : `+${item.subTags.length}`}
                                  </button>
                                )
                              )}
                            </div>

                            {/* Tier 2 Subcategory Chips */}
                            {item.subTags.length > 0 && isSubDrawerOpen && (
                              <div className="flex flex-wrap gap-1 pt-1.5 border-t border-slate-200/80">
                                {item.subTags.map((sub) => {
                                  const isSubDragOver = dragOverTagId === sub.id;
                                  const subCount = computedFootage.filter((ft) =>
                                    ft.tags.includes(sub.id)
                                  ).length;

                                  return (
                                    <button
                                      key={sub.id}
                                      type="button"
                                      onDragOver={(e) => handleDragOverTarget(e, sub.id)}
                                      onDragLeave={(e) => handleDragLeaveTarget(e, sub.id)}
                                      onDrop={(e) => handleDropOnTarget(e, sub.id)}
                                      onClick={() => {
                                        if (selectedCount > 0) {
                                          onQuickAssignCategory(
                                            selectedFootageIds,
                                            sub.id
                                          );
                                        }
                                      }}
                                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border transition-all cursor-pointer ${
                                        isSubDragOver
                                          ? 'bg-emerald-100 text-emerald-950 border-2 border-emerald-500 scale-105 font-bold'
                                          : selectedCount > 0
                                          ? 'bg-white hover:bg-indigo-50 text-indigo-900 border-indigo-200 hover:border-indigo-400'
                                          : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                                      }`}
                                    >
                                      {getEntityIconNode(sub)}
                                      <span className="truncate max-w-[115px]">
                                        {sub.name}
                                      </span>
                                      <span className="font-mono text-[10px] opacity-70 tabular-nums">
                                        ({subCount})
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
};
