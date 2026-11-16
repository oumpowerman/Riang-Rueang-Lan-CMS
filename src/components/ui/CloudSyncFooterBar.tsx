import React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Cloud,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import type { CloudSyncSessionSummary } from '../../hooks/useDebouncedCloudSync';

interface CloudSyncFooterBarProps {
  summary: CloudSyncSessionSummary;
  idleMessage?: string;
  debounceMs?: number;
  onFlushAll?: () => void;
  onRetryAll?: () => void;
  onClose: () => void;
  closeLabel?: string;
}

function formatSyncTime(ts: number | null): string {
  if (!ts) return '';
  try {
    return new Date(ts).toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return '';
  }
}

export const CloudSyncFooterBar: React.FC<CloudSyncFooterBarProps> = ({
  summary,
  idleMessage,
  debounceMs = 550,
  onFlushAll,
  onRetryAll,
  onClose,
  closeLabel = 'ปิด',
}) => {
  const debounceSecText = (debounceMs / 1000).toFixed(2).replace(/\.?0+$/, '');
  const defaultIdleText = `พิมพ์เพื่อแก้ไข — ระบบหน่วง ${debounceSecText} วิแล้วบันทึกขึ้น Cloud อัตโนมัติ (วางลิงก์เพื่อบันทึกทันที)`;

  return (
    <div className="flex flex-wrap items-center justify-between gap-2.5 text-xs">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {summary.overallState === 'IDLE' && (
          <div className="flex items-center gap-1.5 text-[#6E665E] font-medium min-w-0">
            <Cloud className="w-4 h-4 text-[#8C7B65] shrink-0" />
            <span className="truncate">{idleMessage || defaultIdleText}</span>
          </div>
        )}

        {summary.overallState === 'PENDING' && (
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <span className="inline-flex items-center gap-1.5 text-[#6E4919] font-bold">
              <Clock className="w-4 h-4 text-[#B57B2E] shrink-0" />
              <span className="font-mono tabular-nums">
                รอหยุดพิมพ์ ({summary.pendingCount} รายการ) เพื่อบันทึกขึ้น Cloud...
              </span>
            </span>
            {onFlushAll && (
              <button
                type="button"
                onClick={onFlushAll}
                className="px-2.5 py-1 rounded-lg bg-[#FAF2E1] hover:bg-[#F3E4C5] border border-[#E0C28E] text-[#6E4919] font-bold text-[11px] transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                บันทึกทันที
              </button>
            )}
          </div>
        )}

        {summary.overallState === 'SAVING' && (
          <div className="inline-flex items-center gap-1.5 text-[#23546E] font-bold min-w-0">
            <Loader2 className="w-4 h-4 text-[#2E6B8A] animate-spin shrink-0" />
            <span className="font-mono tabular-nums truncate">
              กำลังบันทึกขึ้น Cloud ({summary.savingCount} รายการ)...
            </span>
          </div>
        )}

        {summary.overallState === 'ERROR' && (
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <span className="inline-flex items-center gap-1.5 text-[#8E3B3B] font-bold">
              <AlertTriangle className="w-4 h-4 text-[#B54141] shrink-0" />
              <span className="font-mono tabular-nums">
                บันทึกไม่สำเร็จ {summary.errorCount} รายการ
              </span>
            </span>
            {onRetryAll && (
              <button
                type="button"
                onClick={onRetryAll}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FDF2F2] hover:bg-[#F9E2E2] border border-[#ECC8C8] text-[#8E3B3B] font-bold text-[11px] transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <RefreshCw className="w-3 h-3 shrink-0" />
                <span>บันทึกซ้ำทั้งหมด</span>
              </button>
            )}
          </div>
        )}

        {summary.overallState === 'SAVED' && (
          <div className="inline-flex items-center gap-1.5 text-[#224A2D] font-bold min-w-0">
            <CheckCircle2 className="w-4 h-4 text-[#2E7D32] shrink-0" />
            <span className="truncate">
              บันทึกขึ้น Cloud ครบแล้ว
              {summary.lastSyncedAt && (
                <span className="font-mono tabular-nums font-semibold text-[#3B6845] ml-1.5">
                  · ล่าสุด {formatSyncTime(summary.lastSyncedAt)}
                </span>
              )}
              {summary.savedCount > 1 && (
                <span className="font-mono tabular-nums font-semibold text-[#3B6845] ml-1">
                  ({summary.savedCount} รายการ)
                </span>
              )}
            </span>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onClose}
        className="px-4 py-1.5 rounded-xl bg-[#4A3D31] hover:bg-[#3A3026] text-white font-bold text-xs shrink-0 transition-colors cursor-pointer whitespace-nowrap"
      >
        {summary.pendingCount > 0 ? 'บันทึก & ปิด' : closeLabel}
      </button>
    </div>
  );
};
