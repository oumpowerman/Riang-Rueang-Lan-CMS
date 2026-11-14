import React, { useState } from 'react';
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="bg-[#FDFBF7] border border-[#E8DFD3] rounded-2xl p-3.5 sm:p-5 space-y-3.5 sm:space-y-4 shadow-2xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h1 className="text-base sm:text-xl font-extrabold text-[#2D2926] flex items-center gap-2">
              <span className="p-1.5 bg-[#F3E9D8] border border-[#DFCEB4] text-[#785324] rounded-xl">
                <Package className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
              </span>
              <span>คลังคลิปหลัก (Master Archive)</span>
            </h1>
            <p className="hidden sm:block text-xs text-[#716960] mt-0.5">
              แยกวิเคราะห์รายการ &ldquo;5 อันดับ&rdquo; ที่ผลิตจริง ({categoryRanking.length}{' '}
              รายการ) จัดหมวดหมู่คลังคลิปแยกอิสระ และค้นหาคลิปจากแท็กฟุตเทจ 3 ชั้น
            </p>
          </div>

          {/* Mobile Consolidated Action Menu Button (sm:hidden) */}
          <div className="relative sm:hidden shrink-0">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              className="inline-flex items-center gap-1 px-2.5 py-2 rounded-xl text-xs font-bold bg-[#FAF3E6] hover:bg-[#F3E6CE] text-[#6B4616] border border-[#DFC69E] cursor-pointer whitespace-nowrap"
            >
              <span>จัดการคลัง</span>
              {templateNeedsUpdateCount > 0 && (
                <span className="font-mono text-[10px] font-extrabold text-[#7A3F17]">
                  ({templateNeedsUpdateCount})
                </span>
              )}
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform ${
                  isMobileMenuOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {isMobileMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setIsMobileMenuOpen(false)}
                />
                <div className="absolute right-0 mt-1.5 w-56 z-40 bg-[#FFFDF9] border border-[#DFC69E] rounded-2xl shadow-lg p-1.5 space-y-1">
                  {onOpenManageCategories && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        onOpenManageCategories();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-[#6B4616] hover:bg-[#FAF3E6] text-left cursor-pointer"
                    >
                      <FolderKanban className="w-3.5 h-3.5 text-[#8A5A22] shrink-0" />
                      <span>จัดหมวดคลังคลิป</span>
                    </button>
                  )}
                  {onOpenTemplateStandardizer && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        onOpenTemplateStandardizer();
                      }}
                      className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs font-bold text-[#7A3F17] hover:bg-[#FBF0E4] text-left cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <Wand2 className="w-3.5 h-3.5 text-[#B56722] shrink-0" />
                        <span>ปรับ Template สุดฮา!</span>
                      </span>
                      {templateNeedsUpdateCount > 0 && (
                        <span className="font-mono text-[11px] font-extrabold text-[#66310D]">
                          {templateNeedsUpdateCount}
                        </span>
                      )}
                    </button>
                  )}
                  {onOpenSupabaseSync && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        onOpenSupabaseSync();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-[#1C4824] hover:bg-[#EEF5EE] text-left cursor-pointer"
                    >
                      <Share2 className="w-3.5 h-3.5 text-[#2E7D32] shrink-0" />
                      <span>ซิงก์สู่ Kontent OS</span>
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Dual View Mode Switcher: รายตอน vs ชั้นวาง */}
          <div className="grid grid-cols-2 sm:flex items-center gap-1 p-1 bg-[#F5EFE6] border border-[#E2D6C5] rounded-xl shadow-2xs w-full sm:w-auto">
            <button
              type="button"
              onClick={() => onTabChange('EPISODES')}
              className={`inline-flex items-center justify-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap border ${
                archiveTab === 'EPISODES'
                  ? 'bg-[#E6F2E6] text-[#224A2D] border-[#9EC49C] shadow-2xs'
                  : 'border-transparent text-[#5C544C] hover:text-[#2D2926] hover:bg-white/60'
              }`}
            >
              <Film className="w-3.5 h-3.5 shrink-0" />
              <span className="sm:hidden">
                รายตอน ({sortedEpisodesCount.toLocaleString()})
              </span>
              <span className="hidden sm:inline">
                มุมมองรายตอน ({sortedEpisodesCount.toLocaleString()})
              </span>
            </button>
            <button
              type="button"
              onClick={() => onTabChange('SERIES_SHELF')}
              className={`inline-flex items-center justify-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap border ${
                archiveTab === 'SERIES_SHELF'
                  ? 'bg-[#E6F2E6] text-[#224A2D] border-[#9EC49C] shadow-2xs'
                  : 'border-transparent text-[#5C544C] hover:text-[#2D2926] hover:bg-white/60'
              }`}
            >
              <Layers className="w-3.5 h-3.5 shrink-0" />
              <span className="sm:hidden">ชั้นวาง ({categoryRanking.length})</span>
              <span className="hidden sm:inline">
                ชั้นวางรายการ 5 อันดับ ({categoryRanking.length})
              </span>
            </button>
          </div>

          {/* Desktop Action Buttons (hidden on mobile since consolidated in จัดการคลัง menu) */}
          <div className="hidden sm:flex flex-wrap items-center gap-2">
            {onOpenManageCategories && (
              <button
                type="button"
                onClick={onOpenManageCategories}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-[#FAF3E6] hover:bg-[#F3E6CE] text-[#6B4616] border border-[#DFC69E] shadow-2xs transition-all cursor-pointer whitespace-nowrap"
                title="สร้างและจัดหมวดหมู่คลังคลิปหลักสำหรับรายการ 5 อันดับ"
              >
                <FolderKanban className="w-3.5 h-3.5 text-[#8A5A22]" />
                <span>จัดหมวดคลังคลิป</span>
              </button>
            )}

            {onOpenTemplateStandardizer && (
              <button
                type="button"
                onClick={onOpenTemplateStandardizer}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-[#FBF0E4] hover:bg-[#F5E2CE] text-[#7A3F17] border border-[#E5C6A8] shadow-2xs transition-all cursor-pointer whitespace-nowrap"
                title="จัดโครงสร้างชื่อคลิปหลักทั้งหมดเป็น 5 อันดับ ... สุดฮา! EP.n พร้อมหมวดยกเว้น"
              >
                <Wand2 className="w-3.5 h-3.5 text-[#B56722]" />
                <span>ปรับ Template สุดฮา!</span>
                {templateNeedsUpdateCount > 0 && (
                  <span className="font-mono text-[11px] font-extrabold text-[#66310D]">
                    ({templateNeedsUpdateCount})
                  </span>
                )}
              </button>
            )}

            {onOpenSupabaseSync && (
              <button
                type="button"
                onClick={onOpenSupabaseSync}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#EEF5EE] hover:bg-[#E2EFE2] text-[#1C4824] border border-[#BAD8BF] shadow-2xs transition-all cursor-pointer active:scale-98 whitespace-nowrap"
                title="ส่งออกและซิงก์คลังคลิปหลักสู่ระบบ Kontent OS พร้อมตรวจสอบความซ้ำ"
              >
                <Share2 className="w-3.5 h-3.5 text-[#2E7D32]" />
                <span>เพิ่มคลังคลิปสู่ Kontent OS</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 4 Concise Pastel Earth-Tone KPI Cards: 2x2 on Mobile, 4 cols on Desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        {/* Card 1: Total Episodes & Total Distinct 5 อันดับ Series */}
        <button
          type="button"
          onClick={() => onCategoryFilterChange('ALL')}
          title="จำนวนคลิปหลักและจำนวนรายการ 5 อันดับทั้งหมดในระบบ (คลิกเพื่อแสดงทุกรายการ)"
          className={`text-left p-2.5 sm:p-3.5 rounded-xl border transition-all cursor-pointer ${
            categoryFilter === 'ALL'
              ? 'bg-[#FAF3E6] text-[#3D3327] border-[#DEC49A] ring-1 ring-[#E8D4B4] shadow-2xs'
              : 'bg-[#FAF7F2] hover:bg-[#FAF3E6]/70 border-[#E6DDD0] text-[#2D2926]'
          }`}
        >
          <div className="text-[11px] sm:text-xs font-bold text-[#785324] flex items-center gap-1 truncate">
            <Package className="w-3.5 h-3.5 text-[#8A5A22] shrink-0" />
            <span className="truncate">คลังคลิปทั้งหมด</span>
          </div>
          <div className="mt-1 flex items-baseline justify-between gap-1 flex-wrap">
            <span className="text-lg sm:text-2xl font-mono font-extrabold tabular-nums text-[#2D2926]">
              {overviewMetrics.totalEpisodes.toLocaleString()}
              <span className="text-[11px] font-sans font-bold text-[#787066] ml-1">
                คลิป
              </span>
            </span>
            <span className="text-[10px] sm:text-[11px] font-mono font-bold text-[#6B4616]">
              {overviewMetrics.totalDistinctSeries} รายการ
            </span>
          </div>
        </button>

        {/* Card 2: Footage Utilization Rate */}
        <div
          title="สัดส่วนฟุตเทจในคลังที่ถูกนำมาผลิตคลิปหลักแล้วอย่างน้อย 1 ครั้ง"
          className="p-2.5 sm:p-3.5 rounded-xl border border-[#C6DEC5] bg-[#EFF6EE] text-[#2D2926] cursor-default"
        >
          <div className="text-[11px] sm:text-xs font-bold text-[#285333] flex items-center gap-1 truncate">
            <Repeat className="w-3.5 h-3.5 text-[#386B46] shrink-0" />
            <span className="truncate">อัตราใช้ฟุตเทจ</span>
          </div>
          <div className="mt-1 flex items-baseline justify-between gap-1 flex-wrap">
            <span className="text-lg sm:text-2xl font-mono font-extrabold tabular-nums text-[#244B2F]">
              {overviewMetrics.utilizationRate}%
            </span>
            <span className="text-[10px] sm:text-[11px] font-mono tabular-nums text-[#2F5E3B]">
              {overviewMetrics.usedFootage}/{overviewMetrics.totalFootage} ฟุต
            </span>
          </div>
        </div>

        {/* Card 3: Most Produced 5 อันดับ Series */}
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
            title={`รายการที่มีการผลิตคลิปหลักมากที่สุดในคลัง: ${overviewMetrics.topCategory.fullSeriesTitle} (คลิกเพื่อกรอง)`}
            className={`text-left p-2.5 sm:p-3.5 rounded-xl border transition-all cursor-pointer ${
              categoryFilter === overviewMetrics.topCategory.seriesKey
                ? 'bg-[#E5F1F6] text-[#1E465C] border-[#9EC6D8] ring-1 ring-[#B8D7E6] shadow-2xs'
                : 'bg-[#EFF6F9] hover:bg-[#E5F1F6] border-[#C9E0EB] text-[#2D2926]'
            }`}
          >
            <div className="text-[11px] sm:text-xs font-bold text-[#23546E] flex items-center justify-between gap-1">
              <span className="flex items-center gap-1 truncate">
                <TrendingUp className="w-3.5 h-3.5 text-[#2E6B8A] shrink-0" />
                <span className="truncate">ผลิตสูงสุด</span>
              </span>
              <span className="text-[10px] sm:text-xs font-mono font-extrabold tabular-nums text-[#23546E] shrink-0">
                {overviewMetrics.topCategory.episodeCount} คลิป
              </span>
            </div>
            <div className="mt-1 text-xs sm:text-sm font-extrabold text-[#2D2926] truncate">
              {overviewMetrics.topCategory.seriesName}
            </div>
          </button>
        )}

        {/* Card 4: Least Produced 5 อันดับ Series */}
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
            title={`รายการที่ผลิตน้อยที่สุด: ${overviewMetrics.leastCategory.fullSeriesTitle}`}
            className={`text-left p-2.5 sm:p-3.5 rounded-xl border transition-all cursor-pointer ${
              categoryFilter === overviewMetrics.leastCategory.seriesKey
                ? 'bg-[#FBF0DC] text-[#664214] border-[#DEC190] ring-1 ring-[#EAD3AC] shadow-2xs'
                : 'bg-[#FDF6EA] hover:bg-[#FBF0DC] border-[#EAD9BC] text-[#2D2926]'
            }`}
          >
            <div className="text-[11px] sm:text-xs font-bold text-[#785324] flex items-center justify-between gap-1">
              <span className="flex items-center gap-1 truncate">
                <TrendingDown className="w-3.5 h-3.5 text-[#8A5A22] shrink-0" />
                <span className="truncate">ผลิตน้อยสุด</span>
              </span>
              <span className="text-[10px] sm:text-xs font-mono font-extrabold tabular-nums text-[#785324] shrink-0">
                {overviewMetrics.leastCategory.episodeCount} คลิป
              </span>
            </div>
            <div className="mt-1 text-xs sm:text-sm font-extrabold text-[#2D2926] truncate">
              {overviewMetrics.leastCategory.seriesName}
            </div>
          </button>
        )}
      </div>
    </div>
  );
};
