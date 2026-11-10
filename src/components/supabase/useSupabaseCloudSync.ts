import { useEffect, useState, useRef, useCallback } from 'react';
import {
  SupabaseConnectionConfig,
  SupabaseRowDraftOverride,
  SupabaseSyncRowState,
} from '../../types/supabaseSync.types';
import {
  loadSupabaseConfig,
  saveSupabaseConfig,
  loadSupabaseRowDrafts,
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
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Subscribe to Firestore `system_settings/supabase_config` and `system_settings/supabase_row_drafts`
  useEffect(() => {
    const unsubConfig = firestoreService.subscribeSupabaseConfig(
      (cloudConfig) => {
        setIsCloudSynced(true);
        const localConfig = loadSupabaseConfig();

        if (cloudConfig && (cloudConfig.url || cloudConfig.anonKey)) {
          // Update local storage and state with authoritative Cloud config
          saveSupabaseConfig(cloudConfig, false);
          setConfig(cloudConfig);
        } else if (localConfig.url && localConfig.anonKey) {
          // Auto-migrate existing local config up to Cloud so other devices immediately receive it
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
        const localDrafts = loadSupabaseRowDrafts();

        if (cloudDrafts !== null) {
          saveSupabaseRowDrafts(cloudDrafts, false);
          setRowDrafts(cloudDrafts);
        } else if (Object.keys(localDrafts).length > 0) {
          // Auto-migrate existing local row drafts up to Cloud
          saveSupabaseRowDrafts(localDrafts, true);
          setRowDrafts(localDrafts);
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

  // Re-sync local state when modal opens
  useEffect(() => {
    if (isOpen) {
      setConfig(loadSupabaseConfig());
      setRowDrafts(loadSupabaseRowDrafts());
    }
  }, [isOpen]);

  // Persist a single row or multiple rows' overrides to localStorage immediately & debounce to Cloud
  const persistRowsToDrafts = useCallback(
    (updatedRows: SupabaseSyncRowState[], currentConfig: SupabaseConnectionConfig) => {
      const nextDrafts: Record<string, SupabaseRowDraftOverride> = {};

      updatedRows.forEach((row) => {
        const override = extractRowDraftOverride(row, currentConfig);
        if (override) {
          nextDrafts[row.episode.id] = override;
        }
      });

      setRowDrafts(nextDrafts);
      saveSupabaseRowDrafts(nextDrafts, false);

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        void firestoreService.saveSupabaseRowDraftsToCloud(nextDrafts);
      }, 450);
    },
    []
  );

  const handleResetAllRowDrafts = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    setRowDrafts({});
    clearSupabaseRowDrafts(true);
  }, []);

  return {
    config,
    setConfig,
    rowDrafts,
    isCloudSynced,
    persistRowsToDrafts,
    handleResetAllRowDrafts,
  };
}
