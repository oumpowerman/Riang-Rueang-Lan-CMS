export type DetectedPlatform =
  | 'TIKTOK'
  | 'FACEBOOK'
  | 'YOUTUBE'
  | 'INSTAGRAM'
  | 'TWITTER'
  | 'TWITCH'
  | 'GOOGLE_DRIVE'
  | 'GENERIC_WEB';

export interface PlatformMeta {
  type: DetectedPlatform;
  name: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  hoverColor: string;
  domainPattern: string;
}

export interface ParsedSharePayload {
  url: string;
  suggestedTitle: string;
  fallbackNote: string;
}

export const PENDING_SHARE_STORAGE_KEY = 'rrl_pending_share_target';

export function savePendingShareTarget(payload: ParsedSharePayload): void {
  if (typeof window === 'undefined' || !window.sessionStorage) return;
  try {
    window.sessionStorage.setItem(
      PENDING_SHARE_STORAGE_KEY,
      JSON.stringify({ ...payload, savedAt: Date.now() })
    );
  } catch {
    // Ignore storage quota / private mode errors
  }
}

export function readPendingShareTarget(): ParsedSharePayload | null {
  if (typeof window === 'undefined' || !window.sessionStorage) return null;
  try {
    const raw = window.sessionStorage.getItem(PENDING_SHARE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ParsedSharePayload> & { savedAt?: number };
    // Expire stale orphaned payload after 30 minutes
    if (parsed.savedAt && Date.now() - parsed.savedAt > 30 * 60 * 1000) {
      window.sessionStorage.removeItem(PENDING_SHARE_STORAGE_KEY);
      return null;
    }
    return {
      url: typeof parsed.url === 'string' ? parsed.url : '',
      suggestedTitle: typeof parsed.suggestedTitle === 'string' ? parsed.suggestedTitle : '',
      fallbackNote: typeof parsed.fallbackNote === 'string' ? parsed.fallbackNote : '',
    };
  } catch {
    return null;
  }
}

export function clearPendingShareTarget(): void {
  if (typeof window === 'undefined' || !window.sessionStorage) return;
  try {
    window.sessionStorage.removeItem(PENDING_SHARE_STORAGE_KEY);
  } catch {
    // Ignore storage errors
  }
}

export function hasPendingShareTarget(): boolean {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  if (params.get('share-target') === '1' || params.has('url') || params.has('text')) {
    return true;
  }
  return readPendingShareTarget() !== null;
}

const KNOWN_BARE_SOCIAL_URL_REGEX =
  /(?:^|\s)((?:www\.|m\.|vt\.|vm\.|l\.|lm\.)?(?:tiktok\.com|instagram\.com|instagr\.am|facebook\.com|fb\.watch|fb\.com|fb\.me|youtube\.com|youtu\.be|music\.youtube\.com|drive\.google\.com|twitter\.com|x\.com|threads\.net|threads\.com)\/[^\s"'<>]+)/i;

export function sanitizeSharedUrl(raw: string): string {
  const cleaned = raw
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .trim()
    .replace(/[),.;!?'"\]>]+$/g, '');

  if (!cleaned) return '';

  const withScheme = /^https?:\/\//i.test(cleaned) ? cleaned : `https://${cleaned}`;

  try {
    const parsed = new URL(withScheme);
    // Unwrap Facebook outbound link tracker (l.facebook.com/l.php?u=...)
    if (
      (parsed.hostname === 'l.facebook.com' || parsed.hostname === 'lm.facebook.com') &&
      parsed.pathname === '/l.php'
    ) {
      const target = parsed.searchParams.get('u');
      if (target && /^https?:\/\//i.test(target)) {
        return target;
      }
    }
    return parsed.toString();
  } catch {
    return withScheme;
  }
}

const GENERIC_PLATFORM_TITLES = new Set([
  'youtube',
  'youtube shorts',
  'instagram',
  'instagram reel',
  'tiktok',
  'tiktok - make your day',
  'facebook',
  'fb',
  'watch on facebook',
  'watch this video on facebook',
  'watch this reel on instagram',
  'log into facebook',
  'create an account or log in to instagram',
  'x',
  'twitter',
  'threads',
  'google drive',
]);

function cleanSharedTitle(raw: string): string {
  let value = raw
    .replace(/https?:\/\/[^\s"'<>]+/gi, '')
    .replace(KNOWN_BARE_SOCIAL_URL_REGEX, ' ')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!value) return '';

  // Strip noisy trailing/leading platform wrappers added by mobile apps
  value = value
    .replace(/\s*[-|•·]\s*(YouTube|TikTok|Instagram|Facebook|Threads|X|Twitter)\s*$/i, '')
    .replace(/\s+on\s+(Instagram|Facebook|TikTok|YouTube)\s*$/i, '')
    .replace(/^(TikTok|Instagram|Facebook)\s*[•·:-]\s*/i, '')
    .replace(/^Watch\s+(?:this\s+)?(?:reel|video)\s+(?:by\s+[^\s]+\s+)?on\s+(?:Instagram|Facebook)\s*[:\-–]?\s*/i, '')
    .trim();

  if (!value || value === '...' || value === '…') return '';
  if (GENERIC_PLATFORM_TITLES.has(value.toLowerCase())) return '';

  return value;
}

export function detectPlatformFromUrl(url?: string | null): PlatformMeta | null {
  if (!url) return null;
  const trimmed = url.trim().toLowerCase();
  if (!trimmed || !/^https?:\/\//i.test(trimmed)) return null;

  if (trimmed.includes('tiktok.com')) {
    return {
      type: 'TIKTOK',
      name: 'TikTok',
      badgeBg: 'bg-stone-100',
      badgeBorder: 'border-stone-300',
      badgeText: 'text-stone-900',
      hoverColor: 'hover:border-stone-400',
      domainPattern: 'tiktok.com',
    };
  }

  if (
    trimmed.includes('facebook.com') ||
    trimmed.includes('fb.watch') ||
    trimmed.includes('fb.com') ||
    trimmed.includes('fb.me')
  ) {
    return {
      type: 'FACEBOOK',
      name: trimmed.includes('reel') || trimmed.includes('/share/r/') ? 'FB Reels' : 'Facebook',
      badgeBg: 'bg-blue-50',
      badgeBorder: 'border-blue-200',
      badgeText: 'text-blue-800',
      hoverColor: 'hover:border-blue-300',
      domainPattern: 'facebook.com',
    };
  }

  if (trimmed.includes('youtube.com') || trimmed.includes('youtu.be')) {
    return {
      type: 'YOUTUBE',
      name: trimmed.includes('shorts') ? 'YT Shorts' : 'YouTube',
      badgeBg: 'bg-rose-50',
      badgeBorder: 'border-rose-200',
      badgeText: 'text-rose-800',
      hoverColor: 'hover:border-rose-300',
      domainPattern: 'youtube.com',
    };
  }

  if (trimmed.includes('instagram.com') || trimmed.includes('instagr.am')) {
    return {
      type: 'INSTAGRAM',
      name: trimmed.includes('reel') ? 'IG Reels' : 'Instagram',
      badgeBg: 'bg-fuchsia-50',
      badgeBorder: 'border-fuchsia-200',
      badgeText: 'text-fuchsia-800',
      hoverColor: 'hover:border-fuchsia-300',
      domainPattern: 'instagram.com',
    };
  }

  if (
    trimmed.includes('twitter.com') ||
    trimmed.includes('x.com') ||
    trimmed.includes('threads.net') ||
    trimmed.includes('threads.com')
  ) {
    const isThreads = trimmed.includes('threads.');
    return {
      type: 'TWITTER',
      name: isThreads ? 'Threads' : 'X (Twitter)',
      badgeBg: 'bg-stone-100',
      badgeBorder: 'border-stone-300',
      badgeText: 'text-stone-800',
      hoverColor: 'hover:border-stone-400',
      domainPattern: isThreads ? 'threads.net' : 'x.com',
    };
  }

  if (trimmed.includes('drive.google.com')) {
    return {
      type: 'GOOGLE_DRIVE',
      name: 'Google Drive',
      badgeBg: 'bg-emerald-50',
      badgeBorder: 'border-emerald-200',
      badgeText: 'text-emerald-800',
      hoverColor: 'hover:border-emerald-300',
      domainPattern: 'drive.google.com',
    };
  }

  // Any other valid URL
  try {
    const parsed = new URL(trimmed);
    return {
      type: 'GENERIC_WEB',
      name: parsed.hostname.replace(/^www\./, ''),
      badgeBg: 'bg-stone-50',
      badgeBorder: 'border-stone-200',
      badgeText: 'text-stone-700',
      hoverColor: 'hover:border-stone-300',
      domainPattern: parsed.hostname,
    };
  } catch {
    return null;
  }
}

/**
 * Extracts the first HTTP/HTTPS (or bare social domain) URL and cleans up any remaining
 * caption/title text shared by YouTube, TikTok, Instagram, Facebook, or X mobile apps.
 */
export function parseSharedInput(
  rawUrl?: string | null,
  rawText?: string | null,
  rawTitle?: string | null
): ParsedSharePayload {
  const candidates = [rawUrl || '', rawText || '', rawTitle || ''];
  const combined = candidates.join(' ').trim();

  const fullUrlMatch = combined.match(/https?:\/\/[^\s"'<>]+/i);
  let extractedUrl = fullUrlMatch ? sanitizeSharedUrl(fullUrlMatch[0]) : '';

  if (!extractedUrl) {
    const bareMatch = combined.match(KNOWN_BARE_SOCIAL_URL_REGEX);
    if (bareMatch && bareMatch[1]) {
      extractedUrl = sanitizeSharedUrl(bareMatch[1]);
    }
  }

  const cleanedTitle = cleanSharedTitle(rawTitle || '');
  const cleanedText = cleanSharedTitle(rawText || '');

  const suggestedTitle = (cleanedTitle || cleanedText).slice(0, 120);
  const fallbackNote =
    !extractedUrl && (cleanedText || cleanedTitle)
      ? (cleanedText || cleanedTitle).slice(0, 300)
      : cleanedTitle && cleanedText && cleanedTitle !== cleanedText
        ? cleanedText.slice(0, 300)
        : '';

  return {
    url: extractedUrl,
    suggestedTitle,
    fallbackNote,
  };
}

/**
 * Generates a fallback Thai clip title based on the detected platform and current date
 * when the user clicks Quick Save in Step 1 without typing a custom title.
 */
export function getDefaultClipTitle(url?: string | null): string {
  const platform = detectPlatformFromUrl(url);
  const dateLabel = new Date().toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
  });
  if (platform) {
    return `คลิปจาก ${platform.name} (${dateLabel})`;
  }
  return `คลิปฟุตเทจใหม่ (${dateLabel})`;
}

