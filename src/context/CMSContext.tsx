import React, { createContext, useContext } from 'react';
import {
  ActiveNavTab,
  BuilderPreselectRequest,
  CategoryMatrixStat,
  CMSContextType,
  SplitClipDraft,
  SubcategoryStat,
} from './cms/cms.types';
import { useCMSAnalytics } from './cms/useCMSAnalytics';
import { useCMSCategoryActions } from './cms/useCMSCategoryActions';
import { useCMSCloudAndStorageSync } from './cms/useCMSCloudAndStorageSync';
import { useCMSEpisodeActions } from './cms/useCMSEpisodeActions';
import { useCMSFootageActions } from './cms/useCMSFootageActions';
import { useCMSNavigationState } from './cms/useCMSNavigationState';

export type {
  ActiveNavTab,
  BuilderPreselectRequest,
  CategoryMatrixStat,
  CMSContextType,
  SplitClipDraft,
  SubcategoryStat,
};

const CMSContext = createContext<CMSContextType | undefined>(undefined);

export const CMSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Navigation, Global Modals & Cross-View Builder Preselect State
  const navigationState = useCMSNavigationState();

  // 2. Core Data Entities, LocalStorage Persistence & Firestore Cloud Sync
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

  // 4. Actions: Tier 0 Category Groups, Tier 1/2 Tags & System Settings
  const categoryActions = useCMSCategoryActions({
    categoryGroups,
    setCategoryGroups,
    tags,
    setTags,
    tagMap: analytics.tagMap,
    setFootage,
    setSources,
    setSelectedTagFilter: navigationState.setSelectedTagFilter,
    setSettings,
  });

  // 5. Actions: Footage Ingestion (Flow A 1:1 & Flow B 1:N) & CRUD
  const footageActions = useCMSFootageActions({
    footage,
    setFootage,
    sources,
    setSources,
  });

  // 6. Actions: Episodes & Master Archive CRUD
  const episodeActions = useCMSEpisodeActions({
    episodes,
    setEpisodes,
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
        resetDemoData,
        clearAllClips,
        isClearingClips,
        isCloudConnected,
        isCloudSynced,
        isSeedingToCloud,
        seedToCloud,
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
