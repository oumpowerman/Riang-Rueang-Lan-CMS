import React from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle2 } from 'lucide-react';
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

            {/* Single-Row Compact Footer Bar */}
            <div className="px-3.5 sm:px-5 py-2 sm:py-3 border-t border-slate-200 bg-white flex items-center justify-between gap-2 shrink-0 text-xs">
              <div className="flex items-center gap-1.5 text-emerald-700 font-semibold text-[11px] sm:text-xs truncate">
                <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 shrink-0" />
                <span className="sm:hidden">บันทึกอัตโนมัติเรียลไทม์</span>
                <span className="hidden sm:inline">
                  บันทึกการแก้ไขข้อมูล คำสร้อย ลิงก์ และหมวดหมู่อัตโนมัติแบบเรียลไทม์
                </span>
              </div>

              <button
                type="button"
                onClick={handleClose}
                className="px-3.5 sm:px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shrink-0 transition-colors cursor-pointer"
              >
                ปิด
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};
