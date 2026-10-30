import React from 'react';
import { Package, Film, Layers, Repeat, TrendingUp, TrendingDown } from 'lucide-react';
import type { OverviewMetrics, CategoryRankingItem } from '../hooks/useMasterArchiveMetrics';
import type { ArchiveTab } from '../hooks/useMasterArchiveFilter';

interface ArchiveOverviewHeaderProps {
  overviewMetrics: OverviewMetrics;
  categoryRanking: CategoryRankingItem[];
  archiveTab: ArchiveTab;
  onTabChange: (tab: ArchiveTab) => void;
  categoryFilter: string;
  onCategoryFilterChange: (catId: string) => void;
  sortedEpisodesCount: number;
}

export const ArchiveOverviewHeader: React.FC<ArchiveOverviewHeaderProps> = ({
  overviewMetrics,
  categoryRanking,
  archiveTab,
  onTabChange,
  categoryFilter,
  onCategoryFilterChange,
  sortedEpisodesCount,
}) => {
  return (
    <div className="bg-[#FDFBF7] border border-[#E8DFD3] rounded-2xl p-4 sm:p-5 space-y-4 shadow-2xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-xl font-extrabold text-[#2D2926] flex items-center gap-2">
            <span className="p-1.5 bg-[#F3E9D8] border border-[#DFCEB4] text-[#785324] rounded-xl">
              <Package className="w-5 h-5 shrink-0" />
            </span>
            <span>คลังคลิปหลัก (Master Archive)</span>
          </h1>
          <p className="text-xs text-[#716960] mt-0.5">
            ประวัติคลิปหลักที่จัดทำเสร็จ และอัตราการหยิบฟุตเทจมาใช้งานจริง
          </p>
        </div>

        {/* Dual View Mode Switcher: รายตอน vs คลังชั้นวางซีรีส์ */}
        <div className="flex items-center gap-1 p-1 bg-[#F5EFE6] border border-[#E2D6C5] rounded-xl self-start sm:self-auto shadow-2xs">
          <button
            type="button"
            onClick={() => onTabChange('EPISODES')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
              archiveTab === 'EPISODES'
                ? 'bg-[#E6F2E6] text-[#224A2D] border-[#9EC49C] shadow-2xs'
                : 'border-transparent text-[#5C544C] hover:text-[#2D2926] hover:bg-white/60'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span>มุมมองรายตอน ({sortedEpisodesCount.toLocaleString()})</span>
          </button>
          <button
            type="button"
            onClick={() => onTabChange('SERIES_SHELF')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
              archiveTab === 'SERIES_SHELF'
                ? 'bg-[#E6F2E6] text-[#224A2D] border-[#9EC49C] shadow-2xs'
                : 'border-transparent text-[#5C544C] hover:text-[#2D2926] hover:bg-white/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>คลังชั้นวางซีรีส์ ({categoryRanking.length})</span>
          </button>
        </div>
      </div>

      {/* 4 Concise Pastel Earth-Tone KPI Cards with Tooltips */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Total Episodes */}
        <button
          type="button"
          onClick={() => onCategoryFilterChange('ALL')}
          title="จำนวนคลิปหลักที่จัดทำเสร็จทั้งหมดในระบบ (คลิกเพื่อแสดงทุกหมวดหมู่)"
          className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
            categoryFilter === 'ALL'
              ? 'bg-[#FAF3E6] text-[#3D3327] border-[#DEC49A] ring-1 ring-[#E8D4B4] shadow-2xs'
              : 'bg-[#FAF7F2] hover:bg-[#FAF3E6]/70 border-[#E6DDD0] text-[#2D2926]'
          }`}
        >
          <div className="text-xs font-bold text-[#785324] flex items-center gap-1.5">
            <Package className="w-3.5 h-3.5 text-[#8A5A22] shrink-0" />
            <span>คลังทั้งหมด</span>
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-mono font-extrabold tabular-nums text-[#2D2926]">
              {overviewMetrics.totalEpisodes.toLocaleString()}
              <span className="text-xs font-sans font-bold text-[#787066] ml-1">ตอน</span>
            </span>
            <span className="text-[11px] font-mono text-[#787066]">
              รวม {(overviewMetrics.totalEpisodes * 5).toLocaleString()} ช็อต
            </span>
          </div>
        </button>

        {/* Card 2: Footage Utilization Rate */}
        <div
          title="สัดส่วนฟุตเทจในคลังที่ถูกนำมาผลิตคลิปหลักแล้วอย่างน้อย 1 ครั้ง"
          className="p-3.5 rounded-xl border border-[#C6DEC5] bg-[#EFF6EE] text-[#2D2926] cursor-default"
        >
          <div className="text-xs font-bold text-[#285333] flex items-center gap-1.5">
            <Repeat className="w-3.5 h-3.5 text-[#386B46] shrink-0" />
            <span>อัตราการใช้ฟุต</span>
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-mono font-extrabold tabular-nums text-[#244B2F]">
              {overviewMetrics.utilizationRate}%
            </span>
            <span className="text-[11px] font-mono text-[#2F5E3B]">
              ใช้แล้ว {overviewMetrics.usedFootage}/{overviewMetrics.totalFootage} ฟุต (ซ้ำ {overviewMetrics.reusedMoreThanOnce})
            </span>
          </div>
        </div>

        {/* Card 3: Most Produced Category */}
        {overviewMetrics.topCategory && (
          <button
            type="button"
            onClick={() =>
              onCategoryFilterChange(
                categoryFilter === overviewMetrics.topCategory!.mainTag.id
                  ? 'ALL'
                  : overviewMetrics.topCategory!.mainTag.id
              )
            }
            title={`หมวดหมู่ที่มีการผลิตคลิปหลักมากที่สุดในคลัง: #${overviewMetrics.topCategory.mainTag.name} (คลิกเพื่อกรอง)`}
            className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
              categoryFilter === overviewMetrics.topCategory.mainTag.id
                ? 'bg-[#E5F1F6] text-[#1E465C] border-[#9EC6D8] ring-1 ring-[#B8D7E6] shadow-2xs'
                : 'bg-[#EFF6F9] hover:bg-[#E5F1F6] border-[#C9E0EB] text-[#2D2926]'
            }`}
          >
            <div className="text-xs font-bold text-[#23546E] flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-[#2E6B8A] shrink-0" />
              <span>ผลิตสูงสุด</span>
            </div>
            <div className="mt-1 flex items-baseline justify-between gap-2">
              <span className="text-sm font-extrabold text-[#2D2926] truncate">
                #{overviewMetrics.topCategory.mainTag.name}
              </span>
              <span className="text-xs font-mono font-extrabold tabular-nums text-[#23546E] shrink-0">
                {overviewMetrics.topCategory.episodeCount} EP ({overviewMetrics.topCategory.episodeSharePercent}%)
              </span>
            </div>
          </button>
        )}

        {/* Card 4: Least Produced Category */}
        {overviewMetrics.leastCategory && (
          <button
            type="button"
            onClick={() =>
              onCategoryFilterChange(
                categoryFilter === overviewMetrics.leastCategory!.mainTag.id
                  ? 'ALL'
                  : overviewMetrics.leastCategory!.mainTag.id
              )
            }
            title={`หมวดที่ผลิตน้อยที่สุด: #${overviewMetrics.leastCategory.mainTag.name} (แนะนำจัดทำเพิ่มจากฟุตเทจที่ยังว่าง ${overviewMetrics.leastCategory.usableFootageInCat} ฟุต)`}
            className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
              categoryFilter === overviewMetrics.leastCategory.mainTag.id
                ? 'bg-[#FBF0DC] text-[#664214] border-[#DEC190] ring-1 ring-[#EAD3AC] shadow-2xs'
                : 'bg-[#FDF6EA] hover:bg-[#FBF0DC] border-[#EAD9BC] text-[#2D2926]'
            }`}
          >
            <div className="text-xs font-bold text-[#785324] flex items-center gap-1.5">
              <TrendingDown className="w-3.5 h-3.5 text-[#8A5A22] shrink-0" />
              <span>ผลิตน้อยสุด</span>
            </div>
            <div className="mt-1 flex items-baseline justify-between gap-2">
              <span className="text-sm font-extrabold text-[#2D2926] truncate">
                #{overviewMetrics.leastCategory.mainTag.name}
              </span>
              <span className="text-xs font-mono font-extrabold tabular-nums text-[#785324] shrink-0">
                {overviewMetrics.leastCategory.episodeCount} EP · ว่าง {overviewMetrics.leastCategory.usableFootageInCat}
              </span>
            </div>
          </button>
        )}
      </div>
    </div>
  );
};
