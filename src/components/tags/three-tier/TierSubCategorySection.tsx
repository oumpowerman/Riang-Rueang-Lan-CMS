import React from 'react';
import {
  ChevronDown,
  CornerDownRight,
  Edit2,
  Folder,
  Inbox,
  Plus,
  Trash2,
} from 'lucide-react';
import { CategoryMatrixStat } from '../../../context/CMSContext';
import { BatchTagMoveDestination } from '../../../context/cms/cms.types';
import {
  CategoryTag,
  CategoryTier,
  DEFAULT_UNCLASSIFIED_SUBCATEGORY,
} from '../../../types/tag.types';
import { TagDuplicateConflict } from '../../../utils/tagDeduplicator';
import { TierThemeConfig } from '../constants/tierThemeConfigs';
import { TierSubCategoryTagCard } from './TierSubCategoryTagCard';

interface TierSubCategorySectionProps {
  tier: CategoryTier;
  theme: TierThemeConfig;
  subCategory: string;
  subTags: CategoryTag[];
  isExpandedGrid: boolean;
  isSearchActive: boolean;
  isCollapsed: boolean;
  onToggleCollapse: (subCategory: string) => void;
  dragOverSubCat: string | null;
  setDragOverSubCat: (subCat: string | null) => void;
  onDropOnSubCategory: (e: React.DragEvent, targetSubCategory: string) => void;
  renamingSubCat: string | null;
  renamingSubCatValue: string;
  setRenamingSubCatValue: (val: string) => void;
  onStartRenameSubCat: (subCategory: string) => void;
  onCommitRenameSubCat: (oldName: string) => void;
  onCancelRenameSubCat: () => void;
  onDeleteSubCategory: (tier: CategoryTier, subCategoryName: string) => void;
  onOpenCreateTagInSub: (subCategory: string) => void;
  selectedTagIds: string[];
  draggingTagIds: string[];
  isBatchMovingTags: boolean;
  onToggleSelectAllVisible: (visibleIds: string[]) => void;
  onExecuteBatchMove: (
    tagIdsToMove: string[],
    destination: BatchTagMoveDestination
  ) => void;
  inlineEditingTagId: string | null;
  inlineEditingName: string;
  setInlineEditingName: (name: string) => void;
  inlineDuplicateConflict?: TagDuplicateConflict | null;
  statByTagId: Record<string, CategoryMatrixStat>;
  visibleOrderIds: string[];
  onStartDragTag: (tagId: string) => string[];
  onEndDragTag: () => void;
  onToggleSelectTag: (
    tagId: string,
    visibleOrderIds: string[],
    shiftKey?: boolean
  ) => void;
  onStartInlineRename: (tag: CategoryTag, e?: React.MouseEvent) => void;
  onCommitInlineRename: (tagId: string, trigger?: 'enter' | 'blur') => void;
  onCancelInlineRename: () => void;
  onOpenEditTag: (tag: CategoryTag, e: React.MouseEvent) => void;
  onRequestDeleteTag: (tagId: string) => void;
}

export const TierSubCategorySection: React.FC<TierSubCategorySectionProps> = ({
  tier,
  theme,
  subCategory,
  subTags,
  isExpandedGrid,
  isSearchActive,
  isCollapsed,
  onToggleCollapse,
  dragOverSubCat,
  setDragOverSubCat,
  onDropOnSubCategory,
  renamingSubCat,
  renamingSubCatValue,
  setRenamingSubCatValue,
  onStartRenameSubCat,
  onCommitRenameSubCat,
  onCancelRenameSubCat,
  onDeleteSubCategory,
  onOpenCreateTagInSub,
  selectedTagIds,
  draggingTagIds,
  isBatchMovingTags,
  onToggleSelectAllVisible,
  onExecuteBatchMove,
  inlineEditingTagId,
  inlineEditingName,
  setInlineEditingName,
  inlineDuplicateConflict = null,
  statByTagId,
  visibleOrderIds,
  onStartDragTag,
  onEndDragTag,
  onToggleSelectTag,
  onStartInlineRename,
  onCommitInlineRename,
  onCancelInlineRename,
  onOpenEditTag,
  onRequestDeleteTag,
}) => {
  const isUnclassified = subCategory === DEFAULT_UNCLASSIFIED_SUBCATEGORY;
  const effectiveCollapsed = !isSearchActive && isCollapsed;
  const isDropHover = dragOverSubCat === subCategory;
  const subTagIds = subTags.map((t) => t.id);
  const allSubSelected =
    subTagIds.length > 0 &&
    subTagIds.every((id) => selectedTagIds.includes(id));

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'move';
        if (dragOverSubCat !== subCategory) setDragOverSubCat(subCategory);
      }}
      onDragLeave={(e) => {
        if (e.currentTarget.contains(e.relatedTarget as Node)) return;
        if (dragOverSubCat === subCategory) setDragOverSubCat(null);
      }}
      onDrop={(e) => onDropOnSubCategory(e, subCategory)}
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
            onClick={() => onToggleCollapse(subCategory)}
            className="p-0.5 rounded hover:bg-black/5 text-[#524538] cursor-pointer shrink-0"
            title={effectiveCollapsed ? 'กางหมวดย่อย' : 'พับหมวดย่อย'}
          >
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform ${
                effectiveCollapsed ? '-rotate-90' : ''
              }`}
            />
          </button>

          {isUnclassified ? (
            <Inbox className="w-3.5 h-3.5 text-[#A66B1F] shrink-0" />
          ) : (
            <Folder className="w-3.5 h-3.5 text-[#524538] shrink-0 opacity-70" />
          )}

          {renamingSubCat === subCategory ? (
            <input
              type="text"
              value={renamingSubCatValue}
              onChange={(e) => setRenamingSubCatValue(e.target.value)}
              onBlur={() => onCommitRenameSubCat(subCategory)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  onCommitRenameSubCat(subCategory);
                } else if (e.key === 'Escape') {
                  onCancelRenameSubCat();
                }
              }}
              autoFocus
              className="px-2 py-0.5 text-xs font-bold bg-white border border-[#78593A] rounded text-[#3D332A] focus:outline-none"
            />
          ) : (
            <span
              onDoubleClick={() => {
                if (!isUnclassified) {
                  onStartRenameSubCat(subCategory);
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
          {selectedTagIds.length > 0 &&
            selectedTagIds.some((id) => !subTagIds.includes(id)) && (
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
                <span className="hidden sm:inline">
                  ย้ายมาหมวดนี้ ({selectedTagIds.length})
                </span>
                <span className="sm:hidden">
                  ย้ายมา ({selectedTagIds.length})
                </span>
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
              <span className="hidden sm:inline">
                {allSubSelected ? '✓ เลือกทั้งหมวดแล้ว' : 'เลือกทั้งหมวด'}
              </span>
              <span className="sm:hidden">
                {allSubSelected ? '✓ เลือกแล้ว' : 'เลือกหมวด'}
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={() => onOpenCreateTagInSub(subCategory)}
            className="p-1 rounded-lg bg-white/90 hover:bg-white text-[#3D332A] border border-black/10 cursor-pointer"
            title={`เพิ่มแท็กในหมวด "${subCategory}"`}
          >
            <Plus className="w-3 h-3" />
          </button>

          {!isUnclassified && (
            <>
              <button
                type="button"
                onClick={() => onStartRenameSubCat(subCategory)}
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
      {isUnclassified && !effectiveCollapsed && subTags.length > 0 && !isSearchActive && (
        <div className="px-3 py-1.5 bg-[#FFF8EB] border-b border-[#EFE0C2] text-[11px] text-[#7D531B] flex items-center justify-between gap-2">
          <span>
            💡 แท็กเดิมทั้งหมด ({subTags.length}) รวมไว้ที่นี่ — เลือกแล้วกดย้ายเข้าหมวดย่อยของ Tier 1, 2, 3 ได้ทันที
          </span>
        </div>
      )}

      {/* Tags Grid inside Sub-category */}
      {!effectiveCollapsed && (
        <div className="p-2.5">
          {subTags.length === 0 ? (
            <div className="py-4 px-3 rounded-xl border border-dashed border-[#E2D5C4] bg-[#FAF8F5]/60 text-center space-y-1">
              <p className="text-[11px] text-[#8C7B6C]">
                ยังไม่มีแท็กในหมวด &ldquo;{subCategory}&rdquo; — ลากแท็กมาวางที่นี่ หรือกด{' '}
                <button
                  type="button"
                  onClick={() => onOpenCreateTagInSub(subCategory)}
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
                  ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2.5'
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
                  inlineDuplicateConflict={
                    inlineEditingTagId === tag.id
                      ? inlineDuplicateConflict
                      : null
                  }
                  stat={statByTagId[tag.id]}
                  visibleOrderIds={visibleOrderIds}
                  onStartDragTag={onStartDragTag}
                  onEndDragTag={onEndDragTag}
                  onToggleSelectTag={onToggleSelectTag}
                  onStartInlineRename={onStartInlineRename}
                  onCommitInlineRename={onCommitInlineRename}
                  onCancelInlineRename={onCancelInlineRename}
                  onOpenEditTag={onOpenEditTag}
                  onRequestDeleteTag={onRequestDeleteTag}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
