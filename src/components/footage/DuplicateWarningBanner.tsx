import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, ExternalLink, Eye } from 'lucide-react';
import { DuplicateMatch } from '../../utils/duplicateDetector';

interface DuplicateWarningBannerProps {
  match: DuplicateMatch | null;
  onViewFootage?: (footageId: string) => void;
}

export const DuplicateWarningBanner: React.FC<DuplicateWarningBannerProps> = ({
  match,
  onViewFootage,
}) => {
  if (!match) return null;

  const targetUrl =
    match.footage.driveFileUrl || match.footage.originalUrl || null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -4, height: 0 }}
        animate={{ opacity: 1, y: 0, height: 'auto' }}
        exit={{ opacity: 0, y: -4, height: 0 }}
        transition={{ duration: 0.18 }}
        className="overflow-hidden"
      >
        <div className="p-2.5 rounded-xl bg-amber-50/95 border border-amber-300/80 text-amber-950 text-xs shadow-2xs space-y-1.5 mt-1.5">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-1.5 min-w-0">
              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <div className="font-bold text-amber-900 leading-snug">
                  {match.message}
                </div>
                <div className="text-[11px] text-amber-800/80 mt-0.5">
                  ระบบอนุญาตให้บันทึกได้ตามปกติ หากเป็นคนละคลิปหรือคนละเวอร์ชัน
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {onViewFootage && (
                <button
                  type="button"
                  onClick={() => onViewFootage(match.footage.id)}
                  className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-bold text-amber-900 bg-white/90 hover:bg-white border border-amber-300 rounded-lg transition-colors cursor-pointer shadow-2xs"
                  title={`คลิกเพื่อเปิดดูรายละเอียดและประวัติของ ${match.footage.id}`}
                >
                  <Eye className="w-3 h-3 text-amber-700 shrink-0" />
                  <span>ดู {match.footage.id}</span>
                </button>
              )}

              {targetUrl && (
                <a
                  href={targetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-amber-800 bg-amber-100/70 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors cursor-pointer"
                  title="เปิดดูลิงก์ที่มีอยู่ในคลัง"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span className="hidden sm:inline">เปิดดู</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
