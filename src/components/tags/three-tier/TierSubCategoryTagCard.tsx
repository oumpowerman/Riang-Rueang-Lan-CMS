import React from 'react';
import { AlertCircle, Check, Edit2, GripVertical, Trash2 } from 'lucide-react';
import { CategoryMatrixStat } from '../../../context/CMSContext';
import { CategoryTag } from '../../../types/tag.types';
import { TagDuplicateConflict } from '../../../utils/tagDeduplicator';
import { getEntityIcon } from '../../ui/TagPill';
import { getPastelColorConfig } from '../constants/tagPastelPalette';

interface TierSubCategoryTagCardProps {
  tag: CategoryTag;
  isSelected: boolean;
  isDragging: boolean;
  isInlineEditing: boolean;
  isBatchMovingTags: boolean;
  inlineEditingName: string;
  setInlineEditingName: (name: string) => void;
  inlineDuplicateConflict?: TagDuplicateConflict | null;
  stat?: CategoryMatrixStat;
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

export const TierSubCategoryTagCard: React.FC<TierSubCategoryTagCardProps> = ({
  tag,
  isSelected,
  isDragging,
  isInlineEditing,
  isBatchMovingTags,
  inlineEditingName,
  setInlineEditingName,
  inlineDuplicateConflict = null,
  stat,
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
  const totalCount = stat?.totalCount || 0;
  const colorCfg = getPastelColorConfig(tag.color);
  const hasInlineConflict = Boolean(isInlineEditing && inlineDuplicateConflict);

  return (
    <div
      draggable={!isInlineEditing && !isBatchMovingTags}
      onDragStart={(e) => {
        const batch = onStartDragTag(tag.id);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('application/x-cms-tag-ids', JSON.stringify(batch));
        e.dataTransfer.setData('text/plain', JSON.stringify(batch));
      }}
      onDragEnd={onEndDragTag}
      onClick={(e) => {
        if (isInlineEditing) return;
        onToggleSelectTag(tag.id, visibleOrderIds, e.shiftKey);
      }}
      className={`group relative h-9 px-2.5 rounded-xl border transition-all select-none flex items-center justify-between gap-2 cursor-pointer ${
        hasInlineConflict
          ? 'bg-[#FFF5F5] border-[#C94A4A] ring-1 ring-[#F2B8B8] z-20'
          : isDragging
          ? 'opacity-45 scale-98 border-dashed border-[#78593A]'
          : isSelected
          ? 'bg-[#EEF5EE] border-[#7AB889] ring-1 ring-[#B8DEC0] shadow-2xs'
          : 'bg-[#FDFBF7] hover:bg-white border-[#E6DEC8] hover:border-[#CBBBA0]'
      }`}
    >
      {/* Left: Checkbox + Drag Grip + Color Dot + Tag Name */}
      <div className="flex items-center gap-1.5 min-w-0 flex-1">
        <span
          className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
            isSelected
              ? 'bg-[#3B6845] border-[#3B6845] text-white'
              : 'bg-white border-[#CFC3B4] group-hover:border-[#8C7B6C]'
          }`}
        >
          {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
        </span>

        <GripVertical className="w-3.5 h-3.5 text-[#B8AA99] group-hover:text-[#78593A] shrink-0 cursor-grab" />

        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${colorCfg.swatchBg}`} />

        <span className="text-xs shrink-0" title={tag.entityType}>
          {getEntityIcon(tag)}
        </span>

        {isInlineEditing ? (
          <input
            type="text"
            value={inlineEditingName}
            onChange={(e) => setInlineEditingName(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            onBlur={() => onCommitInlineRename(tag.id, 'blur')}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                onCommitInlineRename(tag.id, 'enter');
              } else if (e.key === 'Escape') {
                onCancelInlineRename();
              }
            }}
            autoFocus
            aria-invalid={hasInlineConflict}
            className={`flex-1 min-w-0 px-1.5 py-0.5 text-xs font-bold bg-white border rounded focus:outline-none ${
              hasInlineConflict
                ? 'border-[#C94A4A] text-[#991B1B]'
                : 'border-[#3B6845] text-[#3D332A]'
            }`}
          />
        ) : (
          <span
            onDoubleClick={(e) => onStartInlineRename(tag, e)}
            className="text-xs font-bold text-[#3D332A] truncate"
            title={`#${tag.name} (ดับเบิลคลิกเพื่อเปลี่ยนชื่อด่วน)`}
          >
            #{tag.name}
          </span>
        )}
      </div>

      {/* Right: Quick Edit/Delete on Hover + Total Footage Count */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Quick Actions: Revealed on hover on desktop, always accessible on touch */}
        <div className="flex sm:hidden sm:group-hover:flex items-center gap-0.5 shrink-0 transition-opacity duration-150">
          <button
            type="button"
            onClick={(e) => onOpenEditTag(tag, e)}
            aria-label={`แก้ไขแท็ก #${tag.name}`}
            className="w-6 h-6 rounded-lg flex items-center justify-center text-[#7D6E61] hover:text-[#3D332A] hover:bg-[#EFE7DC] transition-colors cursor-pointer"
            title="แก้ไขรายละเอียดแท็ก (หรือดับเบิลคลิกที่ชื่อเพื่อเปลี่ยนชื่อด่วน)"
          >
            <Edit2 className="w-3 h-3" />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRequestDeleteTag(tag.id);
            }}
            aria-label={`ลบแท็ก #${tag.name}`}
            className="w-6 h-6 rounded-lg flex items-center justify-center text-[#A38E7D] hover:text-[#8A3C31] hover:bg-[#FDF2F0] transition-colors cursor-pointer"
            title="ลบป้ายแท็กนี้"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>

        <span
          className={`text-[10px] font-mono px-1.5 py-0.5 rounded border tabular-nums ${
            totalCount > 0
              ? 'bg-white text-[#524538] border-[#DFD5C5] font-bold'
              : 'bg-[#F5F1EA] text-[#8C7B6C] border-[#E5DEC9]'
          }`}
          title={`มีฟุตเทจที่ติดแท็กนี้ทั้งหมด ${totalCount} คลิป`}
        >
          {totalCount} ฟุต
        </span>
      </div>

      {/* Inline Rename Duplicate Warning Tooltip */}
      {hasInlineConflict && inlineDuplicateConflict && (
        <div
          role="alert"
          className="absolute left-0 right-0 top-full mt-1 z-40 px-2.5 py-1.5 rounded-lg bg-[#FDF2F2] border border-[#E5A4A4] shadow-md flex items-start gap-1.5 text-[11px] font-semibold text-[#B91C1C]"
        >
          <AlertCircle className="w-3.5 h-3.5 text-[#DC2626] shrink-0 mt-0.5" />
          <span className="leading-snug">
            {inlineDuplicateConflict.message} (กด Esc เพื่อยกเลิก)
          </span>
        </div>
      )}
    </div>
  );
};
