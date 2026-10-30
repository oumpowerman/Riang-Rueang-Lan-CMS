import React from 'react';
import { Layers, Sparkles } from 'lucide-react';
import { useCMS } from '../../../../context/CMSContext';
import { isStagingGroupId } from '../../../../services/seedData';
import type { CategoryGroup } from '../../../../types/tag.types';
import type { CategoryRankingItem } from '../hooks/useMasterArchiveMetrics';

interface SeriesNavigationFilterBarProps {
  selectedGroupId: string;
  onSelectGroup: (groupId: string) => void;
  categoryFilter: string;
  onSelectCategory: (catId: string) => void;
  categoriesInGroup: CategoryRankingItem[];
  groupEpisodeCounts: Record<string, number>;
}

export const SeriesNavigationFilterBar: React.FC<SeriesNavigationFilterBarProps> = ({
  selectedGroupId,
  onSelectGroup,
  categoryFilter,
  onSelectCategory,
  categoriesInGroup,
  groupEpisodeCounts,
}) => {
  const { episodes, categoryGroups } = useCMS();

  return (
    <div className="bg-[#FAF7F2] border border-[#E8DFD3] rounded-2xl p-3 sm:p-4 shadow-2xs space-y-3">
      {/* Tier 0 Group Level Filter */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold text-[#3D3731] flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-[#8A5A22]" />
            <span>1. เลือกกลุ่มหมวดหมู่หลัก (Tier 0 Category Groups)</span>
          </span>
          <span className="text-[11px] text-[#787066] font-mono">
            {categoryGroups.filter((g: CategoryGroup) => !isStagingGroupId(g.id)).length} กลุ่ม
          </span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-earth">
          <button
            type="button"
            onClick={() => {
              onSelectGroup('ALL');
              onSelectCategory('ALL');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center gap-1.5 border ${
              selectedGroupId === 'ALL'
                ? 'bg-[#F8ECDA] text-[#664214] border-[#DEC190] shadow-2xs'
                : 'bg-white text-[#4D4740] hover:bg-[#FAF3E8] border-[#E4DDD3]'
            }`}
          >
            <span>ทุกกลุ่ม</span>
            <span
              className={`px-1.5 py-0.5 rounded-full font-mono text-[10px] ${
                selectedGroupId === 'ALL'
                  ? 'bg-[#EDD8B4] text-[#5C3A0E] font-bold'
                  : 'bg-[#F2ECE4] text-[#6E665E]'
              }`}
            >
              {episodes.length}
            </span>
          </button>

          {categoryGroups
            .filter((grp: CategoryGroup) => !isStagingGroupId(grp.id))
            .map((grp: CategoryGroup) => {
              const isSelected = selectedGroupId === grp.id;
              const grpEpCount = groupEpisodeCounts[grp.id] || 0;

              return (
                <button
                  key={grp.id}
                  type="button"
                  onClick={() => {
                    onSelectGroup(grp.id);
                    onSelectCategory('ALL');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs shrink-0 transition-all cursor-pointer flex items-center gap-1.5 border ${
                    isSelected
                      ? 'bg-[#F8ECDA] text-[#664214] border-[#DEC190] font-bold shadow-2xs'
                      : 'bg-white text-[#4D4740] hover:bg-[#FAF3E8] border-[#E4DDD3] font-medium'
                  }`}
                >
                  <span>{grp.name}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded-full font-mono text-[10px] ${
                      isSelected
                        ? 'bg-[#EDD8B4] text-[#5C3A0E] font-bold'
                        : 'bg-[#F2ECE4] text-[#6E665E]'
                    }`}
                  >
                    {grpEpCount}
                  </span>
                </button>
              );
            })}
        </div>
      </div>

      {/* Tier 1 Series Level Filter (Only shows series in selected group) */}
      <div className="pt-2 border-t border-[#EAE0D2] space-y-1.5">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold text-[#3D3731] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#386B46]" />
            <span>
              2. เลือกซีรีส์เฉพาะ ({categoriesInGroup.length} ซีรีส์ในกลุ่มนี้)
            </span>
          </span>
          {categoryFilter !== 'ALL' && (
            <button
              type="button"
              onClick={() => onSelectCategory('ALL')}
              className="text-[11px] font-bold text-[#785324] hover:underline cursor-pointer"
            >
              ดูทุกซีรีส์ในกลุ่มนี้
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-earth">
          <button
            type="button"
            onClick={() => onSelectCategory('ALL')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center gap-1 border ${
              categoryFilter === 'ALL'
                ? 'bg-[#E6F2E6] text-[#224A2D] border-[#9EC49C] shadow-2xs'
                : 'bg-white text-[#4D4740] hover:bg-[#F2F7F2] border-[#E4DDD3]'
            }`}
          >
            <span>
              ทั้งหมด ({categoriesInGroup.reduce((sum, c) => sum + c.episodeCount, 0)})
            </span>
          </button>

          {categoriesInGroup.map((item) => {
            const isSelected = categoryFilter === item.mainTag.id;
            return (
              <button
                key={item.mainTag.id}
                type="button"
                onClick={() => onSelectCategory(item.mainTag.id)}
                className={`px-2.5 py-1 rounded-lg text-xs shrink-0 transition-all cursor-pointer flex items-center gap-1.5 border ${
                  isSelected
                    ? 'bg-[#E6F2E6] text-[#224A2D] border-[#9EC49C] font-bold shadow-2xs'
                    : 'bg-white text-[#4D4740] hover:bg-[#F2F7F2] border-[#E4DDD3] font-medium'
                }`}
              >
                <span>#{item.mainTag.name}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full font-mono text-[10px] ${
                    isSelected
                      ? 'bg-[#CCE3CC] text-[#1D4026] font-bold'
                      : 'bg-[#F2ECE4] text-[#6E665E]'
                  }`}
                >
                  {item.episodeCount}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
