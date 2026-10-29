import React, { useState } from 'react';
import { Film, Play, Youtube } from 'lucide-react';
import { Footage } from '../../types/footage.types';
import {
  formatClipDurationBadge,
  getFootageVideoPreviewInfo,
} from '../../utils/videoPreviewUtils';
import { GoogleDriveIcon } from '../ui/GoogleDriveIcon';

interface VideoThumbnailPreviewProps {
  footage: Pick<
    Footage,
    'id' | 'title' | 'driveFileUrl' | 'originalUrl' | 'thumbnailUrl' | 'timestampRange' | 'durationSec'
  >;
  onClick?: (e: React.MouseEvent) => void;
  size?: 'sm' | 'md';
}

export const VideoThumbnailPreview: React.FC<VideoThumbnailPreviewProps> = ({
  footage,
  onClick,
  size = 'md',
}) => {
  const preview = getFootageVideoPreviewInfo(footage);
  const durationBadge = formatClipDurationBadge(footage);

  const [imgSrc, setImgSrc] = useState<string | null>(preview.thumbnailUrl);
  const [triedFallback, setTriedFallback] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Sync if footage link changes
  React.useEffect(() => {
    setImgSrc(preview.thumbnailUrl);
    setTriedFallback(false);
    setHasError(false);
  }, [preview.thumbnailUrl]);

  const handleImageError = () => {
    if (!triedFallback && preview.fallbackThumbnailUrl && imgSrc !== preview.fallbackThumbnailUrl) {
      setTriedFallback(true);
      setImgSrc(preview.fallbackThumbnailUrl);
    } else {
      setHasError(true);
    }
  };

  const sizeClasses =
    size === 'sm'
      ? 'w-16 sm:w-20 aspect-video rounded-lg'
      : 'w-24 sm:w-28 aspect-video rounded-xl';

  const canShowImage = Boolean(imgSrc && !hasError);

  return (
    <button
      type="button"
      onClick={onClick}
      title={
        preview.provider !== 'NONE'
          ? 'คลิกเพื่อเปิดดูวิดีโอตัวอย่าง (Quick Player)'
          : 'ดูรายละเอียดวิดีโอตัวอย่าง'
      }
      className={`group/thumb relative ${sizeClasses} overflow-hidden shrink-0 border border-slate-200/90 bg-gradient-to-br from-indigo-50/80 via-slate-50 to-sky-50/80 hover:border-indigo-400 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-400`}
    >
      {canShowImage ? (
        <img
          src={imgSrc!}
          alt={footage.title}
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={handleImageError}
          className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-200"
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center gap-0.5 text-slate-400">
          {preview.provider === 'DRIVE' ? (
            <GoogleDriveIcon className={size === 'sm' ? 'w-4 h-4 opacity-80' : 'w-5 h-5 opacity-85'} />
          ) : preview.provider === 'YOUTUBE' ? (
            <Youtube className={size === 'sm' ? 'w-4 h-4 text-rose-500' : 'w-5 h-5 text-rose-500'} />
          ) : (
            <Film className={size === 'sm' ? 'w-4 h-4 text-slate-400' : 'w-5 h-5 text-slate-400'} />
          )}
        </div>
      )}

      {/* Subtle hover dark overlay + centered Play icon */}
      <div className="absolute inset-0 bg-slate-900/15 group-hover/thumb:bg-slate-900/35 transition-colors flex items-center justify-center">
        <span
          className={`${
            size === 'sm' ? 'w-5 h-5' : 'w-6 h-6'
          } rounded-full bg-white/95 text-indigo-600 shadow-sm flex items-center justify-center group-hover/thumb:scale-110 group-hover/thumb:bg-indigo-600 group-hover/thumb:text-white transition-all`}
        >
          <Play className={size === 'sm' ? 'w-2.5 h-2.5 fill-current ml-0.5' : 'w-3 h-3 fill-current ml-0.5'} />
        </span>
      </div>

      {/* Top-left mini provider indicator when image is loaded */}
      {canShowImage && preview.provider !== 'NONE' && (
        <span className="absolute top-1 left-1 p-0.5 rounded bg-white/90 shadow-2xs backdrop-blur-xs">
          {preview.provider === 'DRIVE' ? (
            <GoogleDriveIcon className="w-2.5 h-2.5" />
          ) : (
            <Youtube className="w-2.5 h-2.5 text-rose-600" />
          )}
        </span>
      )}

      {/* Bottom-right duration / timestamp pill */}
      {durationBadge && size === 'md' && (
        <span className="absolute bottom-1 right-1 px-1 py-0.2 rounded bg-slate-900/75 text-white font-mono text-[9px] font-bold leading-tight tabular-nums backdrop-blur-xs">
          {durationBadge}
        </span>
      )}
    </button>
  );
};
