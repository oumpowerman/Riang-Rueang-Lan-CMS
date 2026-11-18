import React, { useEffect, useState } from 'react';
import { Database, RefreshCw, WifiOff } from 'lucide-react';
import {
  getSupabaseStatusSnapshot,
   subscribeSupabaseStatus,
  SupabaseStatusSnapshot,
  verifySupabaseLiveHealth,
} from '../../services/supabaseStatusMonitor';

interface SupabaseStatusIndicatorProps {
  compact?: boolean;
  variant?: 'navbar' | 'modal';
  onClick?: () => void;
}

export const SupabaseStatusIndicator: React.FC<
  SupabaseStatusIndicatorProps
> = ({ compact = false, variant = 'navbar', onClick }) => {
  const [snapshot, setSnapshot] = useState<SupabaseStatusSnapshot>(
    getSupabaseStatusSnapshot
  );

  useEffect(() => {
    return subscribeSupabaseStatus(setSnapshot);
  }, []);

  const isSyncing = snapshot.status === 'SYNCING';
  const isActive = snapshot.status === 'ACTIVE';
  const isOffline = snapshot.status === 'OFFLINE';

  const statusLabel = isSyncing
    ? 'กำลังซิงก์...'
    : isActive
    ? 'เชื่อมต่อปกติ'
    : isOffline
    ? 'ออฟไลน์'
    : 'ยังไม่ตั้งค่า';

  const pillClasses =
    variant === 'modal'
      ? isSyncing
        ? 'bg-[#E0F2FE] border-[#BAE6FD] text-[#0369A1]'
        : isActive
        ? 'bg-[#EEF5EE] border-[#BAD8BF] text-[#1C4824]'
        : isOffline
        ? 'bg-rose-50 border-rose-200 text-rose-700'
        : 'bg-[#FAF7F2] border-[#E2D5C4] text-[#6E5F52]'
      : isSyncing
      ? 'bg-sky-50 hover:bg-sky-100/80 border-sky-200 text-sky-800'
      : isActive
      ? 'bg-emerald-50/70 hover:bg-emerald-100/70 border-emerald-200/90 text-emerald-900'
      : isOffline
      ? 'bg-rose-50 hover:bg-rose-100/80 border-rose-200 text-rose-800'
      : 'bg-slate-50 hover:bg-slate-100 border-slate-200/80 text-slate-700';

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      void verifySupabaseLiveHealth();
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      title={`สถานะ Kontent OS (Supabase): ${snapshot.detail}`}
      aria-label={`สถานะการเชื่อมต่อ Kontent OS: ${statusLabel}`}
      className={`inline-flex items-center gap-1.5 rounded-xl border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
        compact
          ? 'px-2 py-1.5 text-[11px] font-semibold'
          : variant === 'modal'
          ? 'px-2.5 py-1.5 text-xs font-semibold'
          : 'px-3 py-2 text-xs sm:text-sm font-medium'
      } ${pillClasses}`}
    >
      {isSyncing ? (
        <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-600 shrink-0" />
      ) : isOffline ? (
        <WifiOff className="w-3.5 h-3.5 text-rose-600 shrink-0" />
      ) : (
        <span className="relative flex h-2.5 w-2.5 shrink-0">
          {isActive && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
          )}
          <span
            className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
              isActive ? 'bg-emerald-500' : 'bg-amber-400'
            }`}
          />
        </span>
      )}

      {!compact && <Database className="w-3.5 h-3.5 opacity-75 shrink-0" />}

      <span className="font-semibold">
        {compact
          ? isSyncing
            ? 'ซิงก์...'
            : 'Kontent OS'
          : variant === 'modal'
          ? statusLabel
          : `Kontent OS · ${statusLabel}`}
      </span>
    </button>
  );
};
