import React, { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Wand2,
  X,
} from 'lucide-react';

export interface Non5RankFixPreviewItem {
  id: string;
  beforeTitle: string;
  afterTitle: string;
  afterSeriesTitle: string;
}

interface EpisodeQualityWarningBannerProps {
  non5RankPreviews: Non5RankFixPreviewItem[];
  onBatchFixNon5Rank: () => Promise<void>;
  isBatchFixing?: boolean;
  batchFixResultCount?: number | null;
}

export const EpisodeQualityWarningBanner: React.FC<
  EpisodeQualityWarningBannerProps
> = ({
  non5RankPreviews,
  onBatchFixNon5Rank,
  isBatchFixing = false,
  batchFixResultCount = null,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  if (non5RankPreviews.length === 0 && batchFixResultCount === null) {
    return null;
  }

  return (
    <div className="space-y-2">
      {/* Concise Success Banner right after Batch Fix */}
      {batchFixResultCount !== null && batchFixResultCount > 0 && (
        <div className="rounded-xl px-3.5 py-2 bg-[#EBF5EB] border border-[#B5D6B3] text-[#1F4A28] flex items-center gap-2 text-xs font-bold shadow-2xs">
          <CheckCircle2 className="w-4 h-4 text-[#2E7D32] shrink-0" />
          <span className="tabular-nums">
            ปรับชื่อเป็น &ldquo;5 อันดับ&rdquo; สำเร็จ {batchFixResultCount} ตอน
          </span>
        </div>
      )}

      {non5RankPreviews.length > 0 && (
        <div className="rounded-xl px-3.5 py-2.5 border border-[#EED7C0] bg-[#FFF9F2] shadow-2xs space-y-2.5">
          {/* Compact Single-Row Action Strip */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <AlertTriangle className="w-4 h-4 text-[#B56722] shrink-0" />
              <span className="text-xs font-bold text-[#3D2916] tabular-nums truncate">
                พบ {non5RankPreviews.length} ตอนที่ชื่อยังไม่เป็น &ldquo;5 อันดับ&rdquo;
              </span>
            </div>

            <button
              type="button"
              disabled={isBatchFixing}
              onClick={() => setIsConfirmOpen((prev) => !prev)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#224A2D] hover:bg-[#193821] disabled:opacity-50 text-white shadow-2xs transition-colors cursor-pointer whitespace-nowrap shrink-0 tabular-nums"
            >
              {isBatchFixing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
              ) : (
                <Wand2 className="w-3.5 h-3.5 shrink-0" />
              )}
              <span>แก้เป็น 5 อันดับ ({non5RankPreviews.length})</span>
            </button>
          </div>

          {/* Inline Preview & Confirmation Box */}
          <AnimatePresence initial={false}>
            {isConfirmOpen && (
              <motion.div
                key="batch-fix-preview"
                initial={
                  prefersReducedMotion
                    ? { opacity: 0 }
                    : { height: 0, opacity: 0, y: -6 }
                }
                animate={
                  prefersReducedMotion
                    ? { opacity: 1 }
                    : { height: 'auto', opacity: 1, y: 0 }
                }
                exit={
                  prefersReducedMotion
                    ? { opacity: 0 }
                    : { height: 0, opacity: 0, y: -6 }
                }
                transition={{
                  duration: prefersReducedMotion ? 0.08 : 0.22,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="overflow-hidden"
              >
                <div className="pt-2.5 border-t border-[#EBD5BD] space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-bold text-[#3D2916] tabular-nums">
                      ตัวอย่างที่จะอัปเดต {non5RankPreviews.length} ตอน:
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={isBatchFixing}
                        onClick={() => setIsConfirmOpen(false)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white hover:bg-[#FAF4ED] border border-[#DEC190] text-[#5C5349] text-xs font-bold cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>ยกเลิก</span>
                      </button>
                      <button
                        type="button"
                        disabled={isBatchFixing}
                        onClick={async () => {
                          await onBatchFixNon5Rank();
                          setIsConfirmOpen(false);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#224A2D] hover:bg-[#193821] disabled:opacity-50 text-white text-xs font-bold cursor-pointer shadow-2xs tabular-nums"
                      >
                        {isBatchFixing ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        )}
                        <span>ยืนยัน ({non5RankPreviews.length})</span>
                      </button>
                    </div>
                  </div>

                  <div className="max-h-44 overflow-y-auto scrollbar-ultraslim bg-white rounded-xl border border-[#E8D1B5] divide-y divide-[#F3E8DB]">
                    {non5RankPreviews.slice(0, 10).map((item) => (
                      <div
                        key={item.id}
                        className="px-3 py-1.5 text-xs flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2.5"
                      >
                        <span className="font-mono font-bold text-[#785324] shrink-0 tabular-nums">
                          {item.id}
                        </span>
                        <span className="text-[#8E4537] line-through truncate max-w-xs">
                          {item.beforeTitle || '(ไม่มีชื่อ)'}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-[#386B46] shrink-0 hidden sm:inline" />
                        <span className="font-bold text-[#224A2D] truncate">
                          {item.afterTitle}
                        </span>
                        <span className="text-[11px] text-[#6E665E] sm:ml-auto shrink-0">
                          {item.afterSeriesTitle}
                        </span>
                      </div>
                    ))}
                    {non5RankPreviews.length > 10 && (
                      <div className="px-3 py-1 text-[11px] text-[#787066] text-center bg-[#FAF7F2] tabular-nums">
                        และอีก {non5RankPreviews.length - 10} ตอน
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};
