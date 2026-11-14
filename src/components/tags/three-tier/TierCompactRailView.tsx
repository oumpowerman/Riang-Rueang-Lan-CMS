import React from 'react';
import { CornerDownRight, FolderPlus, Maximize2 } from 'lucide-react';
import { BatchTagMoveDestination } from '../../../context/cms/cms.types';
import { CategoryTag, CategoryTier } from '../../../types/tag.types';
import { TierThemeConfig } from './IndependentTierColumn';

interface TierCompactRailViewProps {
  tier: CategoryTier;
  theme: TierThemeConfig;
  groupedBySubCategory: Array<{ subCategory: string; tags: CategoryTag[] }>;
  dragOverSubCat: string | null;
  setDragOverSubCat: (val: string | null) => void;
  onDropOnSubCategory: (e: React.DragEvent, targetSubCategory: string) => void;
  selectedTagIds: string[];
  onExecuteBatchMove: (
    tagIdsToMove: string[],
    destination: BatchTagMoveDestination
  ) => void;
  isAddingSubCat: boolean;
  setIsAddingSubCat: (val: boolean) => void;
  newSubCatName: string;
  setNewSubCatName: (val: string) => void;
  onSubmitNewSubCat: (e: React.FormEvent) => void;
  onToggleExpandColumn?: () => void;
}

export const TierCompactRailView: React.FC<TierCompactRailViewProps> = ({
  tier,
  theme,
  groupedBySubCategory,
  dragOverSubCat,
  setDragOverSubCat,
  onDropOnSubCategory,
  selectedTagIds,
  onExecuteBatchMove,
  isAddingSubCat,
  setIsAddingSubCat,
  newSubCatName,
  setNewSubCatName,
  onSubmitNewSubCat,
  onToggleExpandColumn,
}) => {
  return (
    <div className="flex flex-col h-full min-h-0 bg-[#FAF8F5] overflow-hidden">
      <div
        className={`px-3 py-2.5 border-b ${theme.headerBorder} ${theme.headerBg} flex items-center justify-between gap-1.5 shrink-0`}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <span
            className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-extrabold ${theme.badgeBg} ${theme.badgeTextCls} shrink-0`}
          >
            {theme.badgeText}
          </span>
          <span className={`text-xs font-extrabold ${theme.accentText} truncate`}>
            {theme.title}
          </span>
        </div>
        {onToggleExpandColumn && (
          <button
            type="button"
            onClick={onToggleExpandColumn}
            className="p-1 rounded-lg bg-white/80 hover:bg-white text-[#524538] border border-[#E2D5C4] cursor-pointer shrink-0"
            title="กางคอลัมน์นี้เต็มพื้นที่"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="p-2 text-[11px] text-[#6E5F52] bg-[#FDFBF7] border-b border-[#EFE7DC] shrink-0">
        ลากแท็กมาวางในกล่องหมวดย่อยด้านล่าง หรือกดย้ายชุดที่เลือก:
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin p-2 space-y-2">
        {groupedBySubCategory.map(({ subCategory, tags: subTags }) => {
          const isDropHover = dragOverSubCat === subCategory;
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
              onDrop={(e) => onDropOnSubCategory(e, subCategory)}
              className={`p-2.5 rounded-xl border transition-all ${
                isDropHover
                  ? 'bg-[#EEF5EE] border-2 border-[#3B6845] ring-2 ring-[#C5E2CA] scale-[1.01]'
                  : 'bg-white border-[#E2D5C4] hover:border-[#C2B29F]'
              }`}
            >
              <div className="flex items-center justify-between gap-1.5">
                <span className="text-xs font-bold text-[#3D332A] truncate">
                  {subCategory}
                </span>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#FAF7F2] text-[#6E5F52] border border-[#E8DFD3] tabular-nums">
                  {subTags.length} แท็ก
                </span>
              </div>

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
                  className={`mt-2 w-full py-1 px-2 rounded-lg text-[11px] font-bold text-white ${theme.accentBtnBg} ${theme.accentBtnHover} transition-colors cursor-pointer flex items-center justify-center gap-1`}
                >
                  <CornerDownRight className="w-3 h-3" />
                  <span>ย้าย {selectedTagIds.length} แท็กมาหมวดนี้</span>
                </button>
              )}
            </div>
          );
        })}

        {/* Quick Add Subcategory in Compact Rail */}
        {isAddingSubCat ? (
          <form
            onSubmit={onSubmitNewSubCat}
            className="p-2 bg-white rounded-xl border border-[#D8C5A6] space-y-1.5"
          >
            <input
              type="text"
              value={newSubCatName}
              onChange={(e) => setNewSubCatName(e.target.value)}
              placeholder="ชื่อหมวดย่อยใหม่..."
              autoFocus
              className="w-full px-2 py-1 text-xs rounded-lg border border-[#E2D5C4] focus:outline-none"
            />
            <div className="flex items-center justify-end gap-1">
              <button
                type="button"
                onClick={() => setIsAddingSubCat(false)}
                className="px-2 py-0.5 text-[11px] text-[#7D6E61] cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold text-white ${theme.accentBtnBg} cursor-pointer`}
              >
                สร้าง
              </button>
            </div>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setIsAddingSubCat(true)}
            className="w-full py-1.5 px-2.5 rounded-xl border border-dashed border-[#D5C6B4] text-xs font-bold text-[#6E5F52] hover:bg-white transition-colors cursor-pointer flex items-center justify-center gap-1"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span>+ เพิ่มหมวดย่อยใน {theme.badgeText}</span>
          </button>
        )}
      </div>
    </div>
  );
};
