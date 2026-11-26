import React from 'react';
import { CollisionWarningBanner } from './CollisionWarningBanner';
import { BuilderStep1CategoryTarget } from './builder/BuilderStep1CategoryTarget';
import { BuilderStep2RankingWorkspace } from './builder/BuilderStep2RankingWorkspace';
import { BuilderStep4MetadataForm } from './builder/BuilderStep4MetadataForm';
import { BuilderStudioHeader } from './builder/BuilderStudioHeader';
import { DiversityCollisionBanner } from './builder/DiversityCollisionBanner';
import { DuplicateEpisodeConfirmModal } from './builder/DuplicateEpisodeConfirmModal';
import { EpisodeCreatedSuccessModal } from './builder/EpisodeCreatedSuccessModal';
import { useEpisodeBuilder } from './builder/useEpisodeBuilder';

export const EpisodeBuilderView: React.FC = () => {
  const {
    categoryGroups,
    tagMap,
    computedFootage,
    computedFootageMap,
    settings,
    setActiveTab,

    nextEpisodeId,
    activeBuilderStep,
    setActiveBuilderStep,
    preselectNotice,
    setPreselectNotice,
    savedBannerMessage,

    tagStockMap,
    tier1Groups,
    tier2Groups,
    tier3Groups,
    selectedFacetTagIds,
    scopeMatchMode,
    setScopeMatchMode,
    scopeSummaryLabel,
    step1SearchQuery,
    setStep1SearchQuery,
    tagClickMode,
    setTagClickMode,
    handleToggleFacetTag,
    handleClearFacetTags,
    recipeShortfallNotice,
    setRecipeShortfallNotice,
    handleSwitchToOrAndRefill,
    handleEnableCrossCategoryAndRefill,

    activeGroup,
    mainCategoryTagId,
    productionTarget,
    targetSubcategoryId,
    activeSubcategory,
    currentSubcategories,
    activeCategoryStat,
    liveCategoryStock,
    handleSelectCategory,

    activeRecipe,
    applyRecipeForCategory,

    duplicateSubcategories,
    validationReport,
    duplicateConfirmModalOpen,
    setDuplicateConfirmModalOpen,

    rankings,
    selectedFootageIds,
    activeSlotRank,
    setActiveSlotRank,
    assignFootageToRank,
    handleDropItemOnSlot,
    handleMoveSlotByIndex,
    clearSlotByRank,
    clearAllSlots,
    updateSlotScript,
    updateSlotRankFields,
    footageToAssignedRankMap,
    allowCrossCategory,
    setAllowCrossCategory,
    poolFilterGroupId,
    setPoolFilterGroupId,
    poolCoTagFilterIds,
    poolCoTagMatchMode,
    setPoolCoTagMatchMode,
    handleTogglePoolCoTag,
    handleClearPoolCoTags,
    poolQuickFilter,
    setPoolQuickFilter,
    pickerSearch,
    setPickerSearch,
    pickerSortBy,
    setPickerSortBy,
    pickerPage,
    setPickerPage,
    pickerPageSize,
    setPickerPageSize,
    pickerCandidates,
    poolTabCounts,
    poolCoTagChips,
    coTagAllCount,
    paginatedPickerCandidates,

    seriesCatalog,
    seriesMode,
    activeExistingSeries,
    customSeriesName,
    effectiveSeriesName,
    autoEpisodeNo,
    effectiveEpisodeNo,
    isManualEpisodeNo,
    isDuplicateEpisodeNo,
    existingSeriesEpisodesCount,
    latestSeriesEpisodeNo,
    isTitleManuallyEdited,
    standardizedTitlePreview,
    matchingExistingSeriesForNewName,
    suggestedSeriesForActiveTag,
    handleSelectExistingSeriesInStep1,
    handleSelectExistingSeriesInStep3,
    switchToNewSeries,
    updateCustomSeriesName,
    setEpisodeNo,
    resetAutoEpisodeNo,
    resetTitleToStandard,

    title,
    setTitle,
    publishDate,
    setPublishDate,
    publishSlot,
    setPublishSlot,
    isOptionalMasterOpen,
    setIsOptionalMasterOpen,
    masterDriveUrl,
    setMasterDriveUrl,
    youtubeUrl,
    setYoutubeUrl,
    facebookUrl,
    setFacebookUrl,
    tiktokUrl,
    setTiktokUrl,
    instagramUrl,
    setInstagramUrl,
    introMascotScript,
    setIntroMascotScript,
    outroMascotScript,
    setOutroMascotScript,
    previewMasterFileName,
    handleSaveEpisode,
    performActualSave,
    newlyCreatedEpisode,
    setNewlyCreatedEpisode,
    handleContinueNextEpisodeInCategory,
  } = useEpisodeBuilder();

  return (
    <div className="space-y-3.5 relative">
      {/* Studio Header & Interactive 3-Step Stepper Bar */}
      <BuilderStudioHeader
        nextEpisodeId={nextEpisodeId}
        selectedCount={selectedFootageIds.length}
        activeCategoryStat={activeCategoryStat}
        selectedFacetCount={selectedFacetTagIds.length}
        scopeMatchMode={scopeMatchMode}
        activeSeriesLabel={
          seriesMode === 'EXISTING' && activeExistingSeries
            ? activeExistingSeries.seriesName
            : undefined
        }
        effectiveEpisodeNo={effectiveEpisodeNo}
        activeBuilderStep={activeBuilderStep}
        onSelectStep={setActiveBuilderStep}
        preselectNotice={preselectNotice}
        onDismissPreselectNotice={() => setPreselectNotice(null)}
        savedBannerMessage={savedBannerMessage}
        onNavigateTab={setActiveTab}
      />

      {/* Step 1: 3-Tier Independent Tag Selection & Scope Combiner */}
      <BuilderStep1CategoryTarget
        isOpen={activeBuilderStep === 1}
        onToggle={() => setActiveBuilderStep(1)}
        onNextStep={() => setActiveBuilderStep(2)}
        onAutoFillAndNextStep={() => {
          applyRecipeForCategory(mainCategoryTagId, activeRecipe);
          setActiveBuilderStep(2);
        }}
        mainCategoryTagId={mainCategoryTagId}
        activeCategoryStat={activeCategoryStat}
        liveCategoryStock={liveCategoryStock}
        tagMap={tagMap}
        tagStockMap={tagStockMap}
        tier1Groups={tier1Groups}
        tier2Groups={tier2Groups}
        tier3Groups={tier3Groups}
        selectedFacetTagIds={selectedFacetTagIds}
        scopeMatchMode={scopeMatchMode}
        onChangeScopeMatchMode={setScopeMatchMode}
        step1SearchQuery={step1SearchQuery}
        onChangeStep1SearchQuery={setStep1SearchQuery}
        tagClickMode={tagClickMode}
        onChangeTagClickMode={setTagClickMode}
        onSelectCategory={handleSelectCategory}
        onToggleFacetTag={handleToggleFacetTag}
        onClearFacetTags={handleClearFacetTags}
        seriesCatalog={seriesCatalog}
        seriesMode={seriesMode}
        activeExistingSeries={activeExistingSeries}
        customSeriesName={customSeriesName}
        effectiveSeriesName={effectiveSeriesName}
        autoEpisodeNo={autoEpisodeNo}
        effectiveEpisodeNo={effectiveEpisodeNo}
        isManualEpisodeNo={isManualEpisodeNo}
        isDuplicateEpisodeNo={isDuplicateEpisodeNo}
        existingSeriesEpisodesCount={existingSeriesEpisodesCount}
        latestSeriesEpisodeNo={latestSeriesEpisodeNo}
        matchingExistingSeriesForNewName={matchingExistingSeriesForNewName}
        suggestedSeriesForActiveTag={suggestedSeriesForActiveTag}
        onSelectExistingSeries={handleSelectExistingSeriesInStep1}
        onSwitchToNewSeries={switchToNewSeries}
        onChangeCustomSeriesName={updateCustomSeriesName}
      />

      {/* Diversity & Collision Guard Banners */}
      <DiversityCollisionBanner
        duplicateSubcategories={duplicateSubcategories}
      />
      <CollisionWarningBanner
        report={validationReport}
        selectedCount={selectedFootageIds.length}
      />

      {/* Step 2: Merged 5-Slot Ranking Board & Draggable Candidate Pool with Quick Recipe Formula Bar */}
      <BuilderStep2RankingWorkspace
        isOpen={activeBuilderStep === 2}
        onToggle={() => setActiveBuilderStep(2)}
        onNextStep={() => setActiveBuilderStep(3)}
        rankings={rankings}
        computedFootageMap={computedFootageMap}
        selectedFootageIds={selectedFootageIds}
        activeSlotRank={activeSlotRank}
        onActivatePickerSlot={setActiveSlotRank}
        onClearSlotByRank={clearSlotByRank}
        onClearAllSlots={clearAllSlots}
        onMoveSlotByIndex={handleMoveSlotByIndex}
        onUpdateSlotScript={updateSlotScript}
        onUpdateSlotRankFields={updateSlotRankFields}
        onDropItemOnSlot={handleDropItemOnSlot}
        onAssignFootageToRank={assignFootageToRank}
        footageToAssignedRankMap={footageToAssignedRankMap}
        categoryGroups={categoryGroups}
        activeGroup={activeGroup}
        activeCategoryStat={activeCategoryStat}
        scopeSummaryLabel={scopeSummaryLabel}
        productionTarget={productionTarget}
        activeSubcategory={activeSubcategory}
        currentSubcategories={currentSubcategories}
        poolCoTagChips={poolCoTagChips}
        coTagAllCount={coTagAllCount}
        poolCoTagFilterIds={poolCoTagFilterIds}
        poolCoTagMatchMode={poolCoTagMatchMode}
        onChangePoolCoTagMatchMode={setPoolCoTagMatchMode}
        onTogglePoolCoTag={handleTogglePoolCoTag}
        onClearPoolCoTags={handleClearPoolCoTags}
        computedFootage={computedFootage}
        liveCategoryStock={liveCategoryStock}
        poolTabCounts={poolTabCounts}
        allowCrossCategory={allowCrossCategory}
        onToggleCrossCategory={() => {
          setAllowCrossCategory((prev) => !prev);
          setRecipeShortfallNotice(null);
        }}
        onEnableCrossCategory={() => {
          setAllowCrossCategory(true);
          setRecipeShortfallNotice(null);
        }}
        onDisableCrossCategory={() => {
          setAllowCrossCategory(false);
          setRecipeShortfallNotice(null);
        }}
        poolFilterGroupId={poolFilterGroupId}
        onChangePoolFilterGroupId={setPoolFilterGroupId}
        poolQuickFilter={poolQuickFilter}
        onChangePoolQuickFilter={setPoolQuickFilter}
        pickerSearch={pickerSearch}
        onChangePickerSearch={setPickerSearch}
        pickerSortBy={pickerSortBy}
        onChangePickerSortBy={setPickerSortBy}
        pickerCandidatesCount={pickerCandidates.length}
        paginatedPickerCandidates={paginatedPickerCandidates}
        pickerPage={pickerPage}
        pickerPageSize={pickerPageSize}
        onPageChange={setPickerPage}
        onPageSizeChange={setPickerPageSize}
        tagMap={tagMap}
        settings={settings}
        activeRecipe={activeRecipe}
        onApplyRecipe={(recipe) => applyRecipeForCategory(mainCategoryTagId, recipe)}
        recipeShortfallNotice={recipeShortfallNotice}
        onDismissRecipeShortfall={() => setRecipeShortfallNotice(null)}
        onSwitchToOrAndRefill={handleSwitchToOrAndRefill}
        onEnableCrossCategoryAndRefill={handleEnableCrossCategoryAndRefill}
      />

      {/* Step 3: Metadata Form & Save Episode */}
      <BuilderStep4MetadataForm
        isOpen={activeBuilderStep === 3}
        onToggle={() => setActiveBuilderStep(3)}
        nextEpisodeId={nextEpisodeId}
        selectedCount={selectedFootageIds.length}
        previewMasterFileName={previewMasterFileName}
        title={title}
        onChangeTitle={setTitle}
        isTitleManuallyEdited={isTitleManuallyEdited}
        standardizedTitlePreview={standardizedTitlePreview}
        onResetTitleToStandard={resetTitleToStandard}
        seriesCatalog={seriesCatalog}
        seriesMode={seriesMode}
        activeExistingSeries={activeExistingSeries}
        customSeriesName={customSeriesName}
        effectiveSeriesName={effectiveSeriesName}
        autoEpisodeNo={autoEpisodeNo}
        effectiveEpisodeNo={effectiveEpisodeNo}
        isManualEpisodeNo={isManualEpisodeNo}
        isDuplicateEpisodeNo={isDuplicateEpisodeNo}
        existingSeriesEpisodesCount={existingSeriesEpisodesCount}
        latestSeriesEpisodeNo={latestSeriesEpisodeNo}
        matchingExistingSeriesForNewName={matchingExistingSeriesForNewName}
        onSelectExistingSeries={handleSelectExistingSeriesInStep3}
        onSwitchToNewSeries={switchToNewSeries}
        onChangeCustomSeriesName={updateCustomSeriesName}
        onChangeEpisodeNo={setEpisodeNo}
        onResetAutoEpisodeNo={resetAutoEpisodeNo}
        onJumpToStep1={() => setActiveBuilderStep(1)}
        publishDate={publishDate}
        onChangePublishDate={setPublishDate}
        publishSlot={publishSlot}
        onChangePublishSlot={setPublishSlot}
        isOptionalMasterOpen={isOptionalMasterOpen}
        onToggleOptionalMaster={() => setIsOptionalMasterOpen((prev) => !prev)}
        masterDriveUrl={masterDriveUrl}
        onChangeMasterDriveUrl={setMasterDriveUrl}
        youtubeUrl={youtubeUrl}
        onChangeYoutubeUrl={setYoutubeUrl}
        facebookUrl={facebookUrl}
        onChangeFacebookUrl={setFacebookUrl}
        tiktokUrl={tiktokUrl}
        onChangeTiktokUrl={setTiktokUrl}
        instagramUrl={instagramUrl}
        onChangeInstagramUrl={setInstagramUrl}
        introMascotScript={introMascotScript}
        onChangeIntroMascotScript={setIntroMascotScript}
        outroMascotScript={outroMascotScript}
        onChangeOutroMascotScript={setOutroMascotScript}
        onSubmitEpisode={handleSaveEpisode}
      />

      {/* 100% Duplicate Episode Confirmation Modal */}
      <DuplicateEpisodeConfirmModal
        isOpen={duplicateConfirmModalOpen}
        topSimilarityMatch={validationReport.topSimilarityMatch}
        onClose={() => setDuplicateConfirmModalOpen(false)}
        onConfirmSave={performActualSave}
      />

      {/* Post-Save Success Modal */}
      <EpisodeCreatedSuccessModal
        episode={newlyCreatedEpisode}
        isOpen={Boolean(newlyCreatedEpisode)}
        onClose={() => {
          setNewlyCreatedEpisode(null);
          clearAllSlots();
          setActiveBuilderStep(1);
        }}
        onContinueSameCategory={handleContinueNextEpisodeInCategory}
        onOpenArchive={() => {
          setNewlyCreatedEpisode(null);
          clearAllSlots();
          setActiveTab('MASTER_ARCHIVE');
        }}
        computedFootageMap={computedFootageMap}
        tagMap={tagMap}
      />
    </div>
  );
};
