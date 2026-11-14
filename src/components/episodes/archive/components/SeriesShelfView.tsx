import React from 'react';
import { Sparkles, ArrowRight, Plus, Eye, EyeOff, FolderKanban } from 'lucide-react';
import { formatThaiDate } from '../../../../utils/fileNameGenerator';
import type { MixRecipeId } from '../../../../utils/collisionDetector';
import type { ArchiveSeriesCategory } from '../../../../types/tag.types';
import type { Episode } from '../../../../types/episode.types';
import type { CategoryRankingItem } from '../hooks/useMasterArchiveMetrics';

interface SeriesShelfViewProps {
  shelfSeriesItems: CategoryRankingItem[];
  activeSeriesCount: number;
  unproducedSeriesCount: number;
  showUnproducedSeries: boolean;
  onToggleShowUnproducedSeries: () => void;
  selectedGroupId: string;
  archiveCategories: ArchiveSeriesCategory[];
  archiveCategoryMap: Record<string, ArchiveSeriesCategory>;
  onAssignSeriesToCategory: (seriesKey: string, categoryId: string) => void;
  latestEpisodeByCategoryMap: Record<string, Episode>;
  onViewCategoryEpisodes: (seriesKey: string) => void;
  launchEpisodeBuilderForCategory: (catId: string, recipeId?: MixRecipeId) => void;
  onOpenManageCategories: () => void;
}

export const SeriesShelfView: React.FC<SeriesShelfViewProps> = ({
  shelfSeriesItems,
  activeSeriesCount,
  unproducedSeriesCount,
  showUnproducedSeries,
  onToggleShowUnproducedSeries,
  selectedGroupId,
  archiveCategories,
  archiveCategoryMap,
  onAssignSeriesToCategory,
  latestEpisodeByCategoryMap,
  onViewCategoryEpisodes,
  launchEpisodeBuilderForCategory,
  onOpenManageCategories,
}) => {
  const totalEpisodesShown = shelfSeriesItems.reduce(
    (sum, c) => sum + c.episodeCount,
    0
  );

  return (
    <div className="space-y-3.5">
      {/* Top Shelf Toolbar: Summary + 0 EP Visibility Toggle + Manage Categories */}
      <div className="bg-[#FDFBF7] border border-[#E8DFD3] rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2 text-xs text-[#6E665E]">
          <span>
            กำลังแสดง{' '}
            <strong className="font-mono font-bold text-[#2D2926]">
              {shelfSeriesItems.length}
            </strong>{' '}
            รายการ &ldquo;5 อันดับ&rdquo;
          </span>
          {selectedGroupId !== 'ALL' && archiveCategoryMap[selectedGroupId] && (
            <span>
              ในหมวดคลังคลิป{' '}
              <strong className="text-[#785324]">
                {archiveCategoryMap[selectedGroupId].name}
              </strong>
            </span>
          )}
          <span className="text-[#D5C9B8]">•</span>
          <span className="font-mono text-[#224A2D] font-bold">
            รวม {totalEpisodesShown.toLocaleString()} คลิปที่ผลิตแล้ว
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Toggle 0 EP Unproduced Tags */}
          <button
            type="button"
            onClick={onToggleShowUnproducedSeries}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              showUnproducedSeries
                ? 'bg-[#FAF2E1] text-[#6B4616] border-[#DEC190] shadow-2xs'
                : 'bg-[#FAF7F2] text-[#5C5349] border-[#E2D8C9] hover:bg-[#F3ECE0]'
            }`}
          >
            {showUnproducedSeries ? (
              <>
                <EyeOff className="w-3.5 h-3.5 text-[#8A5A22]" />
                <span>ซ่อนหมวด 0 ตอน ({unproducedSeriesCount} หมวด)</span>
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5 text-[#787066]" />
                <span>
                  แสดงเฉพาะที่ผลิตจริง ({activeSeriesCount} รายการ) · กดดูหมวด 0 ตอน (+
                  {unproducedSeriesCount})
                </span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onOpenManageCategories}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#EEF5EE] hover:bg-[#E1EDE1] text-[#224A2D] border border-[#BBD6B9] transition-colors cursor-pointer"
          >
            <FolderKanban className="w-3.5 h-3.5" />
            <span>จัดหมวดรายการ 5 อันดับ</span>
          </button>
        </div>
      </div>

      {/* Series Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {shelfSeriesItems.map((item) => {
          const latestEp = latestEpisodeByCategoryMap[item.seriesKey] || null;
          const nextEpNumber = item.episodeCount + 1;
          const estProducible = Math.floor(item.usableFootageInCat / 5);
          const isUnproduced = item.episodeCount === 0;

          return (
            <div
              key={item.seriesKey}
              className={`rounded-2xl p-4 transition-all flex flex-col justify-between gap-3.5 border ${
                isUnproduced
                  ? 'bg-[#FAF8F4]/80 border-dashed border-[#DFD5C6] hover:border-[#CBBBA4]'
                  : 'bg-[#FDFBF7] border-[#E8DFD3] hover:border-[#D6BD94] hover:shadow-2xs'
              }`}
            >
              <div className="space-y-2.5">
                {/* Top Row: Direct Category Assignment Dropdown + Episode Count Pill */}
                <div className="flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1 min-w-0">
                    <select
                      value={item.archiveCategoryId}
                      onChange={(e) =>
                        onAssignSeriesToCategory(item.seriesKey, e.target.value)
                      }
                      title="เปลี่ยนหมวดหมู่คลังคลิปของรายการ 5 อันดับนี้"
                      className="px-2 py-0.5 rounded-lg bg-[#FAF2E1] hover:bg-[#F3E5C8] text-[#6E4919] border border-[#E6D4B3] text-[11px] font-bold focus:outline-hidden cursor-pointer max-w-[190px] truncate"
                    >
                      {archiveCategories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full font-mono text-[11px] font-bold shrink-0 border ${
                      isUnproduced
                        ? 'bg-[#F2ECE4] text-[#8C8277] border-[#E2D8C9]'
                        : 'bg-[#E6F2E6] text-[#224A2D] border-[#A7C9A5]'
                    }`}
                  >
                    {isUnproduced ? '0 ตอน (ยังไม่ผลิต)' : `${item.episodeCount} คลิป`}
                  </span>
                </div>

                {/* Series Title: 5 อันดับ + [ชื่อรายการ] */}
                <div>
                  <h2 className="text-base font-extrabold text-[#2D2926] flex items-center gap-1.5 leading-snug">
                    <Sparkles className="w-4 h-4 text-[#8A5A22] shrink-0" />
                    <span className="text-[#785324] font-bold text-xs shrink-0">
                      5 อันดับ
                    </span>
                    <span className="truncate">{item.seriesName}</span>
                  </h2>
                  <p className="text-xs text-[#716960] mt-0.5 line-clamp-1">
                    {item.mainTag.description ||
                      `รายการจัดอันดับ 5 อันดับ ${item.seriesName}`}
                  </p>
                </div>

                {/* Stats Strip */}
                <div className="grid grid-cols-2 gap-2 p-2.5 bg-[#FAF6F0] rounded-xl border border-[#EDE5D8] text-xs">
                  <div>
                    <div className="text-[11px] text-[#787066]">
                      จำนวนคลิปในรายการนี้
                    </div>
                    <div className="font-mono font-bold text-[#2D2926] text-sm">
                      {item.episodeCount}{' '}
                      <span className="text-[10px] font-normal text-[#787066]">
                        ตอน ({item.episodeSharePercent}% ของคลัง)
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-[#787066]">
                      ฟุตเทจเกี่ยวเนื่องที่ว่าง
                    </div>
                    <div className="font-mono font-bold text-[#2D633B] text-sm">
                      {item.usableFootageInCat}{' '}
                      <span className="text-[10px] font-normal text-[#787066]">
                        ฟุต (~{estProducible} EP)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Latest EP Info */}
                {latestEp ? (
                  <div className="text-[11px] text-[#6E665E] flex items-center justify-between pt-0.5">
                    <span className="truncate">
                      ตอนล่าสุด:{' '}
                      <strong className="text-[#2D2926]">
                        EP.{latestEp.categoryEpisodeNo || item.episodeCount}
                      </strong>{' '}
                      ({formatThaiDate(latestEp.publishDate)})
                    </span>
                    <span className="font-mono text-[#785324] font-bold shrink-0 ml-1">
                      {latestEp.id}
                    </span>
                  </div>
                ) : (
                  <div className="text-[11px] text-[#9C9286] italic pt-0.5">
                    ยังไม่เคยผลิตคลิปหลักในหัวข้อนี้
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="pt-2.5 border-t border-[#EDE5D8] flex items-center gap-2">
                {item.episodeCount > 0 ? (
                  <button
                    type="button"
                    onClick={() => onViewCategoryEpisodes(item.seriesKey)}
                    className="flex-1 py-1.5 px-2.5 text-xs font-bold text-[#4D4740] bg-[#F5EFE6] hover:bg-[#EAE0D2] border border-[#E2D8C9] rounded-xl transition-colors text-center cursor-pointer flex items-center justify-center gap-1"
                  >
                    <span>ดูทั้ง {item.episodeCount} คลิป</span>
                    <ArrowRight className="w-3 h-3 text-[#6E665E]" />
                  </button>
                ) : (
                  <div className="flex-1 py-1.5 px-2.5 text-[11px] text-[#9C9286] bg-[#F5F1EA] border border-[#E6DFD3] rounded-xl text-center">
                    ยังไม่มีคลิปในคลัง
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => {
                    launchEpisodeBuilderForCategory(
                      item.builderTargetTagId,
                      item.untouchedFootageInCat >= 5
                        ? 'FORMULA_ALL_NEW'
                        : 'FORMULA_2_NEW_3_FRESH'
                    );
                  }}
                  className="py-1.5 px-3 text-xs font-bold text-[#224A2D] bg-[#E6F2E6] hover:bg-[#D5E8D5] border border-[#A5C9A3] rounded-xl transition-colors shadow-2xs cursor-pointer flex items-center gap-1 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>สร้าง EP.{nextEpNumber}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
