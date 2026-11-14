import React, { useMemo, useState } from 'react';
import {
  Wand2,
  CheckCircle2,
  ArrowRight,
  Search,
  ShieldCheck,
  Plus,
  X,
  RotateCcw,
  Loader2,
  Sparkles,
  Hash,
} from 'lucide-react';
import { BaseModal } from '../../../ui/BaseModal';
import {
  DEFAULT_TEMPLATE_OPTIONS,
  formatEpisodeToStandardTemplate,
  TemplateStandardizeOptions,
} from '../../../../utils/episodeTemplateStandardizer';
import type { Episode } from '../../../../types/episode.types';

interface TemplateStandardizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  episodes: Episode[];
  onApplyBatchStandardize: (updatedEpisodes: Episode[]) => Promise<void>;
}

type PreviewTab = 'NEEDS_UPDATE' | 'EXEMPT' | 'ALREADY_STANDARD' | 'ALL';

export const TemplateStandardizerModal: React.FC<
  TemplateStandardizerModalProps
> = ({ isOpen, onClose, episodes, onApplyBatchStandardize }) => {
  const [options, setOptions] = useState<TemplateStandardizeOptions>(
    DEFAULT_TEMPLATE_OPTIONS
  );
  const [newExemptInput, setNewExemptInput] = useState('');
  const [activeTab, setActiveTab] = useState<PreviewTab>('NEEDS_UPDATE');
  const [searchQuery, setSearchQuery] = useState('');
  const [excludedIds, setExcludedIds] = useState<Set<string>>(new Set());
  const [isApplying, setIsApplying] = useState(false);

  // Compute live previews across all archive episodes
  const previews = useMemo(
    () => episodes.map((ep) => formatEpisodeToStandardTemplate(ep, options)),
    [episodes, options]
  );

  const counts = useMemo(() => {
    let needsUpdate = 0;
    let alreadyStandard = 0;
    let exempt = 0;
    for (const p of previews) {
      if (p.needsUpdate) needsUpdate++;
      else alreadyStandard++;
      if (p.isExempt) exempt++;
    }
    return {
      total: previews.length,
      needsUpdate,
      alreadyStandard,
      exempt,
    };
  }, [previews]);

  const filteredPreviews = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return previews.filter((p) => {
      if (activeTab === 'NEEDS_UPDATE' && !p.needsUpdate) return false;
      if (activeTab === 'ALREADY_STANDARD' && p.needsUpdate) return false;
      if (activeTab === 'EXEMPT' && !p.isExempt) return false;
      if (q) {
        const hay =
          `${p.episode.id} ${p.beforeTitle} ${p.afterTitle} ${p.afterSeriesTitle}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [previews, activeTab, searchQuery]);

  // Episodes selected to be updated
  const episodesToApply = useMemo(
    () =>
      previews
        .filter((p) => p.needsUpdate && !excludedIds.has(p.episode.id))
        .map((p) => p.episode),
    [previews, excludedIds]
  );

  const toggleRowSelection = (epId: string) => {
    setExcludedIds((prev) => {
      const next = new Set(prev);
      if (next.has(epId)) {
        next.delete(epId);
      } else {
        next.add(epId);
      }
      return next;
    });
  };

  const handleSelectAllVisibleNeedsUpdate = () => {
    setExcludedIds((prev) => {
      const next = new Set(prev);
      for (const p of filteredPreviews) {
        if (p.needsUpdate) next.delete(p.episode.id);
      }
      return next;
    });
  };

  const handleDeselectAllVisibleNeedsUpdate = () => {
    setExcludedIds((prev) => {
      const next = new Set(prev);
      for (const p of filteredPreviews) {
        if (p.needsUpdate) next.add(p.episode.id);
      }
      return next;
    });
  };

  const handleAddExemptKeyword = () => {
    const kw = newExemptInput.trim();
    if (!kw) return;
    setOptions((prev) => {
      if (prev.exemptKeywords.some((k) => k.toLowerCase() === kw.toLowerCase())) {
        return prev;
      }
      return {
        ...prev,
        exemptKeywords: [...prev.exemptKeywords, kw],
      };
    });
    setNewExemptInput('');
  };

  const handleRemoveExemptKeyword = (kw: string) => {
    setOptions((prev) => ({
      ...prev,
      exemptKeywords: prev.exemptKeywords.filter((k) => k !== kw),
    }));
  };

  const handleResetOptions = () => {
    setOptions(DEFAULT_TEMPLATE_OPTIONS);
    setExcludedIds(new Set());
  };

  const handleConfirmApply = async () => {
    if (episodesToApply.length === 0 || isApplying) return;
    setIsApplying(true);
    try {
      await onApplyBatchStandardize(episodesToApply);
      onClose();
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      maxWidthClass="max-w-5xl"
      heightClass="max-h-[92vh]"
      icon={<Wand2 className="w-5 h-5" />}
      title="จัดโครงสร้างชื่อคลิปตาม Template มาตรฐานทั้งคลัง"
      subtitle="ปรับรูปแบบชื่อคลิปหลักและชื่อซีรีส์ให้เป็นหนึ่งเดียว (5 อันดับ ... สุดฮา! EP.n) พร้อมรองรับหมวดข้อยกเว้น"
      badge={
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-[#FAF2E1] text-[#785324] border border-[#E6D4B3]">
          รอปรับแก้ {counts.needsUpdate} / {counts.total} คลิป
        </span>
      }
      footer={
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-[#6E655D]">
            ระบบจะซิงก์ทั้ง <strong className="text-[#2D2926]">ชื่อคลิป (Title)</strong>,{' '}
            <strong className="text-[#2D2926]">ชื่อซีรีส์ (Series Title)</strong> และ{' '}
            <strong className="text-[#2D2926]">เลข EP</strong> ให้ตรงกันทั้งหมด
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              disabled={isApplying}
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-white hover:bg-[#F5EFE6] text-[#5C5349] border border-[#DED4C5] transition-colors cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              disabled={episodesToApply.length === 0 || isApplying}
              onClick={handleConfirmApply}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#224A2D] hover:bg-[#193821] disabled:opacity-45 text-white shadow-2xs transition-all cursor-pointer"
            >
              {isApplying ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5" />
              )}
              <span>
                บันทึกปรับชื่อตาม Template ({episodesToApply.length} คลิป) ลง Cloud
              </span>
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* 1. Template Configuration Card */}
        <div className="bg-[#FDFBF7] border border-[#E8DFD3] rounded-2xl p-4 space-y-3.5 shadow-2xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs font-extrabold text-[#2D2926] flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#8A5A22]" />
              <span>ตั้งค่ารูปแบบ Template และข้อยกเว้น</span>
            </div>
            <button
              type="button"
              onClick={handleResetOptions}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-[#6B4616] hover:underline cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>คืนค่าเริ่มต้น</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Spacing Format Option */}
            <div className="bg-white border border-[#E6DDD0] rounded-xl p-3 space-y-2">
              <div className="text-[11px] font-bold text-[#785324]">
                รูปแบบการเว้นวรรคก่อนคำว่า &ldquo;สุดฮา!&rdquo;
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setOptions((prev) => ({ ...prev, spaceBeforeSudHa: true }))
                  }
                  className={`flex-1 text-left px-3 py-2 rounded-lg border text-xs transition-all cursor-pointer ${
                    options.spaceBeforeSudHa
                      ? 'bg-[#E6F2E6] border-[#9EC49C] text-[#1E4427] font-bold'
                      : 'bg-[#FAF8F5] border-[#E8DFD3] text-[#5C5349] hover:bg-[#F4EEE4]'
                  }`}
                >
                  <div>มีเว้นวรรค (แนะนำ)</div>
                  <div className="text-[11px] font-mono opacity-85 mt-0.5">
                    5 อันดับ มายเมทเนท สุดฮา! EP.1
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setOptions((prev) => ({ ...prev, spaceBeforeSudHa: false }))
                  }
                  className={`flex-1 text-left px-3 py-2 rounded-lg border text-xs transition-all cursor-pointer ${
                    !options.spaceBeforeSudHa
                      ? 'bg-[#E6F2E6] border-[#9EC49C] text-[#1E4427] font-bold'
                      : 'bg-[#FAF8F5] border-[#E8DFD3] text-[#5C5349] hover:bg-[#F4EEE4]'
                  }`}
                >
                  <div>ติดกัน</div>
                  <div className="text-[11px] font-mono opacity-85 mt-0.5">
                    5 อันดับ มายเมทเนทสุดฮา! EP.1
                  </div>
                </button>
              </div>
            </div>

            {/* Hashtag, Typo Auto-Fix & Exempt Summary */}
            <div className="bg-white border border-[#E6DDD0] rounded-xl p-3 space-y-2 flex flex-col justify-between">
              <label className="flex items-start gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={options.preserveHashtags}
                  onChange={(e) =>
                    setOptions((prev) => ({
                      ...prev,
                      preserveHashtags: e.target.checked,
                    }))
                  }
                  className="mt-0.5 rounded border-[#CBBBA3] text-[#224A2D] focus:ring-[#9EC49C]"
                />
                <div className="text-xs">
                  <div className="font-bold text-[#2D2926] flex items-center gap-1">
                    <Hash className="w-3.5 h-3.5 text-[#8A5A22]" />
                    <span>คง #แฮชแท็ก ท้ายชื่อคลิปเดิมไว้</span>
                  </div>
                  <div className="text-[11px] text-[#787066]">
                    เช่น 5 อันดับ มายเมทเนท สุดฮา! EP.1 #มายเมทเนท #ตลก
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-2 cursor-pointer select-none pt-1 border-t border-[#F2ECE3]">
                <input
                  type="checkbox"
                  checked={options.fixKnownSeriesTypos}
                  onChange={(e) =>
                    setOptions((prev) => ({
                      ...prev,
                      fixKnownSeriesTypos: e.target.checked,
                    }))
                  }
                  className="mt-0.5 rounded border-[#CBBBA3] text-[#224A2D] focus:ring-[#9EC49C]"
                />
                <div className="text-xs">
                  <div className="font-bold text-[#2D2926]">
                    แก้คำตกหล่นอัตโนมัติ: &ldquo;คนไทยคนตลก&rdquo; / &ldquo;คนไทยเป้นคนตลก&rdquo;
                  </div>
                  <div className="text-[11px] text-[#3B5E42]">
                    ปรับเป็น <strong>5 อันดับ คนไทยเป็นคนตลก EP.n</strong> ให้ตรงกันทั้งหมด
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Exempt Series Keywords Editor */}
          <div className="bg-white border border-[#E6DDD0] rounded-xl p-3 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] font-bold text-[#785324] flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#386B46]" />
                <span>
                  รายชื่อรายการที่ยกเว้นไม่เติม &ldquo;สุดฮา!&rdquo; ({options.exemptKeywords.length} คำ)
                </span>
              </span>
              <span className="text-[10px] text-[#8C8277]">
                หากชื่อคลิปมีคำเหล่านี้ จะคงรูปแบบ 5 อันดับ [ชื่อเรื่อง] EP.n ไว้
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {options.exemptKeywords.map((kw) => (
                <span
                  key={kw}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#EFF6EE] text-[#244B2F] border border-[#BBD6B9]"
                >
                  <span>{kw}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveExemptKeyword(kw)}
                    className="p-0.5 rounded-full hover:bg-[#D5E8D4] text-[#244B2F] cursor-pointer"
                    title={`ลบข้อยกเว้น "${kw}"`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}

              <div className="inline-flex items-center gap-1 ml-1">
                <input
                  type="text"
                  value={newExemptInput}
                  onChange={(e) => setNewExemptInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddExemptKeyword();
                    }
                  }}
                  placeholder="เพิ่มข้อยกเว้น..."
                  className="px-2.5 py-1 text-xs bg-[#FAF8F5] border border-[#DFD4C4] rounded-lg focus:outline-hidden focus:border-[#9EC49C] w-36 sm:w-44"
                />
                <button
                  type="button"
                  onClick={handleAddExemptKeyword}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-[#FAF2E1] hover:bg-[#F2E3C2] text-[#6B4616] border border-[#DFC69E] cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>เพิ่ม</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Preview Filter Tabs & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                {
                  id: 'NEEDS_UPDATE' as const,
                  label: `ต้องปรับแก้ (${counts.needsUpdate})`,
                },
                {
                  id: 'EXEMPT' as const,
                  label: `หมวดยกเว้น (${counts.exempt})`,
                },
                {
                  id: 'ALREADY_STANDARD' as const,
                  label: `ตรง Template แล้ว (${counts.alreadyStandard})`,
                },
                {
                  id: 'ALL' as const,
                  label: `ทั้งหมด (${counts.total})`,
                },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-[#E6F2E6] text-[#224A2D] border-[#9EC49C] shadow-2xs'
                    : 'bg-white hover:bg-[#FAF7F2] text-[#5C5349] border-[#E6DDD0]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-[#8C8277] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาชื่อคลิป หรือ EP-xxxx..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-[#E2D8C9] rounded-xl focus:outline-hidden focus:border-[#9EC49C]"
            />
          </div>
        </div>

        {/* Batch selection helper */}
        {filteredPreviews.some((p) => p.needsUpdate) && (
          <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-xl bg-[#FAF3E6] border border-[#E6D4B3] text-xs">
            <span className="font-semibold text-[#6B4616]">
              เลือกอยู่ {episodesToApply.length} จาก {counts.needsUpdate} คลิปที่ต้องปรับแก้
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSelectAllVisibleNeedsUpdate}
                className="font-bold text-[#224A2D] hover:underline cursor-pointer"
              >
                เลือกทั้งหมดในหน้านี้
              </button>
              <span className="text-[#C8B9A3]">|</span>
              <button
                type="button"
                onClick={handleDeselectAllVisibleNeedsUpdate}
                className="font-bold text-[#7A3F17] hover:underline cursor-pointer"
              >
                ไม่เลือกในหน้านี้
              </button>
            </div>
          </div>
        )}

        {/* 3. Live Before -> After Preview Table */}
        <div className="bg-white border border-[#E8DFD3] rounded-2xl overflow-hidden shadow-2xs">
          {filteredPreviews.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#787066]">
              ไม่พบรายการคลิปในหมวดนี้
            </div>
          ) : (
            <div className="max-h-[42vh] overflow-y-auto scrollbar-thin divide-y divide-[#F2ECE3]">
              {filteredPreviews.map((item) => {
                const isChecked =
                  item.needsUpdate && !excludedIds.has(item.episode.id);
                return (
                  <div
                    key={item.episode.id}
                    className={`px-3.5 py-2.5 flex items-start sm:items-center gap-3 text-xs transition-colors ${
                      item.needsUpdate
                        ? isChecked
                          ? 'bg-white hover:bg-[#FAF8F5]'
                          : 'bg-[#FAF8F5]/60 opacity-65'
                        : 'bg-[#F8FBF8]/70'
                    }`}
                  >
                    {/* Checkbox (or status check if already standard) */}
                    <div className="pt-0.5 sm:pt-0 shrink-0">
                      {item.needsUpdate ? (
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleRowSelection(item.episode.id)}
                          className="rounded border-[#CBBBA3] text-[#224A2D] focus:ring-[#9EC49C] cursor-pointer"
                        />
                      ) : (
                        <span title="ตรงตาม Template แล้ว" className="inline-flex">
                          <CheckCircle2 className="w-4 h-4 text-[#3B8246]" />
                        </span>
                      )}
                    </div>

                    {/* Episode ID & Badges */}
                    <div className="w-24 shrink-0 space-y-1">
                      <div className="font-mono font-bold text-[#6B4616]">
                        {item.episode.id}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {item.isExempt && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-[#EBF5EB] text-[#244B2F] border border-[#BBD6B9]">
                            ข้อยกเว้น
                          </span>
                        )}
                        {!item.needsUpdate && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-[#EEF5EE] text-[#2E7D32] border border-[#C6DEC5]">
                            ตรงแล้ว
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Before -> After Title Comparison */}
                    <div className="flex-1 min-w-0 grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] items-center gap-1.5 lg:gap-3">
                      <div className="min-w-0">
                        <div className="text-[10px] text-[#8C8277] font-semibold">
                          ชื่อเดิม
                        </div>
                        <div
                          className={`truncate ${
                            item.needsUpdate
                              ? 'text-[#8E4537] line-through'
                              : 'text-[#5C5349]'
                          }`}
                          title={item.beforeTitle}
                        >
                          {item.beforeTitle || '(ไม่มีชื่อ)'}
                        </div>
                      </div>

                      <ArrowRight className="w-3.5 h-3.5 text-[#386B46] hidden lg:block shrink-0" />

                      <div className="min-w-0">
                        <div className="text-[10px] text-[#3B6845] font-semibold flex items-center gap-2">
                          <span>ชื่อใหม่ตาม Template</span>
                          <span className="text-[#787066] font-normal truncate">
                            (ซีรีส์: {item.afterSeriesTitle})
                          </span>
                        </div>
                        <div
                          className="font-bold text-[#224A2D] truncate"
                          title={item.afterTitle}
                        >
                          {item.afterTitle}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </BaseModal>
  );
};
