import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  ArrowRight,
  Plus,
  Eye,
  EyeOff,
  Search,
  Tag,
  X,
} from 'lucide-react';
import { formatThaiDate } from '../../../../utils/fileNameGenerator';
import { extractEpisodeSeriesInfo } from '../../../../utils/seriesExtractor';
import type { MixRecipeId } from '../../../../utils/collisionDetector';
import type {
  Episode,
  EpisodeProductionTarget,
} from '../../../../types/episode.types';
import type { ArchiveSeriesCategory } from '../../../../types/tag.types';
import type { BuilderSeriesLaunchOptions } from '../../../../context/cms/cms.types';
import type { CategoryRankingItem } from '../hooks/useMasterArchiveMetrics';

interface SeriesShelfViewProps {
  shelfSeriesItems: CategoryRankingItem[];
  activeSeriesCount: number;
  unproducedSeriesCount: number;
  showUnproducedSeries: boolean;
  onToggleShowUnproducedSeries: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  archiveCategories: ArchiveSeriesCategory[];
  onAssignSeriesToCategory: (seriesKey: string, categoryId: string) => void;
  latestEpisodeByCategoryMap: Record<string, Episode>;
  onViewCategoryEpisodes: (seriesKey: string) => void;
  launchEpisodeBuilderForCategory: (
    catId: string,
    recipeId?: MixRecipeId,
    productionTarget?: EpisodeProductionTarget,
    targetSubcategoryId?: string | null,
    seriesOptions?: BuilderSeriesLaunchOptions
  ) => void;
  onOpenTagBinding?: (row: CategoryRankingItem) => void;
}

export const SeriesShelfView: React.FC<SeriesShelfViewProps> = ({
  shelfSeriesItems,
  activeSeriesCount,
  unproducedSeriesCount,
  showUnproducedSeries,
  onToggleShowUnproducedSeries,
  searchQuery,
  onSearchChange,
  archiveCategories,
  onAssignSeriesToCategory,
  latestEpisodeByCategoryMap,
  onViewCategoryEpisodes,
  launchEpisodeBuilderForCategory,
  onOpenTagBinding,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const totalEpisodesShown = shelfSeriesItems.reduce(
    (sum, c) => sum + c.episodeCount,
    0
  );

  return (
    <div className="space-y-3.5">
      {/* Unified Shelf Toolbar: Search + Summary Count + 0 EP Toggle */}
      <div className="bg-[#FDFBF7] border border-[#E8DFD3] rounded-2xl p-3 flex flex-wrap items-center justify-between gap-2.5 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[220px]">
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search className="w-3.5 h-3.5 text-[#8C8277] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="ค้นหารายการหรือแท็ก..."
              className="w-full pl-8 pr-7 py-1.5 text-xs bg-[#FAF7F2] border border-[#E2D8C9] rounded-xl focus:outline-hidden focus:bg-white focus:border-[#C5AB84] text-[#2D2926]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8C8277] hover:text-[#2D2926] cursor-pointer"
                aria-label="ล้างคำค้นหารายการ"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <span className="text-xs text-[#6E665E] font-mono tabular-nums whitespace-nowrap">
            {shelfSeriesItems.length} รายการ ·{' '}
            <strong className="text-[#224A2D]">
              {totalEpisodesShown.toLocaleString()} คลิป
            </strong>
          </span>
        </div>

        <button
          type="button"
          onClick={onToggleShowUnproducedSeries}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer whitespace-nowrap shrink-0 tabular-nums ${
            showUnproducedSeries
              ? 'bg-[#FAF2E1] text-[#6B4616] border-[#DEC190] shadow-2xs'
              : 'bg-[#FAF7F2] text-[#5C5349] border-[#E2D8C9] hover:bg-[#F3ECE0]'
          }`}
          title={
            showUnproducedSeries
              ? `แสดงเฉพาะ ${activeSeriesCount} รายการที่ผลิตแล้ว`
              : `รวมหมวดที่ยังไม่เคยผลิต (+${unproducedSeriesCount})`
          }
        >
          {showUnproducedSeries ? (
            <>
              <EyeOff className="w-3.5 h-3.5 text-[#8A5A22]" />
              <span>ซ่อน 0 ตอน ({unproducedSeriesCount})</span>
            </>
          ) : (
            <>
              <Eye className="w-3.5 h-3.5 text-[#787066]" />
              <span>ดูหมวด 0 ตอน (+{unproducedSeriesCount})</span>
            </>
          )}
        </button>
      </div>

      {/* Series Cards Grid (Single Authoritative Series Overview + Tag Binding + Stock Utilization) */}
      {shelfSeriesItems.length === 0 ? (
        <div className="bg-[#FDFBF7] border border-[#E8DFD3] rounded-2xl p-10 text-center space-y-2 shadow-2xs">
          <p className="text-sm font-bold text-[#2D2926]">
            ไม่พบรายการที่ตรงกับเงื่อนไข
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {shelfSeriesItems.map((item, idx) => {
            const latestEp = latestEpisodeByCategoryMap[item.seriesKey] || null;
            const latestParsedEpNo = latestEp
              ? extractEpisodeSeriesInfo(latestEp).parsedEpisodeNo
              : 0;
            const nextEpNumber =
              latestParsedEpNo > 0
                ? latestParsedEpNo + 1
                : item.episodeCount + 1;
            const estProducible = Math.floor(item.usableFootageInCat / 5);
            const isUnproduced = item.episodeCount === 0;

            return (
              <motion.div
                key={item.seriesKey}
                initial={prefersReducedMotion ? false : { opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={
                  prefersReducedMotion
                    ? { duration: 0 }
                    : {
                        duration: 0.2,
                        delay: Math.min(idx * 0.015, 0.14),
                        ease: [0.16, 1, 0.3, 1],
                      }
                }
                className="min-w-0"
              >
                <div
                  className={`rounded-2xl p-3.5 transition-colors flex flex-col justify-between gap-3 border h-full ${
                    isUnproduced
                      ? 'bg-[#FAF8F4]/80 border-dashed border-[#DFD5C6] hover:border-[#CBBBA4]'
                      : 'bg-[#FDFBF7] border-[#E8DFD3] hover:border-[#D6BD94] hover:shadow-2xs'
                  }`}
                >
                <div className="space-y-2.5">
                  {/* Top Row: Category Dropdown + Concise Episode Count */}
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <select
                      value={item.archiveCategoryId}
                      onChange={(e) =>
                        onAssignSeriesToCategory(item.seriesKey, e.target.value)
                      }
                      title="เปลี่ยนหมวดคลังคลิป"
                      className="px-2 py-0.5 rounded-lg bg-[#FAF2E1] hover:bg-[#F3E5C8] text-[#6E4919] border border-[#E6D4B3] text-[11px] font-bold focus:outline-hidden cursor-pointer max-w-[180px] truncate"
                    >
                      {archiveCategories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>

                    <span
                      className={`font-mono text-xs font-extrabold tabular-nums shrink-0 ${
                        isUnproduced ? 'text-[#8C8277]' : 'text-[#224A2D]'
                      }`}
                    >
                      {isUnproduced ? '0 ตอน' : `${item.episodeCount} คลิป`}
                    </span>
                  </div>

                  {/* Clean Title + Matched Tags Binding Row */}
                  <div className="space-y-1">
                    <h2 className="text-sm sm:text-base font-extrabold text-[#2D2926] truncate leading-snug">
                      <span className="text-[#785324] font-bold text-xs mr-1.5">
                        5 อันดับ
                      </span>
                      <span>{item.seriesName}</span>
                    </h2>

                    <div className="flex items-center justify-between gap-2 text-[11px]">
                      <span
                        className={`truncate ${
                          item.matchedTagNames.length > 0
                            ? item.isCustomTagBound
                              ? 'text-[#224A2D] font-semibold'
                              : 'text-[#5C544C]'
                            : 'text-[#9E571E]'
                        }`}
                        title={
                          item.matchedTagNames.length > 0
                            ? item.matchedTagNames.join(', ')
                            : 'ยังไม่พบแท็กตรงกัน'
                        }
                      >
                        {item.matchedTagNames.length > 0
                          ? `#${item.matchedTagNames.join(', #')}`
                          : 'ยังไม่ผูกแท็ก'}
                      </span>

                      {onOpenTagBinding && (
                        <button
                          type="button"
                          onClick={() => onOpenTagBinding(item)}
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[#FAF2E1] hover:bg-[#F2E3C2] text-[#6B4616] border border-[#DFC69E] text-[10px] font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0"
                          title="ผูกแท็ก 3 ชั้นประจำรายการนี้"
                        >
                          <Tag className="w-2.5 h-2.5" />
                          <span>
                            {item.matchedTagNames.length > 0
                              ? 'แก้แท็ก'
                              : 'ผูกแท็ก'}
                          </span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Consolidated Stats & Footage Utilization Strip */}
                  <div className="p-2.5 bg-[#FAF6F0] rounded-xl border border-[#EDE5D8] space-y-1.5 text-xs">
                    <div className="flex items-center justify-between gap-2 font-mono tabular-nums text-[11px]">
                      <span className="text-[#5C544C]">
                        สัดส่วนคลัง{' '}
                        <strong className="text-[#2D2926]">
                          {item.episodeSharePercent}%
                        </strong>
                      </span>
                      <span className="text-[#244B2F] font-bold">
                        ว่าง {item.usableFootageInCat} ฟุต (~{estProducible} EP)
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="h-1.5 w-full bg-[#EAE2D6] rounded-full overflow-hidden">
                        <div
                          style={{ width: `${item.utilizationPercent}%` }}
                          className="h-full bg-[#77B285] rounded-full"
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] font-mono tabular-nums text-[#6E665E]">
                        <span>
                          ใช้ฟุตแล้ว {item.utilizationPercent}% (
                          {item.usedFootageInCat}/{item.totalFootageInCat})
                        </span>
                        {latestEp && (
                          <span>
                            ล่าสุด EP.
                            {latestParsedEpNo ||
                              latestEp.categoryEpisodeNo ||
                              item.episodeCount}{' '}
                            · {formatThaiDate(latestEp.publishDate)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Concise Card Actions */}
                <div className="pt-2 border-t border-[#EDE5D8] flex items-center gap-2">
                  {item.episodeCount > 0 ? (
                    <button
                      type="button"
                      onClick={() => onViewCategoryEpisodes(item.seriesKey)}
                      className="flex-1 py-1.5 px-2.5 text-xs font-bold text-[#4D4740] bg-[#F5EFE6] hover:bg-[#EAE0D2] border border-[#E2D8C9] rounded-xl transition-colors text-center cursor-pointer flex items-center justify-center gap-1 tabular-nums"
                    >
                      <span>ดู ({item.episodeCount})</span>
                      <ArrowRight className="w-3 h-3 text-[#6E665E]" />
                    </button>
                  ) : (
                    <div className="flex-1 py-1.5 px-2 text-[11px] text-[#9C9286] text-center">
                      ยังไม่เคยผลิต
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      launchEpisodeBuilderForCategory(
                        item.builderTargetTagId,
                        item.untouchedFootageInCat >= 5
                          ? 'FORMULA_ALL_NEW'
                          : 'FORMULA_2_NEW_3_FRESH',
                        undefined,
                        null,
                        {
                          seriesKey:
                            item.episodeCount > 0 ? item.seriesKey : undefined,
                          seriesName: item.seriesName,
                          matchedTagIds: item.matchedTagIds,
                        }
                      );
                    }}
                    className="py-1.5 px-3 text-xs font-bold text-[#224A2D] bg-[#E6F2E6] hover:bg-[#D5E8D5] border border-[#A5C9A3] rounded-xl transition-colors shadow-2xs cursor-pointer flex items-center gap-1 shrink-0 tabular-nums"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>EP.{nextEpNumber}</span>
                  </button>
                </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};
