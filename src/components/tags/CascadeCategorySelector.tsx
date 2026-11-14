import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Check,
  ChevronDown,
  Inbox,
  Plus,
  Search,
  Settings,
  Sparkles,
  Tags,
  X,
} from 'lucide-react';
import { useCMS } from '../../context/CMSContext';
import {
  STAGING_TAG_ID,
  isFootageInStaging,
  isStagingTagId,
} from '../../services/seedData';
import {
  CategoryTag,
  CategoryTier,
  DEFAULT_UNCLASSIFIED_SUBCATEGORY,
  EntitySubtype,
} from '../../types/tag.types';
import { TagPill, getEntityIcon } from '../ui/TagPill';
import { TIER_THEME_CONFIGS } from './three-tier/IndependentTierColumn';

interface CascadeCategorySelectorProps {
  selectedTagIds: string[];
  onChange: (newTagIds: string[]) => void;
  label?: string;
  helperText?: string;
  allowMultipleSubcategories?: boolean;
  hideHeaderAndTray?: boolean;
}

export const CascadeCategorySelector: React.FC<CascadeCategorySelectorProps> = ({
  selectedTagIds,
  onChange,
  label = 'ระบบติดป้ายแท็ก 3 ชั้นอิสระ (3-Tier Faceted Tagging)',
  helperText = 'เลือกผสมแท็กได้อย่างอิสระจากทั้ง 3 คอลัมน์ (Tier 1 หมวดกว้าง + Tier 2 บริบท/สไตล์ + Tier 3 บุคคล/รายการ)',
  hideHeaderAndTray = false,
}) => {
  const {
    tags,
    tagMap,
    tierSubCategories,
    createTag,
    setIsThreeTierManagerOpen,
  } = useCMS();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [mobileActiveTier, setMobileActiveTier] = useState<CategoryTier>(1);
  const [collapsedSubKeyMap, setCollapsedSubKeyMap] = useState<
    Record<string, boolean>
  >({});

  // Inline quick-add tag state per Tier
  const [addingInTier, setAddingInTier] = useState<CategoryTier | null>(null);
  const [newTagName, setNewTagName] = useState('');
  const [newTagSubCat, setNewTagSubCat] = useState('');

  const isCurrentlyInStaging = isFootageInStaging(selectedTagIds);

  const realSelectedTagIds = useMemo(
    () => selectedTagIds.filter((id) => Boolean(id) && !isStagingTagId(id)),
    [selectedTagIds]
  );

  const handleSelectStagingDefault = () => {
    onChange([STAGING_TAG_ID]);
  };

  const handleToggleTag = (tagId: string) => {
    if (isStagingTagId(tagId)) {
      handleSelectStagingDefault();
      return;
    }
    const baseWithoutStaging = selectedTagIds.filter(
      (id) => Boolean(id) && !isStagingTagId(id)
    );
    const exists = baseWithoutStaging.includes(tagId);
    const next = exists
      ? baseWithoutStaging.filter((id) => id !== tagId)
      : [...baseWithoutStaging, tagId];
    onChange(next.length > 0 ? next : [STAGING_TAG_ID]);
  };

  const handleRemoveSingleTag = (tagIdToRemove: string) => {
    const remaining = selectedTagIds.filter(
      (id) => id !== tagIdToRemove && !isStagingTagId(id)
    );
    onChange(remaining.length > 0 ? remaining : [STAGING_TAG_ID]);
  };

  const handleOpenQuickAdd = (tier: CategoryTier, defaultSubCat: string) => {
    setAddingInTier(tier);
    setNewTagName('');
    setNewTagSubCat(defaultSubCat);
  };

  const handleCreateQuickTag = (e: React.FormEvent, tier: CategoryTier) => {
    e.preventDefault();
    const clean = newTagName.trim().replace(/^#+/, '').trim();
    if (!clean) return;
    const theme = TIER_THEME_CONFIGS[tier];
    const groupType = tier === 3 ? 'PERSON' : tier === 2 ? 'ACTION' : 'THEME';
    const created = createTag(
      clean,
      groupType,
      theme.defaultColor,
      '',
      tier,
      null,
      theme.defaultEntity as EntitySubtype,
      `GRP-${groupType}`,
      newTagSubCat
    );

    const baseWithoutStaging = selectedTagIds.filter(
      (id) => Boolean(id) && !isStagingTagId(id)
    );
    if (!baseWithoutStaging.includes(created.id)) {
      onChange([...baseWithoutStaging, created.id]);
    }
    setAddingInTier(null);
    setNewTagName('');
  };

  const realTags = useMemo(
    () => tags.filter((t) => !isStagingTagId(t.id)),
    [tags]
  );

  const buildTierGroups = (tier: CategoryTier, subList: string[]) => {
    const q = searchQuery.trim().toLowerCase();
    const tierTags = realTags.filter((t) => {
      const tTier = t.tier === 2 || t.tier === 3 ? t.tier : 1;
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
      if (!map[sub]) {
        map[sub] = [];
      }
      map[sub].push(t);
    });

    const keys = Array.from(new Set([...subList, ...Object.keys(map)]));
    return keys
      .map((subCategory) => ({
        subCategory,
        tags: map[subCategory] || [],
      }))
      .filter((g) => !q || g.tags.length > 0);
  };

  const tier1Groups = useMemo(
    () => buildTierGroups(1, tierSubCategories.tier1),
    [realTags, tierSubCategories.tier1, searchQuery]
  );
  const tier2Groups = useMemo(
    () => buildTierGroups(2, tierSubCategories.tier2),
    [realTags, tierSubCategories.tier2, searchQuery]
  );
  const tier3Groups = useMemo(
    () => buildTierGroups(3, tierSubCategories.tier3),
    [realTags, tierSubCategories.tier3, searchQuery]
  );

  const renderTierColumn = (
    tier: CategoryTier,
    groups: { subCategory: string; tags: CategoryTag[] }[],
    subCategoryOptions: string[]
  ) => {
    const theme = TIER_THEME_CONFIGS[tier];
    const selectedInThisTier = realSelectedTagIds.filter((tid) => {
      const t = tagMap[tid];
      if (!t) return false;
      const tTier = t.tier === 2 || t.tier === 3 ? t.tier : 1;
      return tTier === tier;
    }).length;

    return (
      <div
        key={`picker-tier-${tier}`}
        className="flex flex-col rounded-2xl border border-[#E5DED4] bg-white overflow-hidden shadow-2xs"
      >
        {/* Tier Column Header */}
        <div
          className={`px-3 py-2 border-b ${theme.headerBorder} ${theme.headerBg} flex items-center justify-between gap-1.5`}
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-extrabold whitespace-nowrap shrink-0 ${theme.badgeBg} ${theme.badgeTextCls}`}
              >
                <span className="md:hidden">T{tier}</span>
                <span className="hidden md:inline">{theme.badgeText}</span>
              </span>
              <span className={`text-xs font-extrabold ${theme.accentText} truncate min-w-0`}>
                {theme.title}
              </span>
              {selectedInThisTier > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#EEF5EE] text-[#1C4824] border border-[#BAD8BF]">
                  เลือก {selectedInThisTier}
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              handleOpenQuickAdd(
                tier,
                subCategoryOptions[0] || DEFAULT_UNCLASSIFIED_SUBCATEGORY
              )
            }
            className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-white hover:bg-[#FAF7F2] text-[#3D332A] border border-[#D8C9B8] transition-colors cursor-pointer shrink-0"
          >
            <Plus className="w-3 h-3" />
            <span>สร้างแท็ก</span>
          </button>
        </div>

        {/* Quick Add Tag Form inside Tier */}
        <AnimatePresence initial={false}>
          {addingInTier === tier && (
            <motion.form
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              onSubmit={(e) => handleCreateQuickTag(e, tier)}
              className="overflow-hidden border-b border-[#E5DED4] bg-[#FAF8F5]"
            >
              <div className="p-2.5 space-y-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <input
                    type="text"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    placeholder={theme.examplesPlaceholder}
                    autoFocus
                    className="flex-1 min-w-[120px] px-2 py-1 rounded-lg bg-white border border-[#D8C5A6] text-xs text-[#3D332A] focus:outline-none"
                  />
                  <select
                    value={newTagSubCat}
                    onChange={(e) => setNewTagSubCat(e.target.value)}
                    className="px-2 py-1 rounded-lg bg-white border border-[#D8C5A6] text-[11px] font-semibold text-[#3D332A]"
                  >
                    {subCategoryOptions.map((sc) => (
                      <option key={sc} value={sc}>
                        หมวด: {sc}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center justify-end gap-1.5">
                  <button
                    type="button"
                    onClick={() => setAddingInTier(null)}
                    className="px-2 py-0.5 text-[11px] text-[#7D6E61] cursor-pointer"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={!newTagName.trim()}
                    className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold text-white disabled:opacity-50 ${theme.accentBtnBg} cursor-pointer`}
                  >
                    + บันทึก & ติดแท็กนี้
                  </button>
                </div>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Sub-category Sections */}
        <div className="p-2.5 space-y-2.5 max-h-72 overflow-y-auto scrollbar-thin bg-[#FAF8F5]">
          {groups.map(({ subCategory, tags: subTags }) => {
            const subKey = `${tier}__${subCategory}`;
            const isCollapsed = Boolean(collapsedSubKeyMap[subKey]);
            const isUnclassified =
              subCategory === DEFAULT_UNCLASSIFIED_SUBCATEGORY;

            return (
              <div
                key={subKey}
                className={`rounded-xl border overflow-hidden ${
                  isUnclassified
                    ? 'bg-[#FFFDF8] border-[#E8D2AE]'
                    : 'bg-white border-[#E5DED4]'
                }`}
              >
                <button
                  type="button"
                  onClick={() =>
                    setCollapsedSubKeyMap((prev) => ({
                      ...prev,
                      [subKey]: !prev[subKey],
                    }))
                  }
                  className={`w-full px-2.5 py-1.5 border-b flex items-center justify-between gap-1.5 text-left cursor-pointer ${
                    isUnclassified
                      ? 'bg-[#FEF6E6] border-[#E8D2AE]'
                      : `${theme.subHeaderBg} ${theme.subHeaderBorder}`
                  }`}
                >
                  <div className="flex items-center gap-1 min-w-0">
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-[#524538] transition-transform shrink-0 ${
                        isCollapsed ? '-rotate-90' : ''
                      }`}
                    />
                    <span className="text-[11px] font-extrabold text-[#3D332A] truncate">
                      {subCategory}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-white text-[#6E5F52] border border-black/10 tabular-nums shrink-0">
                    {subTags.length}
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
                          const isSelected = selectedTagIds.includes(tag.id);
                          return (
                            <button
                              key={tag.id}
                              type="button"
                              onClick={() => handleToggleTag(tag.id)}
                              className={`text-xs px-2.5 py-1 rounded-xl font-semibold inline-flex items-center gap-1 transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-[#D5EBDA] text-[#144220] font-bold border border-[#AED7B7] shadow-2xs ring-1 ring-[#C5E6CD]'
                                  : 'bg-[#FAF8F5] text-[#4A3F31] border border-[#DFD7CA] hover:bg-[#EDF6F0] hover:border-[#C5DFCC]'
                              }`}
                            >
                              {isSelected ? (
                                <Check className="w-3 h-3 text-[#1B572A] shrink-0" />
                              ) : (
                                <Plus className="w-3 h-3 text-[#88A891] shrink-0" />
                              )}
                              <span className="text-xs shrink-0">
                                {getEntityIcon(tag)}
                              </span>
                              <span>#{tag.name}</span>
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
    <div className="space-y-3 bg-[#FAF8F5] p-3 sm:p-4 rounded-2xl border border-[#E8E2D8] shadow-2xs">
      {!hideHeaderAndTray && (
        <>
          {/* Header bar with Studio Settings Link */}
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div>
              <label className="text-sm font-bold text-[#3D3429] flex items-center gap-1.5">
                <Tags className="w-4 h-4 text-[#7D5630] shrink-0" />
                {label}
              </label>
              {helperText && (
                <p className="text-xs text-[#706456] mt-0.5 leading-relaxed">
                  {helperText}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsThreeTierManagerOpen(true)}
              className="text-xs font-bold text-[#5C4426] hover:text-[#382613] bg-[#F2EBD9] hover:bg-[#EAE0CB] border border-[#DFD4BE] px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
              title="เปิดสตูดิโอจัดการระบบแท็ก 3 ชั้นและหมวดหมู่ย่อย"
            >
              <Settings className="w-3.5 h-3.5 text-[#7D5630]" />
              <span>สตูดิโอแท็ก 3 ชั้น</span>
            </button>
          </div>

          {/* Selected Tags Tray */}
          <div className="bg-white rounded-xl p-3 border border-[#E5DED4] shadow-2xs space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs font-bold text-[#3E3428] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#8C673B]" />
                  <span>ป้ายแท็กที่ติดกับคลิปนี้ ({realSelectedTagIds.length}):</span>
                </span>
              </div>

              {!isCurrentlyInStaging && (
                <button
                  type="button"
                  onClick={handleSelectStagingDefault}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1 bg-[#FBF7F0] hover:bg-[#F3EBD9] text-[#735123] border border-[#E3D7BF]"
                >
                  <Inbox className="w-3 h-3" />
                  <span>ย้ายไปพื้นที่พัก</span>
                </button>
              )}
            </div>

            {isCurrentlyInStaging ? (
              <div className="flex items-center gap-2 p-2 bg-[#FEF9F0] border border-[#F2E1C4] rounded-lg text-xs text-[#7E5522]">
                <Inbox className="w-4 h-4 text-[#A67438] shrink-0" />
                <span className="font-medium">
                  ยังไม่ได้ติดแท็กจริง — คลิกเลือกป้ายแท็กด้านล่างได้เลย
                </span>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                {realSelectedTagIds.map((tid) => {
                  const tag = tagMap[tid];
                  if (!tag) return null;
                  return (
                    <TagPill
                      key={tag.id}
                      tag={tag}
                      showEntityIcon={true}
                      onRemove={() => handleRemoveSingleTag(tag.id)}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* Fast Search Bar across all 3 Tiers (+ Studio link when header is hidden) */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 min-w-0">
          <Search className="w-4 h-4 text-[#9C9183] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาแท็กด่วนข้ามทั้ง 3 ชั้น..."
            className="w-full pl-9 pr-8 py-1.5 sm:py-2 text-xs sm:text-sm bg-white border border-[#DFD7CA] rounded-xl placeholder:text-[#9E9487] text-[#3A3125] focus:outline-hidden focus:ring-2 focus:ring-[#D5C2A5] focus:border-[#C2AE8F] transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9E9487] hover:text-[#524637] p-0.5 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {hideHeaderAndTray && (
          <button
            type="button"
            onClick={() => setIsThreeTierManagerOpen(true)}
            className="text-xs font-bold text-[#5C4426] hover:text-[#382613] bg-[#F2EBD9] hover:bg-[#EAE0CB] border border-[#DFD4BE] px-2.5 py-1.5 sm:py-2 rounded-xl transition-colors flex items-center gap-1 cursor-pointer shrink-0"
            title="เปิดสตูดิโอจัดการระบบแท็ก 3 ชั้น"
          >
            <Settings className="w-3.5 h-3.5 text-[#7D5630]" />
            <span className="hidden sm:inline">สตูดิโอแท็ก 3 ชั้น</span>
            <span className="sm:hidden">สตูดิโอ</span>
          </button>
        )}
      </div>

      {/* Mobile Tier Switcher (< lg) */}
      <div className="grid grid-cols-3 gap-1.5 lg:hidden bg-[#EFECE6] p-1 rounded-xl border border-[#DFD7CA]">
        {([1, 2, 3] as CategoryTier[]).map((t) => {
          const isActive = mobileActiveTier === t;
          const tConfig = TIER_THEME_CONFIGS[t];
          const selectedCount = realSelectedTagIds.filter((tid) => {
            const tag = tagMap[tid];
            if (!tag) return false;
            const tagTier = tag.tier === 2 || tag.tier === 3 ? tag.tier : 1;
            return tagTier === t;
          }).length;

          return (
            <button
              key={`mob-picker-tab-${t}`}
              type="button"
              onClick={() => setMobileActiveTier(t)}
              className={`py-1.5 px-2 rounded-lg text-xs font-extrabold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                isActive
                  ? `${tConfig.badgeBg} ${tConfig.badgeTextCls} shadow-xs`
                  : 'text-[#6A5D4F] hover:text-[#3D332A]'
              }`}
            >
              <span>TIER {t}</span>
              {selectedCount > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    isActive
                      ? 'bg-white/25 text-white'
                      : 'bg-[#D5EBDA] text-[#144220]'
                  }`}
                >
                  {selectedCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Mobile: Active Single Tier Column */}
      <div className="lg:hidden">
        {mobileActiveTier === 1 &&
          renderTierColumn(1, tier1Groups, tierSubCategories.tier1)}
        {mobileActiveTier === 2 &&
          renderTierColumn(2, tier2Groups, tierSubCategories.tier2)}
        {mobileActiveTier === 3 &&
          renderTierColumn(3, tier3Groups, tierSubCategories.tier3)}
      </div>

      {/* Desktop: 3-Column Parallel Faceted Picker (Tier 1 | Tier 2 | Tier 3) */}
      <div className="hidden lg:grid lg:grid-cols-3 gap-3">
        {renderTierColumn(1, tier1Groups, tierSubCategories.tier1)}
        {renderTierColumn(2, tier2Groups, tierSubCategories.tier2)}
        {renderTierColumn(3, tier3Groups, tierSubCategories.tier3)}
      </div>
    </div>
  );
};
