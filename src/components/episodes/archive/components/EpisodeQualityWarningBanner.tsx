import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Filter,
  FileQuestion,
  HelpCircle,
  Layers,
  Loader2,
  Wand2,
  X,
} from 'lucide-react';
import type { EpisodeQualityAuditSummary } from '../../../../utils/episodeValidator';

export interface Non5RankFixPreviewItem {
  id: string;
  beforeTitle: string;
  afterTitle: string;
  afterSeriesTitle: string;
}

interface EpisodeQualityWarningBannerProps {
  auditSummary: EpisodeQualityAuditSummary;
  issueFilterOnly: boolean;
  onToggleIssueFilter: () => void;
  non5RankPreviews: Non5RankFixPreviewItem[];
  onBatchFixNon5Rank: () => Promise<void>;
  isBatchFixing?: boolean;
  batchFixResultCount?: number | null;
}

export const EpisodeQualityWarningBanner: React.FC<
  EpisodeQualityWarningBannerProps
> = ({
  auditSummary,
  issueFilterOnly,
  onToggleIssueFilter,
  non5RankPreviews,
  onBatchFixNon5Rank,
  isBatchFixing = false,
  batchFixResultCount = null,
}) => {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  if (auditSummary.issueCount === 0 && batchFixResultCount === null) {
    return null;
  }

  return (
    <div className="space-y-2.5">
      {/* Success Banner right after Batch Fix */}
      {batchFixResultCount !== null && batchFixResultCount > 0 && (
        <div className="rounded-2xl px-4 py-3 bg-[#EBF5EB] border border-[#B5D6B3] text-[#1F4A28] flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-bold">
            <CheckCircle2 className="w-4 h-4 text-[#2E7D32] shrink-0" />
            <span>
              อัปเดตชื่อคลิปเป็นรูปแบบ &ldquo;5 อันดับ&rdquo; และซิงก์ชื่อซีรีส์สำเร็จ{' '}
              {batchFixResultCount} ตอน พร้อมบันทึกลง Cloud เรียบร้อยแล้ว!
            </span>
          </div>
        </div>
      )}

      {auditSummary.issueCount > 0 && (
        <div
          className={`rounded-2xl p-4 border transition-all shadow-2xs space-y-3 ${
            issueFilterOnly
              ? 'bg-[#FDF2E9] border-[#E8C2A0] ring-2 ring-[#DEC190]/60'
              : 'bg-[#FFF9F2] border-[#EED7C0]'
          }`}
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#FAF0E1] text-[#9E571E] border border-[#E8D1B5] flex items-center justify-center shrink-0 mt-0.5">
                <AlertTriangle className="w-4 h-4 text-[#B56722]" />
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-xs sm:text-sm font-extrabold text-[#3D2916]">
                    ตรวจพบคลิปหลักที่ต้องตรวจสอบหรือปรับปรุง {auditSummary.issueCount} ตอน
                  </h3>
                  <span className="text-[11px] font-mono font-bold text-[#8A501E] bg-[#F7E7D2] px-2 py-0.5 rounded-full border border-[#E8D1B5]">
                    {Math.round(
                      (auditSummary.issueCount /
                        Math.max(1, auditSummary.totalEpisodes)) *
                        100
                    )}
                    % ของคลัง
                  </span>
                </div>

                {/* Breakdown Pills */}
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  {auditSummary.missingTitleCount > 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#FAF0E6] text-[#7A3F17] border border-[#E5CEBA] text-[11px] font-semibold">
                      <FileQuestion className="w-3 h-3 text-[#A85822]" />
                      <span>
                        ยังไม่ได้ตั้งชื่อ: {auditSummary.missingTitleCount} ตอน
                      </span>
                    </span>
                  )}

                  {auditSummary.non5RankCount > 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#FAF0E6] text-[#7A3F17] border border-[#E5CEBA] text-[11px] font-semibold">
                      <HelpCircle className="w-3 h-3 text-[#A85822]" />
                      <span>
                        ไม่ใช่ 5 อันดับ: {auditSummary.non5RankCount} ตอน
                      </span>
                    </span>
                  )}

                  {auditSummary.incompleteSlotsCount > 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#FAF0E6] text-[#7A3F17] border border-[#E5CEBA] text-[11px] font-semibold">
                      <Layers className="w-3 h-3 text-[#A85822]" />
                      <span>
                        ฟุตเทจไม่ครบ 5 สล็อต: {auditSummary.incompleteSlotsCount} ตอน
                      </span>
                    </span>
                  )}

                  <span className="text-[#8C7A68] text-[11px]">
                    · ผ่านเกณฑ์มาตรฐานแล้ว {auditSummary.standardCount} ตอน
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons: 1-Click Batch Fix + Filter Toggle */}
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto lg:self-center shrink-0">
              {non5RankPreviews.length > 0 && (
                <button
                  type="button"
                  disabled={isBatchFixing}
                  onClick={() => setIsConfirmOpen((prev) => !prev)}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-[#224A2D] hover:bg-[#193821] disabled:opacity-50 text-white shadow-2xs transition-all cursor-pointer whitespace-nowrap"
                >
                  {isBatchFixing ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                  ) : (
                    <Wand2 className="w-3.5 h-3.5 shrink-0" />
                  )}
                  <span className="sm:hidden">
                    แก้เป็น 5 อันดับ ({non5RankPreviews.length})
                  </span>
                  <span className="hidden sm:inline">
                    แก้ชื่อเป็น &ldquo;5 อันดับ&rdquo; ทั้งหมด (
                    {non5RankPreviews.length} ตอน)
                  </span>
                </button>
              )}

              <button
                type="button"
                onClick={onToggleIssueFilter}
                className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs border whitespace-nowrap ${
                  issueFilterOnly
                    ? 'bg-[#8A5A22] text-white border-[#704818]'
                    : 'bg-white hover:bg-[#FAF4ED] text-[#784318] border-[#DEC190]'
                }`}
              >
                <Filter className="w-3.5 h-3.5 shrink-0" />
                <span className="sm:hidden">
                  {issueFilterOnly
                    ? 'เลิกกรองคลิปมีปัญหา'
                    : `ดูคลิปมีปัญหา (${auditSummary.issueCount})`}
                </span>
                <span className="hidden sm:inline">
                  {issueFilterOnly
                    ? 'กำลังแสดงเฉพาะคลิปที่มีปัญหา (กดเพื่อเลิกกรอง)'
                    : `กรองดูเฉพาะคลิปที่มีปัญหา (${auditSummary.issueCount})`}
                </span>
              </button>
            </div>
          </div>

          {/* Inline Preview & Confirmation Box for Batch Fix */}
          {isConfirmOpen && non5RankPreviews.length > 0 && (
            <div className="pt-3 border-t border-[#EBD5BD] space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs font-bold text-[#3D2916]">
                  ตัวอย่างผลลัพธ์ที่จะแก้ไขทั้ง {non5RankPreviews.length} ตอน (พร้อมซิงก์ชื่อซีรีส์อัตโนมัติ):
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isBatchFixing}
                    onClick={() => setIsConfirmOpen(false)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white hover:bg-[#FAF4ED] border border-[#DEC190] text-[#5C5349] text-xs font-bold cursor-pointer"
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
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#224A2D] hover:bg-[#193821] disabled:opacity-50 text-white text-xs font-bold cursor-pointer shadow-2xs"
                  >
                    {isBatchFixing ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    )}
                    <span>
                      ยืนยันแก้ไขทั้งหมด ({non5RankPreviews.length} ตอน) & บันทึกลง Cloud
                    </span>
                  </button>
                </div>
              </div>

              <div className="max-h-48 overflow-y-auto scrollbar-thin bg-white rounded-xl border border-[#E8D1B5] divide-y divide-[#F3E8DB]">
                {non5RankPreviews.slice(0, 10).map((item) => (
                  <div
                    key={item.id}
                    className="px-3 py-2 text-xs flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3"
                  >
                    <span className="font-mono font-bold text-[#785324] shrink-0">
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
                      ซีรีส์: <strong>{item.afterSeriesTitle}</strong>
                    </span>
                  </div>
                ))}
                {non5RankPreviews.length > 10 && (
                  <div className="px-3 py-1.5 text-[11px] text-[#787066] text-center bg-[#FAF7F2]">
                    และอีก {non5RankPreviews.length - 10} ตอนที่จะถูกจัดรูปแบบเป็น &ldquo;5 อันดับ&rdquo; เช่นเดียวกัน
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
