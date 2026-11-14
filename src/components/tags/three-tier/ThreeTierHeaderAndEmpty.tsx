import React, { useState, useMemo } from 'react';
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
  ArrowRight,
  Eraser,
  Settings,
  ChevronDown,
  BookOpen,
} from 'lucide-react';
import { CategoryMatrixStat } from '../../../context/CMSContext';
import { isStagingTagId } from '../../../services/seedData';
import {
  CategoryGroup,
  CategoryTag,
  CategoryTier,
  DEFAULT_UNCLASSIFIED_SUBCATEGORY,
} from '../../../types/tag.types';
import { getPastelColorConfig } from '../constants/tagPastelPalette';

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

          {/* Search Toggle Icon */}
          {onToggleGlobalSearch && (
            <IconTooltipButton
              onClick={onToggleGlobalSearch}
              active={showGlobalSearch}
              tooltip={
                showGlobalSearch
                  ? 'ซ่อนแถบค้นหาด่วนข้าม 3 ชั้น'
                  : 'ค้นหาด่วนข้ามทั้ง 3 ชั้น (ชื่อแท็ก, หมวดย่อย)'
              }
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
  categoryGroups: CategoryGroup[];
  tags: CategoryTag[];
  categoryMatrix: CategoryMatrixStat[];
  onJumpToTag: (tier: CategoryTier, tagName: string) => void;
  isSearchOpen?: boolean;
  onCloseSearch?: () => void;
}

export const ThreeTierQuickSearchAndSummaryBar: React.FC<
  ThreeTierQuickSearchAndSummaryBarProps
> = ({ tags, categoryMatrix, onJumpToTag, isSearchOpen = false, onCloseSearch }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const realTags = useMemo(
    () => tags.filter((t) => !isStagingTagId(t.id)),
    [tags]
  );

  // Instant search across Tier 1, Tier 2, and Tier 3 tags
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];

    return realTags
      .filter((t) => {
        const matchName = t.name.toLowerCase().includes(q);
        const matchSub = (t.subCategory || '').toLowerCase().includes(q);
        const matchId = t.id.toLowerCase().includes(q);
        return matchName || matchSub || matchId;
      })
      .slice(0, 8)
      .map((tag) => {
        const stat = categoryMatrix.find((m) => m.tag.id === tag.id);
        return {
          tag,
          tier: (tag.tier || 1) as CategoryTier,
          subCategory: tag.subCategory || DEFAULT_UNCLASSIFIED_SUBCATEGORY,
          usableCount: stat?.usableCount || 0,
          totalCount: stat?.totalCount || 0,
        };
      });
  }, [searchQuery, realTags, categoryMatrix]);

  return (
    <AnimatePresence initial={false}>
      {isSearchOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="bg-[#FAF8F5] border-b border-[#E8DFD3] px-3.5 sm:px-5 py-2.5 shrink-0 space-y-2 overflow-hidden"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-[#4D3A24] flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-[#78593A]" />
              <span>ค้นหาด่วนข้ามทั้ง 3 ชั้น</span>
            </span>
            {onCloseSearch && (
              <button
                type="button"
                onClick={onCloseSearch}
                className="text-xs text-[#7D6E61] hover:text-[#3D332A] inline-flex items-center gap-1 cursor-pointer px-2 py-0.5 rounded-md hover:bg-white border border-transparent hover:border-[#E2D5C4]"
              >
                <X className="w-3.5 h-3.5" />
                <span>ปิด</span>
              </button>
            )}
          </div>

          <div className="relative w-full max-w-xl">
            <Search className="w-3.5 h-3.5 text-[#8C7B6C] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="พิมพ์ชื่อแท็ก, หมวดย่อย, หรือรหัส TAG-xxxx..."
              className="w-full pl-8 pr-7 py-1.5 rounded-xl bg-white border border-[#E3D8CB] text-xs text-[#3D332A] placeholder:text-[#A39485] focus:outline-none focus:border-[#8FA892] shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8C7B6C] hover:text-[#3D332A] cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Instant Search Jump Strip */}
          <AnimatePresence initial={false}>
            {searchQuery.trim().length > 0 && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.16, ease: 'easeOut' }}
                className="overflow-hidden pt-1"
              >
                <div className="p-2 rounded-xl bg-white border border-[#E3D8CB] flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-bold text-[#7D6E61] px-1">
                    ผลการค้นหา ({searchResults.length}):
                  </span>
                  {searchResults.length === 0 ? (
                    <span className="text-xs text-[#8C7B6C] italic">
                      ไม่พบแท็กที่ตรงกับ &ldquo;{searchQuery}&rdquo;
                    </span>
                  ) : (
                    searchResults.map((item) => {
                      const colorCfg = getPastelColorConfig(item.tag.color);
                      return (
                        <button
                          key={item.tag.id}
                          type="button"
                          onClick={() => {
                            onJumpToTag(item.tier, item.tag.name);
                            setSearchQuery('');
                          }}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-[#FAF7F2] hover:bg-[#EEF5EE] text-[#3D332A] border border-[#E2D5C4] transition-colors cursor-pointer"
                          title={`คลิกเพื่อกรองในคอลัมน์ Tier ${item.tier} (${item.subCategory})`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${colorCfg.swatchBg}`}
                          />
                          <span className="text-[10px] font-mono px-1 rounded bg-[#EFE7DC] text-[#524538]">
                            T{item.tier}:{item.subCategory}
                          </span>
                          <span>#{item.tag.name}</span>
                          <span className="text-[10px] font-mono text-[#6E5F52]">
                            ({item.usableCount}/{item.totalCount} ฟุต)
                          </span>
                          <ArrowRight className="w-3 h-3 text-[#3B6845]" />
                        </button>
                      );
                    })
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
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
