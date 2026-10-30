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
    setIsStatusRuleModalOpen,

    nextEpisodeId,
    activeBuilderStep,
    setActiveBuilderStep,
    preselectNotice,
    setPreselectNotice,
    savedBannerMessage,

    groupStockStats,
    selectedGroupId,
    activeGroup,
    categoriesInSelectedGroup,
    mainCategoryTagId,
    productionTarget,
    targetSubcategoryId,
    activeSubcategory,
    currentSubcategories,
    activeCategoryStat,
    liveCategoryStock,
    handleSelectGroup,
    handleSelectCategory,
    handleSelectVarietyMode,
    handleSelectSoloMode,
    handleSelectSubcategory,

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
    footageToAssignedRankMap,
    allowCrossCategory,
    setAllowCrossCategory,
    poolFilterGroupId,
    setPoolFilterGroupId,
    poolSubcategoryFilterId,
    setPoolSubcategoryFilterId,
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
    paginatedPickerCandidates,

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
    introMascotScript,
    setIntroMascotScript,
    outroMascotScript,
    setOutroMascotScript,
    previewMasterFileName,
    handleSaveEpisode,
    performActualSave,
    categoryEpisodeNo,
    existingCategoryEpisodesCount,
    categoryEpisodeScope,
    handleToggleEpisodeScope,
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
        activeBuilderStep={activeBuilderStep}
        onSelectStep={setActiveBuilderStep}
        preselectNotice={preselectNotice}
        onDismissPreselectNotice={() => setPreselectNotice(null)}
        savedBannerMessage={savedBannerMessage}
        onNavigateTab={setActiveTab}
      />

      {/* Step 1: 3-Tier Category Selection */}
      <BuilderStep1CategoryTarget
        isOpen={activeBuilderStep === 1}
        onToggle={() => setActiveBuilderStep(1)}
        onNextStep={() => setActiveBuilderStep(2)}
        groupStockStats={groupStockStats}
        selectedGroupId={selectedGroupId}
        activeGroup={activeGroup}
        categoriesInSelectedGroup={categoriesInSelectedGroup}
        mainCategoryTagId={mainCategoryTagId}
        activeCategoryStat={activeCategoryStat}
        liveCategoryStock={liveCategoryStock}
        productionTarget={productionTarget}
        targetSubcategoryId={targetSubcategoryId}
        activeSubcategory={activeSubcategory}
        currentSubcategories={currentSubcategories}
        computedFootage={computedFootage}
        onSelectGroup={handleSelectGroup}
        onSelectCategory={handleSelectCategory}
        onSelectVarietyMode={handleSelectVarietyMode}
        onSelectSoloMode={handleSelectSoloMode}
        onSelectSubcategory={handleSelectSubcategory}
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
        onDropItemOnSlot={handleDropItemOnSlot}
        onAssignFootageToRank={assignFootageToRank}
        footageToAssignedRankMap={footageToAssignedRankMap}
        categoryGroups={categoryGroups}
        activeGroup={activeGroup}
        activeCategoryStat={activeCategoryStat}
        productionTarget={productionTarget}
        activeSubcategory={activeSubcategory}
        currentSubcategories={currentSubcategories}
        poolSubcategoryFilterId={poolSubcategoryFilterId}
        onChangePoolSubcategoryFilterId={setPoolSubcategoryFilterId}
        computedFootage={computedFootage}
        liveCategoryStock={liveCategoryStock}
        allowCrossCategory={allowCrossCategory}
        onToggleCrossCategory={() => setAllowCrossCategory((prev) => !prev)}
        onEnableCrossCategory={() => setAllowCrossCategory(true)}
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
        categoryName={tagMap[mainCategoryTagId]?.name}
        subcategoryName={targetSubcategoryId ? tagMap[targetSubcategoryId]?.name : undefined}
        categoryEpisodeNo={categoryEpisodeNo}
        existingCategoryEpisodesCount={existingCategoryEpisodesCount}
        categoryEpisodeScope={categoryEpisodeScope}
        onToggleEpisodeScope={handleToggleEpisodeScope}
        productionTarget={productionTarget}
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
