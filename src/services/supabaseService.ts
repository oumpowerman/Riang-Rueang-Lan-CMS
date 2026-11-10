import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Episode } from '../types/episode.types';
import {
  SupabaseConnectionConfig,
  SupabaseRowDraftOverride,
  SupabaseSyncProgress,
  SupabaseSyncReport,
  SupabaseSyncReportItem,
  SupabaseSyncRowState,
} from '../types/supabaseSync.types';
import {
  formatEpRemark,
  isValidUUID,
  mapEpisodeToSupabasePayload,
} from '../utils/supabasePayloadMapper';
import { firestoreService } from '../firebase/firestoreService';

const STORAGE_KEY = 'riangrueanglan_supabase_config_v1';
const ROW_DRAFTS_STORAGE_KEY = 'riangrueanglan_supabase_row_drafts_v1';
const TITLE_CHUNK_SIZE = 150;
const BATCH_INSERT_SIZE = 50;
const UPDATE_CONCURRENCY = 5;

export const DEFAULT_SUPABASE_CONFIG: SupabaseConnectionConfig = {
  url: (import.meta.env.VITE_SUPABASE_URL as string) || '',
  anonKey: (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || '',
  targetChannelId: '',
  channels: [
    {
      id: '',
      name: 'เรียงเรื่องลั่น (ช่องหลัก)',
      isDefault: true,
    },
  ],
  defaultStatus: '01_IDEA/DRAFT_💡',
  defaultTargetPlatforms: ['YOUTUBE', 'FACEBOOK', 'TIKTOK', 'INSTAGRAM'],
  defaultIncludeAssets: true,
  defaultIncludePillar: false,
  defaultIncludeCategory: false,
  defaultDescriptionMode: 'AUTO',
};

/**
 * Splits an array into chunks of a specified size
 */
function chunkArray<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

/**
 * Normalizes a partial or raw Supabase config object
 */
export function normalizeSupabaseConfig(
  parsed: Partial<SupabaseConnectionConfig> | null | undefined
): SupabaseConnectionConfig {
  if (!parsed) return DEFAULT_SUPABASE_CONFIG;

  const status =
    parsed.defaultStatus === 'TODO' || !parsed.defaultStatus
      ? '01_IDEA/DRAFT_💡'
      : parsed.defaultStatus;

  let platforms = parsed.defaultTargetPlatforms;
  if (
    !Array.isArray(platforms) ||
    platforms.length === 0 ||
    platforms.includes('YOUTUBE_SHORTS') ||
    platforms.includes('FACEBOOK_REELS')
  ) {
    platforms = ['YOUTUBE', 'FACEBOOK', 'TIKTOK', 'INSTAGRAM'];
  }

  return {
    ...DEFAULT_SUPABASE_CONFIG,
    ...parsed,
    defaultStatus: status,
    defaultTargetPlatforms: platforms,
    defaultIncludePillar: Boolean(parsed.defaultIncludePillar),
    defaultIncludeCategory: Boolean(parsed.defaultIncludeCategory),
    channels:
      Array.isArray(parsed.channels) && parsed.channels.length > 0
        ? parsed.channels
        : DEFAULT_SUPABASE_CONFIG.channels,
  };
}

/**
 * Loads Supabase configuration from localStorage with env fallback
 */
export function loadSupabaseConfig(): SupabaseConnectionConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return normalizeSupabaseConfig(parsed);
    }
  } catch (err) {
    console.warn('Failed to parse Supabase config from localStorage:', err);
  }
  return DEFAULT_SUPABASE_CONFIG;
}

/**
 * Persists Supabase configuration to localStorage and (by default) Cloud Firestore
 */
export function saveSupabaseConfig(
  config: SupabaseConnectionConfig,
  syncToCloud = true
): void {
  const normalized = normalizeSupabaseConfig(config);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  } catch (err) {
    console.error('Failed to save Supabase config to localStorage:', err);
  }

  if (syncToCloud) {
    void firestoreService.saveSupabaseConfigToCloud(normalized);
  }
}

/**
 * Loads per-row draft overrides from localStorage
 */
export function loadSupabaseRowDrafts(): Record<string, SupabaseRowDraftOverride> {
  try {
    const raw = localStorage.getItem(ROW_DRAFTS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return parsed as Record<string, SupabaseRowDraftOverride>;
      }
    }
  } catch (err) {
    console.warn('Failed to parse Supabase row drafts from localStorage:', err);
  }
  return {};
}

/**
 * Saves per-row draft overrides to localStorage and optionally to Cloud Firestore
 */
export function saveSupabaseRowDrafts(
  overrides: Record<string, SupabaseRowDraftOverride>,
  syncToCloud = true
): void {
  try {
    localStorage.setItem(ROW_DRAFTS_STORAGE_KEY, JSON.stringify(overrides));
  } catch (err) {
    console.error('Failed to save Supabase row drafts to localStorage:', err);
  }

  if (syncToCloud) {
    void firestoreService.saveSupabaseRowDraftsToCloud(overrides);
  }
}

/**
 * Clears all saved per-row draft overrides in localStorage and Cloud Firestore
 */
export function clearSupabaseRowDrafts(syncToCloud = true): void {
  try {
    localStorage.removeItem(ROW_DRAFTS_STORAGE_KEY);
  } catch (err) {
    console.error('Failed to clear Supabase row drafts from localStorage:', err);
  }

  if (syncToCloud) {
    void firestoreService.saveSupabaseRowDraftsToCloud({});
  }
}

/**
 * Extracts only the fields that differ from the default row state so the Cloud payload stays compact
 */
export function extractRowDraftOverride(
  row: SupabaseSyncRowState,
  config: SupabaseConnectionConfig
): SupabaseRowDraftOverride | null {
  const defaultIsSelected = row.matchStatus !== 'DUPLICATE';
  const defaultChannelId = config.targetChannelId || '';
  const defaultStatus = config.defaultStatus || '01_IDEA/DRAFT_💡';
  const defaultPlatforms =
    config.defaultTargetPlatforms && config.defaultTargetPlatforms.length > 0
      ? config.defaultTargetPlatforms
      : ['YOUTUBE', 'FACEBOOK', 'TIKTOK', 'INSTAGRAM'];
  const defaultIncludeAssets = config.defaultIncludeAssets;
  const defaultIncludePillar = Boolean(config.defaultIncludePillar);
  const defaultIncludeCategory = Boolean(config.defaultIncludeCategory);

  const platformsChanged =
    row.targetPlatforms.length !== defaultPlatforms.length ||
    row.targetPlatforms.some((p) => !defaultPlatforms.includes(p));

  const hasDiff =
    row.isSelected !== defaultIsSelected ||
    row.channelId !== defaultChannelId ||
    row.status !== defaultStatus ||
    platformsChanged ||
    row.includeAssets !== defaultIncludeAssets ||
    row.includePillar !== defaultIncludePillar ||
    row.includeCategory !== defaultIncludeCategory ||
    Boolean(row.description.trim()) ||
    row.upsertMode !== 'SKIP';

  if (!hasDiff) return null;

  return {
    isSelected: row.isSelected,
    channelId: row.channelId,
    status: row.status,
    targetPlatforms: row.targetPlatforms,
    includeAssets: row.includeAssets,
    includePillar: row.includePillar,
    includeCategory: row.includeCategory,
    description: row.description,
    upsertMode: row.upsertMode,
  };
}

/**
 * Instantiates a typed Supabase client
 */
export function createSupabaseClient(
  config: SupabaseConnectionConfig
): SupabaseClient | null {
  if (!config.url || !config.anonKey) {
    return null;
  }
  try {
    return createClient(config.url.trim(), config.anonKey.trim(), {
      auth: {
        persistSession: false,
      },
    });
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    return null;
  }
}

/**
 * Tests connection to Supabase and verifies access to `contents` and `channels`
 */
export async function testSupabaseConnection(
  config: SupabaseConnectionConfig
): Promise<{
  success: boolean;
  message: string;
  detectedChannels?: Array<{ id: string; name: string }>;
}> {
  const client = createSupabaseClient(config);
  if (!client) {
    return {
      success: false,
      message: 'กรุณากรอก Supabase URL และ Key ให้ครบถ้วน',
    };
  }

  try {
    // 1. Test query on `contents` table
    const { error: contentsErr } = await client
      .from('contents')
      .select('id')
      .limit(1);

    if (contentsErr) {
      return {
        success: false,
        message: `เชื่อมต่อไม่สำเร็จกับตาราง contents: ${contentsErr.message}`,
      };
    }

    // 2. Try to fetch available channels from `channels` table (if accessible)
    let detectedChannels: Array<{ id: string; name: string }> | undefined;
    try {
      const { data: channelsData, error: channelsErr } = await client
        .from('channels')
        .select('id, name')
        .limit(50);

      if (!channelsErr && Array.isArray(channelsData) && channelsData.length > 0) {
        detectedChannels = channelsData.map((c: any) => ({
          id: String(c.id),
          name: String(c.name || c.title || c.id),
        }));
      }
    } catch {
      // Channels query is optional if RLS prevents reading channels
    }

    return {
      success: true,
      message: 'เชื่อมต่อกับฐานข้อมูล Supabase สำเร็จ พร้อมเข้าถึงตาราง contents',
      detectedChannels,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `เกิดข้อผิดพลาดในการเชื่อมต่อ: ${err.message || String(err)}`,
    };
  }
}

/**
 * Enterprise-grade Chunked Batch Deduplication Check
 * Scales to 10,000+ or 100,000+ records in Supabase by querying `.in('title', chunk)`
 * and `.in('remark', remarkChunk)` in batches of 150 items rather than relying on `.limit(1000)`.
 */
export async function fetchExistingContentsForEpisodes(
  config: SupabaseConnectionConfig,
  episodes: Episode[],
  channelId?: string,
  onProgress?: (info: { completedChunks: number; totalChunks: number; label: string }) => void
): Promise<any[]> {
  const client = createSupabaseClient(config);
  if (!client || episodes.length === 0) return [];

  const validChannelId =
    channelId && isValidUUID(channelId.trim()) ? channelId.trim() : null;

  const mergedMap = new Map<string, any>();

  // Extract unique titles and expected EP_REF remarks from local episodes
  const uniqueTitles = Array.from(
    new Set(
      episodes
        .map((ep) => ep.title?.trim())
        .filter((t): t is string => Boolean(t))
    )
  );

  const uniqueRemarks = Array.from(
    new Set(
      episodes
        .map((ep) => (ep.id ? formatEpRemark(ep.id) : null))
        .filter((r): r is string => Boolean(r))
    )
  );

  const titleChunks = chunkArray(uniqueTitles, TITLE_CHUNK_SIZE);
  const remarkChunks = chunkArray(uniqueRemarks, TITLE_CHUNK_SIZE);
  const totalChunks = Math.max(1, titleChunks.length + remarkChunks.length);
  let completedChunks = 0;

  try {
    // 1. Query by Title chunks (.in('title', chunk))
    for (let i = 0; i < titleChunks.length; i++) {
      const chunk = titleChunks[i];
      onProgress?.({
        completedChunks,
        totalChunks,
        label: `กำลังตรวจสอบชื่อคลิปแบบ Batch (${i + 1}/${titleChunks.length})...`,
      });

      let query = client
        .from('contents')
        .select('id, title, status, published_links, created_at, tags, channel_id, remark')
        .in('title', chunk);

      if (validChannelId) {
        query = query.eq('channel_id', validChannelId);
      }

      const { data, error } = await query;
      if (!error && Array.isArray(data)) {
        data.forEach((rec) => {
          if (rec && rec.id) mergedMap.set(rec.id, rec);
        });
      }

      completedChunks++;
    }

    // 2. Query by immutable EP Reference tag in remark (.in('remark', chunk))
    // This catches episodes even if their title was renamed after being exported
    for (let i = 0; i < remarkChunks.length; i++) {
      const chunk = remarkChunks[i];
      onProgress?.({
        completedChunks,
        totalChunks,
        label: `กำลังตรวจสอบรหัสอ้างอิง EP (${i + 1}/${remarkChunks.length})...`,
      });

      let query = client
        .from('contents')
        .select('id, title, status, published_links, created_at, tags, channel_id, remark')
        .in('remark', chunk);

      if (validChannelId) {
        query = query.eq('channel_id', validChannelId);
      }

      const { data, error } = await query;
      if (!error && Array.isArray(data)) {
        data.forEach((rec) => {
          if (rec && rec.id) mergedMap.set(rec.id, rec);
        });
      }

      completedChunks++;
    }

    // 3. Lightweight recent records fetch (up to 1,000) to support published_links URL matching
    // and case-insensitive title variations
    let recentQuery = client
      .from('contents')
      .select('id, title, status, published_links, created_at, tags, channel_id, remark')
      .order('created_at', { ascending: false })
      .limit(1000);

    if (validChannelId) {
      recentQuery = recentQuery.eq('channel_id', validChannelId);
    }

    const { data: recentData, error: recentErr } = await recentQuery;
    if (!recentErr && Array.isArray(recentData)) {
      recentData.forEach((rec) => {
        if (rec && rec.id) mergedMap.set(rec.id, rec);
      });
    }

    return Array.from(mergedMap.values());
  } catch (err) {
    console.error('Failed during chunked deduplication check:', err);
    return Array.from(mergedMap.values());
  }
}

/**
 * Legacy helper for fetching recent contents
 */
export async function fetchExistingContents(
  config: SupabaseConnectionConfig,
  channelId?: string
): Promise<any[]> {
  const client = createSupabaseClient(config);
  if (!client) return [];

  try {
    let query = client
      .from('contents')
      .select('id, title, status, published_links, created_at, tags, channel_id, remark')
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

/**
 * Executes high-speed enterprise batch synchronization to Supabase
 * - Groups NEW records into chunks of 50 for fast `.insert(batch)` execution
 * - Automatically falls back to row-by-row insert if a batch encounters a database constraint error
 * - Processes DUPLICATE (UPDATE) records in concurrent batches
 */
export async function batchSyncToSupabase(
  config: SupabaseConnectionConfig,
  rows: SupabaseSyncRowState[],
  onProgress?: (progress: SupabaseSyncProgress) => void
): Promise<SupabaseSyncReport> {
  const client = createSupabaseClient(config);
  if (!client) {
    throw new Error('Supabase client is not configured.');
  }

  const selectedRows = rows.filter((r) => r.isSelected);
  const total = selectedRows.length;
  const reportItems: SupabaseSyncReportItem[] = [];

  let insertedCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;
  let failedCount = 0;
  let completedItems = 0;

  const newRows = selectedRows.filter((r) => r.matchStatus === 'NEW');
  const duplicateSkipRows = selectedRows.filter(
    (r) => r.matchStatus === 'DUPLICATE' && r.upsertMode === 'SKIP'
  );
  const duplicateUpdateRows = selectedRows.filter(
    (r) => r.matchStatus === 'DUPLICATE' && r.upsertMode === 'UPDATE'
  );

  onProgress?.({
    phase: 'SYNCING',
    phaseLabel: `กำลังเตรียมส่งข้อมูลแบบ Batch สู่ตาราง public.contents (${total} รายการ)...`,
    completedItems: 0,
    totalItems: total,
    percent: 0,
  });

  // 1. Handle skipped duplicate rows immediately
  for (const skipRow of duplicateSkipRows) {
    skippedCount++;
    completedItems++;
    reportItems.push({
      id: skipRow.existingRecordId,
      title: skipRow.episode.title,
      action: 'SKIPPED',
    });
  }

  // 2. High-Speed Chunked Batch Insert for NEW rows
  if (newRows.length > 0) {
    const insertChunks = chunkArray(newRows, BATCH_INSERT_SIZE);

    for (let cIdx = 0; cIdx < insertChunks.length; cIdx++) {
      const chunk = insertChunks[cIdx];
      const payloads = chunk.map((row) => mapEpisodeToSupabasePayload(row, config));

      onProgress?.({
        phase: 'SYNCING',
        phaseLabel: `กำลังส่งข้อมูลใหม่แบบ Batch ชุดที่ ${cIdx + 1}/${insertChunks.length} (${chunk.length} รายการ)...`,
        completedItems,
        totalItems: total,
        percent: total > 0 ? Math.round((completedItems / total) * 100) : 0,
        currentTitle: `${chunk[0].episode.title}${
          chunk.length > 1 ? ` และอีก ${chunk.length - 1} รายการ` : ''
        }`,
      });

      try {
        const { data: insertedData, error: batchInsertErr } = await client
          .from('contents')
          .insert(payloads)
          .select('id, title');

        if (!batchInsertErr && Array.isArray(insertedData)) {
          // Entire batch succeeded in 1 round-trip!
          chunk.forEach((row, idx) => {
            insertedCount++;
            completedItems++;
            reportItems.push({
              id: insertedData[idx]?.id,
              title: row.episode.title,
              action: 'INSERTED',
            });
          });
        } else {
          // Auto-Fallback: Retry this chunk row-by-row so valid rows still succeed
          for (let rIdx = 0; rIdx < chunk.length; rIdx++) {
            const singleRow = chunk[rIdx];
            const singlePayload = payloads[rIdx];
            try {
              const { data: singleData, error: singleErr } = await client
                .from('contents')
                .insert(singlePayload)
                .select('id')
                .single();

              if (singleErr) {
                failedCount++;
                reportItems.push({
                  title: singleRow.episode.title,
                  action: 'FAILED',
                  error: singleErr.message,
                });
              } else {
                insertedCount++;
                reportItems.push({
                  id: singleData?.id,
                  title: singleRow.episode.title,
                  action: 'INSERTED',
                });
              }
            } catch (rowErr: any) {
              failedCount++;
              reportItems.push({
                title: singleRow.episode.title,
                action: 'FAILED',
                error: rowErr.message || 'Insert failed',
              });
            }
            completedItems++;
          }
        }
      } catch (chunkErr: any) {
        // Network error on chunk
        chunk.forEach((row) => {
          failedCount++;
          completedItems++;
          reportItems.push({
            title: row.episode.title,
            action: 'FAILED',
            error: chunkErr.message || 'Network batch error',
          });
        });
      }

      // Brief yield for smooth UI progress bar animation
      await new Promise((resolve) => setTimeout(resolve, 40));
    }
  }

  // 3. Concurrent Batched Updates for DUPLICATE rows set to UPDATE
  if (duplicateUpdateRows.length > 0) {
    const updateChunks = chunkArray(duplicateUpdateRows, UPDATE_CONCURRENCY);

    for (let uIdx = 0; uIdx < updateChunks.length; uIdx++) {
      const chunk = updateChunks[uIdx];

      onProgress?.({
        phase: 'SYNCING',
        phaseLabel: `กำลังอัปเดตข้อมูลเดิม ชุดที่ ${uIdx + 1}/${updateChunks.length}...`,
        completedItems,
        totalItems: total,
        percent: total > 0 ? Math.round((completedItems / total) * 100) : 0,
        currentTitle: chunk[0].episode.title,
      });

      await Promise.all(
        chunk.map(async (row) => {
          if (!row.existingRecordId) {
            skippedCount++;
            completedItems++;
            reportItems.push({
              title: row.episode.title,
              action: 'SKIPPED',
            });
            return;
          }

          const payload = mapEpisodeToSupabasePayload(row, config);

          try {
            const { error: updateErr } = await client
              .from('contents')
              .update({
                title: payload.title,
                status: payload.status,
                category: payload.category,
                pillar: payload.pillar,
                tags: payload.tags,
                target_platform: payload.target_platform,
                published_links: payload.published_links,
                assets: payload.assets,
                remark: payload.remark,
                updated_at: new Date().toISOString(),
                ...(payload.description !== null
                  ? { description: payload.description }
                  : {}),
                ...(payload.channel_id ? { channel_id: payload.channel_id } : {}),
              })
              .eq('id', row.existingRecordId);

            if (updateErr) {
              failedCount++;
              reportItems.push({
                id: row.existingRecordId,
                title: row.episode.title,
                action: 'FAILED',
                error: updateErr.message,
              });
            } else {
              updatedCount++;
              reportItems.push({
                id: row.existingRecordId,
                title: row.episode.title,
                action: 'UPDATED',
              });
            }
          } catch (err: any) {
            failedCount++;
            reportItems.push({
              id: row.existingRecordId,
              title: row.episode.title,
              action: 'FAILED',
              error: err.message || 'Update network error',
            });
          } finally {
            completedItems++;
          }
        })
      );
    }
  }

  onProgress?.({
    phase: 'DONE',
    phaseLabel: 'ซิงก์ข้อมูลแบบ Batch เสร็จสมบูรณ์!',
    completedItems: total,
    totalItems: total,
    percent: 100,
  });

  return {
    totalProcessed: total,
    insertedCount,
    updatedCount,
    skippedCount,
    failedCount,
    items: reportItems,
    timestamp: Date.now(),
    channelId: config.targetChannelId,
  };
}
