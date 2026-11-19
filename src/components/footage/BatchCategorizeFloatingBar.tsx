import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  CheckSquare,
  RefreshCw,
  Sparkles,
  Tag,
  Trash2,
  X,
} from 'lucide-react';
import { useCMS } from '../../context/CMSContext';
import { BatchDeleteFootageResult } from '../../context/cms/cms.types';
import { isStagingTagId } from '../../services/seedData';
import { getEntityIconNode } from '../ui/TagPill';
import { BatchDeleteFootageConfirmModal } from './BatchDeleteFootageConfirmModal';

export const BatchCategorizeFloatingBar: React.FC = () => {
  const {
    selectedFootageIdsForBatch,
    setSelectedFootageIdsForBatch,
    setIsBatchAssignCategoryModalOpen,
    batchDeleteFootage,
    computedFootageMap,
    tags,
    tagMap,
    quickAssignCategoryToFootage,
  } = useCMS();

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeletingBatch, setIsDeletingBatch] = useState(false);
  const [deleteProgressLabel, setDeleteProgressLabel] = useState<string>('');
  const [deleteResult, setDeleteResult] =
    useState<BatchDeleteFootageResult | null>(null);

  const quickCategories = useMemo(() => {
    const realTags = tags.filter((t) => !isStagingTagId(t.id));
    const subTags = realTags.filter((t) => Boolean(t.parentId));
    const mainTags = realTags.filter((t) => !t.parentId);
    return [...mainTags, ...subTags].slice(0, 12);
  }, [tags]);

  const showFloatingBar = selectedFootageIdsForBatch.length > 0 || isDeletingBatch;
  if (!showFloatingBar && !isDeleteModalOpen) return null;

  const count = selectedFootageIdsForBatch.length;

  const handleOpenBatchAssignModal = () => {
    if (isDeletingBatch) return;
    setIsBatchAssignCategoryModalOpen(true);
  };

  const handleOpenDeleteConfirmModal = () => {
    if (isDeletingBatch || selectedFootageIdsForBatch.length === 0) return;
    setDeleteResult(null);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    if (isDeletingBatch) return;
    setIsDeleteModalOpen(false);
    setDeleteResult(null);
  };

  const handleConfirmBatchDelete = async (idsToDelete: string[]) => {
    if (isDeletingBatch || idsToDelete.length === 0) return;
    const uniqueIds = Array.from(new Set(idsToDelete));
    const deletedSet = new Set(uniqueIds);

    setIsDeletingBatch(true);
    const totalChunks = Math.max(1, Math.ceil(uniqueIds.length / 400));
    setDeleteProgressLabel(
      `กำลังลบออกจาก Cloud ก้อนที่ 1/${totalChunks} (0/${uniqueIds.length.toLocaleString()})...`
    );

    try {
      const result = await batchDeleteFootage(uniqueIds, (chunkProg) => {
        const nextChunk = Math.min(
          chunkProg.totalChunks,
          chunkProg.completedChunks + 1
        );
        setDeleteProgressLabel(
          `กำลังลบออกจาก Cloud ก้อนที่ ${nextChunk}/${chunkProg.totalChunks} (${chunkProg.completedOps.toLocaleString()}/${chunkProg.totalOps.toLocaleString()})...`
        );
      });
      setSelectedFootageIdsForBatch((prev) =>
        prev.filter((id) => !deletedSet.has(id))
      );
      setDeleteResult(result);
    } finally {
      setIsDeletingBatch(false);
      setDeleteProgressLabel('');
    }
  };

  const handleClearSelection = () => {
    if (isDeletingBatch) return;
    setSelectedFootageIdsForBatch([]);
  };

  return (
    <>
      <AnimatePresence>
        {showFloatingBar && (
          <motion.div
            key="batch-categorize-floating-bar"
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 350, damping: 25 }}
            className="fixed bottom-20 md:bottom-5 left-1/2 -translate-x-1/2 z-40 bg-white/95 text-slate-900 backdrop-blur-md px-3.5 py-2.5 rounded-2xl shadow-xl border border-slate-200/90 flex flex-col gap-2 max-w-2xl w-[94%]"
          >
            <div className="flex items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shrink-0">
                  {isDeletingBatch ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-rose-600" />
                  ) : (
                    <CheckSquare className="w-3.5 h-3.5" />
                  )}
                </div>
                <span className="text-xs sm:text-sm font-extrabold text-slate-900 tabular-nums">
                  {isDeletingBatch
                    ? deleteProgressLabel || 'กำลังลบข้อมูลออกจาก Cloud...'
                    : `เลือก ${count.toLocaleString()} คลิป`}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleOpenBatchAssignModal}
                  disabled={isDeletingBatch}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold shadow-2xs transition-all cursor-pointer whitespace-nowrap"
                >
                  <Tag className="w-3.5 h-3.5" />
                  <span>เลือกหมวด...</span>
                </button>

                <button
                  type="button"
                  onClick={handleOpenDeleteConfirmModal}
                  disabled={isDeletingBatch}
                  className="p-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 disabled:opacity-50 text-slate-500 hover:text-rose-600 border border-slate-200 transition-colors cursor-pointer"
                  title="ลบคลิปที่เลือก"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={handleClearSelection}
                  disabled={isDeletingBatch}
                  className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-500 hover:text-slate-800 border border-slate-200 transition-colors cursor-pointer"
                  title="ยกเลิกการเลือก"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* 1-Click Quick Category Strip */}
            {quickCategories.length > 0 && (
              <div className="pt-1.5 border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto scrollbar-thin pb-0.5">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 shrink-0">
                  <Sparkles className="w-3 h-3 text-indigo-600" />
                  <span>ย้ายด่วน:</span>
                </span>
                {quickCategories.map((cat) => {
                  const parent = cat.parentId ? tagMap[cat.parentId] : null;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() =>
                        quickAssignCategoryToFootage(
                          selectedFootageIdsForBatch,
                          cat.id
                        )
                      }
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-900 border border-slate-200 hover:border-indigo-300 text-[11px] font-semibold transition-all shrink-0 cursor-pointer"
                    >
                      {getEntityIconNode(cat)}
                      {parent && (
                        <span className="opacity-65 font-normal">
                          {parent.name} &rsaquo;
                        </span>
                      )}
                      <span>#{cat.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Portal-rendered Light Pastel Confirmation Modal */}
      <BatchDeleteFootageConfirmModal
        isOpen={isDeleteModalOpen}
        selectedFootageIds={selectedFootageIdsForBatch}
        computedFootageMap={computedFootageMap}
        isDeleting={isDeletingBatch}
        deleteProgressLabel={deleteProgressLabel}
        deleteResult={deleteResult}
        onClose={handleCloseDeleteModal}
        onConfirmDelete={handleConfirmBatchDelete}
      />
    </>
  );
};
