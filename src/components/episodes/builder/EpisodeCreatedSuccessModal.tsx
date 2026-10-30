import React, { useState } from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, Copy, Check, ArrowRight, RotateCw, Archive, Sparkles, Video, Calendar, Clock } from 'lucide-react';
import { Episode } from '../../../types/episode.types';
import { ComputedFootage } from '../../../types/footage.types';
import { CategoryTag } from '../../../types/tag.types';
import { Modal } from '../../ui/Modal';

interface EpisodeCreatedSuccessModalProps {
  episode: Episode | null;
  isOpen: boolean;
  onClose: () => void;
  onContinueSameCategory: () => void;
  onOpenArchive: () => void;
  computedFootageMap: Record<string, ComputedFootage>;
  tagMap: Record<string, CategoryTag>;
}

export const EpisodeCreatedSuccessModal: React.FC<EpisodeCreatedSuccessModalProps> = ({
  episode,
  isOpen,
  onClose,
  onContinueSameCategory,
  onOpenArchive,
  computedFootageMap,
  tagMap,
}) => {
  const [copiedFileName, setCopiedFileName] = useState(false);

  if (!episode) return null;

  const mainTag = tagMap[episode.mainCategoryTagId];
  const categoryEpNo = episode.categoryEpisodeNo || 1;
  const fileName = episode.masterVideoInfo.masterFileName;

  const handleCopyFileName = () => {
    navigator.clipboard?.writeText(fileName);
    setCopiedFileName(true);
    setTimeout(() => setCopiedFileName(false), 1600);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="สร้างตอน 5 อันดับสำเร็จแล้ว!"
      subtitle={`บันทึกเข้าสู่ระบบเรียบร้อย พร้อมสำหรับขั้นตอนต่อไป`}
      maxWidthClass="max-w-2xl"
    >
      <div className="space-y-4">
        {/* Banner Hero Card in Warm Pastel Sage */}
        <div className="bg-[#FAF7F2] border border-amber-200/80 rounded-2xl p-4 sm:p-5 space-y-3 shadow-2xs">
          <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2.5 border-b border-amber-200/60">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-xl bg-amber-100 text-amber-900 border border-amber-300 font-mono font-bold text-sm shadow-2xs">
                {episode.id}
              </span>
              <span className="px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-xs flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>{mainTag?.name || 'หมวดหมู่'} · EP.{categoryEpNo}</span>
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-stone-500 font-mono">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-stone-400" />
                <span>{episode.publishDate}</span>
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-stone-400" />
                <span>{episode.publishSlot === 'MORNING_0600' ? 'เช้า 06:00' : 'เย็น 18:00'}</span>
              </span>
            </div>
          </div>

          <h3 className="text-base sm:text-lg font-bold text-stone-900 leading-snug">
            {episode.title}
          </h3>

          {/* Master File Name for Video Editor */}
          <div>
            <label className="block text-xs font-semibold text-stone-600 mb-1">
              ชื่อไฟล์มาตรฐานสำหรับส่งให้ทีมตัดต่อ (Google Drive):
            </label>
            <div className="flex items-center gap-2 p-2 px-3 bg-white border border-stone-200 rounded-xl">
              <span className="font-mono text-xs text-stone-800 font-semibold truncate flex-1" title={fileName}>
                {fileName}
              </span>
              <button
                type="button"
                onClick={handleCopyFileName}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200 flex items-center gap-1 shrink-0 transition-all cursor-pointer shadow-2xs"
              >
                {copiedFileName ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-800">คัดลอกแล้ว</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-stone-500" />
                    <span>คัดลอกชื่อไฟล์</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* 5-Rank Footage Breakdown Preview */}
        <div className="bg-white border border-stone-200 rounded-2xl p-4 space-y-2.5">
          <h4 className="text-xs font-bold text-stone-700 flex items-center justify-between">
            <span>รายการฟุตเทจที่จัดเรียงในตอนนี้ (5 อันดับ)</span>
            <span className="font-normal text-stone-400">เรียงจาก 5 ➔ 1</span>
          </h4>

          <div className="space-y-1.5">
            {episode.rankings.map((slot) => {
              const ft = slot.footageId ? computedFootageMap[slot.footageId] : null;
              return (
                <div
                  key={slot.rank}
                  className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-stone-50/70 border border-stone-200/80 text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-mono font-bold text-[11px] flex items-center justify-center shrink-0">
                      {slot.rank}
                    </span>
                    <span className="font-mono font-bold text-stone-900 shrink-0">
                      {slot.footageId || '-'}
                    </span>
                    <span className="truncate text-stone-700">
                      {ft?.title || 'ไม่มีชื่อคลิป'}
                    </span>
                  </div>

                  {slot.snapshotNote && (
                    <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md shrink-0">
                      {slot.snapshotNote}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-2.5 border-t border-stone-200">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
          >
            ปิดหน้าต่างนี้
          </button>

          <div className="w-full sm:w-auto flex flex-col sm:flex-row items-center gap-2">
            <button
              type="button"
              onClick={onOpenArchive}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors cursor-pointer"
            >
              <Archive className="w-3.5 h-3.5" />
              <span>เปิดดูคลังคลิปหลัก</span>
            </button>

            <motion.button
              type="button"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={onContinueSameCategory}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2.5 text-xs sm:text-sm font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>ทำตอนต่อไปในหมวดนี้ทันที (EP.{categoryEpNo + 1})</span>
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
