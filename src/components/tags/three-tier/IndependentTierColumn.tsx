import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FolderPlus,
  Info,
  Maximize2,
  Minimize2,
  Search,
  X,
} from 'lucide-react';
import { CategoryMatrixStat } from '../../../context/CMSContext';
import { BatchTagMoveDestination } from '../../../context/cms/cms.types';
import { isStagingTagId } from '../../../services/seedData';
import {
  CategoryTag,
  CategoryTier,
  DEFAULT_UNCLASSIFIED_SUBCATEGORY,
  EntitySubtype,
} from '../../../types/tag.types';
import {
  findDuplicateTagConflict,
  matchesTagSearchQuery,
  TagDuplicateConflict,
} from '../../../utils/tagDeduplicator';
import {
  TIER_THEME_CONFIGS,
  type TierThemeConfig,
} from '../constants/tierThemeConfigs';
import { TierCompactRailView } from './TierCompactRailView';
import { TierInlineTagForm } from './TierInlineTagForm';
import { TierSubCategorySection } from './TierSubCategorySection';

export { TIER_THEME_CONFIGS, type TierThemeConfig };

export interface IndependentTierColumnProps {
  tier: CategoryTier;
  subCategories: string[];
  tagsInTier: CategoryTag[];
  allTags: CategoryTag[];
  categoryMatrix: CategoryMatrixStat[];
  globalSearchQuery?: string;
  searchQuery: string;
  onSearchQueryChange: (q: string) => void;
  onClearAllSearch?: () => void;
  selectedTagIds: string[];
  draggingTagIds: string[];
  isBatchMovingTags: boolean;
  onToggleSelectTag: (
    tagId: string,
    visibleOrderIds: string[],
    shiftKey?: boolean
  ) => void;
  onToggleSelectAllVisible: (visibleIds: string[]) => void;
  onStartDragTag: (tagId: string) => string[];
  onEndDragTag: () => void;
  onExecuteBatchMove: (
    tagIdsToMove: string[],
    destination: BatchTagMoveDestination
  ) => void;
  inlineEditingTagId: string | null;
  inlineEditingName: string;
  setInlineEditingName: (name: string) => void;
  inlineDuplicateConflict?: TagDuplicateConflict | null;
  onStartInlineRename: (tag: CategoryTag, e?: React.MouseEvent) => void;
  onCommitInlineRename: (tagId: string, trigger?: 'enter' | 'blur') => void;
  onCancelInlineRename: () => void;
  onCreateTagInSubCategory: (
    tier: CategoryTier,
    subCategory: string,
    name: string,
    color: string,
    entityType: EntitySubtype,
    description: string
  ) => void;
  onUpdateTagDetails: (
    tagId: string,
    updates: {
      name: string;
      color: string;
      entityType: EntitySubtype;
      description: string;
      subCategory: string;
    }
  ) => void;
  onRequestDeleteTag: (tagId: string) => void;
  onAddSubCategory: (tier: CategoryTier, subCategoryName: string) => void;
  onRenameSubCategory: (
    tier: CategoryTier,
    oldName: string,
    newName: string
  ) => void;
  onDeleteSubCategory: (tier: CategoryTier, subCategoryName: string) => void;
  isExpandedGrid?: boolean;
  isCompactRail?: boolean;
  onToggleExpandColumn?: () => void;
}

export const IndependentTierColumn: React.FC<IndependentTierColumnProps> = ({
  tier,
  subCategories,
  tagsInTier,
  allTags,
  categoryMatrix,
  globalSearchQuery = '',
  searchQuery,
  onSearchQueryChange,
  onClearAllSearch,
  selectedTagIds,
  draggingTagIds,
  isBatchMovingTags,
  onToggleSelectTag,
  onToggleSelectAllVisible,
  onStartDragTag,
  onEndDragTag,
  onExecuteBatchMove,
  inlineEditingTagId,
  inlineEditingName,
  setInlineEditingName,
  inlineDuplicateConflict = null,
  onStartInlineRename,
  onCommitInlineRename,
  onCancelInlineRename,
  onCreateTagInSubCategory,
  onUpdateTagDetails,
  onRequestDeleteTag,
  onAddSubCategory,
  onRenameSubCategory,
  onDeleteSubCategory,
  isExpandedGrid = false,
  isCompactRail = false,
  onToggleExpandColumn,
}) => {
  const theme = TIER_THEME_CONFIGS[tier];

  // Collapsible state per subCategory
  const [collapsedSubMap, setCollapsedSubMap] = useState<Record<string, boolean>>({});
  const [dragOverSubCat, setDragOverSubCat] = useState<string | null>(null);

  // Collapsible tier description with Framer Motion (collapsed by default for clean workspace)
  const [showDescription, setShowDescription] = useState(false);

  // Add new Sub-category inline form
  const [isAddingSubCat, setIsAddingSubCat] = useState(false);
  const [newSubCatName, setNewSubCatName] = useState('');

  // Rename Sub-category inline state
  const [renamingSubCat, setRenamingSubCat] = useState<string | null>(null);
  const [renamingSubCatValue, setRenamingSubCatValue] = useState('');

  // Add / Edit Tag form state (scoped to a subCategory or editing a tag)
  const [activeTagFormSubCat, setActiveTagFormSubCat] = useState<string | null>(null);
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [tagFormName, setTagFormName] = useState('');
  const [tagFormColor, setTagFormColor] = useState(theme.defaultColor);
  const [tagFormEntity, setTagFormEntity] = useState<EntitySubtype>(theme.defaultEntity);
  const [tagFormDesc, setTagFormDesc] = useState('');
  const [tagFormSubCat, setTagFormSubCat] = useState('');

  const realTagsInTier = useMemo(
    () => tagsInTier.filter((t) => !isStagingTagId(t.id)),
    [tagsInTier]
  );

  const isSearchActive =
    globalSearchQuery.trim().length > 0 || searchQuery.trim().length > 0;

  const filteredTags = useMemo(() => {
    if (!isSearchActive) return realTagsInTier;
    return realTagsInTier.filter(
      (t) =>
        matchesTagSearchQuery(t, globalSearchQuery) &&
        matchesTagSearchQuery(t, searchQuery)
    );
  }, [realTagsInTier, globalSearchQuery, searchQuery, isSearchActive]);

  // Group filtered tags by subCategory
  const groupedBySubCategory = useMemo(() => {
    const map: Record<string, CategoryTag[]> = {};
    subCategories.forEach((sub) => {
      map[sub] = [];
    });

    filteredTags.forEach((t) => {
      const sub = (t.subCategory || DEFAULT_UNCLASSIFIED_SUBCATEGORY).trim();
      if (!map[sub]) {
        map[sub] = [];
      }
      map[sub].push(t);
    });

    // Order subCategories: in Tier 1, always keep 'รอคัดแยก' at the very top
    const orderedKeys = Array.from(new Set([...subCategories, ...Object.keys(map)]));
    const ordered =
      tier === 1 && orderedKeys.includes(DEFAULT_UNCLASSIFIED_SUBCATEGORY)
        ? [
            {
              subCategory: DEFAULT_UNCLASSIFIED_SUBCATEGORY,
              tags: map[DEFAULT_UNCLASSIFIED_SUBCATEGORY] || [],
            },
            ...orderedKeys
              .filter((k) => k !== DEFAULT_UNCLASSIFIED_SUBCATEGORY)
              .map((k) => ({ subCategory: k, tags: map[k] || [] })),
          ]
        : orderedKeys.map((k) => ({
            subCategory: k,
            tags: map[k] || [],
          }));

    return isSearchActive ? ordered.filter((g) => g.tags.length > 0) : ordered;
  }, [subCategories, filteredTags, tier, isSearchActive]);

  const visibleOrderIds = useMemo(
    () => filteredTags.map((t) => t.id),
    [filteredTags]
  );

  const statByTagId = useMemo(() => {
    const map: Record<string, CategoryMatrixStat> = {};
    categoryMatrix.forEach((m) => {
      map[m.tag.id] = m;
    });
    return map;
  }, [categoryMatrix]);

  const extractDraggedTagIds = (e: React.DragEvent): string[] => {
    try {
      const raw =
        e.dataTransfer.getData('application/x-cms-tag-ids') ||
        e.dataTransfer.getData('text/plain');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // fallback
    }
    return draggingTagIds;
  };

  const handleDropOnSubCategory = (e: React.DragEvent, targetSubCategory: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverSubCat(null);
    if (isBatchMovingTags) return;
    const ids = extractDraggedTagIds(e);
    if (ids.length === 0) return;

    onExecuteBatchMove(ids, {
      mode: 'MOVE_TO_TIER_SUBCATEGORY',
      targetTier: tier,
      targetSubCategory,
    });
  };

  const handleOpenCreateTagInSub = (subCat: string) => {
    setEditingTagId(null);
    setActiveTagFormSubCat(subCat);
    setTagFormSubCat(subCat);
    setTagFormName('');
    setTagFormColor(theme.defaultColor);
    setTagFormEntity(theme.defaultEntity);
    setTagFormDesc('');
  };

  const handleOpenEditTag = (tag: CategoryTag, e: React.MouseEvent) => {
    e.stopPropagation();
    const sub = (tag.subCategory || subCategories[0] || DEFAULT_UNCLASSIFIED_SUBCATEGORY).trim();
    setEditingTagId(tag.id);
    setActiveTagFormSubCat(sub);
    setTagFormSubCat(sub);
    setTagFormName(tag.name);
    setTagFormColor(tag.color || theme.defaultColor);
    setTagFormEntity(tag.entityType || theme.defaultEntity);
    setTagFormDesc(tag.description || '');
  };

  const formDuplicateConflict = useMemo(
    () =>
      activeTagFormSubCat !== null
        ? findDuplicateTagConflict(tagFormName, allTags, editingTagId)
        : null,
    [activeTagFormSubCat, tagFormName, allTags, editingTagId]
  );

  const handleSubmitTagForm = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = tagFormName.trim().replace(/^#+/, '').trim();
    if (!cleanName) return;
    if (findDuplicateTagConflict(cleanName, allTags, editingTagId)) return;
    const targetSub = (tagFormSubCat || activeTagFormSubCat || subCategories[0] || '').trim();

    if (editingTagId) {
      onUpdateTagDetails(editingTagId, {
        name: cleanName,
        color: tagFormColor,
        entityType: tagFormEntity,
        description: tagFormDesc.trim(),
        subCategory: targetSub,
      });
    } else {
      onCreateTagInSubCategory(
        tier,
        targetSub,
        cleanName,
        tagFormColor,
        tagFormEntity,
        tagFormDesc.trim()
      );
    }

    setEditingTagId(null);
    setActiveTagFormSubCat(null);
    setTagFormName('');
  };

  const handleSubmitNewSubCat = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newSubCatName.trim();
    if (!clean) return;
    onAddSubCategory(tier, clean);
    setNewSubCatName('');
    setIsAddingSubCat(false);
  };

  const handleCommitSubCatRename = (oldName: string) => {
    const clean = renamingSubCatValue.trim();
    if (clean && clean !== oldName) {
      onRenameSubCategory(tier, oldName, clean);
    }
    setRenamingSubCat(null);
    setRenamingSubCatValue('');
  };

  // ============================================================================
  // COMPACT RAIL VIEW (When another column is expanded to full width)
  // ============================================================================
  if (isCompactRail) {
    return (
      <TierCompactRailView
        tier={tier}
        theme={theme}
        groupedBySubCategory={groupedBySubCategory}
        dragOverSubCat={dragOverSubCat}
        setDragOverSubCat={setDragOverSubCat}
        onDropOnSubCategory={handleDropOnSubCategory}
        selectedTagIds={selectedTagIds}
        onExecuteBatchMove={onExecuteBatchMove}
        isAddingSubCat={isAddingSubCat}
        setIsAddingSubCat={setIsAddingSubCat}
        newSubCatName={newSubCatName}
        setNewSubCatName={setNewSubCatName}
        onSubmitNewSubCat={handleSubmitNewSubCat}
        onToggleExpandColumn={onToggleExpandColumn}
      />
    );
  }

  // ============================================================================
  // FULL COLUMN / EXPANDED GRID VIEW
  // ============================================================================
  return (
    <div className="flex flex-col h-full min-h-0 bg-[#FAF8F5] overflow-hidden">
      {/* Column Header */}
      <div
        className={`px-3.5 py-2.5 border-b ${theme.headerBorder} ${theme.headerBg} shrink-0 space-y-2`}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex items-center gap-1.5 flex-1">
            <span
              className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-extrabold ${theme.badgeBg} ${theme.badgeTextCls} shrink-0`}
            >
              {theme.badgeText}
            </span>
            <h3 className={`text-sm font-extrabold ${theme.accentText} truncate`}>
              {theme.title}
            </h3>
            <span className="text-[11px] font-mono font-bold px-1.5 py-0.5 rounded bg-white/80 text-[#524538] border border-black/5 tabular-nums shrink-0">
              {isSearchActive
                ? `${filteredTags.length}/${realTagsInTier.length} แท็ก`
                : `${realTagsInTier.length} แท็ก`}
            </span>
            {/* Info toggle button for description with Framer Motion */}
            <button
              type="button"
              onClick={() => setShowDescription((prev) => !prev)}
              aria-label={showDescription ? 'ซ่อนคำอธิบายชั้นนี้' : 'ดูคำอธิบายชั้นนี้'}
              className={`w-6 h-6 rounded-md inline-flex items-center justify-center border transition-colors cursor-pointer shrink-0 ${
                showDescription
                  ? 'bg-white text-[#3D332A] border-[#C2B29F] shadow-2xs'
                  : 'bg-white/60 hover:bg-white text-[#6E5F52] border-transparent hover:border-[#D8C9B8]'
              }`}
              title={showDescription ? 'ซ่อนคำอธิบาย' : 'ดูคำอธิบายและตัวอย่าง'}
            >
              <Info className="w-3.5 h-3.5 text-[#78593A]" />
            </button>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setIsAddingSubCat((prev) => !prev)}
              className="h-7 inline-flex items-center gap-1 px-2.5 rounded-lg text-xs font-bold bg-white hover:bg-[#FAF7F2] text-[#3D332A] border border-[#D8C9B8] transition-colors cursor-pointer shadow-2xs"
              title="สร้างกรอบหมวดหมู่ย่อยใหม่ในชั้นนี้"
            >
              <FolderPlus className="w-3.5 h-3.5 text-[#78593A]" />
              <span>หมวดย่อย</span>
            </button>

            {onToggleExpandColumn && (
              <button
                type="button"
                onClick={onToggleExpandColumn}
                className={`w-7 h-7 rounded-lg hidden md:flex items-center justify-center border transition-colors cursor-pointer ${
                  isExpandedGrid
                    ? 'bg-[#3D332A] text-white border-[#3D332A]'
                    : 'bg-white hover:bg-[#FAF7F2] text-[#524538] border-[#D8C9B8]'
                }`}
                title={
                  isExpandedGrid
                    ? 'ย่อกลับเป็น 3 คอลัมน์ปกติ'
                    : 'กางคอลัมน์นี้เต็มพื้นที่เพื่อจัดแท็กจำนวนมาก'
                }
              >
                {isExpandedGrid ? (
                  <Minimize2 className="w-3.5 h-3.5" />
                ) : (
                  <Maximize2 className="w-3.5 h-3.5" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Collapsible Tier Description Accordion with Framer Motion */}
        <AnimatePresence initial={false}>
          {showDescription && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <div className="p-2.5 rounded-xl bg-white/90 border border-black/5 shadow-2xs text-[11px] text-[#4A3E33] leading-relaxed">
                <div className="flex items-start gap-1.5">
                  <Info className="w-3.5 h-3.5 text-[#78593A] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-[#3D332A]">{theme.title}: </span>
                    <span>{theme.subtitle}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search & Select All inside Tier */}
        <div className="flex items-center gap-1.5">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-[#8C7B6C] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              placeholder={`ค้นหาใน ${theme.badgeText}...`}
              className="w-full h-7 pl-8 pr-6 rounded-lg bg-white border border-[#DED3C5] text-xs text-[#3D332A] placeholder:text-[#A39485] focus:outline-none focus:border-[#78593A]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchQueryChange('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8C7B6C] hover:text-[#3D332A] cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {visibleOrderIds.length > 0 && (
            <button
              type="button"
              onClick={() => onToggleSelectAllVisible(visibleOrderIds)}
              className="h-7 px-2 rounded-lg text-[11px] font-semibold bg-white hover:bg-[#FAF7F2] text-[#524538] border border-[#DED3C5] inline-flex items-center justify-center transition-colors cursor-pointer whitespace-nowrap"
            >
              {visibleOrderIds.every((id) => selectedTagIds.includes(id)) ? (
                <>
                  <span className="hidden sm:inline">ยกเลิกทั้งคอลัมน์</span>
                  <span className="sm:hidden">ยกเลิก</span>
                </>
              ) : (
                <>
                  <span className="hidden sm:inline">เลือกทั้งคอลัมน์</span>
                  <span className="sm:hidden">เลือกทั้งหมด</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Inline Add New Sub-category & Add/Edit Tag Forms */}
        <TierInlineTagForm
          theme={theme}
          subCategories={subCategories}
          isAddingSubCat={isAddingSubCat}
          setIsAddingSubCat={setIsAddingSubCat}
          newSubCatName={newSubCatName}
          setNewSubCatName={setNewSubCatName}
          onSubmitNewSubCat={handleSubmitNewSubCat}
          activeTagFormSubCat={activeTagFormSubCat}
          editingTagId={editingTagId}
          tagFormName={tagFormName}
          setTagFormName={setTagFormName}
          tagFormSubCat={tagFormSubCat}
          setTagFormSubCat={setTagFormSubCat}
          tagFormColor={tagFormColor}
          setTagFormColor={setTagFormColor}
          tagFormEntity={tagFormEntity}
          setTagFormEntity={setTagFormEntity}
          duplicateConflict={formDuplicateConflict}
          onSubmitTagForm={handleSubmitTagForm}
          onCloseTagForm={() => {
            setActiveTagFormSubCat(null);
            setEditingTagId(null);
          }}
        />
      </div>

      {/* Sub-category Frames Body */}
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin p-3 space-y-3">
        {groupedBySubCategory.length === 0 ? (
          <div className="py-10 px-4 rounded-2xl border border-dashed border-[#DFD3C3] bg-white/70 text-center space-y-2">
            <Search className="w-6 h-6 text-[#A39485] mx-auto" />
            <div className="text-xs font-bold text-[#4D3A24]">
              ไม่พบแท็กใน {theme.badgeText}
            </div>
            <p className="text-[11px] text-[#8C7B6C]">
              ไม่มีแท็กที่ตรงกับ &ldquo;
              {searchQuery.trim() || globalSearchQuery.trim()}&rdquo;
            </p>
            {(searchQuery.trim() || (globalSearchQuery.trim() && onClearAllSearch)) && (
              <button
                type="button"
                onClick={() => {
                  if (searchQuery.trim()) {
                    onSearchQueryChange('');
                  } else if (onClearAllSearch) {
                    onClearAllSearch();
                  }
                }}
                className="px-3 py-1 rounded-lg text-[11px] font-bold bg-[#FAF7F2] hover:bg-[#F2EBE0] text-[#524538] border border-[#E2D5C4] cursor-pointer"
              >
                ล้างคำค้นหา
              </button>
            )}
          </div>
        ) : (
          groupedBySubCategory.map(({ subCategory, tags: subTags }) => (
            <TierSubCategorySection
              key={subCategory}
              tier={tier}
              theme={theme}
              subCategory={subCategory}
              subTags={subTags}
              isExpandedGrid={isExpandedGrid}
              isSearchActive={isSearchActive}
              isCollapsed={Boolean(collapsedSubMap[subCategory])}
              onToggleCollapse={(sub) =>
                setCollapsedSubMap((prev) => ({
                  ...prev,
                  [sub]: !prev[sub],
                }))
              }
              dragOverSubCat={dragOverSubCat}
              setDragOverSubCat={setDragOverSubCat}
              onDropOnSubCategory={handleDropOnSubCategory}
              renamingSubCat={renamingSubCat}
              renamingSubCatValue={renamingSubCatValue}
              setRenamingSubCatValue={setRenamingSubCatValue}
              onStartRenameSubCat={(sub) => {
                setRenamingSubCat(sub);
                setRenamingSubCatValue(sub);
              }}
              onCommitRenameSubCat={handleCommitSubCatRename}
              onCancelRenameSubCat={() => setRenamingSubCat(null)}
              onDeleteSubCategory={onDeleteSubCategory}
              onOpenCreateTagInSub={handleOpenCreateTagInSub}
              selectedTagIds={selectedTagIds}
              draggingTagIds={draggingTagIds}
              isBatchMovingTags={isBatchMovingTags}
              onToggleSelectAllVisible={onToggleSelectAllVisible}
              onExecuteBatchMove={onExecuteBatchMove}
              inlineEditingTagId={inlineEditingTagId}
              inlineEditingName={inlineEditingName}
              setInlineEditingName={setInlineEditingName}
              inlineDuplicateConflict={inlineDuplicateConflict}
              statByTagId={statByTagId}
              visibleOrderIds={visibleOrderIds}
              onStartDragTag={onStartDragTag}
              onEndDragTag={onEndDragTag}
              onToggleSelectTag={onToggleSelectTag}
              onStartInlineRename={onStartInlineRename}
              onCommitInlineRename={onCommitInlineRename}
              onCancelInlineRename={onCancelInlineRename}
              onOpenEditTag={handleOpenEditTag}
              onRequestDeleteTag={onRequestDeleteTag}
            />
          ))
        )}
      </div>
    </div>
  );
};
