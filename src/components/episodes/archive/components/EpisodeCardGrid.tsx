import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  Sparkles,
  CheckCircle2,
  ChevronRight,
  Sun,
  Moon,
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

const SLIDE_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

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
  const prefersReducedMotion = useReducedMotion();

  if (paginatedEpisodes.length === 0) {
    return (
      <div className="bg-[#FDFBF7] border border-[#E8DFD3] rounded-2xl p-10 text-center space-y-2 shadow-2xs">
        <p className="text-sm font-bold text-[#2D2926]">
          ไม่พบคลิปหลักที่ตรงกับเงื่อนไขการค้นหา
        </p>
        <p className="text-xs text-[#787066]">
          ลองปรับตัวกรองหมวดคลังคลิป ซีรีส์ 5 อันดับ แท็กฟุตเทจ หรือล้างคำค้นหา
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {paginatedEpisodes.map((ep, idx) => {
          const mix = getEpisodeFootageMix(ep);
          const seriesInfo = extractEpisodeSeriesInfo(ep, tagMap);
          const completeness = evaluateEpisodeCompleteness(ep);

          return (
            <motion.div
              key={`${ep.id}-${currentPage}`}
              initial={prefersReducedMotion ? false : { opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={
                prefersReducedMotion
                  ? { duration: 0 }
                  : {
                      duration: 0.22,
                      delay: Math.min(idx * 0.02, 0.16),
                      ease: SLIDE_EASE,
                    }
              }
              className="min-w-0"
            >
              <div
                onClick={() => onSelectEpisode(ep.id)}
                className={`group bg-[#FDFBF7] border rounded-2xl p-4 hover:bg-white hover:shadow-2xs transition-colors cursor-pointer flex flex-col justify-between gap-3 h-full ${
                  !completeness.isComplete
                    ? 'border-[#E6D3BE] hover:border-[#D9B18A]'
                    : 'border-[#E8DFD3] hover:border-[#CFB58C]'
                }`}
              >
                <div className="space-y-2 min-w-0">
                  {/* Top Row: Clean unboxed metadata + single status badge */}
                  <div className="flex items-center justify-between gap-2 text-xs min-w-0">
                    <div className="flex items-center gap-1.5 min-w-0 truncate text-[11px] text-[#787066]">
                      <span className="font-mono font-bold text-[#6B4616] tabular-nums shrink-0">
                        {ep.id}
                      </span>
                      <span className="text-[#CFC4B6] shrink-0">·</span>
                      <span className="font-semibold text-[#244B2F] truncate">
                        5 อันดับ {seriesInfo.seriesName} EP.{seriesInfo.parsedEpisodeNo}
                      </span>
                      <span className="text-[#CFC4B6] shrink-0">·</span>
                      <span className="inline-flex items-center gap-1 font-mono tabular-nums shrink-0">
                        {ep.publishSlot === 'MORNING_0600' ? (
                          <Sun className="w-3 h-3 text-[#B57B2E]" />
                        ) : (
                          <Moon className="w-3 h-3 text-[#4F758B]" />
                        )}
                        <span>{formatThaiDate(ep.publishDate)}</span>
                      </span>
                    </div>

                    {/* Single Visual Completeness Status */}
                    <EpisodeCompletenessBadge episode={ep} compact />
                  </div>

                  {/* Episode Title */}
                  <h2 className="text-sm sm:text-base font-bold text-[#2D2926] leading-snug line-clamp-2 group-hover:text-[#6B4616] transition-colors">
                    {ep.title}
                  </h2>

                  {/* 5-Rank Mini Footage Strip */}
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
                              ? `อันดับ #${slot.rank}: ${ft.id} — ${ft.title} (คลิกดูวิดีโอ)`
                              : `อันดับ #${slot.rank}: ${slot.footageId || 'ว่าง'}`
                          }
                          className={`group/thumb inline-flex items-center gap-1.5 p-1 rounded-lg border transition-colors ${
                            ft
                              ? 'bg-[#FAF6F0] hover:bg-[#F2ECE0] border-[#E6DDD0] hover:border-[#DEC5A0] cursor-pointer shadow-2xs'
                              : 'bg-[#F7F3EC] border-[#E8DFD3] text-[#A69B8D] cursor-default'
                          }`}
                        >
                          <div className="relative w-9 h-6 rounded overflow-hidden bg-slate-900/10 shrink-0 border border-black/5 flex items-center justify-center">
                            {ft ? (
                              <>
                                <VideoThumbnailPreview footage={ft} size="xs" />
                                <div className="absolute inset-0 bg-black/15 group-hover/thumb:bg-black/0 transition-colors flex items-center justify-center pointer-events-none">
                                  <Play className="w-2.5 h-2.5 text-white drop-shadow-xs opacity-75 group-hover/thumb:opacity-100" />
                                </div>
                              </>
                            ) : (
                              <Film className="w-3 h-3 text-[#A69B8D]" />
                            )}
                            <span className="absolute top-0.5 left-0.5 px-1 py-0.2 rounded bg-black/70 text-white font-mono font-black text-[8px] leading-none pointer-events-none tabular-nums">
                              #{slot.rank}
                            </span>
                          </div>

                          <div className="flex flex-col text-left min-w-0">
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

                {/* Bottom Row: Category Tags + Clean Typographic Footage Mix */}
                <div className="pt-2.5 border-t border-[#EDE5D8] flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                    <TagPill tag={tagMap[ep.mainCategoryTagId]} />
                    {ep.targetSubcategoryId && tagMap[ep.targetSubcategoryId] && (
                      <TagPill tag={tagMap[ep.targetSubcategoryId]} />
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0 text-[11px] font-mono tabular-nums">
                    <span className="inline-flex items-center gap-1 text-[#23546E] font-bold">
                      <Sparkles className="w-3 h-3 text-[#2E6B8A]" />
                      <span>ใหม่ {mix.newCount}</span>
                    </span>
                    <span className="text-[#CFC4B6]">·</span>
                    <span className="inline-flex items-center gap-1 text-[#244B2F] font-bold">
                      <CheckCircle2 className="w-3 h-3 text-[#386B46]" />
                      <span>วนใช้ {mix.recycledCount}</span>
                    </span>
                    <ChevronRight className="w-4 h-4 text-[#8C7A65] group-hover:text-[#5C3A0E] transition-colors" />
                  </div>
                </div>
              </div>
            </motion.div>
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

