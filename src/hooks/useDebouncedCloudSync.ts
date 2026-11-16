import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export type CloudSyncState = 'IDLE' | 'PENDING' | 'SAVING' | 'SAVED' | 'ERROR';

export interface CloudSyncItemStatus {
  state: CloudSyncState;
  lastSavedAt?: number;
  errorMessage?: string;
}

export interface CloudSyncSessionSummary {
  pendingCount: number;
  savingCount: number;
  errorCount: number;
  savedCount: number;
  lastSyncedAt: number | null;
  overallState: CloudSyncState;
}

export interface CloudSyncCommitResult {
  ok: boolean;
  error?: string;
}

interface UseDebouncedCloudSyncOptions<T extends Record<string, any>> {
  delayMs?: number;
  onCommit: (id: string, patch: Partial<T>) => Promise<CloudSyncCommitResult>;
}

/**
 * Reusable Debounced Auto-Save Hook with Local Draft Buffering & Real Cloud Sync Status.
 *
 * - Keeps typed changes in an instant 0ms local draft map so UI inputs never stutter
 *   from Firestore real-time snapshots while typing.
 * - Debounces continuous typing by `delayMs` (default 550ms).
 * - Supports immediate flush on Paste / Blur / Modal Close.
 * - Tracks per-item and overall session status: IDLE | PENDING | SAVING | SAVED | ERROR.
 * - Guards against async race conditions via per-item sequence numbers.
 */
export function useDebouncedCloudSync<T extends Record<string, any>>({
  delayMs = 550,
  onCommit,
}: UseDebouncedCloudSyncOptions<T>) {
  const [drafts, setDrafts] = useState<Record<string, Partial<T>>>({});
  const [statusMap, setStatusMap] = useState<Record<string, CloudSyncItemStatus>>({});

  const draftsRef = useRef<Record<string, Partial<T>>>({});
  const failedPayloadsRef = useRef<Record<string, Partial<T>>>({});
  const statusMapRef = useRef<Record<string, CloudSyncItemStatus>>({});
  const timersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const seqRef = useRef<Record<string, number>>({});
  const onCommitRef = useRef(onCommit);
  onCommitRef.current = onCommit;

  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const setItemStatus = useCallback(
    (id: string, nextStatus: CloudSyncItemStatus) => {
      statusMapRef.current = {
        ...statusMapRef.current,
        [id]: nextStatus,
      };
      if (isMountedRef.current) {
        setStatusMap(statusMapRef.current);
      }
    },
    []
  );

  const clearTimer = useCallback((id: string) => {
    const existingTimer = timersRef.current[id];
    if (existingTimer) {
      clearTimeout(existingTimer);
      delete timersRef.current[id];
    }
  }, []);

  const flushItem = useCallback(
    async (id: string): Promise<boolean> => {
      clearTimer(id);

      const pendingDraft = draftsRef.current[id];
      const failedDraft = failedPayloadsRef.current[id];
      const patchToCommit: Partial<T> | undefined = pendingDraft
        ? { ...(failedDraft || {}), ...pendingDraft }
        : failedDraft
        ? { ...failedDraft }
        : undefined;

      if (!patchToCommit || Object.keys(patchToCommit).length === 0) {
        return true;
      }

      const seq = (seqRef.current[id] || 0) + 1;
      seqRef.current[id] = seq;

      const prevStatus = statusMapRef.current[id];
      setItemStatus(id, {
        state: 'SAVING',
        lastSavedAt: prevStatus?.lastSavedAt,
        errorMessage: undefined,
      });

      try {
        const result = await onCommitRef.current(id, patchToCommit);

        // If user edited again while this request was in-flight, let the newer request own state
        if (seqRef.current[id] !== seq) {
          return result.ok;
        }

        if (result.ok) {
          if (draftsRef.current[id]) {
            const nextDrafts = { ...draftsRef.current };
            delete nextDrafts[id];
            draftsRef.current = nextDrafts;
            if (isMountedRef.current) {
              setDrafts(nextDrafts);
            }
          }
          if (failedPayloadsRef.current[id]) {
            const nextFailed = { ...failedPayloadsRef.current };
            delete nextFailed[id];
            failedPayloadsRef.current = nextFailed;
          }

          setItemStatus(id, {
            state: 'SAVED',
            lastSavedAt: Date.now(),
            errorMessage: undefined,
          });
          return true;
        }

        failedPayloadsRef.current = {
          ...failedPayloadsRef.current,
          [id]: patchToCommit,
        };
        setItemStatus(id, {
          state: 'ERROR',
          lastSavedAt: prevStatus?.lastSavedAt,
          errorMessage: result.error || 'บันทึกขึ้น Cloud ไม่สำเร็จ',
        });
        return false;
      } catch (err) {
        if (seqRef.current[id] !== seq) {
          return false;
        }
        failedPayloadsRef.current = {
          ...failedPayloadsRef.current,
          [id]: patchToCommit,
        };
        setItemStatus(id, {
          state: 'ERROR',
          lastSavedAt: prevStatus?.lastSavedAt,
          errorMessage:
            err instanceof Error && err.message
              ? err.message
              : 'บันทึกขึ้น Cloud ไม่สำเร็จ',
        });
        return false;
      }
    },
    [clearTimer, setItemStatus]
  );

  const scheduleUpdate = useCallback(
    (id: string, patch: Partial<T>, options?: { immediate?: boolean }) => {
      clearTimer(id);

      // Advance sequence so any older in-flight commit cannot overwrite this newer edit
      seqRef.current[id] = (seqRef.current[id] || 0) + 1;

      const mergedPatch: Partial<T> = {
        ...(draftsRef.current[id] || {}),
        ...patch,
      };
      draftsRef.current = {
        ...draftsRef.current,
        [id]: mergedPatch,
      };
      if (isMountedRef.current) {
        setDrafts(draftsRef.current);
      }

      if (options?.immediate) {
        void flushItem(id);
        return;
      }

      const prevStatus = statusMapRef.current[id];
      setItemStatus(id, {
        state: 'PENDING',
        lastSavedAt: prevStatus?.lastSavedAt,
        errorMessage: undefined,
      });

      timersRef.current[id] = setTimeout(() => {
        delete timersRef.current[id];
        void flushItem(id);
      }, delayMs);
    },
    [clearTimer, delayMs, flushItem, setItemStatus]
  );

  const flushAll = useCallback(async (): Promise<void> => {
    const ids = Array.from(
      new Set([
        ...Object.keys(timersRef.current),
        ...Object.keys(draftsRef.current),
      ])
    );
    if (ids.length === 0) return;
    await Promise.all(ids.map((id) => flushItem(id)));
  }, [flushItem]);

  const retryItem = useCallback(
    (id: string): Promise<boolean> => {
      return flushItem(id);
    },
    [flushItem]
  );

  const retryAllFailed = useCallback(async (): Promise<void> => {
    const errorIds = Object.entries(statusMapRef.current)
      .filter(([, st]) => st.state === 'ERROR')
      .map(([id]) => id);
    if (errorIds.length === 0) return;
    await Promise.all(errorIds.map((id) => flushItem(id)));
  }, [flushItem]);

  const resetSession = useCallback(() => {
    Object.values(timersRef.current).forEach((t) => clearTimeout(t));
    timersRef.current = {};
    draftsRef.current = {};
    failedPayloadsRef.current = {};
    statusMapRef.current = {};
    seqRef.current = {};
    if (isMountedRef.current) {
      setDrafts({});
      setStatusMap({});
    }
  }, []);

  // Flush any remaining pending timers if component unmounts unexpectedly
  useEffect(() => {
    return () => {
      const pendingIds = Array.from(
        new Set([
          ...Object.keys(timersRef.current),
          ...Object.keys(draftsRef.current),
        ])
      );
      Object.values(timersRef.current).forEach((t) => clearTimeout(t));
      timersRef.current = {};
      for (const id of pendingIds) {
        const patch = draftsRef.current[id];
        if (patch && Object.keys(patch).length > 0) {
          void onCommitRef.current(id, patch);
        }
      }
    };
  }, []);

  const getFieldValue = useCallback(
    <K extends keyof T>(id: string, field: K, fallback: T[K]): T[K] => {
      const draft = drafts[id];
      if (draft && draft[field] !== undefined) {
        return draft[field] as T[K];
      }
      return fallback;
    },
    [drafts]
  );

  const getItemDraft = useCallback(
    (id: string): Partial<T> | undefined => drafts[id],
    [drafts]
  );

  const getItemStatus = useCallback(
    (id: string): CloudSyncItemStatus =>
      statusMap[id] || { state: 'IDLE' },
    [statusMap]
  );

  const summary = useMemo<CloudSyncSessionSummary>(() => {
    let pendingCount = 0;
    let savingCount = 0;
    let errorCount = 0;
    let savedCount = 0;
    let lastSyncedAt: number | null = null;

    Object.values(statusMap).forEach((st) => {
      if (st.state === 'PENDING') pendingCount += 1;
      else if (st.state === 'SAVING') savingCount += 1;
      else if (st.state === 'ERROR') errorCount += 1;
      else if (st.state === 'SAVED') savedCount += 1;

      if (st.lastSavedAt && (!lastSyncedAt || st.lastSavedAt > lastSyncedAt)) {
        lastSyncedAt = st.lastSavedAt;
      }
    });

    let overallState: CloudSyncState = 'IDLE';
    if (errorCount > 0) overallState = 'ERROR';
    else if (savingCount > 0) overallState = 'SAVING';
    else if (pendingCount > 0) overallState = 'PENDING';
    else if (savedCount > 0) overallState = 'SAVED';

    return {
      pendingCount,
      savingCount,
      errorCount,
      savedCount,
      lastSyncedAt,
      overallState,
    };
  }, [statusMap]);

  return {
    drafts,
    statusMap,
    summary,
    getFieldValue,
    getItemDraft,
    getItemStatus,
    scheduleUpdate,
    flushItem,
    flushAll,
    retryItem,
    retryAllFailed,
    resetSession,
  };
}
