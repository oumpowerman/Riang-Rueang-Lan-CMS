import { Episode, MasterVideoInfo } from '../types/episode.types';
import {
  SupabaseAssetItem,
  SupabaseConnectionConfig,
  SupabaseContentPayload,
  SupabaseSyncRowState,
} from '../types/supabaseSync.types';

/**
 * Validates whether a given string is a valid UUID format
 */
export function isValidUUID(uuidStr: string): boolean {
  if (!uuidStr || typeof uuidStr !== 'string') return false;
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuidStr.trim());
}

/**
 * Enterprise UUID generator for assets compatible with modern crypto.randomUUID()
 */
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Formats the remark field with an immutable Episode Reference tag `[EP_REF:<id>]`
 * so enterprise deduplication works 100% accurately even if the episode title is edited later.
 */
export function formatEpRemark(episodeId: string): string {
  const cleanId = (episodeId || '').trim();
  if (!cleanId) {
    return 'สร้างจากระบบเรียงเรื่องลั่น (Smart Mix 5→1)';
  }
  return `สร้างจากระบบเรียงเรื่องลั่น (Smart Mix 5→1) [EP_REF:${cleanId}]`;
}

/**
 * Extracts the Episode Reference ID from a Supabase `remark` string if present
 */
export function extractEpRefFromRemark(remark?: string | null): string | null {
  if (!remark || typeof remark !== 'string') return null;
  const match = remark.match(/\[EP_REF:([^\]]+)\]/);
  return match && match[1] ? match[1].trim() : null;
}

/**
 * Cleans tags: removes leading '#' and deduplicates
 */
export function extractCleanTags(ep: Episode): string[] {
  const rawTags: string[] = [];

  if (ep.seriesTitle) {
    rawTags.push(ep.seriesTitle);
  }
  if (ep.mainCategoryTagId) {
    rawTags.push(ep.mainCategoryTagId);
  }

  // Tags from ranking snapshots if available
  if (Array.isArray(ep.rankings)) {
    ep.rankings.forEach((slot) => {
      if (slot.snapshotNote) {
        rawTags.push(slot.snapshotNote);
      }
    });
  }

  const cleanedSet = new Set<string>();
  rawTags.forEach((t) => {
    if (typeof t === 'string') {
      const clean = t.replace(/^#+/, '').trim();
      if (clean) cleanedSet.add(clean);
    }
  });

  return Array.from(cleanedSet);
}

/**
 * Generates description based on user row setting or configuration mode
 */
export function generateRowDescription(
  row: SupabaseSyncRowState,
  config: SupabaseConnectionConfig
): string | null {
  if (row.description && row.description.trim()) {
    return row.description.trim();
  }

  if (config.defaultDescriptionMode === 'EMPTY') {
    return null;
  }

  // AUTO Mode: informative production summary
  const ep = row.episode;
  const clipCount = Array.isArray(ep.rankings) ? ep.rankings.length : 0;
  const category = ep.seriesTitle || ep.mainCategoryTagId || 'ทั่วไป';
  const tagsStr = extractCleanTags(ep).slice(0, 5).join(', ');

  const lines = [
    `🎬 คอนเทนต์ผลิตจากระบบเรียงเรื่องลั่น (5→1 Smart Mix)`,
    `• หมวดหมู่/ซีรีส์: ${category}`,
    `• จำนวนฟุตเทจที่ใช้: ${clipCount} อันดับ`,
  ];

  if (tagsStr) {
    lines.push(`• หมวดหมู่/แท็ก: ${tagsStr}`);
  }

  if (ep.publishDate) {
    lines.push(`• วันที่จัดทำ EP: ${ep.publishDate}`);
  }

  return lines.join('\n');
}

/**
 * Maps an Episode sync row state into a PostgreSQL payload conforming to `public.contents`
 */
export function mapEpisodeToSupabasePayload(
  row: SupabaseSyncRowState,
  config: SupabaseConnectionConfig
): SupabaseContentPayload {
  const ep = row.episode;

  // Published Links JSONB - default empty object {}, uppercase platform keys, Google Drive excluded
  const publishedLinks: Record<string, string> = {};
  if (ep.masterVideoInfo?.tiktokUrl && ep.masterVideoInfo.tiktokUrl.trim()) {
    publishedLinks['TIKTOK'] = ep.masterVideoInfo.tiktokUrl.trim();
  }
  if (ep.masterVideoInfo?.youtubeUrl && ep.masterVideoInfo.youtubeUrl.trim()) {
    publishedLinks['YOUTUBE'] = ep.masterVideoInfo.youtubeUrl.trim();
  }
  if (ep.masterVideoInfo?.facebookUrl && ep.masterVideoInfo.facebookUrl.trim()) {
    publishedLinks['FACEBOOK'] = ep.masterVideoInfo.facebookUrl.trim();
  }
  if (ep.masterVideoInfo?.instagramUrl && ep.masterVideoInfo.instagramUrl.trim()) {
    publishedLinks['INSTAGRAM'] = ep.masterVideoInfo.instagramUrl.trim();
  }

  // Assets JSONB: Google Drive attached as the primary 1st item, followed by ranking footage clips
  const assets: SupabaseAssetItem[] = [];
  const nowIso = new Date().toISOString();

  // 1. Primary Item: Master Video in Google Drive
  const masterDriveUrl = ep.masterVideoInfo?.masterDriveUrl?.trim();
  if (masterDriveUrl) {
    const masterFileName =
      ep.masterVideoInfo?.masterFileName?.trim() ||
      `Master_${ep.title.replace(/\s+/g, '_')}.mp4`;
    assets.push({
      id: generateUUID(),
      url: masterDriveUrl,
      name: masterFileName,
      type: 'LINK',
      category: 'Draft Video',
      createdAt: nowIso,
    });
  }

  // 2. Ranking footage clips (if includeAssets is true)
  if (row.includeAssets && Array.isArray(ep.rankings)) {
    ep.rankings.forEach((slot, index) => {
      const clipRank = slot.rank || index + 1;
      const clipTitle =
        slot.snapshotNote?.trim() ||
        (slot.footageId
          ? `ฟุตเทจ ${slot.footageId} (อันดับ ${clipRank})`
          : `ฟุตเทจอันดับ ${clipRank}`);

      assets.push({
        id: generateUUID(),
        url: '',
        name: clipTitle,
        type: 'LINK',
        category: 'Draft Video',
        createdAt: nowIso,
      });
    });
  }

  // Valid UUID for channel_id or null
  const effectiveChannelId = row.channelId || config.targetChannelId || '';
  const channelId = isValidUUID(effectiveChannelId)
    ? effectiveChannelId.trim()
    : null;

  const resolvedCategory = ep.seriesTitle || ep.mainCategoryTagId || null;
  const pillarVal = row.includePillar ? resolvedCategory : null;
  const categoryVal = row.includeCategory ? resolvedCategory : null;

  const effectiveTargetPlatforms =
    row.targetPlatforms && row.targetPlatforms.length > 0
      ? row.targetPlatforms
      : config.defaultTargetPlatforms && config.defaultTargetPlatforms.length > 0
      ? config.defaultTargetPlatforms
      : ['YOUTUBE', 'FACEBOOK', 'TIKTOK', 'INSTAGRAM'];

  return {
    title: ep.title.trim(),
    description: generateRowDescription(row, config),
    status: row.status || config.defaultStatus || '01_IDEA/DRAFT_💡',
    tags: extractCleanTags(ep),
    pillar: pillarVal,
    category: categoryVal,
    remark: formatEpRemark(ep.id),
    channel_id: channelId,
    target_platform: effectiveTargetPlatforms,
    is_unscheduled: true,
    published_links: publishedLinks,
    assets: assets,
    content_formats: ['SMART_MIX_5TO1'],
  };
}
