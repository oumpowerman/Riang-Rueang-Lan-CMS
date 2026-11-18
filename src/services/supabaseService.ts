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
  isValidUUID,
  mapEpisodeToSupabasePayload,
  SupabasePayloadMapperContext,
} from '../utils/supabasePayloadMapper';
import { firestoreService } from '../firebase/firestoreService';
import {
  idbStorageService,
  safeLocalStorageRemove,
  safeLocalStorageSet,
} from './idbStorageService';
import {
  executeFetchRecentContents,
  executeFullVerifyContentsCheck,
  executeSmartDeltaContentsCheck,
  FullVerifyDedupResult,
  SmartDeltaDedupResult,
} from './supabaseDedupService';
import {
  notifySupabaseSyncEnd,
  notifySupabaseSyncStart,
  verifySupabaseLiveHealth,
} from './supabaseStatusMonitor';

export type { FullVerifyDedupResult, SmartDeltaDedupResult };

const STORAGE_KEY = 'riangrueanglan_supabase_config_v1';
const ROW_DRAFTS_STORAGE_KEY = 'riangrueanglan_supabase_row_drafts_v1';
const ROW_DRAFTS_IDB_KEY = 'supabase_row_drafts_v1';
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
  autoCheckOnModalOpen: false,
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
    autoCheckOnModalOpen: Boolean(parsed.autoCheckOnModalOpen),
    lastDedupCheckedAt:
      typeof parsed.lastDedupCheckedAt === 'string' && parsed.lastDedupCheckedAt
        ? parsed.lastDedupCheckedAt
        : undefined,
    lastExportSyncedAt:
      typeof parsed.lastExportSyncedAt === 'string' && parsed.lastExportSyncedAt
        ? parsed.lastExportSyncedAt
        : undefined,
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
  safeLocalStorageSet(STORAGE_KEY, JSON.stringify(normalized));
  void verifySupabaseLiveHealth();

  if (syncToCloud) {
    void firestoreService.saveSupabaseConfigToCloud(normalized);
  }
}

/**
 * Loads per-row draft overrides synchronously from localStorage (fast initial hydration)
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
 * Loads per-row draft overrides asynchronously from IndexedDB (scales to 10,000+ rows without 5MB localStorage limit),
 * falling back to localStorage if IndexedDB is empty.
 */
export async function loadSupabaseRowDraftsAsync(): Promise<
  Record<string, SupabaseRowDraftOverride>
> {
  try {
    const idbDrafts = await idbStorageService.getMeta<
      Record<string, SupabaseRowDraftOverride>
    >(ROW_DRAFTS_IDB_KEY);
    if (idbDrafts && typeof idbDrafts === 'object' && Object.keys(idbDrafts).length > 0) {
      return idbDrafts;
    }
  } catch (err) {
    console.warn('Failed to load Supabase row drafts from IndexedDB:', err);
  }
  return loadSupabaseRowDrafts();
}

/**
 * Saves per-row draft overrides safely to IndexedDB + localStorage and optionally to Cloud Firestore
 */
export function saveSupabaseRowDrafts(
  overrides: Record<string, SupabaseRowDraftOverride>,
  syncToCloud = true
): void {
  const serialized = JSON.stringify(overrides);
  // Write to safe localStorage only when under ~2 MB to avoid crowding other settings keys
  if (serialized.length <= 2 * 1024 * 1024) {
    safeLocalStorageSet(ROW_DRAFTS_STORAGE_KEY, serialized);
  } else {
    safeLocalStorageRemove(ROW_DRAFTS_STORAGE_KEY);
  }
  void idbStorageService.setMeta(ROW_DRAFTS_IDB_KEY, overrides);

  if (syncToCloud) {
    void firestoreService.saveSupabaseRowDraftsToCloud(overrides);
  }
}

/**
 * Clears all saved per-row draft overrides in localStorage, IndexedDB, and Cloud Firestore
 */
export function clearSupabaseRowDrafts(syncToCloud = true): void {
  safeLocalStorageRemove(ROW_DRAFTS_STORAGE_KEY);
  void idbStorageService.setMeta(ROW_DRAFTS_IDB_KEY, {});

  if (syncToCloud) {
    void firestoreService.saveSupabaseRowDraftsToCloud({});
  }
}

/**
 * Extracts ONLY the fields that actually differ from the default row state
 * so per-row overrides stay ~10x smaller for Cloud 1 MB budget & 10,000+ scale.
 */
export function extractRowDraftOverride(
  row: SupabaseSyncRowState,
  config: SupabaseConnectionConfig
): SupabaseRowDraftOverride | null {
  const defaultIsSelected = row.matchStatus === 'NEW';
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

  const override: SupabaseRowDraftOverride = {};
  let hasDiff = false;

  if (row.isSelected !== defaultIsSelected) {
    override.isSelected = row.isSelected;
    hasDiff = true;
  }
  if (row.channelId !== defaultChannelId) {
    override.channelId = row.channelId;
    hasDiff = true;
  }
  if (row.status !== defaultStatus) {
    override.status = row.status;
    hasDiff = true;
  }
  if (platformsChanged) {
    override.targetPlatforms = row.targetPlatforms;
    hasDiff = true;
  }
  if (row.includeAssets !== defaultIncludeAssets) {
    override.includeAssets = row.includeAssets;
    hasDiff = true;
  }
  if (row.includePillar !== defaultIncludePillar) {
    override.includePillar = row.includePillar;
    hasDiff = true;
  }
  if (row.includeCategory !== defaultIncludeCategory) {
    override.includeCategory = row.includeCategory;
    hasDiff = true;
  }
  if (row.description && row.description.trim()) {
    override.description = row.description;
    hasDiff = true;
  }
  if (row.upsertMode !== 'SKIP') {
    override.upsertMode = row.upsertMode;
    hasDiff = true;
  }

  return hasDiff ? override : null;
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

  notifySupabaseSyncStart('กำลังทดสอบการเชื่อมต่อ Kontent OS...');
  try {
    // 1. Test query on `contents` table
    const { error: contentsErr } = await client
      .from('contents')
      .select('id')
      .limit(1);

    if (contentsErr) {
      const msg = `เชื่อมต่อไม่สำเร็จกับตาราง contents: ${contentsErr.message}`;
      notifySupabaseSyncEnd(false, msg);
      return {
        success: false,
        message: msg,
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

    const okMsg =
      'เชื่อมต่อกับฐานข้อมูล Supabase สำเร็จ พร้อมเข้าถึงตาราง contents';
    notifySupabaseSyncEnd(true, okMsg);
    return {
      success: true,
      message: okMsg,
      detectedChannels,
    };
  } catch (err: any) {
    const errMsg = `เกิดข้อผิดพลาดในการเชื่อมต่อ: ${err.message || String(err)}`;
    notifySupabaseSyncEnd(false, errMsg);
    return {
      success: false,
      message: errMsg,
    };
  }
}

/**
 * Smart Incremental + Delta Sync Dedup Check (delegated to supabaseDedupService)
 */
export async function fetchSmartDeltaContentsForEpisodes(
  config: SupabaseConnectionConfig,
  episodes: Episode[],
  sinceIso?: string,
  onProgress?: (info: {
    completedChunks: number;
    totalChunks: number;
    label: string;
  }) => void
): Promise<SmartDeltaDedupResult> {
  notifySupabaseSyncStart('กำลังเช็คคลิปใหม่และดึงข้อมูล Delta...');
  try {
    const res = await executeSmartDeltaContentsCheck(
      createSupabaseClient(config),
      episodes,
      sinceIso,
      onProgress
    );
    notifySupabaseSyncEnd(true, 'เช็คคลิปใหม่และซิงก์ข้อมูลล่าสุดเรียบร้อย');
    return res;
  } catch (err: any) {
    notifySupabaseSyncEnd(false, err?.message);
    throw err;
  }
}

/**
 * Full Re-Verify Dedup Check (delegated to supabaseDedupService)
 */
export async function fetchFullVerifyContentsForEpisodes(
  config: SupabaseConnectionConfig,
  episodes: Episode[],
  onProgress?: (info: {
    completedChunks: number;
    totalChunks: number;
    label: string;
  }) => void
): Promise<FullVerifyDedupResult> {
  notifySupabaseSyncStart('กำลังสแกนทวนสอบข้อมูลทั้งฐานข้อมูล...');
  try {
    const res = await executeFullVerifyContentsCheck(
      createSupabaseClient(config),
      episodes,
      onProgress
    );
    notifySupabaseSyncEnd(
      res.verificationSucceeded,
      res.verificationSucceeded
        ? 'ทวนสอบฐานข้อมูล Kontent OS เรียบร้อย'
        : 'การเชื่อมต่อขัดข้องบางส่วนขณะทวนสอบ'
    );
    return res;
  } catch (err: any) {
    notifySupabaseSyncEnd(false, err?.message);
    throw err;
  }
}

/**
 * Legacy-compatible full fetch wrapper
 */
export async function fetchExistingContentsForEpisodes(
  config: SupabaseConnectionConfig,
  episodes: Episode[],
  _channelId?: string,
  onProgress?: (info: {
    completedChunks: number;
    totalChunks: number;
    label: string;
  }) => void
): Promise<any[]> {
  const res = await fetchFullVerifyContentsForEpisodes(
    config,
    episodes,
    onProgress
  );
  return res.records;
}

/**
 * Legacy helper for fetching recent contents
 */
export async function fetchExistingContents(
  config: SupabaseConnectionConfig,
  channelId?: string
): Promise<any[]> {
  return executeFetchRecentContents(
    createSupabaseClient(config),
    config,
    channelId
  );
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
  onProgress?: (progress: SupabaseSyncProgress) => void,
  mapperContext?: SupabasePayloadMapperContext
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
    (r) =>
      (r.matchStatus === 'DUPLICATE' || r.matchStatus === 'SENT') &&
      r.upsertMode === 'SKIP'
  );
  const duplicateUpdateRows = selectedRows.filter(
    (r) =>
      (r.matchStatus === 'DUPLICATE' || r.matchStatus === 'SENT') &&
      r.upsertMode === 'UPDATE'
  );

  notifySupabaseSyncStart(
    `กำลังส่งออกข้อมูลสู่ Kontent OS (${total} รายการ)...`
  );
  onProgress?.({
    phase: 'SYNCING',
    phaseLabel: `กำลังเตรียมส่งข้อมูลแบบ Batch สู่ Kontent OS (${total} รายการ)...`,
    completedItems: 0,
    totalItems: total,
    percent: 0,
  });

  // 1. Handle skipped duplicate/sent rows immediately
  for (const skipRow of duplicateSkipRows) {
    skippedCount++;
    completedItems++;
    reportItems.push({
      id: skipRow.existingRecordId,
      episodeId: skipRow.episode.id,
      title: skipRow.episode.title,
      action: 'SKIPPED',
    });
  }

  // 2. High-Speed Chunked Batch Insert for NEW rows
  if (newRows.length > 0) {
    const insertChunks = chunkArray(newRows, BATCH_INSERT_SIZE);

    for (let cIdx = 0; cIdx < insertChunks.length; cIdx++) {
      const chunk = insertChunks[cIdx];
      const payloads = chunk.map((row) =>
        mapEpisodeToSupabasePayload(row, config, mapperContext)
      );

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
              episodeId: row.episode.id,
              channelId: payloads[idx]?.channel_id || row.channelId || '',
              status: payloads[idx]?.status || row.status,
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
                  episodeId: singleRow.episode.id,
                  title: singleRow.episode.title,
                  action: 'FAILED',
                  error: singleErr.message,
                });
              } else {
                insertedCount++;
                reportItems.push({
                  id: singleData?.id,
                  episodeId: singleRow.episode.id,
                  channelId: singlePayload.channel_id || singleRow.channelId || '',
                  status: singlePayload.status || singleRow.status,
                  title: singleRow.episode.title,
                  action: 'INSERTED',
                });
              }
            } catch (rowErr: any) {
              failedCount++;
              reportItems.push({
                episodeId: singleRow.episode.id,
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
            episodeId: row.episode.id,
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

  // 3. Concurrent Batched Updates for DUPLICATE/SENT rows set to UPDATE
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
              episodeId: row.episode.id,
              title: row.episode.title,
              action: 'SKIPPED',
            });
            return;
          }

          const payload = mapEpisodeToSupabasePayload(
            row,
            config,
            mapperContext
          );

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
                episodeId: row.episode.id,
                title: row.episode.title,
                action: 'FAILED',
                error: updateErr.message,
              });
            } else {
              updatedCount++;
              reportItems.push({
                id: row.existingRecordId,
                episodeId: row.episode.id,
                channelId: payload.channel_id || row.channelId || '',
                status: payload.status || row.status,
                title: row.episode.title,
                action: 'UPDATED',
              });
            }
          } catch (err: any) {
            failedCount++;
            reportItems.push({
              id: row.existingRecordId,
              episodeId: row.episode.id,
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

  notifySupabaseSyncEnd(
    failedCount === 0 || insertedCount + updatedCount > 0,
    failedCount === 0
      ? `ส่งออกสำเร็จ (${insertedCount + updatedCount} รายการ)`
      : `ส่งออกเสร็จสิ้น (พบข้อผิดพลาด ${failedCount} รายการ)`
  );

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
