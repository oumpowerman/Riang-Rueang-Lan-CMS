import React, { useMemo, useState } from 'react';
import {
  FolderInput,
  Layers,
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
} from 'lucide-react';
import { useCMS } from '../../../context/CMSContext';
import { isStagingGroupId, isStagingTagId } from '../../../services/seedData';
import { ComputedFootage } from '../../../types/footage.types';
import { hasRealDriveLink } from '../../../utils/fileNameGenerator';
import { CategoryGroupIcon } from '../../ui/CategoryGroupIcon';
import { GoogleDriveIcon } from '../../ui/GoogleDriveIcon';
import { getEntityIconNode } from '../../ui/TagPill';
import {
  CategoryGroupOverviewItem,
  MainCategoryOverviewItem,
} from '../vault/vault.types';
import { VideoThumbnailPreview } from '../VideoThumbnailPreview';

interface StagingStudioCategoryMatrixProps {
  activeFootage: ComputedFootage | null;
  activeFootageIndex: number;
  totalStagingCount: number;
  categoryGroupsOverview: CategoryGroupOverviewItem[];
  mainCategoriesOverview: MainCategoryOverviewItem[];
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
  categoryGroupsOverview,
  mainCategoriesOverview,
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
    setPreviewFootageId,
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

  // Dynamic Tag Suggestions: Match keywords from activeFootage title & mascotNotes
  const suggestedTags = useMemo(() => {
    if (!activeFootage) return [];
    const validTags = tags.filter((t) => !isStagingTagId(t.id));
    const textToSearch = `${activeFootage.title} ${activeFootage.mascotNotes || ''}`.toLowerCase();
    const suggestions: typeof validTags = [];

    validTags.forEach((t) => {
      const name = t.name.toLowerCase();
      if (name.length >= 2 && textToSearch.includes(name)) {
        suggestions.push(t);
      }
    });

    return suggestions.slice(0, 8);
  }, [tags, activeFootage]);

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

  const hasDrive = activeFootage ? hasRealDriveLink(activeFootage.driveFileUrl) : false;
  const progressPercent = totalStagingCount > 0
    ? Math.round(((activeFootageIndex + 1) / totalStagingCount) * 100)
    : 100;

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#fdfbf7]">
      {/* 1. Active Footage Inspector & Queue Bar (Compact Unified Pastel Card) */}
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

          {/* Unified Compact Workspace Card: Video Thumbnail + Clip Info + Staged Tags + Actions */}
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

              {/* Row 2: Selected Tags Tray (Merged right here) */}
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
                    {stagedTagIds.map((tid) => {
                      const tagObj = tags.find((t) => t.id === tid);
                      const name = tagObj ? tagObj.name : tid;
                      return (
                        <span
                          key={tid}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold bg-[#eef5ee] text-[#1d4725] border border-[#bad8bf] shadow-2xs"
                        >
                          <span>#{name}</span>
                          <button
                            type="button"
                            onClick={() => onToggleTag(tid)}
                            className="p-0.5 rounded hover:bg-[#bad8bf]/40 text-[#254b2d] hover:text-[#b34033] cursor-pointer transition-colors"
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
                    (จิ้มเลือกแท็กจากตารางหมวดหมู่ด้านล่าง)
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

          {/* Compact Suggested Tags Row (Only shown if keyword matched) */}
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

      {/* 2. Category Search & Group Tabs Header */}
      <div className="p-3 border-b border-[#e8dfd3] space-y-2 shrink-0 bg-[#faf7f2]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-[#eef5ee] border border-[#bad8bf] flex items-center justify-center shrink-0">
              <FolderInput className="w-3.5 h-3.5 text-[#2c5c36]" />
            </div>
            <span className="font-extrabold text-xs sm:text-sm text-[#3d332a]">
              เลือกหมวดหมู่ปลายทาง
            </span>
            <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-white text-[#524538] border border-[#e3d8cb] tabular-nums">
              {visibleCategories.length} หมวด
            </span>
          </div>

          <div className="relative w-full sm:w-64 shrink-0">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#998a7c]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาหมวดหมู่ หรือแท็กย่อย..."
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

        {/* Tier 0 Groups Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-xs">
          <Layers className="w-3.5 h-3.5 text-[#6e5f52] shrink-0 mr-0.5" />

          <button
            type="button"
            onClick={() => setActiveGroupTab('ALL')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
              activeGroupTab === 'ALL'
                ? 'bg-[#3b6845] text-white shadow-2xs'
                : 'bg-white hover:bg-[#f3ede3] text-[#524538] border border-[#e2d6c7]'
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
                    ? 'bg-[#3b6845] text-white shadow-2xs'
                    : 'bg-white hover:bg-[#f3ede3] text-[#524538] border border-[#e2d6c7]'
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

      {/* 3. Main Categories Grid */}
      <div className="flex-1 overflow-y-auto p-3">
        {visibleCategories.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#7d6e61] bg-white rounded-xl border border-dashed border-[#e8dfd3]">
            ไม่พบหมวดหมู่ที่ตรงกับคำค้นหา "{searchQuery}"
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5">
            {visibleCategories.map((item) => {
              const isMainDragOver = dragOverTagId === item.mainTag.id;
              const isMainSelected = stagedTagIds.includes(item.mainTag.id);

              return (
                <div
                  key={item.mainTag.id}
                  onDragOver={(e) => handleDragOver(e, item.mainTag.id)}
                  onDragLeave={(e) => handleDragLeave(e, item.mainTag.id)}
                  onDrop={(e) => handleDrop(e, item.mainTag.id)}
                  className={`rounded-xl border p-3 transition-all flex flex-col justify-between gap-2.5 ${
                    isMainSelected
                      ? 'bg-[#fcfffc] border-[#bad8bf] shadow-2xs ring-1 ring-[#bad8bf]/50'
                      : isMainDragOver
                      ? 'bg-[#eef5ee] border-2 border-[#3b6845] scale-[1.01] shadow-md'
                      : 'bg-white border-[#ebe2d5] hover:border-[#bad8bf] hover:shadow-2xs'
                  }`}
                >
                  {/* Category Header & Toggle Action */}
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => onToggleTag(item.mainTag.id)}
                      className="flex items-center gap-1.5 min-w-0 text-left flex-1 cursor-pointer group"
                      title={
                        isMainSelected
                          ? `คลิกเพื่อเอาแท็ก #${item.mainTag.name} ออก`
                          : `คลิกเพื่อเลือกแท็ก #${item.mainTag.name}`
                      }
                    >
                      <Tag
                        className={`w-3.5 h-3.5 shrink-0 ${
                          isMainSelected || isMainDragOver ? 'text-[#3b6845]' : 'text-[#784f1b]'
                        }`}
                      />
                      <span
                        className={`text-xs sm:text-sm font-extrabold truncate ${
                          isMainSelected
                            ? 'text-[#1c4824]'
                            : 'text-[#3d332a] group-hover:text-[#2c5c36]'
                        }`}
                      >
                        #{item.mainTag.name}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-[#faf7f2] text-[#6e5f52] border border-[#e8dfd3] tabular-nums shrink-0">
                        {item.totalCount}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onToggleTag(item.mainTag.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 active:scale-95 flex items-center gap-1 ${
                        isMainSelected
                          ? 'bg-[#eef5ee] text-[#1c4824] border border-[#bad8bf] shadow-2xs'
                          : 'bg-[#faf7f2] hover:bg-[#eef5ee] text-[#524538] hover:text-[#254b2d] border border-[#e2d5c4]'
                      }`}
                      title={isMainSelected ? 'เอาแท็กนี้ออก' : 'เลือกแท็กนี้'}
                    >
                      {isMainSelected ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-[#3b6845]" />
                          <span>เลือกแล้ว</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3 h-3 text-[#524538]" />
                          <span>เลือกแท็กนี้</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Tier 2 Subcategories */}
                  {item.subTags.length > 0 && (
                    <div className="pt-2 border-t border-[#f4eee5] flex flex-wrap gap-1">
                      {item.subTags.map((sub) => {
                        const isSubDragOver = dragOverTagId === sub.id;
                        const isSubSelected = stagedTagIds.includes(sub.id);
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
                            onClick={() => onToggleTag(sub.id)}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border transition-all cursor-pointer active:scale-95 ${
                              isSubSelected
                                ? 'bg-[#3b6845] text-white border-[#3b6845] font-bold shadow-2xs'
                                : isSubDragOver
                                ? 'bg-[#eef5ee] text-[#1c4323] border-2 border-[#3b6845] font-bold scale-105'
                                : 'bg-[#faf7f2] hover:bg-[#eef5ee] text-[#524538] hover:text-[#2c5c36] border-[#e8dfd3] hover:border-[#bad8bf]'
                            }`}
                            title={isSubSelected ? `เอาแท็ก #${sub.name} ออก` : `เลือกแท็ก #${sub.name}`}
                          >
                            {isSubSelected ? (
                              <Check className="w-3 h-3 text-white" />
                            ) : (
                              getEntityIconNode(sub)
                            )}
                            <span className="truncate max-w-[120px]">{sub.name}</span>
                            <span
                              className={`font-mono text-[10px] tabular-nums ${
                                isSubSelected ? 'text-white/80' : 'text-[#8c7b6c]'
                              }`}
                            >
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
