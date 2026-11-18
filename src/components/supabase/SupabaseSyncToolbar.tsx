import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  SlidersHorizontal,
  X,
  RefreshCw,
  CheckSquare,
  RotateCw,
  ChevronDown,
} from 'lucide-react';
import {
  SupabaseArchiveCategoryOption,
  SupabaseConnectionConfig,
  SupabaseReadinessFilter,
  SupabaseSeriesFilterOption,
} from '../../types/supabaseSync.types';
import { SupabaseBulkEditPopover } from './SupabaseBulkEditPopover';
import { SupabaseSyncTabType } from './useSupabaseSyncRows';
import { formatThaiSyncTimestamp } from './supabaseRowMatcher';

interface SupabaseSyncToolbarProps {
  activeTab: SupabaseSyncTabType;
  onTabChange: (tab: SupabaseSyncTabType) => void;
  seriesFilter: string;
  onSeriesFilterChange: (seriesKey: string) => void;
  archiveCategoryFilter: string;
  onArchiveCategoryFilterChange: (catId: string) => void;
  readinessFilter: SupabaseReadinessFilter;
  onReadinessFilterChange: (readiness: SupabaseReadinessFilter) => void;
  seriesFilterOptions: SupabaseSeriesFilterOption[];
  archiveCategoryOptions: SupabaseArchiveCategoryOption[];
  readinessCounts: {
    readyCount: number;
    missingDriveCount: number;
    incompleteSlotsCount: number;
  };
  hasActiveFilters: boolean;
  onResetFilters: () => void;
  autoCheckOnModalOpen: boolean;
  onToggleAutoCheckOnOpen: () => void;
  onRunSmartDeltaCheck: () => void;
  onRunFullVerifyCheck: () => void;
  isLoadingExisting: boolean;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  stats: {
    total: number;
    filteredCount: number;
    newCount: number;
    sentCount: number;
    duplicateCount: number;
    unstampedCount: number;
    selectedCount: number;
    selectedNewCount: number;
    selectedDupUpdateCount: number;
    selectedInFilteredCount: number;
    selectedOutsideFilterCount: number;
  };
  config: SupabaseConnectionConfig;
  savedDraftOverridesCount: number;
  onSelectOnlyFiltered: () => void;
  onSelectAllNew: () => void;
  onDeselectAll: () => void;
  onResetAllRowDrafts: () => void;
  onBatchSetStatus: (status: string) => void;
  onBatchSetChannel: (channelId: string) => void;
  onBatchTogglePlatform: (platformId: string) => void;
  onBatchToggleAssets: (include: boolean) => void;
  onBatchSetPillar: (include: boolean) => void;
  onBatchSetCategory: (include: boolean) => void;
  onBatchMarkAsSent?: () => void;
}

export const SupabaseSyncToolbar: React.FC<SupabaseSyncToolbarProps> = ({
  activeTab,
  onTabChange,
  seriesFilter,
  onSeriesFilterChange,
  archiveCategoryFilter,
  onArchiveCategoryFilterChange,
  readinessFilter,
  onReadinessFilterChange,
  seriesFilterOptions,
  archiveCategoryOptions,
  readinessCounts,
  hasActiveFilters,
  onResetFilters,
  autoCheckOnModalOpen,
  onToggleAutoCheckOnOpen,
  onRunSmartDeltaCheck,
  onRunFullVerifyCheck,
  isLoadingExisting,
  searchQuery,
  onSearchChange,
  stats,
  config,
  savedDraftOverridesCount,
  onSelectOnlyFiltered,
  onSelectAllNew,
  onDeselectAll,
  onResetAllRowDrafts,
  onBatchSetStatus,
  onBatchSetChannel,
  onBatchTogglePlatform,
  onBatchToggleAssets,
  onBatchSetPillar,
  onBatchSetCategory,
  onBatchMarkAsSent,
}) => {
  const [isFilterTrayOpen, setIsFilterTrayOpen] = useState(false);
  const [isCheckMenuOpen, setIsCheckMenuOpen] = useState(false);
  const checkMenuRef = useRef<HTMLDivElement>(null);

  // Close check menu popover on outside click or Escape
  useEffect(() => {
    if (!isCheckMenuOpen) return;
    const handleOutside = (e: MouseEvent) => {
      if (
        checkMenuRef.current &&
        !checkMenuRef.current.contains(e.target as Node)
      ) {
        setIsCheckMenuOpen(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsCheckMenuOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isCheckMenuOpen]);

  const activeDropdownFilterCount =
    (seriesFilter !== 'ALL' ? 1 : 0) +
    (archiveCategoryFilter !== 'ALL' ? 1 : 0) +
    (readinessFilter !== 'ALL' ? 1 : 0);

  const selectedSeriesLabel =
    seriesFilter !== 'ALL'
      ? seriesFilterOptions.find((s) => s.seriesKey === seriesFilter)
          ?.seriesName || 'เฉพาะซีรีส์'
      : null;

  const selectedCategoryLabel =
    archiveCategoryFilter !== 'ALL'
      ? archiveCategoryOptions.find((c) => c.id === archiveCategoryFilter)
          ?.name || 'เฉพาะหมวดหมู่'
      : null;

  const selectedReadinessLabel =
    readinessFilter === 'READY_ONLY'
      ? 'พร้อมส่ง (5/5 + Drive)'
      : readinessFilter === 'MISSING_DRIVE'
      ? 'ขาดลิงก์ Drive จริง'
      : readinessFilter === 'INCOMPLETE_SLOTS'
      ? 'ฟุตไม่ครบ 5 อันดับ'
      : null;

  const tabs: Array<{
    id: SupabaseSyncTabType;
    label: string;
    count: number;
    activeTextClass: string;
    underlineClass: string;
  }> = [
    {
      id: 'ALL',
      label: 'ทั้งหมด',
      count: stats.total,
      activeTextClass: 'text-[#2D241E]',
      underlineClass: 'bg-[#3D332A]',
    },
    {
      id: 'NEW',
      label: 'คลิปใหม่',
      count: stats.newCount,
      activeTextClass: 'text-[#1C4824]',
      underlineClass: 'bg-[#3B6845]',
    },
    {
      id: 'SENT',
      label: 'ส่งแล้ว',
      count: stats.sentCount,
      activeTextClass: 'text-[#0369A1]',
      underlineClass: 'bg-[#0284C7]',
    },
    {
      id: 'DUPLICATE',
      label: 'ซ้ำในระบบ',
      count: stats.duplicateCount,
      activeTextClass: 'text-[#9A3412]',
      underlineClass: 'bg-[#D97706]',
    },
  ];

  return (
    <div className="bg-white border-b border-[#E8DFD3] shrink-0">
      {/* Row 1: Single Minimal iOS Bar (Tabs + Search + Filter Toggle + Split Check Menu) */}
      <div className="px-4 sm:px-5 pt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        {/* Left: Underline Status Tabs */}
        <nav
          className="flex items-center gap-4 sm:gap-5 overflow-x-auto scrollbar-thin"
          aria-label="กรองตามสถานะในระบบ"
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={`relative pb-2.5 pt-1 text-xs sm:text-[13px] font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 ${
                  isActive
                    ? tab.activeTextClass
                    : 'text-[#7D6E61] hover:text-[#3D332A]'
                }`}
              >
                <span>{tab.label}</span>
                <span className="font-mono tabular-nums text-[11px] opacity-80">
                  {tab.count.toLocaleString()}
                </span>
                {isActive && (
                  <motion.span
                    layoutId="supabaseSyncTabUnderline"
                    transition={{ type: 'spring', stiffness: 450, damping: 34 }}
                    className={`absolute bottom-0 left-0 right-0 h-0.5 rounded-full ${tab.underlineClass}`}
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Right: Search + Collapsible Filter Trigger + iOS Split Check Button */}
        <div className="flex flex-wrap items-center gap-2 pb-2 flex-1 sm:flex-initial justify-end">
          {/* Search Input */}
          <div className="relative min-w-[170px] flex-1 sm:w-56 md:w-64 sm:flex-initial">
            <Search className="w-3.5 h-3.5 text-[#8E8174] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="ค้นหาชื่อคลิป, #แท็ก, ฟุตเทจ..."
              className="w-full pl-8 pr-7 py-1.5 rounded-xl border border-[#E3D8CB] bg-[#FAF8F5] text-xs text-[#2D241E] placeholder:text-[#9C8E80] focus:outline-none focus:ring-2 focus:ring-[#8FA892]/35 focus:border-[#8FA892]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8E8174] hover:text-[#3D332A] cursor-pointer"
                title="ล้างคำค้นหา"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Collapsible Filter Tray Toggle Button */}
          <button
            type="button"
            onClick={() => setIsFilterTrayOpen((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              isFilterTrayOpen || activeDropdownFilterCount > 0
                ? 'bg-[#EEF5EE] border-[#9CC5A4] text-[#1C4824]'
                : 'bg-[#FAF8F5] hover:bg-[#F2EBE0] border-[#E3D8CB] text-[#524538]'
            }`}
            title="กางหรือพับแถบตัวกรอง (ซีรีส์ / หมวดหมู่ / ความพร้อม)"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#3B6845]" />
            <span>ตัวกรอง</span>
            {activeDropdownFilterCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-[#3B6845] text-white font-mono tabular-nums text-[10px] font-bold">
                {activeDropdownFilterCount}
              </span>
            )}
            <ChevronDown
              className={`w-3.5 h-3.5 text-[#7D6E61] transition-transform ${
                isFilterTrayOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* iOS Split Button: Primary "เช็คคลิปใหม่" + Popover Menu Chevron */}
          <div
            className="relative inline-flex items-stretch rounded-xl border border-[#BAD8BF] bg-[#EEF5EE] shadow-2xs shrink-0"
            ref={checkMenuRef}
          >
            <button
              type="button"
              onClick={onRunSmartDeltaCheck}
              disabled={isLoadingExisting}
              className="inline-flex items-center gap-1.5 pl-3 pr-2.5 py-1.5 rounded-l-xl text-xs font-bold text-[#1C4824] hover:bg-[#E1EFE2] transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap"
              title="ข้ามคลิปที่ส่งแล้ว ไปเช็คเฉพาะคลิปใหม่และรายการที่อัปเดตล่าสุด (Delta)"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 text-[#3B6845] ${
                  isLoadingExisting ? 'animate-spin' : ''
                }`}
              />
              <span>
                เช็คคลิปใหม่
                {stats.unstampedCount > 0 &&
                  stats.unstampedCount < stats.total && (
                    <span className="font-mono tabular-nums ml-1">
                      ({stats.unstampedCount.toLocaleString()})
                    </span>
                  )}
              </span>
            </button>

            <div className="w-px bg-[#BAD8BF]" />

            <button
              type="button"
              onClick={() => setIsCheckMenuOpen((prev) => !prev)}
              className="px-2 py-1.5 rounded-r-xl text-[#1C4824] hover:bg-[#E1EFE2] transition-colors cursor-pointer flex items-center justify-center"
              title="ตัวเลือกการเช็คซ้ำและโหมดอัตโนมัติ"
              aria-label="เปิดเมนูตั้งค่าการเช็คซ้ำ"
            >
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform ${
                  isCheckMenuOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* iOS Popover Menu for Full Re-Verify & Auto-Check Switch */}
            <AnimatePresence>
              {isCheckMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.97 }}
                  transition={{ duration: 0.14 }}
                  className="absolute right-0 top-full mt-1.5 z-40 w-72 rounded-2xl bg-white border border-[#D8CFC3] shadow-xl p-3 space-y-2.5 text-left"
                >
                  {/* 1. Persistent Auto/Manual Switch */}
                  <div className="flex items-center justify-between gap-3 p-2 rounded-xl bg-[#FAF8F5] border border-[#EDE5D8]">
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-[#2D241E]">
                        เช็คอัตโนมัติเมื่อเปิดหน้าต่าง
                      </div>
                      <div className="text-[11px] text-[#7D6E61] leading-snug">
                        {autoCheckOnModalOpen
                          ? 'เปิดอยู่: เช็คคลิปใหม่ทันทีที่เปิด'
                          : 'ปิดอยู่: กดปุ่มเช็คเองเมื่อต้องการ'}
                      </div>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={autoCheckOnModalOpen}
                      onClick={onToggleAutoCheckOnOpen}
                      className={`w-9 h-5 rounded-full p-0.5 transition-colors flex items-center shrink-0 cursor-pointer ${
                        autoCheckOnModalOpen ? 'bg-[#3B6845]' : 'bg-[#CFC3B4]'
                      }`}
                    >
                      <span
                        className={`w-4 h-4 rounded-full bg-white shadow-2xs transition-transform ${
                          autoCheckOnModalOpen
                            ? 'translate-x-4'
                            : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* 2. Full Re-Verify Button */}
                  <button
                    type="button"
                    disabled={isLoadingExisting}
                    onClick={() => {
                      setIsCheckMenuOpen(false);
                      onRunFullVerifyCheck();
                    }}
                    className="w-full flex items-start gap-2.5 p-2 rounded-xl hover:bg-[#FAF7F2] text-left transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <RotateCw className="w-4 h-4 text-[#3B6845] mt-0.5 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-[#2D241E]">
                        เช็คซ้ำทั้งหมดอีกครั้ง
                      </div>
                      <div className="text-[11px] text-[#7D6E61] leading-snug">
                        สแกนเทียบทุกคลิปและทวนสอบว่ารหัสที่ส่งแล้วยังอยู่ใน Kontent OS
                      </div>
                    </div>
                  </button>

                  {/* 3. Timestamps Summary */}
                  <div className="pt-2 border-t border-[#F2EBE0] px-1 space-y-1 text-[11px] text-[#7D6E61] tabular-nums">
                    <div className="flex items-center justify-between">
                      <span>เช็คซ้ำล่าสุด:</span>
                      <span className="font-semibold text-[#3D332A]">
                        {formatThaiSyncTimestamp(config.lastDedupCheckedAt)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>ส่งออกล่าสุด:</span>
                      <span className="font-semibold text-[#3D332A]">
                        {formatThaiSyncTimestamp(config.lastExportSyncedAt)}
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Compact Active Filter Chips when Tray is Collapsed */}
      {!isFilterTrayOpen && activeDropdownFilterCount > 0 && (
        <div className="px-4 sm:px-5 py-1.5 bg-[#FAF8F5] border-t border-[#F2EBE0] flex flex-wrap items-center gap-1.5 text-[11px]">
          <span className="text-[#7D6E61] font-medium">กำลังกรอง:</span>
          {selectedSeriesLabel && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#EEF5EE] text-[#1C4824] font-semibold border border-[#BAD8BF]">
              <span>ซีรีส์: {selectedSeriesLabel}</span>
              <button
                type="button"
                onClick={() => onSeriesFilterChange('ALL')}
                className="hover:text-rose-700 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {selectedCategoryLabel && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#EEF5EE] text-[#1C4824] font-semibold border border-[#BAD8BF]">
              <span>หมวด: {selectedCategoryLabel}</span>
              <button
                type="button"
                onClick={() => onArchiveCategoryFilterChange('ALL')}
                className="hover:text-rose-700 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {selectedReadinessLabel && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#EEF5EE] text-[#1C4824] font-semibold border border-[#BAD8BF]">
              <span>{selectedReadinessLabel}</span>
              <button
                type="button"
                onClick={() => onReadinessFilterChange('ALL')}
                className="hover:text-rose-700 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          <span className="text-[#7D6E61] ml-1">
            พบ{' '}
            <strong className="font-mono tabular-nums text-[#2D241E]">
              {stats.filteredCount.toLocaleString()}
            </strong>{' '}
            เรื่อง
          </span>
          <button
            type="button"
            onClick={onResetFilters}
            className="text-rose-700 hover:underline font-bold ml-1 cursor-pointer"
          >
            ล้างตัวกรอง
          </button>
        </div>
      )}

      {/* Collapsible Filter Tray (Progressive Disclosure) */}
      <AnimatePresence initial={false}>
        {isFilterTrayOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden border-t border-[#F2EBE0] bg-[#FDFBF7]"
          >
            <div className="px-4 sm:px-5 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                {/* 1. Series Filter */}
                <select
                  value={seriesFilter}
                  onChange={(e) => onSeriesFilterChange(e.target.value)}
                  className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold max-w-[220px] cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#8FA892] ${
                    seriesFilter !== 'ALL'
                      ? 'bg-[#EEF5EE] border-[#9CC5A4] text-[#1C4824]'
                      : 'bg-white border-[#E3D8CB] text-[#3D332A]'
                  }`}
                >
                  <option value="ALL">
                    ซีรีส์: ทั้งหมด ({seriesFilterOptions.length})
                  </option>
                  {seriesFilterOptions.map((s) => (
                    <option key={s.seriesKey} value={s.seriesKey}>
                      {s.fullSeriesTitle} ({s.count})
                    </option>
                  ))}
                </select>

                {/* 2. Archive Category Filter */}
                <select
                  value={archiveCategoryFilter}
                  onChange={(e) =>
                    onArchiveCategoryFilterChange(e.target.value)
                  }
                  className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold max-w-[190px] cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#8FA892] ${
                    archiveCategoryFilter !== 'ALL'
                      ? 'bg-[#EEF5EE] border-[#9CC5A4] text-[#1C4824]'
                      : 'bg-white border-[#E3D8CB] text-[#3D332A]'
                  }`}
                >
                  <option value="ALL">หมวดหมู่: ทั้งหมด</option>
                  {archiveCategoryOptions.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name} ({cat.count})
                    </option>
                  ))}
                </select>

                {/* 3. Readiness Filter */}
                <select
                  value={readinessFilter}
                  onChange={(e) =>
                    onReadinessFilterChange(
                      e.target.value as SupabaseReadinessFilter
                    )
                  }
                  className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold max-w-[220px] cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#8FA892] ${
                    readinessFilter !== 'ALL'
                      ? 'bg-[#EEF5EE] border-[#9CC5A4] text-[#1C4824]'
                      : 'bg-white border-[#E3D8CB] text-[#3D332A]'
                  }`}
                >
                  <option value="ALL">ความพร้อม: ทั้งหมด</option>
                  <option value="READY_ONLY">
                    พร้อมส่ง (5/5 + Drive จริง) ({readinessCounts.readyCount})
                  </option>
                  <option value="MISSING_DRIVE">
                    ขาดลิงก์ Drive จริง ({readinessCounts.missingDriveCount})
                  </option>
                  <option value="INCOMPLETE_SLOTS">
                    ฟุตยังไม่ครบ 5 อันดับ ({readinessCounts.incompleteSlotsCount})
                  </option>
                </select>

                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={onResetFilters}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-bold text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <X className="w-3 h-3" />
                    <span>ล้างตัวกรอง</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 ml-auto text-[11px] text-[#7D6E61]">
                <span>
                  พบ{' '}
                  <strong className="font-mono tabular-nums text-[#2D241E]">
                    {stats.filteredCount.toLocaleString()}
                  </strong>{' '}
                  เรื่อง
                </span>
                <button
                  type="button"
                  onClick={onSelectOnlyFiltered}
                  disabled={stats.filteredCount === 0}
                  className="px-2.5 py-1 rounded-lg bg-[#EEF5EE] hover:bg-[#E1EFE2] text-[#1C4824] font-bold border border-[#BAD8BF] cursor-pointer disabled:opacity-50"
                >
                  เลือกทั้งชุดที่กรอง ({stats.filteredCount.toLocaleString()})
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Contextual Selection & Bulk Action Bar (Hidden when 0 clips selected) */}
      <AnimatePresence initial={false}>
        {stats.selectedCount > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.16 }}
            className="border-t border-[#D3E5D5] bg-[#F2F8F3]"
          >
            <div className="px-4 sm:px-5 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#3B6845] text-white font-bold text-[11px]">
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>
                    เลือกแล้ว{' '}
                    <span className="font-mono tabular-nums">
                      {stats.selectedCount.toLocaleString()}
                    </span>{' '}
                    เรื่อง
                  </span>
                </span>

                <button
                  type="button"
                  onClick={onSelectOnlyFiltered}
                  disabled={stats.filteredCount === 0}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white hover:bg-[#FAF7F2] text-[#3D332A] border border-[#D8E5DA] transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap"
                >
                  เลือกเฉพาะที่กรอง (
                  <span className="font-mono tabular-nums">
                    {stats.filteredCount.toLocaleString()}
                  </span>
                  )
                </button>

                {stats.newCount > 0 && (
                  <button
                    type="button"
                    onClick={onSelectAllNew}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white hover:bg-[#FAF7F2] text-[#3D332A] border border-[#D8E5DA] transition-colors cursor-pointer whitespace-nowrap"
                  >
                    เลือกเฉพาะคลิปใหม่ (
                    <span className="font-mono tabular-nums">
                      {stats.newCount.toLocaleString()}
                    </span>
                    )
                  </button>
                )}

                <button
                  type="button"
                  onClick={onDeselectAll}
                  className="px-2 py-1 rounded-lg text-[11px] font-semibold text-[#7D6E61] hover:text-rose-700 hover:bg-rose-50/60 transition-colors cursor-pointer whitespace-nowrap"
                >
                  ล้างที่เลือก
                </button>
              </div>

              <div className="flex items-center gap-2 ml-auto relative z-30">
                <SupabaseBulkEditPopover
                  selectedCount={stats.selectedCount}
                  config={config}
                  savedDraftOverridesCount={savedDraftOverridesCount}
                  onBatchSetStatus={onBatchSetStatus}
                  onBatchSetChannel={onBatchSetChannel}
                  onBatchTogglePlatform={onBatchTogglePlatform}
                  onBatchToggleAssets={onBatchToggleAssets}
                  onBatchSetPillar={onBatchSetPillar}
                  onBatchSetCategory={onBatchSetCategory}
                  onResetAllRowDrafts={onResetAllRowDrafts}
                  onBatchMarkAsSent={onBatchMarkAsSent}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
