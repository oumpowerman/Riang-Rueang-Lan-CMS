import React, { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  Package,
  Film,
  Layers,
  Repeat,
  TrendingUp,
  TrendingDown,
  FolderKanban,
  Wand2,
  ChevronDown,
  Share2,
} from 'lucide-react';
import type {
  OverviewMetrics,
  CategoryRankingItem,
} from '../hooks/useMasterArchiveMetrics';
import type { ArchiveTab } from '../hooks/useMasterArchiveFilter';

interface ArchiveOverviewHeaderProps {
  overviewMetrics: OverviewMetrics;
  categoryRanking: CategoryRankingItem[];
  archiveTab: ArchiveTab;
  onTabChange: (tab: ArchiveTab) => void;
  categoryFilter: string;
  onCategoryFilterChange: (catId: string) => void;
  sortedEpisodesCount: number;
  onOpenSupabaseSync?: () => void;
  onOpenManageCategories?: () => void;
  onOpenTemplateStandardizer?: () => void;
  templateNeedsUpdateCount?: number;
}

export const ArchiveOverviewHeader: React.FC<ArchiveOverviewHeaderProps> = ({
  overviewMetrics,
  categoryRanking,
  archiveTab,
  onTabChange,
  categoryFilter,
  onCategoryFilterChange,
  sortedEpisodesCount,
  onOpenSupabaseSync,
  onOpenManageCategories,
  onOpenTemplateStandardizer,
  templateNeedsUpdateCount = 0,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="bg-[#FDFBF7] border border-[#E8DFD3] rounded-2xl p-3 sm:p-3.5 space-y-2.5 shadow-2xs">
      {/* Slim Top Control Row: View Mode Switcher + Live Count + Manage Dropdown */}
      <div className="flex items-center justify-between gap-2 relative">
        <div className="inline-flex items-center gap-0.5 p-1 bg-[#F5EFE6] border border-[#E2D6C5] rounded-xl shadow-2xs min-w-0">
          <button
            type="button"
            onClick={() => onTabChange('EPISODES')}
            className={`relative inline-flex items-center justify-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer whitespace-nowrap min-w-0 ${
              archiveTab === 'EPISODES'
                ? 'text-[#224A2D]'
                : 'text-[#5C544C] hover:text-[#2D2926]'
            }`}
          >
            {archiveTab === 'EPISODES' && (
              <motion.span
                layoutId="archiveHeaderTabPill"
                transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                className="absolute inset-0 rounded-lg bg-[#E6F2E6] border border-[#9EC49C] shadow-2xs"
              />
            )}
            <Film className="relative z-10 w-3.5 h-3.5 shrink-0" />
            <span className="relative z-10 tabular-nums truncate">
              รายตอน ({sortedEpisodesCount.toLocaleString()})
            </span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('SERIES_SHELF')}
            className={`relative inline-flex items-center justify-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer whitespace-nowrap min-w-0 ${
              archiveTab === 'SERIES_SHELF'
                ? 'text-[#224A2D]'
                : 'text-[#5C544C] hover:text-[#2D2926]'
            }`}
          >
            {archiveTab === 'SERIES_SHELF' && (
              <motion.span
                layoutId="archiveHeaderTabPill"
                transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                className="absolute inset-0 rounded-lg bg-[#E6F2E6] border border-[#9EC49C] shadow-2xs"
              />
            )}
            <Layers className="relative z-10 w-3.5 h-3.5 shrink-0" />
            <span className="relative z-10 tabular-nums truncate">
              ชั้นวาง ({categoryRanking.length})
            </span>
          </button>
        </div>

        {/* Right: Manage Dropdown Trigger */}
        <div className="shrink-0">
          <button
            type="button"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer whitespace-nowrap shadow-2xs ${
              isMenuOpen
                ? 'bg-[#F3E6CE] text-[#5C3A0E] border-[#D4B483]'
                : 'bg-[#FAF3E6] hover:bg-[#F3E6CE] text-[#6B4616] border-[#DFC69E]'
            }`}
            title="เมนูจัดการคลังคลิป"
          >
            <span>จัดการคลัง</span>
            {templateNeedsUpdateCount > 0 && (
              <span className="font-mono text-[11px] font-extrabold text-[#8A4A18] tabular-nums">
                ({templateNeedsUpdateCount})
              </span>
            )}
            <motion.span
              animate={{ rotate: isMenuOpen ? 180 : 0 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.16 }}
              className="inline-flex"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </motion.span>
          </button>
        </div>

        {/* Shared Dropdown Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <>
              <motion.div
                key="manage-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: prefersReducedMotion ? 0 : 0.12 }}
                className="fixed inset-0 z-30"
                onClick={() => setIsMenuOpen(false)}
              />
              <motion.div
                key="manage-menu"
                initial={
                  prefersReducedMotion
                    ? { opacity: 0 }
                    : { opacity: 0, y: -6, scale: 0.97 }
                }
                animate={
                  prefersReducedMotion
                    ? { opacity: 1 }
                    : { opacity: 1, y: 0, scale: 1 }
                }
                exit={
                  prefersReducedMotion
                    ? { opacity: 0 }
                    : { opacity: 0, y: -4, scale: 0.97 }
                }
                transition={{
                  duration: prefersReducedMotion ? 0.08 : 0.16,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="absolute right-0 top-full mt-1.5 w-60 z-40 bg-[#FFFDF9] border border-[#DFC69E] rounded-2xl shadow-xl p-1.5 space-y-1 origin-top-right"
              >
                {onOpenManageCategories && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onOpenManageCategories();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-[#6B4616] hover:bg-[#FAF3E6] text-left cursor-pointer transition-colors"
                  >
                    <FolderKanban className="w-4 h-4 text-[#8A5A22] shrink-0" />
                    <span>จัดหมวดคลังคลิป</span>
                  </button>
                )}

                {onOpenTemplateStandardizer && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onOpenTemplateStandardizer();
                    }}
                    className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs font-bold text-[#7A3F17] hover:bg-[#FBF0E4] text-left cursor-pointer transition-colors"
                  >
                    <span className="flex items-center gap-2.5">
                      <Wand2 className="w-4 h-4 text-[#B56722] shrink-0" />
                      <span>ปรับ Template สุดฮา!</span>
                    </span>
                    {templateNeedsUpdateCount > 0 && (
                      <span className="font-mono text-[11px] font-extrabold text-[#66310D] tabular-nums">
                        {templateNeedsUpdateCount}
                      </span>
                    )}
                  </button>
                )}

                {onOpenSupabaseSync && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onOpenSupabaseSync();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-[#1C4824] hover:bg-[#EEF5EE] text-left cursor-pointer transition-colors"
                  >
                    <Share2 className="w-4 h-4 text-[#2E7D32] shrink-0" />
                    <span>ซิงก์สู่ Kontent OS</span>
                  </button>
                )}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Slim 4 KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        <button
          type="button"
          onClick={() => onCategoryFilterChange('ALL')}
          title="แสดงทุกรายการ"
          className={`text-left px-3 py-2 rounded-xl border transition-colors cursor-pointer ${
            categoryFilter === 'ALL'
              ? 'bg-[#FAF3E6] text-[#3D3327] border-[#DEC49A] ring-1 ring-[#E8D4B4] shadow-2xs'
              : 'bg-[#FAF7F2] hover:bg-[#FAF3E6]/70 border-[#E6DDD0] text-[#2D2926]'
          }`}
        >
          <div className="text-[11px] font-bold text-[#785324] flex items-center gap-1 truncate">
            <Package className="w-3.5 h-3.5 text-[#8A5A22] shrink-0" />
            <span className="truncate">ทั้งหมด</span>
          </div>
          <div className="mt-0.5 flex items-baseline justify-between gap-1 flex-wrap">
            <span className="text-base sm:text-lg font-mono font-extrabold tabular-nums text-[#2D2926]">
              {overviewMetrics.totalEpisodes.toLocaleString()}
              <span className="text-[11px] font-sans font-bold text-[#787066] ml-1">
                คลิป
              </span>
            </span>
            <span className="text-[11px] font-mono font-bold text-[#6B4616] tabular-nums">
              {overviewMetrics.totalDistinctSeries} รายการ
            </span>
          </div>
        </button>

        <div
          title="สัดส่วนฟุตเทจในคลังที่ถูกใช้ผลิตแล้ว"
          className="px-3 py-2 rounded-xl border border-[#C6DEC5] bg-[#EFF6EE] text-[#2D2926] cursor-default"
        >
          <div className="text-[11px] font-bold text-[#285333] flex items-center gap-1 truncate">
            <Repeat className="w-3.5 h-3.5 text-[#386B46] shrink-0" />
            <span className="truncate">ใช้ฟุตเทจแล้ว</span>
          </div>
          <div className="mt-0.5 flex items-baseline justify-between gap-1 flex-wrap">
            <span className="text-base sm:text-lg font-mono font-extrabold tabular-nums text-[#244B2F]">
              {overviewMetrics.utilizationRate}%
            </span>
            <span className="text-[11px] font-mono tabular-nums text-[#2F5E3B]">
              {overviewMetrics.usedFootage}/{overviewMetrics.totalFootage} ฟุต
            </span>
          </div>
        </div>

        {overviewMetrics.topCategory && (
          <button
            type="button"
            onClick={() =>
              onCategoryFilterChange(
                categoryFilter === overviewMetrics.topCategory!.seriesKey
                  ? 'ALL'
                  : overviewMetrics.topCategory!.seriesKey
              )
            }
            title={`กรอง: ${overviewMetrics.topCategory.fullSeriesTitle}`}
            className={`text-left px-3 py-2 rounded-xl border transition-colors cursor-pointer ${
              categoryFilter === overviewMetrics.topCategory.seriesKey
                ? 'bg-[#E5F1F6] text-[#1E465C] border-[#9EC6D8] ring-1 ring-[#B8D7E6] shadow-2xs'
                : 'bg-[#EFF6F9] hover:bg-[#E5F1F6] border-[#C9E0EB] text-[#2D2926]'
            }`}
          >
            <div className="text-[11px] font-bold text-[#23546E] flex items-center justify-between gap-1">
              <span className="flex items-center gap-1 truncate">
                <TrendingUp className="w-3.5 h-3.5 text-[#2E6B8A] shrink-0" />
                <span className="truncate">ผลิตสูงสุด</span>
              </span>
              <span className="text-[11px] font-mono font-extrabold tabular-nums text-[#23546E] shrink-0">
                {overviewMetrics.topCategory.episodeCount}
              </span>
            </div>
            <div className="mt-0.5 text-xs sm:text-sm font-extrabold text-[#2D2926] truncate">
              {overviewMetrics.topCategory.seriesName}
            </div>
          </button>
        )}

        {overviewMetrics.leastCategory && (
          <button
            type="button"
            onClick={() =>
              onCategoryFilterChange(
                categoryFilter === overviewMetrics.leastCategory!.seriesKey
                  ? 'ALL'
                  : overviewMetrics.leastCategory!.seriesKey
              )
            }
            title={`กรอง: ${overviewMetrics.leastCategory.fullSeriesTitle}`}
            className={`text-left px-3 py-2 rounded-xl border transition-colors cursor-pointer ${
              categoryFilter === overviewMetrics.leastCategory.seriesKey
                ? 'bg-[#FBF0DC] text-[#664214] border-[#DEC190] ring-1 ring-[#EAD3AC] shadow-2xs'
                : 'bg-[#FDF6EA] hover:bg-[#FBF0DC] border-[#EAD9BC] text-[#2D2926]'
            }`}
          >
            <div className="text-[11px] font-bold text-[#785324] flex items-center justify-between gap-1">
              <span className="flex items-center gap-1 truncate">
                <TrendingDown className="w-3.5 h-3.5 text-[#8A5A22] shrink-0" />
                <span className="truncate">ผลิตน้อยสุด</span>
              </span>
              <span className="text-[11px] font-mono font-extrabold tabular-nums text-[#785324] shrink-0">
                {overviewMetrics.leastCategory.episodeCount}
              </span>
            </div>
            <div className="mt-0.5 text-xs sm:text-sm font-extrabold text-[#2D2926] truncate">
              {overviewMetrics.leastCategory.seriesName}
            </div>
          </button>
        )}
      </div>
    </div>
  );
};
