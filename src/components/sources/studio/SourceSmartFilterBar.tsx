import React from 'react';
import { motion } from 'motion/react';
import {
  ChevronDown,
  ChevronUp,
  Layers,
  RotateCcw,
  Search,
  Tag,
  Video,
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
  tagsCount,
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
    <div className="studio-card border border-slate-200/90 rounded-2xl p-4 space-y-3 bg-white">
      {/* Top Row: Search, Platform, Sort */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="ค้นหารหัส SRC-XXXX, ชื่อไลฟ์สด, ช่องต้นทาง หรือชื่อฟุตย่อยที่หั่นออกมา..."
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-900 focus:bg-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-xl">
          {(
            [
              { id: 'ALL', label: 'ทุกแพลตฟอร์ม' },
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
              className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                platformFilter === plat.id
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {plat.label}
            </motion.button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-600 whitespace-nowrap">
            เรียงตาม:
          </span>
          <select
            value={sortBy}
            onChange={(e) => onSortByChange(e.target.value as SourceSortOption)}
            className="px-3 py-1.5 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none cursor-pointer"
          >
            <option value="NEWEST">วันที่เพิ่มล่าสุด</option>
            <option value="MOST_USABLE">มีฟุตพร้อมใช้มากสุด</option>
            <option value="MOST_CLIPS">หั่นฟุตย่อยได้เยอะสุด</option>
            <option value="LEAST_MINED">ไลฟ์ที่ยังหั่นน้อยสุด (รอขุดเพิ่ม)</option>
          </select>
        </div>
      </div>

      {/* Tier 0: Category Group Tabs */}
      <div className="pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-bold text-slate-500 mr-1 inline-flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-indigo-600" />
            <span>กลุ่มหมวดใหญ่ (Tier 0):</span>
          </span>
          <button
            type="button"
            onClick={() => onSelectGroupId('ALL')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              selectedGroupId === 'ALL'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            ทุกกลุ่มหมวด ({tagsCount})
          </button>
          {categoryGroups.map((grp) => (
            <button
              key={grp.id}
              type="button"
              onClick={() => onSelectGroupId(grp.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                selectedGroupId === grp.id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {grp.name}
            </button>
          ))}
        </div>

        <span className="text-[11px] text-slate-500">
          *รองรับการค้นหาลึกถึงหมวดของฟุตย่อยที่หั่นออกมาในไลฟ์นั้นด้วย
        </span>
      </div>

      {/* Smart Active Tags Bar (with counts + collapse/expand 54+ tags) */}
      <div className="pt-2.5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5 flex-1">
          <span className="text-xs font-semibold text-slate-500 mr-1 inline-flex items-center gap-1">
            <Tag className="w-3.5 h-3.5 text-slate-400" />
            <span>
              {showAllTags
                ? 'ทุกหมวดหมู่ทั้งหมด:'
                : 'หมวดที่มีไลฟ์ต้นฉบับหรือฟุตย่อยอยู่จริง:'}
            </span>
          </span>

          {visibleTagsForBar.length === 0 ? (
            <span className="text-xs text-slate-400 italic">
              ยังไม่มีคลิปต้นฉบับในกลุ่มหมวดนี้
            </span>
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
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors cursor-pointer"
            >
              <ChevronDown className="w-3.5 h-3.5" />
              <span>+ ดูทุกหมวดทั้งหมด (+{hiddenZeroTagCount} หมวดว่าง)</span>
            </button>
          )}

          {showAllTags && (
            <button
              type="button"
              onClick={() => onToggleShowAllTags(false)}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors cursor-pointer"
            >
              <ChevronUp className="w-3.5 h-3.5" />
              <span>ย่อแสดงเฉพาะหมวดที่มีคลิป</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
          <span className="text-xs font-mono font-bold text-slate-700 inline-flex items-center gap-1.5">
            <Video className="w-3.5 h-3.5 text-indigo-600" />
            <span>พบ {filteredSourcesCount} คลิปต้นฉบับยาว</span>
          </span>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-800 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>ล้างตัวกรอง</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
