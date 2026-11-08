import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ClipboardPaste,
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
}

export const SheetHeaderRightControls: React.FC<
  SheetHeaderRightControlsProps
> = ({
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
      {/* Main Tab Switcher with Sliding Framer Motion Pill (Only when data is loaded) */}
      {hasData && (
        <div className="flex items-center gap-1 p-1 rounded-xl bg-[#EFE7DC] border border-[#E2D5C4] mr-1">
          <button
            type="button"
            onClick={() => onChangeActivePreviewTab('FOOTAGE_ROWS')}
            className={`relative px-3 py-1 rounded-lg text-xs font-extrabold transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activePreviewTab === 'FOOTAGE_ROWS'
                ? 'text-[#FDFBF7]'
                : 'text-[#524538] hover:text-[#3D332A]'
            }`}
          >
            {activePreviewTab === 'FOOTAGE_ROWS' && (
              <motion.span
                layoutId="sheetMainTabIndicator"
                transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                className="absolute inset-0 rounded-lg bg-[#3B6845] shadow-2xs"
              />
            )}
            <Tag className="w-3.5 h-3.5 relative z-10" />
            <span className="relative z-10">
              {syncEpisodesFromColD && stats.episodeGroupsCount > 0
                ? `1. ฟุตเทจ & แท็ก (${stats.totalRows.toLocaleString()})`
                : `ฟุตเทจ & แท็ก (${stats.totalRows.toLocaleString()} แถว)`}
            </span>
          </button>

          {syncEpisodesFromColD && stats.episodeGroupsCount > 0 && (
            <button
              type="button"
              onClick={() => onChangeActivePreviewTab('EPISODE_GROUPS')}
              className={`relative px-3 py-1 rounded-lg text-xs font-extrabold transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activePreviewTab === 'EPISODE_GROUPS'
                  ? 'text-[#FDFBF7]'
                  : 'text-[#524538] hover:text-[#3D332A]'
              }`}
            >
              {activePreviewTab === 'EPISODE_GROUPS' && (
                <motion.span
                  layoutId="sheetMainTabIndicator"
                  transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                  className="absolute inset-0 rounded-lg bg-[#3B6845] shadow-2xs"
                />
              )}
              <Layers className="w-3.5 h-3.5 relative z-10" />
              <span className="relative z-10">
                2. จัดอันดับ EP ({stats.episodeGroupsCount.toLocaleString()})
              </span>
              {stats.incompleteEpisodesCount > 0 && (
                <span
                  className={`relative z-10 px-1.5 py-0.2 rounded-full font-mono text-[10px] ${
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

      {/* Icon-Only Action Buttons with Animated Tooltips */}
      <div className="flex items-center gap-1.5">
        {!hasData ? (
          <motion.button
            type="button"
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.96 }}
            onClick={onLoadSampleData}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#FEF8ED] hover:bg-[#FAEED6] text-[#734B17] border border-[#EDD7AF] transition-colors cursor-pointer whitespace-nowrap"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#8A5A22]" />
            <span>วางตัวอย่าง 4 คอลัมน์</span>
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

        {/* Sync Settings Popover Icon Button */}
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
                  <span>ตั้งค่าเงื่อนไขการซิงค์ข้อมูลจากชีท</span>
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
                      1. จัดอันดับสร้าง/อัปเดต EP อัตโนมัติ (คอลัมน์ D)
                    </span>
                    <span className="text-[#7D6E61] leading-snug block mt-0.5">
                      รวมฟุตเทจชื่อ EP เดียวกันเป็นคลิปหลัก 5 อันดับ หากมี EP ซ้ำจะอัปเดตแทนการสร้างซ้ำ
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
                      2. สร้างฟุตเทจใหม่อัตโนมัติหากยังไม่มีในคลัง
                    </span>
                    <span className="text-[#7D6E61] leading-snug block mt-0.5">
                      เหมาะสำหรับตั้งฐานข้อมูลใหม่ หากฟุตซ้ำในหลาย EP ระบบจะใช้รหัสฟุตตัวเดิมไม่สร้างซ้ำ
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
                      3. ติดแท็กชื่อซีรีส์จากคอลัมน์ D ให้ฟุตเทจด้วย
                    </span>
                    <span className="text-[#7D6E61] leading-snug block mt-0.5">
                      เช่น <code className="text-[#254B2D] font-bold">คนไทยคนตลก EP.1</code> จะติดแท็ก{' '}
                      <code className="text-[#254B2D] font-bold">#คนไทยคนตลก</code> ให้คลิปย่อยด้วย
                    </span>
                  </div>
                </label>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Fullscreen 100% Icon Button */}
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
