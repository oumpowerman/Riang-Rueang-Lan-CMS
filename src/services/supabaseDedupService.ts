import { SupabaseClient } from '@supabase/supabase-js';
import { Episode } from '../types/episode.types';
import { SupabaseConnectionConfig } from '../types/supabaseSync.types';
import { isValidUUID } from '../utils/supabasePayloadMapper';

const TITLE_CHUNK_SIZE = 150;
const EP_REF_CHUNK_SIZE = 25;
const DEDUP_CONCURRENCY = 4;
const DEDUP_SELECT_COLUMNS =
  'id, title, status, published_links, assets, created_at, tags, channel_id, remark';

export interface SmartDeltaDedupResult {
  records: any[];
  checkedEpisodesCount: number;
  usedDeltaFilter: boolean;
}

export interface FullVerifyDedupResult {
  records: any[];
  verifiedStampedIds: Set<string>;
  verificationSucceeded: boolean;
}

function chunkArray<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

async function runWithConcurrency<T>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<void>
): Promise<void> {
  if (items.length === 0) return;
  let nextIndex = 0;
  const workerCount = Math.min(concurrency, items.length);
  const runners = Array.from({ length: workerCount }, async () => {
    while (true) {
      const idx = nextIndex++;
      if (idx >= items.length) break;
      await worker(items[idx], idx);
    }
  });
  await Promise.all(runners);
}

function sanitizeEpIdForOrIlike(epId: string): string {
  return epId.replace(/[,()*%]/g, '').trim();
}

async function queryBatchedEpisodesFromSupabase(
  client: SupabaseClient,
  targetEpisodes: Episode[],
  mergedMap: Map<string, any>,
  onProgress?: (info: {
    completedChunks: number;
    totalChunks: number;
    label: string;
  }) => void,
  labelPrefix = 'กำลังตรวจสอบความซ้ำกับ Supabase'
): Promise<void> {
  if (targetEpisodes.length === 0) return;

  const uniqueTitles = Array.from(
    new Set(
      targetEpisodes
        .map((ep) => ep.title?.trim())
        .filter((t): t is string => Boolean(t))
    )
  );

  const uniqueEpIds = Array.from(
    new Set(
      targetEpisodes
        .map((ep) => sanitizeEpIdForOrIlike(ep.id || ''))
        .filter((id): id is string => Boolean(id))
    )
  );

  const titleChunks = chunkArray(uniqueTitles, TITLE_CHUNK_SIZE);
  const epIdChunks = chunkArray(uniqueEpIds, EP_REF_CHUNK_SIZE);
  const totalChunks = Math.max(1, titleChunks.length + epIdChunks.length);
  let completedChunks = 0;

  type DedupTask =
    | { kind: 'TITLE'; chunk: string[]; idx: number }
    | { kind: 'EP_REF'; chunk: string[]; idx: number };

  const tasks: DedupTask[] = [
    ...titleChunks.map((chunk, idx) => ({ kind: 'TITLE' as const, chunk, idx })),
    ...epIdChunks.map((chunk, idx) => ({ kind: 'EP_REF' as const, chunk, idx })),
  ];

  onProgress?.({
    completedChunks: 0,
    totalChunks,
    label: `${labelPrefix} (${targetEpisodes.length.toLocaleString()} เรื่อง · ${totalChunks} ชุดคำสั่ง)...`,
  });

  await runWithConcurrency(tasks, DEDUP_CONCURRENCY, async (task) => {
    try {
      if (task.kind === 'TITLE') {
        const { data, error } = await client
          .from('contents')
          .select(DEDUP_SELECT_COLUMNS)
          .in('title', task.chunk);

        if (!error && Array.isArray(data)) {
          data.forEach((rec) => {
            if (rec && rec.id) mergedMap.set(rec.id, rec);
          });
        }
      } else {
        const orFilter = task.chunk
          .map((epId) => `remark.ilike.%[EP_REF:${epId}]%`)
          .join(',');

        const { data, error } = await client
          .from('contents')
          .select(DEDUP_SELECT_COLUMNS)
          .or(orFilter);

        if (!error && Array.isArray(data)) {
          data.forEach((rec) => {
            if (rec && rec.id) mergedMap.set(rec.id, rec);
          });
        }
      }
    } catch (chunkErr) {
      console.warn('Deduplication chunk query warning:', chunkErr);
    } finally {
      completedChunks++;
      onProgress?.({
        completedChunks,
        totalChunks,
        label: `${labelPrefix} (${completedChunks}/${totalChunks} ชุด)...`,
      });
    }
  });
}

/**
 * Smart Incremental + Delta Sync Dedup Check:
 * 1. Skips already-stamped episodes (`supabaseSyncInfo.recordId` already stored)
 * 2. Checks ONLY unstamped episodes by Title & `[EP_REF:<id>]`
 * 3. Fetches Delta records created/updated in Supabase since `sinceIso` (minus 5-min clock-skew overlap)
 */
export async function executeSmartDeltaContentsCheck(
  client: SupabaseClient | null,
  episodes: Episode[],
  sinceIso?: string,
  onProgress?: (info: {
    completedChunks: number;
    totalChunks: number;
    label: string;
  }) => void
): Promise<SmartDeltaDedupResult> {
  if (!client || episodes.length === 0) {
    return { records: [], checkedEpisodesCount: 0, usedDeltaFilter: false };
  }

  const mergedMap = new Map<string, any>();
  const unstampedEpisodes = episodes.filter(
    (ep) => !ep.supabaseSyncInfo?.recordId
  );

  const parsedSinceMs = sinceIso ? Date.parse(sinceIso) : NaN;
  const hasValidSince = !Number.isNaN(parsedSinceMs);
  const watermarkIso = hasValidSince
    ? new Date(parsedSinceMs - 5 * 60 * 1000).toISOString()
    : '';

  try {
    await queryBatchedEpisodesFromSupabase(
      client,
      unstampedEpisodes,
      mergedMap,
      onProgress,
      hasValidSince
        ? 'กำลังเช็คเฉพาะคลิปใหม่และรายการอัปเดตล่าสุด (Delta)'
        : 'กำลังตรวจสอบคลิปใหม่กับฐานข้อมูล'
    );

    if (hasValidSince && watermarkIso) {
      onProgress?.({
        completedChunks: 1,
        totalChunks: 1,
        label: 'กำลังดึงรายการที่เพิ่ม/แก้ไขล่าสุดใน Kontent OS (Delta)...',
      });

      const { data: deltaData, error: deltaErr } = await client
        .from('contents')
        .select(DEDUP_SELECT_COLUMNS)
        .or(`created_at.gte.${watermarkIso},updated_at.gte.${watermarkIso}`)
        .order('created_at', { ascending: false })
        .limit(1000);

      if (!deltaErr && Array.isArray(deltaData)) {
        deltaData.forEach((rec) => {
          if (rec && rec.id) mergedMap.set(rec.id, rec);
        });
      } else {
        const { data: fallbackDelta, error: fbErr } = await client
          .from('contents')
          .select(DEDUP_SELECT_COLUMNS)
          .gte('created_at', watermarkIso)
          .order('created_at', { ascending: false })
          .limit(1000);

        if (!fbErr && Array.isArray(fallbackDelta)) {
          fallbackDelta.forEach((rec) => {
            if (rec && rec.id) mergedMap.set(rec.id, rec);
          });
        }
      }
    } else {
      const { data: recentData, error: recentErr } = await client
        .from('contents')
        .select(DEDUP_SELECT_COLUMNS)
        .order('created_at', { ascending: false })
        .limit(1000);

      if (!recentErr && Array.isArray(recentData)) {
        recentData.forEach((rec) => {
          if (rec && rec.id) mergedMap.set(rec.id, rec);
        });
      }
    }

    return {
      records: Array.from(mergedMap.values()),
      checkedEpisodesCount: unstampedEpisodes.length,
      usedDeltaFilter: hasValidSince,
    };
  } catch (err) {
    console.error('Failed during smart delta deduplication check:', err);
    return {
      records: Array.from(mergedMap.values()),
      checkedEpisodesCount: unstampedEpisodes.length,
      usedDeltaFilter: hasValidSince,
    };
  }
}

/**
 * Full Re-Verify Dedup Check:
 * - Scans ALL episodes (both stamped & unstamped) against Supabase
 * - Verifies whether stamped `recordId`s still exist in Supabase `contents`
 */
export async function executeFullVerifyContentsCheck(
  client: SupabaseClient | null,
  episodes: Episode[],
  onProgress?: (info: {
    completedChunks: number;
    totalChunks: number;
    label: string;
  }) => void
): Promise<FullVerifyDedupResult> {
  const verifiedStampedIds = new Set<string>();
  if (!client || episodes.length === 0) {
    return { records: [], verifiedStampedIds, verificationSucceeded: false };
  }

  const mergedMap = new Map<string, any>();
  let verificationSucceeded = true;

  try {
    await queryBatchedEpisodesFromSupabase(
      client,
      episodes,
      mergedMap,
      onProgress,
      'กำลังสแกนเทียบกับฐานข้อมูลทั้งหมด'
    );

    const { data: recentData, error: recentErr } = await client
      .from('contents')
      .select(DEDUP_SELECT_COLUMNS)
      .order('created_at', { ascending: false })
      .limit(1000);

    if (!recentErr && Array.isArray(recentData)) {
      recentData.forEach((rec) => {
        if (rec && rec.id) mergedMap.set(rec.id, rec);
      });
    } else if (recentErr) {
      verificationSucceeded = false;
    }

    const stampedIds = Array.from(
      new Set(
        episodes
          .map((ep) => ep.supabaseSyncInfo?.recordId?.trim())
          .filter((id): id is string => Boolean(id && isValidUUID(id)))
      )
    );

    if (stampedIds.length > 0) {
      const idChunks = chunkArray(stampedIds, TITLE_CHUNK_SIZE);
      await runWithConcurrency(idChunks, DEDUP_CONCURRENCY, async (chunk) => {
        const { data, error } = await client
          .from('contents')
          .select('id')
          .in('id', chunk);

        if (error) {
          verificationSucceeded = false;
          return;
        }
        if (Array.isArray(data)) {
          data.forEach((row) => {
            if (row && row.id) verifiedStampedIds.add(String(row.id));
          });
        }
      });
    }

    return {
      records: Array.from(mergedMap.values()),
      verifiedStampedIds,
      verificationSucceeded,
    };
  } catch (err) {
    console.error('Failed during full verify deduplication check:', err);
    return {
      records: Array.from(mergedMap.values()),
      verifiedStampedIds,
      verificationSucceeded: false,
    };
  }
}

export async function executeFetchRecentContents(
  client: SupabaseClient | null,
  _config: SupabaseConnectionConfig,
  channelId?: string
): Promise<any[]> {
  if (!client) return [];

  try {
    let query = client
      .from('contents')
      .select(DEDUP_SELECT_COLUMNS)
      .order('created_at', { ascending: false })
      .limit(1000);

    if (channelId && isValidUUID(channelId.trim())) {
      query = query.eq('channel_id', channelId.trim());
    }

    const { data, error } = await query;
    if (error) {
      console.warn('Error fetching existing contents from Supabase:', error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error('Failed to query existing contents:', err);
    return [];
  }
}
