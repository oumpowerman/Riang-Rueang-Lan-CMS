import { safeLocalStorageRemove, safeLocalStorageSet } from '../services/idbStorageService';

/**
 * Authoritative Application Build & Schema Version.
 * Bumping APP_VERSION / APP_SCHEMA_EPOCH automatically forces all browsers (Chrome, Edge, Safari, Mobile PWA)
 * to purge stale local tombstones/timestamps and run a 100% Authoritative Full Pull from Cloud Firestore.
 */
export const APP_VERSION = '3.6.0';
export const APP_BUILD_LABEL = 'v3.6.0 (2026.11.27)';
export const APP_SCHEMA_EPOCH = 'rrl_schema_v3.6.0_20261127';

export const VERSION_STORAGE_KEYS = {
  LOCAL_SCHEMA_EPOCH: 'rrl_cms_local_schema_epoch_v1',
  LOCAL_FORCE_SYNC_EPOCH: 'rrl_cms_local_force_sync_epoch_v1',
  LAST_HARD_RELOAD_VERSION: 'rrl_cms_last_hard_reload_version_v1',
};

/**
 * Compares two semantic version strings (e.g. '3.5.0' vs '3.6.0').
 * Returns:
 *  -1 if vA < vB
 *   0 if vA === vB
 *   1 if vA > vB
 */
export function compareAppVersions(vA?: string | null, vB?: string | null): number {
  if (!vA && !vB) return 0;
  if (!vA) return -1;
  if (!vB) return 1;

  const cleanA = vA.trim().replace(/^v/i, '').split('-')[0];
  const cleanB = vB.trim().replace(/^v/i, '').split('-')[0];

  const partsA = cleanA.split('.').map((n) => parseInt(n, 10) || 0);
  const partsB = cleanB.split('.').map((n) => parseInt(n, 10) || 0);
  const len = Math.max(partsA.length, partsB.length, 3);

  for (let i = 0; i < len; i++) {
    const numA = partsA[i] ?? 0;
    const numB = partsB[i] ?? 0;
    if (numA < numB) return -1;
    if (numA > numB) return 1;
  }
  return 0;
}

/**
 * Purges Service Worker registrations, CacheStorage assets, and stale local sync markers,
 * then navigates with a cache-busting query string so Chrome / Edge / Safari cannot serve stale bundles.
 */
export async function hardReloadAndPurgeBrowserCaches(targetVersion?: string): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    if (targetVersion) {
      safeLocalStorageSet(VERSION_STORAGE_KEYS.LAST_HARD_RELOAD_VERSION, targetVersion);
    }
    // Clear local sync markers so the next boot performs a 100% full authoritative pull from Cloud
    safeLocalStorageRemove('rrl_cms_last_cloud_sync_ts_v1');
    safeLocalStorageRemove('rrl_cms_deleted_tag_ids_v1');
    safeLocalStorageRemove('rrl_cms_deleted_group_ids_v1');
    safeLocalStorageRemove(VERSION_STORAGE_KEYS.LOCAL_SCHEMA_EPOCH);
  } catch {
    // Ignore storage access errors
  }

  try {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(
        registrations.map(async (reg) => {
          try {
            await reg.update();
            await reg.unregister();
          } catch {
            // Ignore single SW unregister error
          }
        })
      );
    }
  } catch {
    // Ignore SW API errors
  }

  try {
    if ('caches' in window) {
      const cacheKeys = await window.caches.keys();
      await Promise.all(cacheKeys.map((key) => window.caches.delete(key)));
    }
  } catch {
    // Ignore CacheStorage errors
  }

  // Navigate with a cache-busting query parameter so the browser fetches fresh index.html
  const url = new URL(window.location.href);
  url.searchParams.set('_v', `${targetVersion || APP_VERSION}_${Date.now()}`);
  window.location.replace(url.toString());
}
