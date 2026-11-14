import React, { useState, useMemo } from 'react';
import {
  Search,
  X,
  Film,
  Check,
  Sparkles,
  Repeat,
  AlertTriangle,
  Play,
} from 'lucide-react';
import { BaseModal } from '../../ui/BaseModal';
import { VideoThumbnailPreview } from '../../footage/VideoThumbnailPreview';
import { StatusBadge } from '../../ui/StatusBadge';
import { TagPill } from '../../ui/TagPill';
import { useCMS } from '../../../context/CMSContext';
import type { ComputedFootage } from '../../../types/footage.types';
import type { RankNumber } from '../builder/builder.types';

interface FootagePickerSubModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetRank: RankNumber;
  currentFootageId: string | null;
  onSelectFootage: (rank: RankNumber, footageId: string) => void;
}

export const FootagePickerSubModal: React.FC<FootagePickerSubModalProps> = ({
  isOpen,
  onClose,
  targetRank,
  currentFootageId,
  onSelectFootage,
}) => {
  const { computedFootage, tagMap, settings, setPreviewFootageId } = useCMS();
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<'ALL' | 'TIER_1' | 'TIER_2' | 'TIER_3'>('ALL');
  const [cooldownFilter, setCooldownFilter] = useState<'ALL' | 'FRESH' | 'USED'>('ALL');

  const filteredCandidates = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return computedFootage.filter((ft: ComputedFootage) => {
      // 1. Search Query
      if (q) {
        const inId = ft.id.toLowerCase().includes(q);
        const inTitle = ft.title.toLowerCase().includes(q);
        const inMascot = (ft.mascotNotes || '').toLowerCase().includes(q);
        const inTags = ft.tags.some((tid) =>
          (tagMap[tid]?.name || '').toLowerCase().includes(q)
        );
        if (!inId && !inTitle && !inMascot && !inTags) return false;
      }

      // 2. Cooldown Filter
      if (cooldownFilter === 'FRESH') {
        if (ft.cooldownStatus !== 'NEW_UNTOUCHED' && ft.cooldownStatus !== 'READY_FRESH') {
          return false;
        }
      } else if (cooldownFilter === 'USED') {
        if (ft.totalUsageCount === 0) return false;
      }

      // 3. Tier Filter
      if (tierFilter !== 'ALL') {
        const targetTier = tierFilter === 'TIER_1' ? 1 : tierFilter === 'TIER_2' ? 2 : 3;
        const hasTier = ft.tags.some((tid) => tagMap[tid]?.tier === targetTier);
        if (!hasTier) return false;
      }

      return true;
    });
  }, [computedFootage, searchQuery, cooldownFilter, tierFilter, tagMap]);

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      maxWidthClass="max-w-4xl"
      icon={<Film className="w-5 h-5 text-[#8A5A22]" />}
      title={`เลือกฟุตเทจสลับใส่อันดับ #${targetRank}`}
      subtitle="ค้นหาและเลือกคลิปฟุตเทจจากคลังเพื่อนำมาแทนที่ในอันดับนี้ พร้อมตรวจสอบความสดและการใช้ซ้ำ"
      footer={
        <div className="flex items-center justify-between w-full text-xs">
          <span className="text-[#6E665E]">
            พบคลิปฟุตเทจทั้งหมด{' '}
            <strong className="font-mono text-[#2D2926] font-bold">
              {filteredCandidates.length}
            </strong>{' '}
            คลิป
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#FAF7F2] hover:bg-[#EAE0D2] border border-[#D5C7B4] text-[#4D4740] font-bold transition-colors cursor-pointer"
          >
            ยกเลิก / ปิด
          </button>
        </div>
      }
    >
      <div className="space-y-3.5">
        {/* Controls Strip: Search + Filters */}
        <div className="bg-[#FAF7F2] border border-[#E8DFD3] rounded-2xl p-3 space-y-2.5">
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <div className="relative flex-1 w-full min-w-0">
              <Search className="w-4 h-4 text-[#8C8277] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหารหัส FT-xxxx, ชื่อคลิป, บทพากย์ หรือแท็ก..."
                className="w-full pl-9 pr-8 py-2 text-xs bg-white border border-[#E2D8C9] rounded-xl focus:outline-hidden focus:border-[#C5AB84] text-[#2D2926] placeholder:text-[#968B7E]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8C8277] hover:text-[#2D2926]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Cooldown Filter Pills */}
            <div className="inline-flex items-center gap-1 bg-white p-1 rounded-xl border border-[#E2D8C9] shrink-0">
              <button
                type="button"
                onClick={() => setCooldownFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  cooldownFilter === 'ALL'
                    ? 'bg-[#FAF2E1] text-[#6E4919] border border-[#E6D4B3]'
                    : 'text-[#6E665E] hover:text-[#2D2926]'
                }`}
              >
                ทั้งหมด
              </button>
              <button
                type="button"
                onClick={() => setCooldownFilter('FRESH')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                  cooldownFilter === 'FRESH'
                    ? 'bg-[#EBF3EB] text-[#244B2F] border border-[#BBD6B9]'
                    : 'text-[#6E665E] hover:text-[#2D2926]'
                }`}
              >
                <Sparkles className="w-3 h-3 text-[#386B46]" />
                <span>ฟุตเทจสดใหม่</span>
              </button>
              <button
                type="button"
                onClick={() => setCooldownFilter('USED')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                  cooldownFilter === 'USED'
                    ? 'bg-[#EDF5F8] text-[#23546E] border border-[#C4DFED]'
                    : 'text-[#6E665E] hover:text-[#2D2926]'
                }`}
              >
                <Repeat className="w-3 h-3 text-[#2E6B8A]" />
                <span>วนใช้ซ้ำ</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footage List Grid */}
        <div className="max-h-[460px] overflow-y-auto scrollbar-earth space-y-2 pr-1">
          {filteredCandidates.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#8C8277] bg-[#FAF8F5] rounded-2xl border border-[#E8DFD3]">
              ไม่พบคลิปฟุตเทจที่ตรงกับเงื่อนไขการค้นหา
            </div>
          ) : (
            filteredCandidates.map((ft) => {
              const isCurrent = ft.id === currentFootageId;

              return (
                <div
                  key={ft.id}
                  onClick={() => {
                    onSelectFootage(targetRank, ft.id);
                    onClose();
                  }}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isCurrent
                      ? 'bg-[#FAF3E6] border-[#D6BD94] ring-1 ring-[#DFCEB4]'
                      : 'bg-white hover:bg-[#FAF8F5] border-[#E8DFD3] hover:border-[#D0C0AC]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Thumbnail Preview with Play Click */}
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewFootageId(ft.id);
                      }}
                      className="group/thumb relative rounded-xl overflow-hidden border border-[#E8DFD3] shrink-0 w-24 h-15 bg-black/5 flex items-center justify-center cursor-pointer"
                      title="คลิกเพื่อดูวิดีโอตัวเต็ม"
                    >
                      <VideoThumbnailPreview footage={ft} size="sm" />
                      <div className="absolute inset-0 bg-black/20 group-hover/thumb:bg-black/0 transition-colors flex items-center justify-center pointer-events-none">
                        <Play className="w-3.5 h-3.5 text-white drop-shadow-xs" />
                      </div>
                    </div>

                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-xs text-[#6B4616] bg-[#FAF2E1] px-1.5 py-0.5 rounded-md border border-[#E6D4B3]">
                          {ft.id}
                        </span>
                        <StatusBadge
                          status={ft.cooldownStatus}
                          daysSinceLastUse={ft.daysSinceLastUsed}
                          cooldownDays={settings.cooldownDays}
                          usageLast90Days={ft.usageLast90Days}
                          compact
                        />
                        <span className="text-[11px] font-mono text-[#787066]">
                          ใช้แล้ว {ft.totalUsageCount} ครั้ง
                        </span>
                      </div>

                      <h4 className="text-xs sm:text-sm font-bold text-[#2D2926] truncate">
                        {ft.title}
                      </h4>

                      <div className="flex items-center gap-1.5 flex-wrap">
                        {ft.tags.slice(0, 3).map((tid) => (
                          <TagPill key={tid} tag={tagMap[tid]} />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 shrink-0">
                    {isCurrent ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#224A2D] text-white text-xs font-bold">
                        <Check className="w-3.5 h-3.5" />
                        <span>ใช้อยู่ในอันดับนี้</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectFootage(targetRank, ft.id);
                          onClose();
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#E6F2E6] hover:bg-[#D4E8D4] text-[#224A2D] border border-[#A5C9A3] text-xs font-bold transition-colors cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>เลือกฟุตเทจนี้</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </BaseModal>
  );
};
