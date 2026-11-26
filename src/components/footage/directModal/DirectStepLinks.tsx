import React, { useRef, useState } from 'react';
import {
  Link2,
  FolderOpen,
  ExternalLink,
  Clipboard,
  Check,
} from 'lucide-react';
import {
  detectPlatformFromUrl,
  parseSharedInput,
  sanitizeSharedUrl,
} from '../../../utils/platformDetector';
import { PlatformIcon } from './PlatformIcons';
import { DuplicateMatch } from '../../../utils/duplicateDetector';
import { DuplicateWarningBanner } from '../DuplicateWarningBanner';
import { IOSShortcutGuideDrawer } from '../../pwa/IOSShortcutGuideDrawer';

interface DirectStepLinksProps {
  originalUrl: string;
  setOriginalUrl: (url: string) => void;
  driveFileUrl: string;
  setDriveFileUrl: (url: string) => void;
  duplicateMatch?: DuplicateMatch | null;
  onViewFootage?: (footageId: string) => void;
  onSuggestedTitle?: (suggestedTitle: string) => void;
}

export const DirectStepLinks: React.FC<DirectStepLinksProps> = ({
  originalUrl,
  setOriginalUrl,
  driveFileUrl,
  setDriveFileUrl,
  duplicateMatch,
  onViewFootage,
  onSuggestedTitle,
}) => {
  const originalInputRef = useRef<HTMLInputElement>(null);
  const driveInputRef = useRef<HTMLInputElement>(null);
  const [pasteFeedback, setPasteFeedback] = useState<{
    target: 'original' | 'drive';
    status: 'pasted' | 'blocked';
  } | null>(null);

  const originalPlatform = detectPlatformFromUrl(originalUrl);

  const showPasteStatus = (target: 'original' | 'drive', status: 'pasted' | 'blocked') => {
    setPasteFeedback({ target, status });
    window.setTimeout(() => {
      setPasteFeedback((prev) => (prev?.target === target && prev.status === status ? null : prev));
    }, 2200);
  };

  const applySmartInput = (rawText: string, target: 'original' | 'drive') => {
    const trimmed = rawText.trim();
    if (!trimmed) {
      if (target === 'original') setOriginalUrl('');
      else setDriveFileUrl('');
      return;
    }

    // Handle multi-line / captioned shares from TikTok, IG Reels, Facebook, YouTube, or bare social URLs
    if (/\s/.test(trimmed) || trimmed.includes('l.facebook.com/l.php')) {
      const parsed = parseSharedInput('', trimmed, '');
      if (parsed.url) {
        const resolvedPlatform = detectPlatformFromUrl(parsed.url);
        if (target === 'original' && resolvedPlatform?.type === 'GOOGLE_DRIVE' && !driveFileUrl.trim()) {
          setDriveFileUrl(parsed.url);
        } else if (target === 'original') {
          setOriginalUrl(parsed.url);
        } else {
          setDriveFileUrl(parsed.url);
        }
        if (parsed.suggestedTitle) {
          onSuggestedTitle?.(parsed.suggestedTitle);
        }
        return;
      }
    }

    const normalized = /^https?:\/\//i.test(trimmed)
      ? sanitizeSharedUrl(trimmed)
      : trimmed;

    if (target === 'original') setOriginalUrl(normalized);
    else setDriveFileUrl(normalized);
  };

  const handlePasteOriginal = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && text.trim()) {
        applySmartInput(text, 'original');
        showPasteStatus('original', 'pasted');
        return;
      }
    } catch {
      // Clipboard API blocked on mobile/iOS without direct user paste gesture
    }
    originalInputRef.current?.focus();
    showPasteStatus('original', 'blocked');
  };

  const handlePasteDrive = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && text.trim()) {
        applySmartInput(text, 'drive');
        showPasteStatus('drive', 'pasted');
        return;
      }
    } catch {
      // Clipboard API blocked on mobile/iOS without direct user paste gesture
    }
    driveInputRef.current?.focus();
    showPasteStatus('drive', 'blocked');
  };

  return (
    <div className="space-y-2.5">
      {/* Source Link Section */}
      <div
        className={`p-2.5 sm:p-3 rounded-xl border transition-colors ${
          originalUrl
            ? 'bg-amber-50/40 border-amber-300/80 ring-2 ring-amber-500/10'
            : 'bg-white border-stone-200 hover:border-stone-300'
        }`}
      >
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <label className="text-xs font-bold text-stone-800 flex items-center gap-1.5 whitespace-nowrap">
            <Link2 className="w-3.5 h-3.5 text-amber-700 shrink-0" />
            <span>ลิงก์ต้นฉบับ</span>
          </label>

          <div className="flex items-center gap-1.5 shrink-0">
            {originalPlatform ? (
              <span
                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold ${originalPlatform.badgeBg} ${originalPlatform.badgeText} border ${originalPlatform.badgeBorder}`}
              >
                <PlatformIcon platform={originalPlatform.type} className="w-3 h-3" />
                <span>{originalPlatform.name}</span>
              </span>
            ) : (
              <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-stone-100/80 border border-stone-200/70 text-stone-500">
                <span title="YouTube" className="text-rose-600">
                  <PlatformIcon platform="YOUTUBE" className="w-3 h-3" />
                </span>
                <span title="Facebook" className="text-blue-600">
                  <PlatformIcon platform="FACEBOOK" className="w-3 h-3" />
                </span>
                <span title="TikTok" className="text-stone-900">
                  <PlatformIcon platform="TIKTOK" className="w-3 h-3" />
                </span>
                <span title="Instagram" className="text-fuchsia-600">
                  <PlatformIcon platform="INSTAGRAM" className="w-3 h-3" />
                </span>
                <span title="X / Twitter" className="text-stone-800">
                  <PlatformIcon platform="TWITTER" className="w-3 h-3" />
                </span>
              </div>
            )}

            {originalUrl && (
              <a
                href={originalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 flex items-center gap-0.5"
              >
                <ExternalLink className="w-3 h-3" />
                <span>เปิดดู</span>
              </a>
            )}
          </div>
        </div>

        <div className="relative flex items-center">
          <input
            ref={originalInputRef}
            type="url"
            value={originalUrl}
            onChange={(e) => applySmartInput(e.target.value, 'original')}
            placeholder="วางลิงก์ TikTok / IG / YouTube / FB..."
            className="w-full pl-3 pr-16 py-2 text-xs sm:text-sm font-mono bg-[#FAF8F5] focus:bg-white border border-stone-200 rounded-lg focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/15 transition-colors text-stone-900 placeholder:text-stone-400"
          />
          <button
            type="button"
            onClick={handlePasteOriginal}
            aria-label="วางลิงก์ต้นฉบับจากคลิปบอร์ด"
            className="absolute right-1.5 min-h-[28px] px-2 py-0.5 text-[11px] font-semibold text-stone-700 hover:text-emerald-800 bg-white hover:bg-stone-50 border border-stone-200 rounded-md flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
          >
            {pasteFeedback?.target === 'original' && pasteFeedback.status === 'pasted' ? (
              <>
                <Check className="w-3 h-3 text-emerald-600" />
                <span className="text-emerald-700">วางแล้ว</span>
              </>
            ) : (
              <>
                <Clipboard className="w-3 h-3" />
                <span>วาง</span>
              </>
            )}
          </button>
        </div>

        {pasteFeedback?.target === 'original' && pasteFeedback.status === 'blocked' && (
          <p className="mt-1 text-[11px] text-amber-700 font-medium">
            กดค้างที่ช่องด้านบน แล้วเลือก &quot;วาง&quot; (Paste) ได้เลยครับ
          </p>
        )}
      </div>

      {/* Google Drive Link Section */}
      <div
        className={`p-2.5 sm:p-3 rounded-xl border transition-colors ${
          driveFileUrl
            ? 'bg-emerald-50/50 border-emerald-300/80 ring-2 ring-emerald-500/10'
            : 'bg-white border-stone-200 hover:border-stone-300'
        }`}
      >
        <div className="flex items-center justify-between gap-2 mb-1.5 min-w-0">
          <label className="text-xs font-bold text-stone-800 flex items-center gap-1.5 min-w-0">
            <FolderOpen className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="shrink-0">ลิงก์ Google Drive</span>
            <span className="text-[11px] font-normal text-stone-400 truncate">(รอฝากทีหลังได้)</span>
          </label>

          {driveFileUrl && (
            <a
              href={driveFileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 flex items-center gap-0.5 shrink-0"
            >
              <ExternalLink className="w-3 h-3" />
              <span>เปิด Drive</span>
            </a>
          )}
        </div>

        <div className="relative flex items-center">
          <input
            ref={driveInputRef}
            type="url"
            value={driveFileUrl}
            onChange={(e) => applySmartInput(e.target.value, 'drive')}
            placeholder="วางลิงก์ https://drive.google.com/file/d/..."
            className="w-full pl-3 pr-16 py-2 text-xs sm:text-sm font-mono bg-[#FAF8F5] focus:bg-white border border-stone-200 rounded-lg focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/15 transition-colors text-stone-900 placeholder:text-stone-400"
          />
          <button
            type="button"
            onClick={handlePasteDrive}
            aria-label="วางลิงก์ Google Drive จากคลิปบอร์ด"
            className="absolute right-1.5 min-h-[28px] px-2 py-0.5 text-[11px] font-semibold text-stone-700 hover:text-emerald-800 bg-white hover:bg-stone-50 border border-stone-200 rounded-md flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
          >
            {pasteFeedback?.target === 'drive' && pasteFeedback.status === 'pasted' ? (
              <>
                <Check className="w-3 h-3 text-emerald-600" />
                <span className="text-emerald-700">วางแล้ว</span>
              </>
            ) : (
              <>
                <Clipboard className="w-3 h-3" />
                <span>วาง</span>
              </>
            )}
          </button>
        </div>

        {pasteFeedback?.target === 'drive' && pasteFeedback.status === 'blocked' && (
          <p className="mt-1 text-[11px] text-amber-700 font-medium">
            กดค้างที่ช่องด้านบน แล้วเลือก &quot;วาง&quot; (Paste) ได้เลยครับ
          </p>
        )}
      </div>

      {/* Duplicate Footage Warning Banner */}
      <DuplicateWarningBanner match={duplicateMatch || null} onViewFootage={onViewFootage} />

      {/* Collapsible iOS Shortcuts Share Sheet Setup Guide */}
      <IOSShortcutGuideDrawer compact />
    </div>
  );
};
