import React, { useEffect, useMemo, useState } from 'react';
import { Tag, Search, RotateCcw, CheckCircle2, Sparkles, X } from 'lucide-react';
import { BaseModal } from '../../../ui/BaseModal';
import { isStagingTagId } from '../../../../services/seedData';
import {
  computeSeriesRelatedFootagePool,
  extractSeriesSearchKeywords,
} from '../../../../utils/seriesExtractor';
import type { CategoryTag, CategoryTier } from '../../../../types/tag.types';
import type { ComputedFootage } from '../../../../types/footage.types';
import type { Episode } from '../../../../types/episode.types';
import type { CategoryRankingItem } from '../hooks/useMasterArchiveMetrics';

interface SeriesTagBindingModalProps {
  isOpen: boolean;
  onClose: () => void;
  seriesItem: CategoryRankingItem | null;
  tags: CategoryTag[];
  computedFootage: ComputedFootage[];
  episodes: Episode[];
  episodeSeriesKeyMap: Record<string, string>;
  customBoundTagIds: string[];
  onSaveBinding: (seriesKey: string, tagIds: string[] | null) => void;
}

const TIER_LABELS: Record<CategoryTier, { title: string; subtitle: string }> = {
  3: {
    title: 'ชั้นที่ 3 · บุคคลเจาะจง / รายการ / ช่อง',
    subtitle: 'เช่น มายเมทเนท, พี่แจ๊ส, โหนกระแส',
  },
  1: {
    title: 'ชั้นที่ 1 · หมวดกว้าง / ประเภทหลัก',
    subtitle: 'เช่น คนไทยเป็นคนตลก, สัตว์โลก, อาชีพ',
  },
  2: {
    title: 'ชั้นที่ 2 · บริบท / สไตล์ / สถานการณ์',
    subtitle: 'เช่น สัมภาษณ์, แกล้ง, ช็อตฟีล, พูดผิด',
  },
};

export const SeriesTagBindingModal: React.FC<SeriesTagBindingModalProps> = ({
  isOpen,
  onClose,
  seriesItem,
  tags,
  computedFootage,
  episodes,
  episodeSeriesKeyMap,
  customBoundTagIds,
  onSaveBinding,
}) => {
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Sync draft selection whenever modal opens for a series
  useEffect(() => {
    if (!isOpen || !seriesItem) return;
    if (customBoundTagIds.length > 0) {
      setSelectedTagIds(customBoundTagIds);
    } else {
      setSelectedTagIds(seriesItem.matchedTagIds || []);
    }
    setSearchQuery('');
  }, [isOpen, seriesItem, customBoundTagIds]);

  const validTags = useMemo(
    () => tags.filter((t) => !isStagingTagId(t.id)),
    [tags]
  );

  // Count how many footages carry each tag
  const tagFootageCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const ft of computedFootage) {
      for (const tid of ft.tags) {
        counts[tid] = (counts[tid] || 0) + 1;
      }
    }
    return counts;
  }, [computedFootage]);

  // Footage IDs already used in episodes of this series
  const seriesFootageIds = useMemo(() => {
    const set = new Set<string>();
    if (!seriesItem) return set;
    for (const ep of episodes) {
      if (episodeSeriesKeyMap[ep.id] !== seriesItem.seriesKey) continue;
      for (const slot of ep.rankings || []) {
        if (slot.footageId) set.add(slot.footageId);
      }
    }
    return set;
  }, [episodes, episodeSeriesKeyMap, seriesItem]);

  const keywords = useMemo(
    () => (seriesItem ? extractSeriesSearchKeywords(seriesItem.seriesName) : []),
    [seriesItem]
  );

  // Live preview of footage pool under current draft tag selection
  const previewPoolStats = useMemo(() => {
    if (!seriesItem) return { total: 0, used: 0, usable: 0 };
    const pool = computeSeriesRelatedFootagePool(
      computedFootage,
      seriesFootageIds,
      selectedTagIds,
      keywords
    );
    const used = pool.filter((ft) => ft.totalUsageCount > 0).length;
    const usable = pool.filter(
      (ft) =>
        ft.cooldownStatus === 'NEW_UNTOUCHED' ||
        ft.cooldownStatus === 'READY_FRESH'
    ).length;
    return { total: pool.length, used, usable };
  }, [seriesItem, computedFootage, seriesFootageIds, selectedTagIds, keywords]);

  const tagsByTier = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const filtered = q
      ? validTags.filter(
          (t) =>
            t.name.toLowerCase().includes(q) ||
            (t.subCategory || '').toLowerCase().includes(q)
        )
      : validTags;

    const groups: Record<CategoryTier, CategoryTag[]> = { 3: [], 1: [], 2: [] };
    for (const t of filtered) {
      groups[t.tier]?.push(t);
    }
    return groups;
  }, [validTags, searchQuery]);

  const toggleTag = (tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    );
  };

  const handleSave = () => {
    if (!seriesItem) return;
    onSaveBinding(seriesItem.seriesKey, selectedTagIds);
    onClose();
  };

  const handleResetToAuto = () => {
    if (!seriesItem) return;
    onSaveBinding(seriesItem.seriesKey, null);
    onClose();
  };

  if (!seriesItem) return null;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      maxWidthClass="max-w-3xl"
      heightClass="max-h-[90vh]"
      icon={<Tag className="w-5 h-5" />}
      title={`ผูกแท็กฟุตเทจ 3 ชั้น · 5 อันดับ ${seriesItem.seriesName}`}
      subtitle={`เลือกแท็กที่เกี่ยวข้องกับซีรีส์นี้เพื่อใช้นับสต็อกฟุตเทจและส่งต่อไปหน้า "+ จัดเพิ่ม" (คำค้นหลัก: ${
        keywords[0] || seriesItem.seriesName
      })`}
      footer={
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleResetToAuto}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-[#FAF3E6] hover:bg-[#F3E6CE] text-[#6B4616] border border-[#DFC69E] transition-colors cursor-pointer self-start sm:self-auto"
            title="ล้างแท็กที่ผูกเองแล้วกลับไปใช้ระบบจับคู่อัตโนมัติหลังตัดคำต่อท้าย"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>คืนค่าจับคู่อัตโนมัติ</span>
          </button>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-white hover:bg-[#F5EFE6] text-[#5C5349] border border-[#DED4C5] transition-colors cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#224A2D] hover:bg-[#193821] text-white shadow-2xs transition-colors cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>บันทึกการผูกแท็ก ({selectedTagIds.length} แท็ก)</span>
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Live Preview Summary */}
        <div className="bg-[#FDFBF7] border border-[#E8DFD3] rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-0.5 text-xs">
            <div className="font-bold text-[#2D2926] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#386B46]" />
              <span>ผลลัพธ์สต็อกฟุตเทจที่จะจับคู่ได้</span>
            </div>
            <div className="text-[11px] text-[#6E665E]">
              รวมฟุตเทจจากตอนเก่า + แท็กที่เลือก + ชื่อ/โน้ตที่มีคำว่า &ldquo;
              {keywords.slice(0, 2).join('", "')}&rdquo;
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono tabular-nums">
            <div>
              <span className="text-[#787066]">ทั้งหมด </span>
              <strong className="text-[#2D2926] text-sm">
                {previewPoolStats.total}
              </strong>
            </div>
            <div>
              <span className="text-[#787066]">ใช้แล้ว </span>
              <strong className="text-[#785324] text-sm">
                {previewPoolStats.used}
              </strong>
            </div>
            <div>
              <span className="text-[#2D633B] font-bold">ว่างพร้อมใช้ </span>
              <strong className="text-[#224A2D] text-sm">
                {previewPoolStats.usable}
              </strong>
            </div>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-[#8C8277] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาชื่อแท็ก 3 ชั้น (เช่น มายเมทเนท, สัมภาษณ์, แกล้ง)..."
            className="w-full pl-9 pr-8 py-2 text-xs bg-white border border-[#E2D8C9] rounded-xl focus:outline-hidden focus:border-[#9EC49C] text-[#2D2926]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8C8277] hover:text-[#2D2926] cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Tag Selection Grouped by Tier (Tier 3 first since most specific for series) */}
        <div className="space-y-3.5 max-h-[45vh] overflow-y-auto scrollbar-thin pr-1">
          {([3, 1, 2] as CategoryTier[]).map((tier) => {
            const list = tagsByTier[tier];
            if (!list || list.length === 0) return null;
            const info = TIER_LABELS[tier];

            return (
              <div
                key={tier}
                className="bg-white border border-[#EAE1D5] rounded-2xl p-3.5 space-y-2.5"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div className="text-xs font-extrabold text-[#2D2926]">
                    {info.title}
                  </div>
                  <div className="text-[11px] text-[#787066]">
                    {info.subtitle}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {list.map((tag) => {
                    const isChecked = selectedTagIds.includes(tag.id);
                    const ftCount = tagFootageCounts[tag.id] || 0;
                    return (
                      <label
                        key={tag.id}
                        className={`flex items-center justify-between gap-2 px-3 py-2 rounded-xl border text-xs cursor-pointer transition-colors ${
                          isChecked
                            ? 'bg-[#E6F2E6] border-[#9EC49C] text-[#1E4427] font-bold'
                            : 'bg-[#FAF8F5] hover:bg-[#F3ECE0] border-[#E8DFD3] text-[#3D3630]'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleTag(tag.id)}
                            className="rounded border-[#CBBBA3] text-[#224A2D] focus:ring-[#9EC49C] shrink-0"
                          />
                          <span className="truncate">{tag.name}</span>
                        </div>
                        <span className="font-mono tabular-nums text-[11px] text-[#787066] shrink-0">
                          {ftCount} ฟุต
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {tagsByTier[3].length === 0 &&
            tagsByTier[1].length === 0 &&
            tagsByTier[2].length === 0 && (
              <div className="p-6 text-center text-xs text-[#787066] bg-white rounded-2xl border border-[#EAE1D5]">
                ไม่พบแท็กที่ตรงกับคำค้นหา &ldquo;{searchQuery}&rdquo;
              </div>
            )}
        </div>
      </div>
    </BaseModal>
  );
};
