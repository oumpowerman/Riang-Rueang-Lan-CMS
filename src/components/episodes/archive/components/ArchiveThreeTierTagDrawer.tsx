import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Check,
  ChevronDown,
  ChevronsDownUp,
  ChevronsUpDown,
  Filter,
  Layers,
  RotateCcw,
  Search,
  Sparkles,
  Tag,
  X,
} from 'lucide-react';
import { useCMS } from '../../../../context/CMSContext';
import { isStagingTagId } from '../../../../services/seedData';
import {
  CategoryTag,
  CategoryTier,
  DEFAULT_TIER_SUBCATEGORIES,
  DEFAULT_UNCLASSIFIED_SUBCATEGORY,
} from '../../../../types/tag.types';
import { TIER_THEME_CONFIGS } from '../../../tags/three-tier/IndependentTierColumn';
import { TagPill, getEntityIcon } from '../../../ui/TagPill';

interface ArchiveThreeTierTagDrawerProps {
  selectedFootageTagIds: string[];
  onToggleFootageTag: (tagId: string) => void;
  onClearFootageTags: () => void;
  footageTagMatchMode: 'AND' | 'OR';
  onChangeFootageTagMatchMode: (mode: 'AND' | 'OR') => void;
  tagEpisodeCounts: Record<string, number>;
  matchedEpisodesCount: number;
}

export const ArchiveThreeTierTagDrawer: React.FC<
  ArchiveThreeTierTagDrawerProps
> = ({
  selectedFootageTagIds,
  onToggleFootageTag,
  onClearFootageTags,
  footageTagMatchMode,
  onChangeFootageTagMatchMode,
  tagEpisodeCounts,
  matchedEpisodesCount,
}) => {
  const { tags, tagMap, settings } = useCMS();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [tagSearch, setTagSearch] = useState('');
  const [expandedSubKeys, setExpandedSubKeys] = useState<
    Record<string, boolean>
  >({});

  const tierSubCategories =
    settings.tierSubCategories || DEFAULT_TIER_SUBCATEGORIES;

  const realTags = useMemo(
    () => tags.filter((t) => !isStagingTagId(t.id)),
    [tags]
  );

  const buildTierGroups = (tier: CategoryTier, subList: string[]) => {
    const q = tagSearch.trim().toLowerCase();
    const tierTags = realTags.filter((t) => {
      const tTier: CategoryTier = t.tier === 2 || t.tier === 3 ? t.tier : 1;
      if (tTier !== tier) return false;
      if (!q) return true;
      return (
        t.name.toLowerCase().includes(q) ||
        (t.subCategory || '').toLowerCase().includes(q)
      );
    });

    const map: Record<string, CategoryTag[]> = {};
    subList.forEach((sc) => {
      map[sc] = [];
    });

    tierTags.forEach((t) => {
      const sub = (t.subCategory || DEFAULT_UNCLASSIFIED_SUBCATEGORY).trim();
      if (!map[sub]) map[sub] = [];
      map[sub].push(t);
    });

    const keys = Array.from(new Set([...subList, ...Object.keys(map)]));
    return keys
      .map((subCategory) => ({
        subCategory,
        tags: (map[subCategory] || []).sort((a, b) => {
          const epA = tagEpisodeCounts[a.id] || 0;
          const epB = tagEpisodeCounts[b.id] || 0;
          if (epB !== epA) return epB - epA;
          return a.name.localeCompare(b.name, 'th');
        }),
      }))
      .filter((g) => !q || g.tags.length > 0);
  };

  const tier1Groups = useMemo(
    () => buildTierGroups(1, tierSubCategories.tier1),
    [realTags, tierSubCategories.tier1, tagSearch, tagEpisodeCounts]
  );
  const tier2Groups = useMemo(
    () => buildTierGroups(2, tierSubCategories.tier2),
    [realTags, tierSubCategories.tier2, tagSearch, tagEpisodeCounts]
  );
  const tier3Groups = useMemo(
    () => buildTierGroups(3, tierSubCategories.tier3),
    [realTags, tierSubCategories.tier3, tagSearch, tagEpisodeCounts]
  );

  const allSubKeys = useMemo(() => {
    const keys: string[] = [];
    tier1Groups.forEach((g) => keys.push(`1__${g.subCategory}`));
    tier2Groups.forEach((g) => keys.push(`2__${g.subCategory}`));
    tier3Groups.forEach((g) => keys.push(`3__${g.subCategory}`));
    return keys;
  }, [tier1Groups, tier2Groups, tier3Groups]);

  const handleExpandAll = () => {
    const next: Record<string, boolean> = {};
    allSubKeys.forEach((k) => {
      next[k] = true;
    });
    setExpandedSubKeys(next);
  };

  const handleCollapseAll = () => {
    setExpandedSubKeys({});
  };

  const renderTierColumn = (
    tier: CategoryTier,
    groups: { subCategory: string; tags: CategoryTag[] }[]
  ) => {
    const theme = TIER_THEME_CONFIGS[tier];
    const totalInTier = groups.reduce((acc, g) => acc + g.tags.length, 0);

    return (
      <div
        key={`archive-tag-tier-${tier}`}
        className="flex flex-col rounded-2xl border border-[#E5DED4] bg-white overflow-hidden shadow-2xs"
      >
        <div
          className={`px-3 py-2 border-b ${theme.headerBorder} ${theme.headerBg} flex items-center justify-between gap-1.5 sm:gap-2`}
        >
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-extrabold whitespace-nowrap shrink-0 ${theme.badgeBg} ${theme.badgeTextCls}`}
            >
              <span className="md:hidden">T{tier}</span>
              <span className="hidden md:inline">{theme.badgeText}</span>
            </span>
            <span
              className={`text-xs font-extrabold ${theme.accentText} truncate min-w-0`}
            >
              {theme.title}
            </span>
          </div>
          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-white/90 text-[#524538] border border-black/5 tabular-nums shrink-0">
            {totalInTier} แท็ก
          </span>
        </div>

        <div className="p-2.5 space-y-2 max-h-72 overflow-y-auto scrollbar-thin bg-[#FAF8F5]">
          {groups.map(({ subCategory, tags: subTags }) => {
            const subKey = `${tier}__${subCategory}`;
            const isSearching = tagSearch.trim().length > 0;
            const isCollapsed = !isSearching && !Boolean(expandedSubKeys[subKey]);
            const selectedInSub = subTags.filter((t) =>
              selectedFootageTagIds.includes(t.id)
            ).length;

            return (
              <div
                key={subKey}
                className="rounded-xl border border-[#E5DED4] bg-white overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() =>
                    setExpandedSubKeys((prev) => ({
                      ...prev,
                      [subKey]: !prev[subKey],
                    }))
                  }
                  className={`w-full px-2.5 py-1.5 border-b flex items-center justify-between gap-1.5 text-left cursor-pointer ${
                    isCollapsed ? 'border-b-transparent' : ''
                  } ${theme.subHeaderBg} ${theme.subHeaderBorder}`}
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-[#524538] transition-transform shrink-0 ${
                        isCollapsed ? '-rotate-90' : ''
                      }`}
                    />
                    <span className="text-[11px] font-extrabold text-[#3D332A] truncate">
                      หมวด: {subCategory}
                    </span>
                    {selectedInSub > 0 && (
                      <span className="px-1.5 py-0.2 rounded bg-[#3B6845] text-white text-[9px] font-extrabold shrink-0">
                        เลือก {selectedInSub}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-white text-[#6E5F52] border border-black/10 tabular-nums shrink-0">
                    {isCollapsed ? `กางดู (${subTags.length})` : subTags.length}
                  </span>
                </button>

                {!isCollapsed && (
                  <div className="p-2">
                    {subTags.length === 0 ? (
                      <p className="text-[11px] text-[#8C7B6C] italic text-center py-1">
                        ยังไม่มีแท็กในหมวดนี้
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {subTags.map((tag) => {
                          const isSelected = selectedFootageTagIds.includes(
                            tag.id
                          );
                          const epCount = tagEpisodeCounts[tag.id] || 0;
                          return (
                            <button
                              key={tag.id}
                              type="button"
                              onClick={() => onToggleFootageTag(tag.id)}
                              className={`text-xs px-2.5 py-1 rounded-xl font-semibold inline-flex items-center gap-1 transition-all cursor-pointer border ${
                                isSelected
                                  ? 'bg-[#D5EBDA] text-[#144220] font-bold border-[#AED7B7] shadow-2xs ring-1 ring-[#C5E6CD]'
                                  : epCount > 0
                                  ? 'bg-[#FAF8F5] text-[#3D332A] border-[#DFD7CA] hover:bg-[#EDF6F0] hover:border-[#C5DFCC]'
                                  : 'bg-[#FAF8F5]/60 text-[#9C9286] border-[#EAE2D6] hover:bg-white'
                              }`}
                              title={`#${tag.name} — ปรากฏในคลิปหลัก ${epCount} ตอน`}
                            >
                              {isSelected && (
                                <Check className="w-3 h-3 text-[#1B572A] shrink-0" />
                              )}
                              <span className="text-xs shrink-0">
                                {getEntityIcon(tag)}
                              </span>
                              <span>#{tag.name}</span>
                              <span
                                className={`text-[10px] font-mono px-1 rounded tabular-nums ${
                                  isSelected
                                    ? 'bg-[#BFE0C8] text-[#144220] font-bold'
                                    : epCount > 0
                                    ? 'bg-[#EAF5ED] text-[#245233] font-bold'
                                    : 'bg-[#EFECE6] text-[#9C9286]'
                                }`}
                              >
                                {epCount} EP
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-[#FDFBF7] border border-[#E8DFD3] rounded-2xl shadow-2xs overflow-hidden">
      {/* Drawer Header */}
      <div
        onClick={() => setIsDrawerOpen((prev) => !prev)}
        className="px-3.5 sm:px-4 py-2.5 sm:py-3 bg-[#FAF7F2] hover:bg-[#F3ECE0] transition-colors cursor-pointer flex items-center justify-between gap-2"
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-[#E6F2E6] text-[#224A2D] border border-[#B5D6B3] flex items-center justify-center shrink-0">
            <Tag className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0 truncate">
            <span className="text-xs sm:text-sm font-extrabold text-[#2D2926]">
              <span className="sm:hidden">กรองด้วยแท็กฟุตเทจ 3 ชั้น</span>
              <span className="hidden sm:inline">
                ค้นหาคลิปหลักจากแท็กฟุตเทจย่อย 3 ชั้น (Filter by Footage Tags)
              </span>
            </span>
            <span className="hidden lg:inline text-xs text-[#786B5C] ml-2">
              เช็กว่าคลิป Master ตอนไหนมีฟุตเทจที่ติดแท็ก Tier 1 / Tier 2 / Tier 3 ที่ต้องการ
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {selectedFootageTagIds.length > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClearFootageTags();
              }}
              className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-1 text-xs font-bold text-[#8E3B3B] bg-[#FDF2F2] border border-[#F5D0D0] rounded-lg hover:bg-[#F9E2E2] cursor-pointer transition-colors whitespace-nowrap"
            >
              <RotateCcw className="w-3 h-3" />
              <span>ล้าง ({selectedFootageTagIds.length})</span>
            </button>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsDrawerOpen((prev) => !prev);
            }}
            className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1 rounded-xl text-xs font-bold text-[#4D4740] bg-white border border-[#E2D8C9] hover:bg-[#FAF6F0] transition-colors cursor-pointer whitespace-nowrap"
          >
            <span className="sm:hidden">
              {isDrawerOpen ? 'ซ่อนแท็ก' : 'เลือกแท็ก'}
            </span>
            <span className="hidden sm:inline">
              {isDrawerOpen ? 'ซ่อนถาดแท็ก' : 'เปิดเลือกแท็ก 3 ชั้น'}
            </span>
            <motion.span
              animate={{ rotate: isDrawerOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="inline-flex"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </motion.span>
          </button>
        </div>
      </div>

      {/* Active Selected Footage Tags Strip */}
      {selectedFootageTagIds.length > 0 && (
        <div className="px-3.5 sm:px-4 py-2.5 bg-[#EEF6F0] border-t border-[#CBE3CF] flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-extrabold text-[#1F4828] flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-[#2D623C]" />
              <span>แท็กที่เลือก ({selectedFootageTagIds.length}):</span>
            </span>

            {selectedFootageTagIds.map((tid, idx) => {
              const t = tagMap[tid];
              if (!t) return null;
              return (
                <React.Fragment key={tid}>
                  {idx > 0 && (
                    <span className="text-[11px] font-mono font-extrabold text-[#2D623C] px-0.5">
                      {footageTagMatchMode === 'AND' ? '+' : 'หรือ'}
                    </span>
                  )}
                  <TagPill
                    tag={t}
                    showEntityIcon={true}
                    onRemove={() => onToggleFootageTag(tid)}
                  />
                </React.Fragment>
              );
            })}
          </div>

          <span className="text-xs font-mono font-bold text-[#1F4828] tabular-nums">
            พบ {matchedEpisodesCount} ตอน
          </span>
        </div>
      )}

      {/* Expandable 3-Tier Tag Columns Body */}
      <AnimatePresence initial={false}>
        {isDrawerOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t border-[#E5DED4] p-3.5 space-y-3 bg-[#FAF8F5]">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="relative flex-1 min-w-[200px] max-w-md">
                  <Search className="w-3.5 h-3.5 text-[#8C7B6C] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={tagSearch}
                    onChange={(e) => setTagSearch(e.target.value)}
                    placeholder="ค้นหาแท็กฟุตเทจ 3 ชั้น..."
                    className="w-full pl-8 pr-7 py-1.5 rounded-xl bg-white border border-[#DED3C5] text-xs text-[#3D332A] placeholder:text-[#A39485] focus:outline-none focus:border-[#3B6845]"
                  />
                  {tagSearch && (
                    <button
                      type="button"
                      onClick={() => setTagSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8C7B6C] hover:text-[#3D332A] cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {/* AND / OR Match Mode inside expanded drawer */}
                  <div className="inline-flex items-center gap-1 p-0.5 rounded-xl bg-white border border-[#DED3C5]">
                    <button
                      type="button"
                      onClick={() => onChangeFootageTagMatchMode('AND')}
                      className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1 whitespace-nowrap ${
                        footageTagMatchMode === 'AND'
                          ? 'bg-[#3B6845] text-white shadow-2xs'
                          : 'text-[#524538] hover:bg-[#FAF7F2]'
                      }`}
                    >
                      <Filter className="w-3 h-3" />
                      <span>ครบทุกแท็ก (AND)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onChangeFootageTagMatchMode('OR')}
                      className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1 whitespace-nowrap ${
                        footageTagMatchMode === 'OR'
                          ? 'bg-[#8A5A22] text-white shadow-2xs'
                          : 'text-[#524538] hover:bg-[#FAF7F2]'
                      }`}
                    >
                      <Layers className="w-3 h-3" />
                      <span>บางแท็ก (OR)</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleExpandAll}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold bg-white hover:bg-[#EDF4ED] text-[#244B2F] border border-[#CFDECE] transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <ChevronsUpDown className="w-3.5 h-3.5 text-[#3B6845]" />
                    <span>กางทั้งหมด</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCollapseAll}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold bg-white hover:bg-[#F4EEE4] text-[#524538] border border-[#DFD7CA] transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <ChevronsDownUp className="w-3.5 h-3.5 text-[#786B5C]" />
                    <span>พับทั้งหมด</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                {renderTierColumn(1, tier1Groups)}
                {renderTierColumn(2, tier2Groups)}
                {renderTierColumn(3, tier3Groups)}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
