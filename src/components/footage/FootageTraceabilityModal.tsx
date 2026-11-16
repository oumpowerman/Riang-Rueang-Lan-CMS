import React from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { CloudSyncFooterBar } from '../ui/CloudSyncFooterBar';
import { TraceabilityCoUsageTab } from './traceability/TraceabilityCoUsageTab';
import { TraceabilityDetailsTab } from './traceability/TraceabilityDetailsTab';
import { TraceabilityEpisodeHistoryTab } from './traceability/TraceabilityEpisodeHistoryTab';
import { TraceabilityModalHeader } from './traceability/TraceabilityModalHeader';
import { useFootageTraceability } from './traceability/useFootageTraceability';

const TAB_SLIDE_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

export const FootageTraceabilityModal: React.FC = () => {
  const {
    footage,
    parentSource,
    coUsedEntries,
    tagMap,
    settings,
    activeTab,
    setActiveTab,
    copiedFileName,
    syncSummary,
    debounceMs,
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
    handleRetryAllFailed,
  } = useFootageTraceability();

  React.useEffect(() => {
    if (!footage) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const mainEl = document.querySelector('main');
    if (mainEl) (mainEl as HTMLElement).style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
      if (mainEl) (mainEl as HTMLElement).style.overflow = '';
    };
  }, [footage]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {footage && (
        <motion.div
          key="traceability-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16 }}
          onClick={handleClose}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-1.5 sm:p-5 bg-slate-950/60 backdrop-blur-xs"
        >
          <motion.div
            key="traceability-modal-dialog"
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: 'spring', stiffness: 360, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-5xl h-[95dvh] max-h-[96dvh] sm:h-[85vh] sm:max-h-[85vh] flex flex-col overflow-hidden"
          >
            {/* Fixed Top Header with 4-KPI Strip & Segmented Tabs */}
            <TraceabilityModalHeader
              footage={footage}
              parentSource={parentSource}
              settings={settings}
              coUsedCount={coUsedEntries.length}
              activeTab={activeTab}
              onChangeTab={setActiveTab}
              onOpenParentSource={handleOpenParentSource}
              onClose={handleClose}
            />

            {/* Independent Scrollable Tab Viewport with Smooth Framer Motion Transitions */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-5 bg-slate-50/50">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={`${footage.id}-${activeTab}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2, ease: TAB_SLIDE_EASE }}
                  className="h-full"
                >
                  {activeTab === 'DETAILS_AND_TAGS' && (
                    <TraceabilityDetailsTab
                      footage={footage}
                      copiedFileName={copiedFileName}
                      onCopyFileName={handleCopyFileName}
                      onUpdateTitle={handleUpdateTitle}
                      onUpdatePunchlineNote={handleUpdatePunchlineNote}
                      onUpdateRankTitle={handleUpdateRankTitle}
                      onUpdateMascotNotes={handleUpdateMascotNotes}
                      onUpdateOriginalUrl={handleUpdateOriginalUrl}
                      onUpdateDriveFileUrl={handleUpdateDriveFileUrl}
                      onUpdateTags={handleUpdateTags}
                      onFlushDraft={handleFlushCurrent}
                    />
                  )}

                  {activeTab === 'EPISODE_HISTORY' && (
                    <TraceabilityEpisodeHistoryTab
                      footage={footage}
                      onSelectEpisode={handleSelectEpisode}
                    />
                  )}

                  {activeTab === 'CO_USAGE_MATRIX' && (
                    <TraceabilityCoUsageTab
                      coUsedEntries={coUsedEntries}
                      tagMap={tagMap}
                      settings={settings}
                      onSelectPartnerFootage={handleSelectPartnerFootage}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Live Cloud Auto-Save Footer Bar */}
            <div className="px-3.5 sm:px-5 py-2.5 sm:py-3 border-t border-[#E8DFD3] bg-[#FDFBF7] shrink-0">
              <CloudSyncFooterBar
                summary={syncSummary}
                debounceMs={debounceMs}
                idleMessage="แก้ไขชื่อ คำสร้อย ลิงก์ หรือแท็ก — ระบบหน่วง 0.55 วิแล้วบันทึกขึ้น Cloud อัตโนมัติ"
                onFlushAll={handleFlushAll}
                onRetryAll={handleRetryAllFailed}
                onClose={handleClose}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};
