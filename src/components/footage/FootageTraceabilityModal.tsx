import React from 'react';
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
    handleUpdateMascotNotes,
    handleUpdateOriginalUrl,
    handleUpdateDriveFileUrl,
    handleUpdateTags,
  } = useFootageTraceability();

  return (
    <AnimatePresence>
      {footage && (
        <motion.div
          key="traceability-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16 }}
          onClick={handleClose}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/60 backdrop-blur-xs"
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
            className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-5xl h-[85vh] max-h-[85vh] flex flex-col overflow-hidden"
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
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 bg-slate-50/50">
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

            {/* Fixed Footer Bar */}
            <div className="px-5 py-3 border-t border-slate-200 bg-white flex flex-wrap items-center justify-between gap-3 shrink-0 text-xs">
              <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>บันทึกการแก้ไขข้อมูล ลิงก์ และหมวดหมู่อัตโนมัติแบบเรียลไทม์</span>
              </div>

              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition-colors cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
