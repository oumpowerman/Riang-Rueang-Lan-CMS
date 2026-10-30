import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BarChart3, ChevronDown, RotateCcw } from 'lucide-react';
import type { MixRecipeId } from '../../../../utils/collisionDetector';
import type { CategoryRankingItem } from '../hooks/useMasterArchiveMetrics';

interface CategoryUtilizationDrawerProps {
  categoryRanking: CategoryRankingItem[];
  maxEpisodesInAnyCategory: number;
  categoryFilter: string;
  onCategoryFilterChange: (catId: string) => void;
  launchEpisodeBuilderForCategory: (catId: string, recipeId?: MixRecipeId) => void;
}

export const CategoryUtilizationDrawer: React.FC<CategoryUtilizationDrawerProps> = ({
  categoryRanking,
  maxEpisodesInAnyCategory,
  categoryFilter,
  onCategoryFilterChange,
  launchEpisodeBuilderForCategory,
}) => {
  const [isComparisonExpanded, setIsComparisonExpanded] = useState(false);

  return (
    <div className="bg-[#FDFBF7] border border-[#E8DFD3] rounded-2xl shadow-2xs overflow-hidden">
      <div
        onClick={() => setIsComparisonExpanded((prev) => !prev)}
        className="p-3.5 sm:p-4 bg-gradient-to-r from-[#FAF7F2] via-[#FDFBF7] to-[#F7F1E5] hover:from-[#F5EFE6] hover:to-[#F3E9D8] transition-colors cursor-pointer flex flex-wrap items-center justify-between gap-3"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <motion.div
            whileHover={{ rotate: 8, scale: 1.05 }}
            className="w-8 h-8 rounded-xl bg-[#F3E9D8] border border-[#DFCEB4] text-[#785324] flex items-center justify-center shrink-0 shadow-2xs"
          >
            <BarChart3 className="w-4 h-4" />
          </motion.div>
          <div className="min-w-0">
            <h2 className="text-sm font-extrabold text-[#2D2926]">
              สัดส่วนการผลิตตามหมวดหมู่ & อัตราใช้ฟุต
            </h2>
            <p className="text-xs text-[#716960]">
              {isComparisonExpanded
                ? 'คลิกแถวเพื่อกรองคลิปหลัก หรือกด "+ จัดเพิ่ม" เพื่อนำฟุตเทจที่ว่างไปสร้างตอนใหม่'
                : 'คลิกเพื่อกางดูกราฟเปรียบเทียบสัดส่วนตอนและฟุตเทจพร้อมใช้'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {categoryFilter !== 'ALL' && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onCategoryFilterChange('ALL');
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-[#785324] bg-[#FBF4E6] hover:bg-[#F3E7CE] border border-[#E5D4B3] rounded-lg transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>แสดงทั้งหมด</span>
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
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              isComparisonExpanded
                ? 'bg-[#E8F3E8] text-[#244B2F] border-[#A9C7A7] shadow-2xs'
                : 'bg-white text-[#4D4740] border-[#E2D8C9] hover:bg-[#FAF6F0]'
            }`}
          >
            <span>{isComparisonExpanded ? 'ย่อกราฟ' : 'ดูกราฟเปรียบเทียบ'}</span>
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
            <div className="border-t border-[#E8DFD3] p-3 sm:p-4 space-y-2 bg-[#FDFBF7] max-h-[500px] overflow-y-auto scrollbar-earth pr-2">
              {categoryRanking.map((row, idx) => {
                const isSelected = categoryFilter === row.mainTag.id;
                const barWidthPercent = Math.max(
                  6,
                  Math.round((row.episodeCount / maxEpisodesInAnyCategory) * 100)
                );
                const isTop = idx === 0 && row.episodeCount > 0;
                const isLeast =
                  idx === categoryRanking.length - 1 && categoryRanking.length > 1;

                return (
                  <motion.div
                    key={row.mainTag.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18, delay: idx * 0.02 }}
                    whileHover={{ y: -1 }}
                    onClick={() =>
                      onCategoryFilterChange(isSelected ? 'ALL' : row.mainTag.id)
                    }
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#FDF4E3] border-[#DCB87A] ring-1 ring-[#E6CBA0] shadow-2xs'
                        : 'bg-white/80 hover:bg-white hover:border-[#D5C7B4] border-[#EAE1D5]'
                    }`}
                  >
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 items-center">
                      {/* Col 1-3: Rank + Category Name */}
                      <div className="lg:col-span-3 flex items-center gap-2 min-w-0">
                        <span
                          className={`w-5 h-5 rounded-md font-mono text-[11px] font-extrabold flex items-center justify-center shrink-0 border ${
                            isSelected
                              ? 'bg-[#F3E3C3] text-[#6B4616] border-[#D8BC8C]'
                              : isTop
                              ? 'bg-[#E6F2F8] text-[#23546E] border-[#BEE0F0]'
                              : 'bg-[#FAF7F2] text-[#6E665E] border-[#E2D8C9]'
                          }`}
                        >
                          {idx + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs sm:text-sm font-extrabold text-[#2D2926] truncate">
                              #{row.mainTag.name}
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
                        </div>
                      </div>

                      {/* Col 4-8: Horizontal Comparison Bar (Episode Count & Share) */}
                      <div className="lg:col-span-5 space-y-1">
                        <div className="flex items-center justify-between text-xs font-mono tabular-nums">
                          <span className="font-bold text-[#2D2926]">
                            {row.episodeCount} ตอน
                          </span>
                          <span className="text-[#787066]">
                            {row.episodeSharePercent}% ของคลัง
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

                      {/* Col 9-12: Footage Utilization Efficiency in this Category + Quick Action */}
                      <div className="lg:col-span-4 flex items-center justify-between gap-2.5 pl-0 lg:pl-3 lg:border-l lg:border-[#EAE1D5]">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between text-xs font-mono tabular-nums">
                            <span className="text-[#6E665E]">
                              ใช้จริง{' '}
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
                              row.mainTag.id,
                              row.untouchedFootageInCat >= 5
                                ? 'FORMULA_ALL_NEW'
                                : 'FORMULA_2_NEW_3_FRESH'
                            );
                          }}
                          className="px-2.5 py-1 text-[11px] font-bold text-[#244B2F] bg-[#EBF3EB] hover:bg-[#DCECDC] border border-[#B5D1B3] rounded-lg transition-colors shrink-0 cursor-pointer"
                          title={`นำฟุตเทจหมวด #${row.mainTag.name} ไปจัดชุด 5 อันดับ`}
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
