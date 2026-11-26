/**
 * Centralized Firestore Error Handling & Quota Protection
 *
 * Prevents unhandled snapshot listener crashes and gracefully manages
 * Firebase Free Tier daily read quota exhaustion (50,000 document reads)
 * by falling back seamlessly to local IndexedDB and in-memory caches.
 */

let isFirestoreQuotaExhaustedState = false;
let hasLoggedQuotaWarning = false;
const quotaChangeListeners = new Set<(isExhausted: boolean) => void>();

/**
 * Checks whether an error is caused by Firebase Firestore quota limits.
 */
export function isQuotaExhaustedError(err: unknown): boolean {
  if (!err) return false;
  const anyErr = err as { code?: string; message?: string };
  const code = anyErr.code || '';
  const message = anyErr.message || String(err);
  return (
    code === 'resource-exhausted' ||
    message.includes('resource-exhausted') ||
    message.includes('Quota limit exceeded') ||
    message.includes('quota metric') ||
    message.includes('free tier database')
  );
}

/**
 * Returns whether Firestore read quota has been marked exhausted in the current session.
 */
export function getIsFirestoreQuotaExhausted(): boolean {
  return isFirestoreQuotaExhaustedState;
}

/**
 * Subscribe to changes in Firestore quota exhaustion state.
 */
export function subscribeFirestoreQuotaChange(
  listener: (isExhausted: boolean) => void
): () => void {
  quotaChangeListeners.add(listener);
  // Emit initial state immediately
  listener(isFirestoreQuotaExhaustedState);
  return () => {
    quotaChangeListeners.delete(listener);
  };
}

/**
 * Marks Firestore quota as exhausted (or restored) and notifies listeners.
 */
export function markFirestoreQuotaExhausted(exhausted = true): void {
  if (isFirestoreQuotaExhaustedState !== exhausted) {
    isFirestoreQuotaExhaustedState = exhausted;
    quotaChangeListeners.forEach((fn) => {
      try {
        fn(exhausted);
      } catch (cbErr) {
        console.warn('[Firestore] Error in quota listener:', cbErr);
      }
    });
  }
}

/**
 * Checks whether an error is a transient network/offline state (`code=unavailable`).
 */
export function isTransientOfflineError(err: unknown): boolean {
  if (!err) return false;
  const anyErr = err as { code?: string; message?: string };
  const code = anyErr.code || '';
  const message = anyErr.message || String(err);
  return (
    code === 'unavailable' ||
    message.includes('[code=unavailable]') ||
    message.includes('Could not reach Cloud Firestore backend') ||
    message.includes('client is offline')
  );
}

/**
 * Wraps snapshot listener error callbacks so that Firebase's internal
 * "Uncaught Error in snapshot listener" is never thrown globally.
 */
export function createSafeSnapshotErrorHandler(
  listenerName: string,
  customOnError?: (err: Error) => void
): (err: unknown) => void {
  return (err: unknown) => {
    const isQuota = isQuotaExhaustedError(err);
    const isOffline = isTransientOfflineError(err);
    const anyErr = err as { message?: string };
    const msg = anyErr?.message || String(err || '');

    if (isQuota) {
      markFirestoreQuotaExhausted(true);
      if (!hasLoggedQuotaWarning) {
        hasLoggedQuotaWarning = true;
        console.warn(
          `[Firestore] Cloud free daily read quota reached (50,000 units). Operating seamlessly in local IndexedDB mode.`
        );
      }
    } else if (!isOffline) {
      console.warn(`[Firestore] Snapshot warning in '${listenerName}':`, err);
    }

    if (customOnError) {
      try {
        const errorObj = err instanceof Error ? err : new Error(msg);
        customOnError(errorObj);
      } catch (cbErr) {
        console.warn(`[Firestore] Error in custom handler for '${listenerName}':`, cbErr);
      }
    }
  };
}

// Global browser window event listeners to suppress unhandled Firestore quota / transient offline errors
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    const msg = event?.message || '';
    const errStr = String(event?.error || '');
    if (
      msg.includes('resource-exhausted') ||
      msg.includes('Quota limit exceeded') ||
      errStr.includes('resource-exhausted') ||
      errStr.includes('Quota limit exceeded') ||
      (msg.includes('@firebase/firestore') && msg.includes('Quota'))
    ) {
      markFirestoreQuotaExhausted(true);
      event.preventDefault();
      event.stopPropagation();
    } else if (
      msg.includes('Could not reach Cloud Firestore backend') ||
      msg.includes('[code=unavailable]') ||
      errStr.includes('[code=unavailable]')
    ) {
      event.preventDefault();
      event.stopPropagation();
    }
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event?.reason;
    const msg = reason?.message || String(reason || '');
    if (
      msg.includes('resource-exhausted') ||
      msg.includes('Quota limit exceeded') ||
      msg.includes('quota metric') ||
      (msg.includes('@firebase/firestore') && msg.includes('Quota'))
    ) {
      markFirestoreQuotaExhausted(true);
      event.preventDefault();
    } else if (
      msg.includes('Could not reach Cloud Firestore backend') ||
      msg.includes('[code=unavailable]') ||
      msg.includes('client is offline')
    ) {
      event.preventDefault();
    }
  });
}
