import React from 'react';
import { Scissors, Check, ExternalLink, Video } from 'lucide-react';
import { SourcePlatform } from '../../../types/source.types';
import { detectPlatformFromUrl } from '../../../utils/platformDetector';
import { PlatformIcon } from '../../footage/directModal/PlatformIcons';

interface SourceSplitterTopBarProps {
  sourceId: string;
  sourceTitle: string;
  originalUrl: string;
  platform: SourcePlatform;
  clipCount: number;
  currentStep: number;
  onSelectStep: (step: number) => void;
  isExistingSource: boolean;
  canProceedToStep2: boolean;
}

export const SourceSplitterTopBar: React.FC<SourceSplitterTopBarProps> = ({
  sourceId,
  sourceTitle,
  originalUrl,
  platform,
  clipCount,
  currentStep,
  onSelectStep,
  isExistingSource,
  canProceedToStep2,
}) => {
  const detected = detectPlatformFromUrl(originalUrl);

  const getPlatformLabel = (p: SourcePlatform) => {
    switch (p) {
      case 'FACEBOOK':
        return 'Facebook';
      case 'YOUTUBE':
        return 'YouTube';
      case 'TIKTOK':
        return 'TikTok';
      case 'TWITCH':
        return 'Twitch';
      case 'INSTAGRAM':
        return 'Instagram';
      default:
        return 'ทั่วไป';
    }
  };

  const steps = [
    { num: 1, label: 'ข้อมูลต้นฉบับ', ready: true },
    { num: 2, label: `รายการช็อต (${clipCount})`, ready: canProceedToStep2 || isExistingSource },
  ];

  return (
    <div className="bg-[#FAF7F2] text-stone-800 rounded-2xl p-3 sm:p-3.5 border border-amber-200/70 shadow-2xs">
      {/* Upper row: Dynamic Badges & Source Title */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3 border-b border-amber-200/50">
        <div className="flex flex-wrap items-center gap-2">
          {/* Source ID Badge (Pastel Warm Honey) */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-100/90 text-amber-900 border border-amber-300/80 font-mono font-bold text-xs sm:text-sm select-none shadow-2xs">
            <Video className="w-3.5 h-3.5 text-amber-700" />
            <span>{sourceId}</span>
          </div>

          {/* Platform Badge (Pastel) */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold bg-stone-100 text-stone-700 border border-stone-200">
            {detected ? (
              <PlatformIcon platform={detected.type} className="w-3.5 h-3.5" />
            ) : (
              <PlatformIcon
                platform={
                  platform === 'FACEBOOK'
                    ? 'FACEBOOK'
                    : platform === 'YOUTUBE'
                    ? 'YOUTUBE'
                    : platform === 'TIKTOK'
                    ? 'TIKTOK'
                    : platform === 'INSTAGRAM'
                    ? 'INSTAGRAM'
                    : 'GENERIC_WEB'
                }
                className="w-3.5 h-3.5"
              />
            )}
            <span>{detected ? detected.name : getPlatformLabel(platform)}</span>
            {originalUrl && (
              <a
                href={originalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-stone-400 hover:text-stone-700"
                title="เปิดลิงก์ต้นฉบับ"
              >
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>

          {/* Clips Count Badge (Pastel Sage) */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <Scissors className="w-3.5 h-3.5 text-emerald-600" />
            <span>{clipCount} ช็อต</span>
          </div>
        </div>

        {/* Source Title preview */}
        {sourceTitle && (
          <div className="hidden md:flex items-center gap-1 text-xs text-stone-600 font-medium truncate max-w-xs">
            <span className="truncate" title={sourceTitle}>
              {sourceTitle}
            </span>
          </div>
        )}
      </div>

      {/* Lower row: Step Navigation Indicators */}
      <div className="grid grid-cols-2 gap-2 pt-2.5">
        {steps.map((s) => {
          const isActive = currentStep === s.num;
          const isPassed = currentStep > s.num;
          const canClick = s.ready || isPassed;

          return (
            <button
              key={s.num}
              type="button"
              disabled={!canClick}
              onClick={() => canClick && onSelectStep(s.num)}
              className={`relative flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                isActive
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : isPassed
                  ? 'bg-emerald-100/70 text-emerald-900 border border-emerald-200 hover:bg-emerald-100 cursor-pointer'
                  : canClick
                  ? 'bg-white/80 text-stone-700 border border-stone-200/80 hover:bg-white cursor-pointer'
                  : 'bg-stone-100/50 text-stone-400 border border-stone-200/40 cursor-not-allowed'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-mono font-bold shrink-0 ${
                  isActive
                    ? 'bg-white text-emerald-800'
                    : isPassed
                    ? 'bg-emerald-600 text-white'
                    : 'bg-stone-200 text-stone-600'
                }`}
              >
                {isPassed ? <Check className="w-3 h-3 stroke-[3]" /> : s.num}
              </span>
              <span className="truncate">{s.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
