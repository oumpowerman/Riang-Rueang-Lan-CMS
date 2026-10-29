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

  // Automatically expand dock when user starts dragging clips
  useEffect(() => {
    if (isDragging) {
      setIsExpanded(true);
    }
  }, [isDragging]);

  // Filter out the Staging Group so only real destination groups/categories appear
  const realCategoryGroups = useMemo(() => {
    return categoryGroupsOverview.filter((g) => !isStagingGroupId(g.group.id));
  }, [categoryGroupsOverview]);

  const realMainCategories = useMemo(() => {
    return mainCategoriesOverview.filter((m) => !isStagingTagId(m.mainTag.id));
  }, [mainCategoriesOverview]);

  // Filter main categories by active group tab and search query
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

  // Extract footage IDs from native HTML5 drag event or fallback to activeDragFootageIds
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
      // Fallback to activeDragFootageIds state
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
      {/* 1. Undo Notification Banner after Quick-Sort / Drag-and-Drop */}
      <AnimatePresence>
        {lastUndoRecord && (
          <motion.div
            key={lastUndoRecord.id}
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 420, damping: 28 }}
            className="bg-emerald-950/95 text-white backdrop-blur-md border border-emerald-500/50 rounded-2xl px-4 py-2.5 shadow-lg flex flex-wrap items-center justify-between gap-3"
          >
            <div className="flex items-center gap-2.5 text-xs">
              <div className="w-7 h-7 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-emerald-200">
                  ย้ายฟุตเทจ {lastUndoRecord.movedCount} คลิป
                </span>{' '}
                <span>เข้าสู่หมวดหมู่</span>{' '}
                <span className="font-extrabold text-amber-300 underline decoration-amber-400/60 underline-offset-2">
                  {lastUndoRecord.targetTagName}
                </span>{' '}
                <span className="text-emerald-300/90">
                  และนำออกจากพื้นที่พักเรียบร้อยแล้ว
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onUndoLastQuickSort}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-extrabold shadow-xs transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>ย้อนกลับ (Undo)</span>
              </button>
              <button
                type="button"
                onClick={onDismissUndoRecord}
                className="p-1.5 rounded-lg bg-emerald-900/70 hover:bg-emerald-800 text-emerald-300 hover:text-white transition-colors cursor-pointer"
                title="ปิดแจ้งเตือน"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Sticky Top Quick-Sort & Drop Workspace */}
      {shouldShowWorkspace && (
        <motion.div
          layout
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-2xl border backdrop-blur-md transition-all overflow-hidden ${
            isDragging
              ? 'bg-indigo-950/95 text-white border-indigo-400 ring-4 ring-indigo-500/30 shadow-2xl'
              : selectedCount > 0
              ? 'bg-slate-900/95 text-white border-indigo-500/70 shadow-xl'
              : 'bg-white/95 text-slate-900 border-amber-300/90 shadow-md ring-2 ring-amber-400/20'
          }`}
        >
          {/* Dock Header Bar */}
          <div className="px-4 py-2.5 flex flex-wrap items-center justify-between gap-2.5 border-b border-slate-200/20">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  isDragging
                    ? 'bg-emerald-500 text-slate-950 animate-pulse'
                    : selectedCount > 0
                    ? 'bg-indigo-600 text-white'
                    : 'bg-amber-500 text-white'
                }`}
              >
                {isDragging ? (
                  <ArrowDownToDot className="w-4 h-4" />
                ) : selectedCount > 0 ? (
                  <FolderInput className="w-4 h-4" />
                ) : (
                  <Inbox className="w-4 h-4" />
                )}
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs sm:text-sm font-extrabold tracking-tight">
                    แผงคัดแยกหมวดหมู่ด่วน (Staging Quick-Sort Dock)
                  </span>

                  {isDragging ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-400 text-slate-950 shadow-2xs">
                      <GripHorizontal className="w-3.5 h-3.5" />
                      <span>
                        กำลังลาก {activeDragFootageIds.length} คลิป — วางลงบนหมวดหมู่ด้านล่างได้เลย!
                      </span>
                    </span>
                  ) : selectedCount > 0 ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-indigo-500 text-white">
                      <Sparkles className="w-3 h-3 text-amber-300" />
                      <span>
                        เลือกไว้ {selectedCount} คลิป — คลิกหมวดหมู่ด้านล่างเพื่อย้ายเข้าทันที หรือลากคลิปมาวาง
                      </span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                      <span>รอจัดหมวดหมู่ {stagingCount} คลิป</span>
                    </span>
                  )}
                </div>
                <p
                  className={`text-[11px] truncate ${
                    isDragging || selectedCount > 0
                      ? 'text-slate-300'
                      : 'text-slate-500'
                  }`}
                >
                  ลากการ์ดคลิปมาวาง หรือติ๊กเลือกหลายคลิปแล้วคลิกปุ่มหมวดหมู่เพื่อแทนที่หมวดเดิมและนำออกจากพื้นที่พักทันที
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {stagingCount > 0 && (
                <button
                  type="button"
                  onClick={onSelectAllInStaging}
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                    isAllStagingSelected
                      ? 'bg-amber-400 text-slate-950 border-amber-300'
                      : isDragging || selectedCount > 0
                      ? 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-slate-700'
                      : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300'
                  }`}
                >
                  {isAllStagingSelected
                    ? `ยกเลิกเลือกพื้นที่พัก (${stagingCount})`
                    : `เลือกทั้งหมดในพื้นที่พัก (${stagingCount})`}
                </button>
              )}

              {selectedCount > 0 && (
                <button
                  type="button"
                  onClick={onClearSelection}
                  className="px-2.5 py-1 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer"
                >
                  ล้างที่เลือก ({selectedCount})
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsExpanded((prev) => !prev)}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                  isDragging || selectedCount > 0
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                }`}
              >
                <span>{isExpanded ? 'ย่อแผง' : 'กางแผงหมวดหมู่'}</span>
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
                <div className="p-3 sm:p-4 space-y-3">
                  {/* Top Filter Row: Tier 0 Group Tabs + Quick Search */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                      <span
                        className={`text-[11px] font-bold shrink-0 flex items-center gap-1 mr-1 ${
                          isDragging || selectedCount > 0
                            ? 'text-slate-300'
                            : 'text-slate-600'
                        }`}
                      >
                        <Layers className="w-3.5 h-3.5 text-indigo-400" />
                        <span>กลุ่มปลายทาง:</span>
                      </span>

                      <button
                        type="button"
                        onClick={() => setActiveGroupTab('ALL')}
                        onDragEnter={() => setActiveGroupTab('ALL')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
                          activeGroupTab === 'ALL'
                            ? 'bg-indigo-600 text-white shadow-2xs'
                            : isDragging || selectedCount > 0
                            ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        ทุกกลุ่ม ({realMainCategories.length})
                      </button>

                      {realCategoryGroups.map((grp) => {
                        const isTabActive = activeGroupTab === grp.group.id;
                        return (
                          <button
                            key={grp.group.id}
                            type="button"
                            onClick={() => setActiveGroupTab(grp.group.id)}
                            onDragEnter={() => setActiveGroupTab(grp.group.id)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
                              isTabActive
                                ? 'bg-indigo-600 text-white shadow-2xs'
                                : isDragging || selectedCount > 0
                                ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            <CategoryGroupIcon
                              icon={grp.group.icon}
                              className="w-3.5 h-3.5"
                            />
                            <span>{grp.group.name}</span>
                            <span className="text-[10px] font-mono opacity-80">
                              ({grp.mainCatCount})
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Quick Search Input for Categories */}
                    <div className="relative w-full sm:w-60 shrink-0">
                      <Search
                        className={`w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 ${
                          isDragging || selectedCount > 0
                            ? 'text-slate-400'
                            : 'text-slate-400'
                        }`}
                      />
                      <input
                        type="text"
                        value={categorySearch}
                        onChange={(e) => setCategorySearch(e.target.value)}
                        placeholder="ค้นหาหมวดหลัก / หมวดย่อย..."
                        className={`w-full pl-8 pr-7 py-1 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                          isDragging || selectedCount > 0
                            ? 'bg-slate-800/90 border-slate-700 text-white placeholder:text-slate-400'
                            : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400'
                        }`}
                      />
                      {categorySearch && (
                        <button
                          type="button"
                          onClick={() => setCategorySearch('')}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Destination Category Cards (Drop Zones + 1-Click Assign) */}
                  {visibleMainCategories.length === 0 ? (
                    <div
                      className={`p-4 rounded-xl border border-dashed text-center text-xs ${
                        isDragging || selectedCount > 0
                          ? 'border-slate-700 text-slate-400'
                          : 'border-slate-200 text-slate-500'
                      }`}
                    >
                      ไม่พบหมวดหมู่ที่ตรงกับคำค้นหา
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 max-h-60 overflow-y-auto pr-1">
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
                                ? 'bg-emerald-500/25 border-emerald-400 ring-2 ring-emerald-400 scale-[1.01] shadow-md'
                                : isDragging || selectedCount > 0
                                ? 'bg-slate-800/90 border-slate-700/90 hover:border-indigo-400'
                                : 'bg-slate-50/90 border-slate-200/90 hover:border-indigo-300 hover:bg-indigo-50/30'
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
                                title={
                                  selectedCount > 0
                                    ? `คลิกเพื่อย้าย ${selectedCount} คลิปเข้าหมวด #${item.mainTag.name}`
                                    : `ลากคลิปมาวางที่นี่เพื่อย้ายเข้า #${item.mainTag.name}`
                                }
                              >
                                <Tag
                                  className={`w-3.5 h-3.5 shrink-0 ${
                                    isMainDragOver
                                      ? 'text-emerald-300'
                                      : isDragging || selectedCount > 0
                                      ? 'text-sky-400'
                                      : 'text-indigo-600'
                                  }`}
                                />
                                <span
                                  className={`text-xs font-extrabold truncate ${
                                    isDragging || selectedCount > 0
                                      ? 'text-white group-hover:text-amber-300'
                                      : 'text-slate-900 group-hover:text-indigo-700'
                                  }`}
                                >
                                  #{item.mainTag.name}
                                </span>
                                <span
                                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded shrink-0 tabular-nums ${
                                    isDragging || selectedCount > 0
                                      ? 'bg-slate-700 text-slate-300'
                                      : 'bg-slate-200/80 text-slate-700'
                                  }`}
                                >
                                  {item.totalCount}
                                </span>
                              </button>

                              {/* Action Trigger Button for Tier 1 */}
                              {selectedCount > 0 ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    onQuickAssignCategory(
                                      selectedFootageIds,
                                      item.mainTag.id
                                    )
                                  }
                                  className="px-2 py-0.5 rounded-lg text-[10px] font-extrabold bg-indigo-600 hover:bg-emerald-500 text-white hover:text-slate-950 transition-colors shrink-0 cursor-pointer"
                                >
                                  + ย้ายเข้าหมวดหลัก
                                </button>
                              ) : isMainDragOver ? (
                                <span className="px-2 py-0.5 rounded-lg text-[10px] font-extrabold bg-emerald-400 text-slate-950 shrink-0">
                                  ปล่อยเพื่อวาง ({effectiveMoveCount})
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
                                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded cursor-pointer ${
                                      isDragging || selectedCount > 0
                                        ? 'text-slate-300 hover:bg-slate-700'
                                        : 'text-indigo-700 hover:bg-indigo-100'
                                    }`}
                                  >
                                    {isSubDrawerOpen
                                      ? 'ย่อหมวดย่อย'
                                      : `+${item.subTags.length} หมวดย่อย`}
                                  </button>
                                )
                              )}
                            </div>

                            {/* Tier 2 Subcategory Chips (Each is an independent Drop Target & 1-Click Button) */}
                            {item.subTags.length > 0 && isSubDrawerOpen && (
                              <div className="flex flex-wrap gap-1 pt-1.5 border-t border-slate-500/20">
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
                                      title={
                                        selectedCount > 0
                                          ? `คลิกเพื่อย้าย ${selectedCount} คลิปเข้า #${item.mainTag.name} ➔ ${sub.name}`
                                          : `ลากคลิปมาวางใส่ ${sub.name} (ระบบจะผูกหมวดหลัก #${item.mainTag.name} ให้อัตโนมัติ)`
                                      }
                                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                                        isSubDragOver
                                          ? 'bg-emerald-400 text-slate-950 border-emerald-300 ring-2 ring-emerald-300 scale-105 shadow-xs'
                                          : selectedCount > 0
                                          ? 'bg-slate-900 hover:bg-emerald-400 text-amber-200 hover:text-slate-950 border-slate-600 hover:border-emerald-300'
                                          : isDragging
                                          ? 'bg-slate-900/90 text-amber-200 border-slate-600 hover:border-emerald-400'
                                          : 'bg-white hover:bg-amber-50 text-slate-800 border-slate-200/90 hover:border-amber-300'
                                      }`}
                                    >
                                      {getEntityIconNode(sub)}
                                      <span className="truncate max-w-[120px]">
                                        {sub.name}
                                      </span>
                                      <span className="font-mono text-[10px] opacity-75 tabular-nums">
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
