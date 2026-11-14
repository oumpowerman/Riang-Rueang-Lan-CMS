import React from 'react';
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
import { validateEpisodeStandard } from '../../../../utils/episodeValidator';
import { TagPill } from '../../../ui/TagPill';
import { PaginationBar } from '../../../ui/PaginationBar';
import { VideoThumbnailPreview } from '../../../footage/VideoThumbnailPreview';
import type { Episode, EpisodeWorkflowStage } from '../../../../types/episode.types';
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

const WORKFLOW_BADGE_MAP: Record<
  EpisodeWorkflowStage,
  { label: string; className: string }
> = {
  '1_MIXING': {
    label: '1. ผสมฟุตเทจ',
    className: 'bg-[#FAF2E1] text-[#6E4919] border-[#E6D4B3]',
  },
  '2_MASCOT_SCRIPTING': {
    label: '2. เขียนบทมาสคอต',
    className: 'bg-[#EDF5F9] text-[#23546E] border-[#C4DFED]',
  },
  '3_VIDEO_EDITING': {
    label: '3. ตัดต่อวิดีโอ',
    className: 'bg-[#FBF0DC] text-[#785324] border-[#E5CFA6]',
  },
  '4_PUBLISHED': {
    label: '4. เผยแพร่แล้ว',
    className: 'bg-[#E6F2E6] text-[#224A2D] border-[#A7C9A5]',
  },
};

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
      <div className="bg-[#FDFBF7] border border-[#E8DFD3] rounded-2xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto scrollbar-earth">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#FAF6F0] border-b border-[#E8DFD3] text-xs font-bold text-[#5C544C]">
                {/* 1. ID Column */}
                <th
                  onClick={() => onToggleSortColumn?.('ID')}
                  className="py-2.5 px-3.5 w-40 cursor-pointer select-none hover:bg-[#F2ECE0] transition-colors group/th"
                  title="คลิกเพื่อสลับเรียงลำดับรหัส EP (ใหม่ ⇄ เก่า)"
                >
                  <div className="flex items-center gap-1.5">
                    <span>รหัส & ซีรีส์ EP</span>
                    {sortBy === 'ID_ASC' ? (
                      <span className="inline-flex items-center gap-0.5 text-[#244B2F] bg-[#E2EFE2] px-1.5 py-0.2 rounded text-[10px] font-mono font-bold border border-[#C5DEC5]">
                        <span>เก่า→ใหม่</span>
                        <ArrowUp className="w-3 h-3 text-[#244B2F]" />
                      </span>
                    ) : sortBy === 'ID_DESC' ? (
                      <span className="inline-flex items-center gap-0.5 text-[#6B4616] bg-[#FAF0DE] px-1.5 py-0.2 rounded text-[10px] font-mono font-bold border border-[#E8D4BA]">
                        <span>ใหม่→เก่า</span>
                        <ArrowDown className="w-3 h-3 text-[#6B4616]" />
                      </span>
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-[#A89E92] opacity-40 group-hover/th:opacity-100 transition-opacity" />
                    )}
                  </div>
                </th>

                {/* 2. Main Title Column (A:Z / Z:A) */}
                <th
                  onClick={() => onToggleSortColumn?.('TITLE')}
                  className="py-2.5 px-3.5 cursor-pointer select-none hover:bg-[#F2ECE0] transition-colors group/th"
                  title="คลิกเพื่อสลับเรียงลำดับชื่อคลิป ก-ฮ (A:Z) หรือ ฮ-ก (Z:A)"
                >
                  <div className="flex items-center gap-1.5">
                    <span>ชื่อคลิปหลัก & 5 อันดับฟุตเทจ</span>
                    {sortBy === 'TITLE_ASC' ? (
                      <span className="inline-flex items-center gap-0.5 text-[#1B4B67] bg-[#E3EFF6] px-1.5 py-0.2 rounded text-[10px] font-bold border border-[#C3DEEC]">
                        <span>A:Z (ก-ฮ)</span>
                        <ArrowUp className="w-3 h-3 text-[#1B4B67]" />
                      </span>
                    ) : sortBy === 'TITLE_DESC' ? (
                      <span className="inline-flex items-center gap-0.5 text-[#1B4B67] bg-[#E3EFF6] px-1.5 py-0.2 rounded text-[10px] font-bold border border-[#C3DEEC]">
                        <span>Z:A (ฮ-ก)</span>
                        <ArrowDown className="w-3 h-3 text-[#1B4B67]" />
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[#8A7E70] text-[10px] font-normal group-hover/th:text-[#2D2926] bg-[#F4EFE6] px-1.5 py-0.2 rounded border border-transparent group-hover/th:border-[#DECDB8]">
                        <span>Sort A:Z</span>
                        <ArrowUpDown className="w-3 h-3 text-[#A89E92] opacity-50 group-hover/th:opacity-100" />
                      </span>
                    )}
                  </div>
                </th>

                {/* 3. Category */}
                <th className="py-2.5 px-3.5 w-44">หมวดหมู่</th>

                {/* 4. Workflow Stage */}
                <th className="py-2.5 px-3.5 w-36">สถานะงาน</th>

                {/* 5. Footage Proportion */}
                <th className="py-2.5 px-3.5 w-40">สัดส่วนฟุตเทจ</th>

                {/* 6. Date Column */}
                <th
                  onClick={() => onToggleSortColumn?.('DATE')}
                  className="py-2.5 px-3.5 w-36 cursor-pointer select-none hover:bg-[#F2ECE0] transition-colors group/th"
                  title="คลิกเพื่อสลับเรียงลำดับวันที่สร้าง (ล่าสุด ⇄ เก่าสุด)"
                >
                  <div className="flex items-center gap-1.5">
                    <span>วันที่สร้าง</span>
                    {sortBy === 'DATE_DESC' ? (
                      <span className="inline-flex items-center gap-0.5 text-[#6B4616] bg-[#FAF0DE] px-1.5 py-0.2 rounded text-[10px] font-mono font-bold border border-[#E8D4BA]">
                        <span>ล่าสุด</span>
                        <ArrowDown className="w-3 h-3 text-[#6B4616]" />
                      </span>
                    ) : sortBy === 'DATE_ASC' ? (
                      <span className="inline-flex items-center gap-0.5 text-[#244B2F] bg-[#E2EFE2] px-1.5 py-0.2 rounded text-[10px] font-mono font-bold border border-[#C5DEC5]">
                        <span>เก่าสุด</span>
                        <ArrowUp className="w-3 h-3 text-[#244B2F]" />
                      </span>
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-[#A89E92] opacity-40 group-hover/th:opacity-100 transition-opacity" />
                    )}
                  </div>
                </th>

                {/* 7. Action */}
                <th className="py-2.5 px-3.5 w-24 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EDE5D8] text-xs">
              {paginatedEpisodes.map((ep) => {
                const mix = getEpisodeFootageMix(ep);
                const seriesInfo = extractEpisodeSeriesInfo(ep, tagMap);
                const validation = validateEpisodeStandard(ep);
                const wfBadge =
                  WORKFLOW_BADGE_MAP[ep.workflowStage] || WORKFLOW_BADGE_MAP['1_MIXING'];

                return (
                  <tr
                    key={ep.id}
                    onClick={() => onSelectEpisode(ep.id)}
                    className={`cursor-pointer transition-colors group ${
                      !validation.isStandard
                        ? 'hover:bg-[#FAF0E6]/70 bg-[#FFFDF9]'
                        : 'hover:bg-[#FAF3E6]/70'
                    }`}
                  >
                    <td className="py-2.5 px-3.5 font-mono whitespace-nowrap">
                      <div className="font-bold text-[#6B4616] tabular-nums">
                        {ep.id}
                      </div>
                      <div className="text-[11px] font-sans font-semibold text-[#244B2F] bg-[#EBF3EB] px-1.5 py-0.5 rounded-md border border-[#BBD6B9] inline-flex items-center gap-1 mt-0.5">
                        <Sparkles className="w-2.5 h-2.5 text-[#386B46]" />
                        <span>
                          5 อันดับ {seriesInfo.seriesName} · EP.
                          {seriesInfo.parsedEpisodeNo}
                        </span>
                      </div>
                    </td>

                    <td className="py-2.5 px-3.5 min-w-[260px]">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-[#2D2926] text-xs sm:text-sm line-clamp-1 group-hover:text-[#6B4616]">
                          {ep.title}
                        </span>

                        {validation.hasMissingTitle && (
                          <span className="px-1.5 py-0.2 rounded bg-[#FAF0E6] text-[#8C4616] border border-[#E5CEBA] text-[10px] font-bold">
                            ยังไม่ตั้งชื่อ
                          </span>
                        )}

                        {validation.hasNon5Rank && !validation.hasMissingTitle && (
                          <span className="px-1.5 py-0.2 rounded bg-[#FAF0E6] text-[#8C4616] border border-[#E5CEBA] text-[10px] font-bold">
                            ไม่ใช่ 5 อันดับ
                          </span>
                        )}

                        {validation.hasIncompleteSlots && (
                          <span className="px-1.5 py-0.2 rounded bg-[#FAF0E6] text-[#8C4616] border border-[#E5CEBA] text-[10px] font-bold">
                            ฟุตไม่ครบ ({validation.filledSlotCount}/5)
                          </span>
                        )}
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
                                  ? `อันดับ #${slot.rank}: ${ft.id} — ${ft.title} (คลิกเพื่อดูวิดีโอตัวเต็ม)`
                                  : `อันดับ #${slot.rank}: ${slot.footageId || 'ว่าง'}`
                              }
                              className={`group/thumb inline-flex items-center gap-1 px-1 py-0.5 rounded-lg border transition-all ${
                                ft
                                  ? 'bg-[#FAF6F0] hover:bg-[#F2ECE0] border-[#E4DDD3] hover:border-[#DEC5A0] cursor-pointer shadow-2xs hover:shadow-xs'
                                  : 'bg-[#F7F3EC] border-[#E8DFD3] text-[#A69B8D] cursor-default'
                              }`}
                            >
                              <div className="relative w-7 h-5 rounded overflow-hidden bg-slate-900/10 shrink-0 border border-black/5 flex items-center justify-center">
                                {ft ? (
                                  <>
                                    <VideoThumbnailPreview footage={ft} size="xs" />
                                    <div className="absolute inset-0 bg-black/15 group-hover/thumb:bg-black/0 transition-colors flex items-center justify-center pointer-events-none">
                                      <Play className="w-2 h-2 text-white drop-shadow-xs opacity-75 group-hover/thumb:opacity-100 group-hover/thumb:scale-110" />
                                    </div>
                                  </>
                                ) : (
                                  <Film className="w-2.5 h-2.5 text-[#A69B8D]" />
                                )}
                                <span className="absolute top-0.2 left-0.2 px-0.5 rounded bg-black/75 text-white font-mono font-black text-[7px] leading-none pointer-events-none">
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
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-lg border text-[11px] font-bold ${wfBadge.className}`}
                      >
                        {wfBadge.label}
                      </span>
                    </td>

                    <td className="py-2.5 px-3.5 font-mono tabular-nums whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-[#23546E] font-bold bg-[#EDF5F9] px-1.5 py-0.5 rounded-md border border-[#C4DFED] text-[11px]">
                        <Sparkles className="w-2.5 h-2.5 text-[#2E6B8A]" />
                        <span>ใหม่ {mix.newCount}</span>
                      </span>
                      <span className="text-[#C8BCAE] mx-1">·</span>
                      <span className="inline-flex items-center gap-1 text-[#244B2F] font-bold bg-[#EBF3EB] px-1.5 py-0.5 rounded-md border border-[#BBD6B9] text-[11px]">
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

                    <td className="py-2.5 px-3.5 text-right whitespace-nowrap">
                      <span className="inline-flex items-center gap-0.5 font-bold text-[#785324] group-hover:text-[#5C3A0E]">
                        <span>เปิดดู</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

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
