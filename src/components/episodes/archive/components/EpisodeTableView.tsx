import React from 'react';
import { Sparkles, CheckCircle2, ChevronRight, Sun, Moon } from 'lucide-react';
import { useCMS } from '../../../../context/CMSContext';
import { formatThaiDate } from '../../../../utils/fileNameGenerator';
import { TagPill } from '../../../ui/TagPill';
import { PaginationBar } from '../../../ui/PaginationBar';
import type { Episode, EpisodeWorkflowStage } from '../../../../types/episode.types';
import type { EpisodeFootageMix } from '../hooks/useMasterArchiveMetrics';

interface EpisodeTableViewProps {
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

export const EpisodeTableView: React.FC<EpisodeTableViewProps> = ({
  paginatedEpisodes,
  totalFilteredCount,
  currentPage,
  pageSize,
  onPageChange,
  onPageSizeChange,
  getEpisodeFootageMix,
  onSelectEpisode,
}) => {
  const { tagMap, computedFootageMap } = useCMS();

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
                <th className="py-2.5 px-3.5 w-36">รหัส & ซีรีส์ EP</th>
                <th className="py-2.5 px-3.5">ชื่อคลิปหลัก & 5 อันดับฟุตเทจ</th>
                <th className="py-2.5 px-3.5 w-44">หมวดหมู่</th>
                <th className="py-2.5 px-3.5 w-36">สถานะงาน</th>
                <th className="py-2.5 px-3.5 w-40">สัดส่วนฟุตเทจ</th>
                <th className="py-2.5 px-3.5 w-32">วันที่สร้าง</th>
                <th className="py-2.5 px-3.5 w-24 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EDE5D8] text-xs">
              {paginatedEpisodes.map((ep) => {
                const mix = getEpisodeFootageMix(ep);
                const wfBadge =
                  WORKFLOW_BADGE_MAP[ep.workflowStage] || WORKFLOW_BADGE_MAP['1_MIXING'];

                return (
                  <tr
                    key={ep.id}
                    onClick={() => onSelectEpisode(ep.id)}
                    className="hover:bg-[#FAF3E6]/70 cursor-pointer transition-colors group"
                  >
                    <td className="py-2.5 px-3.5 font-mono whitespace-nowrap">
                      <div className="font-bold text-[#6B4616] tabular-nums">
                        {ep.id}
                      </div>
                      <div className="text-[11px] font-sans font-semibold text-[#244B2F] bg-[#EBF3EB] px-1.5 py-0.5 rounded-md border border-[#BBD6B9] inline-flex items-center gap-1 mt-0.5">
                        <Sparkles className="w-2.5 h-2.5 text-[#386B46]" />
                        <span>
                          {tagMap[ep.mainCategoryTagId]?.name || 'หมวด'} · EP.
                          {ep.categoryEpisodeNo || 1}
                        </span>
                      </div>
                    </td>

                    <td className="py-2.5 px-3.5 min-w-[260px]">
                      <div className="font-bold text-[#2D2926] text-xs sm:text-sm line-clamp-1 group-hover:text-[#6B4616]">
                        {ep.title}
                      </div>
                      <div className="flex items-center gap-1 flex-wrap mt-1">
                        {ep.rankings.map((slot) => {
                          const ft = slot.footageId
                            ? computedFootageMap[slot.footageId]
                            : null;
                          return (
                            <span
                              key={slot.rank}
                              title={
                                ft
                                  ? `อันดับ #${slot.rank}: ${ft.id} — ${ft.title}`
                                  : `อันดับ #${slot.rank}: ${slot.footageId || 'ว่าง'}`
                              }
                              className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-[#F5EFE6] border border-[#E4DDD3] text-[10px] font-mono tabular-nums text-[#5C544C]"
                            >
                              <strong className="text-[#8A5A22]">#{slot.rank}</strong>
                              <span>{slot.footageId || '—'}</span>
                            </span>
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
