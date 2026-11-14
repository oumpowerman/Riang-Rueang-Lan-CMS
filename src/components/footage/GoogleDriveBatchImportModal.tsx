import React from 'react';
import { FolderDown } from 'lucide-react';
import { BaseModal } from '../ui/BaseModal';
import { DriveDiscoveredVideosTable } from './driveImport/DriveDiscoveredVideosTable';
import { DriveImportModalFooter } from './driveImport/DriveImportModalFooter';
import { DriveImportModeBar } from './driveImport/DriveImportModeBar';
import { DriveImportSuccessView } from './driveImport/DriveImportSuccessView';
import { DriveManualPastePanel } from './driveImport/DriveManualPastePanel';
import { DriveRecursiveConfigPanel } from './driveImport/DriveRecursiveConfigPanel';
import { DriveSubfolderMappingPanel } from './driveImport/DriveSubfolderMappingPanel';
import { DriveWorkspaceAuthBanner } from './driveImport/DriveWorkspaceAuthBanner';
import { useGoogleDriveBatchImport } from './driveImport/useGoogleDriveBatchImport';

export type { DriveCategoryStrategy } from './driveImport/driveImport.types';

export const GoogleDriveBatchImportModal: React.FC = () => {
  const driveImport = useGoogleDriveBatchImport();

  return (
    <BaseModal
      isOpen={driveImport.isGoogleDriveBatchModalOpen}
      onClose={driveImport.handleClose}
      closeOnBackdropClick={!driveImport.isImporting}
      closeOnEsc={!driveImport.isImporting}
      maxWidthClass="max-w-[96vw] xl:max-w-[1580px]"
      heightClass="h-[94dvh] sm:h-[92vh]"
      icon={<FolderDown className="w-5 h-5 text-[#2E7D32]" />}
      title="นำเข้าฟุตเทจจำนวนมากจาก Google Drive"
      badge={
        <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-[#EEF5EE] text-[#1C4824] border border-[#BAD8BF] font-bold">
          Enterprise Recursive Scanner
        </span>
      }
      subtitle="สแกนโฟลเดอร์ย่อยอัตโนมัติ เลือกได้ว่าจะใช้ชื่อ Subfolder เป็นหมวดหมู่ หรือส่งเข้าพื้นที่พักรอจัดหมวดหมู่ (Staging Area) ก่อน"
      bodyClassName="p-5 sm:p-6 bg-[#FAF8F5] overflow-y-auto scrollbar-thin space-y-5"
      footer={
        driveImport.importSuccessData === null ? (
          <DriveImportModalFooter
            activeImportMode={driveImport.activeImportMode}
            scanResult={driveImport.scanResult}
            selectedRoutingSummary={driveImport.selectedRoutingSummary}
            selectedCount={driveImport.selectedVideoIds.size}
            activeNewTagsCount={driveImport.activeNewTagsToCreate.length}
            categoryStrategy={driveImport.categoryStrategy}
            parsedPastedCount={driveImport.parsedPastedItems.length}
            isImporting={driveImport.isImporting}
            importProgress={driveImport.importProgress}
            importStatusLabel={driveImport.importStatusLabel}
            onClose={driveImport.handleClose}
            onExecuteImport={driveImport.handleExecuteImport}
          />
        ) : undefined
      }
    >
      {driveImport.importSuccessData ? (
        <DriveImportSuccessView
          importSuccessData={driveImport.importSuccessData}
          onGoToLibrary={driveImport.handleGoToLibrary}
          onClose={driveImport.handleClose}
        />
      ) : (
        <>
          {/* 1. Google Workspace Connection & Backup API Key */}
          <DriveWorkspaceAuthBanner
            currentUser={driveImport.currentUser}
            isGoogleDriveConnected={driveImport.isGoogleDriveConnected}
            onSignInWithGoogle={driveImport.signInWithGoogle}
            apiKey={driveImport.apiKey}
            onSaveApiKey={driveImport.handleSaveApiKey}
            isApiKeyExpanded={driveImport.isApiKeyExpanded}
            onToggleApiKeyExpanded={() =>
              driveImport.setIsApiKeyExpanded((prev) => !prev)
            }
          />

          {/* 2. Mode Switcher & Clip ID Prefix */}
          <DriveImportModeBar
            activeImportMode={driveImport.activeImportMode}
            onModeChange={driveImport.setActiveImportMode}
            idPrefix={driveImport.idPrefix}
            onIdPrefixChange={driveImport.setIdPrefix}
          />

          {/* 3A. Mode 1: RECURSIVE SCANNER */}
          {driveImport.activeImportMode === 'RECURSIVE' && (
            <div className="space-y-4">
              <DriveRecursiveConfigPanel
                folderUrl={driveImport.folderUrl}
                onFolderUrlChange={driveImport.setFolderUrl}
                activeFolderId={driveImport.activeFolderId}
                savedFolders={driveImport.savedFolders}
                onSelectSavedFolder={driveImport.handleSelectSavedFolder}
                onSaveCurrentFolderPreset={
                  driveImport.handleSaveCurrentFolderPreset
                }
                onRemoveSavedFolder={driveImport.handleRemoveSavedFolder}
                isScanning={driveImport.isScanning}
                onStartScan={driveImport.handleStartScan}
                onCancelScan={driveImport.handleCancelScan}
                maxDepth={driveImport.maxDepth}
                onMaxDepthChange={driveImport.setMaxDepth}
                syncMode={driveImport.syncMode}
                onSyncModeChange={driveImport.setSyncMode}
                folderSyncRecord={driveImport.folderSyncRecord}
                isLoadingSyncRecord={driveImport.isLoadingSyncRecord}
                onResetFolderSyncHistory={
                  driveImport.handleResetFolderSyncHistory
                }
                onAdjustSyncLookbackDays={
                  driveImport.handleAdjustSyncLookbackDays
                }
                onSetCustomSyncTimestamp={
                  driveImport.handleSetCustomSyncTimestamp
                }
                categoryStrategy={driveImport.categoryStrategy}
                onSelectSubfolderStrategy={
                  driveImport.handleSelectSubfolderStrategy
                }
                onSelectAllToStagingStrategy={
                  driveImport.handleSelectAllToStagingStrategy
                }
                nonStagingGroups={driveImport.nonStagingGroups}
                targetGroupIdForNewTags={driveImport.targetGroupIdForNewTags}
                onTargetGroupIdChange={driveImport.setTargetGroupIdForNewTags}
                scanError={driveImport.scanError}
                scanProgress={driveImport.scanProgress}
              />

              {/* Discovered Results Table & Subfolder Mapping */}
              {driveImport.scanResult && (
                <div className="space-y-3 pt-1">
                  <DriveSubfolderMappingPanel
                    categoryStrategy={driveImport.categoryStrategy}
                    folderCategoryMap={driveImport.folderCategoryMap}
                    activeNewTagsToCreate={driveImport.activeNewTagsToCreate}
                    isFolderRoutedToStaging={
                      driveImport.isFolderRoutedToStaging
                    }
                    onToggleSubfolderStaging={
                      driveImport.handleToggleSubfolderStaging
                    }
                    onStageOnlyUnmatchedFolders={
                      driveImport.handleStageOnlyUnmatchedFolders
                    }
                  />

                  <DriveDiscoveredVideosTable
                    scanResult={driveImport.scanResult}
                    displayedVideos={driveImport.displayedVideos}
                    selectedVideoIds={driveImport.selectedVideoIds}
                    onToggleSelectAll={driveImport.handleToggleSelectAll}
                    onToggleOne={driveImport.handleToggleOne}
                    selectedFolderFilter={driveImport.selectedFolderFilter}
                    onSelectedFolderFilterChange={
                      driveImport.setSelectedFolderFilter
                    }
                    previewSearch={driveImport.previewSearch}
                    onPreviewSearchChange={driveImport.setPreviewSearch}
                    folderCategoryMap={driveImport.folderCategoryMap}
                    isFolderRoutedToStaging={
                      driveImport.isFolderRoutedToStaging
                    }
                    idPrefix={driveImport.idPrefix}
                    computedFootageCount={driveImport.computedFootageCount}
                    hideDuplicates={driveImport.hideDuplicates}
                    onToggleHideDuplicates={
                      driveImport.handleToggleHideDuplicates
                    }
                    onSelectOnlyNew={driveImport.handleSelectOnlyNew}
                  />
                </div>
              )}
            </div>
          )}

          {/* 3B. Mode 2: MANUAL PASTE FALLBACK */}
          {driveImport.activeImportMode === 'PASTE' && (
            <DriveManualPastePanel
              pasteTargetTagId={driveImport.pasteTargetTagId}
              onPasteTargetTagIdChange={driveImport.setPasteTargetTagId}
              selectableMainCategories={driveImport.selectableMainCategories}
              pastedText={driveImport.pastedText}
              onPastedTextChange={driveImport.setPastedText}
              parsedPastedItems={driveImport.parsedPastedItems}
            />
          )}
        </>
      )}
    </BaseModal>
  );
};
