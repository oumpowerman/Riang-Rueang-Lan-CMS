import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight, ChevronDown, ChevronRight, Folder, FolderTree, Target, Layers, Sparkles, CheckCircle2, Plus } from 'lucide-react';
import { CategoryMatrixStat } from '../../../context/CMSContext';
import { EpisodeProductionTarget } from '../../../types/episode.types';
import { ComputedFootage } from '../../../types/footage.types';
import { CategoryGroup, CategoryTag } from '../../../types/tag.types';
import { GroupStockStat, LiveCategoryStock } from './builder.types';

interface BuilderStep1CategoryTargetProps {
  isOpen: boolean;
  onToggle: () => void;
  onNextStep: () => void;
  onSkipToStep3: () => void;
  groupStockStats: GroupStockStat[];
  selectedGroupId: string;
  activeGroup: CategoryGroup | null;
  categoriesInSelectedGroup: CategoryMatrixStat[];
  mainCategoryTagId: string;
  activeCategoryStat: CategoryMatrixStat | null;
  liveCategoryStock: LiveCategoryStock;
  productionTarget: EpisodeProductionTarget;
  targetSubcategoryId: string | null;
  activeSubcategory: CategoryTag | null;
  currentSubcategories: CategoryTag[];
  computedFootage: ComputedFootage[];
  onSelectGroup: (groupId: string) => void;
  onSelectCategory: (tagId: string, autoFillWithRecipe?: boolean) => void;
  onSelectVarietyMode: () => void;
  onSelectSoloMode: () => void;
  onSelectSubcategory: (subId: string, subName: string) => void;
  onOpenStatusRuleModal: () => void;
  onOpenThreeTierManager: () => void;
}

const SLIDE_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

export const BuilderStep1CategoryTarget: React.FC<BuilderStep1CategoryTargetProps> = ({
  isOpen,
  onToggle,
  onNextStep,
  onSkipToStep3,
  groupStockStats,
  selectedGroupId,
  activeGroup,
  categoriesInSelectedGroup,
  mainCategoryTagId,
  activeCategoryStat,
  liveCategoryStock,
  productionTarget,
  targetSubcategoryId,
  activeSubcategory,
  currentSubcategories,
  computedFootage,
  onSelectGroup,
  onSelectCategory,
  onSelectVarietyMode,
  onSelectSoloMode,
  onSelectSubcategory,
  onOpenStatusRuleModal,
  onOpenThreeTierManager,
}) => {
  return (
    <motion.section
      layout="position"
      transition={{ duration: 0.28, ease: SLIDE_EASE }}
      className={`rounded-2xl border p-4 transition-colors duration-200 ${
        isOpen
          ? 'border-sky-200/90 bg-sky-50/40'
          : 'border-slate-200 bg-white shadow-2xs hover:border-sky-200'
      }`}
    >
      {/* Persistent Accordion Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          onClick={!isOpen ? onToggle : undefined}
          className={`flex flex-wrap items-center gap-2 text-xs ${
            !isOpen ? 'cursor-pointer' : ''
          }`}
        >
          <span
            className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
              isOpen
                ? 'bg-sky-600 text-white'
                : 'bg-sky-100 text-sky-900'
            }`}
          >
            {isOpen ? 'ขั้นที่ 1' : 'ขั้นที่ 1 · หมวดหมู่เป้าหมาย'}
          </span>

          {isOpen ? (
            <h2 className="text-sm font-bold text-slate-900">
              เลือกหมวดหมู่ที่ต้องการผลิตคลิป
            </h2>
          ) : (
            <motion.div
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-wrap items-center gap-1.5"
            >
              <span className="font-bold text-slate-900 flex items-center gap-1">
                {!activeGroup?.icon || activeGroup.icon === '📁' ? (
                  <Folder className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                ) : (
                  <span>{activeGroup.icon}</span>
                )}
                <span>{activeGroup?.name}</span>
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-bold text-indigo-700">
                #{activeCategoryStat?.tag.name || 'เลือกหมวดหลัก'}
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-600 font-semibold inline-flex items-center gap-1">
                {productionTarget === 'SINGLE_SUBCATEGORY_SPECIAL' && activeSubcategory ? (
                  <>
                    <Target className="w-3 h-3 text-amber-600" />
                    <span>เจาะจง: {activeSubcategory.name}</span>
                  </>
                ) : (
                  <>
                    <Layers className="w-3 h-3 text-emerald-600" />
                    <span>รวมหลากประเด็น</span>
                  </>
                )}
              </span>
            </motion.div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {activeCategoryStat && (
            <div
              className={`rounded-xl px-3 py-1.5 flex flex-wrap items-center gap-2 font-mono tabular-nums ${
                isOpen
                  ? 'bg-white border border-sky-200'
                  : 'text-[11px] text-slate-600'
              }`}
            >
              {isOpen && (
                <span className="font-sans font-bold text-slate-800">
                  สต็อก #{activeCategoryStat.tag.name}:
                </span>
              )}
              <span className={`inline-flex items-center gap-1 ${isOpen ? 'text-sky-800 font-bold' : ''}`}>
                <Sparkles className="w-3 h-3 text-sky-600" />
                <span>ใหม่ว่าง {liveCategoryStock.remainingNew}</span>
                {isOpen ? `/${liveCategoryStock.totalNew}` : ''}
              </span>
              <span className="text-slate-300">·</span>
              <span className={`inline-flex items-center gap-1 ${isOpen ? 'text-emerald-800 font-bold' : ''}`}>
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>เก่าสดว่าง {liveCategoryStock.remainingFresh}</span>
                {isOpen ? `/${liveCategoryStock.totalFresh}` : ''}
              </span>
              {isOpen && (
                <button
                  type="button"
                  onClick={onOpenStatusRuleModal}
                  className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-sans font-semibold text-[11px] transition-colors cursor-pointer"
                >
                  เกณฑ์สี
                </button>
              )}
            </div>
          )}

          {isOpen ? (
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={onNextStep}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold transition-colors cursor-pointer"
            >
              <span>ไปขั้นที่ 2: เลือกสูตรผสม</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </motion.button>
          ) : (
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={onToggle}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold transition-colors cursor-pointer"
            >
              <span>เปลี่ยนหมวดหมู่</span>
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
            key="step1-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: SLIDE_EASE }}
            className="overflow-hidden"
          >
            <motion.div
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -10, opacity: 0 }}
              transition={{ duration: 0.24, ease: 'easeOut' }}
              className="pt-3.5 space-y-3.5"
            >
              {/* TIER 0: Compact Segmented Group Selector */}
              <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-700">
                    1. กลุ่มหมวดหมู่:
                  </span>

                  <button
                    type="button"
                    onClick={onOpenThreeTierManager}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-900 text-[11px] font-bold transition-colors cursor-pointer"
                  >
                    <FolderTree className="w-3.5 h-3.5 text-indigo-600" />
                    <span>จัดการหมวดหมู่</span>
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {groupStockStats.map((gStat) => {
                    const isGroupSelected = gStat.group.id === selectedGroupId;
                    return (
                      <motion.button
                        key={gStat.group.id}
                        type="button"
                        whileHover={{ y: -1 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => onSelectGroup(gStat.group.id)}
                        className={`px-3 py-2 rounded-xl border text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer ${
                          isGroupSelected
                            ? 'bg-purple-600 text-white border-purple-600 shadow-2xs'
                            : 'bg-slate-50 text-slate-800 border-slate-200 hover:border-purple-300 hover:bg-purple-50/40'
                        }`}
                      >
                        <span>{gStat.group.icon}</span>
                        <span>{gStat.group.name}</span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-mono tabular-nums ${
                            isGroupSelected
                              ? 'bg-purple-700 text-white'
                              : gStat.producibleEpisodesCount > 0
                              ? 'bg-emerald-100 text-emerald-900'
                              : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {gStat.producibleEpisodesCount} EP
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* TIER 1: Main Category Grid */}
              <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-700">
                    2. หมวดหมู่หลักในกลุ่ม {activeGroup?.name}:
                  </span>
                  <span className="text-[11px] font-mono tabular-nums text-slate-500">
                    {categoriesInSelectedGroup.length} หมวดหลัก
                  </span>
                </div>

                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={selectedGroupId}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                  >
                    {categoriesInSelectedGroup.length === 0 ? (
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-2">
                        <p className="text-xs font-bold text-slate-700">
                          ยังไม่มีหมวดหมู่หลักในกลุ่ม &ldquo;{activeGroup?.name}&rdquo;
                        </p>
                        <button
                          type="button"
                          onClick={onOpenThreeTierManager}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>เพิ่มหมวดหมู่หลัก</span>
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {categoriesInSelectedGroup.map((stat) => {
                          const isSelected = stat.tag.id === mainCategoryTagId;
                          const isReady5 = stat.usableCount >= 5;

                          return (
                            <motion.button
                              key={stat.tag.id}
                              type="button"
                              whileHover={{ y: -2 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => onSelectCategory(stat.tag.id, true)}
                              className={`text-left p-2.5 rounded-xl border transition-colors flex flex-col justify-between gap-1.5 cursor-pointer ${
                                isSelected
                                  ? 'bg-indigo-50 text-indigo-950 border-indigo-500 ring-1 ring-indigo-300'
                                  : isReady5
                                  ? 'bg-white text-slate-900 border-emerald-300 hover:border-indigo-400'
                                  : 'bg-slate-50/70 text-slate-700 border-slate-200 hover:border-slate-400'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-1.5">
                                <span className="text-xs font-bold truncate">
                                  #{stat.tag.name}
                                </span>
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold tabular-nums shrink-0 ${
                                    isReady5
                                      ? isSelected
                                        ? 'bg-emerald-600 text-white'
                                        : 'bg-emerald-100 text-emerald-900'
                                      : 'bg-amber-100 text-amber-900'
                                  }`}
                                >
                                  {isReady5
                                    ? `${stat.producibleEpisodesCount} EP`
                                    : `${stat.usableCount}/5 ฟุต`}
                                </span>
                              </div>

                              <div className="flex items-center justify-between text-[11px] font-mono tabular-nums text-slate-600">
                                <span className="inline-flex items-center gap-1.5">
                                  <span className="inline-flex items-center gap-0.5 text-sky-700 font-bold">
                                    <Sparkles className="w-2.5 h-2.5" />
                                    <span>{stat.newCount}</span>
                                  </span>
                                  <span>·</span>
                                  <span className="inline-flex items-center gap-0.5 text-emerald-700 font-bold">
                                    <CheckCircle2 className="w-2.5 h-2.5" />
                                    <span>{stat.readyCount}</span>
                                  </span>
                                </span>
                                <span>หมวดย่อย {stat.subcategoriesCount}</span>
                              </div>
                            </motion.button>
                          );
                        })}
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* TIER 2: Subcategory Scope Switcher */}
              <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-700">
                    3. ขอบเขตหมวดหมู่ย่อย:
                  </span>

                  <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={onSelectVarietyMode}
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        productionTarget === 'MAIN_CATEGORY_VARIETY'
                          ? 'bg-white text-slate-900 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Layers className="w-3 h-3 text-indigo-600" />
                      <span>รวมหลากประเด็นในหมวดหลัก</span>
                    </button>

                    <button
                      type="button"
                      onClick={onSelectSoloMode}
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        productionTarget === 'SINGLE_SUBCATEGORY_SPECIAL'
                          ? 'bg-amber-500 text-slate-950 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Target className="w-3 h-3 text-slate-900" />
                      <span>เจาะจงหมวดย่อยเรื่องเดียว ({currentSubcategories.length})</span>
                    </button>
                  </div>
                </div>

                <AnimatePresence initial={false}>
                  {productionTarget === 'SINGLE_SUBCATEGORY_SPECIAL' && (
                    <motion.div
                      key="solo-mode"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25, ease: SLIDE_EASE }}
                      className="overflow-hidden"
                    >
                      <div className="pt-1.5">
                        {currentSubcategories.length === 0 ? (
                          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-amber-900 bg-amber-50 border border-amber-200 rounded-xl p-2.5">
                            <span>หมวดหลักนี้ยังไม่มีหมวดหมู่ย่อย</span>
                            <button
                              type="button"
                              onClick={onOpenThreeTierManager}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>เพิ่มหมวดหมู่ย่อย</span>
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {currentSubcategories.map((sub) => {
                              const isSubSelected = targetSubcategoryId === sub.id;
                              const subClips = computedFootage.filter((ft) =>
                                ft.tags.includes(sub.id)
                              );
                              const subUsable = subClips.filter(
                                (f) =>
                                  f.cooldownStatus === 'NEW_UNTOUCHED' ||
                                  f.cooldownStatus === 'READY_FRESH'
                              ).length;

                              return (
                                <motion.button
                                  key={sub.id}
                                  type="button"
                                  whileHover={{ y: -1 }}
                                  whileTap={{ scale: 0.97 }}
                                  onClick={() => onSelectSubcategory(sub.id, sub.name)}
                                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                                    isSubSelected
                                      ? 'bg-amber-500 text-slate-950 ring-1 ring-amber-400'
                                      : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-amber-50'
                                  }`}
                                >
                                  <span>{sub.name}</span>
                                  <span className="px-1.5 py-0.5 rounded bg-white/80 font-mono text-[10px] tabular-nums">
                                    {subUsable} ฟุต
                                  </span>
                                </motion.button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Step 1 Action Footer */}
              <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={onSkipToStep3}
                  className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold transition-colors cursor-pointer"
                >
                  ข้ามไปจัดอันดับเอง (ขั้นที่ 3)
                </motion.button>
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={onNextStep}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  <span>ถัดไป: เลือกสูตรผสมอัตโนมัติ (ขั้นที่ 2)</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
};
