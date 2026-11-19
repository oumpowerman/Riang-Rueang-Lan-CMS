import { doc, setDoc, deleteDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './config';
import { Footage } from '../types/footage.types';
import { RawSource } from '../types/source.types';
import { CategoryGroup, CategoryTag, SystemSettings } from '../types/tag.types';
import { Episode } from '../types/episode.types';
import {
  BatchChunkProgress,
  BatchWriteOp,
  commitOperationsInChunks,
  normalizeCategoryTag,
  sanitizeForFirestore,
} from './firestoreBatchUtils';
import {
  isQuotaExhaustedError,
  markFirestoreQuotaExhausted,
} from './firestoreErrorHandling';
import { emitSyncPulse } from './firestoreSyncPulse';
import {
  enqueueOutboxOperations,
  OutboxEnqueueInput,
  removeOutboxOperations,
} from './firestoreOutboxQueue';

async function executeWithOutboxFallback(
  cloudAction: () => Promise<void>,
  fallbackOps: OutboxEnqueueInput[]
): Promise<void> {
  try {
    await cloudAction();
    // If any of these entities had stale pending outbox items, clear them now that live write succeeded
    void removeOutboxOperations(
      fallbackOps.map((op) => ({
        collection: op.collection,
        entityId: op.entityId,
      }))
    );
  } catch (err) {
    if (isQuotaExhaustedError(err)) {
      markFirestoreQuotaExhausted(true);
    }
    const errMsg = err instanceof Error ? err.message : String(err || '');
    await enqueueOutboxOperations(
      fallbackOps.map((op) => ({
        ...op,
        errorMessage: errMsg,
      }))
    );
    throw err;
  }
}

export async function fetchSettingsOnce(): Promise<SystemSettings | null> {
  try {
    const docRef = doc(db, 'system_settings', 'global_rules');
    const snap = await getDoc(docRef);
    return snap.exists() ? (snap.data() as SystemSettings) : null;
  } catch (err) {
    if (isQuotaExhaustedError(err)) {
      markFirestoreQuotaExhausted(true);
    }
    throw err;
  }
}

export async function saveCategoryGroup(group: CategoryGroup) {
  const payload = sanitizeForFirestore({
    ...group,
    updatedAt: new Date().toISOString(),
  }) as Record<string, unknown>;

  await executeWithOutboxFallback(
    async () => {
      const docRef = doc(db, 'category_groups', group.id);
      await setDoc(docRef, payload, { merge: true });
      emitSyncPulse({
        upsertedCollections: ['category_groups'],
        mutationType: 'category_groups:upsert',
      });
    },
    [{ collection: 'category_groups', action: 'upsert', entityId: group.id, payload }]
  );
}

export async function deleteCategoryGroup(groupId: string) {
  await executeWithOutboxFallback(
    async () => {
      const docRef = doc(db, 'category_groups', groupId);
      await deleteDoc(docRef);
      emitSyncPulse({
        deletedItems: [{ id: groupId, col: 'category_groups' }],
        mutationType: 'category_groups:delete',
      });
    },
    [{ collection: 'category_groups', action: 'delete', entityId: groupId }]
  );
}

export async function saveCategory(category: CategoryTag) {
  const normalized = normalizeCategoryTag(category);
  const payload = sanitizeForFirestore({
    ...normalized,
    updatedAt: new Date().toISOString(),
  }) as Record<string, unknown>;

  await executeWithOutboxFallback(
    async () => {
      const docRef = doc(db, 'categories', category.id);
      await setDoc(docRef, payload, { merge: true });
      emitSyncPulse({
        upsertedCollections: ['categories'],
        mutationType: 'categories:upsert',
      });
    },
    [{ collection: 'categories', action: 'upsert', entityId: category.id, payload }]
  );
}

export async function batchSaveCategories(
  categories: CategoryTag[],
  onProgress?: (progress: BatchChunkProgress) => void
) {
  if (!categories.length) return;
  const now = new Date().toISOString();
  const prepared = categories.map((cat) => {
    const normalized = normalizeCategoryTag(cat);
    const data = sanitizeForFirestore({
      ...normalized,
      updatedAt: now,
    }) as Record<string, unknown>;
    return { id: cat.id, data };
  });

  await executeWithOutboxFallback(
    async () => {
      const ops: BatchWriteOp[] = prepared.map((item) => ({
        type: 'set',
        ref: doc(db, 'categories', item.id),
        data: item.data,
      }));
      await commitOperationsInChunks(ops, onProgress);
      emitSyncPulse({
        upsertedCollections: ['categories'],
        mutationType: 'categories:batch_upsert',
      });
    },
    prepared.map((item) => ({
      collection: 'categories',
      action: 'upsert',
      entityId: item.id,
      payload: item.data,
    }))
  );
}

export async function deleteCategory(categoryId: string) {
  await executeWithOutboxFallback(
    async () => {
      const docRef = doc(db, 'categories', categoryId);
      await deleteDoc(docRef);
      emitSyncPulse({
        deletedItems: [{ id: categoryId, col: 'categories' }],
        mutationType: 'categories:delete',
      });
    },
    [{ collection: 'categories', action: 'delete', entityId: categoryId }]
  );
}

export async function batchDeleteCategories(
  categoryIds: string[],
  onProgress?: (progress: BatchChunkProgress) => void
) {
  if (!categoryIds.length) return;
  await executeWithOutboxFallback(
    async () => {
      const ops: BatchWriteOp[] = categoryIds.map((id) => ({
        type: 'delete',
        ref: doc(db, 'categories', id),
      }));
      await commitOperationsInChunks(ops, onProgress);
      emitSyncPulse({
        deletedItems: categoryIds.map((id) => ({ id, col: 'categories' })),
        mutationType: 'categories:batch_delete',
      });
    },
    categoryIds.map((id) => ({
      collection: 'categories',
      action: 'delete',
      entityId: id,
    }))
  );
}

export async function saveSource(source: RawSource) {
  const now = new Date().toISOString();
  const basePayload = sanitizeForFirestore({
    ...source,
    updatedAt: now,
  }) as Record<string, unknown>;

  await executeWithOutboxFallback(
    async () => {
      const docRef = doc(db, 'sources', source.id);
      await setDoc(
        docRef,
        sanitizeForFirestore({
          ...basePayload,
          serverUpdatedAt: serverTimestamp(),
        }),
        { merge: true }
      );
      emitSyncPulse({
        upsertedCollections: ['sources'],
        mutationType: 'sources:upsert',
      });
    },
    [{ collection: 'sources', action: 'upsert', entityId: source.id, payload: basePayload }]
  );
}

export async function batchSaveSources(
  sources: RawSource[],
  onProgress?: (progress: BatchChunkProgress) => void
) {
  if (!sources.length) return;
  const now = new Date().toISOString();
  const prepared = sources.map((src) => ({
    id: src.id,
    basePayload: sanitizeForFirestore({
      ...src,
      updatedAt: now,
    }) as Record<string, unknown>,
  }));

  await executeWithOutboxFallback(
    async () => {
      const ops: BatchWriteOp[] = prepared.map((item) => ({
        type: 'set',
        ref: doc(db, 'sources', item.id),
        data: sanitizeForFirestore({
          ...item.basePayload,
          serverUpdatedAt: serverTimestamp(),
        }) as Record<string, unknown>,
      }));
      await commitOperationsInChunks(ops, onProgress);
      emitSyncPulse({
        upsertedCollections: ['sources'],
        mutationType: 'sources:batch_upsert',
      });
    },
    prepared.map((item) => ({
      collection: 'sources',
      action: 'upsert',
      entityId: item.id,
      payload: item.basePayload,
    }))
  );
}

export async function deleteSource(sourceId: string) {
  await executeWithOutboxFallback(
    async () => {
      const docRef = doc(db, 'sources', sourceId);
      await deleteDoc(docRef);
      emitSyncPulse({
        deletedItems: [{ id: sourceId, col: 'sources' }],
        mutationType: 'sources:delete',
      });
    },
    [{ collection: 'sources', action: 'delete', entityId: sourceId }]
  );
}

export async function saveFootage(footage: Footage) {
  const now = new Date().toISOString();
  const basePayload = sanitizeForFirestore({
    ...footage,
    updatedAt: now,
  }) as Record<string, unknown>;

  await executeWithOutboxFallback(
    async () => {
      const docRef = doc(db, 'footages', footage.id);
      await setDoc(
        docRef,
        sanitizeForFirestore({
          ...basePayload,
          serverUpdatedAt: serverTimestamp(),
        }),
        { merge: true }
      );
      emitSyncPulse({
        upsertedCollections: ['footages'],
        mutationType: 'footages:upsert',
      });
    },
    [{ collection: 'footages', action: 'upsert', entityId: footage.id, payload: basePayload }]
  );
}

export async function batchSaveFootages(
  footages: Footage[],
  onProgress?: (progress: BatchChunkProgress) => void
) {
  if (!footages.length) return;
  const now = new Date().toISOString();
  const prepared = footages.map((ft) => ({
    id: ft.id,
    basePayload: sanitizeForFirestore({
      ...ft,
      updatedAt: now,
    }) as Record<string, unknown>,
  }));

  await executeWithOutboxFallback(
    async () => {
      const ops: BatchWriteOp[] = prepared.map((item) => ({
        type: 'set',
        ref: doc(db, 'footages', item.id),
        data: sanitizeForFirestore({
          ...item.basePayload,
          serverUpdatedAt: serverTimestamp(),
        }) as Record<string, unknown>,
      }));
      await commitOperationsInChunks(ops, onProgress);
      emitSyncPulse({
        upsertedCollections: ['footages'],
        mutationType: 'footages:batch_upsert',
      });
    },
    prepared.map((item) => ({
      collection: 'footages',
      action: 'upsert',
      entityId: item.id,
      payload: item.basePayload,
    }))
  );
}

export async function deleteFootage(footageId: string) {
  await executeWithOutboxFallback(
    async () => {
      const docRef = doc(db, 'footages', footageId);
      await deleteDoc(docRef);
      emitSyncPulse({
        deletedItems: [{ id: footageId, col: 'footages' }],
        mutationType: 'footages:delete',
      });
    },
    [{ collection: 'footages', action: 'delete', entityId: footageId }]
  );
}

export async function batchDeleteFootages(
  footageIds: string[],
  onProgress?: (progress: BatchChunkProgress) => void
) {
  if (!footageIds.length) return;
  await executeWithOutboxFallback(
    async () => {
      const ops: BatchWriteOp[] = footageIds.map((id) => ({
        type: 'delete',
        ref: doc(db, 'footages', id),
      }));
      await commitOperationsInChunks(ops, onProgress);
      emitSyncPulse({
        deletedItems: footageIds.map((id) => ({ id, col: 'footages' })),
        mutationType: 'footages:batch_delete',
      });
    },
    footageIds.map((id) => ({
      collection: 'footages',
      action: 'delete',
      entityId: id,
    }))
  );
}

export async function saveEpisode(episode: Episode) {
  const now = new Date().toISOString();
  const basePayload = sanitizeForFirestore({
    ...episode,
    updatedAt: now,
  }) as Record<string, unknown>;

  await executeWithOutboxFallback(
    async () => {
      const docRef = doc(db, 'episodes', episode.id);
      await setDoc(
        docRef,
        sanitizeForFirestore({
          ...basePayload,
          serverUpdatedAt: serverTimestamp(),
        }),
        { merge: true }
      );
      emitSyncPulse({
        upsertedCollections: ['episodes'],
        mutationType: 'episodes:upsert',
      });
    },
    [{ collection: 'episodes', action: 'upsert', entityId: episode.id, payload: basePayload }]
  );
}

export async function batchSaveEpisodes(
  episodes: Episode[],
  onProgress?: (progress: BatchChunkProgress) => void
) {
  if (!episodes.length) return;
  const now = new Date().toISOString();
  const prepared = episodes.map((ep) => ({
    id: ep.id,
    basePayload: sanitizeForFirestore({
      ...ep,
      updatedAt: now,
    }) as Record<string, unknown>,
  }));

  await executeWithOutboxFallback(
    async () => {
      const ops: BatchWriteOp[] = prepared.map((item) => ({
        type: 'set',
        ref: doc(db, 'episodes', item.id),
        data: sanitizeForFirestore({
          ...item.basePayload,
          serverUpdatedAt: serverTimestamp(),
        }) as Record<string, unknown>,
      }));
      await commitOperationsInChunks(ops, onProgress);
      emitSyncPulse({
        upsertedCollections: ['episodes'],
        mutationType: 'episodes:batch_upsert',
      });
    },
    prepared.map((item) => ({
      collection: 'episodes',
      action: 'upsert',
      entityId: item.id,
      payload: item.basePayload,
    }))
  );
}

export async function deleteEpisode(episodeId: string) {
  await executeWithOutboxFallback(
    async () => {
      const docRef = doc(db, 'episodes', episodeId);
      await deleteDoc(docRef);
      emitSyncPulse({
        deletedItems: [{ id: episodeId, col: 'episodes' }],
        mutationType: 'episodes:delete',
      });
    },
    [{ collection: 'episodes', action: 'delete', entityId: episodeId }]
  );
}

export async function saveSettings(settings: SystemSettings) {
  const payload = sanitizeForFirestore({
    ...settings,
    updatedAt: new Date().toISOString(),
  }) as Record<string, unknown>;

  await executeWithOutboxFallback(
    async () => {
      const docRef = doc(db, 'system_settings', 'global_rules');
      await setDoc(docRef, payload, { merge: true });
    },
    [{ collection: 'settings', action: 'upsert', entityId: 'global_rules', payload }]
  );
}
