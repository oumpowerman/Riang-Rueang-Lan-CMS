import React from 'react';
import {
  Link2,
  FolderOpen,
  ExternalLink,
  Clipboard,
  Check,
  ArrowRight,
  BookmarkPlus,
} from 'lucide-react';
import { detectPlatformFromUrl, parseSharedInput } from '../../../utils/platformDetector';
import { PlatformIcon } from './PlatformIcons';
import { DuplicateMatch } from '../../../utils/duplicateDetector';
import { DuplicateWarningBanner } from '../DuplicateWarningBanner';

interface DirectStepLinksProps {
  originalUrl: string;
  setOriginalUrl: (url: string) => void;
  driveFileUrl: string;
  setDriveFileUrl: (url: string) => void;
  previewNextId: string;
  duplicateMatch?: DuplicateMatch | null;
  onViewFootage?: (footageId: string) => void;
  onSuggestedTitle?: (suggestedTitle: string) => void;
  onQuickSave: () => void;
  onNext: () => void;
}

export const DirectStepLinks: React.FC<DirectStepLinksProps> = ({
  originalUrl,
  setOriginalUrl,
  driveFileUrl,
  setDriveFileUrl,
  previewNextId,
  duplicateMatch,
  onViewFootage,
  onSuggestedTitle,
  onQuickSave,
  onNext,
}) => {
  const originalPlatform = detectPlatformFromUrl(originalUrl);
  const hasAnyValidLink = Boolean(originalUrl.trim() || driveFileUrl.trim());

  const applySmartInput = (rawText: string, target: 'original' | 'drive') => {
    const trimmed = rawText.trim();
    if (!trimmed) {
      if (target === 'original') setOriginalUrl('');
      else setDriveFileUrl('');
      return;
    }

    if (trimmed.includes('http') && trimmed.includes(' ')) {
      const parsed = parseSharedInput('', trimmed, '');
      if (parsed.url) {
        if (target === 'original') setOriginalUrl(parsed.url);
        else setDriveFileUrl(parsed.url);
        if (parsed.suggestedTitle) {
          onSuggestedTitle?.(parsed.suggestedTitle);
        }
        return;
      }
    }

    if (target === 'original') setOriginalUrl(trimmed);
    else setDriveFileUrl(trimmed);
  };

  const handlePasteOriginal = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        applySmartInput(text, 'original');
      }
    } catch {
      // Fallback if clipboard read permission denied
    }
  };

  const handlePasteDrive = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        applySmartInput(text, 'drive');
      }
    } catch {
      // Fallback if clipboard read permission denied
    }
  };

  return (
    <div className="space-y-3">
      {/* Source Link Section */}
      <div
        className={`p-3 rounded-2xl border transition-all ${
          originalUrl
            ? 'bg-amber-50/40 border-amber-300/80 ring-2 ring-amber-500/10'
            : 'bg-white border-stone-200 hover:border-stone-300'
        }`}
      >
        <div className="flex items-center justify-between gap-2 mb-2">
          <label className="text-xs sm:text-sm font-bold text-stone-800 flex items-center gap-1.5 whitespace-nowrap">
            <Link2 className="w-4 h-4 text-amber-700 shrink-0" />
            <span>ลิงก์ต้นฉบับ</span>
          </label>

          <div className="flex items-center gap-1.5 shrink-0">
            {originalPlatform ? (
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold ${originalPlatform.badgeBg} ${originalPlatform.badgeText} border ${originalPlatform.badgeBorder}`}
              >
                <PlatformIcon platform={originalPlatform.type} className="w-3 h-3" />
                <span>{originalPlatform.name}</span>
              </span>
            ) : (
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-stone-100/80 border border-stone-200/70 text-stone-500">
                <span title="YouTube" className="text-rose-600">
                  <PlatformIcon platform="YOUTUBE" className="w-3.5 h-3.5" />
                </span>
                <span title="Facebook" className="text-blue-600">
                  <PlatformIcon platform="FACEBOOK" className="w-3.5 h-3.5" />
                </span>
                <span title="TikTok" className="text-stone-900">
                  <PlatformIcon platform="TIKTOK" className="w-3.5 h-3.5" />
                </span>
                <span title="Instagram" className="text-fuchsia-600">
                  <PlatformIcon platform="INSTAGRAM" className="w-3.5 h-3.5" />
                </span>
                <span title="X / Twitter" className="text-stone-800">
                  <PlatformIcon platform="TWITTER" className="w-3.5 h-3.5" />
                </span>
              </div>
            )}

            {originalUrl && (
              <a
                href={originalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 flex items-center gap-1"
              >
                <ExternalLink className="w-3 h-3" />
                <span>เปิดดู</span>
              </a>
            )}
          </div>
        </div>

        <div className="relative flex items-center">
          <input
            type="url"
            value={originalUrl}
            onChange={(e) => applySmartInput(e.target.value, 'original')}
            placeholder="วางลิงก์ TikTok / IG / YouTube / FB..."
            className="w-full pl-3 pr-16 py-2 text-xs sm:text-sm font-mono bg-[#FAF8F5] focus:bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/15 transition-all text-stone-900 placeholder:text-stone-400"
          />
          <button
            type="button"
            onClick={handlePasteOriginal}
            className="absolute right-1.5 px-2.5 py-1 text-xs font-semibold text-stone-700 hover:text-emerald-800 bg-white hover:bg-stone-50 border border-stone-200 rounded-lg flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
          >
            <Clipboard className="w-3 h-3" />
            <span>วาง</span>
          </button>
        </div>
      </div>

      {/* Google Drive Link Section */}
      <div
        className={`p-3 rounded-2xl border transition-all ${
          driveFileUrl
            ? 'bg-emerald-50/50 border-emerald-300/80 ring-2 ring-emerald-500/10'
            : 'bg-white border-stone-200 hover:border-stone-300'
        }`}
      >
        <div className="flex items-center justify-between gap-2 mb-2">
          <label className="text-xs sm:text-sm font-bold text-stone-800 flex items-center gap-1.5 whitespace-nowrap">
            <FolderOpen className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>ลิงก์ Google Drive</span>
            <span className="text-[11px] font-normal text-stone-400">(เว้นว่างรอฝากทีหลังได้)</span>
          </label>

          {driveFileUrl && (
            <a
              href={driveFileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 shrink-0"
            >
              <ExternalLink className="w-3 h-3" />
              <span>เปิด Drive</span>
            </a>
          )}
        </div>

        <div className="relative flex items-center">
          <input
            type="url"
            value={driveFileUrl}
            onChange={(e) => applySmartInput(e.target.value, 'drive')}
            placeholder="วางลิงก์ https://drive.google.com/file/d/..."
            className="w-full pl-3 pr-16 py-2 text-xs sm:text-sm font-mono bg-[#FAF8F5] focus:bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/15 transition-all text-stone-900 placeholder:text-stone-400"
          />
          <button
            type="button"
            onClick={handlePasteDrive}
            className="absolute right-1.5 px-2.5 py-1 text-xs font-semibold text-stone-700 hover:text-emerald-800 bg-white hover:bg-stone-50 border border-stone-200 rounded-lg flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
          >
            <Clipboard className="w-3 h-3" />
            <span>วาง</span>
          </button>
        </div>
      </div>

      {/* Duplicate Footage Warning Banner */}
      <DuplicateWarningBanner match={duplicateMatch || null} onViewFootage={onViewFootage} />

      {/* Bottom Action Bar: Quick Save + Next side-by-side */}
      <div className="pt-2.5 flex items-center justify-end gap-2 border-t border-stone-200/80">
        <button
          type="button"
          disabled={!hasAnyValidLink}
          onClick={onQuickSave}
          className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 text-xs sm:text-sm font-bold rounded-xl border transition-all cursor-pointer ${
            hasAnyValidLink
              ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300 shadow-2xs'
              : 'bg-stone-100 text-stone-400 border-stone-200 cursor-not-allowed'
          }`}
          title="บันทึกเข้าคลังทันที (ตั้งชื่อตามแพลตฟอร์มและเก็บเข้าพื้นที่พักรออัตโนมัติ)"
        >
          <BookmarkPlus className="w-4 h-4 shrink-0" />
          <span>บันทึกด่วน ({previewNextId})</span>
        </button>

        <button
          type="button"
          disabled={!hasAnyValidLink}
          onClick={onNext}
          className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer ${
            hasAnyValidLink
              ? 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs'
              : 'bg-stone-100 text-stone-400 cursor-not-allowed'
          }`}
        >
          <span>ถัดไป</span>
          <ArrowRight className="w-4 h-4 shrink-0" />
        </button>
      </div>
    </div>
  );
};
