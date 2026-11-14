import React, { useState } from 'react';
import { AnimatePresence, LayoutGroup, motion } from 'motion/react';
import {
  ArrowRight,
  ChevronDown,
  RotateCcw,
  Sparkles,
  Star,
  Flame,
  Gem,
  ListOrdered,
  Shuffle,
  Film,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  X,
  ArrowUp,
  ArrowDown,
  PanelRightOpen,
} from 'lucide-react';
import { CategoryMatrixStat, useCMS } from '../../../context/CMSContext';
import {
  EpisodeProductionTarget,
  EpisodeRankingSlot,
} from '../../../types/episode.types';
import { ComputedFootage } from '../../../types/footage.types';
import {
  CategoryGroup,
  CategoryTag,
  SystemSettings,
} from '../../../types/tag.types';
import { MixRecipeId } from '../../../utils/collisionDetector';
import { VideoThumbnailPreview } from '../../footage/VideoThumbnailPreview';
import { StatusBadge } from '../../ui/StatusBadge';
import { RankSlotCard } from '../RankSlotCard';
import { CandidateFootagePool } from './CandidateFootagePool';
import {
  LiveCategoryStock,
  PickerSortBy,
  PoolQuickFilter,
  RankNumber,
  SlotDropPayload,
} from './builder.types';

export type WorkspaceLayoutMode = 'FORMULA_FOCUSED' | 'MANUAL_BROWSE';

interface BuilderStep2RankingWorkspaceProps {
  isOpen: boolean;
  onToggle: () => void;
  onNextStep: () => void;
  rankings: EpisodeRankingSlot[];
  computedFootageMap: Record<string, ComputedFootage>;
  selectedFootageIds: string[];
  activeSlotRank: RankNumber;
  onActivatePickerSlot: (rank: RankNumber) => void;
  onClearSlotByRank: (rank: RankNumber) => void;
  onClearAllSlots: () => void;
  onMoveSlotByIndex: (index: number, direction: 'UP' | 'DOWN') => void;
  onUpdateSlotScript: (rank: RankNumber, script: string) => void;
  onUpdateSlotRankFields?: (
    rank: RankNumber,
    field: 'rankTitle' | 'punchlineNote' | 'mascotScript' | 'isCustomOverride',
    value: string | boolean
  ) => void;
  onDropItemOnSlot: (targetRank: RankNumber, payload: SlotDropPayload) => void;
  onAssignFootageToRank: (targetRank: RankNumber, footageId: string) => void;
  footageToAssignedRankMap: Record<string, RankNumber>;
  categoryGroups: CategoryGroup[];
  activeGroup: CategoryGroup | null;
  activeCategoryStat: CategoryMatrixStat | null;
  productionTarget: EpisodeProductionTarget;
  activeSubcategory: CategoryTag | null;
  currentSubcategories?: CategoryTag[];
  poolSubcategoryFilterId?: string | null;
  onChangePoolSubcategoryFilterId?: (subId: string | null) => void;
  computedFootage?: ComputedFootage[];
  liveCategoryStock: LiveCategoryStock;
  allowCrossCategory: boolean;
  onToggleCrossCategory: () => void;
  onEnableCrossCategory: () => void;
  poolFilterGroupId: string;
  onChangePoolFilterGroupId: (groupId: string) => void;
  poolQuickFilter: PoolQuickFilter;
  onChangePoolQuickFilter: (filter: PoolQuickFilter) => void;
  pickerSearch: string;
  onChangePickerSearch: (q: string) => void;
  pickerSortBy: PickerSortBy;
  onChangePickerSortBy: (sort: PickerSortBy) => void;
  pickerCandidatesCount: number;
  paginatedPickerCandidates: ComputedFootage[];
  pickerPage: number;
  pickerPageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  tagMap: Record<string, CategoryTag>;
  settings: SystemSettings;
  // SmartMix recipe integration
  activeRecipe?: MixRecipeId;
  onApplyRecipe?: (recipe: MixRecipeId) => void;
}

const SLIDE_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];
const PANEL_SPRING = {
  type: 'spring' as const,
  stiffness: 260,
  damping: 28,
  mass: 0.9,
};
const CONTENT_SLIDE_SPRING = {
  type: 'spring' as const,
  stiffness: 280,
  damping: 28,
  mass: 0.85,
};

const RECIPES: {
  id: MixRecipeId;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  hint: string;
}[] = [
  {
    id: 'FORMULA_2_NEW_3_FRESH',
    title: 'สูตร 2 ใหม่ + 3 สด',
    icon: Star,
    hint: 'ใหม่ 2 + พักสด 3 (แนะนำ)',
  },
  {
    id: 'FORMULA_3_NEW_2_FRESH',
    title: 'สูตร 3 ใหม่ + 2 สด',
    icon: Flame,
    hint: 'ใหม่ 3 + พักสด 2',
  },
  {
    id: 'FORMULA_ALL_NEW',
    title: 'ใหม่แกะกล่อง 5',
    icon: Sparkles,
    hint: 'ฟุตใหม่แกะกล่องล้วน',
  },
  {
    id: 'FORMULA_CLASSIC_RETRO_60D',
    title: 'ย้อนยุคพักนาน (>60 วัน)',
    icon: Gem,
    hint: 'ฟุตเก่าที่พักจนสด',
  },
];

export const BuilderStep2RankingWorkspace: React.FC<
  BuilderStep2RankingWorkspaceProps
> = ({
  isOpen,
  onToggle,
  onNextStep,
  rankings,
  computedFootageMap,
  selectedFootageIds,
  activeSlotRank,
  onActivatePickerSlot,
  onClearSlotByRank,
  onClearAllSlots,
  onMoveSlotByIndex,
  onUpdateSlotScript,
  onUpdateSlotRankFields,
  onDropItemOnSlot,
  onAssignFootageToRank,
  footageToAssignedRankMap,
  categoryGroups,
  activeGroup,
  activeCategoryStat,
  productionTarget,
  activeSubcategory,
  currentSubcategories = [],
  poolSubcategoryFilterId,
  onChangePoolSubcategoryFilterId,
  computedFootage = [],
  liveCategoryStock,
  allowCrossCategory,
  onToggleCrossCategory,
  onEnableCrossCategory,
  poolFilterGroupId,
  onChangePoolFilterGroupId,
  poolQuickFilter,
  onChangePoolQuickFilter,
  pickerSearch,
  onChangePickerSearch,
  pickerSortBy,
  onChangePickerSortBy,
  pickerCandidatesCount,
  paginatedPickerCandidates,
  pickerPage,
  pickerPageSize,
  onPageChange,
  onPageSizeChange,
  tagMap,
  settings,
  activeRecipe = 'FORMULA_2_NEW_3_FRESH',
  onApplyRecipe,
}) => {
  const { setPreviewFootageId } = useCMS();

  // Default mode: Formula Focused (full 5-rank + quick mix toolbar, candidate pool collapsed into slim vertical strip on right)
  const [workspaceMode, setWorkspaceMode] =
    useState<WorkspaceLayoutMode>('FORMULA_FOCUSED');

  const isFormulaFocused = workspaceMode === 'FORMULA_FOCUSED';

  // Count selected new vs fresh
  const selectedObjects = selectedFootageIds
    .map((id) => computedFootageMap[id])
    .filter(Boolean);
  const selectedNewCount = selectedObjects.filter(
    (f) => f.cooldownStatus === 'NEW_UNTOUCHED'
  ).length;
  const selectedFreshCount = selectedObjects.filter(
    (f) => f.cooldownStatus === 'READY_FRESH'
  ).length;

  return (
    <section
      className={`rounded-2xl border p-3.5 sm:p-4 transition-colors duration-200 ${
        isOpen
          ? 'border-[#bad8b9] bg-[#f9fbf8]'
          : 'border-[#e8dfd3] bg-[#fdfbf7] shadow-xs hover:border-[#bad8b9]'
      }`}
    >
      {/* Persistent Accordion Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div
          onClick={!isOpen ? onToggle : undefined}
          className={`flex flex-wrap items-center gap-2 text-xs ${
            !isOpen ? 'cursor-pointer' : ''
          }`}
        >
          <span
            className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
              isOpen
                ? 'bg-[#3b6845] text-white'
                : 'bg-[#edf4ed] text-[#2b5435]'
            }`}
          >
            ขั้นที่ 2
          </span>

          {isOpen ? (
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-[#2d2926]">
                จัดเรียง 5 อันดับ & คัดคลิป
              </h2>
              <span className="text-xs text-[#716960] hidden lg:inline">
                (สไลด์สลับซ้าย-ขวาระหว่าง สูตรผสมด่วน กับ เลือกเองจากคลัง)
              </span>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-wrap items-center gap-2"
            >
              <span
                className={`px-2 py-0.5 rounded-md font-mono font-bold tabular-nums border text-xs ${
                  selectedFootageIds.length === 5
                    ? 'bg-[#edf4ed] text-[#285333] border-[#bad8b9]'
                    : 'bg-[#fef8ed] text-[#7d5622] border-[#f0e2ca]'
                }`}
              >
                {selectedFootageIds.length}/5 อันดับ
              </span>
              {selectedFootageIds.length > 0 && (
                <div className="hidden sm:flex flex-wrap items-center gap-1 font-mono text-[11px] text-[#716960]">
                  {rankings.map((slot) =>
                    slot.footageId ? (
                      <span
                        key={slot.rank}
                        className="px-1.5 py-0.5 rounded bg-[#f3ede3] text-[#4d4740]"
                      >
                        #{slot.rank} {slot.footageId}
                      </span>
                    ) : null
                  )}
                </div>
              )}
            </motion.div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isOpen ? (
            <>
              {selectedFootageIds.length > 0 && (
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={onClearAllSlots}
                  className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 text-xs font-bold text-[#8e4537] bg-[#fdf3ec] border border-[#f5d7cf] hover:bg-[#fae6de] rounded-xl transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="sm:hidden">ล้าง 5 อันดับ</span>
                  <span className="hidden sm:inline">ล้างทั้ง 5 อันดับ</span>
                </motion.button>
              )}

              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={onNextStep}
                className={`inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 text-xs font-bold rounded-xl transition-colors cursor-pointer border ${
                  selectedFootageIds.length === 5
                    ? 'bg-[#3b6845] hover:bg-[#2c5234] text-white border-[#3b6845] shadow-xs'
                    : 'bg-[#faf7f2] hover:bg-white text-[#4d4740] border-[#e8dfd3]'
                }`}
              >
                <span className="sm:hidden">ไปขั้นที่ 3</span>
                <span className="hidden sm:inline">ไปขั้นที่ 3: บันทึกตอน</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </motion.button>
            </>
          ) : (
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={onToggle}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#f4eee4] hover:bg-[#eae1d4] text-[#4d4740] text-xs font-bold transition-colors cursor-pointer"
            >
              <span>เปิดจัดอันดับ</span>
              <motion.span
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ duration: 0.25 }}
                className="inline-flex"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </motion.span>
            </motion.button>
          )}
        </div>
      </div>

      {/* Animated Body */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="step2-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: SLIDE_EASE }}
            className="overflow-hidden"
          >
            <LayoutGroup id="step2-sliding-workspace">
              <div className="pt-3.5 space-y-3">
                {/* MOBILE & TABLET (< lg): Full-Screen 2-Tab Segmented Switcher */}
                <div className="lg:hidden space-y-3">
                  <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-[#f3ede3] border border-[#e2d8cb]">
                    <button
                      type="button"
                      onClick={() => setWorkspaceMode('FORMULA_FOCUSED')}
                      className={`py-2 px-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                        isFormulaFocused
                          ? 'bg-[#3b6845] text-white shadow-xs'
                          : 'text-[#554d44] hover:text-[#2d2926]'
                      }`}
                    >
                      <ListOrdered className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">
                        บอร์ด 5 อันดับ ({selectedFootageIds.length}/5)
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setWorkspaceMode('MANUAL_BROWSE')}
                      className={`py-2 px-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                        !isFormulaFocused
                          ? 'bg-[#3b6845] text-white shadow-xs'
                          : 'text-[#554d44] hover:text-[#2d2926]'
                      }`}
                    >
                      <Film className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">
                        คลังฟุตเทจ ({pickerCandidatesCount})
                      </span>
                    </button>
                  </div>

                  {isFormulaFocused ? (
                    <div className="space-y-3 w-full">
                      {/* Mobile Quick Recipe Box */}
                      <div className="bg-[#fdfbf7] border border-[#e8dfd3] rounded-2xl p-3 space-y-2.5 shadow-2xs">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-[#2d2926]">
                            <Shuffle className="w-3.5 h-3.5 text-[#3b6845]" />
                            <span>เลือกสูตรผสมด่วน</span>
                          </div>
                          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-[#faf7f2] border border-[#e8dfd3] text-[11px] font-mono tabular-nums">
                            <span className="text-[#855621] font-bold">
                              ใหม่ {selectedNewCount}/5
                            </span>
                            <span className="text-[#d5cbc0]">·</span>
                            <span className="text-[#2b5435] font-bold">
                              สด {selectedFreshCount}/5
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          {RECIPES.map((rec) => {
                            const Icon = rec.icon;
                            const isRecActive = activeRecipe === rec.id;
                            return (
                              <button
                                key={rec.id}
                                type="button"
                                onClick={() =>
                                  onApplyRecipe && onApplyRecipe(rec.id)
                                }
                                className={`px-2.5 py-2 rounded-xl text-left border transition-colors cursor-pointer flex items-center gap-1.5 ${
                                  isRecActive
                                    ? 'bg-[#edf4ed] text-[#244b2f] border-[#bad8b9] ring-1 ring-[#a4c5a1]/50 shadow-2xs'
                                    : 'bg-[#faf7f2] hover:bg-white text-[#4d4740] border-[#e8dfd3]'
                                }`}
                                title={rec.hint}
                              >
                                <Icon className="w-3.5 h-3.5 shrink-0 text-[#3b6845]" />
                                <span className="text-xs font-bold truncate">
                                  {rec.title}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Mobile Full 5 Rank Slot Cards */}
                      <div className="space-y-2">
                        {rankings.map((slot, index) => (
                          <div key={slot.rank}>
                            <RankSlotCard
                              slot={slot}
                              footage={
                                slot.footageId
                                  ? computedFootageMap[slot.footageId]
                                  : null
                              }
                              isActivePickerSlot={
                                activeSlotRank === slot.rank
                              }
                              onActivatePicker={() => {
                                onActivatePickerSlot(slot.rank);
                                setWorkspaceMode('MANUAL_BROWSE');
                              }}
                              onClearSlot={() =>
                                onClearSlotByRank(slot.rank)
                              }
                              onMoveRank={(dir) =>
                                onMoveSlotByIndex(index, dir)
                              }
                              onScriptChange={(script) =>
                                onUpdateSlotScript(slot.rank, script)
                              }
                              onRankFieldChange={(field, val) =>
                                onUpdateSlotRankFields?.(slot.rank, field, val)
                              }
                              canMoveUp={index > 0}
                              canMoveDown={index < rankings.length - 1}
                              onSlotDragStart={(rank) =>
                                onActivatePickerSlot(rank)
                              }
                              onDropItemOnSlot={onDropItemOnSlot}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2.5 w-full">
                      {/* Compact Mini Rank Strip on Mobile when browsing Pool */}
                      <div className="flex items-center justify-between gap-1.5 p-2 rounded-xl bg-[#fdfbf7] border border-[#e8dfd3]">
                        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                          {rankings.map((slot) => {
                            const hasClip = Boolean(slot.footageId);
                            const isActive = activeSlotRank === slot.rank;
                            return (
                              <button
                                key={slot.rank}
                                type="button"
                                onClick={() => onActivatePickerSlot(slot.rank)}
                                className={`px-2 py-1 rounded-lg text-[11px] font-mono font-bold transition-colors cursor-pointer shrink-0 border ${
                                  isActive
                                    ? 'bg-[#3b6845] text-white border-[#3b6845]'
                                    : hasClip
                                    ? 'bg-[#edf4ed] text-[#244b2f] border-[#bad8b9]'
                                    : 'bg-[#faf7f2] text-[#787066] border-dashed border-[#d5cbc0]'
                                }`}
                              >
                                #{slot.rank} {slot.footageId || 'ว่าง'}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <CandidateFootagePool
                        className="w-full"
                        isExpanded={false}
                        categoryGroups={categoryGroups}
                        activeGroup={activeGroup}
                        activeCategoryStat={activeCategoryStat}
                        productionTarget={productionTarget}
                        activeSubcategory={activeSubcategory}
                        currentSubcategories={currentSubcategories}
                        poolSubcategoryFilterId={poolSubcategoryFilterId}
                        onChangePoolSubcategoryFilterId={
                          onChangePoolSubcategoryFilterId
                        }
                        computedFootage={computedFootage}
                        liveCategoryStock={liveCategoryStock}
                        allowCrossCategory={allowCrossCategory}
                        onToggleCrossCategory={onToggleCrossCategory}
                        onEnableCrossCategory={onEnableCrossCategory}
                        poolFilterGroupId={poolFilterGroupId}
                        onChangePoolFilterGroupId={
                          onChangePoolFilterGroupId
                        }
                        poolQuickFilter={poolQuickFilter}
                        onChangePoolQuickFilter={onChangePoolQuickFilter}
                        pickerSearch={pickerSearch}
                        onChangePickerSearch={onChangePickerSearch}
                        pickerSortBy={pickerSortBy}
                        onChangePickerSortBy={onChangePickerSortBy}
                        pickerCandidatesCount={pickerCandidatesCount}
                        paginatedPickerCandidates={
                          paginatedPickerCandidates
                        }
                        pickerPage={pickerPage}
                        pickerPageSize={pickerPageSize}
                        onPageChange={onPageChange}
                        onPageSizeChange={onPageSizeChange}
                        rankings={rankings}
                        selectedFootageIds={selectedFootageIds}
                        footageToAssignedRankMap={footageToAssignedRankMap}
                        onAssignFootageToRank={onAssignFootageToRank}
                        tagMap={tagMap}
                        settings={settings}
                      />
                    </div>
                  )}
                </div>

                {/*
                  DESKTOP (lg:flex): PURE HORIZONTAL SLIDING DUAL-DRAWER CONTAINER
                  Left Panel animates flexBasis / width: 91% <-> 30%
                  Right Panel animates flexBasis / width: 9% <-> 70%
                */}
                <div className="hidden lg:flex flex-row gap-3 items-stretch w-full overflow-hidden">
                  {/* LEFT DRAWER: 91% (Expanded Formula + Full 5-Rank Board) <-> 30% (Compact 5-Rank Summary) */}
                  <motion.div
                    initial={false}
                    animate={{
                      width: isFormulaFocused ? '91%' : '30%',
                      flexBasis: isFormulaFocused ? '91%' : '30%',
                    }}
                    transition={PANEL_SPRING}
                    className="min-w-[260px] shrink-0 overflow-hidden relative"
                  >
                    <AnimatePresence initial={false} mode="popLayout">
                      {isFormulaFocused ? (
                        /* Expanded Formula & Full 5-Rank Board (Slides in from Left to Right) */
                        <motion.div
                          key="left-expanded-formula"
                          initial={{ opacity: 0, x: -90 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -90 }}
                          transition={CONTENT_SLIDE_SPRING}
                          className="space-y-3 w-full"
                        >
                          {/* Full Quick Recipe Box */}
                          <div className="bg-[#fdfbf7] border border-[#e8dfd3] rounded-2xl p-4 space-y-3 shadow-2xs">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2 text-xs font-bold text-[#2d2926]">
                                <div className="w-7 h-7 rounded-lg bg-[#edf4ed] text-[#3b6845] flex items-center justify-center shrink-0">
                                  <Shuffle className="w-4 h-4" />
                                </div>
                                <div>
                                  <span className="text-sm block">
                                    เลือกสูตรผสมด่วน (คลิกเพื่อใส่ 5 คลิปอัตโนมัติ)
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <div className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-[#faf7f2] border border-[#e8dfd3] text-xs font-mono tabular-nums whitespace-nowrap">
                                  <span className="text-[#855621] font-bold">
                                    ใหม่ {selectedNewCount}/5
                                  </span>
                                  <span className="text-[#d5cbc0]">·</span>
                                  <span className="text-[#2b5435] font-bold">
                                    สด {selectedFreshCount}/5
                                  </span>
                                </div>

                                <motion.button
                                  type="button"
                                  whileHover={{ scale: 1.03 }}
                                  whileTap={{ scale: 0.97 }}
                                  onClick={() =>
                                    setWorkspaceMode('MANUAL_BROWSE')
                                  }
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#edf4ed] hover:bg-[#3b6845] text-[#244b2f] hover:text-white border border-[#bad8b9] text-xs font-bold transition-colors cursor-pointer whitespace-nowrap"
                                  title="หดฝั่งซ้ายแล้วสไลด์เปิดคลังคลิปด้านขวา"
                                >
                                  <PanelRightOpen className="w-3.5 h-3.5" />
                                  <span>สไลด์เปิดคลังเลือกเอง «</span>
                                </motion.button>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                              {RECIPES.map((rec) => {
                                const Icon = rec.icon;
                                const isRecActive = activeRecipe === rec.id;
                                return (
                                  <motion.button
                                    key={rec.id}
                                    type="button"
                                    whileHover={{ y: -2, scale: 1.01 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() =>
                                      onApplyRecipe && onApplyRecipe(rec.id)
                                    }
                                    className={`px-3 py-2.5 rounded-xl text-left border transition-colors cursor-pointer flex items-center gap-2 ${
                                      isRecActive
                                        ? 'bg-[#edf4ed] text-[#244b2f] border-[#bad8b9] ring-2 ring-[#a4c5a1]/40 shadow-xs'
                                        : 'bg-[#faf7f2] hover:bg-white text-[#4d4740] border-[#e8dfd3]'
                                    }`}
                                    title={rec.hint}
                                  >
                                    <Icon className="w-4 h-4 shrink-0 text-[#3b6845]" />
                                    <span className="text-xs font-bold truncate">
                                      {rec.title}
                                    </span>
                                  </motion.button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Full 5 Rank Slot Cards */}
                          <div className="space-y-2.5">
                            {rankings.map((slot, index) => (
                              <div key={slot.rank}>
                                <RankSlotCard
                                  slot={slot}
                                  footage={
                                    slot.footageId
                                      ? computedFootageMap[slot.footageId]
                                      : null
                                  }
                                  isActivePickerSlot={
                                    activeSlotRank === slot.rank
                                  }
                                  onActivatePicker={() =>
                                    onActivatePickerSlot(slot.rank)
                                  }
                                  onClearSlot={() =>
                                    onClearSlotByRank(slot.rank)
                                  }
                                  onMoveRank={(dir) =>
                                    onMoveSlotByIndex(index, dir)
                                  }
                                  onScriptChange={(script) =>
                                    onUpdateSlotScript(slot.rank, script)
                                  }
                                  onRankFieldChange={(field, val) =>
                                    onUpdateSlotRankFields?.(
                                      slot.rank,
                                      field,
                                      val
                                    )
                                  }
                                  canMoveUp={index > 0}
                                  canMoveDown={index < rankings.length - 1}
                                  onSlotDragStart={(rank) =>
                                    onActivatePickerSlot(rank)
                                  }
                                  onDropItemOnSlot={onDropItemOnSlot}
                                />
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      ) : (
                        /* Shrunken Left Panel: Collapsed Quick-Formula Banner + Compact 5-Rank Summary */
                        <motion.div
                          key="left-compact-summary"
                          initial={{ opacity: 0, x: -60 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -60 }}
                          transition={CONTENT_SLIDE_SPRING}
                          className="space-y-3 w-full"
                        >
                          {/* Shrunken Quick Formula Strip (Click to slide Formula back to full width!) */}
                          <div
                            onClick={() =>
                              setWorkspaceMode('FORMULA_FOCUSED')
                            }
                            className="bg-[#f4eee4] hover:bg-[#ebe2d3] border border-[#dfd4c4] hover:border-[#bad8b9] rounded-2xl p-3 cursor-pointer transition-colors group shadow-2xs space-y-2"
                            title="คลิกเพื่อสไลด์กางโหมดสูตรผสมด่วนกลับมาเต็มจอ"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="w-8 h-8 rounded-xl bg-[#edf4ed] group-hover:bg-[#3b6845] text-[#3b6845] group-hover:text-white flex items-center justify-center shrink-0 transition-colors">
                                  <Shuffle className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                  <div className="text-xs font-bold text-[#2d2926] truncate">
                                    เลือกสูตรผสมด่วน
                                  </div>
                                  <div className="text-[11px] text-[#3b6845] font-semibold truncate">
                                    คลิกกางเต็มจอ »
                                  </div>
                                </div>
                              </div>

                              <motion.div
                                animate={{ x: [0, 4, 0] }}
                                transition={{
                                  repeat: Infinity,
                                  duration: 1.6,
                                  ease: 'easeInOut',
                                }}
                                className="w-7 h-7 rounded-lg bg-white text-[#3b6845] border border-[#bad8b9] flex items-center justify-center shrink-0 shadow-2xs"
                              >
                                <ChevronRight className="w-4 h-4" />
                              </motion.div>
                            </div>

                            {/* Quick 1-click recipe buttons even while collapsed */}
                            <div
                              className="grid grid-cols-2 gap-1.5 pt-1 border-t border-[#e5dacb]"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {RECIPES.map((rec) => {
                                const isRecActive = activeRecipe === rec.id;
                                return (
                                  <button
                                    key={rec.id}
                                    type="button"
                                    onClick={() =>
                                      onApplyRecipe && onApplyRecipe(rec.id)
                                    }
                                    className={`px-2 py-1 rounded-lg text-[10px] font-bold truncate text-left transition-colors cursor-pointer border ${
                                      isRecActive
                                        ? 'bg-[#edf4ed] text-[#244b2f] border-[#bad8b9]'
                                        : 'bg-white hover:bg-[#faf7f2] text-[#4d4740] border-[#e2d8cb]'
                                    }`}
                                    title={rec.hint}
                                  >
                                    {rec.title}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Compact 5-Rank Summary Board */}
                          <div className="bg-[#fdfbf7] border border-[#e8dfd3] rounded-2xl p-3.5 space-y-2.5 shadow-xs">
                            <div className="flex items-center justify-between pb-2 border-b border-[#eee6da]">
                              <div className="flex items-center gap-1.5">
                                <ListOrdered className="w-4 h-4 text-[#3b6845]" />
                                <h3 className="text-xs font-bold text-[#2d2926]">
                                  สรุป 5 อันดับ ({selectedFootageIds.length}/5)
                                </h3>
                              </div>

                              <button
                                type="button"
                                onClick={() =>
                                  setWorkspaceMode('FORMULA_FOCUSED')
                                }
                                className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-bold text-[#244b2f] bg-[#edf4ed] hover:bg-[#3b6845] hover:text-white border border-[#bad8b9] rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                                title="สไลด์กางบอร์ดเต็มจอ"
                              >
                                <Maximize2 className="w-3 h-3" />
                                <span>กางเต็ม »</span>
                              </button>
                            </div>

                            <div className="space-y-1.5">
                              {rankings.map((slot, index) => {
                                const footage = slot.footageId
                                  ? computedFootageMap[slot.footageId]
                                  : null;
                                const isSlotActive =
                                  activeSlotRank === slot.rank;

                                return (
                                  <div
                                    key={slot.rank}
                                    onClick={() =>
                                      onActivatePickerSlot(slot.rank)
                                    }
                                    onDragOver={(e) => {
                                      e.preventDefault();
                                      e.dataTransfer.dropEffect = 'move';
                                    }}
                                    onDrop={(e) => {
                                      e.preventDefault();
                                      const raw =
                                        e.dataTransfer.getData(
                                          'application/json'
                                        );
                                      if (!raw) return;
                                      try {
                                        const payload = JSON.parse(
                                          raw
                                        ) as SlotDropPayload;
                                        onDropItemOnSlot(slot.rank, payload);
                                      } catch {
                                        // ignore malformed drop
                                      }
                                    }}
                                    className={`p-2.5 rounded-xl border transition-colors cursor-pointer ${
                                      isSlotActive
                                        ? 'border-[#3b6845] bg-[#edf4ed] ring-1 ring-[#3b6845]/40'
                                        : footage
                                        ? 'border-[#bad8b9] bg-white'
                                        : 'border-dashed border-[#e2d8cb] bg-[#faf7f2] hover:bg-white'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between gap-1.5">
                                      <div className="flex items-center gap-2 min-w-0">
                                        <span
                                          className={`w-5 h-5 rounded-md flex items-center justify-center font-mono font-extrabold text-[11px] shrink-0 ${
                                            footage
                                              ? 'bg-[#3b6845] text-white'
                                              : 'bg-[#e8dfd3] text-[#554d44]'
                                          }`}
                                        >
                                          {slot.rank}
                                        </span>

                                        {footage ? (
                                          <div className="flex items-center gap-2 min-w-0">
                                            <VideoThumbnailPreview
                                              footage={footage}
                                              size="xs"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setPreviewFootageId(footage.id);
                                              }}
                                            />
                                            <div className="min-w-0">
                                              <div className="flex items-center gap-1.5">
                                                <span className="font-mono font-bold text-xs text-[#2d2926]">
                                                  {footage.id}
                                                </span>
                                                <StatusBadge
                                                  status={footage.cooldownStatus}
                                                  daysSinceLastUse={
                                                    footage.daysSinceLastUsed
                                                  }
                                                  cooldownDays={
                                                    settings.cooldownDays
                                                  }
                                                  greenReadyDays={
                                                    settings.greenReadyDays
                                                  }
                                                  usageLast90Days={
                                                    footage.usageLast90Days
                                                  }
                                                  totalUsageCount={
                                                    footage.totalUsageCount
                                                  }
                                                  maxTotalUsageCount={
                                                    settings.maxTotalUsageCount
                                                  }
                                                  compact
                                                />
                                              </div>
                                              <p className="text-[11px] text-[#554d44] truncate max-w-[130px]">
                                                {footage.title}
                                              </p>
                                            </div>
                                          </div>
                                        ) : (
                                          <span className="text-[11px] font-medium text-[#8c8275]">
                                            ว่าง · กด [{slot.rank}] ที่คลิปขวา
                                          </span>
                                        )}
                                      </div>

                                      {footage && (
                                        <div className="flex items-center gap-0.5 shrink-0">
                                          <button
                                            type="button"
                                            disabled={index === 0}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              onMoveSlotByIndex(index, 'UP');
                                            }}
                                            className="w-5 h-5 rounded flex items-center justify-center text-[#787066] hover:text-[#2d2926] disabled:opacity-20 cursor-pointer"
                                            title="เลื่อนขึ้น"
                                          >
                                            <ArrowUp className="w-3 h-3" />
                                          </button>
                                          <button
                                            type="button"
                                            disabled={
                                              index === rankings.length - 1
                                            }
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              onMoveSlotByIndex(index, 'DOWN');
                                            }}
                                            className="w-5 h-5 rounded flex items-center justify-center text-[#787066] hover:text-[#2d2926] disabled:opacity-20 cursor-pointer"
                                            title="เลื่อนลง"
                                          >
                                            <ArrowDown className="w-3 h-3" />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              onClearSlotByRank(slot.rank);
                                            }}
                                            className="w-5 h-5 rounded flex items-center justify-center text-[#8e4537] hover:bg-[#fdf3ec] cursor-pointer"
                                            title="ถอดคลิปนี้ออก"
                                          >
                                            <X className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>

                  {/* RIGHT DRAWER: 9% (Slim Vertical Strip) <-> 70% (Expanded Candidate Footage Pool) */}
                  <motion.div
                    initial={false}
                    animate={{
                      width: isFormulaFocused ? '9%' : '70%',
                      flexBasis: isFormulaFocused ? '9%' : '70%',
                    }}
                    transition={PANEL_SPRING}
                    className="min-w-[72px] flex-1 overflow-hidden relative"
                  >
                    <AnimatePresence initial={false} mode="popLayout">
                      {isFormulaFocused ? (
                        /* Slim Vertical Strip on the Right (Click to slide open Candidate Footage Pool) */
                        <motion.button
                          key="right-collapsed-strip"
                          type="button"
                          initial={{ opacity: 0, x: 60 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 60 }}
                          transition={CONTENT_SLIDE_SPRING}
                          onClick={() => setWorkspaceMode('MANUAL_BROWSE')}
                          className="w-full h-full min-h-[420px] bg-[#f4eee4] hover:bg-[#ebe2d3] border-2 border-[#dfd4c4] hover:border-[#3b6845] rounded-2xl p-2.5 flex flex-col items-center justify-between gap-4 transition-colors cursor-pointer shadow-xs group"
                          title="คลิกเพื่อสไลด์กางคลังคลิป (เลือกเองจากคลัง 200+ รายการ)"
                        >
                          <div className="flex flex-col items-center gap-2">
                            <div className="w-10 h-10 rounded-2xl bg-[#edf4ed] text-[#3b6845] flex items-center justify-center group-hover:bg-[#3b6845] group-hover:text-white transition-colors shadow-2xs">
                              <Film className="w-5 h-5" />
                            </div>
                            <span className="px-2 py-0.5 rounded-lg bg-[#3b6845] text-white font-mono text-xs font-extrabold tabular-nums shadow-2xs">
                              {pickerCandidatesCount}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 my-auto">
                            <span className="[writing-mode:vertical-rl] text-xs font-extrabold text-[#4d4740] tracking-wider group-hover:text-[#244b2f] py-2 whitespace-nowrap">
                              เลือกเองจากคลัง ({pickerCandidatesCount} คลิป)
                            </span>
                          </div>

                          <div className="flex flex-col items-center gap-1.5">
                            <motion.div
                              animate={{ x: [0, -5, 0] }}
                              transition={{
                                repeat: Infinity,
                                duration: 1.4,
                                ease: 'easeInOut',
                              }}
                              className="w-8 h-8 rounded-xl bg-white group-hover:bg-[#3b6845] text-[#3b6845] group-hover:text-white border border-[#bad8b9] flex items-center justify-center transition-colors shadow-2xs"
                            >
                              <ChevronLeft className="w-4 h-4" />
                            </motion.div>
                            <span className="text-[11px] font-extrabold text-[#3b6845] group-hover:text-[#244b2f] whitespace-nowrap">
                              « สไลด์เปิด
                            </span>
                          </div>
                        </motion.button>
                      ) : (
                        /* Expanded Candidate Footage Pool Sliding In from Right */
                        <motion.div
                          key="right-expanded-pool"
                          initial={{ opacity: 0, x: 110 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 110 }}
                          transition={CONTENT_SLIDE_SPRING}
                          className="w-full"
                        >
                          <CandidateFootagePool
                            className="w-full"
                            isExpanded={true}
                            onCollapseToStrip={() =>
                              setWorkspaceMode('FORMULA_FOCUSED')
                            }
                            categoryGroups={categoryGroups}
                            activeGroup={activeGroup}
                            activeCategoryStat={activeCategoryStat}
                            productionTarget={productionTarget}
                            activeSubcategory={activeSubcategory}
                            currentSubcategories={currentSubcategories}
                            poolSubcategoryFilterId={poolSubcategoryFilterId}
                            onChangePoolSubcategoryFilterId={
                              onChangePoolSubcategoryFilterId
                            }
                            computedFootage={computedFootage}
                            liveCategoryStock={liveCategoryStock}
                            allowCrossCategory={allowCrossCategory}
                            onToggleCrossCategory={onToggleCrossCategory}
                            onEnableCrossCategory={onEnableCrossCategory}
                            poolFilterGroupId={poolFilterGroupId}
                            onChangePoolFilterGroupId={
                              onChangePoolFilterGroupId
                            }
                            poolQuickFilter={poolQuickFilter}
                            onChangePoolQuickFilter={onChangePoolQuickFilter}
                            pickerSearch={pickerSearch}
                            onChangePickerSearch={onChangePickerSearch}
                            pickerSortBy={pickerSortBy}
                            onChangePickerSortBy={onChangePickerSortBy}
                            pickerCandidatesCount={pickerCandidatesCount}
                            paginatedPickerCandidates={
                              paginatedPickerCandidates
                            }
                            pickerPage={pickerPage}
                            pickerPageSize={pickerPageSize}
                            onPageChange={onPageChange}
                            onPageSizeChange={onPageSizeChange}
                            rankings={rankings}
                            selectedFootageIds={selectedFootageIds}
                            footageToAssignedRankMap={footageToAssignedRankMap}
                            onAssignFootageToRank={onAssignFootageToRank}
                            tagMap={tagMap}
                            settings={settings}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </div>
              </div>
            </LayoutGroup>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};
