import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight, ChevronDown, RotateCcw } from 'lucide-react';
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
import { RankSlotCard } from '../RankSlotCard';
import { CandidateFootagePool } from './CandidateFootagePool';
import {
  LiveCategoryStock,
  PickerSortBy,
  PoolQuickFilter,
  RankNumber,
  SlotDropPayload,
} from './builder.types';

interface BuilderStep3RankingWorkspaceProps {
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
  onDropItemOnSlot: (targetRank: RankNumber, payload: SlotDropPayload) => void;
  onAssignFootageToRank: (targetRank: RankNumber, footageId: string) => void;
  footageToAssignedRankMap: Record<string, RankNumber>;
  categoryGroups: CategoryGroup[];
  activeGroup: CategoryGroup | null;
  activeCategoryStat: CategoryMatrixStat | null;
  productionTarget: EpisodeProductionTarget;
  activeSubcategory: CategoryTag | null;
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
}

const SLIDE_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

export const BuilderStep3RankingWorkspace: React.FC<
  BuilderStep3RankingWorkspaceProps
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
  onDropItemOnSlot,
  onAssignFootageToRank,
  footageToAssignedRankMap,
  categoryGroups,
  activeGroup,
  activeCategoryStat,
  productionTarget,
  activeSubcategory,
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
}) => {
  return (
    <motion.section
      layout="position"
      transition={{ duration: 0.28, ease: SLIDE_EASE }}
      className={`rounded-2xl border p-4 transition-colors duration-200 ${
        isOpen
          ? 'border-emerald-200/90 bg-emerald-50/30'
          : 'border-slate-200 bg-white shadow-2xs hover:border-emerald-200'
      }`}
    >
      {/* Persistent Accordion Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div
          onClick={!isOpen ? onToggle : undefined}
          className={`flex flex-wrap items-center gap-2 text-xs ${
            !isOpen ? 'cursor-pointer' : ''
          }`}
        >
          <span
            className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
              isOpen
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-100 text-emerald-900'
            }`}
          >
            {isOpen ? 'ขั้นที่ 3' : 'ขั้นที่ 3 · จัดเรียงอันดับ 1–5'}
          </span>

          {isOpen ? (
            <h2 className="text-sm font-bold text-slate-900">
              จัดเรียงฟุตเทจอันดับ 1 ถึง 5
            </h2>
          ) : (
            <motion.div
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-wrap items-center gap-2"
            >
              <span
                className={`px-2 py-0.5 rounded-md font-mono font-bold tabular-nums ${
                  selectedFootageIds.length === 5
                    ? 'bg-emerald-600 text-white'
                    : 'bg-amber-100 text-amber-900'
                }`}
              >
                เลือกแล้ว {selectedFootageIds.length}/5 อันดับ
              </span>
              {selectedFootageIds.length > 0 && (
                <div className="hidden sm:flex flex-wrap items-center gap-1 font-mono text-[11px] text-slate-600">
                  {rankings.map((slot) =>
                    slot.footageId ? (
                      <span
                        key={slot.rank}
                        className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700"
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
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-rose-700 bg-white border border-rose-200 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>ล้างทั้งหมด</span>
                </motion.button>
              )}

              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={onNextStep}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl transition-colors cursor-pointer ${
                  selectedFootageIds.length === 5
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                <span>ไปขั้นที่ 4: ตรวจสอบชื่อ & บันทึก</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </motion.button>
            </>
          ) : (
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={onToggle}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors cursor-pointer"
            >
              <span>แก้ไขการจัดอันดับ</span>
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

      {/* Animated Slide Up / Down Accordion Body */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="step3-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.32, ease: SLIDE_EASE }}
            className="overflow-hidden"
          >
            <motion.div
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -10, opacity: 0 }}
              transition={{ duration: 0.24, ease: 'easeOut' }}
              className="pt-4 grid grid-cols-1 xl:grid-cols-12 gap-5 items-start"
            >
              {/* Left Column (6 cols): Rank Slots 1 -> 2 -> 3 -> 4 -> 5 */}
              <div className="xl:col-span-6 space-y-2.5">
                {rankings.map((slot, index) => (
                  <RankSlotCard
                    key={slot.rank}
                    slot={slot}
                    footage={
                      slot.footageId ? computedFootageMap[slot.footageId] : null
                    }
                    isActivePickerSlot={activeSlotRank === slot.rank}
                    onActivatePicker={() => onActivatePickerSlot(slot.rank)}
                    onClearSlot={() => onClearSlotByRank(slot.rank)}
                    onMoveRank={(dir) => onMoveSlotByIndex(index, dir)}
                    onScriptChange={(script) =>
                      onUpdateSlotScript(slot.rank, script)
                    }
                    canMoveUp={index > 0}
                    canMoveDown={index < rankings.length - 1}
                    onSlotDragStart={(rank) => onActivatePickerSlot(rank)}
                    onDropItemOnSlot={onDropItemOnSlot}
                  />
                ))}
              </div>

              {/* Right Column (6 cols): Draggable Footage Pool */}
              <CandidateFootagePool
                categoryGroups={categoryGroups}
                activeGroup={activeGroup}
                activeCategoryStat={activeCategoryStat}
                productionTarget={productionTarget}
                activeSubcategory={activeSubcategory}
                liveCategoryStock={liveCategoryStock}
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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
};
