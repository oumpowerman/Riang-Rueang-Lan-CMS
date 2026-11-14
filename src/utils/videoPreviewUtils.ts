import { Footage } from '../types/footage.types';

export type VideoPreviewProvider =
  | 'DRIVE'
  | 'YOUTUBE'
  | 'TIKTOK'
  | 'FACEBOOK'
  | 'INSTAGRAM'
  | 'SOCIAL'
  | 'NONE';

export interface VideoPreviewInfo {
  provider: VideoPreviewProvider;
  providerLabel: string;
  videoId: string | null;
  thumbnailUrl: string | null;
  fallbackThumbnailUrl: string | null;
  embedUrl: string | null;
  externalUrl: string | null;
  secondarySocialUrl?: string | null;
}

function isRealExternalUrl(url?: string | null): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  if (!trimmed) return false;
  if (trimmed.includes('/paste-') || trimmed.includes('example.com')) {
    return false;
  }
  return /^https?:\/\//i.test(trimmed);
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
  if (!isRealExternalUrl(url)) return null;
  const trimmed = url!.trim();

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
  if (!isRealExternalUrl(url)) return null;
  const trimmed = url!.trim();

  const ytRegex =
    /(?:youtube\.com\/(?:watch\?.*v=|embed\/|shorts\/|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = trimmed.match(ytRegex);
  if (match && match[1]) {
    return match[1];
  }

  return null;
}

/**
 * Extracts a TikTok video ID if present in URL
 */
export function extractTikTokVideoId(url?: string | null): string | null {
  if (!isRealExternalUrl(url)) return null;
  const trimmed = url!.trim();
  if (!/tiktok\.com/i.test(trimmed)) return null;
  const match = trimmed.match(/\/video\/(\d+)/);
  return match && match[1] ? match[1] : null;
}

/**
 * Extracts an Instagram post/reel/tv shortcode if present in URL
 */
export function extractInstagramShortcode(url?: string | null): string | null {
  if (!isRealExternalUrl(url)) return null;
  const trimmed = url!.trim();
  if (!/instagram\.com/i.test(trimmed)) return null;
  const match = trimmed.match(/instagram\.com\/(?:p|reel|reels|tv)\/([A-Za-z0-9_-]+)/i);
  return match && match[1] ? match[1] : null;
}

/**
 * Builds Microlink OpenGraph image and page screenshot URLs for any public social/web URL
 */
function buildMicrolinkThumbnails(targetUrl: string): {
  ogImageUrl: string;
  screenshotUrl: string;
} {
  const encoded = encodeURIComponent(targetUrl);
  return {
    ogImageUrl: `https://api.microlink.io/?url=${encoded}&embed=image.url`,
    screenshotUrl: `https://api.microlink.io/?url=${encoded}&screenshot=true&meta=false&embed=screenshot.url`,
  };
}

/**
 * Resolves thumbnail URLs and embed player URLs for a Footage item
 * from Google Drive, YouTube, TikTok, Facebook, Instagram, or Social web links.
 */
export function getFootageVideoPreviewInfo(
  footage: Pick<Footage, 'driveFileUrl' | 'originalUrl' | 'thumbnailUrl'>
): VideoPreviewInfo {
  const validOriginalUrl = isRealExternalUrl(footage.originalUrl)
    ? footage.originalUrl!.trim()
    : null;
  const validDriveUrl = isRealExternalUrl(footage.driveFileUrl)
    ? footage.driveFileUrl!.trim()
    : null;

  // Check if originalUrl or driveFileUrl has a YouTube ID (useful both as primary or fallback thumbnail)
  const ytId =
    extractYouTubeVideoId(validOriginalUrl) ||
    extractYouTubeVideoId(validDriveUrl);

  // 1. Check Google Drive link first (from driveFileUrl or originalUrl)
  const driveId =
    extractGoogleDriveFileId(validDriveUrl) ||
    extractGoogleDriveFileId(validOriginalUrl);

  if (driveId) {
    const primaryThumb =
      footage.thumbnailUrl ||
      `https://drive.google.com/thumbnail?id=${driveId}&sz=w320`;
    // If Google Drive thumbnail is restricted, fall back to lh3 or YouTube/Social thumbnail if attached
    const fallbackThumb = ytId
      ? `https://i.ytimg.com/vi/${ytId}/mqdefault.jpg`
      : validOriginalUrl && !extractGoogleDriveFileId(validOriginalUrl)
      ? buildMicrolinkThumbnails(validOriginalUrl).ogImageUrl
      : `https://lh3.googleusercontent.com/d/${driveId}=w320`;

    return {
      provider: 'DRIVE',
      providerLabel: 'Google Drive',
      videoId: driveId,
      thumbnailUrl: primaryThumb,
      fallbackThumbnailUrl: fallbackThumb,
      embedUrl: `https://drive.google.com/file/d/${driveId}/preview`,
      externalUrl:
        validDriveUrl || `https://drive.google.com/file/d/${driveId}/view`,
      secondarySocialUrl:
        validOriginalUrl && !extractGoogleDriveFileId(validOriginalUrl)
          ? validOriginalUrl
          : null,
    };
  }

  // 2. Check YouTube link (from originalUrl or driveFileUrl)
  if (ytId) {
    return {
      provider: 'YOUTUBE',
      providerLabel: 'YouTube',
      videoId: ytId,
      thumbnailUrl:
        footage.thumbnailUrl || `https://i.ytimg.com/vi/${ytId}/mqdefault.jpg`,
      fallbackThumbnailUrl: `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg`,
      embedUrl: `https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0`,
      externalUrl:
        validOriginalUrl || `https://www.youtube.com/watch?v=${ytId}`,
    };
  }

  // 3. Check Social / Web URL (TikTok, Facebook, Instagram, X/Twitter, etc.)
  const socialUrl = validOriginalUrl || validDriveUrl;
  if (socialUrl) {
    const { ogImageUrl, screenshotUrl } = buildMicrolinkThumbnails(socialUrl);

    // 3a. TikTok
    if (/tiktok\.com/i.test(socialUrl)) {
      const tiktokId = extractTikTokVideoId(socialUrl);
      return {
        provider: 'TIKTOK',
        providerLabel: 'TikTok',
        videoId: tiktokId,
        thumbnailUrl: footage.thumbnailUrl || ogImageUrl,
        fallbackThumbnailUrl: screenshotUrl,
        embedUrl: tiktokId
          ? `https://www.tiktok.com/embed/v2/${tiktokId}`
          : null,
        externalUrl: socialUrl,
      };
    }

    // 3b. Facebook
    if (/(?:facebook\.com|fb\.watch|fb\.com)/i.test(socialUrl)) {
      return {
        provider: 'FACEBOOK',
        providerLabel: 'Facebook',
        videoId: null,
        thumbnailUrl: footage.thumbnailUrl || ogImageUrl,
        fallbackThumbnailUrl: screenshotUrl,
        embedUrl: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(
          socialUrl
        )}&show_text=false`,
        externalUrl: socialUrl,
      };
    }

    // 3c. Instagram
    if (/instagram\.com/i.test(socialUrl)) {
      const igCode = extractInstagramShortcode(socialUrl);
      return {
        provider: 'INSTAGRAM',
        providerLabel: 'Instagram',
        videoId: igCode,
        thumbnailUrl:
          footage.thumbnailUrl ||
          (igCode
            ? `https://www.instagram.com/p/${igCode}/media/?size=m`
            : ogImageUrl),
        fallbackThumbnailUrl: ogImageUrl,
        embedUrl: igCode ? `https://www.instagram.com/p/${igCode}/embed` : null,
        externalUrl: socialUrl,
      };
    }

    // 3d. Other Social / Web URL (X/Twitter, Twitch, News, etc.)
    return {
      provider: 'SOCIAL',
      providerLabel: 'Social / Web',
      videoId: null,
      thumbnailUrl: footage.thumbnailUrl || ogImageUrl,
      fallbackThumbnailUrl: screenshotUrl,
      embedUrl: null,
      externalUrl: socialUrl,
    };
  }

  // 4. Fallback if only custom thumbnailUrl exists
  return {
    provider: 'NONE',
    providerLabel: 'ไม่มีลิงก์',
    videoId: null,
    thumbnailUrl: footage.thumbnailUrl || null,
    fallbackThumbnailUrl: null,
    embedUrl: null,
    externalUrl: null,
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
