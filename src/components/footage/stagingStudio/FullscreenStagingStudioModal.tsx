import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  CheckCircle2,
  Layers,
  Minimize2,
  RotateCcw,
  Sparkles,
  X,
} from 'lucide-react';
import { useCMS } from '../../../context/CMSContext';
import {
  CategoryGroupOverviewItem,
  MainCategoryOverviewItem,
  QuickSortUndoRecord,
} from '../vault/vault.types';
import { StagingStudioCategoryMatrix } from './StagingStudioCategoryMatrix';
import { StagingStudioFootageList } from './StagingStudioFootageList';

interface FullscreenStagingStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryGroupsOverview: CategoryGroupOverviewItem[];
  mainCategoriesOverview: MainCategoryOverviewItem[];
  lastUndoRecord: QuickSortUndoRecord | null;
  onQuickAssignCategory: (footageIds: string[], targetTagId: string) => void;
  onUndoLastQuickSort: () => void;
  onDismissUndoRecord: () => void;
  onStartDragFootage: (footageId: string) => string[];
  onEndDragFootage: () => void;
  onSelectWithRange: (footageId: string, shiftKey?: boolean) => void;
}

export const FullscreenStagingStudioModal: React.FC<FullscreenStagingStudioModalProps> = ({
  isOpen,
  onClose,
  categoryGroupsOverview,
  mainCategoriesOverview,
  lastUndoRecord,
  onQuickAssignCategory,
  onUndoLastQuickSort,
  onDismissUndoRecord,
  onStartDragFootage,
  onEndDragFootage,
  onSelectWithRange,
}) => {
  const {
    untaggedFootages,
    selectedFootageIdsForBatch,
  } = useCMS();

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const stagingCount = untaggedFootages.length;
  const selectedCount = selectedFootageIdsForBatch.length;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex flex-col overflow-hidden"
      >
        <motion.div
          initial={{ scale: 0.98, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.98, opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="w-full h-full flex flex-col bg-slate-100 overflow-hidden"
        >
          {/* Compact Studio Header */}
          <header className="px-4 py-2.5 bg-white border-b border-slate-200/90 flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-2xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                <Layers className="w-4 h-4" />
              </div>

              <h2 className="text-sm sm:text-base font-extrabold text-slate-900">
                คัดแยกหมวดหมู่
              </h2>
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-mono font-bold bg-amber-100 text-amber-900 border border-amber-300 tabular-nums">
                ไม่มีหมวด {stagingCount}
              </span>
              {selectedCount > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
                  <Sparkles className="w-3 h-3 text-indigo-600" />
                  <span>เลือก {selectedCount} คลิป</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {lastUndoRecord && (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-950 text-xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>
                    ย้าย {lastUndoRecord.movedCount} คลิป ➔{' '}
                    <strong className="text-indigo-700">
                      {lastUndoRecord.targetTagName}
                    </strong>
                  </span>
                  <button
                    type="button"
                    onClick={onUndoLastQuickSort}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>เลิกทำ</span>
                  </button>
                  <button
                    type="button"
                    onClick={onDismissUndoRecord}
                    className="text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-colors cursor-pointer"
                title="ปิด (Esc)"
              >
                <Minimize2 className="w-3.5 h-3.5" />
                <span>ย่อกลับ (Esc)</span>
              </button>
            </div>
          </header>

          {/* Dual-Pane Viewport */}
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            <div className="w-full md:w-[44%] lg:w-[40%] h-1/2 md:h-full border-r border-slate-200 flex flex-col overflow-hidden bg-white">
              <StagingStudioFootageList
                onStartDragFootage={onStartDragFootage}
                onEndDragFootage={onEndDragFootage}
                onSelectWithRange={onSelectWithRange}
              />
            </div>

            <div className="flex-1 h-1/2 md:h-full flex flex-col overflow-hidden bg-slate-50">
              <StagingStudioCategoryMatrix
                categoryGroupsOverview={categoryGroupsOverview}
                mainCategoriesOverview={mainCategoriesOverview}
                onQuickAssignCategory={onQuickAssignCategory}
              />
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
