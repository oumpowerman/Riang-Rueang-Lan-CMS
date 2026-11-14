import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  CalendarClock,
  ClipboardPaste,
  Eraser,
  FileSpreadsheet,
  Layers,
  Maximize2,
  Minimize2,
  RotateCcw,
  Rows3,
  Settings2,
  Sparkles,
  Tag,
} from 'lucide-react';
import {
  SheetSyncSummaryStats,
  TableRowDensity,
} from './sheetImport.types';

export type UnifiedSyncMainTab = 'SHEET_SYNC' | 'YOUTUBE_DATE_SYNC';

interface IconTooltipButtonProps {
  icon: React.ReactNode;
  tooltip: string;
  onClick: () => void;
  isActive?: boolean;
  isDangerHover?: boolean;
  badgeText?: string | number;
}

const IconTooltipButton: React.FC<IconTooltipButtonProps> = ({
  icon,
  tooltip,
  onClick,
  isActive = false,
  isDangerHover = false,
  badgeText,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.button
        type="button"
        whileHover={{ y: -1 }}
        whileTap={{ scale: 0.92 }}
        onClick={onClick}
        aria-label={tooltip}
        className={`relative w-8 h-8 rounded-xl border flex items-center justify-center transition-colors cursor-pointer ${
          isActive
            ? 'bg-[#EEF5EE] text-[#1C4824] border-[#BAD8BF] shadow-2xs'
            : isDangerHover
            ? 'bg-[#FAF7F2] hover:bg-[#FDF4EB] text-[#7D6E61] hover:text-[#B44335] border-[#E2D5C4] hover:border-[#EBD1BE]'
            : 'bg-[#FAF7F2] hover:bg-[#F2EBE0] text-[#524538] hover:text-[#3D332A] border-[#E2D5C4]'
        }`}
      >
        {icon}
        {badgeText !== undefined && (
          <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-[#3B6845] text-white font-mono text-[9px] font-bold flex items-center justify-center shadow-2xs">
            {badgeText}
          </span>
        )}
      </motion.button>

      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 3, scale: 0.95 }}
            transition={{ duration: 0.14 }}
            className="absolute top-full right-0 mt-1.5 px-2.5 py-1 rounded-lg bg-[#3D332A] text-[#FDFBF7] text-[11px] font-semibold whitespace-nowrap shadow-md pointer-events-none z-50"
          >
            {tooltip}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface SheetHeaderRightControlsProps {
  activeMainSyncTab: UnifiedSyncMainTab;
  onChangeMainSyncTab: (tab: UnifiedSyncMainTab) => void;
  hasData: boolean;
  stats: SheetSyncSummaryStats;
  activePreviewTab: 'FOOTAGE_ROWS' | 'EPISODE_GROUPS';
  onChangeActivePreviewTab: (tab: 'FOOTAGE_ROWS' | 'EPISODE_GROUPS') => void;
  isInputExpanded: boolean;
  onToggleInputExpanded: () => void;
  onClearPastedText: () => void;
  onLoadSampleData: () => void;
  rowDensity: TableRowDensity;
  onToggleRowDensity: () => void;
  isFullScreen: boolean;
  onToggleFullScreen: () => void;
  syncEpisodesFromColD: boolean;
  onChangeSyncEpisodesFromColD: (val: boolean) => void;
  autoCreateMissingFootage: boolean;
  onChangeAutoCreateMissingFootage: (val: boolean) => void;
  includeSeriesTagOnFootage: boolean;
  onChangeIncludeSeriesTagOnFootage: (val: boolean) => void;
  onOpenJunkTagCleanup?: () => void;
}

export const SheetHeaderRightControls: React.FC<
  SheetHeaderRightControlsProps
> = ({
  activeMainSyncTab,
  onChangeMainSyncTab,
  hasData,
  stats,
  activePreviewTab,
  onChangeActivePreviewTab,
  isInputExpanded,
  onToggleInputExpanded,
  onClearPastedText,
  onLoadSampleData,
  rowDensity,
  onToggleRowDensity,
  isFullScreen,
  onToggleFullScreen,
  syncEpisodesFromColD,
  onChangeSyncEpisodesFromColD,
  autoCreateMissingFootage,
  onChangeAutoCreateMissingFootage,
  includeSeriesTagOnFootage,
  onChangeIncludeSeriesTagOnFootage,
  onOpenJunkTagCleanup,
}) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isSettingsOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node)
      ) {
        setIsSettingsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSettingsOpen]);

  const activeSettingsCount =
    (syncEpisodesFromColD ? 1 : 0) +
    (autoCreateMissingFootage ? 1 : 0) +
    (includeSeriesTagOnFootage ? 1 : 0);

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Unified Mode Switcher: 10-Col Master Sheet (Primary) vs Quick Date-Only Patch */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-[#EFE7DC] border border-[#E2D5C4]">
        <button
          type="button"
          onClick={() => onChangeMainSyncTab('SHEET_SYNC')}
          className={`relative px-3 py-1 rounded-lg text-xs font-extrabold transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeMainSyncTab === 'SHEET_SYNC'
              ? 'text-[#FDFBF7]'
              : 'text-[#524538] hover:text-[#3D332A]'
          }`}
        >
          {activeMainSyncTab === 'SHEET_SYNC' && (
            <motion.span
              layoutId="unifiedMainStepIndicator"
              transition={{ type: 'spring', stiffness: 420, damping: 32 }}
              className="absolute inset-0 rounded-lg bg-[#3B6845] shadow-2xs"
            />
          )}
          <FileSpreadsheet className="w-3.5 h-3.5 relative z-10" />
          <span className="relative z-10">
            ซิงก์ชีทหลัก 10 คอลัมน์ (A–J)
          </span>
        </button>

        <button
          type="button"
          onClick={() => onChangeMainSyncTab('YOUTUBE_DATE_SYNC')}
          className={`relative px-3 py-1 rounded-lg text-xs font-extrabold transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeMainSyncTab === 'YOUTUBE_DATE_SYNC'
              ? 'text-[#FDFBF7]'
              : 'text-[#524538] hover:text-[#3D332A]'
          }`}
          title="โหมดอัปเดตเฉพาะวันที่เผยแพร่จากตาราง 2 คอลัมน์ (วันที่ + ชื่อคลิป)"
        >
          {activeMainSyncTab === 'YOUTUBE_DATE_SYNC' && (
            <motion.span
              layoutId="unifiedMainStepIndicator"
              transition={{ type: 'spring', stiffness: 420, damping: 32 }}
              className="absolute inset-0 rounded-lg bg-[#3B6845] shadow-2xs"
            />
          )}
          <CalendarClock className="w-3.5 h-3.5 relative z-10" />
          <span className="relative z-10">
            อัปเดตเฉพาะวันที่ (2 คอลัมน์)
          </span>
        </button>
      </div>

      {/* Sub-Tab Switcher when 10-Col Master Sheet data is loaded */}
      {activeMainSyncTab === 'SHEET_SYNC' && hasData && (
        <div className="flex items-center gap-1 p-1 rounded-xl bg-[#FAF7F2] border border-[#E2D5C4]">
          <button
            type="button"
            onClick={() => onChangeActivePreviewTab('FOOTAGE_ROWS')}
            className={`relative px-2.5 py-1 rounded-lg text-xs font-extrabold transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activePreviewTab === 'FOOTAGE_ROWS'
                ? 'bg-[#3D332A] text-[#FDFBF7]'
                : 'text-[#524538] hover:text-[#3D332A]'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>
              ฟุตเทจ & แท็ก 3 ชั้น ({stats.totalRows.toLocaleString()})
            </span>
          </button>

          {syncEpisodesFromColD && stats.episodeGroupsCount > 0 && (
            <button
              type="button"
              onClick={() => onChangeActivePreviewTab('EPISODE_GROUPS')}
              className={`relative px-2.5 py-1 rounded-lg text-xs font-extrabold transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activePreviewTab === 'EPISODE_GROUPS'
                  ? 'bg-[#3D332A] text-[#FDFBF7]'
                  : 'text-[#524538] hover:text-[#3D332A]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>
                จัดอันดับ EP & วันที่ ({stats.episodeGroupsCount.toLocaleString()})
              </span>
              {stats.incompleteEpisodesCount > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full font-mono text-[10px] ${
                    activePreviewTab === 'EPISODE_GROUPS'
                      ? 'bg-white/25 text-white'
                      : 'bg-[#FDF4EB] text-[#8A4D1F] border border-[#EBD1BE]'
                  }`}
                >
                  !{stats.incompleteEpisodesCount}
                </span>
              )}
            </button>
          )}
        </div>
      )}

      {/* Icon-Only Action Buttons */}
      <div className="flex items-center gap-1.5">
        {activeMainSyncTab === 'SHEET_SYNC' && (
          <>
            {!hasData ? (
              <motion.button
                type="button"
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.96 }}
                onClick={onLoadSampleData}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#FEF6E8] hover:bg-[#FAEBD0] text-[#734B17] border border-[#EAD5AE] transition-colors cursor-pointer whitespace-nowrap"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#8A5A22]" />
                <span>วางตัวอย่าง 10 คอลัมน์</span>
              </motion.button>
            ) : (
              <>
                <IconTooltipButton
                  icon={<ClipboardPaste className="w-4 h-4" />}
                  tooltip={
                    isInputExpanded
                      ? 'ซ่อนช่องวางข้อมูลจากชีท'
                      : 'แก้ไขข้อมูลที่วางจากชีท'
                  }
                  isActive={isInputExpanded}
                  onClick={onToggleInputExpanded}
                />

                <IconTooltipButton
                  icon={<Rows3 className="w-4 h-4" />}
                  tooltip={
                    rowDensity === 'COMPACT'
                      ? 'ความหนาแน่นตาราง: กระชับ (คลิกเปลี่ยนเป็นปกติ)'
                      : 'ความหนาแน่นตาราง: ปกติ (คลิกเปลี่ยนเป็นกระชับ)'
                  }
                  isActive={rowDensity === 'COMPACT'}
                  onClick={onToggleRowDensity}
                />

                <IconTooltipButton
                  icon={<RotateCcw className="w-4 h-4" />}
                  tooltip="ล้างข้อมูลที่วางทั้งหมด"
                  isDangerHover
                  onClick={onClearPastedText}
                />
              </>
            )}

            {/* Sync Settings Popover */}
            <div className="relative" ref={popoverRef}>
              <IconTooltipButton
                icon={<Settings2 className="w-4 h-4" />}
                tooltip={`ตั้งค่าเงื่อนไขการซิงค์ (${activeSettingsCount}/3 ข้อ)`}
                isActive={isSettingsOpen}
                badgeText={activeSettingsCount}
                onClick={() => setIsSettingsOpen((prev) => !prev)}
              />

              <AnimatePresence>
                {isSettingsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.96 }}
                    transition={{ duration: 0.16 }}
                    className="absolute right-0 mt-2 w-80 sm:w-96 p-3.5 rounded-2xl bg-[#FFFFFF] border border-[#E8DFD3] shadow-xl z-50 space-y-2.5 text-left"
                  >
                    <div className="text-xs font-extrabold text-[#3D332A] border-b border-[#F2EBE0] pb-2 flex items-center justify-between">
                      <span>ตั้งค่าเงื่อนไขซิงก์ตารางหลัก 10 คอลัมน์</span>
                      <span className="font-mono text-[11px] text-[#3B6845]">
                        เปิดใช้งาน {activeSettingsCount}/3 ข้อ
                      </span>
                    </div>

                    <label className="flex items-start gap-2.5 p-2.5 rounded-xl bg-[#FAF8F5] border border-[#E8DFD3] cursor-pointer hover:bg-[#FDFBF7] transition-colors">
                      <input
                        type="checkbox"
                        checked={syncEpisodesFromColD}
                        onChange={(e) =>
                          onChangeSyncEpisodesFromColD(e.target.checked)
                        }
                        className="mt-0.5 rounded border-[#C5B49E] text-[#3B6845] focus:ring-[#3B6845]"
                      />
                      <div className="text-xs">
                        <span className="font-extrabold text-[#3D332A] block">
                          1. จัดอันดับสร้าง/อัปเดต EP + ซิงก์วันที่ (Col B, H–J)
                        </span>
                        <span className="text-[#7D6E61] leading-snug block mt-0.5">
                          รวม 5 แถวที่มีชื่อคลิปหลักเดียวกันเป็น 1 EP พร้อมชื่ออันดับ คำสร้อย ลิงก์ และวันที่เผยแพร่
                        </span>
                      </div>
                    </label>

                    <label className="flex items-start gap-2.5 p-2.5 rounded-xl bg-[#FAF8F5] border border-[#E8DFD3] cursor-pointer hover:bg-[#FDFBF7] transition-colors">
                      <input
                        type="checkbox"
                        checked={autoCreateMissingFootage}
                        onChange={(e) =>
                          onChangeAutoCreateMissingFootage(e.target.checked)
                        }
                        className="mt-0.5 rounded border-[#C5B49E] text-[#3B6845] focus:ring-[#3B6845]"
                      />
                      <div className="text-xs">
                        <span className="font-extrabold text-[#3D332A] block">
                          2. สร้างฟุตเทจใหม่อัตโนมัติหากยังไม่มีในคลัง (Col A)
                        </span>
                        <span className="text-[#7D6E61] leading-snug block mt-0.5">
                          หากฟุตซ้ำในหลาย EP ระบบจะใช้รหัสฟุตตัวเดิมไม่สร้างซ้ำ
                        </span>
                      </div>
                    </label>

                    <label className="flex items-start gap-2.5 p-2.5 rounded-xl bg-[#FAF8F5] border border-[#E8DFD3] cursor-pointer hover:bg-[#FDFBF7] transition-colors">
                      <input
                        type="checkbox"
                        checked={includeSeriesTagOnFootage}
                        onChange={(e) =>
                          onChangeIncludeSeriesTagOnFootage(e.target.checked)
                        }
                        className="mt-0.5 rounded border-[#C5B49E] text-[#3B6845] focus:ring-[#3B6845]"
                      />
                      <div className="text-xs">
                        <span className="font-extrabold text-[#3D332A] block">
                          3. ติดแท็กชื่อซีรีส์จาก Col B ให้ฟุตเทจด้วย
                        </span>
                        <span className="text-[#7D6E61] leading-snug block mt-0.5">
                          เช่น <code className="text-[#254B2D] font-bold">5 อันดับพี่เสกสุดฮา EP.1</code> จะติดแท็ก{' '}
                          <code className="text-[#254B2D] font-bold">#พี่เสกสุดฮา</code> ให้คลิปย่อยด้วย
                        </span>
                      </div>
                    </label>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </>
        )}

        {onOpenJunkTagCleanup && (
          <IconTooltipButton
            icon={<Eraser className="w-4 h-4 text-[#8A4D1F]" />}
            tooltip="สแกนและล้างแท็กชื่อคลิป/แท็กขยะ"
            onClick={onOpenJunkTagCleanup}
          />
        )}

        <IconTooltipButton
          icon={
            isFullScreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )
          }
          tooltip={
            isFullScreen ? 'ย่อขนาดหน้าต่างกลับ (96vw)' : 'ขยายเต็มหน้าจอ 100%'
          }
          isActive={isFullScreen}
          onClick={onToggleFullScreen}
        />
      </div>
    </div>
  );
};
