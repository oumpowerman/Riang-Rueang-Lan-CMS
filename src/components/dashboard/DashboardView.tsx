import React from 'react';
import { AnimatePresence } from 'motion/react';
import { DashboardStepNav } from './overview/DashboardStepNav';
import { DashboardStep1Ingestion } from './overview/DashboardStep1Ingestion';
import { DashboardStep2HealthExplorer } from './overview/DashboardStep2HealthExplorer';
import { DashboardStep3CategoryAssembly } from './overview/DashboardStep3CategoryAssembly';
import { DashboardStep4ArchiveRoi } from './overview/DashboardStep4ArchiveRoi';
import { useDashboardOverview } from './overview/useDashboardOverview';

export const DashboardView: React.FC = () => {
  const {
    sources,
    episodes,
    categoryMatrix,
    tagMap,
    settings,
    untaggedFootages,
    missingDriveFootages,
    setActiveTab,
    setIsDirectFootageModalOpen,
    openSourceSplitterFor,
    setIsTagManagerOpen,
    setIsStatusRuleModalOpen,
    setTraceabilityFootageId,
    setSelectedEpisodeDetailId,
    launchEpisodeBuilderForCategory,

    activeWorkflowStep,
    stepDirection,
    viewMode,
    setViewMode,
    handleSelectStep,

    globalSearchQuery,
    setGlobalSearchQuery,
    activeStatusFilter,
    setActiveStatusFilter,
    activeFlowFilter,
    setActiveFlowFilter,
    activeCategoryIdFilter,
    setActiveCategoryIdFilter,
    footageSortMode,
    setFootageSortMode,
    footageLimit,
    setFootageLimit,
    categorySearch,
    setCategorySearch,
    categoryFilterMode,
    setCategoryFilterMode,
    categorySortMode,
    setCategorySortMode,
    episodeSearch,
    setEpisodeSearch,
    sourceSearch,
    setSourceSearch,

    isStatusRulesExpanded,
    setIsStatusRulesExpanded,
    isRadarExpanded,
    setIsRadarExpanded,

    copiedId,
    handleCopyText,

    metrics,
    productionRadar,
    filteredCategories,
    filteredFootages,
    filteredEpisodes,
    filteredSources,
    hasAnyActiveFilter,
    resetAllFilters,
    handleOpenCategoryInVault,
  } = useDashboardOverview();

  return (
    <div className="space-y-5">
      {/* Step-by-Step Guided Focus Bar (Navigation Controller) */}
      <DashboardStepNav
        activeWorkflowStep={activeWorkflowStep}
        viewMode={viewMode}
        setViewMode={setViewMode}
        handleSelectStep={handleSelectStep}
        metrics={metrics}
        productionRadar={productionRadar}
        sourcesCount={sources.length}
        episodesCount={episodes.length}
      />

      {/* Main Workflow Content Container with Directional Step Transitions */}
      <div className="space-y-5 overflow-x-hidden">
        <AnimatePresence mode="wait" custom={stepDirection} initial={false}>
          {(viewMode === 'ALL' || activeWorkflowStep === 1) && (
            <DashboardStep1Ingestion
              key="step-1"
              activeWorkflowStep={activeWorkflowStep}
              stepDirection={stepDirection}
              viewMode={viewMode}
              handleSelectStep={handleSelectStep}
              sources={sources}
              filteredSources={filteredSources}
              sourceSearch={sourceSearch}
              setSourceSearch={setSourceSearch}
              metrics={metrics}
              untaggedFootages={untaggedFootages}
              missingDriveFootages={missingDriveFootages}
              openSourceSplitterFor={openSourceSplitterFor}
              setIsDirectFootageModalOpen={setIsDirectFootageModalOpen}
              setActiveTab={setActiveTab}
            />
          )}

          {(viewMode === 'ALL' || activeWorkflowStep === 2) && (
            <DashboardStep2HealthExplorer
              key="step-2"
              activeWorkflowStep={activeWorkflowStep}
              stepDirection={stepDirection}
              viewMode={viewMode}
              handleSelectStep={handleSelectStep}
              globalSearchQuery={globalSearchQuery}
              setGlobalSearchQuery={setGlobalSearchQuery}
              activeStatusFilter={activeStatusFilter}
              setActiveStatusFilter={setActiveStatusFilter}
              activeFlowFilter={activeFlowFilter}
              setActiveFlowFilter={setActiveFlowFilter}
              setActiveCategoryIdFilter={setActiveCategoryIdFilter}
              footageSortMode={footageSortMode}
              setFootageSortMode={setFootageSortMode}
              footageLimit={footageLimit}
              setFootageLimit={setFootageLimit}
              metrics={metrics}
              settings={settings}
              isStatusRulesExpanded={isStatusRulesExpanded}
              setIsStatusRulesExpanded={setIsStatusRulesExpanded}
              setIsStatusRuleModalOpen={setIsStatusRuleModalOpen}
              hasAnyActiveFilter={hasAnyActiveFilter}
              resetAllFilters={resetAllFilters}
              filteredFootages={filteredFootages}
              tagMap={tagMap}
              copiedId={copiedId}
              handleCopyText={handleCopyText}
              setTraceabilityFootageId={setTraceabilityFootageId}
            />
          )}

          {(viewMode === 'ALL' || activeWorkflowStep === 3) && (
            <DashboardStep3CategoryAssembly
              key="step-3"
              activeWorkflowStep={activeWorkflowStep}
              stepDirection={stepDirection}
              viewMode={viewMode}
              handleSelectStep={handleSelectStep}
              productionRadar={productionRadar}
              isRadarExpanded={isRadarExpanded}
              setIsRadarExpanded={setIsRadarExpanded}
              categoryMatrix={categoryMatrix}
              filteredCategories={filteredCategories}
              categoryFilterMode={categoryFilterMode}
              setCategoryFilterMode={setCategoryFilterMode}
              categorySearch={categorySearch}
              setCategorySearch={setCategorySearch}
              categorySortMode={categorySortMode}
              setCategorySortMode={setCategorySortMode}
              activeCategoryIdFilter={activeCategoryIdFilter}
              setActiveCategoryIdFilter={setActiveCategoryIdFilter}
              tagMap={tagMap}
              setIsTagManagerOpen={setIsTagManagerOpen}
              setIsDirectFootageModalOpen={setIsDirectFootageModalOpen}
              setTraceabilityFootageId={setTraceabilityFootageId}
              handleOpenCategoryInVault={handleOpenCategoryInVault}
              launchEpisodeBuilderForCategory={launchEpisodeBuilderForCategory}
            />
          )}

          {(viewMode === 'ALL' || activeWorkflowStep === 4) && (
            <DashboardStep4ArchiveRoi
              key="step-4"
              activeWorkflowStep={activeWorkflowStep}
              stepDirection={stepDirection}
              viewMode={viewMode}
              handleSelectStep={handleSelectStep}
              episodes={episodes}
              filteredEpisodes={filteredEpisodes}
              episodeSearch={episodeSearch}
              setEpisodeSearch={setEpisodeSearch}
              metrics={metrics}
              setActiveTab={setActiveTab}
              setSelectedEpisodeDetailId={setSelectedEpisodeDetailId}
              setTraceabilityFootageId={setTraceabilityFootageId}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
