import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  Sparkles,
  CheckCircle2,
  ChevronRight,
  Sun,
  Moon,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Play,
  Film,
} from 'lucide-react';
import { useCMS } from '../../../../context/CMSContext';
import { formatThaiDate } from '../../../../utils/fileNameGenerator';
import { extractEpisodeSeriesInfo } from '../../../../utils/seriesExtractor';
import { evaluateEpisodeCompleteness } from '../../../../utils/episodeValidator';
import { TagPill } from '../../../ui/TagPill';
import { PaginationBar } from '../../../ui/PaginationBar';
import { VideoThumbnailPreview } from '../../../footage/VideoThumbnailPreview';
import { EpisodeCompletenessBadge } from './EpisodeCompletenessBadge';
import type { Episode } from '../../../../types/episode.types';
import type { EpisodeFootageMix } from '../hooks/useMasterArchiveMetrics';
import type { SortOption } from '../hooks/useMasterArchiveFilter';

interface EpisodeTableViewProps {
  paginatedEpisodes: Episode[];
  totalFilteredCount: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  getEpisodeFootageMix: (ep: Episode) => EpisodeFootageMix;
  onSelectEpisode: (episodeId: string) => void;
  sortBy?: SortOption;
  onToggleSortColumn?: (column: 'TITLE' | 'ID' | 'DATE') => void;
}

const SLIDE_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

export const EpisodeTableView: React.FC<EpisodeTableViewProps> = ({
  paginatedEpisodes,
  totalFilteredCount,
  currentPage,
  pageSize,
  onPageChange,
  onPageSizeChange,
  getEpisodeFootageMix,
  onSelectEpisode,
  sortBy = 'DATE_DESC',
  onToggleSortColumn,
}) => {
  const { tagMap, computedFootageMap, setPreviewFootageId } = useCMS();
  const prefersReducedMotion = useReducedMotion();

  if (paginatedEpisodes.length === 0) {
    return (
      <div className="bg-[#FDFBF7] border border-[#E8DFD3] rounded-2xl p-10 text-center space-y-2 shadow-2xs">
        <p className="text-sm font-bold text-[#2D2926]">
          ไม่พบคลิปหลักที่ตรงกับเงื่อนไขการค้นหา
        </p>
        <p className="text-xs text-[#787066]">
          ลองปรับตัวกรองหมวดหมู่ หมวดย่อย สถานะ หรือล้างคำค้นหา
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <motion.div
        key={`table-page-${currentPage}`}
        initial={prefersReducedMotion ? false : { opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={
          prefersReducedMotion
            ? { duration: 0 }
            : { duration: 0.2, ease: SLIDE_EASE }
        }
        className="bg-[#FDFBF7] border border-[#E8DFD3] rounded-2xl overflow-hidden shadow-2xs"
      >
        <div className="overflow-x-auto scrollbar-earth">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#FAF6F0] border-b border-[#E8DFD3] text-xs font-bold text-[#5C544C]">
                {/* 1. ID Column */}
                <th
                  onClick={() => onToggleSortColumn?.('ID')}
                  className="py-2.5 px-3.5 w-44 cursor-pointer select-none hover:bg-[#F2ECE0] transition-colors group/th whitespace-nowrap"
                  title="สลับเรียงลำดับรหัส EP"
                >
                  <div className="flex items-center gap-1">
                    <span>รหัส &amp; ซีรีส์</span>
                    {sortBy === 'ID_ASC' ? (
                      <ArrowUp className="w-3.5 h-3.5 text-[#244B2F]" />
                    ) : sortBy === 'ID_DESC' ? (
                      <ArrowDown className="w-3.5 h-3.5 text-[#6B4616]" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-[#A89E92] opacity-40 group-hover/th:opacity-100 transition-opacity" />
                    )}
                  </div>
                </th>

                {/* 2. Main Title Column */}
                <th
                  onClick={() => onToggleSortColumn?.('TITLE')}
                  className="py-2.5 px-3.5 cursor-pointer select-none hover:bg-[#F2ECE0] transition-colors group/th whitespace-nowrap"
                  title="สลับเรียงลำดับชื่อคลิป (ก-ฮ / ฮ-ก)"
                >
                  <div className="flex items-center gap-1">
                    <span>ชื่อคลิป &amp; 5 อันดับ</span>
                    {sortBy === 'TITLE_ASC' ? (
                      <ArrowUp className="w-3.5 h-3.5 text-[#1B4B67]" />
                    ) : sortBy === 'TITLE_DESC' ? (
                      <ArrowDown className="w-3.5 h-3.5 text-[#1B4B67]" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-[#A89E92] opacity-40 group-hover/th:opacity-100 transition-opacity" />
                    )}
                  </div>
                </th>

                {/* 3. Category */}
                <th className="py-2.5 px-3.5 w-44 whitespace-nowrap">หมวดหมู่</th>

                {/* 4. Completeness Status */}
                <th className="py-2.5 px-3.5 w-40 whitespace-nowrap">สถานะ</th>

                {/* 5. Footage Proportion */}
                <th className="py-2.5 px-3.5 w-36 whitespace-nowrap">สัดส่วนฟุต</th>

                {/* 6. Date Column */}
                <th
                  onClick={() => onToggleSortColumn?.('DATE')}
                  className="py-2.5 px-3.5 w-32 cursor-pointer select-none hover:bg-[#F2ECE0] transition-colors group/th whitespace-nowrap"
                  title="สลับเรียงลำดับวันที่สร้าง"
                >
                  <div className="flex items-center gap-1">
                    <span>วันที่สร้าง</span>
                    {sortBy === 'DATE_DESC' ? (
                      <ArrowDown className="w-3.5 h-3.5 text-[#6B4616]" />
                    ) : sortBy === 'DATE_ASC' ? (
                      <ArrowUp className="w-3.5 h-3.5 text-[#244B2F]" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-[#A89E92] opacity-40 group-hover/th:opacity-100 transition-opacity" />
                    )}
                  </div>
                </th>

                {/* 7. Action */}
                <th className="py-2.5 px-3 w-12 text-right whitespace-nowrap" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EDE5D8] text-xs">
              {paginatedEpisodes.map((ep) => {
                const mix = getEpisodeFootageMix(ep);
                const seriesInfo = extractEpisodeSeriesInfo(ep, tagMap);
                const completeness = evaluateEpisodeCompleteness(ep);

                return (
                  <tr
                    key={ep.id}
                    onClick={() => onSelectEpisode(ep.id)}
                    className={`cursor-pointer transition-colors group ${
                      !completeness.isComplete
                        ? 'hover:bg-[#FAF0E6]/70 bg-[#FFFDF9]'
                        : 'hover:bg-[#FAF3E6]/70'
                    }`}
                  >
                    <td className="py-2.5 px-3.5 whitespace-nowrap max-w-[190px]">
                      <div className="font-mono font-bold text-[#6B4616] tabular-nums">
                        {ep.id}
                      </div>
                      <div className="text-[11px] font-semibold text-[#244B2F] truncate mt-0.5">
                        {seriesInfo.seriesName} · EP.{seriesInfo.parsedEpisodeNo}
                      </div>
                    </td>

                    <td className="py-2.5 px-3.5 min-w-[260px] max-w-[440px]">
                      <div className="font-bold text-[#2D2926] text-xs sm:text-sm truncate group-hover:text-[#6B4616] transition-colors">
                        {ep.title}
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                        {ep.rankings.map((slot) => {
                          const ft = slot.footageId
                            ? computedFootageMap[slot.footageId]
                            : null;
                          return (
                            <div
                              key={slot.rank}
                              onClick={(e) => {
                                if (ft) {
                                  e.stopPropagation();
                                  setPreviewFootageId(ft.id);
                                }
                              }}
                              title={
                                ft
                                  ? `อันดับ #${slot.rank}: ${ft.id} — ${ft.title} (คลิกดูวิดีโอ)`
                                  : `อันดับ #${slot.rank}: ${slot.footageId || 'ว่าง'}`
                              }
                              className={`group/thumb inline-flex items-center gap-1 px-1 py-0.5 rounded-lg border transition-colors ${
                                ft
                                  ? 'bg-[#FAF6F0] hover:bg-[#F2ECE0] border-[#E4DDD3] hover:border-[#DEC5A0] cursor-pointer shadow-2xs'
                                  : 'bg-[#F7F3EC] border-[#E8DFD3] text-[#A69B8D] cursor-default'
                              }`}
                            >
                              <div className="relative w-7 h-5 rounded overflow-hidden bg-slate-900/10 shrink-0 border border-black/5 flex items-center justify-center">
                                {ft ? (
                                  <>
                                    <VideoThumbnailPreview footage={ft} size="xs" />
                                    <div className="absolute inset-0 bg-black/15 group-hover/thumb:bg-black/0 transition-colors flex items-center justify-center pointer-events-none">
                                      <Play className="w-2 h-2 text-white drop-shadow-xs opacity-75 group-hover/thumb:opacity-100" />
                                    </div>
                                  </>
                                ) : (
                                  <Film className="w-2.5 h-2.5 text-[#A69B8D]" />
                                )}
                                <span className="absolute top-0.2 left-0.2 px-0.5 rounded bg-black/75 text-white font-mono font-black text-[7px] leading-none pointer-events-none tabular-nums">
                                  #{slot.rank}
                                </span>
                              </div>
                              <span className="font-mono text-[10px] font-bold text-[#6B4616] tabular-nums">
                                {slot.footageId || '—'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </td>

                    <td className="py-2.5 px-3.5">
                      <div className="flex flex-wrap gap-1.5">
                        <TagPill tag={tagMap[ep.mainCategoryTagId]} />
                        {ep.targetSubcategoryId &&
                          tagMap[ep.targetSubcategoryId] && (
                            <TagPill tag={tagMap[ep.targetSubcategoryId]} />
                          )}
                      </div>
                    </td>

                    <td className="py-2.5 px-3.5 whitespace-nowrap">
                      <EpisodeCompletenessBadge episode={ep} />
                    </td>

                    <td className="py-2.5 px-3.5 font-mono tabular-nums whitespace-nowrap text-[11px]">
                      <span className="inline-flex items-center gap-1 text-[#23546E] font-bold">
                        <Sparkles className="w-2.5 h-2.5 text-[#2E6B8A]" />
                        <span>ใหม่ {mix.newCount}</span>
                      </span>
                      <span className="text-[#CFC4B6] mx-1">·</span>
                      <span className="inline-flex items-center gap-1 text-[#244B2F] font-bold">
                        <CheckCircle2 className="w-2.5 h-2.5 text-[#386B46]" />
                        <span>วนใช้ {mix.recycledCount}</span>
                      </span>
                    </td>

                    <td className="py-2.5 px-3.5 font-mono tabular-nums text-[#5C544C] whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        {ep.publishSlot === 'MORNING_0600' ? (
                          <Sun className="w-3 h-3 text-[#B57B2E]" />
                        ) : (
                          <Moon className="w-3 h-3 text-[#4F758B]" />
                        )}
                        <span>{formatThaiDate(ep.publishDate)}</span>
                      </div>
                    </td>

                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      <ChevronRight className="w-4 h-4 text-[#8C7A65] group-hover:text-[#5C3A0E] inline-block transition-colors" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>

      <PaginationBar
        currentPage={currentPage}
        totalItems={totalFilteredCount}
        pageSize={pageSize}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        pageSizeOptions={[6, 12, 24, 48, 96]}
        itemLabel="EP"
      />
    </div>
  );
};

