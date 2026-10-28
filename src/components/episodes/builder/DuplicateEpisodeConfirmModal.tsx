import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AlertTriangle, AlertOctagon, Calendar, X } from 'lucide-react';
import { EpisodeSimilarityMatch } from '../../../utils/collisionDetector';

interface DuplicateEpisodeConfirmModalProps {
  isOpen: boolean;
  topSimilarityMatch: EpisodeSimilarityMatch | null;
  onClose: () => void;
  onConfirmSave: () => void;
}

export const DuplicateEpisodeConfirmModal: React.FC<
  DuplicateEpisodeConfirmModalProps
> = ({ isOpen, topSimilarityMatch, onClose, onConfirmSave }) => {
  return (
    <AnimatePresence>
      {isOpen && topSimilarityMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden"
          >
            {/* Modal Header */}
            <div
              className={`p-5 flex items-start gap-4 border-b ${
                topSimilarityMatch.severity === 'EXACT_DUPLICATE_100'
                  ? 'bg-rose-50 border-rose-200 text-rose-950'
                  : 'bg-amber-50 border-amber-200 text-amber-950'
              }`}
            >
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 ${
                  topSimilarityMatch.severity === 'EXACT_DUPLICATE_100'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'bg-amber-500 text-white shadow-sm'
                }`}
              >
                {topSimilarityMatch.severity === 'EXACT_DUPLICATE_100' ? (
                  <AlertOctagon className="w-6 h-6 text-white" />
                ) : (
                  <AlertTriangle className="w-6 h-6 text-white" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-extrabold tracking-tight">
                  {topSimilarityMatch.severity === 'EXACT_DUPLICATE_100'
                    ? 'ตรวจพบเนื้อหาและอันดับซ้ำ 100% เป๊ะ!'
                    : 'ตรวจพบฟุตเทจชุดเดิมซ้ำ 100% (สลับอันดับ)!'}
                </h3>
                <p className="text-xs mt-1 leading-relaxed opacity-90">
                  {topSimilarityMatch.severity === 'EXACT_DUPLICATE_100'
                    ? 'ทั้ง 5 ฟุตเทจและลำดับอันดับ 1–5 ตรงกับตอนที่เคยออกอากาศไปแล้วทุกประการ'
                    : 'ฟุตเทจทั้ง 5 ชิ้นเหมือนกับตอนเดิมครบถ้วน 100% เพียงแต่มีการสลับตำแหน่งอันดับ'}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4">
              <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-3.5 space-y-1.5 text-xs">
                <div className="text-slate-500 font-semibold">
                  ตอนเดิมในระบบที่ตรวจพบความซ้ำ:
                </div>
                <div className="font-bold text-slate-900 text-sm">
                  {topSimilarityMatch.matchedEpisode.id}: &ldquo;
                  {topSimilarityMatch.matchedEpisode.title}&rdquo;
                </div>
                <div className="text-slate-600 flex items-center gap-2 text-[11px]">
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>วันที่ออกอากาศ: {topSimilarityMatch.matchedEpisode.publishDate}</span>
                  </span>
                  <span>•</span>
                  <span className="font-mono font-bold text-rose-600">
                    ความคล้าย {topSimilarityMatch.similarityPercentage}%
                  </span>
                </div>
              </div>

              <div className="text-xs text-slate-600 leading-relaxed">
                คุณต้องการยืนยันที่จะบันทึกตอนนี้เพื่อใช้เป็น{' '}
                <span className="font-bold text-slate-900">
                  ตอนรีรัน / เวอร์ชันพิเศษ
                </span>{' '}
                หรือต้องการย้อนกลับไปเปลี่ยนฟุตเทจบางอันดับเพื่อเพิ่มความสดใหม่?
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-200/80 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition-colors cursor-pointer"
              >
                ย้อนกลับไปแก้ไขคลิป
              </button>

              <button
                type="button"
                onClick={onConfirmSave}
                className={`px-4 py-2 text-xs font-extrabold text-white rounded-xl transition-all shadow-sm cursor-pointer ${
                  topSimilarityMatch.severity === 'EXACT_DUPLICATE_100'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-amber-600 hover:bg-amber-700'
                }`}
              >
                ฉันรับทราบ ยืนยันบันทึกตอนนี้
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
