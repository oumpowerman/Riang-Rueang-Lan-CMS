import { Episode } from '../types/episode.types';
import { ComputedFootage } from '../types/footage.types';
import { CategoryTag } from '../types/tag.types';
import {
  SupabaseAssetItem,
  SupabaseConnectionConfig,
  SupabaseContentPayload,
  SupabaseSyncRowState,
} from '../types/supabaseSync.types';
import { hasRealMasterDriveLink } from './episodeValidator';
import { isStagingTagId } from '../services/seedData';

export interface SupabasePayloadMapperContext {
  tagMap?: Record<string, CategoryTag>;
  computedFootageMap?: Record<string, ComputedFootage>;
}

const INTERNAL_ID_PREFIX_REGEX = /^(?:TAG|GRP|ARC-CAT|SERIES)[-_::]/i;

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
 * Resolves a human-readable category/series label for display & pillar/category columns,
 * never leaking internal tag IDs like "TAG-0001".
 */
export function resolveEpisodeDisplayCategory(
  ep: Episode,
  tagMap?: Record<string, CategoryTag>
): string | null {
  if (ep.seriesTitle && ep.seriesTitle.trim()) {
    return ep.seriesTitle.trim();
  }
  if (
    ep.mainCategoryTagId &&
    !isStagingTagId(ep.mainCategoryTagId) &&
    tagMap?.[ep.mainCategoryTagId]?.name
  ) {
    return tagMap[ep.mainCategoryTagId].name.replace(/^#+/, '').trim();
  }
  if (
    ep.mainCategoryTagId &&
    !isStagingTagId(ep.mainCategoryTagId) &&
    !INTERNAL_ID_PREFIX_REGEX.test(ep.mainCategoryTagId)
  ) {
    return ep.mainCategoryTagId.trim();
  }
  return null;
}

/**
 * Collects real human-readable 3-Tier Tag names + Series title for Kontent OS `tags` column.
 * Never exports internal tag IDs (TAG-XXXX) or rank/punchline snapshotNotes.
 */
export function extractCleanTags(
  ep: Episode,
  context?: SupabasePayloadMapperContext
): string[] {
  const tagMap = context?.tagMap;
  const computedFootageMap = context?.computedFootageMap;

  const cleanedList: string[] = [];
  const seenLower = new Set<string>();

  const pushCleanTag = (raw?: string | null) => {
    if (typeof raw !== 'string') return;
    const clean = raw.replace(/^#+/, '').trim();
    if (!clean) return;
    if (INTERNAL_ID_PREFIX_REGEX.test(clean)) return;
    const lower = clean.toLowerCase();
    if (seenLower.has(lower)) return;
    seenLower.add(lower);
    cleanedList.push(clean);
  };

  // 1. Series title if available
  if (ep.seriesTitle) {
    pushCleanTag(ep.seriesTitle);
  }

  // 2. Episode-level Main & Subcategory tag names resolved from tagMap
  if (ep.mainCategoryTagId && !isStagingTagId(ep.mainCategoryTagId)) {
    const mainTagName = tagMap?.[ep.mainCategoryTagId]?.name;
    if (mainTagName) {
      pushCleanTag(mainTagName);
    }
  }
  if (ep.targetSubcategoryId && !isStagingTagId(ep.targetSubcategoryId)) {
    const subTagName = tagMap?.[ep.targetSubcategoryId]?.name;
    if (subTagName) {
      pushCleanTag(subTagName);
    }
  }

  // 3. Collect all 3-Tier Tag names from each filled ranking footage
  if (Array.isArray(ep.rankings) && computedFootageMap && tagMap) {
    ep.rankings.forEach((slot) => {
      if (!slot.footageId) return;
      const ft = computedFootageMap[slot.footageId];
      if (!ft || !Array.isArray(ft.tags)) return;
      ft.tags.forEach((tid) => {
        if (!tid || isStagingTagId(tid)) return;
        const tagObj = tagMap[tid];
        if (tagObj?.name) {
          pushCleanTag(tagObj.name);
        }
      });
    });
  }

  return cleanedList;
}

/**
 * Generates description based on user row setting or configuration mode
 */
export function generateRowDescription(
  row: SupabaseSyncRowState,
  config: SupabaseConnectionConfig,
  context?: SupabasePayloadMapperContext
): string | null {
  if (row.description && row.description.trim()) {
    return row.description.trim();
  }

  if (config.defaultDescriptionMode === 'EMPTY') {
    return null;
  }

  // AUTO Mode: informative production summary
  const ep = row.episode;
  const clipCount = Array.isArray(ep.rankings)
    ? ep.rankings.filter((slot) => Boolean(slot.footageId)).length
    : 0;
  const category =
    resolveEpisodeDisplayCategory(ep, context?.tagMap) || 'ทั่วไป';
  const tagsStr = extractCleanTags(ep, context).slice(0, 8).join(', ');

  const lines = [
    `🎬 คอนเทนต์ผลิตจากระบบเรียงเรื่องลั่น (5→1 Smart Mix)`,
    `• หมวดหมู่/ซีรีส์: ${category}`,
    `• จำนวนฟุตเทจที่ใช้: ${clipCount}/5 อันดับ`,
  ];

  if (tagsStr) {
    lines.push(`• แท็ก 3 Tier: ${tagsStr}`);
  }

  if (ep.publishDate) {
    lines.push(`• วันที่จัดทำ EP: ${ep.publishDate}`);
  }

  return lines.join('\n');
}

/**
 * Checks whether a footage Drive URL is valid and non-placeholder
 */
function resolveRealDriveUrl(rawUrl?: string | null): string {
  const trimmed = (rawUrl || '').trim();
  if (!trimmed) return '';
  return hasRealMasterDriveLink(trimmed) ? trimmed : '';
}

/**
 * Maps an Episode sync row state into a PostgreSQL payload conforming to `public.contents`
 */
export function mapEpisodeToSupabasePayload(
  row: SupabaseSyncRowState,
  config: SupabaseConnectionConfig,
  context?: SupabasePayloadMapperContext
): SupabaseContentPayload {
  const ep = row.episode;
  const computedFootageMap = context?.computedFootageMap;

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
  if (
    ep.masterVideoInfo?.instagramUrl &&
    ep.masterVideoInfo.instagramUrl.trim()
  ) {
    publishedLinks['INSTAGRAM'] = ep.masterVideoInfo.instagramUrl.trim();
  }

  // Assets JSONB: real Master Drive video (no placeholder URLs!) + filled ranking footages
  const assets: SupabaseAssetItem[] = [];
  const nowIso = new Date().toISOString();

  // 1. Primary Item: Master Video in Google Drive (only if real user URL, never MASTER-EP placeholder)
  const realMasterDriveUrl = resolveRealDriveUrl(
    ep.masterVideoInfo?.masterDriveUrl
  );
  if (realMasterDriveUrl) {
    const masterFileName =
      ep.masterVideoInfo?.masterFileName?.trim() ||
      `Master_${ep.title.replace(/\s+/g, '_')}.mp4`;
    assets.push({
      id: generateUUID(),
      url: realMasterDriveUrl,
      name: masterFileName,
      type: 'LINK',
      category: 'Draft Video',
      createdAt: nowIso,
    });
  }

  // 2. Ranking footage clips (if includeAssets is true) - only filled slots, resolved with real footage title & drive url
  if (row.includeAssets && Array.isArray(ep.rankings)) {
    ep.rankings.forEach((slot, index) => {
      if (!slot.footageId) return;
      const clipRank = slot.rank || index + 1;
      const ft = computedFootageMap?.[slot.footageId];
      const realFootageTitle =
        ft?.title?.trim() || slot.rankTitle?.trim() || slot.footageId;
      const clipTitle = `[อันดับ ${clipRank}] ${realFootageTitle}`;
      const clipDriveUrl = resolveRealDriveUrl(ft?.driveFileUrl);

      assets.push({
        id: generateUUID(),
        url: clipDriveUrl,
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

  const resolvedCategory = resolveEpisodeDisplayCategory(ep, context?.tagMap);
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
    description: generateRowDescription(row, config, context),
    status: row.status || config.defaultStatus || '01_IDEA/DRAFT_💡',
    tags: extractCleanTags(ep, context),
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
