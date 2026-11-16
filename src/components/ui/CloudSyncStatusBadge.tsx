import React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import type { CloudSyncItemStatus } from '../../hooks/useDebouncedCloudSync';

interface CloudSyncStatusBadgeProps {
  status: CloudSyncItemStatus;
  onRetry?: () => void;
  showTimestamp?: boolean;
  hideWhenIdle?: boolean;
}

function formatSyncTime(ts?: number): string {
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

export const CloudSyncStatusBadge: React.FC<CloudSyncStatusBadgeProps> = ({
  status,
  onRetry,
  showTimestamp = false,
  hideWhenIdle = true,
}) => {
  if (status.state === 'IDLE') {
    if (hideWhenIdle) return null;
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#FAF7F2] border border-[#E6DDD0] text-[#7D7367] text-[11px] font-semibold whitespace-nowrap shrink-0">
        <span>พร้อมบันทึกอัตโนมัติ</span>
      </span>
    );
  }

  if (status.state === 'PENDING') {
    return (
      <span
        title="กำลังรอหยุดพิมพ์ชั่วครู่ก่อนส่งขึ้น Cloud"
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#FAF7F2] border border-[#DFD3C1] text-[#6E665E] text-[11px] font-bold whitespace-nowrap shrink-0"
      >
        <Clock className="w-3 h-3 text-[#8C7B65] shrink-0" />
        <span>รอหยุดพิมพ์...</span>
      </span>
    );
  }

  if (status.state === 'SAVING') {
    return (
      <span
        title="กำลังส่งข้อมูลไปบันทึกบน Firestore Cloud"
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#EDF5F9] border border-[#C4DFED] text-[#23546E] text-[11px] font-bold whitespace-nowrap shrink-0"
      >
        <Loader2 className="w-3 h-3 text-[#2E6B8A] animate-spin shrink-0" />
        <span>กำลังบันทึกขึ้น Cloud...</span>
      </span>
    );
  }

  if (status.state === 'SAVED') {
    const timeStr = showTimestamp ? formatSyncTime(status.lastSavedAt) : '';
    return (
      <span
        title={
          status.lastSavedAt
            ? `บันทึกลง Cloud เรียบร้อยเมื่อ ${formatSyncTime(status.lastSavedAt)}`
            : 'บันทึกลง Cloud เรียบร้อยแล้ว'
        }
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#E8F3E8] border border-[#9EC49C] text-[#224A2D] text-[11px] font-bold whitespace-nowrap shrink-0"
      >
        <CheckCircle2 className="w-3 h-3 text-[#2E7D32] shrink-0" />
        <span>
          บันทึกแล้ว
          {timeStr && (
            <span className="font-mono tabular-nums font-semibold ml-1 text-[#35633B]">
              {timeStr}
            </span>
          )}
        </span>
      </span>
    );
  }

  return (
    <div className="inline-flex items-center gap-1 shrink-0">
      <span
        title={status.errorMessage || 'เกิดข้อผิดพลาดในการบันทึกขึ้น Cloud'}
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#FDF2F2] border border-[#ECC8C8] text-[#8E3B3B] text-[11px] font-bold whitespace-nowrap shrink-0"
      >
        <AlertTriangle className="w-3 h-3 text-[#B54141] shrink-0" />
        <span>บันทึกไม่สำเร็จ</span>
      </span>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#FFF5F5] hover:bg-[#FBE2E2] border border-[#E6B8B8] text-[#7D2C2C] text-[11px] font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0"
          title="ลองส่งบันทึกขึ้น Cloud อีกครั้ง"
        >
          <RefreshCw className="w-3 h-3 shrink-0" />
          <span>ลองใหม่</span>
        </button>
      )}
    </div>
  );
};
