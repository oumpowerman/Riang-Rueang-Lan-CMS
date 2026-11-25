import { writeBatch, DocumentReference } from 'firebase/firestore';
import { db } from './config';
import { CategoryTag } from '../types/tag.types';

/**
 * Firestore WriteBatch hard limit is 500 operations.
 * We use 400 per chunk so bulk Google Drive imports (300–2,000+ videos/sources/tags)
 * commit reliably without ever hitting the 500-op WriteBatch limit or flooding individual requests.
 */
export const MAX_BATCH_OPERATIONS = 400;

export interface BatchChunkProgress {
  completedChunks: number;
  totalChunks: number;
  completedOps: number;
  totalOps: number;
}

export interface BatchWriteOp {
  type: 'set' | 'delete';
  ref: DocumentReference;
  data?: Record<string, unknown>;
  merge?: boolean;
}

let activeBatchWritesCount = 0;
const batchWriteCompleteListeners = new Set<() => void>();

const handleBeforeUnload = (e: BeforeUnloadEvent) => {
  if (activeBatchWritesCount > 0) {
    e.preventDefault();
    e.returnValue =
      'กำลังบันทึกข้อมูลก้อนใหญ่ขึ้น Cloud (Firestore) กรุณารอให้ครบ 100% ก่อนรีเฟรชหรือปิดหน้านี้';
    return e.returnValue;
  }
  return undefined;
};

export function beginBatchWriteLock(): void {
  if (activeBatchWritesCount === 0 && typeof window !== 'undefined') {
    window.addEventListener('beforeunload', handleBeforeUnload);
  }
  activeBatchWritesCount += 1;
}

export function endBatchWriteLock(): void {
  activeBatchWritesCount = Math.max(0, activeBatchWritesCount - 1);
  if (activeBatchWritesCount === 0) {
    if (typeof window !== 'undefined') {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    }
    batchWriteCompleteListeners.forEach((listener) => {
      try {
        listener();
      } catch (err) {
        console.warn('batchWriteCompleteListener error:', err);
      }
    });
  }
}

export function isBatchWriteInProgress(): boolean {
  return activeBatchWritesCount > 0;
}

export function onBatchWriteComplete(listener: () => void): () => void {
  batchWriteCompleteListeners.add(listener);
  return () => {
    batchWriteCompleteListeners.delete(listener);
  };
}

export async function withBatchWriteLock<T>(fn: () => Promise<T>): Promise<T> {
  beginBatchWriteLock();
  try {
    return await fn();
  } finally {
    endBatchWriteLock();
  }
}

export async function commitOperationsInChunks(
  operations: BatchWriteOp[],
  onProgress?: (progress: BatchChunkProgress) => void
): Promise<void> {
  if (operations.length === 0) return;
  const totalOps = operations.length;
  const totalChunks = Math.ceil(totalOps / MAX_BATCH_OPERATIONS);
  let completedChunks = 0;

  beginBatchWriteLock();
  try {
    for (let i = 0; i < totalOps; i += MAX_BATCH_OPERATIONS) {
      const chunk = operations.slice(i, i + MAX_BATCH_OPERATIONS);
      const batch = writeBatch(db);
      for (const op of chunk) {
        if (op.type === 'set' && op.data) {
          if (op.merge === false) {
            batch.set(op.ref, op.data);
          } else {
            batch.set(op.ref, op.data, { merge: true });
          }
        } else if (op.type === 'delete') {
          batch.delete(op.ref);
        }
      }
      await batch.commit();
      completedChunks += 1;
      const completedOps = Math.min(totalOps, i + chunk.length);
      onProgress?.({
        completedChunks,
        totalChunks,
        completedOps,
        totalOps,
      });
    }
  } finally {
    endBatchWriteLock();
  }
}

export function sanitizeForFirestore<T>(data: T): T {
  if (data === null || data === undefined || typeof data !== 'object') {
    return data;
  }
  if (Array.isArray(data)) {
    return data.map((item) => sanitizeForFirestore(item)) as unknown as T;
  }
  if (
    Object.prototype.toString.call(data) === '[object Object]' &&
    data.constructor === Object
  ) {
    const cleaned: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      if (value !== undefined) {
        cleaned[key] = sanitizeForFirestore(value);
      }
    }
    return cleaned as T;
  }
  return data;
}

export function normalizeCategoryTag(raw: CategoryTag): CategoryTag {
  const tier: 1 | 2 | 3 =
    raw.tier === 3 ? 3 : raw.tier === 2 || Boolean(raw.parentId) ? 2 : 1;
  return {
    ...raw,
    tier,
    parentId: tier === 2 ? raw.parentId || null : null,
  };
}
