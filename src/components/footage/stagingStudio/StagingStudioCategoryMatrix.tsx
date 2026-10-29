import React, { useMemo, useState } from 'react';
import {
  FolderInput,
  Layers,
  Search,
  Tag,
  X,
} from 'lucide-react';
import { useCMS } from '../../../context/CMSContext';
import { isStagingGroupId, isStagingTagId } from '../../../services/seedData';
import { CategoryGroupIcon } from '../../ui/CategoryGroupIcon';
import { getEntityIconNode } from '../../ui/TagPill';
import {
  CategoryGroupOverviewItem,
  MainCategoryOverviewItem,
} from '../vault/vault.types';

interface StagingStudioCategoryMatrixProps {
  categoryGroupsOverview: CategoryGroupOverviewItem[];
  mainCategoriesOverview: MainCategoryOverviewItem[];
  onQuickAssignCategory: (footageIds: string[], targetTagId: string) => void;
}

export const StagingStudioCategoryMatrix: React.FC<StagingStudioCategoryMatrixProps> = ({
  categoryGroupsOverview,
  mainCategoriesOverview,
  onQuickAssignCategory,
}) => {
  const {
    computedFootage,
    selectedFootageIdsForBatch,
    activeDragFootageIds,
  } = useCMS();

  const [activeGroupTab, setActiveGroupTab] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [dragOverTagId, setDragOverTagId] = useState<string | null>(null);

  const selectedCount = selectedFootageIdsForBatch.length;

  const realCategoryGroups = useMemo(() => {
    return categoryGroupsOverview.filter((g) => !isStagingGroupId(g.group.id));
  }, [categoryGroupsOverview]);

  const realMainCategories = useMemo(() => {
    return mainCategoriesOverview.filter((m) => !isStagingTagId(m.mainTag.id));
  }, [mainCategoriesOverview]);

  const visibleCategories = useMemo(() => {
    let list = realMainCategories;

    if (activeGroupTab !== 'ALL') {
      const groupObj = realCategoryGroups.find((g) => g.group.id === activeGroupTab);
      if (groupObj) {
        const allowedIds = new Set(
          groupObj.mainCategories
            .filter((mc) => !isStagingTagId(mc.mainTag.id))
            .map((mc) => mc.mainTag.id)
        );
        list = list.filter((m) => allowedIds.has(m.mainTag.id));
      }
    }

    if (searchQuery.trim() !== '') {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter((item) => {
        const matchMain = item.mainTag.name.toLowerCase().includes(q);
        const matchSub = item.subTags.some((sub) =>
          sub.name.toLowerCase().includes(q)
        );
        return matchMain || matchSub;
      });
    }

    return list;
  }, [realMainCategories, realCategoryGroups, activeGroupTab, searchQuery]);

  const extractDraggedFootageIds = (e: React.DragEvent): string[] => {
    try {
      const raw = e.dataTransfer.getData('application/x-footage-ids');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // Fallback
    }
    return activeDragFootageIds;
  };

  const handleDragOver = (e: React.DragEvent, tagId: string) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverTagId !== tagId) {
      setDragOverTagId(tagId);
    }
  };

  const handleDragLeave = (e: React.DragEvent, tagId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (dragOverTagId === tagId) {
      setDragOverTagId(null);
    }
  };

  const handleDrop = (e: React.DragEvent, targetTagId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverTagId(null);
    const ids = extractDraggedFootageIds(e);
    if (ids.length > 0) {
      onQuickAssignCategory(ids, targetTagId);
    }
  };

  const handleClickAssign = (targetTagId: string) => {
    if (selectedCount > 0) {
      onQuickAssignCategory(selectedFootageIdsForBatch, targetTagId);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-slate-50/70">
      {/* Top Header & Group Selector */}
      <div className="p-3 border-b border-slate-200/90 space-y-2 shrink-0 bg-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
              <FolderInput className="w-4 h-4 text-indigo-600" />
              <span>เลือกหมวดหมู่ปลายทาง</span>
            </span>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-800 border border-indigo-200 tabular-nums">
              {visibleCategories.length} หมวด
            </span>
          </div>

          <div className="relative w-full sm:w-56 shrink-0">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาหมวด..."
              className="w-full pl-8 pr-7 py-1 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Tier 0 Groups Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5 text-xs">
          <Layers className="w-3.5 h-3.5 text-indigo-600 shrink-0 mr-1" />

          <button
            type="button"
            onClick={() => setActiveGroupTab('ALL')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
              activeGroupTab === 'ALL'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            ทั้งหมด ({realMainCategories.length})
          </button>

          {realCategoryGroups.map((grp) => {
            const isTabActive = activeGroupTab === grp.group.id;
            return (
              <button
                key={grp.group.id}
                type="button"
                onClick={() => setActiveGroupTab(grp.group.id)}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
                  isTabActive
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <CategoryGroupIcon icon={grp.group.icon} className="w-3.5 h-3.5" />
                <span>{grp.group.name}</span>
                <span className="text-[10px] font-mono opacity-80 tabular-nums">
                  ({grp.mainCatCount})
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Categories Grid */}
      <div className="flex-1 overflow-y-auto p-3">
        {visibleCategories.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 bg-white rounded-xl border border-dashed border-slate-200">
            ไม่พบหมวดหมู่
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5">
            {visibleCategories.map((item) => {
              const isMainDragOver = dragOverTagId === item.mainTag.id;

              return (
                <div
                  key={item.mainTag.id}
                  onDragOver={(e) => handleDragOver(e, item.mainTag.id)}
                  onDragLeave={(e) => handleDragLeave(e, item.mainTag.id)}
                  onDrop={(e) => handleDrop(e, item.mainTag.id)}
                  className={`rounded-2xl border p-3 transition-all flex flex-col justify-between gap-2 bg-white ${
                    isMainDragOver
                      ? 'bg-emerald-50 border-2 border-emerald-500 text-emerald-950 scale-[1.01] shadow-md'
                      : selectedCount > 0
                      ? 'hover:border-indigo-400 border-slate-200 shadow-2xs'
                      : 'border-slate-200/90 hover:border-slate-300'
                  }`}
                >
                  {/* Tier 1 Header & 1-Click Action */}
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleClickAssign(item.mainTag.id)}
                      className="flex items-center gap-1.5 min-w-0 text-left flex-1 cursor-pointer group"
                    >
                      <Tag
                        className={`w-3.5 h-3.5 shrink-0 ${
                          isMainDragOver ? 'text-emerald-600' : 'text-indigo-600'
                        }`}
                      />
                      <span className="font-extrabold text-sm text-slate-900 group-hover:text-indigo-700 truncate">
                        #{item.mainTag.name}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-700 tabular-nums shrink-0">
                        {item.totalCount}
                      </span>
                    </button>

                    {selectedCount > 0 ? (
                      <button
                        type="button"
                        onClick={() => handleClickAssign(item.mainTag.id)}
                        className="px-2 py-0.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors cursor-pointer shrink-0"
                      >
                        + ย้าย
                      </button>
                    ) : isMainDragOver ? (
                      <span className="px-2 py-0.5 rounded-lg text-xs font-extrabold bg-emerald-600 text-white shrink-0">
                        วาง
                      </span>
                    ) : null}
                  </div>

                  {/* Tier 2 Subcategories */}
                  {item.subTags.length > 0 && (
                    <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-1">
                      {item.subTags.map((sub) => {
                        const isSubDragOver = dragOverTagId === sub.id;
                        const subCount = computedFootage.filter((ft) =>
                          ft.tags.includes(sub.id)
                        ).length;

                        return (
                          <button
                            key={sub.id}
                            type="button"
                            onDragOver={(e) => handleDragOver(e, sub.id)}
                            onDragLeave={(e) => handleDragLeave(e, sub.id)}
                            onDrop={(e) => handleDrop(e, sub.id)}
                            onClick={() => handleClickAssign(sub.id)}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                              isSubDragOver
                                ? 'bg-emerald-100 text-emerald-950 border-2 border-emerald-500 scale-105 font-bold'
                                : selectedCount > 0
                                ? 'bg-slate-50 hover:bg-indigo-50 text-indigo-950 border-slate-200 hover:border-indigo-400'
                                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            {getEntityIconNode(sub)}
                            <span className="truncate max-w-[130px]">{sub.name}</span>
                            <span className="font-mono text-[10px] text-slate-500 tabular-nums">
                              ({subCount})
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
