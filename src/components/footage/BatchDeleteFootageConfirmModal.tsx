import React, { useMemo } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  CloudOff,
  Film,
  Link2,
  RefreshCw,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { BatchDeleteFootageResult } from '../../context/cms/cms.types';
import { ComputedFootage } from '../../types/footage.types';
import { BaseModal } from '../ui/BaseModal';

interface BatchDeleteFootageConfirmModalProps {
  isOpen: boolean;
  selectedFootageIds: string[];
  computedFootageMap: Record<string, ComputedFootage>;
  isDeleting: boolean;
  deleteProgressLabel: string;
  deleteResult: BatchDeleteFootageResult | null;
  onClose: () => void;
  onConfirmDelete: (idsToDelete: string[]) => void;
}

export const BatchDeleteFootageConfirmModal: React.FC<
  BatchDeleteFootageConfirmModalProps
> = ({
  isOpen,
  selectedFootageIds,
  computedFootageMap,
  isDeleting,
  deleteProgressLabel,
  deleteResult,
  onClose,
  onConfirmDelete,
}) => {
  const breakdown = useMemo(() => {
    const resolved: ComputedFootage[] = [];
    const untouchedIds: string[] = [];
    const linkedClips: ComputedFootage[] = [];
    const affectedEpisodeIdSet = new Set<string>();

    for (const id of selectedFootageIds) {
      const ft = computedFootageMap[id];
      if (!ft) {
        untouchedIds.push(id);
        continue;
      }
      resolved.push(ft);
      if (ft.totalUsageCount > 0) {
        linkedClips.push(ft);
        ft.usageHistory.forEach((rec) => affectedEpisodeIdSet.add(rec.episodeId));
      } else {
        untouchedIds.push(id);
      }
    }

    return {
      totalCount: selectedFootageIds.length,
      untouchedIds,
      untouchedCount: untouchedIds.length,
      linkedClips,
      linkedCount: linkedClips.length,
      affectedEpisodeCount: affectedEpisodeIdSet.size,
      resolved,
    };
  }, [selectedFootageIds, computedFootageMap]);

  const hasLinkedClips = breakdown.linkedCount > 0;
  const hasMixedClips = breakdown.linkedCount > 0 && breakdown.untouchedCount > 0;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={isDeleting ? () => {} : onClose}
      closeOnBackdropClick={!isDeleting}
      closeOnEsc={!isDeleting}
      maxWidthClass="max-w-lg"
      icon={
        deleteResult ? (
          deleteResult.cloudSynced ? (
            <CheckCircle2 className="w-4 h-4 text-[#2B5435]" />
          ) : (
            <CloudOff className="w-4 h-4 text-[#9A5B13]" />
          )
        ) : (
          <Trash2 className="w-4 h-4 text-[#A43C32]" />
        )
      }
      title={
        deleteResult
          ? deleteResult.cloudSynced
            ? 'ลบคลิปเรียบร้อยแล้ว'
            : 'ลบในเครื่องแล้ว (Cloud ติดปัญหา)'
          : `ยืนยันการลบคลิป ${breakdown.totalCount.toLocaleString()} รายการ`
      }
      subtitle={
        deleteResult
          ? deleteResult.cloudSynced
            ? 'อัปเดตคลังฟุตเทจทั้งในเครื่องและบน Cloud (Firestore) สำเร็จ'
            : 'กรุณาตรวจสอบสถานะการซิงก์ Cloud ด้านล่าง'
          : 'ตรวจสอบสรุปคลิปที่เลือกก่อนลบออกจากระบบและ Cloud (Firestore)'
      }
      bodyClassName="p-4 sm:p-5 bg-[#FAF8F5]"
      footer={
        deleteResult ? (
          <div className="flex items-center justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#3B6845] hover:bg-[#2C5234] text-white text-xs font-bold transition-colors cursor-pointer"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              className="px-3.5 py-2 rounded-xl bg-[#FAF7F2] hover:bg-[#EFE8DC] disabled:opacity-50 text-[#524538] border border-[#E2D5C4] text-xs font-bold transition-colors cursor-pointer"
            >
              ยกเลิก
            </button>

            <div className="flex flex-wrap items-center justify-end gap-2">
              {hasMixedClips && (
                <button
                  type="button"
                  onClick={() => onConfirmDelete(breakdown.untouchedIds)}
                  disabled={isDeleting}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#FDF5E8] hover:bg-[#F7E7CA] disabled:opacity-50 text-[#734811] border border-[#E6C994] text-xs font-bold transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>
                    ลบเฉพาะคลิปใหม่ ({breakdown.untouchedCount.toLocaleString()})
                  </span>
                </button>
              )}

              <button
                type="button"
                onClick={() => onConfirmDelete(selectedFootageIds)}
                disabled={isDeleting || breakdown.totalCount === 0}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#B84339] hover:bg-[#9D362D] disabled:opacity-50 text-white text-xs font-bold transition-colors cursor-pointer shadow-2xs whitespace-nowrap"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>กำลังลบ...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>
                      ยืนยันลบทั้งหมด ({breakdown.totalCount.toLocaleString()} คลิป)
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        )
      }
    >
      {/* State 1: Completed Feedback (Success or Partial Cloud Error) */}
      {deleteResult ? (
        deleteResult.cloudSynced ? (
          <div className="p-5 rounded-2xl bg-[#EEF5EE] border border-[#C3DFC5] text-center space-y-2.5">
            <div className="w-11 h-11 rounded-2xl bg-[#3B6845] text-white flex items-center justify-center mx-auto shadow-2xs">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-extrabold text-[#1E4628]">
              ลบฟุตเทจทั้ง {deleteResult.deletedCount.toLocaleString()} รายการเรียบร้อยแล้ว
            </h3>
            <p className="text-xs text-[#315D3C] leading-relaxed">
              ข้อมูลถูกนำออกจากคลังในเครื่อง (IndexedDB) และลบบน Cloud (Firestore)
              เรียบร้อยสมบูรณ์แล้ว
            </p>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-[#FFF7E8] border border-[#EAD0A0] space-y-2.5">
            <div className="flex items-start gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#FCE9C5] text-[#8A5A22] flex items-center justify-center shrink-0">
                <CloudOff className="w-5 h-5" />
              </div>
              <div className="space-y-1 min-w-0">
                <h3 className="text-sm font-extrabold text-[#6B4415]">
                  ลบ {deleteResult.deletedCount.toLocaleString()} คลิปในเครื่องแล้ว แต่ยังซิงก์ขึ้น Cloud ไม่สำเร็จ
                </h3>
                <p className="text-xs text-[#7D531B] leading-relaxed">
                  {deleteResult.cloudError}
                </p>
              </div>
            </div>
            <p className="text-[11px] text-[#8C6838] pt-2 border-t border-[#EFE0C2] leading-relaxed">
              หมายเหตุ: หากเปิดจากเครื่องอื่นหรือรีเฟรชหลัง Cloud กลับมาพร้อมใช้งาน
              ข้อมูลเดิมบน Cloud อาจยังค้างอยู่จนกว่าจะลบอีกครั้งเมื่อระบบ Cloud พร้อม
            </p>
          </div>
        )
      ) : (
        /* State 2: Confirmation Breakdown & EP Warning */
        <div className="space-y-3.5">
          {/* Summary KPI Strip: Untouched vs Linked in EP */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3 rounded-xl bg-[#F0F7FD] border border-[#CFE3F5] space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#25527A]">
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span>คลิปใหม่ (ยังไม่เคยผูก EP)</span>
              </div>
              <div className="text-xl font-mono font-extrabold text-[#184366] tabular-nums">
                {breakdown.untouchedCount.toLocaleString()}{' '}
                <span className="text-xs font-sans font-semibold text-[#4B6F8F]">
                  คลิป
                </span>
              </div>
              <p className="text-[11px] text-[#4B6F8F]">
                ลบได้อย่างปลอดภัย ไม่มีผลกับ EP เดิม
              </p>
            </div>

            <div
              className={`p-3 rounded-xl border space-y-1 ${
                hasLinkedClips
                  ? 'bg-[#FDF1EF] border-[#EFCAC4]'
                  : 'bg-white border-[#E5DED4]'
              }`}
            >
              <div
                className={`flex items-center gap-1.5 text-[11px] font-bold ${
                  hasLinkedClips ? 'text-[#9B372E]' : 'text-[#6E5F52]'
                }`}
              >
                <Link2 className="w-3.5 h-3.5 shrink-0" />
                <span>ผูกอยู่ในชุดคลิป EP แล้ว</span>
              </div>
              <div
                className={`text-xl font-mono font-extrabold tabular-nums ${
                  hasLinkedClips ? 'text-[#8A2E25]' : 'text-[#524538]'
                }`}
              >
                {breakdown.linkedCount.toLocaleString()}{' '}
                <span className="text-xs font-sans font-semibold opacity-80">
                  คลิป
                </span>
              </div>
              <p
                className={`text-[11px] ${
                  hasLinkedClips ? 'text-[#9B372E]' : 'text-[#8C7B6C]'
                }`}
              >
                {hasLinkedClips
                  ? `เชื่อมโยงอยู่กับ ${breakdown.affectedEpisodeCount.toLocaleString()} EP`
                  : 'ไม่มีคลิปที่ถูกผูกอยู่ใน EP'}
              </p>
            </div>
          </div>

          {/* Warning Banner when any selected clip is already linked in Episodes */}
          {hasLinkedClips && (
            <div className="p-3.5 rounded-xl bg-[#FFF6EA] border border-[#E9CFA0] space-y-2.5">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-[#A46118] shrink-0 mt-0.5" />
                <div className="space-y-0.5 min-w-0">
                  <div className="text-xs font-extrabold text-[#73420D]">
                    คำเตือน: มี {breakdown.linkedCount.toLocaleString()} คลิปที่ถูกผูกจัดอันดับอยู่ใน EP แล้ว
                  </div>
                  <p className="text-[11px] text-[#8A561E] leading-relaxed">
                    หากลบคลิปเหล่านี้ ประวัติการใช้งานและช่องอันดับใน EP ที่เกี่ยวข้องจะอ้างอิงคลิปไม่พบ
                    {hasMixedClips
                      ? ' (คุณสามารถเลือกปุ่ม "ลบเฉพาะคลิปใหม่" ด้านล่างเพื่อเว้นคลิปที่ผูก EP ไว้ได้)'
                      : ''}
                  </p>
                </div>
              </div>

              {/* Scrollable preview of linked clips */}
              <div className="max-h-36 overflow-y-auto scrollbar-thin space-y-1.5 pr-0.5">
                {breakdown.linkedClips.slice(0, 20).map((clip) => (
                  <div
                    key={clip.id}
                    className="px-2.5 py-1.5 rounded-lg bg-white/90 border border-[#EFE0C4] flex items-center justify-between gap-2 text-[11px]"
                  >
                    <div className="min-w-0 flex items-center gap-1.5">
                      <Film className="w-3 h-3 text-[#8A5A22] shrink-0" />
                      <span className="font-mono font-bold text-[#524538] shrink-0">
                        {clip.id}
                      </span>
                      <span className="text-[#3D332A] font-medium truncate">
                        {clip.title}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-[#8A2E25] whitespace-nowrap shrink-0 tabular-nums">
                      ใช้ใน {clip.totalUsageCount} EP
                    </span>
                  </div>
                ))}
                {breakdown.linkedClips.length > 20 && (
                  <p className="text-[11px] text-[#8A561E] text-center pt-0.5">
                    และอีก {(breakdown.linkedClips.length - 20).toLocaleString()} คลิปที่ผูกอยู่ใน EP...
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Irreversible Action Note */}
          {!hasLinkedClips && (
            <div className="px-3.5 py-2.5 rounded-xl bg-white border border-[#E5DED4] text-xs text-[#5C5042] leading-relaxed">
              การลบจะนำฟุตเทจที่เลือกออกจากระบบและ Cloud (Firestore) ถาวร
              (ไฟล์วิดีโอต้นฉบับบน Google Drive ของคุณจะไม่ถูกลบไปด้วย)
            </div>
          )}

          {/* Active Chunk Deletion Progress */}
          {isDeleting && (
            <div className="p-3 rounded-xl bg-[#FDF1EF] border border-[#EFCAC4] flex items-center gap-2.5">
              <RefreshCw className="w-4 h-4 text-[#A43C32] animate-spin shrink-0" />
              <span className="text-xs font-bold text-[#8A2E25] tabular-nums">
                {deleteProgressLabel || 'กำลังลบข้อมูลออกจากระบบและ Cloud...'}
              </span>
            </div>
          )}
        </div>
      )}
    </BaseModal>
  );
};
