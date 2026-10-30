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
  size?: 'xs' | 'sm' | 'md';
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
    size === 'xs'
      ? 'w-12 sm:w-14 aspect-video rounded-lg'
      : size === 'sm'
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
      className={`group/thumb relative ${sizeClasses} overflow-hidden shrink-0 border border-[#e2d8cb] bg-gradient-to-br from-[#faf7f2] via-[#fdfbf7] to-[#edf4ed]/90 hover:border-[#3b6845] transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#3b6845]/40 shadow-2xs`}
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
        <div className="w-full h-full flex flex-col items-center justify-center gap-0.5 text-[#8c8275]">
          {preview.provider === 'DRIVE' ? (
            <GoogleDriveIcon
              className={
                size === 'xs'
                  ? 'w-3.5 h-3.5 opacity-80'
                  : size === 'sm'
                  ? 'w-4 h-4 opacity-80'
                  : 'w-5 h-5 opacity-85'
              }
            />
          ) : preview.provider === 'YOUTUBE' ? (
            <Youtube
              className={
                size === 'xs'
                  ? 'w-3.5 h-3.5 text-[#c95b48]'
                  : size === 'sm'
                  ? 'w-4 h-4 text-[#c95b48]'
                  : 'w-5 h-5 text-[#c95b48]'
              }
            />
          ) : (
            <Film
              className={
                size === 'xs'
                  ? 'w-3.5 h-3.5 text-[#8c8275]'
                  : size === 'sm'
                  ? 'w-4 h-4 text-[#8c8275]'
                  : 'w-5 h-5 text-[#8c8275]'
              }
            />
          )}
        </div>
      )}

      {/* Subtle warm earth overlay + centered Play icon */}
      <div className="absolute inset-0 bg-[#4d4740]/10 group-hover/thumb:bg-[#3b6845]/25 transition-colors flex items-center justify-center">
        <span
          className={`${
            size === 'xs'
              ? 'w-4 h-4'
              : size === 'sm'
              ? 'w-5 h-5'
              : 'w-6 h-6'
          } rounded-full bg-[#fdfbf7]/95 text-[#3b6845] border border-[#bad8b9] shadow-2xs flex items-center justify-center group-hover/thumb:scale-110 group-hover/thumb:bg-[#3b6845] group-hover/thumb:text-white transition-all`}
        >
          <Play
            className={
              size === 'xs'
                ? 'w-2 h-2 fill-current ml-0.5'
                : size === 'sm'
                ? 'w-2.5 h-2.5 fill-current ml-0.5'
                : 'w-3 h-3 fill-current ml-0.5'
            }
          />
        </span>
      </div>

      {/* Top-left mini provider indicator when image is loaded */}
      {canShowImage && preview.provider !== 'NONE' && size !== 'xs' && (
        <span className="absolute top-1 left-1 p-0.5 rounded bg-[#fdfbf7]/95 border border-[#e8dfd3] shadow-2xs backdrop-blur-xs">
          {preview.provider === 'DRIVE' ? (
            <GoogleDriveIcon className="w-2.5 h-2.5" />
          ) : (
            <Youtube className="w-2.5 h-2.5 text-[#c95b48]" />
          )}
        </span>
      )}

      {/* Bottom-right duration / timestamp pill in light pastel earth tone */}
      {durationBadge && size === 'md' && (
        <span className="absolute bottom-1 right-1 px-1 py-0.2 rounded bg-[#fdfbf7]/95 text-[#2d2926] border border-[#e2d8cb] font-mono text-[9px] font-bold leading-tight tabular-nums shadow-2xs">
          {durationBadge}
        </span>
      )}
    </button>
  );
};
