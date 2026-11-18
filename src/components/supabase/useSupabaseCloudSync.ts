import { useEffect, useState, useRef, useCallback } from 'react';
import {
  SupabaseConnectionConfig,
  SupabaseRowDraftOverride,
  SupabaseSyncRowState,
} from '../../types/supabaseSync.types';
import {
  loadSupabaseConfig,
  normalizeSupabaseConfig,
  saveSupabaseConfig,
  loadSupabaseRowDrafts,
  loadSupabaseRowDraftsAsync,
  saveSupabaseRowDrafts,
  clearSupabaseRowDrafts,
  extractRowDraftOverride,
} from '../../services/supabaseService';
import { firestoreService } from '../../firebase/firestoreService';

export function useSupabaseCloudSync(isOpen: boolean) {
  const [config, setConfig] = useState<SupabaseConnectionConfig>(loadSupabaseConfig);
  const [rowDrafts, setRowDrafts] = useState<Record<string, SupabaseRowDraftOverride>>(
    loadSupabaseRowDrafts
  );
  const [isCloudSynced, setIsCloudSynced] = useState(false);
  const [isCloudDraftsCompacted, setIsCloudDraftsCompacted] = useState(false);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Subscribe to Firestore `system_settings/supabase_config` and `system_settings/supabase_row_drafts`
  useEffect(() => {
    const unsubConfig = firestoreService.subscribeSupabaseConfig(
      (cloudConfig) => {
        setIsCloudSynced(true);
        const localConfig = loadSupabaseConfig();

        if (cloudConfig && (cloudConfig.url || cloudConfig.anonKey)) {
          const normalized = normalizeSupabaseConfig(cloudConfig);
          saveSupabaseConfig(normalized, false);
          setConfig(normalized);
        } else if (localConfig.url && localConfig.anonKey) {
          saveSupabaseConfig(localConfig, true);
          setConfig(localConfig);
        }
      },
      (err) => {
        console.warn('Supabase cloud config subscription warning:', err);
      }
    );

    const unsubDrafts = firestoreService.subscribeSupabaseRowDrafts(
      (cloudDrafts) => {
        setIsCloudSynced(true);
        if (cloudDrafts !== null) {
          saveSupabaseRowDrafts(cloudDrafts, false);
          setRowDrafts(cloudDrafts);
        } else {
          void loadSupabaseRowDraftsAsync().then((localDrafts) => {
            if (Object.keys(localDrafts).length > 0) {
              saveSupabaseRowDrafts(localDrafts, true);
              setRowDrafts(localDrafts);
            }
          });
        }
      },
      (err) => {
        console.warn('Supabase row drafts subscription warning:', err);
      }
    );

    return () => {
      unsubConfig();
      unsubDrafts();
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Re-sync local / IndexedDB state when modal opens
  useEffect(() => {
    if (!isOpen) return;
    setConfig(loadSupabaseConfig());
    setIsCloudDraftsCompacted(false);
    void loadSupabaseRowDraftsAsync().then((drafts) => {
      setRowDrafts(drafts);
    });
  }, [isOpen]);

  // Update config locally + persist immediately to Firestore (for toggle switches & timestamps)
  const updateConfigAndSync = useCallback(
    (
      updater:
        | Partial<SupabaseConnectionConfig>
        | ((prev: SupabaseConnectionConfig) => SupabaseConnectionConfig)
    ) => {
      setConfig((prev) => {
        const rawNext =
          typeof updater === 'function' ? updater(prev) : { ...prev, ...updater };
        const normalized = normalizeSupabaseConfig(rawNext);
        saveSupabaseConfig(normalized, true);
        return normalized;
      });
    },
    []
  );

  // Persist overrides locally (IndexedDB + safe localStorage) immediately & debounce to Cloud (1 MB safe)
  const persistRowsToDrafts = useCallback(
    (updatedRows: SupabaseSyncRowState[], currentConfig: SupabaseConnectionConfig) => {
      const nextDrafts: Record<string, SupabaseRowDraftOverride> = {};

      for (let i = 0; i < updatedRows.length; i++) {
        const row = updatedRows[i];
        const override = extractRowDraftOverride(row, currentConfig);
        if (override) {
          nextDrafts[row.episode.id] = override;
        }
      }

      setRowDrafts(nextDrafts);
      saveSupabaseRowDrafts(nextDrafts, false);

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        void firestoreService.saveSupabaseRowDraftsToCloud(nextDrafts).then((res) => {
          setIsCloudDraftsCompacted(res.truncated);
        });
      }, 450);
    },
    []
  );

  const handleResetAllRowDrafts = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    setRowDrafts({});
    setIsCloudDraftsCompacted(false);
    clearSupabaseRowDrafts(true);
  }, []);

  return {
    config,
    setConfig,
    updateConfigAndSync,
    rowDrafts,
    isCloudSynced,
    isCloudDraftsCompacted,
    persistRowsToDrafts,
    handleResetAllRowDrafts,
  };
}
