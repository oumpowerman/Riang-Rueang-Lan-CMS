import React from 'react';
import { AlertTriangle, Loader2, ShieldCheck, Trash2 } from 'lucide-react';
import { BaseModal } from '../../ui/BaseModal';
import { formatThaiDate } from '../../../utils/fileNameGenerator';
import type { Episode } from '../../../types/episode.types';

interface EpisodeDeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  episode: Episode;
  linkedFootagesCount: number;
  onConfirmDelete: () => Promise<void>;
  isDeleting: boolean;
  deleteError: string | null;
}

export const EpisodeDeleteConfirmModal: React.FC<EpisodeDeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  episode,
  linkedFootagesCount,
  onConfirmDelete,
  isDeleting,
  deleteError,
}) => {
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={() => {
        if (!isDeleting) onClose();
      }}
      maxWidthClass="max-w-lg"
      closeOnBackdropClick={!isDeleting}
      closeOnEsc={!isDeleting}
      icon={<Trash2 className="w-4 h-4 text-[#9E2A2B]" />}
      title="ยืนยันการลบคลิปหลัก (EP)"
      subtitle="การลบคลิปหลักจะลบเฉพาะตัวตอนออกจากคลังหลักและ Cloud ถาวร"
      bodyClassName="p-4 sm:p-5 bg-white"
      footer={
        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 w-full text-xs">
          <button
            type="button"
            disabled={isDeleting}
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#FAF7F2] hover:bg-[#EFE8DC] border border-[#E2D8C9] text-[#5C5349] font-bold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            disabled={isDeleting}
            onClick={() => void onConfirmDelete()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#B43C3E] hover:bg-[#9E2A2B] text-white font-bold shadow-2xs transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>กำลังลบคลิปหลัก...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>ยืนยันลบคลิปหลักถาวร</span>
              </>
            )}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Episode Identity Preview Card */}
        <div className="bg-[#FFF5F5] border border-[#F3C7C7] rounded-2xl p-4 space-y-2">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-mono font-bold text-[#9E2A2B] bg-white px-2 py-0.5 rounded-lg border border-[#F3C7C7]">
              {episode.id}
            </span>
            <span className="text-[#D4A5A5]" aria-hidden="true">
              ·
            </span>
            <span className="font-mono tabular-nums text-[#7A3B3B]">
              เผยแพร่ {formatThaiDate(episode.publishDate)}
            </span>
          </div>
          <div className="text-sm font-bold text-[#2D2926] leading-snug">
            {episode.title}
          </div>
          {episode.seriesTitle && (
            <div className="text-xs text-[#6E665E]">
              ซีรีส์: <span className="font-semibold">{episode.seriesTitle}</span>
            </div>
          )}
        </div>

        {/* Safety Assurance Note */}
        <div className="bg-[#EEF5EE] border border-[#BAD8BF] rounded-2xl p-3.5 flex items-start gap-2.5 text-xs text-[#1C4824]">
          <ShieldCheck className="w-4 h-4 text-[#2E7D32] shrink-0 mt-0.5" />
          <div className="space-y-1 leading-relaxed">
            <p className="font-bold">ฟุตเทจย่อยในคลังจะไม่ถูกลบตาม</p>
            <p className="text-[#2D5736]">
              ฟุตเทจทั้ง{' '}
              <strong className="font-mono tabular-nums">
                {linkedFootagesCount}
              </strong>{' '}
              รายการที่อยู่ในตอนนี้จะยังคงอยู่ในคลังฟุตเทจตามปกติ และระบบจะคำนวณประวัติการใช้งานกับระยะพัก (Cooldown) คืนให้อัตโนมัติทันที
            </p>
          </div>
        </div>

        {/* Irreversible Warning */}
        <div className="bg-[#FAF7F2] border border-[#E8DFD3] rounded-2xl p-3.5 flex items-start gap-2.5 text-xs text-[#6E5233]">
          <AlertTriangle className="w-4 h-4 text-[#B56722] shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            ข้อมูลชื่อคลิปหลัก ลิงก์ Google Drive ตัวเต็ม และบทพากย์ที่ผูกไว้กับ{' '}
            <strong className="font-mono">{episode.id}</strong>{' '}
            จะถูกลบถาวรและไม่สามารถกู้คืนได้
          </p>
        </div>

        {deleteError && (
          <div className="p-3 bg-[#FFF0F0] border border-[#E59E9E] rounded-xl text-xs font-semibold text-[#9E2A2B]">
            ลบไม่สำเร็จ: {deleteError}
          </div>
        )}
      </div>
    </BaseModal>
  );
};
