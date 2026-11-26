import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Trash2,
  RotateCcw,
  Sparkles,
  Plus,
  Info,
  Lightbulb,
  Maximize2,
  Minimize2,
  FolderTree,
  Sliders,
  Search,
  X,
  FolderX,
  Eraser,
  Settings,
  ChevronDown,
  BookOpen,
  GitMerge,
  Loader2,
} from 'lucide-react';
import { CategoryTier } from '../../../types/tag.types';

export type UnifiedTagStudioTab = 'STUDIO_3TIER' | 'COOLDOWN_RULES';

interface IconTooltipButtonProps {
  onClick: () => void;
  tooltip: string;
  active?: boolean;
  danger?: boolean;
  badgeText?: string;
  className?: string;
  children: React.ReactNode;
}

const IconTooltipButton: React.FC<IconTooltipButtonProps> = ({
  onClick,
  tooltip,
  active = false,
  danger = false,
  badgeText,
  className = '',
  children,
}) => {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className={`relative inline-flex ${className}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <motion.button
        type="button"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.94 }}
        onClick={onClick}
        aria-label={tooltip}
        className={`relative w-8 h-8 rounded-xl flex items-center justify-center border transition-colors cursor-pointer ${
          danger
            ? 'bg-[#FDF2F0] hover:bg-[#FAE2DE] text-[#8A3C31] border-[#F0CEC8]'
            : active
            ? 'bg-[#EEF5EE] text-[#1C4824] border-[#BAD8BF] shadow-2xs'
            : 'bg-[#FAF7F2] hover:bg-[#F2EBE0] text-[#524538] border-[#E2D5C4]'
        }`}
      >
        {children}
        {badgeText && (
          <span className="absolute -top-1.5 -right-1.5 px-1 py-0.2 rounded-full text-[9px] font-mono font-bold bg-[#3B6845] text-white border border-white leading-none">
            {badgeText}
          </span>
        )}
      </motion.button>

      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 3, scale: 0.95 }}
            transition={{ duration: 0.14, ease: 'easeOut' }}
            className="absolute right-0 top-full mt-1.5 z-50 px-2.5 py-1 rounded-lg bg-[#3D332A] text-[#FDFBF7] text-xs font-semibold whitespace-nowrap shadow-md pointer-events-none"
          >
            {tooltip}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface ThreeTierHeaderRightControlsProps {
  activeStudioTab: UnifiedTagStudioTab;
  onChangeActiveStudioTab: (tab: UnifiedTagStudioTab) => void;
  cooldownDays: number;
  greenReadyDays: number;
  showConceptBanner: boolean;
  onToggleConceptBanner: () => void;
  showGlobalSearch?: boolean;
  onToggleGlobalSearch?: () => void;
  onRequestWipe: () => void;
  onRestoreDefaults: () => void;
  onRequestClearAllClips: () => void;
  isFullScreen: boolean;
  onToggleFullScreen: () => void;
  isBulkFocusMode?: boolean;
  onOpenJunkTagCleanup?: () => void;
  onOpenTagRulesDictionary?: () => void;
  duplicateGroupsCount?: number;
  isDeduplicatingTags?: boolean;
  onRunDeduplicateTags?: () => void;
}

export const ThreeTierHeaderRightControls: React.FC<
  ThreeTierHeaderRightControlsProps
> = ({
  activeStudioTab,
  onChangeActiveStudioTab,
  cooldownDays,
  greenReadyDays,
  showConceptBanner,
  onToggleConceptBanner,
  showGlobalSearch = false,
  onToggleGlobalSearch,
  onRequestWipe,
  onRestoreDefaults,
  onRequestClearAllClips,
  isFullScreen,
  onToggleFullScreen,
  isBulkFocusMode = false,
  onOpenJunkTagCleanup,
  onOpenTagRulesDictionary,
  duplicateGroupsCount = 0,
  isDeduplicatingTags = false,
  onRunDeduplicateTags,
}) => {
  const [isToolsMenuOpen, setIsToolsMenuOpen] = useState(false);
  const isExpandedView = isFullScreen || isBulkFocusMode;

  return (
    <div className="flex items-center gap-1.5 flex-nowrap">
      {!isExpandedView && (
        <>
          {/* 2-Tab Switcher on Top Right */}
          <div className="flex items-center gap-1 p-1 bg-[#EFE7DC] rounded-xl border border-[#E2D5C4]">
            <IconTooltipButton
              onClick={() => onChangeActiveStudioTab('STUDIO_3TIER')}
              active={activeStudioTab === 'STUDIO_3TIER'}
              tooltip="1. สตูดิโอแท็ก 3 ชั้นอิสระ"
            >
              <FolderTree className="w-4 h-4 text-[#3B6845]" />
            </IconTooltipButton>

            <IconTooltipButton
              onClick={() => onChangeActiveStudioTab('COOLDOWN_RULES')}
              active={activeStudioTab === 'COOLDOWN_RULES'}
              badgeText={`${cooldownDays}/${greenReadyDays}`}
              tooltip={`2. ตั้งค่าเกณฑ์สีพักฟุต (${cooldownDays}d / ${greenReadyDays}d)`}
            >
              <Sliders className="w-4 h-4 text-[#734B17]" />
            </IconTooltipButton>
          </div>

          {/* Search Focus Icon */}
          {onToggleGlobalSearch && (
            <IconTooltipButton
              onClick={onToggleGlobalSearch}
              active={showGlobalSearch}
              tooltip="กดเพื่อเสิร์ช TAG รวมพร้อมกันทั้ง 3 Tier"
            >
              <Search className="w-4 h-4 text-[#78593A]" />
            </IconTooltipButton>
          )}

          {/* Mobile Tools Dropdown Menu (md:hidden) */}
          <div className="relative md:hidden">
            <button
              type="button"
              onClick={() => setIsToolsMenuOpen((prev) => !prev)}
              className={`h-8 px-2 rounded-xl border flex items-center gap-1 text-xs font-bold transition-colors cursor-pointer ${
                isToolsMenuOpen
                  ? 'bg-[#EEF5EE] text-[#1C4824] border-[#BAD8BF]'
                  : 'bg-[#FAF7F2] hover:bg-[#F2EBE0] text-[#524538] border-[#E2D5C4]'
              }`}
              title="เมนูเครื่องมือเพิ่มเติม"
            >
              <Settings className="w-3.5 h-3.5 text-[#78593A]" />
              <span className="text-[11px]">เครื่องมือ</span>
              <ChevronDown
                className={`w-3 h-3 text-[#78593A] transition-transform ${
                  isToolsMenuOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Dropdown Backdrop */}
            {isToolsMenuOpen && (
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsToolsMenuOpen(false)}
              />
            )}

            {/* Dropdown Popover */}
            <AnimatePresence>
              {isToolsMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-1.5 z-50 w-60 rounded-2xl bg-white border border-[#E2D5C4] shadow-lg p-1.5 space-y-1 text-xs"
                >
                  <button
                    type="button"
                    onClick={() => {
                      onToggleConceptBanner();
                      setIsToolsMenuOpen(false);
                    }}
                    className="w-full px-2.5 py-2 rounded-xl text-left flex items-center gap-2 text-[#4D3A24] hover:bg-[#FAF7F2] font-semibold cursor-pointer"
                  >
                    <Lightbulb className="w-4 h-4 text-[#A67438] shrink-0" />
                    <span>
                      {showConceptBanner
                        ? 'ซ่อนคำอธิบายแนวคิด 3 มิติ'
                        : 'ดูคำอธิบายแนวคิด 3 มิติ'}
                    </span>
                  </button>

                  {onOpenTagRulesDictionary && (
                    <button
                      type="button"
                      onClick={() => {
                        onOpenTagRulesDictionary();
                        setIsToolsMenuOpen(false);
                      }}
                      className="w-full px-2.5 py-2 rounded-xl text-left flex items-center gap-2 text-[#1C4824] hover:bg-[#EEF5EE] font-bold cursor-pointer"
                    >
                      <BookOpen className="w-4 h-4 text-[#3B6845] shrink-0" />
                      <span>คู่มือกฎ Tag & Data Dictionary</span>
                    </button>
                  )}

                  {onRunDeduplicateTags && (
                    <button
                      type="button"
                      disabled={isDeduplicatingTags}
                      onClick={() => {
                        onRunDeduplicateTags();
                        setIsToolsMenuOpen(false);
                      }}
                      className={`w-full px-2.5 py-2 rounded-xl text-left flex items-center justify-between gap-2 font-bold cursor-pointer disabled:opacity-60 ${
                        duplicateGroupsCount > 0
                          ? 'text-[#9A3412] bg-[#FEF3EB] hover:bg-[#FDE6D8]'
                          : 'text-[#4D3A24] hover:bg-[#FAF7F2]'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        {isDeduplicatingTags ? (
                          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                        ) : (
                          <GitMerge className="w-4 h-4 shrink-0" />
                        )}
                        <span>ตรวจและรวมแท็กซ้ำ</span>
                      </span>
                      {duplicateGroupsCount > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-[#C2410C] text-white tabular-nums">
                          {duplicateGroupsCount}
                        </span>
                      )}
                    </button>
                  )}

                  {onOpenJunkTagCleanup && (
                    <button
                      type="button"
                      onClick={() => {
                        onOpenJunkTagCleanup();
                        setIsToolsMenuOpen(false);
                      }}
                      className="w-full px-2.5 py-2 rounded-xl text-left flex items-center gap-2 text-[#4D3A24] hover:bg-[#FAF7F2] font-semibold cursor-pointer"
                    >
                      <Eraser className="w-4 h-4 text-[#8A4D1F] shrink-0" />
                      <span>สแกนและล้างแท็กขยะ</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      onRestoreDefaults();
                      setIsToolsMenuOpen(false);
                    }}
                    className="w-full px-2.5 py-2 rounded-xl text-left flex items-center gap-2 text-[#244B2F] hover:bg-[#EEF5EE] font-semibold cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4 text-[#3B6845] shrink-0" />
                    <span>คืนค่าหมวดหมู่เริ่มต้น</span>
                  </button>

                  <div className="border-t border-[#EFE7DC] my-1" />

                  <button
                    type="button"
                    onClick={() => {
                      onRequestWipe();
                      setIsToolsMenuOpen(false);
                    }}
                    className="w-full px-2.5 py-2 rounded-xl text-left flex items-center gap-2 text-[#8A3C31] hover:bg-[#FDF2F0] font-semibold cursor-pointer"
                  >
                    <FolderX className="w-4 h-4 shrink-0" />
                    <span>ล้างโครงสร้างแท็กทั้งหมด</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onRequestClearAllClips();
                      setIsToolsMenuOpen(false);
                    }}
                    className="w-full px-2.5 py-2 rounded-xl text-left flex items-center gap-2 text-[#8A3C31] hover:bg-[#FDF2F0] font-semibold cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4 shrink-0" />
                    <span>ล้างคลังคลิปทั้งหมด</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Desktop Individual Icon Buttons (hidden md:inline-flex) */}
          <div className="hidden md:flex items-center gap-1.5">
            {onOpenTagRulesDictionary && (
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                onClick={onOpenTagRulesDictionary}
                className="h-8 px-2.5 rounded-xl bg-[#EEF5EE] hover:bg-[#E1EFE2] text-[#1C4824] border border-[#BAD8BF] text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                title="เปิดคู่มือกฎการติด Tag & Data Dictionary พร้อมจัดระเบียบอัตโนมัติ"
              >
                <BookOpen className="w-3.5 h-3.5 text-[#2E7D32]" />
                <span>คู่มือกฎ Tag & Dictionary</span>
              </motion.button>
            )}

            {onRunDeduplicateTags && (
              <motion.button
                type="button"
                disabled={isDeduplicatingTags}
                whileHover={isDeduplicatingTags ? undefined : { scale: 1.02 }}
                whileTap={isDeduplicatingTags ? undefined : { scale: 0.96 }}
                onClick={onRunDeduplicateTags}
                aria-label="ตรวจและรวมแท็กที่ชื่อซ้ำกัน"
                className={`h-8 px-2.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs disabled:opacity-60 ${
                  duplicateGroupsCount > 0
                    ? 'bg-[#FEF3EB] hover:bg-[#FDE6D8] text-[#9A3412] border-[#F4C2A1]'
                    : 'bg-[#FAF7F2] hover:bg-[#F2EBE0] text-[#524538] border-[#E2D5C4]'
                }`}
                title={
                  duplicateGroupsCount > 0
                    ? `พบแท็กชื่อซ้ำ ${duplicateGroupsCount} กลุ่ม — คลิกเพื่อรวมเป็นแท็กเดียวทันที`
                    : 'สแกนตรวจสอบแท็กที่ชื่อซ้ำกันในระบบและรวมเป็นอันเดียว'
                }
              >
                {isDeduplicatingTags ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                ) : (
                  <GitMerge className="w-3.5 h-3.5 shrink-0" />
                )}
                <span>ตรวจรวมแท็กซ้ำ</span>
                {duplicateGroupsCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-extrabold bg-[#C2410C] text-white tabular-nums">
                    {duplicateGroupsCount}
                  </span>
                )}
              </motion.button>
            )}

            <IconTooltipButton
              onClick={onToggleConceptBanner}
              active={showConceptBanner}
              tooltip={
                showConceptBanner
                  ? 'ซ่อนคำอธิบายแนวคิดแท็ก 3 ชั้นอิสระ'
                  : 'ดูคำอธิบายแนวคิดแท็ก 3 ชั้นอิสระ'
              }
            >
              <Lightbulb className="w-4 h-4 text-[#A67438]" />
            </IconTooltipButton>

            <IconTooltipButton
              onClick={onRestoreDefaults}
              tooltip="คืนค่าชุดหมวดหมู่ตัวอย่างเริ่มต้น"
            >
              <RotateCcw className="w-4 h-4 text-[#3B6845]" />
            </IconTooltipButton>

            <IconTooltipButton
              onClick={onRequestWipe}
              danger
              tooltip="ล้างโครงสร้างแท็กทั้งหมด"
            >
              <FolderX className="w-4 h-4" />
            </IconTooltipButton>

            {onOpenJunkTagCleanup && (
              <IconTooltipButton
                onClick={onOpenJunkTagCleanup}
                tooltip="สแกนและล้างแท็กชื่อคลิป / แท็กขยะ"
              >
                <Eraser className="w-4 h-4 text-[#8A4D1F]" />
              </IconTooltipButton>
            )}

            <IconTooltipButton
              onClick={onRequestClearAllClips}
              danger
              tooltip="ล้างคลังคลิปทั้งหมด (เก็บหมวดหมู่และการตั้งค่าไว้)"
            >
              <Trash2 className="w-4 h-4" />
            </IconTooltipButton>
          </div>
        </>
      )}

      {/* Full screen toggle (hidden on mobile, visible on desktop) */}
      <IconTooltipButton
        onClick={onToggleFullScreen}
        active={isExpandedView}
        className="hidden md:inline-flex"
        tooltip={isExpandedView ? 'ย่อกลับขนาดหน้าต่างปกติ' : 'ขยายเต็มจอ 100%'}
      >
        {isExpandedView ? (
          <Minimize2 className="w-4 h-4" />
        ) : (
          <Maximize2 className="w-4 h-4" />
        )}
      </IconTooltipButton>
    </div>
  );
};

interface ThreeTierQuickSearchAndSummaryBarProps {
  globalSearchQuery: string;
  onGlobalSearchQueryChange: (q: string) => void;
  hasAnySearchActive: boolean;
  onClearAllSearches: () => void;
  totalCounts: {
    tier1: number;
    tier2: number;
    tier3: number;
  };
  matchCounts: {
    tier1: number;
    tier2: number;
    tier3: number;
  };
  onSelectTierTab?: (tier: CategoryTier) => void;
  searchInputRef?: React.RefObject<HTMLInputElement | null>;
}

export const ThreeTierQuickSearchAndSummaryBar: React.FC<
  ThreeTierQuickSearchAndSummaryBarProps
> = ({
  globalSearchQuery,
  onGlobalSearchQueryChange,
  hasAnySearchActive,
  onClearAllSearches,
  totalCounts,
  matchCounts,
  onSelectTierTab,
  searchInputRef,
}) => {
  const totalAll = totalCounts.tier1 + totalCounts.tier2 + totalCounts.tier3;
  const totalMatched = matchCounts.tier1 + matchCounts.tier2 + matchCounts.tier3;

  return (
    <div className="bg-[#FAF8F5] border-b border-[#E8DFD3] px-3.5 sm:px-5 py-2 shrink-0">
      <div className="flex flex-wrap lg:flex-nowrap items-center justify-between gap-2.5">
        {/* Unified Cross-Tier Search Input */}
        <div className="relative flex-1 min-w-[220px] max-w-2xl">
          <Search className="w-4 h-4 text-[#78593A] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            value={globalSearchQuery}
            onChange={(e) => onGlobalSearchQueryChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape' && globalSearchQuery) {
                e.stopPropagation();
                onGlobalSearchQueryChange('');
              }
            }}
            placeholder="เสิร์ช TAG รวมทุก Tier พร้อมกัน (พิมพ์ชื่อแท็ก, หมวดย่อย, หรือ #...)"
            aria-label="เสิร์ช TAG รวมทุก Tier พร้อมกัน"
            className="w-full h-9 pl-9 pr-8 rounded-xl bg-white border border-[#DED2C2] text-xs sm:text-sm text-[#3D332A] placeholder:text-[#9D8E7F] focus:outline-none focus:border-[#78593A] shadow-2xs"
          />
          {globalSearchQuery && (
            <button
              type="button"
              onClick={() => onGlobalSearchQueryChange('')}
              aria-label="ล้างคำค้นหารวม"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-md text-[#8C7B6C] hover:text-[#3D332A] hover:bg-[#FAF7F2] cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Live Cross-Tier Match Summary / Quiet Total Metadata */}
        <div className="flex flex-wrap items-center gap-2 shrink-0 text-xs">
          {hasAnySearchActive ? (
            <>
              <span className="text-[#4D3A24] font-semibold tabular-nums whitespace-nowrap">
                พบ {totalMatched} / {totalAll} แท็ก
              </span>
              <span aria-hidden="true" className="text-[#C8B9A6] hidden sm:inline">
                ·
              </span>
              <div className="flex items-center gap-1 p-0.5 rounded-lg bg-[#EFE7DC] border border-[#E2D5C4]">
                {([
                  { tier: 1 as CategoryTier, label: 'T1', count: matchCounts.tier1 },
                  { tier: 2 as CategoryTier, label: 'T2', count: matchCounts.tier2 },
                  { tier: 3 as CategoryTier, label: 'T3', count: matchCounts.tier3 },
                ]).map((item) => (
                  <button
                    key={item.tier}
                    type="button"
                    onClick={() => onSelectTierTab?.(item.tier)}
                    className={`px-2 py-1 rounded-md text-[11px] font-bold tabular-nums transition-colors cursor-pointer whitespace-nowrap ${
                      item.count > 0
                        ? 'bg-white text-[#2D241C] shadow-2xs hover:bg-[#FDFBF7]'
                        : 'text-[#8C7B6C] hover:text-[#524538]'
                    }`}
                    title={`ดูผลลัพธ์ใน Tier ${item.tier} (${item.count} แท็ก)`}
                  >
                    {item.label}: {item.count}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={onClearAllSearches}
                className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-[#78593A] hover:text-[#3D332A] bg-white hover:bg-[#F5EFE6] border border-[#DED2C2] transition-colors cursor-pointer whitespace-nowrap"
              >
                ล้างค้นหา
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2 text-xs text-[#6E5F52] tabular-nums whitespace-nowrap">
              <span className="font-semibold text-[#4D3A24]">ทั้งหมด {totalAll} แท็ก</span>
              <span aria-hidden="true">·</span>
              <span>T1 {totalCounts.tier1}</span>
              <span aria-hidden="true">/</span>
              <span>T2 {totalCounts.tier2}</span>
              <span aria-hidden="true">/</span>
              <span>T3 {totalCounts.tier3}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface ThreeTierConceptBannerProps {
  isOpen: boolean;
  onOpenTagRulesDictionary?: () => void;
}

export const ThreeTierConceptBanner: React.FC<ThreeTierConceptBannerProps> = ({
  isOpen,
  onOpenTagRulesDictionary,
}) => {
  return (
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.22, ease: 'easeInOut' }}
          className="overflow-hidden"
        >
          <div className="p-3.5 rounded-2xl bg-[#FEF8ED] border border-[#EDD7AF] space-y-2.5 text-xs text-[#6E583C] shadow-2xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-[#A67438] shrink-0" />
                <span className="font-extrabold text-[#4D3A24]">
                  ระบบ Tag 3 ชั้นอิสระ (3-Tier Independent Faceted Tags)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-[#8C6D45] hidden sm:inline">
                  ฟุตเทจ 1 คลิปติดป้ายผสมกันได้อย่างอิสระจากทั้ง 3 มิติ
                </span>
                {onOpenTagRulesDictionary && (
                  <button
                    type="button"
                    onClick={onOpenTagRulesDictionary}
                    className="px-2.5 py-1 rounded-lg bg-white hover:bg-[#EEF5EE] text-[#1C4824] border border-[#BAD8BF] text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-[#2E7D32]" />
                    <span>เปิดดู Data Dictionary ฉบับเต็ม</span>
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-1 text-[11px]">
              <div className="p-2 rounded-xl bg-[#EEF5FB] border border-[#C5DCEF] text-[#184366]">
                <strong className="block font-bold mb-0.5">Tier 1 · หมวดกว้าง (Topic):</strong>
                <span className="text-[#325A7E]">บอกว่าคลิปนี้อยู่วงการไหน เช่น #คนมีชื่อเสียง #วิถีชาวบ้าน #สัตว์โลก #อาชีพ #สื่อและบันเทิง #ความเชื่อและลี้ลับ #ทั่วไป</span>
              </div>
              <div className="p-2 rounded-xl bg-[#FEF6E8] border border-[#E8CFA6] text-[#6B4415]">
                <strong className="block font-bold mb-0.5">Tier 2 · บริบท/สไตล์ (Context):</strong>
                <span className="text-[#7F521B]">กลุ่ม A–D เช่น #พูดผิด #ช็อตฟีล #น้ำท่วม #สัมภาษณ์ข่าว #ไลฟ์สด #คลิปในตำนาน</span>
              </div>
              <div className="p-2 rounded-xl bg-[#EDF6F0] border border-[#BFE0C8] text-[#1D4D2B]">
                <strong className="block font-bold mb-0.5">Tier 3 · บุคคล/รายการ (Entity):</strong>
                <span className="text-[#255E36]">ระบุว่าใครหรือรายการอะไร เช่น #พี่เสก #แจ๊ส #เซียนหรั่ง #แก๊บโบ๋ #โหนกระแส</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

interface ThreeTierEmptyStateProps {
  onOpenAddGroup: () => void;
  onRestoreDefaults: () => void;
}

export const ThreeTierEmptyState: React.FC<ThreeTierEmptyStateProps> = ({
  onOpenAddGroup,
  onRestoreDefaults,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className="flex-1 min-h-0 p-10 flex flex-col items-center justify-center text-center space-y-5 overflow-y-auto scrollbar-thin bg-[#FAF8F5]"
    >
      <div className="w-16 h-16 rounded-2xl bg-[#FBF3E6] border border-[#E8D7BE] text-[#8C6533] flex items-center justify-center shadow-2xs">
        <Sparkles className="w-8 h-8" />
      </div>
      <div className="max-w-lg space-y-1.5">
        <h3 className="text-lg font-bold text-[#3F3529]">
          สตูดิโอยังไม่มีป้ายแท็ก พร้อมสร้างระบบแท็ก 3 ชั้นของคุณแล้ว
        </h3>
        <p className="text-sm text-[#736859]">
          คุณสามารถเริ่มสร้างป้ายแท็กใน Tier 1, Tier 2, หรือ Tier 3
          หรือกดโหลดโครงสร้างตัวอย่างกลับมาใช้งานได้ทันที
        </p>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenAddGroup}
          className="px-4 py-2.5 bg-[#78593A] hover:bg-[#62462A] text-white rounded-xl text-sm font-bold shadow-2xs flex items-center gap-1.5 cursor-pointer transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>เริ่มสร้างแท็กแรก</span>
        </button>
        <button
          type="button"
          onClick={onRestoreDefaults}
          className="px-4 py-2.5 bg-[#F0EBD9] hover:bg-[#E4DCBF] text-[#554028] border border-[#DED4B7] rounded-xl text-sm font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          <span>โหลดโครงสร้างตัวอย่าง</span>
        </button>
      </div>
    </motion.div>
  );
};

interface ThreeTierModalFooterProps {
  onClose: () => void;
}

export const ThreeTierModalFooter: React.FC<ThreeTierModalFooterProps> = ({
  onClose,
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm text-[#736758]">
      <div className="flex items-center gap-2">
        <Info className="w-4 h-4 text-[#8A6840] shrink-0" />
        <span>
          การย้ายแท็กข้าม Tier และหมวดหมู่ย่อยจะซิงก์ขึ้น Cloud ทันทีโดยไม่กระทบป้ายแท็กที่ติดอยู่ในคลิปฟุตเทจ
        </span>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="px-5 py-2 bg-[#3B6845] hover:bg-[#2D5236] text-white font-bold rounded-xl text-xs sm:text-sm cursor-pointer transition-colors shadow-2xs"
      >
        เสร็จสิ้น
      </button>
    </div>
  );
};
