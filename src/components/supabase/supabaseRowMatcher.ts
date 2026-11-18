import { Episode } from '../../types/episode.types';
import {
  DeduplicationStatus,
  SupabaseConnectionConfig,
  SupabaseRowDraftOverride,
  SupabaseSyncRowState,
} from '../../types/supabaseSync.types';
import { hasRealMasterDriveLink } from '../../utils/episodeValidator';
import { extractEpRefFromRemark } from '../../utils/supabasePayloadMapper';

export interface SupabaseMatchedLookup {
  epRefMap: Map<string, any>;
  titleMap: Map<string, any>;
  linkMap: Map<string, any>;
}

export interface EpisodeMatchOutcome {
  matchedRecord: any | null;
  matchedViaEpRef: boolean;
}

export function buildMatchedRecordLookup(
  existingRecords: any[]
): SupabaseMatchedLookup {
  const epRefMap = new Map<string, any>();
  const titleMap = new Map<string, any>();
  const linkMap = new Map<string, any>();

  existingRecords.forEach((rec) => {
    if (!rec) return;
    const epRef = extractEpRefFromRemark(rec.remark);
    if (epRef) epRefMap.set(epRef, rec);

    if (rec.title) {
      titleMap.set(String(rec.title).trim().toLowerCase(), rec);
    }
    if (rec.published_links && typeof rec.published_links === 'object') {
      Object.values(rec.published_links).forEach((url) => {
        if (typeof url === 'string' && url.trim()) {
          linkMap.set(url.trim(), rec);
        }
      });
    }
    if (Array.isArray(rec.assets)) {
      rec.assets.forEach((ast: any) => {
        if (
          ast &&
          typeof ast.url === 'string' &&
          hasRealMasterDriveLink(ast.url)
        ) {
          linkMap.set(ast.url.trim(), rec);
        }
      });
    }
  });

  return { epRefMap, titleMap, linkMap };
}

export function mergeMatchedLookups(
  base: SupabaseMatchedLookup | null,
  incoming: SupabaseMatchedLookup
): SupabaseMatchedLookup {
  if (!base) return incoming;

  const epRefMap = new Map(base.epRefMap);
  const titleMap = new Map(base.titleMap);
  const linkMap = new Map(base.linkMap);

  incoming.epRefMap.forEach((v, k) => epRefMap.set(k, v));
  incoming.titleMap.forEach((v, k) => titleMap.set(k, v));
  incoming.linkMap.forEach((v, k) => linkMap.set(k, v));

  return { epRefMap, titleMap, linkMap };
}

export function findEpisodeMatchInLookup(
  ep: Episode,
  lookup: SupabaseMatchedLookup | null
): EpisodeMatchOutcome {
  if (!lookup) {
    return { matchedRecord: null, matchedViaEpRef: false };
  }

  const epRefRec = ep.id ? lookup.epRefMap.get(ep.id.trim()) : null;
  if (epRefRec) {
    return { matchedRecord: epRefRec, matchedViaEpRef: true };
  }

  const cleanTitle = ep.title.trim().toLowerCase();
  const cleanYoutubeUrl = ep.masterVideoInfo?.youtubeUrl?.trim();
  const cleanTiktokUrl = ep.masterVideoInfo?.tiktokUrl?.trim();
  const cleanFacebookUrl = ep.masterVideoInfo?.facebookUrl?.trim();
  const cleanInstagramUrl = ep.masterVideoInfo?.instagramUrl?.trim();
  const rawDriveUrl = ep.masterVideoInfo?.masterDriveUrl?.trim();
  const realDriveUrl = hasRealMasterDriveLink(rawDriveUrl) ? rawDriveUrl : '';

  const matchedRecord =
    lookup.titleMap.get(cleanTitle) ||
    (realDriveUrl ? lookup.linkMap.get(realDriveUrl) : null) ||
    (cleanYoutubeUrl ? lookup.linkMap.get(cleanYoutubeUrl) : null) ||
    (cleanTiktokUrl ? lookup.linkMap.get(cleanTiktokUrl) : null) ||
    (cleanFacebookUrl ? lookup.linkMap.get(cleanFacebookUrl) : null) ||
    (cleanInstagramUrl ? lookup.linkMap.get(cleanInstagramUrl) : null) ||
    null;

  return { matchedRecord, matchedViaEpRef: false };
}

export function buildRowFromEpisode(
  ep: Episode,
  config: SupabaseConnectionConfig,
  draft: SupabaseRowDraftOverride | undefined,
  outcome: EpisodeMatchOutcome
): SupabaseSyncRowState {
  const stamp = ep.supabaseSyncInfo;
  const hasStamp = Boolean(stamp?.recordId);
  const { matchedRecord, matchedViaEpRef } = outcome;

  let matchStatus: DeduplicationStatus = 'NEW';
  let existingRecordId: string | undefined;
  let existingCreatedAt: string | undefined;
  let existingStatus: string | undefined;

  if (hasStamp && stamp) {
    matchStatus = 'SENT';
    existingRecordId = matchedRecord?.id || stamp.recordId;
    existingCreatedAt = matchedRecord?.created_at || stamp.syncedAt;
    existingStatus = matchedRecord?.status || stamp.status;
  } else if (matchedRecord) {
    matchStatus = matchedViaEpRef ? 'SENT' : 'DUPLICATE';
    existingRecordId = matchedRecord.id;
    existingCreatedAt = matchedRecord.created_at;
    existingStatus = matchedRecord.status;
  }

  const defaultPlatforms =
    config.defaultTargetPlatforms && config.defaultTargetPlatforms.length > 0
      ? config.defaultTargetPlatforms
      : ['YOUTUBE', 'FACEBOOK', 'TIKTOK', 'INSTAGRAM'];

  return {
    episode: ep,
    isSelected:
      typeof draft?.isSelected === 'boolean'
        ? draft.isSelected
        : matchStatus === 'NEW',
    matchStatus,
    existingRecordId,
    existingCreatedAt,
    existingStatus,
    channelId:
      typeof draft?.channelId === 'string'
        ? draft.channelId
        : stamp?.channelId || config.targetChannelId || '',
    status:
      typeof draft?.status === 'string'
        ? draft.status
        : config.defaultStatus || '01_IDEA/DRAFT_💡',
    targetPlatforms:
      Array.isArray(draft?.targetPlatforms) && draft.targetPlatforms.length > 0
        ? draft.targetPlatforms
        : defaultPlatforms,
    includeAssets:
      typeof draft?.includeAssets === 'boolean'
        ? draft.includeAssets
        : config.defaultIncludeAssets,
    includePillar:
      typeof draft?.includePillar === 'boolean'
        ? draft.includePillar
        : Boolean(config.defaultIncludePillar),
    includeCategory:
      typeof draft?.includeCategory === 'boolean'
        ? draft.includeCategory
        : Boolean(config.defaultIncludeCategory),
    description:
      typeof draft?.description === 'string' ? draft.description : '',
    upsertMode:
      draft?.upsertMode === 'UPDATE' || draft?.upsertMode === 'SKIP'
        ? draft.upsertMode
        : 'SKIP',
  };
}

export function formatThaiSyncTimestamp(isoString?: string | null): string {
  if (!isoString) return 'ยังไม่เคยทำรายการ';
  const ms = Date.parse(isoString);
  if (Number.isNaN(ms)) return 'ยังไม่เคยทำรายการ';

  const date = new Date(ms);
  const now = new Date();
  const isSameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  const timeText = date.toLocaleTimeString('th-TH', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  if (isSameDay) {
    return `วันนี้ ${timeText}`;
  }

  const dateText = date.toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
  });
  return `${dateText} ${timeText}`;
}
