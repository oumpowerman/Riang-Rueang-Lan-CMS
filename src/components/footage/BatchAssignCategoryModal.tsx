import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Check,
  CheckCircle2,
  ChevronRight,
  FolderOpen,
  Inbox,
  Layers,
  Sparkles,
  Tag,
  Trash2,
  X,
  Zap,
} from 'lucide-react';
import { useCMS } from '../../context/CMSContext';
import { isStagingTagId, STAGING_TAG_ID } from '../../services/seedData';
import { CascadeCategorySelector } from '../tags/CascadeCategorySelector';
import { TagPill } from '../ui/TagPill';

export const BatchAssignCategoryModal: React.FC = () => {
  const {
    isBatchAssignCategoryModalOpen,
    setIsBatchAssignCategoryModalOpen,
    selectedFootageIdsForBatch,
    setSelectedFootageIdsForBatch,
    batchUpdateFootageTags,
    computedFootage,
    tagMap,
  } = useCMS();

  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [updateMode, setUpdateMode] = useState<'REPLACE' | 'APPEND'>('REPLACE');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Selected footages details
  const targetFootages = useMemo(() => {
    const targetSet = new Set(selectedFootageIdsForBatch);
    return computedFootage.filter((f) => targetSet.has(f.id));
  }, [computedFootage, selectedFootageIdsForBatch]);

  // Check how many clips were in staging
  const stagingCount = useMemo(() => {
    return targetFootages.filter((f) => f.tags.some((t) => isStagingTagId(t))).length;
  }, [targetFootages]);

  const handleRemoveOneFromBatch = (idToRemove: string) => {
    setSelectedFootageIdsForBatch((prev) => prev.filter((id) => id !== idToRemove));
    if (selectedFootageIdsForBatch.length <= 1) {
      handleClose();
    }
  };

  const handleApplyBatchTags = () => {
    if (selectedTagIds.length === 0 || selectedFootageIdsForBatch.length === 0) return;
    setIsSubmitting(true);

    try {
      // Filter out staging tag from new tags if user selected a real category
      const realTags = selectedTagIds.filter((t) => !isStagingTagId(t));
      const finalTags = realTags.length > 0 ? realTags : selectedTagIds;

      batchUpdateFootageTags(selectedFootageIdsForBatch, finalTags, updateMode);
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setSelectedFootageIdsForBatch([]);
        setSelectedTagIds([]);
        setIsBatchAssignCategoryModalOpen(false);
      }, 1000);
    } catch (err) {
      console.error('Batch assign category error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsBatchAssignCategoryModalOpen(false);
    setIsSuccess(false);
  };

  if (!isBatchAssignCategoryModalOpen || selectedFootageIdsForBatch.length === 0) return null;

  const hasRealTagSelected = selectedTagIds.some((t) => !isStagingTagId(t));

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold flex items-center gap-2">
                <span>จัดหมวดหมู่แบบกลุ่ม (Batch Categorization)</span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                  {selectedFootageIdsForBatch.length} ฟุตเทจ
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                เลือกหมวดหมู่หลักและหมวดย่อยเพื่ออัปเดตให้กับฟุตเทจที่เลือกพร้อมกันทั้งหมด
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {isSuccess ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-12 text-center space-y-3 bg-emerald-50/70 border border-emerald-200 rounded-2xl"
            >
              <div className="w-14 h-14 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-base font-bold text-emerald-950">
                จัดหมวดหมู่ให้ {selectedFootageIdsForBatch.length} ฟุตเทจสำเร็จแล้ว!
              </h4>
              <p className="text-xs text-emerald-700">
                ฟุตเทจถูกย้ายเข้าสู่หมวดหมู่ที่เลือก และนำไปคำนวณโควตาทำคลิปเรียบร้อย
              </p>
            </motion.div>
          ) : (
            <>
              {/* Summary Strip of Selected Clips */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-indigo-600" />
                    <span>รายการคลิปที่เลือก ({targetFootages.length} รายการ):</span>
                  </span>
                  {stagingCount > 0 && (
                    <span className="text-[11px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-md flex items-center gap-1">
                      <Inbox className="w-3 h-3 text-amber-600" />
                      <span>{stagingCount} รายการอยู่ในพื้นที่พัก</span>
                    </span>
                  )}
                </div>

                {/* Pill List of Selected Clip Titles with Quick Delete */}
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1 bg-white rounded-xl border border-slate-200/80">
                  {targetFootages.map((ft) => (
                    <span
                      key={ft.id}
                      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[11px] font-medium bg-slate-100 text-slate-800 border border-slate-200 max-w-xs truncate"
                      title={ft.title}
                    >
                      <span className="font-mono font-bold text-indigo-700 shrink-0">{ft.id}</span>
                      <span className="truncate">{ft.title}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveOneFromBatch(ft.id)}
                        className="text-slate-400 hover:text-rose-600 cursor-pointer ml-0.5"
                        title="เอาออกจากชุดนี้"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Mode Selection */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  วิธีการอัปเดตหมวดหมู่:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setUpdateMode('REPLACE')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      updateMode === 'REPLACE'
                        ? 'bg-indigo-50 border-indigo-400 ring-2 ring-indigo-200 font-bold text-indigo-950'
                        : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span>แทนที่หมวดเดิมทั้งหมด (แนะนำ)</span>
                      {updateMode === 'REPLACE' && <Check className="w-4 h-4 text-indigo-600" />}
                    </div>
                    <p className="text-[11px] font-normal text-slate-500 mt-1">
                      ย้ายออกจากพื้นที่พักทันที และใช้เฉพาะหมวดหมู่ใหม่ที่เลือก
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setUpdateMode('APPEND')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      updateMode === 'APPEND'
                        ? 'bg-indigo-50 border-indigo-400 ring-2 ring-indigo-200 font-bold text-indigo-950'
                        : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span>เพิ่มหมวดนี้เข้าไป (คงหมวดเดิมไว้)</span>
                      {updateMode === 'APPEND' && <Check className="w-4 h-4 text-indigo-600" />}
                    </div>
                    <p className="text-[11px] font-normal text-slate-500 mt-1">
                      คงหมวดหมู่ที่มีอยู่เดิมไว้ และเพิ่มหมวดใหม่เข้าไปพร้อมกัน
                    </p>
                  </button>
                </div>
              </div>

              {/* Cascade Category Selector */}
              <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 space-y-3">
                <CascadeCategorySelector
                  selectedTagIds={selectedTagIds}
                  onChange={setSelectedTagIds}
                  label="เลือกหมวดหมู่ที่จะกำหนดให้กับคลิปทั้งหมด:"
                  helperText="เลือกกลุ่มหมวดหมู่ -> เลือกหมวดหลัก (Tier 1) -> เลือกหมวดย่อย (Tier 2)"
                  allowMultipleSubcategories={true}
                />
              </div>

              {/* Selected Categories Preview */}
              {selectedTagIds.length > 0 && (
                <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5 text-xs">
                    <span className="font-bold text-indigo-900">หมวดหมู่ที่จะได้รับ:</span>
                    {selectedTagIds.map((tid) => {
                      const tag = tagMap[tid];
                      return (
                        <TagPill
                          key={tid}
                          tag={tag}
                          onRemove={() =>
                            setSelectedTagIds((prev) => prev.filter((id) => id !== tid))
                          }
                        />
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!isSuccess && (
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold cursor-pointer"
            >
              ยกเลิก
            </button>

            <button
              type="button"
              onClick={handleApplyBatchTags}
              disabled={isSubmitting || !hasRealTagSelected || selectedFootageIdsForBatch.length === 0}
              className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold inline-flex items-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <Tag className="w-3.5 h-3.5 text-amber-400" />
              <span>
                ยืนยันจัดหมวดหมู่ {selectedFootageIdsForBatch.length} ฟุตเทจพร้อมกัน
              </span>
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};
