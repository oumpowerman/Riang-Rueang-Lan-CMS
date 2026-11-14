import React, { useState, useMemo } from 'react';
import {
  FolderKanban,
  Sparkles,
  Search,
  X,
  LayoutGrid,
  Rows3,
  ArrowDownWideNarrow,
  ArrowUpNarrowWide,
  ArrowDownAZ,
  ArrowUpZA,
} from 'lucide-react';
import { useCMS } from '../../../../context/CMSContext';
import type {
  CategoryRankingItem,
  ArchiveCategorySummary,
} from '../hooks/useMasterArchiveMetrics';

interface SeriesNavigationFilterBarProps {
  selectedGroupId: string;
  onSelectGroup: (groupId: string) => void;
  categoryFilter: string;
  onSelectCategory: (catId: string) => void;
  categoriesInGroup: CategoryRankingItem[];
  archiveCategoryStats: ArchiveCategorySummary[];
  totalDistinctSeriesCount: number;
  onOpenManageCategories: () => void;
}

type SeriesSortField = 'EPISODE_COUNT' | 'NAME';
type SortDirection = 'DESC' | 'ASC';

export const SeriesNavigationFilterBar: React.FC<SeriesNavigationFilterBarProps> = ({
  selectedGroupId,
  onSelectGroup,
  categoryFilter,
  onSelectCategory,
  categoriesInGroup,
  archiveCategoryStats,
  totalDistinctSeriesCount,
}) => {
  const { episodes } = useCMS();
  const [seriesSearch, setSeriesSearch] = useState('');
  const [isGridExpanded, setIsGridExpanded] = useState(false);
  const [sortField, setSortField] = useState<SeriesSortField>('EPISODE_COUNT');
  const [sortDirection, setSortDirection] = useState<SortDirection>('DESC');

  const handleSelectSort = (field: SeriesSortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'DESC' ? 'ASC' : 'DESC'));
    } else {
      setSortField(field);
      setSortDirection(field === 'EPISODE_COUNT' ? 'DESC' : 'ASC');
    }
  };

  const totalEpisodesInGroup = useMemo(
    () => categoriesInGroup.reduce((sum, c) => sum + c.episodeCount, 0),
    [categoriesInGroup]
  );

  const visibleSeries = useMemo(() => {
    const q = seriesSearch.trim().toLowerCase();
    const filtered = q
      ? categoriesInGroup.filter(
          (item) =>
            item.seriesName.toLowerCase().includes(q) ||
            item.fullSeriesTitle.toLowerCase().includes(q)
        )
      : [...categoriesInGroup];

    filtered.sort((a, b) => {
      if (sortField === 'EPISODE_COUNT') {
        const diff =
          sortDirection === 'DESC'
            ? b.episodeCount - a.episodeCount
            : a.episodeCount - b.episodeCount;
        if (diff !== 0) return diff;
        return a.seriesName.localeCompare(b.seriesName, 'th', {
          numeric: true,
          sensitivity: 'base',
        });
      }

      const cmp = a.seriesName.localeCompare(b.seriesName, 'th', {
        numeric: true,
        sensitivity: 'base',
      });
      if (cmp !== 0) return sortDirection === 'ASC' ? cmp : -cmp;
      return b.episodeCount - a.episodeCount;
    });

    return filtered;
  }, [categoriesInGroup, seriesSearch, sortField, sortDirection]);

  return (
    <div className="bg-[#FAF7F2] border border-[#E8DFD3] rounded-2xl p-3 sm:p-4 shadow-2xs space-y-3">
      {/* LEVEL 1: Independent Master Archive Categories */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2 px-0.5">
          <span className="text-xs font-extrabold text-[#2D2926] flex items-center gap-1.5">
            <FolderKanban className="w-3.5 h-3.5 text-[#8A5A22] shrink-0" />
            <span>1. หมวดคลังคลิป</span>
            <span className="hidden sm:inline text-[11px] font-normal text-[#787066]">
              · แยกอิสระจากแท็กฟุตเทจ ({archiveCategoryStats.length} หมวด)
            </span>
          </span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-ultraslim">
          <button
            type="button"
            onClick={() => {
              onSelectGroup('ALL');
              onSelectCategory('ALL');
            }}
            className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap border ${
              selectedGroupId === 'ALL'
                ? 'bg-[#F8ECDA] text-[#664214] border-[#DEC190] shadow-2xs'
                : 'bg-white text-[#4D4740] hover:bg-[#FAF3E8] border-[#E4DDD3]'
            }`}
          >
            <span className="sm:hidden">ทุกหมวด</span>
            <span className="hidden sm:inline">ทุกหมวดคลังคลิป</span>
            <span
              className={`font-mono tabular-nums text-[10px] ${
                selectedGroupId === 'ALL'
                  ? 'text-[#5C3A0E] font-bold'
                  : 'text-[#6E665E]'
              }`}
            >
              <span className="sm:hidden">({episodes.length})</span>
              <span className="hidden sm:inline">
                ({totalDistinctSeriesCount} รายการ · {episodes.length} คลิป)
              </span>
            </span>
          </button>

          {archiveCategoryStats.map((stat) => {
            const grp = stat.category;
            const isSelected = selectedGroupId === grp.id;

            return (
              <button
                key={grp.id}
                type="button"
                onClick={() => {
                  onSelectGroup(grp.id);
                  onSelectCategory('ALL');
                }}
                className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs shrink-0 transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap border ${
                  isSelected
                    ? 'bg-[#F8ECDA] text-[#664214] border-[#DEC190] font-bold shadow-2xs'
                    : 'bg-white text-[#4D4740] hover:bg-[#FAF3E8] border-[#E4DDD3] font-medium'
                }`}
              >
                <span>{grp.name}</span>
                <span
                  className={`font-mono tabular-nums text-[10px] ${
                    isSelected
                      ? 'text-[#5C3A0E] font-bold'
                      : 'text-[#6E665E]'
                  }`}
                >
                  <span className="sm:hidden">({stat.episodeCount})</span>
                  <span className="hidden sm:inline">
                    ({stat.seriesCount} รายการ · {stat.episodeCount} คลิป)
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* LEVEL 2: Smart "5 อันดับ [ชื่อรายการ]" Series Selector */}
      <div className="pt-2.5 border-t border-[#EAE0D2] space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2 px-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-extrabold text-[#2D2926] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#386B46] shrink-0" />
              <span>
                2. รายการ 5 อันดับ ({categoriesInGroup.length})
              </span>
            </span>

            {/* Sort Controls: Episode Count & Series Name */}
            <div className="inline-flex items-center gap-0.5 p-0.5 bg-[#EFE7DA] border border-[#DFD1BC] rounded-lg">
              <button
                type="button"
                onClick={() => handleSelectSort('EPISODE_COUNT')}
                title="คลิกเพื่อเรียงตามจำนวนคลิป (คลิกซ้ำเพื่อสลับ มาก→น้อย / น้อย→มาก)"
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                  sortField === 'EPISODE_COUNT'
                    ? 'bg-white text-[#224A2D] shadow-2xs border border-[#B5D1B3]'
                    : 'text-[#6B5E51] hover:text-[#2D2926] border border-transparent'
                }`}
              >
                {sortField === 'EPISODE_COUNT' && sortDirection === 'ASC' ? (
                  <ArrowUpNarrowWide className="w-3 h-3 text-[#386B46]" />
                ) : (
                  <ArrowDownWideNarrow className="w-3 h-3 text-[#386B46]" />
                )}
                <span className="sm:hidden">
                  คลิป {sortField === 'EPISODE_COUNT' ? (sortDirection === 'DESC' ? '↓' : '↑') : ''}
                </span>
                <span className="hidden sm:inline">
                  จำนวนคลิป{' '}
                  {sortField === 'EPISODE_COUNT'
                    ? sortDirection === 'DESC'
                      ? '(มาก→น้อย)'
                      : '(น้อย→มาก)'
                    : ''}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectSort('NAME')}
                title="คลิกเพื่อเรียงตามชื่อรายการ (คลิกซ้ำเพื่อสลับ ก→ฮ / ฮ→ก)"
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                  sortField === 'NAME'
                    ? 'bg-white text-[#6B4616] shadow-2xs border border-[#DEC190]'
                    : 'text-[#6B5E51] hover:text-[#2D2926] border border-transparent'
                }`}
              >
                {sortField === 'NAME' && sortDirection === 'DESC' ? (
                  <ArrowUpZA className="w-3 h-3 text-[#8A5A22]" />
                ) : (
                  <ArrowDownAZ className="w-3 h-3 text-[#8A5A22]" />
                )}
                <span className="sm:hidden">
                  ชื่อ {sortField === 'NAME' ? (sortDirection === 'ASC' ? 'ก-ฮ' : 'ฮ-ก') : ''}
                </span>
                <span className="hidden sm:inline">
                  ชื่อรายการ{' '}
                  {sortField === 'NAME'
                    ? sortDirection === 'ASC'
                      ? '(ก→ฮ)'
                      : '(ฮ→ก)'
                    : ''}
                </span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Quick search inside series bar */}
            {categoriesInGroup.length > 5 && (
              <div className="relative">
                <Search className="w-3 h-3 text-[#8C8277] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={seriesSearch}
                  onChange={(e) => setSeriesSearch(e.target.value)}
                  placeholder="ค้นหารายการ..."
                  className="pl-7 pr-6 py-1 text-[11px] bg-white border border-[#E2D8C9] rounded-lg text-[#2D2926] placeholder:text-[#9C9286] focus:outline-hidden focus:border-[#9EC49C] w-32 sm:w-44"
                />
                {seriesSearch && (
                  <button
                    type="button"
                    onClick={() => setSeriesSearch('')}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[#8C8277] hover:text-[#2D2926] cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}

            {/* Toggle between single-row horizontal scroll and full multi-row wrap */}
            {categoriesInGroup.length > 6 && (
              <button
                type="button"
                onClick={() => setIsGridExpanded((prev) => !prev)}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer whitespace-nowrap ${
                  isGridExpanded
                    ? 'bg-[#E6F2E6] text-[#224A2D] border-[#9EC49C]'
                    : 'bg-white text-[#5C5349] border-[#E2D8C9] hover:bg-[#FAF6F0]'
                }`}
              >
                {isGridExpanded ? (
                  <>
                    <Rows3 className="w-3 h-3" />
                    <span className="sm:hidden">ย่อแถว</span>
                    <span className="hidden sm:inline">ย่อเป็นแถวเลื่อน</span>
                  </>
                ) : (
                  <>
                    <LayoutGrid className="w-3 h-3" />
                    <span className="sm:hidden">กางดู</span>
                    <span className="hidden sm:inline">
                      กางดูทุกรายการ ({categoriesInGroup.length})
                    </span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        <div
          className={
            isGridExpanded
              ? 'flex flex-wrap items-center gap-1.5 max-h-60 overflow-y-auto pr-1 scrollbar-thin'
              : 'flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-ultraslim'
          }
        >
          <button
            type="button"
            onClick={() => onSelectCategory('ALL')}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap border ${
              categoryFilter === 'ALL'
                ? 'bg-[#E6F2E6] text-[#224A2D] border-[#9EC49C] shadow-2xs'
                : 'bg-white text-[#4D4740] hover:bg-[#F2F7F2] border-[#E4DDD3]'
            }`}
          >
            <span className="sm:hidden">ทั้งหมด</span>
            <span className="hidden sm:inline">ทุกรายการในหมวดนี้</span>
            <span
              className={`font-mono tabular-nums text-[10px] ${
                categoryFilter === 'ALL'
                  ? 'text-[#1D4026] font-bold'
                  : 'text-[#6E665E]'
              }`}
            >
              ({totalEpisodesInGroup})
            </span>
          </button>

          {visibleSeries.map((item) => {
            const isSelected = categoryFilter === item.seriesKey;
            return (
              <button
                key={item.seriesKey}
                type="button"
                onClick={() =>
                  onSelectCategory(isSelected ? 'ALL' : item.seriesKey)
                }
                title={`5 อันดับ ${item.seriesName} (${item.episodeCount} คลิป)`}
                className={`px-2.5 py-1.5 rounded-xl text-xs shrink-0 transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap border ${
                  isSelected
                    ? 'bg-[#E6F2E6] text-[#224A2D] border-[#9EC49C] font-bold shadow-2xs'
                    : 'bg-white text-[#4D4740] hover:bg-[#F2F7F2] border-[#E4DDD3] font-medium'
                }`}
              >
                <span className="font-bold text-[#2D2926]">
                  {item.seriesName}
                </span>
                <span
                  className={`font-mono tabular-nums text-[10px] ${
                    isSelected
                      ? 'text-[#1D4026] font-bold'
                      : 'text-[#787066]'
                  }`}
                >
                  ({item.episodeCount})
                </span>
              </button>
            );
          })}

          {visibleSeries.length === 0 && (
            <span className="text-xs text-[#8C8277] py-1 px-2">
              ไม่พบรายการ &ldquo;5 อันดับ&rdquo; ที่ตรงกับคำค้นหา
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
