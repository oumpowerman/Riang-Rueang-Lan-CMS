import React from 'react';
import { Check, ChevronDown, Plus } from 'lucide-react';
import { CategoryTag, CategoryTier, DEFAULT_UNCLASSIFIED_SUBCATEGORY } from '../../../types/tag.types';
import { TIER_THEME_CONFIGS } from '../../tags/three-tier/IndependentTierColumn';
import { getEntityIcon } from '../../ui/TagPill';

export interface StagingStudioTierColumnProps {
  tier: CategoryTier;
  groups: { subCategory: string; tags: CategoryTag[] }[];
  stagedTagIds: string[];
  dragOverTagId: string | null;
  clipCountByTagId: Record<string, number>;
  collapsedSubKeys: Record<string, boolean>;
  onToggleCollapse: (subKey: string) => void;
  onToggleTag: (tagId: string) => void;
  onDragOver: (e: React.DragEvent, tagId: string) => void;
  onDragLeave: (e: React.DragEvent, tagId: string) => void;
  onDrop: (e: React.DragEvent, targetTagId: string) => void;
  isSearching: boolean;
}

export const StagingStudioTierColumn: React.FC<StagingStudioTierColumnProps> = ({
  tier,
  groups,
  stagedTagIds,
  dragOverTagId,
  clipCountByTagId,
  collapsedSubKeys,
  onToggleCollapse,
  onToggleTag,
  onDragOver,
  onDragLeave,
  onDrop,
  isSearching,
}) => {
  const theme = TIER_THEME_CONFIGS[tier];
  const totalTags = groups.reduce((acc, g) => acc + g.tags.length, 0);

  return (
    <div className="flex flex-col rounded-2xl border border-[#E5DED4] bg-white overflow-hidden shadow-2xs h-full">
      {/* Column Header */}
      <div
        className={`px-3 py-2 border-b ${theme.headerBorder} ${theme.headerBg} flex items-center justify-between gap-2 shrink-0`}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <span
            className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-extrabold ${theme.badgeBg} ${theme.badgeTextCls}`}
          >
            {theme.badgeText}
          </span>
          <span className={`text-xs font-extrabold ${theme.accentText} truncate`}>
            {theme.title}
          </span>
        </div>
        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-white/80 text-[#524538] border border-black/5 tabular-nums shrink-0">
          {totalTags} แท็ก
        </span>
      </div>

      {/* Sub-categories and Tag List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2 bg-[#FAF8F5] scrollbar-thin">
        {groups.length === 0 ? (
          <div className="p-4 text-center text-xs text-[#8C7B6C] italic bg-white/60 rounded-xl border border-dashed border-[#E5DED4]">
            ไม่พบแท็กใน {theme.badgeText}
          </div>
        ) : (
          groups.map(({ subCategory, tags: subTags }) => {
            const subKey = `${tier}__${subCategory}`;
            const isCollapsed = !isSearching && Boolean(collapsedSubKeys[subKey]);
            const isUnclassified = subCategory === DEFAULT_UNCLASSIFIED_SUBCATEGORY;

            return (
              <div
                key={subKey}
                className={`rounded-xl border overflow-hidden ${
                  isUnclassified
                    ? 'bg-[#FFFDF8] border-[#E8D2AE]'
                    : 'bg-white border-[#E5DED4]'
                }`}
              >
                {/* Subcategory Accordion Header */}
                <button
                  type="button"
                  onClick={() => onToggleCollapse(subKey)}
                  className={`w-full px-2.5 py-1.5 border-b flex items-center justify-between gap-1.5 text-left cursor-pointer transition-colors ${
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
                      หมวด: {subCategory}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-white text-[#6E5F52] border border-black/10 tabular-nums shrink-0">
                    {isCollapsed ? `กางดู (${subTags.length})` : subTags.length}
                  </span>
                </button>

                {/* SubTags Grid */}
                {!isCollapsed && (
                  <div className="p-2">
                    {subTags.length === 0 ? (
                      <p className="text-[11px] text-[#8C7B6C] italic text-center py-1">
                        ยังไม่มีแท็กในหมวดนี้
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {subTags.map((tag) => {
                          const isSelected = stagedTagIds.includes(tag.id);
                          const isDropHover = dragOverTagId === tag.id;
                          const clipCount = clipCountByTagId[tag.id] || 0;

                          return (
                            <button
                              key={tag.id}
                              type="button"
                              onClick={() => onToggleTag(tag.id)}
                              onDragOver={(e) => onDragOver(e, tag.id)}
                              onDragLeave={(e) => onDragLeave(e, tag.id)}
                              onDrop={(e) => onDrop(e, tag.id)}
                              className={`text-xs px-2.5 py-1 rounded-xl font-semibold inline-flex items-center gap-1 transition-all cursor-pointer active:scale-95 ${
                                isDropHover
                                  ? 'bg-[#EDF6EF] border-2 border-[#549364] text-[#164121] scale-105 shadow-md'
                                  : isSelected
                                  ? 'bg-[#3B6845] text-white font-bold border border-[#2D5236] shadow-2xs'
                                  : 'bg-[#FAF8F5] hover:bg-[#EDF6F0] text-[#4A3F31] border border-[#DFD7CA] hover:border-[#BAD8BF]'
                              }`}
                              title={
                                isSelected
                                  ? `คลิกเพื่อเอาแท็ก #${tag.name} ออก`
                                  : `คลิกเพื่อเลือกแท็ก #${tag.name} หรือลากคลิปมาหย่อน`
                              }
                            >
                              {isSelected ? (
                                <Check className="w-3 h-3 text-white shrink-0" />
                              ) : (
                                <span className="text-xs shrink-0">
                                  {getEntityIcon(tag) || <Plus className="w-2.5 h-2.5 text-[#78593A]" />}
                                </span>
                              )}
                              <span>#{tag.name}</span>
                              <span
                                className={`text-[10px] font-mono px-1 rounded tabular-nums ${
                                  isSelected
                                    ? 'bg-white/20 text-white'
                                    : 'bg-[#EFECE6] text-[#786B5C]'
                                }`}
                              >
                                {clipCount}
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
          })
        )}
      </div>
    </div>
  );
};
