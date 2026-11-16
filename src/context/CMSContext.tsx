import React, { createContext, useContext, useEffect, useRef } from 'react';
import { ArchiveSummaryStats, firestoreService } from '../firebase/firestoreService';
import { idbStorageService } from '../services/idbStorageService';
import { evaluateEpisodeCompleteness } from '../utils/episodeValidator';
import { extractEpisodeSeriesInfo } from '../utils/seriesExtractor';
import {
  ActiveNavTab,
  BuilderPreselectRequest,
  CategoryMatrixStat,
  CMSContextType,
  QuickSortUndoRecord,
  SplitClipDraft,
  SubcategoryStat,
} from './cms/cms.types';
import { useCMSAnalytics } from './cms/useCMSAnalytics';
import { useCMSCategoryActions } from './cms/useCMSCategoryActions';
import { useCMSCloudAndStorageSync } from './cms/useCMSCloudAndStorageSync';
import { useCMSDuplicateMerge } from './cms/useCMSDuplicateMerge';
import { useCMSEpisodeActions } from './cms/useCMSEpisodeActions';
import { useCMSFootageActions } from './cms/useCMSFootageActions';
import { useCMSNavigationState } from './cms/useCMSNavigationState';

export type {
  ActiveNavTab,
  BuilderPreselectRequest,
  CategoryMatrixStat,
  CMSContextType,
  QuickSortUndoRecord,
  SplitClipDraft,
  SubcategoryStat,
};

const CMSContext = createContext<CMSContextType | undefined>(undefined);

export const CMSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Navigation, Global Modals & Cross-View Builder Preselect State
  const navigationState = useCMSNavigationState();

  // 2. Core Data Entities, IndexedDB Persistence & Firestore Cloud Sync
  const {
    categoryGroups,
    setCategoryGroups,
    tags,
    setTags,
    sources,
    setSources,
    footage,
    setFootage,
    episodes,
    setEpisodes,
    settings,
    setSettings,
    serverCounts,
    archiveSummaryStats,
    setArchiveSummaryStats,
    hasFullCloudEpisodesRef,
    hasFullCloudFootageRef,
    isCloudConnected,
    isCloudSynced,
    isSeedingToCloud,
    seedToCloud,
    resetDemoData,
    clearAllClips,
    isClearingClips,
  } = useCMSCloudAndStorageSync(navigationState.setSelectedTagFilter);

  // 3. Computed Analytics, Maps & 2-Tier Category Matrix
  const analytics = useCMSAnalytics({
    categoryGroups,
    tags,
    sources,
    footage,
    episodes,
    settings,
  });

  // 3.5 Background Central Summary Document Sync (system_settings/archive_summary_stats)
  const lastSyncedSummarySigRef = useRef<string>('');
  useEffect(() => {
    if (!hasFullCloudEpisodesRef.current || !hasFullCloudFootageRef.current) {
      return;
    }

    const timer = window.setTimeout(() => {
      let completeEpisodesCount = 0;
      let incompleteEpisodesCount = 0;
      let incompleteFootageEpisodesCount = 0;
      const seriesKeys = new Set<string>();

      for (let i = 0; i < episodes.length; i++) {
        const ep = episodes[i];
        const comp = evaluateEpisodeCompleteness(ep);
        if (comp.isComplete) completeEpisodesCount++;
        else incompleteEpisodesCount++;
        if (!comp.hasFullFiveSlots) incompleteFootageEpisodesCount++;
        seriesKeys.add(extractEpisodeSeriesInfo(ep, analytics.tagMap).seriesKey);
      }

      let usedFootageCount = 0;
      let readyFootageCount = 0;
      let newFootageCount = 0;
      let coolingFootageCount = 0;
      for (let i = 0; i < analytics.computedFootage.length; i++) {
        const ft = analytics.computedFootage[i];
        if (ft.totalUsageCount > 0) usedFootageCount++;
        if (ft.cooldownStatus === 'NEW_UNTOUCHED') newFootageCount++;
        else if (ft.cooldownStatus === 'READY_FRESH') readyFootageCount++;
        else coolingFootageCount++;
      }

      const nextStats: ArchiveSummaryStats = {
        totalEpisodes: episodes.length,
        completeEpisodesCount,
        incompleteEpisodesCount,
        incompleteFootageEpisodesCount,
        distinctSeriesCount: seriesKeys.size,
        totalFootage: analytics.computedFootage.length,
        usedFootageCount,
        readyFootageCount,
        newFootageCount,
        coolingFootageCount,
        untaggedFootageCount: analytics.untaggedFootages.length,
        missingDriveCount: analytics.missingDriveFootages.length,
        totalSources: sources.length,
        updatedAt: new Date().toISOString(),
      };

      const sig = [
        nextStats.totalEpisodes,
        nextStats.completeEpisodesCount,
        nextStats.incompleteEpisodesCount,
        nextStats.incompleteFootageEpisodesCount,
        nextStats.distinctSeriesCount,
        nextStats.totalFootage,
        nextStats.usedFootageCount,
        nextStats.readyFootageCount,
        nextStats.newFootageCount,
        nextStats.coolingFootageCount,
        nextStats.untaggedFootageCount,
        nextStats.missingDriveCount,
        nextStats.totalSources,
      ].join('|');

      if (sig === lastSyncedSummarySigRef.current) return;
      lastSyncedSummarySigRef.current = sig;

      setArchiveSummaryStats(nextStats);
      void idbStorageService.setMeta('archive_summary_stats', nextStats);
      void firestoreService.saveArchiveSummaryStats(nextStats);
    }, 800);

    return () => window.clearTimeout(timer);
  }, [
    episodes,
    analytics.computedFootage,
    analytics.untaggedFootages.length,
    analytics.missingDriveFootages.length,
    analytics.tagMap,
    sources.length,
    hasFullCloudEpisodesRef,
    hasFullCloudFootageRef,
    setArchiveSummaryStats,
  ]);

  // 4. Actions: Tier 0 Category Groups, Tier 1/2 Tags & System Settings
  const categoryActions = useCMSCategoryActions({
    categoryGroups,
    setCategoryGroups,
    tags,
    setTags,
    tagMap: analytics.tagMap,
    footage,
    setFootage,
    sources,
    setSources,
    setSelectedTagFilter: navigationState.setSelectedTagFilter,
    settings,
    setSettings,
  });

  // 5. Actions: Footage Ingestion (Flow A 1:1 & Flow B 1:N) & CRUD
  const footageActions = useCMSFootageActions({
    footage,
    setFootage,
    sources,
    setSources,
    tagMap: analytics.tagMap,
    setSelectedFootageIdsForBatch: navigationState.setSelectedFootageIdsForBatch,
    setActiveDragFootageIds: navigationState.setActiveDragFootageIds,
  });

  // 6. Actions: Episodes & Master Archive CRUD
  const episodeActions = useCMSEpisodeActions({
    episodes,
    setEpisodes,
  });

  // 7. Actions: Atomic Duplicate Footage Merge & Reference Migration
  const duplicateMergeActions = useCMSDuplicateMerge({
    footage,
    setFootage,
    episodes,
    setEpisodes,
    sources,
    setSources,
    setSelectedFootageIdsForBatch: navigationState.setSelectedFootageIdsForBatch,
  });

  return (
    <CMSContext.Provider
      value={{
        ...navigationState,
        categoryGroups,
        tags,
        sources,
        episodes,
        settings,
        ...analytics,
        ...categoryActions,
        ...footageActions,
        ...episodeActions,
        ...duplicateMergeActions,
        resetDemoData,
        clearAllClips,
        isClearingClips,
        isCloudConnected,
        isCloudSynced,
        isSeedingToCloud,
        seedToCloud,
        serverCounts,
        archiveSummaryStats,
      }}
    >
      {children}
    </CMSContext.Provider>
  );
};

export function useCMS(): CMSContextType {
  const ctx = useContext(CMSContext);
  if (!ctx) {
    throw new Error('useCMS must be used inside a CMSProvider');
  }
  return ctx;
}
