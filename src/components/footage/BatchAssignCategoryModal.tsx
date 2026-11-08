import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  Check,
  CheckCircle2,
  Inbox,
  Layers,
  RefreshCw,
  Tag,
  X,
} from 'lucide-react';
import { useCMS } from '../../context/CMSContext';
import { isStagingTagId } from '../../services/seedData';
import { CascadeCategorySelector } from '../tags/CascadeCategorySelector';
import { BaseModal } from '../ui/BaseModal';
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
  const [chunkProgressText, setChunkProgressText] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState(false);

  const targetFootages = useMemo(() => {
    const targetSet = new Set(selectedFootageIdsForBatch);
    return computedFootage.filter((f) => targetSet.has(f.id));
  }, [computedFootage, selectedFootageIdsForBatch]);

  const stagingCount = useMemo(() => {
    return targetFootages.filter((f) => f.tags.some((t) => isStagingTagId(t))).length;
  }, [targetFootages]);

  const handleClose = () => {
    if (isSubmitting) return;
    setIsBatchAssignCategoryModalOpen(false);
    setIsSuccess(false);
    setChunkProgressText('');
  };

  const handleRemoveOneFromBatch = (idToRemove: string) => {
    if (isSubmitting) return;
    setSelectedFootageIdsForBatch((prev) => prev.filter((id) => id !== idToRemove));
    if (selectedFootageIdsForBatch.length <= 1) {
      handleClose();
    }
  };

  const handleApplyBatchTags = async () => {
    if (selectedTagIds.length === 0 || selectedFootageIdsForBatch.length === 0) return;
    setIsSubmitting(true);
    const totalChunksEst = Math.max(1, Math.ceil(selectedFootageIdsForBatch.length / 400));
    setChunkProgressText(
      `กำลังบันทึกขึ้น Cloud ก้อนที่ 1/${totalChunksEst} (0/${selectedFootageIdsForBatch.length.toLocaleString()} คลิป)...`
    );

    try {
      const realTags = selectedTagIds.filter((t) => !isStagingTagId(t));
      const finalTags = realTags.length > 0 ? realTags : selectedTagIds;

      await batchUpdateFootageTags(
        selectedFootageIdsForBatch,
        finalTags,
        updateMode,
        (chunkProg) => {
          const nextChunk = Math.min(chunkProg.totalChunks, chunkProg.completedChunks + 1);
          if (chunkProg.completedChunks < chunkProg.totalChunks) {
            setChunkProgressText(
              `กำลังบันทึกขึ้น Cloud ก้อนที่ ${nextChunk}/${chunkProg.totalChunks} (${chunkProg.completedOps.toLocaleString()}/${chunkProg.totalOps.toLocaleString()} คลิป)...`
            );
          } else {
            setChunkProgressText(
              `บันทึกครบ ${chunkProg.totalChunks}/${chunkProg.totalChunks} ก้อน (${chunkProg.totalOps.toLocaleString()} คลิป)!`
            );
          }
        }
      );

      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setSelectedFootageIdsForBatch([]);
        setSelectedTagIds([]);
        setChunkProgressText('');
        setIsBatchAssignCategoryModalOpen(false);
      }, 950);
    } catch (err) {
      console.error('Batch assign category error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasRealTagSelected = selectedTagIds.some((t) => !isStagingTagId(t));

  return (
    <BaseModal
      isOpen={isBatchAssignCategoryModalOpen && selectedFootageIdsForBatch.length > 0}
      onClose={handleClose}
      closeOnBackdropClick={!isSubmitting}
      closeOnEsc={!isSubmitting}
      maxWidthClass="max-w-3xl"
      heightClass="max-h-[92vh]"
      icon={<Tag className="w-5 h-5 text-[#6e491c]" />}
      title="จัดแท็กแบบกลุ่ม (Batch Multi-Tagging)"
      badge={
        <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-[#eaf4ec] text-[#245233] border border-[#c6e1cb] font-bold">
          {selectedFootageIdsForBatch.length.toLocaleString()} ฟุตเทจ
        </span>
      }
      subtitle="เลือกป้ายแท็กหลายมิติเพื่ออัปเดตให้กับฟุตเทจที่เลือกพร้อมกันทั้งหมด และซิงก์ขึ้น Cloud ครบทุกก้อน"
      bodyClassName="p-6 bg-[#FAF8F5] overflow-y-auto scrollbar-thin space-y-5"
      footer={
        !isSuccess ? (
          <div className="flex flex-wrap items-center justify-between gap-3 w-full">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className={`px-4 py-2 rounded-xl border text-xs font-bold transition-colors ${
                isSubmitting
                  ? 'bg-[#EFECE6] text-[#A39688] border-[#dfd7ca] cursor-not-allowed opacity-60'
                  : 'bg-white border-[#dfd7ca] text-[#5c5042] hover:bg-[#f4eee5] cursor-pointer'
              }`}
            >
              ยกเลิก
            </button>

            <button
              type="button"
              onClick={handleApplyBatchTags}
              disabled={
                isSubmitting || !hasRealTagSelected || selectedFootageIdsForBatch.length === 0
              }
              className="px-5 py-2.5 rounded-xl bg-[#3B6845] hover:bg-[#2D5236] disabled:opacity-50 text-white text-xs font-bold inline-flex items-center gap-2 shadow-2xs transition-all cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                  <span className="font-mono">
                    {chunkProgressText || 'กำลังบันทึกขึ้น Cloud...'}
                  </span>
                </>
              ) : (
                <>
                  <Tag className="w-3.5 h-3.5 text-[#E8F5E9]" />
                  <span>
                    ยืนยันติดแท็ก {selectedFootageIdsForBatch.length.toLocaleString()} ฟุตเทจพร้อมกัน
                  </span>
                </>
              )}
            </button>
          </div>
        ) : undefined
      }
    >
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
            จัดหมวดหมู่ให้ {selectedFootageIdsForBatch.length.toLocaleString()} ฟุตเทจขึ้น Cloud สำเร็จ 100%!
          </h4>
          <p className="text-xs text-emerald-700">
            ฟุตเทจถูกย้ายเข้าสู่หมวดหมู่ที่เลือก และนำไปคำนวณโควตาทำคลิปเรียบร้อย
          </p>
        </motion.div>
      ) : (
        <>
          {/* Summary Strip of Selected Clips */}
          <div className="bg-white border border-[#E8DFD3] rounded-2xl p-4 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#3D332A] flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#3B6845]" />
                <span>รายการคลิปที่เลือก ({targetFootages.length.toLocaleString()} รายการ):</span>
              </span>
              {stagingCount > 0 && (
                <span className="text-[11px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <Inbox className="w-3 h-3 text-amber-600" />
                  <span>{stagingCount.toLocaleString()} รายการอยู่ในพื้นที่พัก</span>
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto scrollbar-thin p-1 bg-[#FAF8F5] rounded-xl border border-[#EFE7DC]">
              {targetFootages.slice(0, 120).map((ft) => (
                <span
                  key={ft.id}
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[11px] font-medium bg-white text-[#3D332A] border border-[#E2D5C4] max-w-xs truncate"
                  title={ft.title}
                >
                  <span className="font-mono font-bold text-[#1C4824] shrink-0">{ft.id}</span>
                  <span className="truncate">{ft.title}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveOneFromBatch(ft.id)}
                    className="text-[#8E8174] hover:text-rose-600 cursor-pointer ml-0.5"
                    title="เอาออกจากชุดนี้"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              {targetFootages.length > 120 && (
                <span className="px-2 py-0.5 rounded-lg text-[11px] font-mono font-bold bg-[#EEF5EE] text-[#1C4824] border border-[#BAD8BF]">
                  +อีก {(targetFootages.length - 120).toLocaleString()} รายการ
                </span>
              )}
            </div>
          </div>

          {/* Mode Selection */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#3D332A]">
              วิธีการอัปเดตหมวดหมู่:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setUpdateMode('REPLACE')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  updateMode === 'REPLACE'
                    ? 'bg-[#EEF5EE] border-[#86BF92] ring-2 ring-[#C5E2CA] font-bold text-[#1C4824]'
                    : 'bg-white border-[#E8DFD3] hover:bg-[#FAF7F2] text-[#524538]'
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <span>แทนที่หมวดเดิมทั้งหมด (แนะนำ)</span>
                  {updateMode === 'REPLACE' && <Check className="w-4 h-4 text-[#2E7D32]" />}
                </div>
                <p className="text-[11px] font-normal text-[#7D6E61] mt-1">
                  ย้ายออกจากพื้นที่พักทันที และใช้เฉพาะหมวดหมู่ใหม่ที่เลือก
                </p>
              </button>

              <button
                type="button"
                onClick={() => setUpdateMode('APPEND')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  updateMode === 'APPEND'
                    ? 'bg-[#FEF8ED] border-[#DFC08E] ring-2 ring-[#F2DFBE] font-bold text-[#734B17]'
                    : 'bg-white border-[#E8DFD3] hover:bg-[#FAF7F2] text-[#524538]'
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <span>เพิ่มแท็กเหล่านี้เข้าไป (คงแท็กเดิมไว้)</span>
                  {updateMode === 'APPEND' && <Check className="w-4 h-4 text-[#8A5A22]" />}
                </div>
                <p className="text-[11px] font-normal text-[#7D6E61] mt-1">
                  คงป้ายแท็กที่มีอยู่เดิมไว้ และเพิ่มแท็กใหม่เข้าไปพร้อมกัน
                </p>
              </button>
            </div>
          </div>

          {/* Cascade Category Selector */}
          <div className="border border-[#E8DFD3] rounded-2xl p-4 bg-white space-y-3">
            <CascadeCategorySelector
              selectedTagIds={selectedTagIds}
              onChange={setSelectedTagIds}
              label="เลือกป้ายแท็กที่จะกำหนดให้กับคลิปทั้งหมด (แท็กหลายมิติ):"
              helperText="เลือกมิติกลุ่มแท็ก ➔ ป้ายแท็กหลัก ➔ ป้ายแท็กย่อย / คุณลักษณะ (เลือกได้หลายแท็กอิสระ)"
              allowMultipleSubcategories={true}
            />
          </div>

          {/* Selected Categories Preview */}
          {selectedTagIds.length > 0 && (
            <div className="bg-white border border-[#E8DFD3] rounded-xl p-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className="font-bold text-[#3D332A]">ป้ายแท็กที่จะได้รับ:</span>
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
    </BaseModal>
  );
};
