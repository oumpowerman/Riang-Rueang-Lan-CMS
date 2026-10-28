import { useEffect, useMemo, useState } from 'react';
import { useCMS } from '../../../context/CMSContext';
import { generateStandardFileName } from '../../../utils/fileNameGenerator';
import { CoUsedPartnerEntry, TraceabilityTabId } from './traceability.types';

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

  const footage = traceabilityFootageId
    ? computedFootageMap[traceabilityFootageId] || null
    : null;

  // Reset copied state when switching footage
  useEffect(() => {
    setCopiedFileName(false);
  }, [traceabilityFootageId]);

  // Close on Escape key
  useEffect(() => {
    if (!footage) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setTraceabilityFootageId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [footage, setTraceabilityFootageId]);

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

  const handleClose = () => {
    setTraceabilityFootageId(null);
  };

  const handleOpenParentSource = () => {
    if (!parentSource) return;
    setTraceabilityFootageId(null);
    openSourceSplitterFor(parentSource);
  };

  const handleSelectEpisode = (episodeId: string) => {
    setTraceabilityFootageId(null);
    setSelectedEpisodeDetailId(episodeId);
  };

  const handleSelectPartnerFootage = (partnerId: string) => {
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
    updateFootage(footage.id, {
      title,
      standardFileName: generateStandardFileName(footage.id, title),
    });
  };

  const handleUpdateMascotNotes = (mascotNotes: string) => {
    if (!footage) return;
    updateFootage(footage.id, { mascotNotes });
  };

  const handleUpdateOriginalUrl = (originalUrl: string) => {
    if (!footage) return;
    updateFootage(footage.id, { originalUrl });
  };

  const handleUpdateDriveFileUrl = (driveFileUrl: string) => {
    if (!footage) return;
    updateFootage(footage.id, { driveFileUrl });
  };

  const handleUpdateTags = (tags: string[]) => {
    if (!footage) return;
    updateFootage(footage.id, { tags });
  };

  return {
    footage,
    parentSource,
    coUsedEntries,
    tagMap,
    settings,
    activeTab,
    setActiveTab,
    copiedFileName,
    handleClose,
    handleOpenParentSource,
    handleSelectEpisode,
    handleSelectPartnerFootage,
    handleCopyFileName,
    handleUpdateTitle,
    handleUpdateMascotNotes,
    handleUpdateOriginalUrl,
    handleUpdateDriveFileUrl,
    handleUpdateTags,
  };
}
