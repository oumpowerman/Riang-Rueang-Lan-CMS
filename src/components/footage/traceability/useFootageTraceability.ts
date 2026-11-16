import { useCallback, useEffect, useMemo, useState } from 'react';
import { useCMS } from '../../../context/CMSContext';
import { useDebouncedCloudSync } from '../../../hooks/useDebouncedCloudSync';
import type { ComputedFootage, Footage } from '../../../types/footage.types';
import { buildFootageCatchphraseUpdate } from '../../../utils/episodeScriptGenerator';
import { generateStandardFileName } from '../../../utils/fileNameGenerator';
import { CoUsedPartnerEntry, TraceabilityTabId } from './traceability.types';

const TRACEABILITY_DEBOUNCE_MS = 550;

export function useFootageTraceability() {
  const {
    traceabilityFootageId,
    setTraceabilityFootageId,
    computedFootageMap,
    tagMap,
    sourceMap,
    settings,
    updateFootage,
    openSourceSplitterFor,
    setSelectedEpisodeDetailId,
  } = useCMS();

  const [activeTab, setActiveTab] =
    useState<TraceabilityTabId>('DETAILS_AND_TAGS');
  const [copiedFileName, setCopiedFileName] = useState(false);

  const {
    summary: syncSummary,
    getItemDraft,
    getItemStatus,
    scheduleUpdate,
    flushItem,
    flushAll,
    retryItem,
    retryAllFailed,
    resetSession,
  } = useDebouncedCloudSync<Footage>({
    delayMs: TRACEABILITY_DEBOUNCE_MS,
    onCommit: updateFootage,
  });

  const baseFootage = traceabilityFootageId
    ? computedFootageMap[traceabilityFootageId] || null
    : null;

  // Merge active local draft so inputs remain 0ms responsive without Firestore snapshot jitter
  const footage = useMemo<ComputedFootage | null>(() => {
    if (!baseFootage) return null;
    const draft = getItemDraft(baseFootage.id);
    if (!draft) return baseFootage;
    const nextTitle = draft.title !== undefined ? draft.title : baseFootage.title;
    return {
      ...baseFootage,
      ...draft,
      standardFileName: generateStandardFileName(baseFootage.id, nextTitle),
    };
  }, [baseFootage, getItemDraft]);

  // Reset copied state when switching footage; reset session when modal fully closes
  useEffect(() => {
    setCopiedFileName(false);
    if (!traceabilityFootageId) {
      resetSession();
    }
  }, [traceabilityFootageId, resetSession]);

  const handleClose = useCallback(() => {
    void flushAll();
    setTraceabilityFootageId(null);
  }, [flushAll, setTraceabilityFootageId]);

  // Close on Escape key (flush pending edits first)
  useEffect(() => {
    if (!baseFootage) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [baseFootage, handleClose]);

  const parentSource = useMemo(() => {
    if (!footage?.sourceId) return null;
    return sourceMap[footage.sourceId] || null;
  }, [footage, sourceMap]);

  const coUsedEntries = useMemo<CoUsedPartnerEntry[]>(() => {
    if (!footage) return [];
    return Object.entries(footage.coUsedWithMap)
      .map(([partnerId, count]) => ({
        partner: computedFootageMap[partnerId],
        partnerId,
        count,
      }))
      .filter((entry): entry is CoUsedPartnerEntry => Boolean(entry.partner))
      .sort((a, b) => b.count - a.count);
  }, [footage, computedFootageMap]);

  const handleOpenParentSource = () => {
    if (!parentSource) return;
    void flushAll();
    setTraceabilityFootageId(null);
    openSourceSplitterFor(parentSource);
  };

  const handleSelectEpisode = (episodeId: string) => {
    void flushAll();
    setTraceabilityFootageId(null);
    setSelectedEpisodeDetailId(episodeId);
  };

  const handleSelectPartnerFootage = (partnerId: string) => {
    void flushAll();
    setTraceabilityFootageId(partnerId);
  };

  const handleCopyFileName = () => {
    if (!footage) return;
    navigator.clipboard?.writeText(footage.standardFileName);
    setCopiedFileName(true);
    setTimeout(() => setCopiedFileName(false), 1800);
  };

  const handleUpdateTitle = (title: string) => {
    if (!footage) return;
    scheduleUpdate(footage.id, {
      title,
      standardFileName: generateStandardFileName(footage.id, title),
    });
  };

  const handleUpdatePunchlineNote = (punchlineNote: string) => {
    if (!footage) return;
    const synced = buildFootageCatchphraseUpdate(footage, { punchlineNote });
    scheduleUpdate(footage.id, synced);
  };

  const handleUpdateRankTitle = (rankTitle: string) => {
    if (!footage) return;
    const synced = buildFootageCatchphraseUpdate(footage, { rankTitle });
    scheduleUpdate(footage.id, synced);
  };

  const handleUpdateMascotNotes = (mascotNotes: string) => {
    if (!footage) return;
    const synced = buildFootageCatchphraseUpdate(footage, { mascotNotes });
    scheduleUpdate(footage.id, synced);
  };

  const handleUpdateOriginalUrl = (originalUrl: string, immediate = false) => {
    if (!footage) return;
    scheduleUpdate(footage.id, { originalUrl }, { immediate });
  };

  const handleUpdateDriveFileUrl = (driveFileUrl: string, immediate = false) => {
    if (!footage) return;
    scheduleUpdate(footage.id, { driveFileUrl }, { immediate });
  };

  const handleUpdateTags = (tags: string[]) => {
    if (!footage) return;
    scheduleUpdate(footage.id, { tags }, { immediate: true });
  };

  const handleFlushCurrent = () => {
    if (!footage) return;
    void flushItem(footage.id);
  };

  const handleFlushAll = () => {
    void flushAll();
  };

  const handleRetryAllFailed = () => {
    void retryAllFailed();
  };

  const currentSyncStatus = footage
    ? getItemStatus(footage.id)
    : { state: 'IDLE' as const };

  return {
    footage,
    parentSource,
    coUsedEntries,
    tagMap,
    settings,
    activeTab,
    setActiveTab,
    copiedFileName,
    syncSummary,
    currentSyncStatus,
    debounceMs: TRACEABILITY_DEBOUNCE_MS,
    handleClose,
    handleOpenParentSource,
    handleSelectEpisode,
    handleSelectPartnerFootage,
    handleCopyFileName,
    handleUpdateTitle,
    handleUpdatePunchlineNote,
    handleUpdateRankTitle,
    handleUpdateMascotNotes,
    handleUpdateOriginalUrl,
    handleUpdateDriveFileUrl,
    handleUpdateTags,
    handleFlushCurrent,
    handleFlushAll,
    handleRetryCurrent: () => {
      if (footage) void retryItem(footage.id);
    },
    handleRetryAllFailed,
  };
}
