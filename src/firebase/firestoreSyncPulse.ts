import { doc, getDoc, runTransaction, setDoc } from 'firebase/firestore';
import { db } from './config';
import {
  isBatchWriteInProgress,
  onBatchWriteComplete,
  sanitizeForFirestore,
} from './firestoreBatchUtils';
import { isQuotaExhaustedError, markFirestoreQuotaExhausted } from './firestoreErrorHandling';

export type SyncCollectionKey =
  | 'footages'
  | 'episodes'
  | 'sources'
  | 'categories'
  | 'category_groups';

export interface DeletedTombstoneRecord {
  id: string;
  col: SyncCollectionKey;
  deletedAt: string;
}

export interface SyncPulseMetadata {
  lastMutationAt?: string;
  lastMutationBy?: string;
  lastMutationType?: string;
  collectionVersions?: Partial<Record<SyncCollectionKey, string>>;
  recentDeletes?: DeletedTombstoneRecord[];
  clipsWipedAt?: string;
  categoriesWipedAt?: string;
}

export interface SyncPulseEmitPayload {
  /** Collections that had upserts/modifications (triggers delta query on peer clients) */
  upsertedCollections?: SyncCollectionKey[];
  /** Specific deleted records (propagated to peers via tombstones with 0 extra reads) */
  deletedItems?: Array<{ id: string; col: SyncCollectionKey }>;
  /** Human-readable mutation tag for diagnostics */
  mutationType: string;
  /** Set when full clip wipe occurred */
  clipsWiped?: boolean;
  /** Set when full category wipe occurred */
  categoriesWiped?: boolean;
}

/**
 * 60-second safety margin subtracted from localSyncTs before running delta queries
 * so slight clock skew between two devices never causes missed updates.
 */
export const CLOCK_SKEW_BUFFER_MS = 60_000;

/** Rolling tombstone retention policy to keep the signal document lightweight (<25 KB) */
const MAX_RECENT_DELETES = 400;
const TOMBSTONE_TTL_MS = 14 * 24 * 60 * 60 * 1000; // 14 days
const PULSE_COALESCE_MS = 250;

/** Unique per-tab client identifier to prevent self-triggered delta reads */
export const CLIENT_INSTANCE_ID: string =
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? `tab_${crypto.randomUUID().slice(0, 12)}`
    : `tab_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

// In-memory rolling cache of tombstones received from live archive_summary_stats snapshot
let cachedRecentDeletes: DeletedTombstoneRecord[] = [];
let onPulseEmittedCallback: ((mutationIso: string) => void) | null = null;

// Coalescing queue for rapid back-to-back writes
const pendingUpsertCols = new Set<SyncCollectionKey>();
const pendingDeletes: DeletedTombstoneRecord[] = [];
let pendingMutationTypes: string[] = [];
let pendingClipsWiped = false;
let pendingCategoriesWiped = false;
let coalesceTimer: ReturnType<typeof setTimeout> | null = null;
let waitingForBatchUnlock = false;

export function registerOnPulseEmitted(cb: (mutationIso: string) => void): () => void {
  onPulseEmittedCallback = cb;
  return () => {
    if (onPulseEmittedCallback === cb) {
      onPulseEmittedCallback = null;
    }
  };
}

/**
 * Updates local tombstone cache whenever archive_summary_stats snapshot arrives.
 */
export function updateCachedSyncPulse(pulse?: SyncPulseMetadata | null): void {
  if (!pulse) return;
  if (Array.isArray(pulse.recentDeletes)) {
    cachedRecentDeletes = pulse.recentDeletes.filter(
      (item): item is DeletedTombstoneRecord =>
        Boolean(item && typeof item.id === 'string' && typeof item.col === 'string' && typeof item.deletedAt === 'string')
    );
  }
}

/**
 * Fetches the authoritative archive_summary_stats signal document once (1 Firestore read).
 * Used by manual Smart Delta Refresh so users always inspect fresh server metadata.
 */
export async function fetchArchiveSummaryStatsOnce<T extends SyncPulseMetadata>(): Promise<T | null> {
  try {
    const docRef = doc(db, 'system_settings', 'archive_summary_stats');
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    const data = snap.data() as T;
    updateCachedSyncPulse(data);
    return data;
  } catch (err) {
    if (isQuotaExhaustedError(err)) {
      markFirestoreQuotaExhausted(true);
    }
    throw err;
  }
}

/**
 * Subtracts CLOCK_SKEW_BUFFER_MS (60s) from an ISO timestamp for safe cross-device delta queries.
 */
export function subtractClockSkewBuffer(
  isoTimestamp: string,
  bufferMs: number = CLOCK_SKEW_BUFFER_MS
): string {
  const parsed = Date.parse(isoTimestamp);
  if (Number.isNaN(parsed)) {
    return isoTimestamp;
  }
  return new Date(Math.max(0, parsed - bufferMs)).toISOString();
}

/**
 * Prunes expired tombstones (>14 days) and keeps the latest MAX_RECENT_DELETES entries.
 */
function mergeAndPruneTombstones(
  existing: DeletedTombstoneRecord[],
  additions: DeletedTombstoneRecord[],
  nowMs: number
): DeletedTombstoneRecord[] {
  const cutoffMs = nowMs - TOMBSTONE_TTL_MS;
  const dedupeMap = new Map<string, DeletedTombstoneRecord>();

  const ingest = (entry: DeletedTombstoneRecord) => {
    const ts = Date.parse(entry.deletedAt);
    if (!Number.isNaN(ts) && ts < cutoffMs) return;
    const key = `${entry.col}::${entry.id}`;
    const prev = dedupeMap.get(key);
    if (!prev || entry.deletedAt > prev.deletedAt) {
      dedupeMap.set(key, entry);
    }
  };

  existing.forEach(ingest);
  additions.forEach(ingest);

  const merged = Array.from(dedupeMap.values());
  merged.sort((a, b) => (a.deletedAt > b.deletedAt ? 1 : a.deletedAt < b.deletedAt ? -1 : 0));

  if (merged.length > MAX_RECENT_DELETES) {
    return merged.slice(merged.length - MAX_RECENT_DELETES);
  }
  return merged;
}

/**
 * Extracts deleted IDs per collection whose deletedAt > bufferedSinceIso.
 */
export function extractDeletedIdsSince(
  recentDeletes: DeletedTombstoneRecord[] | undefined,
  bufferedSinceIso: string
): Record<SyncCollectionKey, Set<string>> {
  const result: Record<SyncCollectionKey, Set<string>> = {
    footages: new Set<string>(),
    episodes: new Set<string>(),
    sources: new Set<string>(),
    categories: new Set<string>(),
    category_groups: new Set<string>(),
  };

  if (!Array.isArray(recentDeletes) || recentDeletes.length === 0) {
    return result;
  }

  for (let i = 0; i < recentDeletes.length; i++) {
    const rec = recentDeletes[i];
    if (!rec || !rec.id || !rec.col || !rec.deletedAt) continue;
    if (rec.deletedAt > bufferedSinceIso && result[rec.col]) {
      result[rec.col].add(rec.id);
    }
  }

  return result;
}

async function flushPendingSyncPulse(): Promise<void> {
  if (coalesceTimer) {
    clearTimeout(coalesceTimer);
    coalesceTimer = null;
  }

  // Defer pulse until active multi-chunk batch lock completes so peers wake up once after all chunks commit
  if (isBatchWriteInProgress()) {
    if (!waitingForBatchUnlock) {
      waitingForBatchUnlock = true;
      const unsub = onBatchWriteComplete(() => {
        unsub();
        waitingForBatchUnlock = false;
        void flushPendingSyncPulse();
      });
    }
    return;
  }

  const hasUpserts = pendingUpsertCols.size > 0;
  const hasDeletes = pendingDeletes.length > 0;
  if (!hasUpserts && !hasDeletes && !pendingClipsWiped && !pendingCategoriesWiped) {
    return;
  }

  const upsertedCols = Array.from(pendingUpsertCols);
  const newDeletes = [...pendingDeletes];
  const mutationLabel = Array.from(new Set(pendingMutationTypes)).slice(0, 4).join(',');
  const clipsWiped = pendingClipsWiped;
  const categoriesWiped = pendingCategoriesWiped;

  pendingUpsertCols.clear();
  pendingDeletes.length = 0;
  pendingMutationTypes = [];
  pendingClipsWiped = false;
  pendingCategoriesWiped = false;

  const nowMs = Date.now();
  const nowIso = new Date(nowMs).toISOString();

  const basePatch: Record<string, unknown> = {
    lastMutationAt: nowIso,
    lastMutationBy: CLIENT_INSTANCE_ID,
    lastMutationType: mutationLabel || 'mutation',
  };

  if (upsertedCols.length > 0) {
    const versionUpdates: Partial<Record<SyncCollectionKey, string>> = {};
    upsertedCols.forEach((col) => {
      versionUpdates[col] = nowIso;
    });
    basePatch.collectionVersions = versionUpdates;
  }

  if (clipsWiped) {
    basePatch.clipsWipedAt = nowIso;
  }
  if (categoriesWiped) {
    basePatch.categoriesWipedAt = nowIso;
  }

  // Record timestamp locally immediately so our own snapshot echo never re-fetches
  if (onPulseEmittedCallback) {
    onPulseEmittedCallback(nowIso);
  }

  const docRef = doc(db, 'system_settings', 'archive_summary_stats');

  try {
    if (newDeletes.length > 0) {
      // Atomic Transactional Tombstone Merge: prevents 2 devices deleting different clips
      // in the same ~200ms window from overwriting each other's tombstones.
      let committedTombstones: DeletedTombstoneRecord[] = [];
      await runTransaction(db, async (tx) => {
        const snap = await tx.get(docRef);
        const serverData = snap.exists() ? (snap.data() as SyncPulseMetadata) : null;
        const serverDeletes = Array.isArray(serverData?.recentDeletes)
          ? serverData.recentDeletes.filter(
              (item): item is DeletedTombstoneRecord =>
                Boolean(item && item.id && item.col && item.deletedAt)
            )
          : cachedRecentDeletes;

        committedTombstones = mergeAndPruneTombstones(serverDeletes, newDeletes, nowMs);

        const mergedVersions: Partial<Record<SyncCollectionKey, string>> = {
          ...(serverData?.collectionVersions || {}),
          ...((basePatch.collectionVersions as Partial<Record<SyncCollectionKey, string>>) || {}),
        };

        tx.set(
          docRef,
          sanitizeForFirestore({
            ...basePatch,
            ...(Object.keys(mergedVersions).length > 0
              ? { collectionVersions: mergedVersions }
              : {}),
            recentDeletes: committedTombstones,
          }),
          { merge: true }
        );
      });
      cachedRecentDeletes = committedTombstones;
    } else {
      // Zero-read merge write for regular upserts (no tombstones to race on)
      await setDoc(docRef, sanitizeForFirestore(basePatch), { merge: true });
    }
  } catch (err) {
    if (isQuotaExhaustedError(err)) {
      markFirestoreQuotaExhausted(true);
    }
    console.warn('SyncPulse emit warning:', err);
  }
}

/**
 * Emits a lightweight coalesced Sync Pulse onto system_settings/archive_summary_stats
 * after any Cloud write or delete operation.
 */
export function emitSyncPulse(payload: SyncPulseEmitPayload): void {
  const nowIso = new Date().toISOString();

  if (payload.upsertedCollections) {
    payload.upsertedCollections.forEach((col) => pendingUpsertCols.add(col));
  }

  if (payload.deletedItems && payload.deletedItems.length > 0) {
    payload.deletedItems.forEach((item) => {
      pendingDeletes.push({
        id: item.id,
        col: item.col,
        deletedAt: nowIso,
      });
    });
  }

  if (payload.clipsWiped) {
    pendingClipsWiped = true;
  }
  if (payload.categoriesWiped) {
    pendingCategoriesWiped = true;
  }

  pendingMutationTypes.push(payload.mutationType);

  if (coalesceTimer) {
    clearTimeout(coalesceTimer);
  }
  coalesceTimer = setTimeout(() => {
    void flushPendingSyncPulse();
  }, PULSE_COALESCE_MS);
}
