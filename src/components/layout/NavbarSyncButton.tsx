import React from 'react';
import {
  AlertTriangle,
  CloudCheck,
  CloudOff,
  RefreshCw,
  UploadCloud,
} from 'lucide-react';
import { useCMS } from '../../context/CMSContext';

interface NavbarSyncButtonProps {
  compact?: boolean;
}

function formatShortTime(iso: string | null): string {
  if (!iso) return 'ยังไม่เคยซิงก์';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'ยังไม่เคยซิงก์';
  return date.toLocaleTimeString('th-TH', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const NavbarSyncButton: React.FC<NavbarSyncButtonProps> = ({
  compact = false,
}) => {
  const { syncHealth, setIsSyncCenterModalOpen } = useCMS();
  const { status, outbox, drift, isOnline, isQuotaExhausted, lastSyncedAt } =
    syncHealth;

  const isSpinning = status === 'syncing';
  const hasAttention =
    status === 'drift_detected' ||
    status === 'outbox_pending' ||
    status === 'offline_or_quota';

  // Default: Affirmative Synced State (Light Pastel Emerald)
  let label = 'ซิงก์แล้ว';
  let toneClass =
    'bg-emerald-50/80 hover:bg-emerald-100/80 text-emerald-800 hover:text-emerald-900 border-emerald-200/90 hover:border-emerald-300';
  let tooltip = `ข้อมูลในเครื่องตรงกับ Cloud สมบูรณ์ (ซิงก์ล่าสุด ${formatShortTime(
    lastSyncedAt
  )}) — คลิกเพื่อดูศูนย์ซิงก์ข้อมูล`;

  if (status === 'syncing') {
    label = 'กำลังซิงก์...';
    toneClass =
      'bg-indigo-50 hover:bg-indigo-100/80 text-indigo-700 hover:text-indigo-800 border-indigo-200/90';
    tooltip = 'กำลังส่ง/ดึงข้อมูลกับ Cloud...';
  } else if (status === 'offline_or_quota') {
    label = !isOnline ? 'ออฟไลน์' : 'เต็มโควตา';
    toneClass =
      'bg-rose-50 hover:bg-rose-100/80 text-rose-700 hover:text-rose-800 border-rose-200';
    tooltip = !isOnline
      ? 'อุปกรณ์กำลังออฟไลน์ — คลิกเพื่อดูสถานะคิวรอส่ง'
      : 'ติดเพดานโควตา Firestore รายวัน — คลิกเพื่อดูรายละเอียดและคิวรอส่ง';
  } else if (status === 'outbox_pending') {
    label = `รอส่ง ${outbox.count}`;
    toneClass =
      'bg-amber-50 hover:bg-amber-100/80 text-amber-800 hover:text-amber-900 border-amber-200';
    tooltip = `มี ${outbox.count} รายการรอส่งขึ้น Cloud อัตโนมัติ — คลิกเพื่อตรวจสอบหรือส่งทันที`;
  } else if (status === 'drift_detected') {
    label = 'ยอดไม่ตรง';
    toneClass =
      'bg-amber-50 hover:bg-amber-100/80 text-amber-800 hover:text-amber-900 border-amber-200';
    tooltip = `พบยอดข้อมูลในเครื่องต่างจาก Cloud (${drift.totalAbsDiff} รายการ) — คลิกเพื่อกดรีเฟรชดึงข้อมูลล่าสุด`;
  }

  const renderIcon = (sizeClass: string) => {
    if (isSpinning) {
      return (
        <RefreshCw
          className={`${sizeClass} animate-spin shrink-0 text-indigo-600`}
        />
      );
    }
    if (status === 'offline_or_quota') {
      return <CloudOff className={`${sizeClass} shrink-0 text-rose-600`} />;
    }
    if (status === 'outbox_pending') {
      return <UploadCloud className={`${sizeClass} shrink-0 text-amber-600`} />;
    }
    if (status === 'drift_detected') {
      return (
        <AlertTriangle className={`${sizeClass} shrink-0 text-amber-600`} />
      );
    }
    // Synced: CloudCheck in emerald green
    return <CloudCheck className={`${sizeClass} shrink-0 text-emerald-600`} />;
  };

  if (compact) {
    return (
      <button
        type="button"
        onClick={() => setIsSyncCenterModalOpen(true)}
        aria-label={tooltip}
        title={tooltip}
        className={`relative min-w-[36px] min-h-[36px] px-2 rounded-xl border inline-flex items-center justify-center gap-1 transition-colors cursor-pointer shrink-0 ${toneClass}`}
      >
        {renderIcon('w-4 h-4')}
        {outbox.count > 0 && (
          <span className="font-mono tabular-nums text-[10px] font-bold leading-none">
            {outbox.count}
          </span>
        )}
        {hasAttention && outbox.count === 0 && (
          <span
            aria-hidden="true"
            className={`w-1.5 h-1.5 rounded-full shrink-0 ${
              status === 'offline_or_quota' ? 'bg-rose-500' : 'bg-amber-500'
            }`}
          />
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setIsSyncCenterModalOpen(true)}
      aria-label={tooltip}
      title={tooltip}
      className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${toneClass}`}
    >
      {renderIcon('w-4 h-4')}
      <span className="font-medium tracking-tight">{label}</span>
    </button>
  );
};
