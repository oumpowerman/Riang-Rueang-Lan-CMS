import React from 'react';
import { motion } from 'motion/react';
import { Link2, FolderOpen, ExternalLink, Clipboard, Check, ArrowRight } from 'lucide-react';
import { detectPlatformFromUrl } from '../../../utils/platformDetector';
import { PlatformIcon } from './PlatformIcons';

interface DirectStepLinksProps {
  originalUrl: string;
  setOriginalUrl: (url: string) => void;
  driveFileUrl: string;
  setDriveFileUrl: (url: string) => void;
  onValidAutoAdvance?: () => void;
  onNext: () => void;
}

export const DirectStepLinks: React.FC<DirectStepLinksProps> = ({
  originalUrl,
  setOriginalUrl,
  driveFileUrl,
  setDriveFileUrl,
  onValidAutoAdvance,
  onNext,
}) => {
  const originalPlatform = detectPlatformFromUrl(originalUrl);
  const hasAnyValidLink = Boolean(originalUrl.trim() || driveFileUrl.trim());

  const handlePasteOriginal = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setOriginalUrl(text.trim());
        if (!driveFileUrl) {
          onValidAutoAdvance?.();
        }
      }
    } catch {
      // Fallback
    }
  };

  const handlePasteDrive = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setDriveFileUrl(text.trim());
        if (!originalUrl) {
          onValidAutoAdvance?.();
        }
      }
    } catch {
      // Fallback
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-stone-900">1. ลิงก์คลิป</h3>
          <p className="text-xs text-stone-500 mt-0.5">
            ใส่ลิงก์ต้นฉบับหรือ Google Drive อย่างน้อย 1 ช่อง
          </p>
        </div>
        {hasAnyValidLink && (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
            <Check className="w-3.5 h-3.5 text-emerald-600" />
            <span>พร้อมไปต่อ</span>
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3">
        {/* Source Link Section */}
        <div
          className={`p-3.5 rounded-2xl border transition-all ${
            originalUrl
              ? 'bg-amber-50/40 border-amber-300/80 ring-2 ring-amber-500/10'
              : 'bg-white border-stone-200 hover:border-stone-300'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <label className="text-xs sm:text-sm font-bold text-stone-800 flex items-center gap-1.5">
                <Link2 className="w-4 h-4 text-amber-700 shrink-0" />
                <span>คลิปต้นฉบับ</span>
              </label>

              {/* Platform Icon Badge Strip */}
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-stone-100/80 border border-stone-200/70 text-stone-500 text-[11px]">
                <span title="YouTube" className="p-0.5 rounded hover:bg-white text-rose-600 transition-colors">
                  <PlatformIcon platform="YOUTUBE" className="w-3.5 h-3.5" />
                </span>
                <span title="Facebook" className="p-0.5 rounded hover:bg-white text-blue-600 transition-colors">
                  <PlatformIcon platform="FACEBOOK" className="w-3.5 h-3.5" />
                </span>
                <span title="TikTok" className="p-0.5 rounded hover:bg-white text-stone-900 transition-colors">
                  <PlatformIcon platform="TIKTOK" className="w-3.5 h-3.5" />
                </span>
                <span title="Instagram" className="p-0.5 rounded hover:bg-white text-fuchsia-600 transition-colors">
                  <PlatformIcon platform="INSTAGRAM" className="w-3.5 h-3.5" />
                </span>
                <span title="X / Twitter" className="p-0.5 rounded hover:bg-white text-stone-800 transition-colors">
                  <PlatformIcon platform="TWITTER" className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {originalPlatform && (
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold ${originalPlatform.badgeBg} ${originalPlatform.badgeText} border ${originalPlatform.badgeBorder}`}
                >
                  <PlatformIcon platform={originalPlatform.type} className="w-3 h-3" />
                  <span>{originalPlatform.name}</span>
                </span>
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
              onChange={(e) => setOriginalUrl(e.target.value)}
              placeholder="วางลิงก์ เช่น https://www.tiktok.com/... หรือ fb.watch/..."
              className="w-full pl-3.5 pr-20 py-2.5 text-xs sm:text-sm font-mono bg-[#FAF8F5] focus:bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/15 transition-all text-stone-900 placeholder:text-stone-400"
            />
            <button
              type="button"
              onClick={handlePasteOriginal}
              className="absolute right-2 px-2.5 py-1 text-xs font-semibold text-stone-600 hover:text-emerald-800 bg-white hover:bg-stone-50 border border-stone-200 rounded-lg flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
            >
              <Clipboard className="w-3 h-3" />
              <span>วาง</span>
            </button>
          </div>
        </div>

        {/* Google Drive Link Section */}
        <div
          className={`p-3.5 rounded-2xl border transition-all ${
            driveFileUrl
              ? 'bg-emerald-50/50 border-emerald-300/80 ring-2 ring-emerald-500/10'
              : 'bg-white border-stone-200 hover:border-stone-300'
          }`}
        >
          <div className="flex items-center justify-between gap-2 mb-2">
            <label className="text-xs sm:text-sm font-bold text-stone-800 flex items-center gap-1.5">
              <FolderOpen className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Google Drive</span>
            </label>

            {driveFileUrl && (
              <a
                href={driveFileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 flex items-center gap-1"
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
              onChange={(e) => setDriveFileUrl(e.target.value)}
              placeholder="วางลิงก์ เช่น https://drive.google.com/file/d/..."
              className="w-full pl-3.5 pr-20 py-2.5 text-xs sm:text-sm font-mono bg-[#FAF8F5] focus:bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/15 transition-all text-stone-900 placeholder:text-stone-400"
            />
            <button
              type="button"
              onClick={handlePasteDrive}
              className="absolute right-2 px-2.5 py-1 text-xs font-semibold text-stone-600 hover:text-emerald-800 bg-white hover:bg-stone-50 border border-stone-200 rounded-lg flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
            >
              <Clipboard className="w-3 h-3" />
              <span>วาง</span>
            </button>
          </div>
        </div>
      </div>

      <div className="pt-2 flex items-center justify-between">
        <span className="text-xs text-stone-400">
          * ระบบสไลด์ต่ออัตโนมัติเมื่อวางลิงก์เรียบร้อย
        </span>

        <button
          type="button"
          disabled={!hasAnyValidLink}
          onClick={onNext}
          className={`inline-flex items-center gap-1.5 px-4 py-2 text-sm font-bold rounded-xl transition-all cursor-pointer ${
            hasAnyValidLink
              ? 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs'
              : 'bg-stone-100 text-stone-400 cursor-not-allowed'
          }`}
        >
          <span>ถัดไป</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
