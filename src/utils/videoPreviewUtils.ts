import { Footage } from '../types/footage.types';

export type VideoPreviewProvider = 'DRIVE' | 'YOUTUBE' | 'NONE';

export interface VideoPreviewInfo {
  provider: VideoPreviewProvider;
  videoId: string | null;
  thumbnailUrl: string | null;
  fallbackThumbnailUrl: string | null;
  embedUrl: string | null;
  externalUrl: string | null;
}

/**
 * Extracts a real Google Drive File ID from various URL patterns:
 * - https://drive.google.com/file/d/<FILE_ID>/view
 * - https://drive.google.com/file/d/<FILE_ID>/preview
 * - https://drive.google.com/open?id=<FILE_ID>
 * - https://drive.google.com/uc?id=<FILE_ID>
 * Excludes placeholder/mock IDs like "paste-1" or short strings (< 18 chars).
 */
export function extractGoogleDriveFileId(url?: string | null): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  // Exclude placeholder/mock URLs
  if (trimmed.includes('/paste-') || trimmed.includes('example.com')) {
    return null;
  }

  // Pattern 1: /file/d/<FILE_ID> or /d/<FILE_ID>
  const fileDMatch = trimmed.match(/\/(?:file\/)?d\/([a-zA-Z0-9_-]{18,})/);
  if (fileDMatch && fileDMatch[1]) {
    return fileDMatch[1];
  }

  // Pattern 2: ?id=<FILE_ID> or &id=<FILE_ID>
  const idParamMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]{18,})/);
  if (idParamMatch && idParamMatch[1]) {
    return idParamMatch[1];
  }

  return null;
}

/**
 * Extracts a YouTube 11-character Video ID from various URL patterns:
 * - https://www.youtube.com/watch?v=<VIDEO_ID>
 * - https://youtu.be/<VIDEO_ID>
 * - https://www.youtube.com/shorts/<VIDEO_ID>
 * - https://www.youtube.com/live/<VIDEO_ID>
 * - https://www.youtube.com/embed/<VIDEO_ID>
 */
export function extractYouTubeVideoId(url?: string | null): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  const ytRegex =
    /(?:youtube\.com\/(?:watch\?.*v=|embed\/|shorts\/|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = trimmed.match(ytRegex);
  if (match && match[1]) {
    return match[1];
  }

  return null;
}

/**
 * Resolves thumbnail URLs and embed player URLs for a Footage item
 * from Google Drive or YouTube links.
 */
export function getFootageVideoPreviewInfo(
  footage: Pick<Footage, 'driveFileUrl' | 'originalUrl' | 'thumbnailUrl'>
): VideoPreviewInfo {
  // 1. Check Google Drive link first (from driveFileUrl or originalUrl)
  const driveId =
    extractGoogleDriveFileId(footage.driveFileUrl) ||
    extractGoogleDriveFileId(footage.originalUrl);

  if (driveId) {
    const primaryThumb =
      footage.thumbnailUrl || `https://drive.google.com/thumbnail?id=${driveId}&sz=w320`;
    const fallbackThumb = `https://lh3.googleusercontent.com/d/${driveId}=w320`;
    return {
      provider: 'DRIVE',
      videoId: driveId,
      thumbnailUrl: primaryThumb,
      fallbackThumbnailUrl: fallbackThumb,
      embedUrl: `https://drive.google.com/file/d/${driveId}/preview`,
      externalUrl:
        footage.driveFileUrl || `https://drive.google.com/file/d/${driveId}/view`,
    };
  }

  // 2. Check YouTube link (from originalUrl or driveFileUrl)
  const ytId =
    extractYouTubeVideoId(footage.originalUrl) ||
    extractYouTubeVideoId(footage.driveFileUrl);

  if (ytId) {
    return {
      provider: 'YOUTUBE',
      videoId: ytId,
      thumbnailUrl:
        footage.thumbnailUrl || `https://i.ytimg.com/vi/${ytId}/mqdefault.jpg`,
      fallbackThumbnailUrl: `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg`,
      embedUrl: `https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0`,
      externalUrl:
        footage.originalUrl || `https://www.youtube.com/watch?v=${ytId}`,
    };
  }

  // 3. Fallback if custom thumbnailUrl or external link exists
  const rawExternal =
    (footage.driveFileUrl && !footage.driveFileUrl.includes('/paste-')
      ? footage.driveFileUrl
      : '') ||
    (footage.originalUrl && !footage.originalUrl.includes('/paste-')
      ? footage.originalUrl
      : '') ||
    null;

  return {
    provider: 'NONE',
    videoId: null,
    thumbnailUrl: footage.thumbnailUrl || null,
    fallbackThumbnailUrl: null,
    embedUrl: null,
    externalUrl: rawExternal,
  };
}

/**
 * Formats a concise badge string for duration or timestamp range on a thumbnail.
 */
export function formatClipDurationBadge(
  footage: Pick<Footage, 'timestampRange' | 'durationSec'>
): string | null {
  if (footage.timestampRange && footage.timestampRange.trim()) {
    return footage.timestampRange.trim();
  }
  if (footage.durationSec && footage.durationSec > 0) {
    return `${footage.durationSec}วิ`;
  }
  return null;
}
