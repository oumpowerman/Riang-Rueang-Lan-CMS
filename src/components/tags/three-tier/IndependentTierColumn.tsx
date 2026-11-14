import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronDown,
  CornerDownRight,
  Edit2,
  FolderPlus,
  Inbox,
  Info,
  Maximize2,
  Minimize2,
  Plus,
  Search,
  Trash2,
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
import { TierCompactRailView } from './TierCompactRailView';
import { TierInlineTagForm } from './TierInlineTagForm';
import { TierSubCategoryTagCard } from './TierSubCategoryTagCard';

export interface TierThemeConfig {
  tier: CategoryTier;
  badgeText: string;
  title: string;
  subtitle: string;
  headerBg: string;
  headerBorder: string;
  badgeBg: string;
  badgeTextCls: string;
  accentText: string;
  accentBtnBg: string;
  accentBtnHover: string;
  subHeaderBg: string;
  subHeaderBorder: string;
  defaultColor: string;
  defaultEntity: EntitySubtype;
  examplesPlaceholder: string;
}

export const TIER_THEME_CONFIGS: Record<CategoryTier, TierThemeConfig> = {
  1: {
    tier: 1,
    badgeText: 'TIER 1',
    title: 'มิติปลายทาง / หมวดกว้าง',
    subtitle: 'บอกว่าคลิปนี้อยู่วงการไหน เช่น #คนมีชื่อเสียง #วิถีชาวบ้าน #สัตว์โลก #อาชีพ',
    headerBg: 'bg-[#EEF5FB]',
    headerBorder: 'border-[#C5DCEF]',
    badgeBg: 'bg-[#2C5378]',
    badgeTextCls: 'text-white',
    accentText: 'text-[#184366]',
    accentBtnBg: 'bg-[#2C5378]',
    accentBtnHover: 'hover:bg-[#1E3D59]',
    subHeaderBg: 'bg-[#F4F9FD]',
    subHeaderBorder: 'border-[#D5E6F5]',
    defaultColor: 'blue',
    defaultEntity: 'TOPIC',
    examplesPlaceholder: 'เช่น คนมีชื่อเสียง, วิถีชาวบ้าน, สัตว์โลก, อาชีพ...',
  },
  2: {
    tier: 2,
    badgeText: 'TIER 2',
    title: 'บริบท / สไตล์คลิป',
    subtitle: 'เกิดเหตุการณ์อะไรขึ้น หรือคลิปเป็นทรงไหน เช่น #พูดผิด #ช็อตฟีล #ไลฟ์สด #สัมภาษณ์ข่าว',
    headerBg: 'bg-[#FEF6E8]',
    headerBorder: 'border-[#E8CFA6]',
    badgeBg: 'bg-[#8A5A22]',
    badgeTextCls: 'text-white',
    accentText: 'text-[#6B4415]',
    accentBtnBg: 'bg-[#8A5A22]',
    accentBtnHover: 'hover:bg-[#6E4518]',
    subHeaderBg: 'bg-[#FFFDF9]',
    subHeaderBorder: 'border-[#EFE0C6]',
    defaultColor: 'amber',
    defaultEntity: 'ACTION',
    examplesPlaceholder: 'เช่น พูดผิด, ช็อตฟีล, ไลฟ์สด, สัมภาษณ์ข่าว, กล้องวงจรปิด...',
  },
  3: {
    tier: 3,
    badgeText: 'TIER 3',
    title: 'บุคคลเจาะจง / รายการ',
    subtitle: 'ระบุว่าใคร หรือรายการอะไร เช่น #พี่แจ๊ส #พี่เสก #เซียนหรั่ง #โหนกระแส',
    headerBg: 'bg-[#EDF6F0]',
    headerBorder: 'border-[#BFE0C8]',
    badgeBg: 'bg-[#2D623C]',
    badgeTextCls: 'text-white',
    accentText: 'text-[#1D4D2B]',
    accentBtnBg: 'bg-[#2D623C]',
    accentBtnHover: 'hover:bg-[#214B2D]',
    subHeaderBg: 'bg-[#F6FBF7]',
    subHeaderBorder: 'border-[#CEE8D5]',
    defaultColor: 'emerald',
    defaultEntity: 'PERSON',
    examplesPlaceholder: 'เช่น พี่แจ๊ส, พี่เสก, เซียนหรั่ง, โหนกระแส...',
  },
};

export interface IndependentTierColumnProps {
  tier: CategoryTier;
  subCategories: string[];
  tagsInTier: CategoryTag[];
  categoryMatrix: CategoryMatrixStat[];
  searchQuery: string;
  onSearchQueryChange: (q: string) => void;
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
  onStartInlineRename: (tag: CategoryTag, e?: React.MouseEvent) => void;
  onCommitInlineRename: (tagId: string) => void;
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
  categoryMatrix,
  searchQuery,
  onSearchQueryChange,
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

  const filteredTags = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return realTagsInTier;
    return realTagsInTier.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        (t.subCategory || '').toLowerCase().includes(q) ||
        (t.description || '').toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q)
    );
  }, [realTagsInTier, searchQuery]);

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
    if (tier === 1 && orderedKeys.includes(DEFAULT_UNCLASSIFIED_SUBCATEGORY)) {
      const rest = orderedKeys.filter((k) => k !== DEFAULT_UNCLASSIFIED_SUBCATEGORY);
      return [
        {
          subCategory: DEFAULT_UNCLASSIFIED_SUBCATEGORY,
          tags: map[DEFAULT_UNCLASSIFIED_SUBCATEGORY] || [],
        },
        ...rest.map((k) => ({ subCategory: k, tags: map[k] || [] })),
      ];
    }

    return orderedKeys.map((k) => ({
      subCategory: k,
      tags: map[k] || [],
    }));
  }, [subCategories, filteredTags, tier]);

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
      const raw = e.dataTransfer.getData('application/x-cms-tag-ids');
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

  const handleSubmitTagForm = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = tagFormName.trim().replace(/^#+/, '').trim();
    if (!cleanName) return;
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
              {realTagsInTier.length} แท็ก
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
          onSubmitTagForm={handleSubmitTagForm}
          onCloseTagForm={() => {
            setActiveTagFormSubCat(null);
            setEditingTagId(null);
          }}
        />
      </div>

      {/* Sub-category Frames Body */}
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin p-3 space-y-3">
        {groupedBySubCategory.map(({ subCategory, tags: subTags }) => {
          const isUnclassified = subCategory === DEFAULT_UNCLASSIFIED_SUBCATEGORY;
          const isCollapsed = Boolean(collapsedSubMap[subCategory]);
          const isDropHover = dragOverSubCat === subCategory;
          const subTagIds = subTags.map((t) => t.id);
          const allSubSelected =
            subTagIds.length > 0 &&
            subTagIds.every((id) => selectedTagIds.includes(id));

          return (
            <div
              key={subCategory}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
                e.dataTransfer.dropEffect = 'move';
                if (dragOverSubCat !== subCategory) setDragOverSubCat(subCategory);
              }}
              onDragLeave={() => {
                if (dragOverSubCat === subCategory) setDragOverSubCat(null);
              }}
              onDrop={(e) => handleDropOnSubCategory(e, subCategory)}
              className={`rounded-2xl border transition-all overflow-hidden ${
                isDropHover
                  ? 'bg-[#EEF5EE] border-2 border-[#3B6845] ring-2 ring-[#C5E2CA] shadow-sm'
                  : isUnclassified
                  ? 'bg-[#FFFDF8] border-[#E8D2AE] shadow-2xs'
                  : 'bg-white border-[#E5DED4] shadow-2xs'
              }`}
            >
              {/* Sub-category Frame Header */}
              <div
                className={`px-3 py-2 border-b flex flex-wrap items-center justify-between gap-2 ${
                  isUnclassified
                    ? 'bg-[#FEF6E6] border-[#E8D2AE]'
                    : `${theme.subHeaderBg} ${theme.subHeaderBorder}`
                }`}
              >
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() =>
                      setCollapsedSubMap((prev) => ({
                        ...prev,
                        [subCategory]: !prev[subCategory],
                      }))
                    }
                    className="p-0.5 rounded hover:bg-black/5 text-[#524538] cursor-pointer shrink-0"
                    title={isCollapsed ? 'กางหมวดย่อย' : 'พับหมวดย่อย'}
                  >
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform ${
                        isCollapsed ? '-rotate-90' : ''
                      }`}
                    />
                  </button>

                  {isUnclassified && (
                    <Inbox className="w-3.5 h-3.5 text-[#A66B1F] shrink-0" />
                  )}

                  {renamingSubCat === subCategory ? (
                    <input
                      type="text"
                      value={renamingSubCatValue}
                      onChange={(e) => setRenamingSubCatValue(e.target.value)}
                      onBlur={() => handleCommitSubCatRename(subCategory)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleCommitSubCatRename(subCategory);
                        } else if (e.key === 'Escape') {
                          setRenamingSubCat(null);
                        }
                      }}
                      autoFocus
                      className="px-2 py-0.5 text-xs font-bold bg-white border border-[#78593A] rounded text-[#3D332A] focus:outline-none"
                    />
                  ) : (
                    <span
                      onDoubleClick={() => {
                        if (!isUnclassified) {
                          setRenamingSubCat(subCategory);
                          setRenamingSubCatValue(subCategory);
                        }
                      }}
                      className={`text-xs font-extrabold truncate ${
                        isUnclassified ? 'text-[#734811]' : theme.accentText
                      }`}
                      title={
                        isUnclassified
                          ? 'แท็กเดิมทั้งหมดถูกพักไว้ที่นี่ ลากหรือติ๊กเลือกเพื่อย้ายเข้า Tier 1, 2, 3 ได้เลย'
                          : 'ดับเบิลคลิกเพื่อเปลี่ยนชื่อหมวดหมู่ย่อย'
                      }
                    >
                      {subCategory}
                    </span>
                  )}

                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-white text-[#524538] border border-black/10 tabular-nums shrink-0">
                    {subTags.length}
                  </span>
                </div>

                {/* Sub-category Right Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  {selectedTagIds.length > 0 && (
                    <button
                      type="button"
                      onClick={() =>
                        onExecuteBatchMove(selectedTagIds, {
                          mode: 'MOVE_TO_TIER_SUBCATEGORY',
                          targetTier: tier,
                          targetSubCategory: subCategory,
                        })
                      }
                      className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-[#3B6845] hover:bg-[#2C5235] text-white transition-colors cursor-pointer flex items-center gap-1"
                      title={`ย้ายแท็กที่เลือก (${selectedTagIds.length} รายการ) เข้ามาไว้ในหมวด "${subCategory}"`}
                    >
                      <CornerDownRight className="w-3 h-3" />
                      <span className="hidden sm:inline">ย้ายมาหมวดนี้ ({selectedTagIds.length})</span>
                      <span className="sm:hidden">ย้ายมา ({selectedTagIds.length})</span>
                    </button>
                  )}

                  {subTagIds.length > 0 && (
                    <button
                      type="button"
                      onClick={() => onToggleSelectAllVisible(subTagIds)}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition-colors cursor-pointer ${
                        allSubSelected
                          ? 'bg-[#EEF5EE] text-[#1C4824] border-[#BAD8BF]'
                          : 'bg-white/90 hover:bg-white text-[#524538] border-black/10'
                      }`}
                    >
                      <span className="hidden sm:inline">{allSubSelected ? '✓ เลือกทั้งหมวดแล้ว' : 'เลือกทั้งหมวด'}</span>
                      <span className="sm:hidden">{allSubSelected ? '✓ เลือกแล้ว' : 'เลือกหมวด'}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleOpenCreateTagInSub(subCategory)}
                    className="p-1 rounded-lg bg-white/90 hover:bg-white text-[#3D332A] border border-black/10 cursor-pointer"
                    title={`เพิ่มแท็กในหมวด "${subCategory}"`}
                  >
                    <Plus className="w-3 h-3" />
                  </button>

                  {!isUnclassified && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setRenamingSubCat(subCategory);
                          setRenamingSubCatValue(subCategory);
                        }}
                        className="p-1 rounded-lg bg-white/90 hover:bg-white text-[#524538] border border-black/10 cursor-pointer"
                        title="เปลี่ยนชื่อหมวดย่อย"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteSubCategory(tier, subCategory)}
                        className="p-1 rounded-lg bg-white/90 hover:bg-[#FDF2F0] text-[#8A3C31] border border-black/10 cursor-pointer"
                        title="ลบหมวดย่อยนี้ (แท็กข้างในจะถูกย้ายกลับหมวดเริ่มต้น)"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Helper banner for 'รอคัดแยก' */}
              {isUnclassified && !isCollapsed && subTags.length > 0 && (
                <div className="px-3 py-1.5 bg-[#FFF8EB] border-b border-[#EFE0C2] text-[11px] text-[#7D531B] flex items-center justify-between gap-2">
                  <span>
                    💡 แท็กเดิมทั้งหมด ({subTags.length}) รวมไว้ที่นี่ — เลือกแล้วกดย้ายเข้าหมวดย่อยของ Tier 1, 2, 3 ได้ทันที
                  </span>
                </div>
              )}

              {/* Tags Grid inside Sub-category */}
              {!isCollapsed && (
                <div className="p-2.5">
                  {subTags.length === 0 ? (
                    <div className="py-4 px-3 rounded-xl border border-dashed border-[#E2D5C4] bg-[#FAF8F5]/60 text-center space-y-1">
                      <p className="text-[11px] text-[#8C7B6C]">
                        ยังไม่มีแท็กในหมวด &ldquo;{subCategory}&rdquo; — ลากแท็กมาวางที่นี่ หรือกด{' '}
                        <button
                          type="button"
                          onClick={() => handleOpenCreateTagInSub(subCategory)}
                          className="font-bold text-[#3D332A] underline cursor-pointer"
                        >
                          + เพิ่มแท็กใหม่
                        </button>
                      </p>
                    </div>
                  ) : (
                    <div
                      className={
                        isExpandedGrid
                          ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2'
                          : 'grid grid-cols-1 gap-1.5'
                      }
                    >
                      {subTags.map((tag) => (
                        <TierSubCategoryTagCard
                          key={tag.id}
                          tag={tag}
                          isSelected={selectedTagIds.includes(tag.id)}
                          isDragging={draggingTagIds.includes(tag.id)}
                          isInlineEditing={inlineEditingTagId === tag.id}
                          isBatchMovingTags={isBatchMovingTags}
                          inlineEditingName={inlineEditingName}
                          setInlineEditingName={setInlineEditingName}
                          stat={statByTagId[tag.id]}
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
                      ))}
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
