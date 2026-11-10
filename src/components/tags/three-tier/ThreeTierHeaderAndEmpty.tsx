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
  LayoutGrid,
  Eraser,
} from 'lucide-react';
import { CategoryMatrixStat } from '../../../context/CMSContext';
import { CategoryGroup, CategoryTag } from '../../../types/tag.types';
import { getPastelColorConfig } from '../constants/tagPastelPalette';

export type UnifiedTagStudioTab = 'STUDIO_3TIER' | 'COOLDOWN_RULES';

interface IconTooltipButtonProps {
  onClick: () => void;
  tooltip: string;
  active?: boolean;
  danger?: boolean;
  badgeText?: string;
  children: React.ReactNode;
}

const IconTooltipButton: React.FC<IconTooltipButtonProps> = ({
  onClick,
  tooltip,
  active = false,
  danger = false,
  badgeText,
  children,
}) => {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="relative inline-flex"
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
  onRequestWipe: () => void;
  onRestoreDefaults: () => void;
  onRequestClearAllClips: () => void;
  isFullScreen: boolean;
  onToggleFullScreen: () => void;
  isBulkFocusMode?: boolean;
  onToggleBulkFocusMode?: () => void;
  onOpenJunkTagCleanup?: () => void;
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
  onRequestWipe,
  onRestoreDefaults,
  onRequestClearAllClips,
  isFullScreen,
  onToggleFullScreen,
  isBulkFocusMode = false,
  onToggleBulkFocusMode,
  onOpenJunkTagCleanup,
}) => {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Prominent Bulk Focus / Multi-Column Expand Toggle */}
      {activeStudioTab === 'STUDIO_3TIER' && onToggleBulkFocusMode && (
        <button
          type="button"
          onClick={onToggleBulkFocusMode}
          className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
            isBulkFocusMode
              ? 'bg-[#3B6845] hover:bg-[#2C5235] text-white border-[#2C5235] shadow-2xs'
              : 'bg-[#EEF5EE] hover:bg-[#DCECE0] text-[#1C4824] border-[#BAD8BF]'
          }`}
          title={
            isBulkFocusMode
              ? 'ย่อกลับสู่มุมมอง 3 คอลัมน์ปกติ'
              : 'ขยายเต็มพื้นที่: กางรายการแท็กเป็นตารางหลายคอลัมน์ และซ่อนส่วนที่ไม่จำเป็นเพื่อย้ายหมวดหมู่ด่วน'
          }
        >
          {isBulkFocusMode ? (
            <>
              <Minimize2 className="w-3.5 h-3.5" />
              <span>ย่อกลับมุมมองปกติ</span>
            </>
          ) : (
            <>
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>ขยายจัดการเต็มพื้นที่</span>
            </>
          )}
        </button>
      )}

      {/* 2-Tab Main Switcher with Sliding Pill Indicator */}
      {!isBulkFocusMode && (
        <div className="flex items-center p-1 bg-[#EFE7DC] rounded-xl border border-[#E2D5C4]">
          <button
            type="button"
            onClick={() => onChangeActiveStudioTab('STUDIO_3TIER')}
            className={`relative px-3 py-1 rounded-lg text-xs font-extrabold transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeStudioTab === 'STUDIO_3TIER'
                ? 'text-[#3D332A]'
                : 'text-[#6E5F52] hover:text-[#3D332A]'
            }`}
          >
            {activeStudioTab === 'STUDIO_3TIER' && (
              <motion.span
                layoutId="tagStudioMainTabPill"
                transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                className="absolute inset-0 rounded-lg bg-white shadow-2xs"
              />
            )}
            <span className="relative z-10 inline-flex items-center gap-1.5">
              <FolderTree className="w-3.5 h-3.5 text-[#3B6845]" />
              <span>1. สตูดิโอแท็ก 3 ชั้น</span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => onChangeActiveStudioTab('COOLDOWN_RULES')}
            className={`relative px-3 py-1 rounded-lg text-xs font-extrabold transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeStudioTab === 'COOLDOWN_RULES'
                ? 'text-[#3D332A]'
                : 'text-[#6E5F52] hover:text-[#3D332A]'
            }`}
          >
            {activeStudioTab === 'COOLDOWN_RULES' && (
              <motion.span
                layoutId="tagStudioMainTabPill"
                transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                className="absolute inset-0 rounded-lg bg-white shadow-2xs"
              />
            )}
            <span className="relative z-10 inline-flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-[#734B17]" />
              <span>2. ตั้งค่าเกณฑ์สีพักฟุต</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-[#FEF8ED] text-[#734B17] border border-[#EDD7AF]">
                {cooldownDays}d/{greenReadyDays}d
              </span>
            </span>
          </button>
        </div>
      )}

      {/* Icon-Only Utility Buttons with Framer Motion Hover Tooltips */}
      <div className="flex items-center gap-1.5">
        {!isBulkFocusMode && (
          <>
            <IconTooltipButton
              onClick={onToggleConceptBanner}
              active={showConceptBanner}
              tooltip={
                showConceptBanner
                  ? 'ซ่อนคำอธิบายแนวคิดแท็กหลายมิติ'
                  : 'ดูคำอธิบายแนวคิดแท็กหลายมิติ'
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
              tooltip="ล้างโครงสร้างหมวดหมู่ทั้งหมด (Tier 0–2)"
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
          </>
        )}

        <IconTooltipButton
          onClick={onToggleFullScreen}
          active={isFullScreen}
          tooltip={isFullScreen ? 'ย่อขนาดหน้าต่างปกติ' : 'ขยายเต็มจอ 100%'}
        >
          {isFullScreen ? (
            <Minimize2 className="w-4 h-4" />
          ) : (
            <Maximize2 className="w-4 h-4" />
          )}
        </IconTooltipButton>
      </div>
    </div>
  );
};

interface ThreeTierQuickSearchAndSummaryBarProps {
  categoryGroups: CategoryGroup[];
  tags: CategoryTag[];
  categoryMatrix: CategoryMatrixStat[];
  onJumpToTag: (groupId: string, mainCatId: string) => void;
}

export const ThreeTierQuickSearchAndSummaryBar: React.FC<
  ThreeTierQuickSearchAndSummaryBarProps
> = ({ categoryGroups, tags, categoryMatrix, onJumpToTag }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const mainCategoriesCount = useMemo(
    () => tags.filter((t) => t.tier === 1 || (!t.parentId && !t.tier)).length,
    [tags]
  );

  const subcategoriesCount = useMemo(
    () => tags.filter((t) => t.tier === 2 || Boolean(t.parentId)).length,
    [tags]
  );

  const totalProducibleEps = useMemo(
    () =>
      categoryMatrix.reduce(
        (sum, item) =>
          sum + (item.tag.tier === 1 ? item.producibleEpisodesCount : 0),
        0
      ),
    [categoryMatrix]
  );

  const readySoloEpsCount = useMemo(
    () =>
      categoryMatrix.filter(
        (item) =>
          (item.tag.tier === 2 || Boolean(item.tag.parentId)) &&
          item.usableCount >= 5
      ).length,
    [categoryMatrix]
  );

  // Instant search across Tier 1 and Tier 2 tags
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];

    return tags
      .filter((t) => {
        const matchName = t.name.toLowerCase().includes(q);
        const matchId = t.id.toLowerCase().includes(q);
        const matchDesc = (t.description || '').toLowerCase().includes(q);
        return matchName || matchId || matchDesc;
      })
      .slice(0, 8)
      .map((tag) => {
        const isSub = tag.tier === 2 || Boolean(tag.parentId);
        const parentTag = isSub
          ? tags.find((p) => p.id === tag.parentId) || null
          : tag;
        const resolvedGroupId =
          parentTag?.groupId ||
          (parentTag?.groupType ? `GRP-${parentTag.groupType}` : '') ||
          categoryGroups[0]?.id ||
          '';
        const groupObj = categoryGroups.find((g) => g.id === resolvedGroupId);
        const stat = categoryMatrix.find((m) => m.tag.id === tag.id);

        return {
          tag,
          isSub,
          parentTag,
          resolvedGroupId,
          groupName: groupObj?.name || 'มิติหลัก',
          usableCount: stat?.usableCount || 0,
          totalCount: stat?.totalCount || 0,
        };
      });
  }, [searchQuery, tags, categoryGroups, categoryMatrix]);

  return (
    <div className="bg-[#FAF8F5] border-b border-[#E8DFD3] px-4 sm:px-5 py-2 shrink-0 space-y-2">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2">
        {/* Left: Instant Tag Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-[#8C7B6C] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาชื่อแท็กหลัก, #แท็กย่อย, ดารา หรือรหัส TAG-xxxx..."
            className="w-full pl-8 pr-7 py-1.5 rounded-xl bg-white border border-[#E3D8CB] text-xs text-[#3D332A] placeholder:text-[#A39485] focus:outline-none focus:border-[#8FA892]"
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

        {/* Right: Unified Studio KPI Summary Strip */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="px-2.5 py-1 rounded-lg bg-white border border-[#E8DFD3] text-[#524538] font-semibold">
            มิติกลุ่ม:{' '}
            <strong className="font-mono text-[#3D332A]">
              {categoryGroups.length}
            </strong>
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-white border border-[#E8DFD3] text-[#524538] font-semibold">
            แท็กหลัก:{' '}
            <strong className="font-mono text-[#1B4369]">
              {mainCategoriesCount}
            </strong>
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-white border border-[#E8DFD3] text-[#524538] font-semibold">
            แท็กย่อย:{' '}
            <strong className="font-mono text-[#255431]">
              {subcategoriesCount}
            </strong>
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-[#EEF5EE] border border-[#BAD8BF] text-[#1C4824] font-bold">
            พร้อมผลิต:{' '}
            <strong className="font-mono">{totalProducibleEps} EP</strong>
          </span>
          {readySoloEpsCount > 0 && (
            <span className="px-2.5 py-1 rounded-lg bg-[#FEF8ED] border border-[#EDD7AF] text-[#734B17] font-bold">
              Solo EP พร้อม:{' '}
              <strong className="font-mono">{readySoloEpsCount}</strong>
            </span>
          )}
        </div>
      </div>

      {/* Instant Search Jump Strip */}
      <AnimatePresence initial={false}>
        {searchQuery.trim().length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            className="overflow-hidden"
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
                  const colorCfg = getPastelColorConfig(
                    item.parentTag?.color || item.tag.color
                  );
                  return (
                    <button
                      key={item.tag.id}
                      type="button"
                      onClick={() => {
                        if (item.resolvedGroupId && item.parentTag) {
                          onJumpToTag(item.resolvedGroupId, item.parentTag.id);
                        }
                        setSearchQuery('');
                      }}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-[#FAF7F2] hover:bg-[#EEF5EE] text-[#3D332A] border border-[#E2D5C4] transition-colors cursor-pointer"
                      title={`คลิกเพื่อเปิดในคอลัมน์ (${item.groupName})`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${colorCfg.swatchBg}`}
                      />
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
    </div>
  );
};

interface ThreeTierConceptBannerProps {
  isOpen: boolean;
}

export const ThreeTierConceptBanner: React.FC<ThreeTierConceptBannerProps> = ({
  isOpen,
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
          <div className="px-3.5 py-2.5 rounded-xl bg-[#FEF8ED] border border-[#EDD7AF] flex items-center gap-2.5 text-xs text-[#6E583C]">
            <Lightbulb className="w-4 h-4 text-[#A67438] shrink-0" />
            <span className="leading-relaxed">
              <strong className="font-bold text-[#4D3A24]">
                แนวคิดแท็กหลายมิติ:
              </strong>{' '}
              แต่ละกลุ่มแท็กทำหน้าที่เป็นมิติอิสระ (เช่น มิติตัวละคร,
              มิติมุก/แกล้ง, มิติสถานการณ์) ฟุตเทจ 1 คลิปสามารถเลือกแท็กได้หลายมิติพร้อมกัน
              พร้อมคำนวณจำนวนฟุตเทจพร้อมใช้และแจ้งเตือนเมื่อแท็กย่อยครบ 5 คลิปสำหรับทำ Solo EP ทันที
            </span>
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
          สตูดิโอยังไม่มีมิติกลุ่มแท็ก พร้อมสำหรับข้อมูลจริงของคุณแล้ว
        </h3>
        <p className="text-sm text-[#736859]">
          คุณสามารถเริ่มสร้างมิติแรก (เช่น &quot;คนมีชื่อเสียง / ดารา&quot;,
          &quot;ลีลามุก & แกล้ง&quot;, หรือ &quot;วิถีชีวิต & ไวรัล&quot;)
          เพื่อเริ่มติดแท็กคลิป หรือกดโหลดโครงสร้างตัวอย่างกลับมาใช้งาน
        </p>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenAddGroup}
          className="px-4 py-2.5 bg-[#78593A] hover:bg-[#62462A] text-white rounded-xl text-sm font-bold shadow-2xs flex items-center gap-1.5 cursor-pointer transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>สร้างมิติกลุ่มแท็กแรกของคุณ</span>
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
          มิติกลุ่มแท็ก สีป้ายพาสเทล และเกณฑ์สีพักฟุตจะอัปเดตแบบเรียลไทม์ทั่วทั้งระบบทันที
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
