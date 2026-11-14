import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BarChart3, ChevronDown, RotateCcw, Tag } from 'lucide-react';
import type { MixRecipeId } from '../../../../utils/collisionDetector';
import type { ArchiveSeriesCategory } from '../../../../types/tag.types';
import type { CategoryRankingItem } from '../hooks/useMasterArchiveMetrics';

interface CategoryUtilizationDrawerProps {
  categoryRanking: CategoryRankingItem[];
  maxEpisodesInAnyCategory: number;
  categoryFilter: string;
  onCategoryFilterChange: (catId: string) => void;
  launchEpisodeBuilderForCategory: (catId: string, recipeId?: MixRecipeId) => void;
  archiveCategoryMap: Record<string, ArchiveSeriesCategory>;
  onOpenTagBinding?: (row: CategoryRankingItem) => void;
}

export const CategoryUtilizationDrawer: React.FC<CategoryUtilizationDrawerProps> = ({
  categoryRanking,
  maxEpisodesInAnyCategory,
  categoryFilter,
  onCategoryFilterChange,
  launchEpisodeBuilderForCategory,
  archiveCategoryMap,
  onOpenTagBinding,
}) => {
  const [isComparisonExpanded, setIsComparisonExpanded] = useState(false);

  return (
    <div className="bg-[#FDFBF7] border border-[#E8DFD3] rounded-2xl shadow-2xs overflow-hidden">
      <div
        onClick={() => setIsComparisonExpanded((prev) => !prev)}
        className="p-3 sm:p-4 bg-gradient-to-r from-[#FAF7F2] via-[#FDFBF7] to-[#F7F1E5] hover:from-[#F5EFE6] hover:to-[#F3E9D8] transition-colors cursor-pointer flex items-center justify-between gap-2.5 sm:gap-3"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <motion.div
            whileHover={{ rotate: 8, scale: 1.05 }}
            className="w-8 h-8 rounded-xl bg-[#F3E9D8] border border-[#DFCEB4] text-[#785324] flex items-center justify-center shrink-0 shadow-2xs"
          >
            <BarChart3 className="w-4 h-4" />
          </motion.div>
          <div className="min-w-0">
            <h2 className="text-xs sm:text-sm font-extrabold text-[#2D2926] truncate">
              <span className="sm:hidden">
                สรุป {categoryRanking.length} รายการ & สต็อกฟุตเทจ
              </span>
              <span className="hidden sm:inline">
                จัดอันดับรายการ &ldquo;5 อันดับ&rdquo; ที่ผลิตจริง ({categoryRanking.length}{' '}
                รายการ) & อัตราใช้ฟุตเทจ
              </span>
            </h2>
            <p className="hidden sm:block text-xs text-[#716960]">
              {isComparisonExpanded
                ? 'คลิกแถวเพื่อกรองดูคลิปในรายการนั้น หรือกด "+ จัดเพิ่ม" เพื่อนำฟุตเทจไปสร้างตอนใหม่'
                : 'คลิกเพื่อกางดูตารางสรุปทุกรายการ "5 อันดับ" ว่ามีกี่คลิปและอยู่หมวดคลังคลิปใด'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {categoryFilter !== 'ALL' && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onCategoryFilterChange('ALL');
              }}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-bold text-[#785324] bg-[#FBF4E6] hover:bg-[#F3E7CE] border border-[#E5D4B3] rounded-lg transition-colors cursor-pointer whitespace-nowrap"
            >
              <RotateCcw className="w-3 h-3" />
              <span className="hidden sm:inline">แสดงทั้งหมด</span>
            </button>
          )}

          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={(e) => {
              e.stopPropagation();
              setIsComparisonExpanded((prev) => !prev);
            }}
            className={`inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer whitespace-nowrap ${
              isComparisonExpanded
                ? 'bg-[#E8F3E8] text-[#244B2F] border-[#A9C7A7] shadow-2xs'
                : 'bg-white text-[#4D4740] border-[#E2D8C9] hover:bg-[#FAF6F0]'
            }`}
          >
            <span className="sm:hidden">
              {isComparisonExpanded
                ? 'ย่อตาราง'
                : `ดูตาราง (${categoryRanking.length})`}
            </span>
            <span className="hidden sm:inline">
              {isComparisonExpanded
                ? 'ย่อตารางรายการ'
                : `ดูสรุปทั้ง ${categoryRanking.length} รายการ`}
            </span>
            <motion.span
              animate={{ rotate: isComparisonExpanded ? 180 : 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 22 }}
              className="inline-flex"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </motion.span>
          </motion.button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {isComparisonExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t border-[#E8DFD3] p-3 sm:p-4 space-y-2 bg-[#FDFBF7] max-h-[520px] overflow-y-auto scrollbar-earth pr-2">
              {/* Concise Legend clarifying Slot Completeness vs Footage Stock */}
              <div className="px-2.5 py-1.5 text-[11px] text-[#6E665E] flex flex-wrap items-center justify-between gap-2 border-b border-[#EFE8DC] pb-2">
                <span>
                  <strong className="text-[#2D2926]">ครบ 5 สล็อต</strong> = ความครบของคลิปในตอน ·{' '}
                  <strong className="text-[#2D2926]">สต็อกฟุต</strong> = ฟุตเทจในคลังที่จับคู่จากแท็ก/ชื่อ/โน้ต (ตัดคำต่อท้ายเช่น สุดฮา!, ฮาๆ แล้ว)
                </span>
              </div>

              {categoryRanking.map((row, idx) => {
                const isSelected = categoryFilter === row.seriesKey;
                const barWidthPercent = Math.max(
                  6,
                  Math.round((row.episodeCount / maxEpisodesInAnyCategory) * 100)
                );
                const isTop = idx === 0 && row.episodeCount > 0;
                const isLeast =
                  idx === categoryRanking.length - 1 && categoryRanking.length > 1;
                const archiveCat = archiveCategoryMap[row.archiveCategoryId];
                const allSlotsComplete = row.incompleteSlotEpisodeCount === 0;

                return (
                  <motion.div
                    key={row.seriesKey}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18, delay: idx * 0.015 }}
                    whileHover={{ y: -1 }}
                    onClick={() =>
                      onCategoryFilterChange(isSelected ? 'ALL' : row.seriesKey)
                    }
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#FDF4E3] border-[#DCB87A] ring-1 ring-[#E6CBA0] shadow-2xs'
                        : 'bg-white/80 hover:bg-white hover:border-[#D5C7B4] border-[#EAE1D5]'
                    }`}
                  >
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 items-center">
                      {/* Col 1-5: Rank + 5 อันดับ Series Name + Matched Tag Metadata + Bind Button */}
                      <div className="lg:col-span-5 flex items-start gap-2.5 min-w-0">
                        <span
                          className={`w-5 h-5 mt-0.5 rounded-md font-mono text-[11px] font-extrabold flex items-center justify-center shrink-0 border ${
                            isSelected
                              ? 'bg-[#F3E3C3] text-[#6B4616] border-[#D8BC8C]'
                              : isTop
                              ? 'bg-[#E6F2F8] text-[#23546E] border-[#BEE0F0]'
                              : 'bg-[#FAF7F2] text-[#6E665E] border-[#E2D8C9]'
                          }`}
                        >
                          {idx + 1}
                        </span>
                        <div className="min-w-0 flex-1 space-y-0.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[11px] font-bold text-[#785324] shrink-0">
                              5 อันดับ
                            </span>
                            <span className="text-xs sm:text-sm font-extrabold text-[#2D2926] truncate">
                              {row.seriesName}
                            </span>
                            {isTop && (
                              <span className="text-[10px] font-bold text-[#28617D] shrink-0">
                                · มากสุด
                              </span>
                            )}
                            {isLeast && (
                              <span className="text-[10px] font-bold text-[#8A5A22] shrink-0">
                                · น้อยสุด
                              </span>
                            )}
                          </div>

                          {/* Clean unboxed metadata row: Archive Category · Matched 3-Tier Tags · Bind action */}
                          <div className="flex items-center gap-1.5 flex-wrap text-[11px] text-[#6E665E]">
                            {archiveCat && (
                              <>
                                <span className="text-[#785324] font-medium">
                                  {archiveCat.name}
                                </span>
                                <span aria-hidden="true">·</span>
                              </>
                            )}
                            <span
                              className={
                                row.matchedTagNames.length > 0
                                  ? row.isCustomTagBound
                                    ? 'text-[#224A2D] font-semibold'
                                    : 'text-[#4D4740] font-medium'
                                  : 'text-[#9E571E]'
                              }
                            >
                              {row.matchedTagNames.length > 0
                                ? `${row.isCustomTagBound ? 'ผูกแท็กเอง' : 'จับคู่แท็ก'}: ${row.matchedTagNames.join(', ')}`
                                : 'ยังไม่พบแท็กตรงกัน'}
                            </span>
                            {onOpenTagBinding && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onOpenTagBinding(row);
                                }}
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[#FAF2E1] hover:bg-[#F2E3C2] text-[#6B4616] border border-[#DFC69E] text-[10px] font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0"
                                title="เลือกผูกแท็กฟุตเทจ 3 ชั้นประจำซีรีส์นี้เอง"
                              >
                                <Tag className="w-2.5 h-2.5" />
                                <span>
                                  {row.matchedTagNames.length > 0 ? 'แก้แท็ก' : 'ผูกแท็ก'}
                                </span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Col 6-8: Episode Count + 5/5 Slot Completeness */}
                      <div className="lg:col-span-3 space-y-1">
                        <div className="flex items-center justify-between gap-2 text-xs font-mono tabular-nums">
                          <span className="font-bold text-[#2D2926]">
                            {row.episodeCount} คลิป ({row.episodeSharePercent}%)
                          </span>
                          <span
                            className={`text-[11px] font-sans font-bold ${
                              allSlotsComplete ? 'text-[#2D633B]' : 'text-[#9E571E]'
                            }`}
                          >
                            {allSlotsComplete
                              ? `ครบ 5 สล็อต (${row.complete5SlotEpisodeCount}/${row.episodeCount})`
                              : `ครบ 5 สล็อต ${row.complete5SlotEpisodeCount}/${row.episodeCount} ตอน`}
                          </span>
                        </div>
                        <div className="h-2 w-full bg-[#EFE9DF] rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{
                              width: row.episodeCount === 0 ? '0%' : `${barWidthPercent}%`,
                            }}
                            transition={{ duration: 0.45, ease: 'easeOut' }}
                            className={`h-full rounded-full ${
                              isSelected
                                ? 'bg-[#C89347]'
                                : isTop
                                ? 'bg-[#68A8C8]'
                                : 'bg-[#DEB068]'
                            }`}
                          />
                        </div>
                      </div>

                      {/* Col 9-12: Footage Stock Utilization + Quick Action */}
                      <div className="lg:col-span-4 flex items-center justify-between gap-2.5 pl-0 lg:pl-3 lg:border-l lg:border-[#EAE1D5]">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between text-xs font-mono tabular-nums">
                            <span className="text-[#6E665E]">
                              สต็อกฟุต{' '}
                              <strong className="text-[#2D633B] font-bold">
                                {row.utilizationPercent}%
                              </strong>{' '}
                              ({row.usedFootageInCat}/{row.totalFootageInCat})
                            </span>
                            <span className="text-[#28617D] font-bold">
                              ว่าง {row.usableFootageInCat}
                            </span>
                          </div>
                          <div className="h-1.5 w-full bg-[#EFE9DF] rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${row.utilizationPercent}%` }}
                              transition={{ duration: 0.45, ease: 'easeOut' }}
                              className="h-full bg-[#77B285] rounded-full"
                            />
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            launchEpisodeBuilderForCategory(
                              row.builderTargetTagId,
                              row.untouchedFootageInCat >= 5
                                ? 'FORMULA_ALL_NEW'
                                : 'FORMULA_2_NEW_3_FRESH'
                            );
                          }}
                          className="px-2.5 py-1 text-[11px] font-bold text-[#244B2F] bg-[#EBF3EB] hover:bg-[#DCECDC] border border-[#B5D1B3] rounded-lg transition-colors shrink-0 cursor-pointer"
                          title={`สร้างตอนใหม่สำหรับ 5 อันดับ ${row.seriesName}`}
                        >
                          + จัดเพิ่ม
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
