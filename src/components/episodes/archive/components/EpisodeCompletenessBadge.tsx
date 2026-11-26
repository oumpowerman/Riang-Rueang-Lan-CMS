import React from 'react';
import { CheckCircle2, ExternalLink, Film, AlertCircle } from 'lucide-react';
import {
  evaluateEpisodeCompleteness,
  validateEpisodeStandard,
} from '../../../../utils/episodeValidator';
import type { Episode } from '../../../../types/episode.types';

interface EpisodeCompletenessBadgeProps {
  episode: Episode;
  compact?: boolean;
}

const GoogleDriveIcon: React.FC<{ muted?: boolean; className?: string }> = ({
  muted = false,
  className = 'w-3.5 h-3.5 shrink-0',
}) => (
  <svg
    viewBox="0 0 87.3 78"
    aria-hidden="true"
    className={`${className} ${muted ? 'opacity-50 grayscale-[45%]' : ''}`}
  >
    <path
      d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z"
      fill="#0066da"
    />
    <path
      d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z"
      fill="#00ac47"
    />
    <path
      d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z"
      fill="#ea4335"
    />
    <path
      d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z"
      fill="#00832d"
    />
    <path
      d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z"
      fill="#2684fc"
    />
    <path
      d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z"
      fill="#ffba00"
    />
  </svg>
);

export const EpisodeCompletenessBadge: React.FC<
  EpisodeCompletenessBadgeProps
> = ({ episode, compact = false }) => {
  const completeness = evaluateEpisodeCompleteness(episode);
  const validation = validateEpisodeStandard(episode);
  const driveUrl = episode.masterVideoInfo?.masterDriveUrl?.trim();

  if (completeness.isComplete) {
    return (
      <div className="inline-flex items-center gap-1.5 shrink-0">
        <span
          title={completeness.detailText}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border bg-[#E6F2E6] text-[#224A2D] border-[#A7C9A5] text-[11px] font-bold whitespace-nowrap"
        >
          <CheckCircle2 className="w-3 h-3 text-[#2E7D32] shrink-0" />
          <span>พร้อม</span>
        </span>
        {driveUrl && (
          <a
            href={driveUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            title="เปิดไฟล์ใน Google Drive"
            aria-label="เปิดไฟล์ใน Google Drive"
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-lg border border-[#DCE6DE] bg-white hover:bg-[#F3F8F4] hover:border-[#A7C9A5] transition-colors"
          >
            <GoogleDriveIcon className="w-3 h-3 shrink-0" />
            {!compact && (
              <ExternalLink className="w-2.5 h-2.5 text-[#386B46] shrink-0" />
            )}
          </a>
        )}
      </div>
    );
  }

  return (
    <div
      title={completeness.detailText}
      className="inline-flex flex-wrap items-center gap-1 shrink-0"
    >
      {!completeness.hasRealMasterDrive && (
        <span
          title={
            completeness.isPlaceholderDrive
              ? 'ลิงก์ Google Drive จำลอง (รอวางลิงก์จริง)'
              : 'ยังไม่มีลิงก์ Google Drive'
          }
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border border-[#E6D4C0] bg-[#FAF3EB] text-[#8C5B32] text-[11px] font-semibold whitespace-nowrap"
        >
          <GoogleDriveIcon muted className="w-3 h-3 shrink-0" />
          <span className="line-through decoration-[#A6532B]/80 decoration-[1.5px]">
            Google Drive
          </span>
        </span>
      )}

      {validation.hasIncompleteSlots && (
        <span
          title={`ฟุตเทจยังไม่ครบ 5 อันดับ (${validation.filledSlotCount}/5)`}
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border border-[#E5CFA6] bg-[#FAF0E1] text-[#7A3F17] text-[11px] font-bold tabular-nums whitespace-nowrap"
        >
          <Film className="w-3 h-3 text-[#B56722] shrink-0" />
          <span>ฟุต {validation.filledSlotCount}/5</span>
        </span>
      )}

      {(validation.hasMissingTitle || validation.hasNon5Rank) && (
        <span
          title={
            validation.hasMissingTitle
              ? 'ยังไม่ตั้งชื่อคลิป'
              : 'ชื่อคลิปยังไม่ขึ้นต้นด้วย "5 อันดับ"'
          }
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border border-[#E5CFA6] bg-[#FAF0E1] text-[#7A3F17] text-[11px] font-bold whitespace-nowrap"
        >
          <AlertCircle className="w-3 h-3 text-[#B56722] shrink-0" />
          <span>
            {validation.hasMissingTitle ? 'ไม่มีชื่อ' : 'ไม่ 5 อันดับ'}
          </span>
        </span>
      )}
    </div>
  );
};
