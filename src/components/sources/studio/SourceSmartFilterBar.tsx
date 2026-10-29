import React from 'react';
import { motion } from 'motion/react';
import {
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  Layers,
  RotateCcw,
  Search,
  Tag,
  Video,
  X,
} from 'lucide-react';
import { CategoryGroup, CategoryTag } from '../../../types/tag.types';
import { TagPill } from '../../ui/TagPill';
import { PlatformFilterOption, SourceSortOption } from './sourceStudio.types';

interface SourceSmartFilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  platformFilter: PlatformFilterOption;
  onPlatformFilterChange: (platform: PlatformFilterOption) => void;
  sortBy: SourceSortOption;
  onSortByChange: (sort: SourceSortOption) => void;
  selectedGroupId: string;
  onSelectGroupId: (groupId: string) => void;
  tagsCount: number;
  categoryGroups: CategoryGroup[];
  showAllTags: boolean;
  onToggleShowAllTags: (show: boolean) => void;
  visibleTagsForBar: CategoryTag[];
  tagSourceCounts: Record<string, number>;
  selectedTags: string[];
  onToggleTag: (tagId: string) => void;
  hiddenZeroTagCount: number;
  filteredSourcesCount: number;
  hasActiveFilters: boolean;
  onResetFilters: () => void;
}

export const SourceSmartFilterBar: React.FC<SourceSmartFilterBarProps> = ({
  searchQuery,
  onSearchChange,
  platformFilter,
  onPlatformFilterChange,
  sortBy,
  onSortByChange,
  selectedGroupId,
  onSelectGroupId,
  categoryGroups,
  showAllTags,
  onToggleShowAllTags,
  visibleTagsForBar,
  tagSourceCounts,
  selectedTags,
  onToggleTag,
  hiddenZeroTagCount,
  filteredSourcesCount,
  hasActiveFilters,
  onResetFilters,
}) => {
  return (
    <div className="border border-slate-200/90 rounded-2xl p-3.5 space-y-2.5 bg-white shadow-2xs">
      {/* Top Row: Search, Platform, Sort */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="ค้นหารหัส, ชื่อไลฟ์, ช่อง..."
            className="w-full pl-9 pr-8 py-1.5 text-xs sm:text-sm bg-slate-50/80 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-400 focus:bg-white text-slate-800"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 p-1 bg-slate-100/90 rounded-xl">
            {(
              [
                { id: 'ALL', label: 'ทั้งหมด' },
                { id: 'FACEBOOK', label: 'Facebook' },
                { id: 'YOUTUBE', label: 'YouTube' },
                { id: 'TIKTOK', label: 'TikTok' },
              ] as const
            ).map((plat) => (
              <motion.button
                key={plat.id}
                type="button"
                whileTap={{ scale: 0.95 }}
                onClick={() => onPlatformFilterChange(plat.id)}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                  platformFilter === plat.id
                    ? 'bg-white text-indigo-950 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {plat.label}
              </motion.button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => onSortByChange(e.target.value as SourceSortOption)}
              className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="NEWEST">ล่าสุด</option>
              <option value="MOST_USABLE">พร้อมใช้มากสุด</option>
              <option value="MOST_CLIPS">คลิปย่อยมากสุด</option>
              <option value="LEAST_MINED">หั่นน้อยสุด</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tier 0: Category Group Tabs */}
      <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-indigo-600 shrink-0 mr-0.5" />
          <button
            type="button"
            onClick={() => onSelectGroupId('ALL')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              selectedGroupId === 'ALL'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            ทุกกลุ่ม
          </button>
          {categoryGroups.map((grp) => (
            <button
              key={grp.id}
              type="button"
              onClick={() => onSelectGroupId(grp.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                selectedGroupId === grp.id
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {grp.name}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <span className="text-xs font-mono font-bold text-slate-700 inline-flex items-center gap-1">
            <Video className="w-3.5 h-3.5 text-indigo-600" />
            <span>{filteredSourcesCount} ไลฟ์</span>
          </span>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-xs font-bold text-rose-600 border border-rose-200/80 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>ล้าง</span>
            </button>
          )}
        </div>
      </div>

      {/* Smart Active Tags Bar */}
      <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-1.5">
        <Tag className="w-3.5 h-3.5 text-slate-400 shrink-0 mr-0.5" />

        {visibleTagsForBar.length === 0 ? (
          <span className="text-xs text-slate-400">ไม่มีหมวดที่มีคลิป</span>
        ) : (
          visibleTagsForBar.map((tag) => (
            <TagPill
              key={tag.id}
              tag={tag}
              count={tagSourceCounts[tag.id] || 0}
              selected={selectedTags.includes(tag.id)}
              onClick={() => onToggleTag(tag.id)}
            />
          ))
        )}

        {hiddenZeroTagCount > 0 && !showAllTags && (
          <button
            type="button"
            onClick={() => onToggleShowAllTags(true)}
            className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors cursor-pointer"
          >
            <ChevronDown className="w-3 h-3" />
            <span>+ หมวดว่าง ({hiddenZeroTagCount})</span>
          </button>
        )}

        {showAllTags && (
          <button
            type="button"
            onClick={() => onToggleShowAllTags(false)}
            className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors cursor-pointer"
          >
            <ChevronUp className="w-3 h-3" />
            <span>ซ่อนหมวดว่าง</span>
          </button>
        )}
      </div>
    </div>
  );
};
