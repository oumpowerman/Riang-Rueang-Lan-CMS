import React, { Dispatch, SetStateAction, useCallback } from 'react';
import { Episode } from '../../types/episode.types';
import {
  SupabaseConnectionConfig,
  SupabaseSyncRowState,
} from '../../types/supabaseSync.types';
import {
  findEpisodeMatchInLookup,
  SupabaseMatchedLookup,
} from './supabaseRowMatcher';

interface UseSupabaseSyncRowActionsParams {
  config: SupabaseConnectionConfig;
  filteredRows: SupabaseSyncRowState[];
  setRows: Dispatch<SetStateAction<SupabaseSyncRowState[]>>;
  persistRowsToDrafts: (
    updatedRows: SupabaseSyncRowState[],
    currentConfig: SupabaseConnectionConfig
  ) => void;
  handleResetAllRowDrafts: () => void;
  onPersistEpisodeSyncUpdates: (updatedEpisodes: Episode[]) => Promise<void>;
  matchedRecordLookupRef: React.MutableRefObject<SupabaseMatchedLookup | null>;
}

export function useSupabaseSyncRowActions({
  config,
  filteredRows,
  setRows,
  persistRowsToDrafts,
  handleResetAllRowDrafts,
  onPersistEpisodeSyncUpdates,
  matchedRecordLookupRef,
}: UseSupabaseSyncRowActionsParams) {
  const applyRowsUpdate = useCallback(
    (updater: (prev: SupabaseSyncRowState[]) => SupabaseSyncRowState[]) => {
      setRows((prev) => {
        const next = updater(prev);
        persistRowsToDrafts(next, config);
        return next;
      });
    },
    [config, persistRowsToDrafts, setRows]
  );

  const handleSelectOnlyFiltered = useCallback(() => {
    const filteredIds = new Set(filteredRows.map((fr) => fr.episode.id));
    applyRowsUpdate((prev) =>
      prev.map((r) => ({ ...r, isSelected: filteredIds.has(r.episode.id) }))
    );
  }, [filteredRows, applyRowsUpdate]);

  const handleSelectAllFiltered = useCallback(() => {
    const filteredIds = new Set(filteredRows.map((fr) => fr.episode.id));
    applyRowsUpdate((prev) =>
      prev.map((r) =>
        filteredIds.has(r.episode.id) ? { ...r, isSelected: true } : r
      )
    );
  }, [filteredRows, applyRowsUpdate]);

  const handleDeselectFiltered = useCallback(() => {
    const filteredIds = new Set(filteredRows.map((fr) => fr.episode.id));
    applyRowsUpdate((prev) =>
      prev.map((r) =>
        filteredIds.has(r.episode.id) ? { ...r, isSelected: false } : r
      )
    );
  }, [filteredRows, applyRowsUpdate]);

  const handleClearSelectionsOutsideFilter = useCallback(() => {
    const filteredIds = new Set(filteredRows.map((fr) => fr.episode.id));
    applyRowsUpdate((prev) =>
      prev.map((r) =>
        !filteredIds.has(r.episode.id) && r.isSelected
          ? { ...r, isSelected: false }
          : r
      )
    );
  }, [filteredRows, applyRowsUpdate]);

  const handleSelectAllNew = useCallback(() => {
    applyRowsUpdate((prev) =>
      prev.map((r) => ({ ...r, isSelected: r.matchStatus === 'NEW' }))
    );
  }, [applyRowsUpdate]);

  const handleSelectAll = useCallback(() => {
    applyRowsUpdate((prev) => prev.map((r) => ({ ...r, isSelected: true })));
  }, [applyRowsUpdate]);

  const handleDeselectAll = useCallback(() => {
    applyRowsUpdate((prev) => prev.map((r) => ({ ...r, isSelected: false })));
  }, [applyRowsUpdate]);

  const handleResetRowsToDefaults = useCallback(() => {
    handleResetAllRowDrafts();
    const defaultPlatforms =
      config.defaultTargetPlatforms && config.defaultTargetPlatforms.length > 0
        ? config.defaultTargetPlatforms
        : ['YOUTUBE', 'FACEBOOK', 'TIKTOK', 'INSTAGRAM'];

    setRows((prev) =>
      prev.map((r) => ({
        ...r,
        isSelected: r.matchStatus === 'NEW',
        channelId:
          r.episode.supabaseSyncInfo?.channelId || config.targetChannelId || '',
        status: config.defaultStatus || '01_IDEA/DRAFT_💡',
        targetPlatforms: defaultPlatforms,
        includeAssets: config.defaultIncludeAssets,
        includePillar: Boolean(config.defaultIncludePillar),
        includeCategory: Boolean(config.defaultIncludeCategory),
        description: '',
        upsertMode: 'SKIP',
      }))
    );
  }, [config, handleResetAllRowDrafts, setRows]);

  const handleUpdateRow = useCallback(
    (episodeId: string, updates: Partial<SupabaseSyncRowState>) => {
      applyRowsUpdate((prev) =>
        prev.map((r) => (r.episode.id === episodeId ? { ...r, ...updates } : r))
      );
    },
    [applyRowsUpdate]
  );

  const handleToggleSelectRow = useCallback(
    (episodeId: string) => {
      applyRowsUpdate((prev) =>
        prev.map((r) =>
          r.episode.id === episodeId ? { ...r, isSelected: !r.isSelected } : r
        )
      );
    },
    [applyRowsUpdate]
  );

  const handleBatchSetStatus = useCallback(
    (newStatus: string) => {
      applyRowsUpdate((prev) =>
        prev.map((r) => (r.isSelected ? { ...r, status: newStatus } : r))
      );
    },
    [applyRowsUpdate]
  );

  const handleBatchSetChannel = useCallback(
    (newChannelId: string) => {
      applyRowsUpdate((prev) =>
        prev.map((r) => (r.isSelected ? { ...r, channelId: newChannelId } : r))
      );
    },
    [applyRowsUpdate]
  );

  const handleBatchToggleAssets = useCallback(
    (include: boolean) => {
      applyRowsUpdate((prev) =>
        prev.map((r) => (r.isSelected ? { ...r, includeAssets: include } : r))
      );
    },
    [applyRowsUpdate]
  );

  const handleBatchSetPillar = useCallback(
    (include: boolean) => {
      applyRowsUpdate((prev) =>
        prev.map((r) => (r.isSelected ? { ...r, includePillar: include } : r))
      );
    },
    [applyRowsUpdate]
  );

  const handleBatchSetCategory = useCallback(
    (include: boolean) => {
      applyRowsUpdate((prev) =>
        prev.map((r) => (r.isSelected ? { ...r, includeCategory: include } : r))
      );
    },
    [applyRowsUpdate]
  );

  const handleBatchTogglePlatform = useCallback(
    (platformId: string) => {
      applyRowsUpdate((prev) =>
        prev.map((r) => {
          if (!r.isSelected) return r;
          const currentList = r.targetPlatforms || [];
          const isSelected = currentList.includes(platformId);
          const updated = isSelected
            ? currentList.filter((p) => p !== platformId)
            : [...currentList, platformId];
          return {
            ...r,
            targetPlatforms: updated.length > 0 ? updated : [platformId],
          };
        })
      );
    },
    [applyRowsUpdate]
  );

  const handleMarkAsSent = useCallback(
    async (episodeId: string) => {
      let episodeToPersist: Episode | null = null;
      applyRowsUpdate((prev) =>
        prev.map((r) => {
          if (r.episode.id !== episodeId) return r;
          const syncedAtIso = new Date().toISOString();
          const manualStampId =
            r.existingRecordId || `MANUAL_STAMP_${r.episode.id}`;
          const updatedEp: Episode = {
            ...r.episode,
            supabaseSyncInfo: {
              recordId: manualStampId,
              syncedAt: syncedAtIso,
              channelId: r.channelId || '',
              status: r.status || '',
              isManuallyMarked: true,
            },
          };
          episodeToPersist = updatedEp;
          return {
            ...r,
            episode: updatedEp,
            matchStatus: 'SENT',
            isSelected: false,
            existingRecordId: manualStampId,
            existingCreatedAt: syncedAtIso,
            existingStatus: r.status || 'MANUALLY_MARKED',
          };
        })
      );
      if (episodeToPersist) {
        await onPersistEpisodeSyncUpdates([episodeToPersist]);
      }
    },
    [applyRowsUpdate, onPersistEpisodeSyncUpdates]
  );

  const handleUnmarkSent = useCallback(
    async (episodeId: string) => {
      let episodeToPersist: Episode | null = null;
      applyRowsUpdate((prev) =>
        prev.map((r) => {
          if (r.episode.id !== episodeId) return r;
          const { supabaseSyncInfo: _removed, ...cleanEp } = r.episode;
          const updatedEp: Episode = cleanEp as Episode;
          episodeToPersist = updatedEp;

          const outcome = findEpisodeMatchInLookup(
            updatedEp,
            matchedRecordLookupRef.current
          );
          const newStatus = outcome.matchedRecord
            ? outcome.matchedViaEpRef
              ? 'SENT'
              : 'DUPLICATE'
            : 'NEW';

          return {
            ...r,
            episode: updatedEp,
            matchStatus: newStatus,
            isSelected: newStatus === 'NEW',
            existingRecordId: outcome.matchedRecord?.id,
            existingCreatedAt: outcome.matchedRecord?.created_at,
            existingStatus: outcome.matchedRecord?.status,
          };
        })
      );
      if (episodeToPersist) {
        await onPersistEpisodeSyncUpdates([episodeToPersist]);
      }
    },
    [applyRowsUpdate, matchedRecordLookupRef, onPersistEpisodeSyncUpdates]
  );

  const handleBatchMarkAsSent = useCallback(async () => {
    const episodesToPersist: Episode[] = [];
    const syncedAtIso = new Date().toISOString();

    applyRowsUpdate((prev) =>
      prev.map((r) => {
        if (!r.isSelected) return r;
        const manualStampId =
          r.existingRecordId || `MANUAL_STAMP_${r.episode.id}`;
        const updatedEp: Episode = {
          ...r.episode,
          supabaseSyncInfo: {
            recordId: manualStampId,
            syncedAt: syncedAtIso,
            channelId: r.channelId || '',
            status: r.status || '',
            isManuallyMarked: true,
          },
        };
        episodesToPersist.push(updatedEp);
        return {
          ...r,
          episode: updatedEp,
          matchStatus: 'SENT',
          isSelected: false,
          existingRecordId: manualStampId,
          existingCreatedAt: syncedAtIso,
          existingStatus: r.status || 'MANUALLY_MARKED',
        };
      })
    );

    if (episodesToPersist.length > 0) {
      await onPersistEpisodeSyncUpdates(episodesToPersist);
    }
  }, [applyRowsUpdate, onPersistEpisodeSyncUpdates]);

  return {
    applyRowsUpdate,
    handleSelectOnlyFiltered,
    handleSelectAllFiltered,
    handleDeselectFiltered,
    handleClearSelectionsOutsideFilter,
    handleSelectAllNew,
    handleSelectAll,
    handleDeselectAll,
    handleResetRowsToDefaults,
    handleUpdateRow,
    handleToggleSelectRow,
    handleBatchSetStatus,
    handleBatchSetChannel,
    handleBatchTogglePlatform,
    handleBatchToggleAssets,
    handleBatchSetPillar,
    handleBatchSetCategory,
    handleMarkAsSent,
    handleUnmarkSent,
    handleBatchMarkAsSent,
  };
}
