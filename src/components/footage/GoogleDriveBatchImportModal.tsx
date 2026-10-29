import React from 'react';
import { motion } from 'motion/react';
import { FolderDown, X } from 'lucide-react';
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

  if (!driveImport.isGoogleDriveBatchModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-6 py-4.5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400 shrink-0">
              <FolderDown className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold flex items-center gap-2">
                <span>นำเข้าฟุตเทจจำนวนมากจาก Google Drive</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-500/30 text-emerald-300 border border-emerald-400/30 font-bold">
                  Enterprise Recursive Scanner
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                สแกนโฟลเดอร์ย่อยอัตโนมัติ เลือกได้ว่าจะใช้ชื่อ Subfolder เป็นหมวดหมู่ หรือส่งเข้าพื้นที่พักรอจัดหมวดหมู่ (Staging Area) ก่อน
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={driveImport.handleClose}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
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
                    isScanning={driveImport.isScanning}
                    onStartScan={driveImport.handleStartScan}
                    onCancelScan={driveImport.handleCancelScan}
                    maxDepth={driveImport.maxDepth}
                    onMaxDepthChange={driveImport.setMaxDepth}
                    categoryStrategy={driveImport.categoryStrategy}
                    onSelectSubfolderStrategy={driveImport.handleSelectSubfolderStrategy}
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
                        isFolderRoutedToStaging={driveImport.isFolderRoutedToStaging}
                        onToggleSubfolderStaging={driveImport.handleToggleSubfolderStaging}
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
                        onSelectedFolderFilterChange={driveImport.setSelectedFolderFilter}
                        previewSearch={driveImport.previewSearch}
                        onPreviewSearchChange={driveImport.setPreviewSearch}
                        folderCategoryMap={driveImport.folderCategoryMap}
                        isFolderRoutedToStaging={driveImport.isFolderRoutedToStaging}
                        idPrefix={driveImport.idPrefix}
                        computedFootageCount={driveImport.computedFootageCount}
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
        </div>

        {/* Modal Footer */}
        {driveImport.importSuccessData === null && (
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
            onClose={driveImport.handleClose}
            onExecuteImport={driveImport.handleExecuteImport}
          />
        )}
      </motion.div>
    </div>
  );
};
