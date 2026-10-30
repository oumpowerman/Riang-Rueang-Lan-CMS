import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight, ChevronDown, ChevronRight, Folder, Target, Layers, Sparkles, CheckCircle2 } from 'lucide-react';
import { CategoryMatrixStat } from '../../../context/CMSContext';
import { EpisodeProductionTarget } from '../../../types/episode.types';
import { ComputedFootage } from '../../../types/footage.types';
import { CategoryGroup, CategoryTag } from '../../../types/tag.types';
import { CategoryGroupIcon } from '../../ui/CategoryGroupIcon';
import { GroupStockStat, LiveCategoryStock } from './builder.types';

interface BuilderStep1CategoryTargetProps {
  isOpen: boolean;
  onToggle: () => void;
  onNextStep: () => void;
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
  onOpenStatusRuleModal?: () => void;
}

const SLIDE_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

export const BuilderStep1CategoryTarget: React.FC<BuilderStep1CategoryTargetProps> = ({
  isOpen,
  onToggle,
  onNextStep,
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
}) => {
  return (
    <motion.section
      layout="position"
      transition={{ duration: 0.28, ease: SLIDE_EASE }}
      className={`rounded-2xl border p-4 transition-colors duration-200 ${
        isOpen
          ? 'border-[#bad8b9] bg-[#f9fbf8]'
          : 'border-[#e8dfd3] bg-[#fdfbf7] shadow-xs hover:border-[#bad8b9]'
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
                ? 'bg-[#3b6845] text-white'
                : 'bg-[#edf4ed] text-[#2b5435]'
            }`}
          >
            {isOpen ? 'ขั้นที่ 1' : 'ขั้นที่ 1 · หมวดหมู่เป้าหมาย'}
          </span>

          {isOpen ? (
            <h2 className="text-sm font-bold text-[#2d2926]">
              เลือกหมวดหมู่ที่ต้องการผลิตคลิป 5 อันดับ
            </h2>
          ) : (
            <motion.div
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-wrap items-center gap-1.5"
            >
              <span className="font-semibold text-[#787066]">เลือกแล้ว:</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#f3ede3] text-[#4d4740] font-semibold text-xs">
                <Folder className="w-3 h-3 text-[#7b5d3a]" />
                <span>{activeGroup?.name || 'ไม่ระบุกลุ่ม'}</span>
              </span>
              <ChevronRight className="w-3 h-3 text-[#b8ada0]" />
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#edf4ed] text-[#2b5435] border border-[#cfdece] font-bold text-xs">
                <span>#{activeCategoryStat?.tag.name || 'เลือกหมวด'}</span>
              </span>
              {productionTarget === 'SINGLE_SUBCATEGORY_SPECIAL' && activeSubcategory ? (
                <>
                  <ChevronRight className="w-3 h-3 text-[#b8ada0]" />
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#fdf3ec] text-[#8e4537] border border-[#f5d7cf] font-bold text-xs">
                    <Target className="w-3 h-3 text-[#a34c3c]" />
                    <span>เจาะจง: {activeSubcategory.name}</span>
                  </span>
                </>
              ) : null}
            </motion.div>
          )}
        </div>

        {/* Header Right: Stock Badge + Action Button */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {activeCategoryStat && (
            <div
              className={`rounded-xl px-3 py-1.5 flex flex-wrap items-center gap-2 font-mono tabular-nums ${
                isOpen
                  ? 'bg-white border border-[#e2d8cb]'
                  : 'text-[11px] text-[#716960]'
              }`}
            >
              {isOpen && (
                <span className="font-sans font-bold text-[#3d3832]">
                  สต็อก #{activeCategoryStat.tag.name}:
                </span>
              )}
              <span className={`inline-flex items-center gap-1 ${isOpen ? 'text-[#855621] font-bold' : ''}`}>
                <Sparkles className="w-3 h-3 text-[#b37731]" />
                <span>ใหม่ว่าง {liveCategoryStock.remainingNew}</span>
                {isOpen ? `/${liveCategoryStock.totalNew}` : ''}
              </span>
              <span className="text-[#d5cbc0]">·</span>
              <span className={`inline-flex items-center gap-1 ${isOpen ? 'text-[#2b5435] font-bold' : ''}`}>
                <CheckCircle2 className="w-3 h-3 text-[#3d6e49]" />
                <span>เก่าสดว่าง {liveCategoryStock.remainingFresh}</span>
                {isOpen ? `/${liveCategoryStock.totalFresh}` : ''}
              </span>
            </div>
          )}

          {!isOpen && (
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={onToggle}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#f4eee4] hover:bg-[#eae1d4] text-[#4d4740] font-bold transition-colors cursor-pointer"
            >
              <span>เปลี่ยนหมวดหมู่</span>
              <motion.span
                animate={{ rotate: 0 }}
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
              {/* TIER 0: Segmented Group Selector */}
              <div className="bg-[#fdfbf7] border border-[#e8dfd3] rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-[#47413a]">
                    1. เลือกกลุ่มหมวดหมู่หลัก
                  </span>
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
                            ? 'bg-[#edf4ed] text-[#244b2f] border-[#bad8b9] ring-2 ring-[#a4c5a1]/40 shadow-xs'
                            : 'bg-[#faf7f2] text-[#4d4740] border-[#e8dfd3] hover:border-[#bad8b9] hover:bg-white'
                        }`}
                      >
                        <CategoryGroupIcon icon={gStat.group.icon} className="w-3.5 h-3.5 shrink-0 text-[#4c634b]" />
                        <span>{gStat.group.name}</span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-mono tabular-nums ${
                            isGroupSelected
                              ? 'bg-[#3b6845] text-white'
                              : gStat.producibleEpisodesCount > 0
                              ? 'bg-[#e5eee5] text-[#2c5234]'
                              : 'bg-[#ede7dd] text-[#716960]'
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
              <div className="bg-[#fdfbf7] border border-[#e8dfd3] rounded-xl p-3 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-[#47413a]">
                    2. เลือกหมวดหมู่ (ในกลุ่ม {activeGroup?.name || ''})
                  </span>
                  <span className="text-[11px] text-[#7a7268]">
                    คลิกเลือกเพื่อใช้เป็นแกนหลักของตอน
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                  {categoriesInSelectedGroup.map((stat) => {
                    const isSelected = stat.tag.id === mainCategoryTagId;
                    return (
                      <button
                        key={stat.tag.id}
                        type="button"
                        onClick={() => onSelectCategory(stat.tag.id)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                          isSelected
                            ? 'bg-[#edf4ed] border-[#93b390] ring-2 ring-[#a4c5a1]/50 shadow-xs'
                            : 'bg-[#faf7f2] border-[#e8dfd3] hover:border-[#bad8b9] hover:bg-white'
                        }`}
                      >
                        <div>
                          <div
                            className={`text-xs font-bold truncate ${
                              isSelected ? 'text-[#244b2f]' : 'text-[#38332d]'
                            }`}
                          >
                            #{stat.tag.name}
                          </div>
                          <div className="text-[10px] text-[#7a7268] mt-0.5">
                            พร้อมผลิต {stat.producibleEpisodesCount} ตอน
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[10px] font-mono tabular-nums pt-1 border-t border-[#ede7dc]">
                          <span className="text-[#855621]">ใหม่ {stat.newCount}</span>
                          <span className="text-[#2b5435]">พร้อมใช้ {stat.usableCount}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* TIER 2: Production Target Scope Selector */}
              <div className="bg-[#fdfbf7] border border-[#e8dfd3] rounded-xl p-3 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold text-[#47413a]">
                    3. รูปแบบการจัดตอน (Scope)
                  </span>

                  <div className="flex flex-wrap items-center gap-1 bg-[#f3ede3] p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={onSelectVarietyMode}
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        productionTarget === 'MAIN_CATEGORY_VARIETY'
                          ? 'bg-white text-[#2d2926] shadow-xs'
                          : 'text-[#6b645b] hover:text-[#2d2926]'
                      }`}
                    >
                      <Layers className="w-3 h-3 text-[#3b6845]" />
                      <span>รวมหลากประเด็นในหมวดหลัก</span>
                    </button>

                    <button
                      type="button"
                      onClick={onSelectSoloMode}
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        productionTarget === 'SINGLE_SUBCATEGORY_SPECIAL'
                          ? 'bg-[#fdf3ec] text-[#8e4537] border border-[#f5d7cf] shadow-xs'
                          : 'text-[#6b645b] hover:text-[#2d2926]'
                      }`}
                    >
                      <Target className="w-3 h-3 text-[#a34c3c]" />
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
                          <div className="text-xs text-[#8e4537] bg-[#fdf3ec] border border-[#f5d7cf] rounded-xl p-2.5">
                            หมวดหลักนี้ยังไม่มีหมวดหมู่ย่อย
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
                                      ? 'bg-[#fdf3ec] text-[#8e4537] border border-[#f5d7cf] ring-1 ring-[#f2bfae]'
                                      : 'bg-[#faf7f2] text-[#4d4740] border border-[#e8dfd3] hover:bg-[#fdf3ec]'
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
                  onClick={onNextStep}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#3b6845] hover:bg-[#2c5234] text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
                >
                  <span>ถัดไป: จัด 5 อันดับ & คัดคลิป (ขั้นที่ 2)</span>
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
