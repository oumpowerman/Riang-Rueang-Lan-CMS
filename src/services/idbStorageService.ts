import { Episode } from '../types/episode.types';
import { Footage } from '../types/footage.types';
import { RawSource } from '../types/source.types';

const DB_NAME = 'rrl_cms_idb_v1';
const DB_VERSION = 2;

export type IDBStoreName = 'episodes' | 'footage' | 'sources' | 'meta' | 'sync_outbox';

export type OutboxCollectionKey =
  | 'footages'
  | 'episodes'
  | 'sources'
  | 'categories'
  | 'category_groups'
  | 'settings';

export interface SyncOutboxRecord {
  /** Coalescing key, e.g. "footages::FT-0177" or "settings::global_rules" */
  opKey: string;
  collection: OutboxCollectionKey;
  action: 'upsert' | 'delete';
  entityId: string;
  payload?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  retryCount: number;
  lastError?: string;
}

const LEGACY_BULKY_LOCAL_KEYS = [
  'rrl_cms_episodes_v2_e2e',
  'rrl_cms_footage_v2_e2e',
  'rrl_cms_sources_v2_e2e',
];

/**
 * Safe wrapper around localStorage.setItem that never throws QuotaExceededError.
 * If quota is exceeded, it evicts legacy bulky clip arrays (now stored in IndexedDB)
 * and retries once.
 */
export function safeLocalStorageSet(key: string, value: string): boolean {
  if (typeof window === 'undefined' || !window.localStorage) return false;
  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch (err) {
    // Evict bulky clip keys that belong in IndexedDB
    try {
      for (const bulkyKey of LEGACY_BULKY_LOCAL_KEYS) {
        if (bulkyKey !== key) {
          window.localStorage.removeItem(bulkyKey);
        }
      }
      window.localStorage.setItem(key, value);
      return true;
    } catch (retryErr) {
      console.warn(`[safeLocalStorageSet] Quota exceeded or storage blocked for key "${key}":`, retryErr);
      return false;
    }
  }
}

export function safeLocalStorageRemove(key: string): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore storage errors
  }
}

let dbPromise: Promise<IDBDatabase | null> | null = null;

function openDatabase(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !('indexedDB' in window)) {
    return Promise.resolve(null);
  }
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve) => {
    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('episodes')) {
          db.createObjectStore('episodes', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('footage')) {
          db.createObjectStore('footage', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('sources')) {
          db.createObjectStore('sources', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('meta')) {
          db.createObjectStore('meta', { keyPath: 'key' });
        }
        if (!db.objectStoreNames.contains('sync_outbox')) {
          db.createObjectStore('sync_outbox', { keyPath: 'opKey' });
        }
      };

      request.onsuccess = () => {
        const db = request.result;
        db.onversionchange = () => {
          db.close();
          dbPromise = null;
        };
        resolve(db);
      };

      request.onerror = () => {
        console.warn('[idbStorageService] IndexedDB open error:', request.error);
        dbPromise = null;
        resolve(null);
      };

      request.onblocked = () => {
        console.warn('[idbStorageService] IndexedDB open blocked');
        dbPromise = null;
        resolve(null);
      };
    } catch (err) {
      console.warn('[idbStorageService] Failed to initialize IndexedDB:', err);
      dbPromise = null;
      resolve(null);
    }
  });

  return dbPromise;
}

type DataStoreName = 'episodes' | 'footage' | 'sources';

async function getAllFromStore<T>(storeName: DataStoreName): Promise<T[]> {
  const db = await openDatabase();
  if (!db) return [];

  return new Promise<T[]>((resolve) => {
    try {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.getAll();

      req.onsuccess = () => {
        resolve((req.result as T[]) || []);
      };
      req.onerror = () => {
        console.warn(`[idbStorageService] getAll error on ${storeName}:`, req.error);
        resolve([]);
      };
    } catch (err) {
      console.warn(`[idbStorageService] transaction error on ${storeName}:`, err);
      resolve([]);
    }
  });
}

async function saveAllToStore<T extends { id: string }>(
  storeName: DataStoreName,
  items: T[]
): Promise<void> {
  const db = await openDatabase();
  if (!db) return;

  return new Promise<void>((resolve) => {
    try {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);

      // Clear and write authoritative list in a single atomic transaction
      store.clear();
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item && item.id) {
          store.put(item);
        }
      }

      tx.oncomplete = () => resolve();
      tx.onerror = () => {
        console.warn(`[idbStorageService] saveAll error on ${storeName}:`, tx.error);
        resolve();
      };
      tx.onabort = () => {
        console.warn(`[idbStorageService] saveAll aborted on ${storeName}:`, tx.error);
        resolve();
      };
    } catch (err) {
      console.warn(`[idbStorageService] saveAll exception on ${storeName}:`, err);
      resolve();
    }
  });
}

async function upsertBatchToStore<T extends { id: string }>(
  storeName: DataStoreName,
  items: T[]
): Promise<void> {
  if (items.length === 0) return;
  const db = await openDatabase();
  if (!db) return;

  return new Promise<void>((resolve) => {
    try {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item && item.id) {
          store.put(item);
        }
      }

      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
      tx.onabort = () => resolve();
    } catch {
      resolve();
    }
  });
}

async function getMeta<T>(key: string): Promise<T | null> {
  const db = await openDatabase();
  if (!db) return null;

  return new Promise<T | null>((resolve) => {
    try {
      const tx = db.transaction('meta', 'readonly');
      const store = tx.objectStore('meta');
      const req = store.get(key);

      req.onsuccess = () => {
        const record = req.result as { key: string; value: T } | undefined;
        resolve(record ? record.value : null);
      };
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function setMeta<T>(key: string, value: T): Promise<void> {
  const db = await openDatabase();
  if (!db) return;

  return new Promise<void>((resolve) => {
    try {
      const tx = db.transaction('meta', 'readwrite');
      const store = tx.objectStore('meta');
      store.put({ key, value, updatedAt: Date.now() });
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

async function clearClipsStores(): Promise<void> {
  const db = await openDatabase();
  if (!db) return;

  return new Promise<void>((resolve) => {
    try {
      const tx = db.transaction(['episodes', 'footage', 'sources'], 'readwrite');
      tx.objectStore('episodes').clear();
      tx.objectStore('footage').clear();
      tx.objectStore('sources').clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

// Debounced background save timers per store so rapid state updates don't block main thread
const pendingSaveTimers: Partial<Record<DataStoreName, number>> = {};

function scheduleSaveAllToStore<T extends { id: string }>(
  storeName: DataStoreName,
  items: T[],
  delayMs = 250
): void {
  if (typeof window === 'undefined') return;
  const existing = pendingSaveTimers[storeName];
  if (existing !== undefined) {
    window.clearTimeout(existing);
  }
  pendingSaveTimers[storeName] = window.setTimeout(() => {
    delete pendingSaveTimers[storeName];
    void saveAllToStore(storeName, items);
  }, delayMs);
}

/**
 * Persistent Offline Outbox CRUD helpers
 */
async function getAllOutboxRecords(): Promise<SyncOutboxRecord[]> {
  const db = await openDatabase();
  if (!db || !db.objectStoreNames.contains('sync_outbox')) return [];

  return new Promise<SyncOutboxRecord[]>((resolve) => {
    try {
      const tx = db.transaction('sync_outbox', 'readonly');
      const req = tx.objectStore('sync_outbox').getAll();
      req.onsuccess = () => {
        const list = (req.result as SyncOutboxRecord[]) || [];
        list.sort((a, b) => (a.createdAt > b.createdAt ? 1 : a.createdAt < b.createdAt ? -1 : 0));
        resolve(list);
      };
      req.onerror = () => resolve([]);
    } catch {
      resolve([]);
    }
  });
}

async function upsertOutboxRecords(records: SyncOutboxRecord[]): Promise<void> {
  if (records.length === 0) return;
  const db = await openDatabase();
  if (!db || !db.objectStoreNames.contains('sync_outbox')) return;

  return new Promise<void>((resolve) => {
    try {
      const tx = db.transaction('sync_outbox', 'readwrite');
      const store = tx.objectStore('sync_outbox');
      for (let i = 0; i < records.length; i++) {
        store.put(records[i]);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
      tx.onabort = () => resolve();
    } catch {
      resolve();
    }
  });
}

async function deleteOutboxRecords(opKeys: string[]): Promise<void> {
  if (opKeys.length === 0) return;
  const db = await openDatabase();
  if (!db || !db.objectStoreNames.contains('sync_outbox')) return;

  return new Promise<void>((resolve) => {
    try {
      const tx = db.transaction('sync_outbox', 'readwrite');
      const store = tx.objectStore('sync_outbox');
      for (let i = 0; i < opKeys.length; i++) {
        store.delete(opKeys[i]);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
      tx.onabort = () => resolve();
    } catch {
      resolve();
    }
  });
}

async function clearOutboxStore(): Promise<void> {
  const db = await openDatabase();
  if (!db || !db.objectStoreNames.contains('sync_outbox')) return;

  return new Promise<void>((resolve) => {
    try {
      const tx = db.transaction('sync_outbox', 'readwrite');
      tx.objectStore('sync_outbox').clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

/**
 * Hydrates a collection from IndexedDB, or automatically migrates from legacy localStorage
 * on first launch and reclaims the 5MB localStorage space.
 */
async function loadOrMigrateStore<T extends { id: string }>(
  storeName: DataStoreName,
  legacyLocalStorageKey: string
): Promise<T[]> {
  const idbItems = await getAllFromStore<T>(storeName);
  if (idbItems.length > 0) {
    // Reclaim legacy localStorage space if still lingering
    safeLocalStorageRemove(legacyLocalStorageKey);
    return idbItems;
  }

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const raw = window.localStorage.getItem(legacyLocalStorageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as T[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          await saveAllToStore(storeName, parsed);
          safeLocalStorageRemove(legacyLocalStorageKey);
          return parsed;
        }
        safeLocalStorageRemove(legacyLocalStorageKey);
      }
    } catch {
      safeLocalStorageRemove(legacyLocalStorageKey);
    }
  }

  return [];
}

export const idbStorageService = {
  getAllFromStore,
  saveAllToStore,
  upsertBatchToStore,
  scheduleSaveAllToStore,
  getMeta,
  setMeta,
  clearClipsStores,
  getAllOutboxRecords,
  upsertOutboxRecords,
  deleteOutboxRecords,
  clearOutboxStore,

  loadEpisodes(): Promise<Episode[]> {
    return loadOrMigrateStore<Episode>('episodes', 'rrl_cms_episodes_v2_e2e');
  },
  saveEpisodes(episodes: Episode[], immediate = false): Promise<void> | void {
    safeLocalStorageRemove('rrl_cms_episodes_v2_e2e');
    if (immediate) {
      return saveAllToStore('episodes', episodes);
    }
    scheduleSaveAllToStore('episodes', episodes);
  },

  loadFootage(): Promise<Footage[]> {
    return loadOrMigrateStore<Footage>('footage', 'rrl_cms_footage_v2_e2e');
  },
  saveFootage(footage: Footage[], immediate = false): Promise<void> | void {
    safeLocalStorageRemove('rrl_cms_footage_v2_e2e');
    if (immediate) {
      return saveAllToStore('footage', footage);
    }
    scheduleSaveAllToStore('footage', footage);
  },

  loadSources(): Promise<RawSource[]> {
    return loadOrMigrateStore<RawSource>('sources', 'rrl_cms_sources_v2_e2e');
  },
  saveSources(sources: RawSource[], immediate = false): Promise<void> | void {
    safeLocalStorageRemove('rrl_cms_sources_v2_e2e');
    if (immediate) {
      return saveAllToStore('sources', sources);
    }
    scheduleSaveAllToStore('sources', sources);
  },
};
