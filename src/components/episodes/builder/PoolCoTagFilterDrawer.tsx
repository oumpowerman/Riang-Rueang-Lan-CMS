import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  Check,
  ChevronDown,
  Filter,
  Layers,
  RotateCcw,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { CategoryTag } from '../../../types/tag.types';
import { TIER_THEME_CONFIGS } from '../../tags/three-tier/IndependentTierColumn';
import { BuilderScopeMatchMode, PoolCoTagChip } from './builder.types';

interface PoolCoTagFilterDrawerProps {
  poolCoTagChips: PoolCoTagChip[];
  selectedCoTagIds: string[];
  coTagMatchMode: BuilderScopeMatchMode;
  coTagAllCount: number;
  tagMap: Record<string, CategoryTag>;
  onToggleCoTag: (tagId: string) => void;
  onClearCoTags: () => void;
  onChangeCoTagMatchMode: (mode: BuilderScopeMatchMode) => void;
}

const SMOOTH_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export const PoolCoTagFilterDrawer: React.FC<PoolCoTagFilterDrawerProps> = ({
  poolCoTagChips,
  selectedCoTagIds,
  coTagMatchMode,
  coTagAllCount,
  tagMap,
  onToggleCoTag,
  onClearCoTags,
  onChangeCoTagMatchMode,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const [isExpanded, setIsExpanded] = useState(false);
  const [tagSearch, setTagSearch] = useState('');

  const selectedSet = useMemo(
    () => new Set(selectedCoTagIds),
    [selectedCoTagIds]
  );

  const { tier2All, tier3All } = useMemo(() => {
    const t2: PoolCoTagChip[] = [];
    const t3: PoolCoTagChip[] = [];
    for (const chip of poolCoTagChips) {
      if (chip.tag.tier === 2) t2.push(chip);
      else if (chip.tag.tier === 3) t3.push(chip);
    }
    return { tier2All: t2, tier3All: t3 };
  }, [poolCoTagChips]);

  const { filteredTier2, filteredTier3 } = useMemo(() => {
    const q = tagSearch.trim().toLowerCase();
    if (!q) {
      return { filteredTier2: tier2All, filteredTier3: tier3All };
    }
    const matchesQuery = (chip: PoolCoTagChip) =>
      chip.tag.name.toLowerCase().includes(q) ||
      (chip.tag.subCategory || '').toLowerCase().includes(q);
    return {
      filteredTier2: tier2All.filter(matchesQuery),
      filteredTier3: tier3All.filter(matchesQuery),
    };
  }, [tier2All, tier3All, tagSearch]);

  if (tier2All.length === 0 && tier3All.length === 0 && selectedCoTagIds.length === 0) {
    return null;
  }

  const tier2Theme = TIER_THEME_CONFIGS[2];
  const tier3Theme = TIER_THEME_CONFIGS[3];
  const hasSelection = selectedCoTagIds.length > 0;

  return (
    <div className="pt-2 border-t border-[#eee6da]">
      {/* Collapsed 1-Row Compact Bar (keeps candidate footage cards visible above the fold) */}
      <div
        className={`rounded-xl border transition-colors ${
          isExpanded || hasSelection
            ? 'bg-[#faf7f2] border-[#dfd4c4]'
            : 'bg-[#faf8f4] border-[#ece4d8] hover:border-[#d8cbb9]'
        }`}
      >
        <div className="px-2.5 py-2 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5 min-w-0 flex-1">
            <button
              type="button"
              onClick={() => setIsExpanded((prev) => !prev)}
              className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#3d332a] hover:text-[#244b2f] cursor-pointer whitespace-nowrap shrink-0"
              aria-expanded={isExpanded}
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#3b6845] shrink-0" />
              <span>กรองแท็กร่วม (Tier 2/3)</span>
            </button>

            {!hasSelection ? (
              <span className="text-[11px] text-[#7c7267] font-mono tabular-nums whitespace-nowrap">
                · T2 {tier2All.length} · T3 {tier3All.length}
              </span>
            ) : (
              <div className="flex flex-wrap items-center gap-1 min-w-0">
                {selectedCoTagIds.map((tid, idx) => {
                  const tag = tagMap[tid];
                  if (!tag) return null;
                  const isT2 = tag.tier === 2;
                  return (
                    <React.Fragment key={tid}>
                      {idx > 0 && (
                        <span className="text-[10px] font-mono font-bold text-[#8a5a22] px-0.5">
                          {coTagMatchMode === 'AND' ? '+' : 'หรือ'}
                        </span>
                      )}
                      <span
                        className={`inline-flex items-center gap-1 pl-1.5 pr-1 py-0.5 rounded-lg text-[11px] font-bold border whitespace-nowrap ${
                          isT2
                            ? 'bg-[#fef6e8] text-[#6b4415] border-[#e8cfa6]'
                            : 'bg-[#edf4ed] text-[#244b2f] border-[#bad8b9]'
                        }`}
                      >
                        <span className="text-[9px] font-mono opacity-80">
                          T{isT2 ? 2 : 3}
                        </span>
                        <span>{tag.name}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleCoTag(tid);
                          }}
                          className="p-0.5 rounded hover:bg-black/10 cursor-pointer"
                          title={`นำแท็ก ${tag.name} ออก`}
                          aria-label={`นำแท็ก ${tag.name} ออก`}
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </span>
                    </React.Fragment>
                  );
                })}

                <button
                  type="button"
                  onClick={onClearCoTags}
                  className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-lg text-[10px] font-bold text-[#8e4537] bg-[#fdf3ec] hover:bg-[#fae6de] border border-[#f5d7cf] cursor-pointer whitespace-nowrap shrink-0"
                  title="ล้างแท็กร่วมทั้งหมด"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                  <span>ล้าง</span>
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              isExpanded
                ? 'bg-[#3b6845] text-white border-[#3b6845]'
                : 'bg-white text-[#4d4740] border-[#ded3c5] hover:border-[#bad8b9] hover:text-[#244b2f]'
            }`}
          >
            <span>
              {isExpanded
                ? 'พับเก็บ'
                : hasSelection
                ? `ปรับเพิ่ม (${selectedCoTagIds.length})`
                : 'เลือกแท็กร่วม'}
            </span>
            <motion.span
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
              className="inline-flex"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </motion.span>
          </button>
        </div>

        {/* Expanded 2-Section Drawer (Tier 2 | Tier 3) with Search + AND/OR Match Mode */}
        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              key="pool-cotag-drawer-body"
              initial={
                prefersReducedMotion ? { opacity: 0 } : { height: 0, opacity: 0 }
              }
              animate={
                prefersReducedMotion
                  ? { opacity: 1 }
                  : { height: 'auto', opacity: 1 }
              }
              exit={
                prefersReducedMotion ? { opacity: 0 } : { height: 0, opacity: 0 }
              }
              transition={{
                duration: prefersReducedMotion ? 0.08 : 0.22,
                ease: SMOOTH_EASE,
              }}
              className="overflow-hidden"
            >
              <div className="px-2.5 pb-2.5 pt-2 border-t border-[#e8dfd3] space-y-2.5">
                {/* Drawer Top Toolbar: Tag Search + AND/OR Mode Toggle + Reset */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="relative flex-1 min-w-[180px]">
                    <Search className="w-3.5 h-3.5 text-[#8c7b6c] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={tagSearch}
                      onChange={(e) => setTagSearch(e.target.value)}
                      placeholder="ค้นหาแท็ก Tier 2 / Tier 3..."
                      className="w-full pl-8 pr-7 py-1.5 rounded-lg bg-white border border-[#ded3c5] text-xs text-[#2d2926] placeholder:text-[#9a9186] focus:outline-none focus:border-[#3b6845]"
                    />
                    {tagSearch && (
                      <button
                        type="button"
                        onClick={() => setTagSearch('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8c7b6c] hover:text-[#2d2926] cursor-pointer"
                        aria-label="ล้างคำค้นหาแท็ก"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                    <div className="inline-flex items-center gap-0.5 p-0.5 rounded-lg bg-white border border-[#ded3c5]">
                      <button
                        type="button"
                        onClick={() => onChangeCoTagMatchMode('AND')}
                        className={`px-2 py-1 rounded-md text-[11px] font-bold inline-flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap ${
                          coTagMatchMode === 'AND'
                            ? 'bg-[#3b6845] text-white shadow-2xs'
                            : 'text-[#554d44] hover:bg-[#faf7f2]'
                        }`}
                        title="เจาะเฉพาะคลิปที่มีครบทุกแท็กร่วมที่เลือก (เช่น Tier 2 + Tier 3)"
                      >
                        <Filter className="w-3 h-3" />
                        <span>ครบทุกแท็ก (AND)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onChangeCoTagMatchMode('OR')}
                        className={`px-2 py-1 rounded-md text-[11px] font-bold inline-flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap ${
                          coTagMatchMode === 'OR'
                            ? 'bg-[#8a5a22] text-white shadow-2xs'
                            : 'text-[#554d44] hover:bg-[#faf7f2]'
                        }`}
                        title="รวมคลิปที่มีแท็กร่วมตัวใดตัวหนึ่งที่เลือก"
                      >
                        <Layers className="w-3 h-3" />
                        <span>บางแท็ก (OR)</span>
                      </button>
                    </div>

                    {hasSelection && (
                      <button
                        type="button"
                        onClick={onClearCoTags}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold text-[#8e4537] bg-[#fdf3ec] hover:bg-[#fae6de] border border-[#f5d7cf] cursor-pointer whitespace-nowrap shrink-0"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>ดูทั้งหมด ({coTagAllCount})</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* 2-Section Split: Tier 2 Box (Left) | Tier 3 Box (Right) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {/* Section 1: TIER 2 */}
                  <div className="rounded-xl border border-[#e6d5b8] bg-white overflow-hidden flex flex-col">
                    <div
                      className={`px-2.5 py-1.5 border-b ${tier2Theme.headerBorder} ${tier2Theme.headerBg} flex items-center justify-between gap-2`}
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-extrabold whitespace-nowrap shrink-0 ${tier2Theme.badgeBg} ${tier2Theme.badgeTextCls}`}
                        >
                          {tier2Theme.badgeText}
                        </span>
                        <span
                          className={`text-[11px] font-extrabold truncate ${tier2Theme.accentText}`}
                        >
                          {tier2Theme.title}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono font-bold tabular-nums px-1.5 py-0.5 rounded bg-white/90 text-[#6b4415] border border-black/5 shrink-0">
                        {filteredTier2.length}
                      </span>
                    </div>

                    <div className="p-2 max-h-44 overflow-y-auto scrollbar-thin">
                      {filteredTier2.length === 0 ? (
                        <p className="text-[11px] text-[#8c7b6c] text-center py-4">
                          {tagSearch
                            ? 'ไม่พบแท็ก Tier 2 ตามคำค้นหา'
                            : 'ไม่มีแท็ก Tier 2 ร่วมในกรอบนี้'}
                        </p>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {filteredTier2.map((chip) => {
                            const isSelected = selectedSet.has(chip.tag.id);
                            return (
                              <button
                                key={chip.tag.id}
                                type="button"
                                onClick={() => onToggleCoTag(chip.tag.id)}
                                title={`#${chip.tag.name} — ตรงตัวกรองนี้ ${chip.count} คลิป (พร้อมใช้ ${chip.usableInPool} / ทั้งหมด ${chip.totalInPool} ในกรอบนี้)`}
                                className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer border whitespace-nowrap ${
                                  isSelected
                                    ? 'bg-[#fef6e8] text-[#6b4415] border-[#c99749] ring-1 ring-[#e8cfa6]'
                                    : 'bg-[#faf8f5] text-[#4d4740] border-[#e5ded4] hover:bg-[#fef6e8]/70 hover:border-[#dfc192]'
                                }`}
                              >
                                {isSelected && (
                                  <Check className="w-3 h-3 text-[#8a5a22] shrink-0" />
                                )}
                                <span>{chip.tag.name}</span>
                                <span className="text-[10px] font-mono tabular-nums opacity-75">
                                  ({chip.count})
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Section 2: TIER 3 */}
                  <div className="rounded-xl border border-[#d4e2d3] bg-white overflow-hidden flex flex-col">
                    <div
                      className={`px-2.5 py-1.5 border-b ${tier3Theme.headerBorder} ${tier3Theme.headerBg} flex items-center justify-between gap-2`}
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-extrabold whitespace-nowrap shrink-0 ${tier3Theme.badgeBg} ${tier3Theme.badgeTextCls}`}
                        >
                          {tier3Theme.badgeText}
                        </span>
                        <span
                          className={`text-[11px] font-extrabold truncate ${tier3Theme.accentText}`}
                        >
                          {tier3Theme.title}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono font-bold tabular-nums px-1.5 py-0.5 rounded bg-white/90 text-[#244b2f] border border-black/5 shrink-0">
                        {filteredTier3.length}
                      </span>
                    </div>

                    <div className="p-2 max-h-44 overflow-y-auto scrollbar-thin">
                      {filteredTier3.length === 0 ? (
                        <p className="text-[11px] text-[#8c7b6c] text-center py-4">
                          {tagSearch
                            ? 'ไม่พบแท็ก Tier 3 ตามคำค้นหา'
                            : 'ไม่มีแท็ก Tier 3 ร่วมในกรอบนี้'}
                        </p>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {filteredTier3.map((chip) => {
                            const isSelected = selectedSet.has(chip.tag.id);
                            return (
                              <button
                                key={chip.tag.id}
                                type="button"
                                onClick={() => onToggleCoTag(chip.tag.id)}
                                title={`#${chip.tag.name} — ตรงตัวกรองนี้ ${chip.count} คลิป (พร้อมใช้ ${chip.usableInPool} / ทั้งหมด ${chip.totalInPool} ในกรอบนี้)`}
                                className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer border whitespace-nowrap ${
                                  isSelected
                                    ? 'bg-[#edf4ed] text-[#1e4628] border-[#3b6845] ring-1 ring-[#a4c5a1]'
                                    : 'bg-[#faf8f5] text-[#4d4740] border-[#e5ded4] hover:bg-[#edf4ed]/70 hover:border-[#bad8b9]'
                                }`}
                              >
                                {isSelected && (
                                  <Check className="w-3 h-3 text-[#3b6845] shrink-0" />
                                )}
                                <span>{chip.tag.name}</span>
                                <span className="text-[10px] font-mono tabular-nums opacity-75">
                                  ({chip.count})
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
