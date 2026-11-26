import React, { useState } from 'react';
import { AnimatePresence, LayoutGroup, motion } from 'motion/react';
import {
  ArrowRight,
  ChevronDown,
  ChevronLeft,
  Film,
  ListOrdered,
  RotateCcw,
} from 'lucide-react';
import { CategoryMatrixStat } from '../../../context/CMSContext';
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
import { RankSlotCard } from '../RankSlotCard';
import {
  BuilderScopeMatchMode,
  LiveCategoryStock,
  PickerSortBy,
  PoolCoTagChip,
  PoolQuickFilter,
  PoolTabCounts,
  RankNumber,
  RecipeShortfallNotice,
  SlotDropPayload,
} from './builder.types';
import { BuilderStep2CompactRankRail } from './BuilderStep2CompactRankRail';
import { BuilderStep2QuickRecipeBar } from './BuilderStep2QuickRecipeBar';
import { CandidateFootagePool } from './CandidateFootagePool';

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
  scopeSummaryLabel?: string;
  productionTarget: EpisodeProductionTarget;
  activeSubcategory: CategoryTag | null;
  currentSubcategories?: CategoryTag[];
  poolCoTagChips?: PoolCoTagChip[];
  coTagAllCount?: number;
  poolCoTagFilterIds?: string[];
  poolCoTagMatchMode?: BuilderScopeMatchMode;
  onChangePoolCoTagMatchMode?: (mode: BuilderScopeMatchMode) => void;
  onTogglePoolCoTag?: (tagId: string) => void;
  onClearPoolCoTags?: () => void;
  computedFootage?: ComputedFootage[];
  liveCategoryStock: LiveCategoryStock;
  poolTabCounts?: PoolTabCounts;
  allowCrossCategory: boolean;
  onToggleCrossCategory: () => void;
  onEnableCrossCategory: () => void;
  onDisableCrossCategory?: () => void;
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
  activeRecipe?: MixRecipeId;
  onApplyRecipe?: (recipe: MixRecipeId) => void;
  recipeShortfallNotice?: RecipeShortfallNotice | null;
  onDismissRecipeShortfall?: () => void;
  onSwitchToOrAndRefill?: () => void;
  onEnableCrossCategoryAndRefill?: () => void;
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
  scopeSummaryLabel,
  productionTarget,
  activeSubcategory,
  currentSubcategories = [],
  poolCoTagChips,
  coTagAllCount,
  poolCoTagFilterIds = [],
  poolCoTagMatchMode = 'AND',
  onChangePoolCoTagMatchMode,
  onTogglePoolCoTag,
  onClearPoolCoTags,
  computedFootage = [],
  liveCategoryStock,
  poolTabCounts,
  allowCrossCategory,
  onToggleCrossCategory,
  onEnableCrossCategory,
  onDisableCrossCategory,
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
  recipeShortfallNotice = null,
  onDismissRecipeShortfall,
  onSwitchToOrAndRefill,
  onEnableCrossCategoryAndRefill,
}) => {
  const [workspaceMode, setWorkspaceMode] =
    useState<WorkspaceLayoutMode>('FORMULA_FOCUSED');

  const isFormulaFocused = workspaceMode === 'FORMULA_FOCUSED';

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
            className={`px-2.5 py-1 rounded-lg font-bold ${
              isOpen
                ? 'bg-[#3b6845] text-white'
                : 'bg-[#edf4ed] text-[#2b5435]'
            }`}
          >
            ขั้นที่ 2
          </span>

          {isOpen ? (
            <h2 className="text-sm font-bold text-[#2d2926]">
              จัดเรียง 5 อันดับ &amp; คัดคลิป
            </h2>
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
                  className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 text-xs font-bold text-[#8e4537] bg-[#fdf3ec] border border-[#f5d7cf] hover:bg-[#fae6de] rounded-xl cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>ล้าง 5 อันดับ</span>
                </motion.button>
              )}

              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={onNextStep}
                className={`inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 text-xs font-bold rounded-xl cursor-pointer border ${
                  selectedFootageIds.length === 5
                    ? 'bg-[#3b6845] hover:bg-[#2c5234] text-white border-[#3b6845] shadow-xs'
                    : 'bg-[#faf7f2] hover:bg-white text-[#4d4740] border-[#e8dfd3]'
                }`}
              >
                <span>ไปขั้นที่ 3</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </motion.button>
            </>
          ) : (
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={onToggle}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#f4eee4] hover:bg-[#eae1d4] text-[#4d4740] text-xs font-bold cursor-pointer"
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
                {/* MOBILE & TABLET (< lg): 2-Tab Segmented Switcher */}
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
                      <span className="truncate tabular-nums">
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
                      <span className="truncate tabular-nums">
                        คลังฟุตเทจ ({pickerCandidatesCount})
                      </span>
                    </button>
                  </div>

                  {isFormulaFocused ? (
                    <div className="space-y-3 w-full">
                      <BuilderStep2QuickRecipeBar
                        compact
                        selectedNewCount={selectedNewCount}
                        selectedFreshCount={selectedFreshCount}
                        activeRecipe={activeRecipe}
                        onApplyRecipe={onApplyRecipe}
                        onOpenManualPool={() => setWorkspaceMode('MANUAL_BROWSE')}
                        allowCrossCategory={allowCrossCategory}
                        onDisableCrossCategory={onDisableCrossCategory}
                        recipeShortfallNotice={recipeShortfallNotice}
                        onDismissRecipeShortfall={onDismissRecipeShortfall}
                        onSwitchToOrAndRefill={onSwitchToOrAndRefill}
                        onEnableCrossCategoryAndRefill={
                          onEnableCrossCategoryAndRefill
                        }
                      />

                      <div className="space-y-2">
                        {rankings.map((slot, index) => (
                          <RankSlotCard
                            key={slot.rank}
                            slot={slot}
                            footage={
                              slot.footageId
                                ? computedFootageMap[slot.footageId]
                                : null
                            }
                            isActivePickerSlot={activeSlotRank === slot.rank}
                            onActivatePicker={() => {
                              onActivatePickerSlot(slot.rank);
                              setWorkspaceMode('MANUAL_BROWSE');
                            }}
                            onClearSlot={() => onClearSlotByRank(slot.rank)}
                            onMoveRank={(dir) => onMoveSlotByIndex(index, dir)}
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
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2.5 w-full">
                      {/* Compact Mini Rank Strip on Mobile */}
                      <div className="flex items-center gap-1 p-2 rounded-xl bg-[#fdfbf7] border border-[#e8dfd3] overflow-x-auto scrollbar-thin">
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

                      <CandidateFootagePool
                        className="w-full"
                        isExpanded={false}
                        categoryGroups={categoryGroups}
                        activeGroup={activeGroup}
                        activeCategoryStat={activeCategoryStat}
                        scopeSummaryLabel={scopeSummaryLabel}
                        productionTarget={productionTarget}
                        activeSubcategory={activeSubcategory}
                        currentSubcategories={currentSubcategories}
                        poolCoTagChips={poolCoTagChips}
                        coTagAllCount={coTagAllCount}
                        poolCoTagFilterIds={poolCoTagFilterIds}
                        poolCoTagMatchMode={poolCoTagMatchMode}
                        onChangePoolCoTagMatchMode={onChangePoolCoTagMatchMode}
                        onTogglePoolCoTag={onTogglePoolCoTag}
                        onClearPoolCoTags={onClearPoolCoTags}
                        computedFootage={computedFootage}
                        liveCategoryStock={liveCategoryStock}
                        poolTabCounts={poolTabCounts}
                        allowCrossCategory={allowCrossCategory}
                        onToggleCrossCategory={onToggleCrossCategory}
                        onEnableCrossCategory={onEnableCrossCategory}
                        poolFilterGroupId={poolFilterGroupId}
                        onChangePoolFilterGroupId={onChangePoolFilterGroupId}
                        poolQuickFilter={poolQuickFilter}
                        onChangePoolQuickFilter={onChangePoolQuickFilter}
                        pickerSearch={pickerSearch}
                        onChangePickerSearch={onChangePickerSearch}
                        pickerSortBy={pickerSortBy}
                        onChangePickerSortBy={onChangePickerSortBy}
                        pickerCandidatesCount={pickerCandidatesCount}
                        paginatedPickerCandidates={paginatedPickerCandidates}
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

                {/* DESKTOP (lg:flex): SLIDING DUAL-DRAWER CONTAINER */}
                <div className="hidden lg:flex flex-row gap-3 items-stretch w-full overflow-hidden">
                  {/* LEFT DRAWER: 91% (Board + Recipe Bar) <-> 30% (Compact Summary Rail) */}
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
                        <motion.div
                          key="left-expanded-formula"
                          initial={{ opacity: 0, x: -90 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -90 }}
                          transition={CONTENT_SLIDE_SPRING}
                          className="space-y-3 w-full"
                        >
                          <BuilderStep2QuickRecipeBar
                            selectedNewCount={selectedNewCount}
                            selectedFreshCount={selectedFreshCount}
                            activeRecipe={activeRecipe}
                            onApplyRecipe={onApplyRecipe}
                            showManualPoolButton
                            onOpenManualPool={() =>
                              setWorkspaceMode('MANUAL_BROWSE')
                            }
                            allowCrossCategory={allowCrossCategory}
                            onDisableCrossCategory={onDisableCrossCategory}
                            recipeShortfallNotice={recipeShortfallNotice}
                            onDismissRecipeShortfall={onDismissRecipeShortfall}
                            onSwitchToOrAndRefill={onSwitchToOrAndRefill}
                            onEnableCrossCategoryAndRefill={
                              onEnableCrossCategoryAndRefill
                            }
                          />

                          <div className="space-y-2.5">
                            {rankings.map((slot, index) => (
                              <RankSlotCard
                                key={slot.rank}
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
                                onClearSlot={() => onClearSlotByRank(slot.rank)}
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
                            ))}
                          </div>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="left-compact-summary"
                          initial={{ opacity: 0, x: -60 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -60 }}
                          transition={CONTENT_SLIDE_SPRING}
                          className="w-full"
                        >
                          <BuilderStep2CompactRankRail
                            rankings={rankings}
                            computedFootageMap={computedFootageMap}
                            selectedFootageIds={selectedFootageIds}
                            activeSlotRank={activeSlotRank}
                            settings={settings}
                            onExpandToFormulaFocused={() =>
                              setWorkspaceMode('FORMULA_FOCUSED')
                            }
                            onActivatePickerSlot={onActivatePickerSlot}
                            onDropItemOnSlot={onDropItemOnSlot}
                            onMoveSlotByIndex={onMoveSlotByIndex}
                            onClearSlotByRank={onClearSlotByRank}
                            recipeShortfallNotice={recipeShortfallNotice}
                            onDismissRecipeShortfall={onDismissRecipeShortfall}
                            onSwitchToOrAndRefill={onSwitchToOrAndRefill}
                            onEnableCrossCategoryAndRefill={
                              onEnableCrossCategoryAndRefill
                            }
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>

                  {/* RIGHT DRAWER: 9% (Slim Vertical Strip) <-> 70% (Candidate Footage Pool) */}
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
                        <motion.button
                          key="right-collapsed-strip"
                          type="button"
                          initial={{ opacity: 0, x: 60 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 60 }}
                          transition={CONTENT_SLIDE_SPRING}
                          onClick={() => setWorkspaceMode('MANUAL_BROWSE')}
                          className="w-full h-full min-h-[420px] bg-[#f4eee4] hover:bg-[#ebe2d3] border-2 border-[#dfd4c4] hover:border-[#3b6845] rounded-2xl p-2.5 flex flex-col items-center justify-between gap-4 cursor-pointer shadow-xs group"
                          title="เปิดคลังฟุตเทจ"
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
                              คลังฟุตเทจ ({pickerCandidatesCount})
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
                              className="w-8 h-8 rounded-xl bg-white group-hover:bg-[#3b6845] text-[#3b6845] group-hover:text-white border border-[#bad8b9] flex items-center justify-center shadow-2xs"
                            >
                              <ChevronLeft className="w-4 h-4" />
                            </motion.div>
                            <span className="text-[11px] font-extrabold text-[#3b6845] group-hover:text-[#244b2f] whitespace-nowrap">
                              เปิดคลัง
                            </span>
                          </div>
                        </motion.button>
                      ) : (
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
                            scopeSummaryLabel={scopeSummaryLabel}
                            productionTarget={productionTarget}
                            activeSubcategory={activeSubcategory}
                            currentSubcategories={currentSubcategories}
                            poolCoTagChips={poolCoTagChips}
                            coTagAllCount={coTagAllCount}
                            poolCoTagFilterIds={poolCoTagFilterIds}
                            poolCoTagMatchMode={poolCoTagMatchMode}
                            onChangePoolCoTagMatchMode={
                              onChangePoolCoTagMatchMode
                            }
                            onTogglePoolCoTag={onTogglePoolCoTag}
                            onClearPoolCoTags={onClearPoolCoTags}
                            computedFootage={computedFootage}
                            liveCategoryStock={liveCategoryStock}
                            poolTabCounts={poolTabCounts}
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
