import React, { useMemo, useState } from 'react';
import {
  Search,
  Tag,
  X,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  ExternalLink,
  MessageSquare,
  CheckCircle2,
  Check,
  Plus,
  Layers,
} from 'lucide-react';
import { useCMS } from '../../../context/CMSContext';
import { isStagingTagId } from '../../../services/seedData';
import { ComputedFootage } from '../../../types/footage.types';
import {
  CategoryTag,
  CategoryTier,
  DEFAULT_TIER_SUBCATEGORIES,
  DEFAULT_UNCLASSIFIED_SUBCATEGORY,
} from '../../../types/tag.types';
import { hasRealDriveLink } from '../../../utils/fileNameGenerator';
import { GoogleDriveIcon } from '../../ui/GoogleDriveIcon';
import { VideoThumbnailPreview } from '../VideoThumbnailPreview';
import { StagingStudioTierColumn } from './StagingStudioTierColumn';

interface StagingStudioCategoryMatrixProps {
  activeFootage: ComputedFootage | null;
  activeFootageIndex: number;
  totalStagingCount: number;
  stagedTagIds: string[];
  onToggleTag: (tagId: string) => void;
  onClearStagedTags: () => void;
  onSaveAndAdvance: () => void;
  onQuickAssignCategory: (footageIds: string[], targetTagId: string) => void;
  onSkipNext: () => void;
  onSkipPrev: () => void;
  isAutoAdvanceEnabled: boolean;
  onToggleAutoAdvance: () => void;
}

export const StagingStudioCategoryMatrix: React.FC<StagingStudioCategoryMatrixProps> = ({
  activeFootage,
  activeFootageIndex,
  totalStagingCount,
  stagedTagIds,
  onToggleTag,
  onClearStagedTags,
  onSaveAndAdvance,
  onQuickAssignCategory,
  onSkipNext,
  onSkipPrev,
  isAutoAdvanceEnabled,
  onToggleAutoAdvance,
}) => {
  const {
    tags,
    computedFootage,
    selectedFootageIdsForBatch,
    activeDragFootageIds,
    tierSubCategories = DEFAULT_TIER_SUBCATEGORIES,
    setPreviewFootageId,
  } = useCMS();

  const [searchQuery, setSearchQuery] = useState('');
  const [dragOverTagId, setDragOverTagId] = useState<string | null>(null);
  const [collapsedSubKeys, setCollapsedSubKeys] = useState<Record<string, boolean>>(() => ({
    [`1__${DEFAULT_UNCLASSIFIED_SUBCATEGORY}`]: true,
  }));

  const selectedCount = selectedFootageIdsForBatch.length;

  const realTags = useMemo(() => {
    return tags.filter((t) => !isStagingTagId(t.id));
  }, [tags]);

  const tagMap = useMemo(() => {
    const map: Record<string, CategoryTag> = {};
    realTags.forEach((t) => {
      map[t.id] = t;
    });
    return map;
  }, [realTags]);

  // Compute how many clips have each tag
  const clipCountByTagId = useMemo(() => {
    const counts: Record<string, number> = {};
    computedFootage.forEach((ft) => {
      ft.tags.forEach((tid) => {
        counts[tid] = (counts[tid] || 0) + 1;
      });
    });
    return counts;
  }, [computedFootage]);

  // Dynamic Tag Suggestions: Match keywords from activeFootage title & mascotNotes
  const suggestedTags = useMemo(() => {
    if (!activeFootage) return [];
    const textToSearch = `${activeFootage.title} ${activeFootage.mascotNotes || ''}`.toLowerCase();
    const suggestions: CategoryTag[] = [];

    realTags.forEach((t) => {
      const name = t.name.toLowerCase();
      if (name.length >= 2 && textToSearch.includes(name)) {
        suggestions.push(t);
      }
    });

    return suggestions.slice(0, 8);
  }, [realTags, activeFootage]);

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

  const handleToggleCollapse = (subKey: string) => {
    setCollapsedSubKeys((prev) => ({
      ...prev,
      [subKey]: !prev[subKey],
    }));
  };

  // Helper function to build tier groups for Tier 1, 2, 3
  const buildTierGroups = (tier: CategoryTier, subList: string[]) => {
    const q = searchQuery.trim().toLowerCase();
    const tierTags = realTags.filter((t) => {
      const tTier = t.tier === 2 || t.tier === 3 ? t.tier : 1;
      if (tTier !== tier) return false;
      if (!q) return true;
      return (
        t.name.toLowerCase().includes(q) ||
        (t.subCategory || '').toLowerCase().includes(q)
      );
    });

    const map: Record<string, CategoryTag[]> = {};
    subList.forEach((sc) => {
      map[sc] = [];
    });

    tierTags.forEach((t) => {
      const sub = (t.subCategory || DEFAULT_UNCLASSIFIED_SUBCATEGORY).trim();
      if (!map[sub]) {
        map[sub] = [];
      }
      map[sub].push(t);
    });

    const keys = Array.from(new Set([...subList, ...Object.keys(map)]));
    return keys
      .map((subCategory) => ({
        subCategory,
        tags: (map[subCategory] || []).sort((a, b) => {
          const countA = clipCountByTagId[a.id] || 0;
          const countB = clipCountByTagId[b.id] || 0;
          return countB - countA;
        }),
      }))
      .filter((g) => !q || g.tags.length > 0);
  };

  const tier1Groups = useMemo(
    () => buildTierGroups(1, tierSubCategories.tier1),
    [realTags, tierSubCategories.tier1, searchQuery, clipCountByTagId]
  );
  const tier2Groups = useMemo(
    () => buildTierGroups(2, tierSubCategories.tier2),
    [realTags, tierSubCategories.tier2, searchQuery, clipCountByTagId]
  );
  const tier3Groups = useMemo(
    () => buildTierGroups(3, tierSubCategories.tier3),
    [realTags, tierSubCategories.tier3, searchQuery, clipCountByTagId]
  );

  const hasDrive = activeFootage ? hasRealDriveLink(activeFootage.driveFileUrl) : false;
  const progressPercent = totalStagingCount > 0
    ? Math.round(((activeFootageIndex + 1) / totalStagingCount) * 100)
    : 100;

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#fdfbf7]">
      {/* 1. Active Footage Inspector & Queue Bar */}
      {activeFootage && (
        <div className="p-3 border-b border-[#e8dfd3] bg-[#ffffff] shadow-2xs shrink-0 space-y-2">
          {/* Top Status & Queue Controls */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-bold bg-[#eef5ee] text-[#2c5c36] border border-[#bad8bf]">
                <Sparkles className="w-3 h-3 text-[#3b6845]" />
                <span>กำลังจัดคลิปที่ {activeFootageIndex + 1} จาก {totalStagingCount}</span>
              </span>
              {selectedCount > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold bg-[#fdf4eb] text-[#8a4d1f] border border-[#ebd1be]">
                  เลือกไว้ {selectedCount} คลิป (จะบันทึกพร้อมกัน)
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onToggleAutoAdvance}
                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold border transition-colors cursor-pointer ${
                  isAutoAdvanceEnabled
                    ? 'bg-[#eef5ee] text-[#254b2d] border-[#bad8bf]'
                    : 'bg-[#faf7f2] text-[#7d6e61] border-[#e2d5c4]'
                }`}
                title="เมื่อกดบันทึก จะเลื่อนไปคลิปถัดไปทันที"
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isAutoAdvanceEnabled ? 'bg-[#3b6845]' : 'bg-[#a39485]'}`} />
                <span>เลื่อนต่อทันที: {isAutoAdvanceEnabled ? 'เปิด' : 'ปิด'}</span>
              </button>
            </div>
          </div>

          {/* Progress Bar Line */}
          <div className="w-full bg-[#f0e8de] h-1 rounded-full overflow-hidden">
            <div
              className="bg-[#3b6845] h-full rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Unified Compact Workspace Card */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 bg-[#faf7f2] p-2.5 rounded-xl border border-[#ebe2d5]">
            {/* Left: Video Preview */}
            <div className="shrink-0 flex items-center justify-center">
              <VideoThumbnailPreview
                footage={activeFootage}
                size="md"
                onClick={() => setPreviewFootageId(activeFootage.id)}
              />
            </div>

            {/* Middle: Details & Staged Tag Chips */}
            <div className="min-w-0 flex-1 space-y-1.5">
              {/* Row 1: Code, Title & Drive Link */}
              <div className="flex items-center gap-2 flex-wrap min-w-0">
                <span className="font-mono text-xs font-bold px-1.5 py-0.5 rounded bg-white text-[#524538] border border-[#e3d8cb] tabular-nums">
                  {activeFootage.id}
                </span>
                <span className="text-xs text-[#7d6e61] font-mono truncate max-w-xs" title={activeFootage.standardFileName}>
                  {activeFootage.standardFileName}
                </span>

                {hasDrive && (
                  <a
                    href={activeFootage.driveFileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#254b2d] bg-[#eef5ee] hover:bg-[#e2ede3] px-2 py-0.5 rounded border border-[#bad8bf] transition-colors"
                  >
                    <GoogleDriveIcon className="w-3 h-3" />
                    <span>เปิด Drive</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                )}
              </div>

              {/* Title & Mascot Note */}
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-extrabold text-[#3d332a] truncate max-w-md" title={activeFootage.title}>
                  {activeFootage.title}
                </h3>
                {activeFootage.mascotNotes && (
                  <div className="flex items-center gap-1 text-xs text-[#6e5f52] bg-white/80 px-2 py-0.5 rounded border border-[#ebe2d5] max-w-xs truncate">
                    <MessageSquare className="w-3 h-3 text-[#8a5a22] shrink-0" />
                    <span className="italic truncate">{activeFootage.mascotNotes}</span>
                  </div>
                )}
              </div>

              {/* Row 2: Selected Tags Tray with Tier Badges */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-[#ebdcd0]">
                <span className="text-xs font-extrabold text-[#3d332a] shrink-0 flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-[#3b6845]" />
                  <span>แท็กที่เลือก:</span>
                  <span
                    className={`text-[11px] font-mono font-bold px-1.5 py-0.2 rounded tabular-nums ${
                      stagedTagIds.length > 0
                        ? 'bg-[#eef5ee] text-[#1c4824] border border-[#bad8bf]'
                        : 'bg-white text-[#8c7b6c] border border-[#e3d8cb]'
                    }`}
                  >
                    {stagedTagIds.length}
                  </span>
                </span>

                {stagedTagIds.length > 0 ? (
                  <div className="flex items-center gap-1 flex-wrap">
                    {Array.from(new Set(stagedTagIds)).map((tid) => {
                      const tagObj = tagMap[tid];
                      const name = tagObj ? tagObj.name : tid;
                      const tier = tagObj?.tier === 2 ? 2 : tagObj?.tier === 3 ? 3 : 1;
                      const badgeCls =
                        tier === 1
                          ? 'bg-[#eef5fb] text-[#184366] border-[#c5dcef]'
                          : tier === 2
                          ? 'bg-[#fef6e8] text-[#6b4415] border-[#e8cfa6]'
                          : 'bg-[#edf6f0] text-[#1d4d2b] border-[#bfe0c8]';

                      return (
                        <span
                          key={tid}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold border shadow-2xs ${badgeCls}`}
                        >
                          <span className="text-[10px] opacity-75 font-mono">T{tier}</span>
                          <span>#{name}</span>
                          <button
                            type="button"
                            onClick={() => onToggleTag(tid)}
                            className="p-0.5 rounded hover:bg-black/10 text-current cursor-pointer transition-colors"
                            title="เอาแท็กนี้ออก"
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </span>
                      );
                    })}
                    <button
                      type="button"
                      onClick={onClearStagedTags}
                      className="text-[11px] font-semibold text-[#8c7b6c] hover:text-[#b34033] cursor-pointer transition-colors px-1"
                    >
                      ล้าง
                    </button>
                  </div>
                ) : (
                  <span className="text-xs text-[#8c7b6c] italic">
                    (เลือกแท็กได้อย่างอิสระจาก Tier 1, Tier 2 และ Tier 3 ด้านล่าง)
                  </span>
                )}
              </div>
            </div>

            {/* Right: Actions Controls & Primary Save Button */}
            <div className="shrink-0 flex flex-col sm:flex-row lg:flex-col items-end sm:items-center lg:items-end justify-between gap-2 pt-2 lg:pt-0 lg:pl-3 lg:border-l border-[#ebdcd0]">
              {/* Skip / Prev Navigation */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={onSkipPrev}
                  disabled={totalStagingCount <= 1}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold bg-white hover:bg-[#f3ede3] text-[#524538] border border-[#e2d6c7] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  title="ย้อนกลับคลิปก่อนหน้า"
                >
                  <ChevronLeft className="w-3 h-3" />
                  <span className="hidden sm:inline">ก่อนหน้า</span>
                </button>
                <button
                  type="button"
                  onClick={onSkipNext}
                  disabled={totalStagingCount <= 1}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold bg-white hover:bg-[#f3ede3] text-[#524538] border border-[#e2d6c7] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  title="ข้ามคลิปนี้ไปก่อน"
                >
                  <span>ข้าม</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>

              {/* Primary Save & Next Button */}
              <button
                type="button"
                onClick={onSaveAndAdvance}
                disabled={stagedTagIds.length === 0}
                className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  stagedTagIds.length > 0
                    ? 'bg-[#3b6845] hover:bg-[#2d5236] text-white shadow-xs hover:shadow-md active:scale-98'
                    : 'bg-[#e5ded4] text-[#8e8174] border border-[#d8cfc3] cursor-not-allowed opacity-70'
                }`}
                title={
                  stagedTagIds.length > 0
                    ? 'กด Enter หรือคลิกเพื่อบันทึกและไปคลิปถัดไป'
                    : 'กรุณาเลือกอย่างน้อย 1 แท็กก่อนบันทึก'
                }
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>
                  {selectedCount > 0
                    ? `บันทึก ${stagedTagIds.length} แท็ก (${selectedCount} คลิป) ➔`
                    : `บันทึก ${stagedTagIds.length} แท็ก & ถัดไป ➔`}
                </span>
                <kbd className="hidden sm:inline-block px-1 py-0.2 rounded text-[10px] font-mono bg-black/15 text-white">
                  Enter
                </kbd>
              </button>
            </div>
          </div>

          {/* Compact Suggested Tags Row */}
          {suggestedTags.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap pt-0.5 text-xs">
              <span className="inline-flex items-center gap-1 font-extrabold text-[#2c5c36] shrink-0">
                <Sparkles className="w-3 h-3 text-[#3b6845]" />
                <span>แนะนำตรงกับคลิป:</span>
              </span>
              {suggestedTags.map((tag) => {
                const isSelected = stagedTagIds.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => onToggleTag(tag.id)}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold transition-all cursor-pointer active:scale-95 ${
                      isSelected
                        ? 'bg-[#3b6845] text-white border border-[#3b6845]'
                        : 'bg-[#eef5ee] hover:bg-[#e2ede3] text-[#254b2d] border border-[#bad8bf]'
                    }`}
                    title={isSelected ? `คลิกเพื่อเอาแท็ก #${tag.name} ออก` : `คลิกเพื่อเลือกแท็ก #${tag.name}`}
                  >
                    {isSelected ? (
                      <Check className="w-3 h-3 text-white" />
                    ) : (
                      <Plus className="w-2.5 h-2.5 text-[#3b6845]" />
                    )}
                    <span>#{tag.name}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 2. Global Search & 3-Tier Independent Header */}
      <div className="p-3 border-b border-[#e8dfd3] flex flex-col sm:flex-row sm:items-center justify-between gap-2 shrink-0 bg-[#faf7f2]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-[#eef5ee] border border-[#bad8bf] flex items-center justify-center shrink-0">
            <Layers className="w-3.5 h-3.5 text-[#2c5c36]" />
          </div>
          <div>
            <span className="font-extrabold text-xs sm:text-sm text-[#3d332a]">
              ระบบแท็ก 3 ชั้นอิสระ (Faceted Tagging)
            </span>
            <span className="text-[11px] text-[#7d6e61] hidden md:inline ml-2">
              (เลือกผสมแท็กข้าม Tier ได้อย่างเสรี เพื่อความหลากหลายและจัดอันดับได้แม่นยำ)
            </span>
          </div>
        </div>

        <div className="relative w-full sm:w-72 shrink-0">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#998a7c]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาแท็กในทั้ง 3 Tier พร้อมกัน..."
            className="w-full pl-8 pr-7 py-1 text-xs rounded-lg border border-[#e3d8cb] bg-white text-[#3d332a] placeholder:text-[#a89b8d] focus:outline-none focus:ring-1.5 focus:ring-[#8fa892] focus:border-[#8fa892] transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[#998a7c] hover:text-[#524538] cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 3. 3-Tier Independent Columns Grid */}
      <div className="flex-1 overflow-y-auto p-3 grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Tier 1 Column */}
        <StagingStudioTierColumn
          tier={1}
          groups={tier1Groups}
          stagedTagIds={stagedTagIds}
          dragOverTagId={dragOverTagId}
          clipCountByTagId={clipCountByTagId}
          collapsedSubKeys={collapsedSubKeys}
          onToggleCollapse={handleToggleCollapse}
          onToggleTag={onToggleTag}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          isSearching={Boolean(searchQuery.trim())}
        />

        {/* Tier 2 Column */}
        <StagingStudioTierColumn
          tier={2}
          groups={tier2Groups}
          stagedTagIds={stagedTagIds}
          dragOverTagId={dragOverTagId}
          clipCountByTagId={clipCountByTagId}
          collapsedSubKeys={collapsedSubKeys}
          onToggleCollapse={handleToggleCollapse}
          onToggleTag={onToggleTag}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          isSearching={Boolean(searchQuery.trim())}
        />

        {/* Tier 3 Column */}
        <StagingStudioTierColumn
          tier={3}
          groups={tier3Groups}
          stagedTagIds={stagedTagIds}
          dragOverTagId={dragOverTagId}
          clipCountByTagId={clipCountByTagId}
          collapsedSubKeys={collapsedSubKeys}
          onToggleCollapse={handleToggleCollapse}
          onToggleTag={onToggleTag}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          isSearching={Boolean(searchQuery.trim())}
        />
      </div>
    </div>
  );
};
