import { doc, serverTimestamp } from 'firebase/firestore';
import { db } from './config';
import {
  BatchWriteOp,
  commitOperationsInChunks,
  sanitizeForFirestore,
} from './firestoreBatchUtils';
import {
  isQuotaExhaustedError,
  markFirestoreQuotaExhausted,
} from './firestoreErrorHandling';
import { emitSyncPulse, SyncCollectionKey } from './firestoreSyncPulse';
import {
  idbStorageService,
  OutboxCollectionKey,
  SyncOutboxRecord,
} from '../services/idbStorageService';
import { broadcastOutboxChanged } from '../services/multiTabSyncBus';

export interface OutboxEnqueueInput {
  collection: OutboxCollectionKey;
  action: 'upsert' | 'delete';
  entityId: string;
  payload?: Record<string, unknown>;
  errorMessage?: string;
}

export interface OutboxQueueSnapshot {
  items: SyncOutboxRecord[];
  count: number;
  isFlushing: boolean;
  lastFlushAt: string | null;
  lastFlushError: string | null;
}

export interface OutboxFlushResult {
  flushedCount: number;
  remainingCount: number;
  quotaBlocked: boolean;
  error?: string;
}

const BACKOFF_STEPS_MS = [2_000, 5_000, 15_000, 30_000];

let cachedItems: SyncOutboxRecord[] = [];
let isFlushing = false;
let lastFlushAt: string | null = null;
let lastFlushError: string | null = null;
let retryTimer: ReturnType<typeof setTimeout> | null = null;
let consecutiveFailures = 0;
let autoRetryInitialized = false;

const listeners = new Set<(snapshot: OutboxQueueSnapshot) => void>();

function buildSnapshot(): OutboxQueueSnapshot {
  return {
    items: cachedItems,
    count: cachedItems.length,
    isFlushing,
    lastFlushAt,
    lastFlushError,
  };
}

function notifyListeners(): void {
  const snap = buildSnapshot();
  listeners.forEach((fn) => {
    try {
      fn(snap);
    } catch (err) {
      console.warn('[firestoreOutboxQueue] Listener warning:', err);
    }
  });
}

function formatOutboxErrorThai(err: unknown): string {
  if (isQuotaExhaustedError(err)) {
    return 'ติดเพดานโควตา Firestore รายวัน — รายการถูกเก็บไว้ในคิวเครื่องอย่างปลอดภัย และจะส่งใหม่เมื่อโควตารีเซ็ต';
  }
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return 'อุปกรณ์กำลังออฟไลน์ — ระบบจะส่งคิวที่ค้างให้อัตโนมัติเมื่ออินเทอร์เน็ตกลับมา';
  }
  const msg = err instanceof Error ? err.message : String(err || '');
  return msg ? `ส่งขึ้น Cloud ไม่สำเร็จ (${msg.slice(0, 120)})` : 'ส่งขึ้น Cloud ไม่สำเร็จ (รอส่งซ้ำอัตโนมัติ)';
}

function clearScheduledRetry(): void {
  if (retryTimer !== null) {
    clearTimeout(retryTimer);
    retryTimer = null;
  }
}

function scheduleNextRetry(): void {
  clearScheduledRetry();
  if (cachedItems.length === 0) return;
  if (typeof navigator !== 'undefined' && !navigator.onLine) return;

  const delayMs =
    BACKOFF_STEPS_MS[Math.min(consecutiveFailures, BACKOFF_STEPS_MS.length - 1)];
  retryTimer = setTimeout(() => {
    retryTimer = null;
    void flushOutboxQueue(false);
  }, delayMs);
}

/**
 * Reloads outbox items from IndexedDB (used at startup and when sibling tabs broadcast outbox updates).
 */
export async function reloadOutboxFromStorage(): Promise<SyncOutboxRecord[]> {
  cachedItems = await idbStorageService.getAllOutboxRecords();
  notifyListeners();
  return cachedItems;
}

/**
 * Enqueues one or more failed Firestore write/delete operations into IndexedDB.
 * Automatically coalesces multiple edits to the same (collection, entityId) into the latest operation.
 */
export async function enqueueOutboxOperations(
  inputs: OutboxEnqueueInput[]
): Promise<void> {
  if (!inputs.length) return;

  const nowIso = new Date().toISOString();
  const existingMap = new Map(cachedItems.map((item) => [item.opKey, item]));
  const toPersist: SyncOutboxRecord[] = [];

  for (let i = 0; i < inputs.length; i++) {
    const input = inputs[i];
    if (!input.entityId) continue;
    const opKey = `${input.collection}::${input.entityId}`;
    const prev = existingMap.get(opKey);

    const record: SyncOutboxRecord = {
      opKey,
      collection: input.collection,
      action: input.action,
      entityId: input.entityId,
      payload:
        input.action === 'upsert' && input.payload
          ? (sanitizeForFirestore(input.payload) as Record<string, unknown>)
          : undefined,
      createdAt: prev?.createdAt || nowIso,
      updatedAt: nowIso,
      retryCount: prev?.retryCount || 0,
      lastError: input.errorMessage,
    };

    existingMap.set(opKey, record);
    toPersist.push(record);
  }

  if (toPersist.length === 0) return;

  cachedItems = Array.from(existingMap.values()).sort((a, b) =>
    a.createdAt > b.createdAt ? 1 : a.createdAt < b.createdAt ? -1 : 0
  );
  await idbStorageService.upsertOutboxRecords(toPersist);
  notifyListeners();
  broadcastOutboxChanged();

  // Schedule auto-retry only if online and not currently known quota-exhausted
  if (
    typeof navigator === 'undefined' ||
    navigator.onLine
  ) {
    scheduleNextRetry();
  }
}

/**
 * Clears queued outbox entries that were succeeded by a direct live write later.
 */
export async function removeOutboxOperations(
  keys: Array<{ collection: OutboxCollectionKey; entityId: string }>
): Promise<void> {
  if (!keys.length || cachedItems.length === 0) return;

  const keySet = new Set(keys.map((k) => `${k.collection}::${k.entityId}`));
  const matchedKeys: string[] = [];
  for (let i = 0; i < cachedItems.length; i++) {
    if (keySet.has(cachedItems[i].opKey)) {
      matchedKeys.push(cachedItems[i].opKey);
    }
  }
  if (matchedKeys.length === 0) return;

  cachedItems = cachedItems.filter((item) => !keySet.has(item.opKey));
  await idbStorageService.deleteOutboxRecords(matchedKeys);
  notifyListeners();
  broadcastOutboxChanged();
}

/**
 * Replays all pending operations from the IndexedDB Outbox to Firestore in safe chunks,
 * then emits a consolidated Write Pulse so all peer devices receive the recovered changes.
 */
export async function flushOutboxQueue(isManualTrigger = false): Promise<OutboxFlushResult> {
  if (isFlushing) {
    return {
      flushedCount: 0,
      remainingCount: cachedItems.length,
      quotaBlocked: false,
    };
  }

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    lastFlushError = 'อุปกรณ์กำลังออฟไลน์ — รอเชื่อมต่ออินเทอร์เน็ตเพื่อส่งคิวที่ค้าง';
    notifyListeners();
    return {
      flushedCount: 0,
      remainingCount: cachedItems.length,
      quotaBlocked: false,
      error: lastFlushError,
    };
  }

  // Always hydrate latest state from IndexedDB first (in case another tab wrote to it)
  const items = await idbStorageService.getAllOutboxRecords();
  cachedItems = items;

  if (items.length === 0) {
    lastFlushError = null;
    consecutiveFailures = 0;
    clearScheduledRetry();
    notifyListeners();
    return { flushedCount: 0, remainingCount: 0, quotaBlocked: false };
  }

  isFlushing = true;
  if (isManualTrigger) {
    lastFlushError = null;
  }
  notifyListeners();

  try {
    const nowIso = new Date().toISOString();
    const ops: BatchWriteOp[] = [];
    const upsertedCols = new Set<SyncCollectionKey>();
    const deletedItems: Array<{ id: string; col: SyncCollectionKey }> = [];

    for (let i = 0; i < items.length; i++) {
      const rec = items[i];
      if (rec.collection === 'settings') {
        if (rec.action === 'upsert' && rec.payload) {
          ops.push({
            type: 'set',
            ref: doc(db, 'system_settings', rec.entityId || 'global_rules'),
            data: sanitizeForFirestore({
              ...rec.payload,
              updatedAt: nowIso,
            }) as Record<string, unknown>,
          });
        }
        continue;
      }

      const ref = doc(db, rec.collection, rec.entityId);
      if (rec.action === 'delete') {
        ops.push({ type: 'delete', ref });
        deletedItems.push({ id: rec.entityId, col: rec.collection });
      } else if (rec.payload) {
        const needsServerTs =
          rec.collection === 'footages' ||
          rec.collection === 'episodes' ||
          rec.collection === 'sources';
        ops.push({
          type: 'set',
          ref,
          data: sanitizeForFirestore({
            ...rec.payload,
            updatedAt: nowIso,
            ...(needsServerTs ? { serverUpdatedAt: serverTimestamp() } : {}),
          }) as Record<string, unknown>,
        });
        upsertedCols.add(rec.collection);
      }
    }

    if (ops.length > 0) {
      await commitOperationsInChunks(ops);
    }

    const flushedKeys = items.map((r) => r.opKey);
    await idbStorageService.deleteOutboxRecords(flushedKeys);
    cachedItems = await idbStorageService.getAllOutboxRecords();

    // Mark quota healthy again if a manual flush succeeded!
    markFirestoreQuotaExhausted(false);

    if (upsertedCols.size > 0 || deletedItems.length > 0) {
      emitSyncPulse({
        upsertedCollections: Array.from(upsertedCols),
        deletedItems,
        mutationType: 'outbox:flush',
      });
    }

    consecutiveFailures = 0;
    lastFlushAt = nowIso;
    lastFlushError = null;
    clearScheduledRetry();
    notifyListeners();
    broadcastOutboxChanged();

    return {
      flushedCount: flushedKeys.length,
      remainingCount: cachedItems.length,
      quotaBlocked: false,
    };
  } catch (err) {
    const quotaHit = isQuotaExhaustedError(err);
    if (quotaHit) {
      markFirestoreQuotaExhausted(true);
    }
    consecutiveFailures += 1;
    const friendlyError = formatOutboxErrorThai(err);
    lastFlushError = friendlyError;

    // Increment retryCount & record lastError on queued items
    const updatedRecords: SyncOutboxRecord[] = cachedItems.map((rec) => ({
      ...rec,
      retryCount: rec.retryCount + 1,
      lastError: friendlyError,
    }));
    cachedItems = updatedRecords;
    await idbStorageService.upsertOutboxRecords(updatedRecords);

    // Do NOT aggressively loop retries if daily Firestore quota is exhausted
    if (!quotaHit) {
      scheduleNextRetry();
    } else {
      clearScheduledRetry();
    }

    notifyListeners();
    broadcastOutboxChanged();

    return {
      flushedCount: 0,
      remainingCount: cachedItems.length,
      quotaBlocked: quotaHit,
      error: friendlyError,
    };
  } finally {
    isFlushing = false;
    notifyListeners();
  }
}

/**
 * Clears all pending entries in the outbox (explicit user recovery action).
 */
export async function clearOutboxQueue(): Promise<void> {
  clearScheduledRetry();
  consecutiveFailures = 0;
  lastFlushError = null;
  cachedItems = [];
  await idbStorageService.clearOutboxStore();
  notifyListeners();
  broadcastOutboxChanged();
}

/**
 * Subscribes to live outbox state updates.
 */
export function subscribeOutboxState(
  listener: (snapshot: OutboxQueueSnapshot) => void
): () => void {
  listeners.add(listener);
  listener(buildSnapshot());
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Initializes persistent outbox hydration and auto-retry triggers on browser online / tab focus.
 */
export function initOutboxAutoRetry(): () => void {
  if (typeof window === 'undefined') return () => {};

  if (!autoRetryInitialized) {
    autoRetryInitialized = true;
    void reloadOutboxFromStorage().then((items) => {
      if (items.length > 0 && navigator.onLine) {
        void flushOutboxQueue(false);
      }
    });
  }

  const handleOnline = () => {
    consecutiveFailures = 0;
    void reloadOutboxFromStorage().then((items) => {
      if (items.length > 0) {
        void flushOutboxQueue(false);
      }
    });
  };

  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible' && navigator.onLine) {
      void reloadOutboxFromStorage().then((items) => {
        if (items.length > 0 && !isFlushing) {
          void flushOutboxQueue(false);
        }
      });
    }
  };

  window.addEventListener('online', handleOnline);
  document.addEventListener('visibilitychange', handleVisibilityChange);

  return () => {
    window.removeEventListener('online', handleOnline);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
}
