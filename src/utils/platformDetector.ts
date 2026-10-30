import React from 'react';

export type DetectedPlatform =
  | 'TIKTOK'
  | 'FACEBOOK'
  | 'YOUTUBE'
  | 'INSTAGRAM'
  | 'TWITTER'
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

  if (trimmed.includes('facebook.com') || trimmed.includes('fb.watch') || trimmed.includes('fb.com')) {
    return {
      type: 'FACEBOOK',
      name: trimmed.includes('reel') ? 'FB Reels' : 'Facebook',
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

  if (trimmed.includes('instagram.com')) {
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

  if (trimmed.includes('twitter.com') || trimmed.includes('x.com')) {
    return {
      type: 'TWITTER',
      name: 'X (Twitter)',
      badgeBg: 'bg-stone-100',
      badgeBorder: 'border-stone-300',
      badgeText: 'text-stone-800',
      hoverColor: 'hover:border-stone-400',
      domainPattern: 'x.com',
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
