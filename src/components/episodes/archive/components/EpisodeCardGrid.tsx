import React from 'react';
import {
  Sparkles,
  CheckCircle2,
  ChevronRight,
  Sun,
  Moon,
  Play,
  Film,
  AlertTriangle,
  FileQuestion,
  HelpCircle,
  Layers,
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

interface EpisodeCardGridProps {
  paginatedEpisodes: Episode[];
  totalFilteredCount: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  getEpisodeFootageMix: (ep: Episode) => EpisodeFootageMix;
  onSelectEpisode: (episodeId: string) => void;
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

export const EpisodeCardGrid: React.FC<EpisodeCardGridProps> = ({
  paginatedEpisodes,
  totalFilteredCount,
  currentPage,
  pageSize,
  onPageChange,
  onPageSizeChange,
  getEpisodeFootageMix,
  onSelectEpisode,
}) => {
  const { tagMap, computedFootageMap, setPreviewFootageId } = useCMS();

  if (paginatedEpisodes.length === 0) {
    return (
      <div className="bg-[#FDFBF7] border border-[#E8DFD3] rounded-2xl p-10 text-center space-y-2 shadow-2xs">
        <p className="text-sm font-bold text-[#2D2926]">
          ไม่พบคลิปหลักที่ตรงกับเงื่อนไขการค้นหา
        </p>
        <p className="text-xs text-[#787066]">
          ลองปรับตัวกรองหมวดคลังคลิป รายการ 5 อันดับ แท็กฟุตเทจ หรือล้างคำค้นหา
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {paginatedEpisodes.map((ep) => {
          const mix = getEpisodeFootageMix(ep);
          const seriesInfo = extractEpisodeSeriesInfo(ep, tagMap);
          const validation = validateEpisodeStandard(ep);
          const wfBadge =
            WORKFLOW_BADGE_MAP[ep.workflowStage] || WORKFLOW_BADGE_MAP['1_MIXING'];

          return (
            <div
              key={ep.id}
              onClick={() => onSelectEpisode(ep.id)}
              className={`group bg-[#FDFBF7] border rounded-2xl p-4 hover:bg-white hover:shadow-2xs transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                !validation.isStandard
                  ? 'border-[#E6CDB7] hover:border-[#D9A87E]'
                  : 'border-[#E8DFD3] hover:border-[#CFB58C]'
              }`}
            >
              <div className="space-y-2">
                {/* Top Row: Series Category EP Pill + Global ID + Workflow Stage + Warning Badges */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="px-2 py-0.5 rounded-lg bg-[#EBF3EB] text-[#244B2F] border border-[#BBD6B9] font-bold text-xs flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-[#386B46] shrink-0" />
                      <span>
                        5 อันดับ {seriesInfo.seriesName} · EP.
                        {seriesInfo.parsedEpisodeNo}
                      </span>
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-[#F4EEE4] text-[#6B4616] border border-[#E2D5C3] font-mono font-bold text-[11px] tabular-nums">
                      {ep.id}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[#787066] font-mono text-[11px]">
                      {ep.publishSlot === 'MORNING_0600' ? (
                        <Sun className="w-3 h-3 text-[#B57B2E]" />
                      ) : (
                        <Moon className="w-3 h-3 text-[#4F758B]" />
                      )}
                      <span>{formatThaiDate(ep.publishDate)}</span>
                    </span>

                    {/* Warning Badges if episode has standard issues */}
                    {validation.hasMissingTitle && (
                      <span className="px-2 py-0.5 rounded-md bg-[#FAF0E6] text-[#8C4616] border border-[#E5CEBA] text-[10px] font-bold inline-flex items-center gap-1">
                        <FileQuestion className="w-3 h-3 text-[#A85822]" />
                        <span>ยังไม่ตั้งชื่อ</span>
                      </span>
                    )}

                    {validation.hasNon5Rank && !validation.hasMissingTitle && (
                      <span className="px-2 py-0.5 rounded-md bg-[#FAF0E6] text-[#8C4616] border border-[#E5CEBA] text-[10px] font-bold inline-flex items-center gap-1">
                        <HelpCircle className="w-3 h-3 text-[#A85822]" />
                        <span>ไม่ใช่ 5 อันดับ</span>
                      </span>
                    )}

                    {validation.hasIncompleteSlots && (
                      <span className="px-2 py-0.5 rounded-md bg-[#FAF0E6] text-[#8C4616] border border-[#E5CEBA] text-[10px] font-bold inline-flex items-center gap-1">
                        <Layers className="w-3 h-3 text-[#A85822]" />
                        <span>ฟุตไม่ครบ ({validation.filledSlotCount}/5)</span>
                      </span>
                    )}
                  </div>

                  {/* Workflow Stage Badge */}
                  <span
                    className={`px-2 py-0.5 rounded-lg border text-[11px] font-bold ${wfBadge.className}`}
                  >
                    {wfBadge.label}
                  </span>
                </div>

                {/* Episode Title */}
                <h2 className="text-sm sm:text-base font-bold text-[#2D2926] leading-snug line-clamp-2 group-hover:text-[#6B4616] transition-colors">
                  {ep.title}
                </h2>

                {/* 5-Rank Mini Footage Strip with Image Previews */}
                <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
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
                            ? `อันดับ #${slot.rank}: ${ft.id} — ${ft.title} (คลิกดูวิดีโอตัวเต็ม)`
                            : `อันดับ #${slot.rank}: ${slot.footageId || 'ว่าง'}`
                        }
                        className={`group/thumb inline-flex items-center gap-1.5 p-1 rounded-lg border transition-all ${
                          ft
                            ? 'bg-[#FAF6F0] hover:bg-[#F2ECE0] border-[#E6DDD0] hover:border-[#DEC5A0] cursor-pointer shadow-2xs hover:shadow-xs'
                            : 'bg-[#F7F3EC] border-[#E8DFD3] text-[#A69B8D] cursor-default'
                        }`}
                      >
                        {/* Mini Thumbnail or Rank Placeholder */}
                        <div className="relative w-9 h-6 rounded overflow-hidden bg-slate-900/10 shrink-0 border border-black/5 flex items-center justify-center">
                          {ft ? (
                            <>
                              <VideoThumbnailPreview footage={ft} size="xs" />
                              <div className="absolute inset-0 bg-black/15 group-hover/thumb:bg-black/0 transition-colors flex items-center justify-center pointer-events-none">
                                <Play className="w-2.5 h-2.5 text-white drop-shadow-xs opacity-75 group-hover/thumb:opacity-100 group-hover/thumb:scale-110 transition-transform" />
                              </div>
                            </>
                          ) : (
                            <Film className="w-3 h-3 text-[#A69B8D]" />
                          )}
                          <span className="absolute top-0.5 left-0.5 px-1 py-0.2 rounded bg-black/70 text-white font-mono font-black text-[8px] leading-none pointer-events-none">
                            #{slot.rank}
                          </span>
                        </div>

                        <div className="flex flex-col text-left">
                          <span className="text-[10px] font-mono font-bold text-[#6B4616] tabular-nums leading-tight">
                            {slot.footageId || '—'}
                          </span>
                          {ft && (
                            <span className="text-[9px] text-[#787066] max-w-[85px] truncate leading-tight">
                              {ft.title}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Row: Category Tags + Footage Mix + Inspect CTA */}
              <div className="pt-2.5 border-t border-[#EDE5D8] flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                  <TagPill tag={tagMap[ep.mainCategoryTagId]} />
                  {ep.targetSubcategoryId && tagMap[ep.targetSubcategoryId] && (
                    <TagPill tag={tagMap[ep.targetSubcategoryId]} />
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex items-center gap-1 text-[11px] font-mono tabular-nums">
                    <span className="inline-flex items-center gap-1 text-[#23546E] font-bold bg-[#EDF5F9] px-1.5 py-0.5 rounded-md border border-[#C4DFED]">
                      <Sparkles className="w-2.5 h-2.5 text-[#2E6B8A]" />
                      <span>ใหม่ {mix.newCount}</span>
                    </span>
                    <span className="inline-flex items-center gap-1 text-[#244B2F] font-bold bg-[#EBF3EB] px-1.5 py-0.5 rounded-md border border-[#BBD6B9]">
                      <CheckCircle2 className="w-2.5 h-2.5 text-[#386B46]" />
                      <span>วนใช้ {mix.recycledCount}</span>
                    </span>
                  </div>

                  <span className="inline-flex items-center gap-0.5 text-xs font-bold text-[#785324] group-hover:text-[#5C3A0E] transition-colors">
                    <span>ดูรายละเอียด</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </div>
          );
        })}
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
