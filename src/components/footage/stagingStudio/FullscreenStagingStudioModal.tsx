import React, { useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  CheckCircle2,
  Layers,
  Minimize2,
  RotateCcw,
  Sparkles,
  X,
  CheckCheck,
  ArrowRight,
  FolderCheck,
  FileSpreadsheet,
} from 'lucide-react';
import { useCMS } from '../../../context/CMSContext';
import { isStagingTagId, normalizeFootageTags } from '../../../services/seedData';
import { CleanPrefixedTitlesButton } from '../CleanPrefixedTitlesButton';
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
  categoryGroupsOverview?: CategoryGroupOverviewItem[];
  mainCategoriesOverview?: MainCategoryOverviewItem[];
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
    setSelectedFootageIdsForBatch,
    tags,
    tagMap,
    batchUpdateFootageTags,
    setIsSheetTagImportModalOpen,
  } = useCMS();

  const [activeFootageId, setActiveFootageId] = useState<string | null>(null);
  const [stagedTagIds, setStagedTagIds] = useState<string[]>([]);
  const [isAutoAdvanceEnabled, setIsAutoAdvanceEnabled] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync activeFootageId with untagged list
  useEffect(() => {
    if (!isOpen) return;

    if (untaggedFootages.length > 0) {
      if (!activeFootageId || !untaggedFootages.some((f) => f.id === activeFootageId)) {
        setActiveFootageId(untaggedFootages[0].id);
      }
    } else {
      setActiveFootageId(null);
    }
  }, [isOpen, untaggedFootages, activeFootageId]);

  // Active footage and index calculation
  const activeFootage = useMemo(() => {
    if (!activeFootageId) return untaggedFootages[0] || null;
    return untaggedFootages.find((f) => f.id === activeFootageId) || untaggedFootages[0] || null;
  }, [activeFootageId, untaggedFootages]);

  const activeFootageIndex = useMemo(() => {
    if (!activeFootage) return 0;
    const idx = untaggedFootages.findIndex((f) => f.id === activeFootage.id);
    return idx >= 0 ? idx : 0;
  }, [activeFootage, untaggedFootages]);

  // Initialize staged tags when active footage changes
  useEffect(() => {
    if (activeFootage) {
      const initialTags = activeFootage.tags.filter((t) => !isStagingTagId(t));
      setStagedTagIds(initialTags);
    } else {
      setStagedTagIds([]);
    }
  }, [activeFootage?.id]);

  const handleToggleTag = (tagId: string) => {
    if (isStagingTagId(tagId)) return;
    setStagedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const handleClearStagedTags = () => {
    setStagedTagIds([]);
  };

  const handleSaveAndAdvance = () => {
    if (stagedTagIds.length === 0) return;

    const targetIds =
      selectedFootageIdsForBatch.length > 0
        ? [...selectedFootageIdsForBatch]
        : activeFootage
        ? [activeFootage.id]
        : [];

    if (targetIds.length === 0) return;

    // In 3-tier independent faceted taxonomy, tags are saved directly and normalized
    const finalTags = normalizeFootageTags(stagedTagIds);

    // Calculate next footage before state update
    if (isAutoAdvanceEnabled) {
      const remaining = untaggedFootages.filter((f) => !targetIds.includes(f.id));
      if (remaining.length > 0) {
        const nextIndex = Math.min(activeFootageIndex, remaining.length - 1);
        setActiveFootageId(remaining[nextIndex].id);
      } else {
        setActiveFootageId(null);
      }
    }

    // Save multiple tags to footage
    batchUpdateFootageTags(targetIds, finalTags, 'REPLACE');

    // Deselect from batch if applied to batch
    if (selectedFootageIdsForBatch.length > 0) {
      setSelectedFootageIdsForBatch([]);
    }

    // Friendly auto-dismiss toast
    const firstTagName = tags.find((t) => t.id === stagedTagIds[0])?.name || '';
    const moreCount = stagedTagIds.length - 1;
    const tagDisplay = moreCount > 0 ? `#${firstTagName} +${moreCount} แท็ก` : `#${firstTagName}`;
    setToastMessage(`บันทึก ${targetIds.length} คลิป ➔ ${tagDisplay} เรียบร้อยแล้ว`);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  const handleSkipNext = () => {
    if (untaggedFootages.length <= 1) return;
    const nextIdx = (activeFootageIndex + 1) % untaggedFootages.length;
    setActiveFootageId(untaggedFootages[nextIdx].id);
  };

  const handleSkipPrev = () => {
    if (untaggedFootages.length <= 1) return;
    const prevIdx = (activeFootageIndex - 1 + untaggedFootages.length) % untaggedFootages.length;
    setActiveFootageId(untaggedFootages[prevIdx].id);
  };

  // Keyboard shortcut: Esc to close, Enter/Ctrl+Enter to save & advance
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (e.key === 'Enter') {
        const target = e.target as HTMLElement | null;
        const isInput =
          target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA');

        // Allow Enter if not typing in text input, or if Ctrl+Enter is used anywhere
        if ((!isInput || e.ctrlKey || e.metaKey) && stagedTagIds.length > 0) {
          e.preventDefault();
          handleSaveAndAdvance();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, stagedTagIds, handleSaveAndAdvance]);

  if (!isOpen || typeof document === 'undefined') return null;

  const stagingCount = untaggedFootages.length;

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[90] bg-[#3a3026]/30 backdrop-blur-xs flex flex-col overflow-hidden"
      >
        <motion.div
          initial={{ scale: 0.99, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.99, opacity: 0 }}
          transition={{ duration: 0.16 }}
          className="w-full h-full flex flex-col bg-[#faf8f5] overflow-hidden"
        >
          {/* Header - Light Pastel Earth-Tone */}
          <header className="px-4 py-2.5 bg-[#fdfbf7] border-b border-[#e8dfd3] flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-2xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#eef5ee] text-[#2c5c36] border border-[#bad8bf] flex items-center justify-center shrink-0">
                <Layers className="w-4 h-4 text-[#3b6845]" />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm sm:text-base font-extrabold text-[#3d332a]">
                    สตูดิโอคัดแยกแท็กฟุตเทจ
                  </h2>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-mono font-bold bg-[#fef8ed] text-[#734b17] border border-[#edd7af] tabular-nums">
                    รอจัดระเบียบ {stagingCount} คลิป
                  </span>
                </div>
              </div>
            </div>

            {/* Middle Action Feedback / Toast Message */}
            {toastMessage && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#eef5ee] border border-[#bad8bf] text-[#254b2d] text-xs font-bold shadow-2xs"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-[#3b6845]" />
                <span>{toastMessage}</span>
              </motion.div>
            )}

            {/* Right Controls */}
            <div className="flex items-center gap-2">
              <CleanPrefixedTitlesButton compact />

              {lastUndoRecord && (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-[#eef5ee] border border-[#bad8bf] text-[#254b2d] text-xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#3b6845] shrink-0" />
                  <span>
                    ย้าย {lastUndoRecord.movedCount} คลิป ➔{' '}
                    <strong className="text-[#1c4323]">
                      #{lastUndoRecord.targetTagName}
                    </strong>
                  </span>
                  <button
                    type="button"
                    onClick={onUndoLastQuickSort}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#3b6845] hover:bg-[#2c5235] text-white font-bold cursor-pointer transition-colors shadow-2xs"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>เลิกทำ</span>
                  </button>
                  <button
                    type="button"
                    onClick={onDismissUndoRecord}
                    className="text-[#7d6e61] hover:text-[#3d332a] cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={() => setIsSheetTagImportModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#faf7f2] hover:bg-[#f2ebe0] text-[#3d332a] border border-[#e2d5c4] transition-colors cursor-pointer"
                title="จับคู่แท็กและจัดอันดับ EP ย้อนหลังจาก Google Sheets"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-[#3b6845]" />
                <span className="hidden sm:inline">จับคู่แท็กจาก Sheet ให้คลิปในคลัง</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#faf7f2] hover:bg-[#f2ebe0] text-[#524538] border border-[#e2d5c4] transition-colors cursor-pointer"
                title="ปิดหน้าต่าง (Esc)"
              >
                <Minimize2 className="w-3.5 h-3.5" />
                <span>ย่อกลับ (Esc)</span>
              </button>
            </div>
          </header>

          {/* Body Content */}
          {stagingCount === 0 ? (
            /* All-Clear Celebration View in Soft Pastel Earth-Tone */
            <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#fdfbf7] text-center">
              <div className="max-w-md p-8 rounded-3xl bg-white border border-[#e8dfd3] shadow-xs space-y-4">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-[#eef5ee] border border-[#bad8bf] flex items-center justify-center text-[#3b6845]">
                  <FolderCheck className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-extrabold text-[#3d332a]">
                    พื้นที่พักว่างเรียบร้อยแล้ว! 🎉
                  </h3>
                  <p className="text-sm text-[#6e5f52] leading-relaxed">
                    คุณจัดระเบียบและติดแท็กฟุตเทจทุกคลิปเสร็จสิ้นสมบูรณ์ ไม่มีคลิปค้างรอในพื้นที่พัก
                  </p>
                </div>
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-[#3b6845] hover:bg-[#2c5235] text-white shadow-xs transition-colors cursor-pointer"
                  >
                    <span>กลับไปยังคลังคลิปหลัก</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Split Dual-Pane Viewport */
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
              {/* Left Pane: Staging Queue List */}
              <div className="w-full md:w-[42%] lg:w-[38%] h-2/5 md:h-full flex flex-col overflow-hidden">
                <StagingStudioFootageList
                  activeFootageId={activeFootageId}
                  onSetActiveFootageId={setActiveFootageId}
                  onStartDragFootage={onStartDragFootage}
                  onEndDragFootage={onEndDragFootage}
                  onSelectWithRange={onSelectWithRange}
                />
              </div>

              {/* Right Pane: Active Footage Inspector & Fast Tagging Matrix */}
              <div className="flex-1 h-3/5 md:h-full flex flex-col overflow-hidden bg-[#faf8f5]">
                <StagingStudioCategoryMatrix
                  activeFootage={activeFootage}
                  activeFootageIndex={activeFootageIndex}
                  totalStagingCount={stagingCount}
                  stagedTagIds={stagedTagIds}
                  onToggleTag={handleToggleTag}
                  onClearStagedTags={handleClearStagedTags}
                  onSaveAndAdvance={handleSaveAndAdvance}
                  onQuickAssignCategory={onQuickAssignCategory}
                  onSkipNext={handleSkipNext}
                  onSkipPrev={handleSkipPrev}
                  isAutoAdvanceEnabled={isAutoAdvanceEnabled}
                  onToggleAutoAdvance={() => setIsAutoAdvanceEnabled((prev) => !prev)}
                />
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
};
