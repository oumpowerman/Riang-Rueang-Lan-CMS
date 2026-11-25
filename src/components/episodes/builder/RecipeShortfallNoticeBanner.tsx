import React from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { AlertTriangle, Film, Globe, Layers, X } from 'lucide-react';
import { RecipeShortfallNotice } from './builder.types';

interface RecipeShortfallNoticeBannerProps {
  notice: RecipeShortfallNotice | null;
  onDismiss: () => void;
  onOpenManualPool: () => void;
  onSwitchToOrAndRefill: () => void;
  onEnableCrossCategoryAndRefill: () => void;
}

export const RecipeShortfallNoticeBanner: React.FC<
  RecipeShortfallNoticeBannerProps
> = ({
  notice,
  onDismiss,
  onOpenManualPool,
  onSwitchToOrAndRefill,
  onEnableCrossCategoryAndRefill,
}) => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <AnimatePresence initial={false}>
      {notice && (
        <motion.div
          key="recipe-shortfall-banner"
          initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
          transition={{ duration: prefersReducedMotion ? 0.08 : 0.2 }}
          className="bg-[#fef8ed] border border-[#ecd2a4] rounded-xl px-3 py-2.5 space-y-2 text-[#6b4415]"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2 min-w-0">
              <AlertTriangle className="w-4 h-4 text-[#b37731] shrink-0 mt-0.5" />
              <div className="text-xs leading-relaxed min-w-0">
                <p className="font-bold text-[#5c3910]">
                  พบคลิปพร้อมใช้ที่ตรงเงื่อนไข{' '}
                  <span className="font-mono tabular-nums font-extrabold">
                    {notice.matchedCount}/5
                  </span>{' '}
                  อันดับ (ขาดอีก{' '}
                  <span className="font-mono tabular-nums font-extrabold">
                    {notice.missingCount}
                  </span>{' '}
                  คลิป)
                </p>
                <p className="text-[11px] text-[#7c5321] mt-0.5 truncate">
                  {notice.wasCrossCategory
                    ? 'กรอบปัจจุบัน: ข้ามหมวด (ทั้งคลัง)'
                    : `กรอบปัจจุบัน (${
                        notice.scopeMatchMode === 'AND' ? 'ครบทุกแท็ก' : 'บางแท็ก'
                      }): ${notice.scopeSummaryLabel}`}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onDismiss}
              className="p-1 rounded-lg text-[#8a5a22] hover:bg-[#f6e6c8] transition-colors cursor-pointer shrink-0"
              title="ปิดการแจ้งเตือน"
              aria-label="ปิดการแจ้งเตือน"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 pl-6">
            <button
              type="button"
              onClick={onOpenManualPool}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white hover:bg-[#faf5eb] text-[#5c3910] border border-[#e3c794] text-[11px] font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Film className="w-3 h-3 text-[#8a5a22]" />
              <span>เปิดคลังเลือกเพิ่มเอง</span>
            </button>

            {!notice.wasCrossCategory &&
              notice.scopeMatchMode === 'AND' &&
              notice.hasFacetTags && (
                <button
                  type="button"
                  onClick={onSwitchToOrAndRefill}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#8a5a22] hover:bg-[#734a1b] text-white text-[11px] font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 shadow-2xs"
                >
                  <Layers className="w-3 h-3" />
                  <span>สลับเป็นโหมด OR แล้วสุ่มใหม่</span>
                </button>
              )}

            {!notice.wasCrossCategory && (
              <button
                type="button"
                onClick={onEnableCrossCategoryAndRefill}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#edf4ed] hover:bg-[#dceadd] text-[#244b2f] border border-[#bad8b9] text-[11px] font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <Globe className="w-3 h-3 text-[#3b6845]" />
                <span>ดึงข้ามหมวดแล้วสุ่มใหม่</span>
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
