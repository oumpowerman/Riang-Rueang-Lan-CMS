import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Search,
  Sparkles,
  CheckCircle2,
  ShieldAlert,
  Layers,
  FileText,
  X,
  RefreshCw,
} from 'lucide-react';
import { BaseModal } from '../ui/BaseModal';
import {
  DATA_DICTIONARY_USE_CASES,
  STANDARD_DICTIONARY_TAGS,
  TAGGING_GOLDEN_RULES,
} from '../../utils/tagDictionaryRules';
import { CategoryTier } from '../../types/tag.types';

interface TagRulesDictionaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRunAutoReorganize?: () => Promise<{
    addedStandardTagsCount: number;
    updatedTagsCount: number;
    mergedAliasTagsCount: number;
    migratedFootagesCount: number;
    migratedSourcesCount: number;
    mergedExamples: string[];
  }>;
}

type DictionaryTabId = 'DICTIONARY' | 'GOLDEN_RULES' | 'USE_CASES';

export const TagRulesDictionaryModal: React.FC<
  TagRulesDictionaryModalProps
> = ({ isOpen, onClose, onRunAutoReorganize }) => {
  const [activeTab, setActiveTab] = useState<DictionaryTabId>('DICTIONARY');
  const [selectedTierFilter, setSelectedTierFilter] = useState<
    'ALL' | CategoryTier
  >('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isReorganizing, setIsReorganizing] = useState(false);
  const [reorgReport, setReorgReport] = useState<{
    addedStandardTagsCount: number;
    updatedTagsCount: number;
    mergedAliasTagsCount: number;
    migratedFootagesCount: number;
    migratedSourcesCount: number;
    mergedExamples: string[];
  } | null>(null);

  const filteredSpecs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase().replace(/^#+/, '');
    return STANDARD_DICTIONARY_TAGS.filter((spec) => {
      if (selectedTierFilter !== 'ALL' && spec.tier !== selectedTierFilter) {
        return false;
      }
      if (!q) return true;
      const matchName = spec.name.toLowerCase().includes(q);
      const matchSub = spec.subCategory.toLowerCase().includes(q);
      const matchDesc = spec.description.toLowerCase().includes(q);
      const matchAlias = spec.aliases.some((a) => a.toLowerCase().includes(q));
      return matchName || matchSub || matchDesc || matchAlias;
    });
  }, [selectedTierFilter, searchQuery]);

  const groupedSpecs = useMemo(() => {
    const groups = new Map<
      string,
      { tier: CategoryTier; subCategory: string; items: typeof filteredSpecs }
    >();
    for (const spec of filteredSpecs) {
      const key = `${spec.tier}::${spec.subCategory}`;
      const existing = groups.get(key);
      if (existing) {
        existing.items.push(spec);
      } else {
        groups.set(key, {
          tier: spec.tier,
          subCategory: spec.subCategory,
          items: [spec],
        });
      }
    }
    return Array.from(groups.values());
  }, [filteredSpecs]);

  const handleTriggerReorganize = async () => {
    if (!onRunAutoReorganize || isReorganizing) return;
    setIsReorganizing(true);
    try {
      const stats = await onRunAutoReorganize();
      setReorgReport(stats);
    } finally {
      setIsReorganizing(false);
    }
  };

  const getTierBadgeStyle = (tier: CategoryTier) => {
    if (tier === 1) {
      return 'bg-[#EEF5FB] text-[#184366] border-[#C5DCEF]';
    }
    if (tier === 2) {
      return 'bg-[#FEF6E8] text-[#6B4415] border-[#E8CFA6]';
    }
    return 'bg-[#EDF6F0] text-[#1D4D2B] border-[#BFE0C8]';
  };

  const getTierTitleText = (tier: CategoryTier) => {
    if (tier === 1) return 'Tier 1 · มิติปลายทาง (หมวดหมู่กว้าง)';
    if (tier === 2) return 'Tier 2 · บริบทและสไตล์คลิป';
    return 'Tier 3 · เฉพาะเจาะจง (ชื่อบุคคล / ชื่อรายการ)';
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={isReorganizing ? () => {} : onClose}
      maxWidthClass="max-w-5xl"
      heightClass="h-[90dvh] sm:h-[88vh]"
      icon={<BookOpen className="w-5 h-5 text-[#3B6845]" />}
      title="คลังข้อตกลงระบบ Tag 3 Tiers (Tagging Rules & Data Dictionary)"
      subtitle="แหล่งอ้างอิงหลัก (Source of Truth) สำหรับทีมงานและระบบจัดระเบียบป้ายกำกับอัตโนมัติ"
      bodyClassName="p-0 bg-[#FAF8F5] flex flex-col overflow-hidden"
      footer={
        <div className="flex flex-wrap items-center justify-between gap-3 w-full">
          <div className="text-xs text-[#6E5F52]">
            ระบบตัดคำว่า &ldquo;ฮา / ฮาๆ / สุดฮา&rdquo; และยุบรวมคำพ้องเข้าแท็กหลักตามตารางนี้ให้อัตโนมัติ
          </div>
          <div className="flex items-center gap-2">
            {onRunAutoReorganize && (
              <button
                type="button"
                disabled={isReorganizing}
                onClick={handleTriggerReorganize}
                className="px-3.5 py-2 rounded-xl bg-[#EEF5EE] hover:bg-[#DFEFE0] text-[#1C4824] border border-[#BAD8BF] text-xs sm:text-sm font-bold flex items-center gap-1.5 cursor-pointer transition-colors disabled:opacity-60"
              >
                <RefreshCw
                  className={`w-4 h-4 ${isReorganizing ? 'animate-spin' : ''}`}
                />
                <span>
                  {isReorganizing
                    ? 'กำลังจัดระเบียบคลังแท็ก...'
                    : 'จัดระเบียบแท็กเดิม & ย้ายป้ายคลิปอัตโนมัติ'}
                </span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-[#3B6845] hover:bg-[#2D5236] text-white text-xs sm:text-sm font-bold cursor-pointer transition-colors"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </div>
      }
    >
      {/* Top Action & Reorganization Report Banner */}
      {reorgReport && (
        <div className="mx-4 mt-3 p-3 rounded-2xl bg-[#EDF7ED] border border-[#B7DFB9] text-xs text-[#1E4620] flex flex-col gap-1.5 shrink-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 font-extrabold">
              <CheckCircle2 className="w-4 h-4 text-[#2E7D32] shrink-0" />
              <span>
                จัดระเบียบแท็กตามโครงสร้าง Data Dictionary และย้ายป้ายในคลิปเรียบร้อยแล้ว!
              </span>
            </div>
            <button
              type="button"
              onClick={() => setReorgReport(null)}
              className="text-[#2E7D32] hover:text-[#1B5E20] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-[11px] font-medium">
            <span>
              • เพิ่ม/ซิงก์แท็กมาตรฐาน:{' '}
              <strong>
                {(
                  reorgReport.addedStandardTagsCount +
                  reorgReport.updatedTagsCount
                ).toLocaleString()}
              </strong>{' '}
              แท็ก
            </span>
            <span>
              • ยุบรวมคำพ้องเข้าแท็กหลัก:{' '}
              <strong>{reorgReport.mergedAliasTagsCount.toLocaleString()}</strong>{' '}
              แท็ก
            </span>
            <span>
              • ย้ายป้ายในคลิปฟุตเทจอัตโนมัติ:{' '}
              <strong>
                {reorgReport.migratedFootagesCount.toLocaleString()}
              </strong>{' '}
              คลิป
            </span>
          </div>
          {reorgReport.mergedExamples.length > 0 && (
            <div className="text-[11px] text-[#2B582E] bg-white/70 px-2.5 py-1.5 rounded-xl border border-[#CBE7CC]">
              <span className="font-bold">ตัวอย่างการยุบรวม: </span>
              {reorgReport.mergedExamples.join(' · ')}
            </div>
          )}
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="px-4 sm:px-6 pt-3 pb-2.5 bg-[#F5EFE6] border-b border-[#E2D5C4] flex flex-wrap items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#EAE2D5] border border-[#DDD3C4]">
          <button
            type="button"
            onClick={() => setActiveTab('DICTIONARY')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
              activeTab === 'DICTIONARY'
                ? 'bg-white text-[#2D241C] shadow-2xs'
                : 'text-[#5C4E41] hover:text-[#2D241C]'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-[#3B6845]" />
            <span>ตาราง Data Dictionary ({STANDARD_DICTIONARY_TAGS.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('GOLDEN_RULES')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
              activeTab === 'GOLDEN_RULES'
                ? 'bg-white text-[#2D241C] shadow-2xs'
                : 'text-[#5C4E41] hover:text-[#2D241C]'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-[#B85D19]" />
            <span>กฎเหล็ก 5 ข้อ & คำศัพท์</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('USE_CASES')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
              activeTab === 'USE_CASES'
                ? 'bg-white text-[#2D241C] shadow-2xs'
                : 'text-[#5C4E41] hover:text-[#2D241C]'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-[#2C5378]" />
            <span>ตัวอย่างการใช้งานจริง (4 เคส)</span>
          </button>
        </div>

        {activeTab === 'DICTIONARY' && (
          <div className="flex flex-wrap items-center gap-2">
            {/* Tier Filter */}
            <div className="flex items-center gap-1 bg-white px-1.5 py-1 rounded-xl border border-[#E2D5C4] text-[11px] font-bold">
              {(['ALL', 1, 2, 3] as const).map((tierOpt) => (
                <button
                  key={String(tierOpt)}
                  type="button"
                  onClick={() => setSelectedTierFilter(tierOpt)}
                  className={`px-2 py-0.5 rounded-lg cursor-pointer transition-colors ${
                    selectedTierFilter === tierOpt
                      ? 'bg-[#3B6845] text-white'
                      : 'text-[#5C4E41] hover:bg-[#FAF7F2]'
                  }`}
                >
                  {tierOpt === 'ALL' ? 'ทั้งหมด' : `Tier ${tierOpt}`}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-56 sm:w-64">
              <Search className="w-3.5 h-3.5 text-[#8C7B6C] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหาแท็ก, ความหมาย, คำพ้อง..."
                className="w-full pl-8 pr-7 py-1.5 rounded-xl bg-white border border-[#E2D5C4] text-xs text-[#3D332A] placeholder:text-[#A39485] focus:outline-none focus:border-[#3B6845]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8C7B6C] hover:text-[#3D332A] cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Main Scrollable Body */}
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin p-4 sm:p-6 space-y-5">
        {activeTab === 'DICTIONARY' && (
          <>
            {groupedSpecs.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-white border border-[#E8DFD3] text-sm text-[#7D6E61]">
                ไม่พบแท็กหรือคำพ้องที่ตรงกับ &ldquo;{searchQuery}&rdquo;
              </div>
            ) : (
              groupedSpecs.map((group) => (
                <div
                  key={`${group.tier}-${group.subCategory}`}
                  className="rounded-2xl bg-white border border-[#E5DACE] overflow-hidden shadow-2xs"
                >
                  <div className="px-4 py-2.5 bg-[#FAF6F0] border-b border-[#EAE0D5] flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-lg text-xs font-extrabold border ${getTierBadgeStyle(
                          group.tier
                        )}`}
                      >
                        {getTierTitleText(group.tier)}
                      </span>
                      <span className="text-xs font-bold text-[#4D3A24]">
                        หมวดย่อย: {group.subCategory}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-[#7D6E61]">
                      {group.items.length} แท็กหลัก
                    </span>
                  </div>

                  <div className="divide-y divide-[#F0E8DE]">
                    {group.items.map((spec) => (
                      <div
                        key={spec.id}
                        className="px-4 py-3 flex flex-col sm:flex-row sm:items-start justify-between gap-2.5 hover:bg-[#FCFBF9] transition-colors"
                      >
                        <div className="space-y-1 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-extrabold border ${getTierBadgeStyle(
                                spec.tier
                              )}`}
                            >
                              #{spec.name}
                            </span>
                            <span className="text-xs text-[#3D332A] font-medium">
                              {spec.description}
                            </span>
                          </div>
                        </div>

                        {spec.aliases.length > 0 && (
                          <div className="sm:max-w-xs md:max-w-sm shrink-0 flex flex-wrap items-center gap-1">
                            <span className="text-[10px] font-bold text-[#8C7B6C] mr-0.5">
                              ยุบรวมคำพ้อง:
                            </span>
                            {spec.aliases.map((alias) => (
                              <span
                                key={alias}
                                className="px-1.5 py-0.5 rounded-md bg-[#F4EFE8] text-[#5C4E41] border border-[#E5DACE] text-[10px] font-mono"
                              >
                                #{alias}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </>
        )}

        {activeTab === 'GOLDEN_RULES' && (
          <div className="space-y-4">
            {/* Terminology Card */}
            <div className="p-4 rounded-2xl bg-white border border-[#E5DACE] space-y-3 shadow-2xs">
              <div className="flex items-center gap-2 text-sm font-extrabold text-[#3D332A]">
                <Sparkles className="w-4 h-4 text-[#A67438]" />
                <span>คำศัพท์ที่ต้องเข้าใจตรงกัน (Terminology)</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-[#EEF5FB] border border-[#C5DCEF] text-[#184366] space-y-1">
                  <div className="font-extrabold">
                    1. ฟุตเทจ (Footage) = วัตถุดิบ
                  </div>
                  <p className="text-[#2B5478]">
                    คลิปวิดีโอเหตุการณ์ตลก 1 เหตุการณ์ ที่สามารถติดป้ายกำกับผสมกันได้ทั้ง Tier 1, Tier 2 และ Tier 3 อย่างอิสระ
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-[#EDF6F0] border border-[#BFE0C8] text-[#1D4D2B] space-y-1">
                  <div className="font-extrabold">
                    2. คลิป (Clip / Episode) = ผลงานจัดอันดับ 5 อันดับ
                  </div>
                  <p className="text-[#275C37]">
                    วิดีโอตัวเต็มที่นำ &ldquo;ฟุตเทจ&rdquo; จำนวน 5 อัน มาจัดอันดับและมัดรวมกัน เช่น &ldquo;5 อันดับสัมภาษณ์ข่าวพูดผิดสุดฮา&rdquo;
                  </p>
                </div>
              </div>
            </div>

            {/* 5 Golden Rules */}
            <div className="p-4 rounded-2xl bg-white border border-[#E5DACE] space-y-3 shadow-2xs">
              <div className="flex items-center gap-2 text-sm font-extrabold text-[#3D332A]">
                <ShieldAlert className="w-4 h-4 text-[#B85D19]" />
                <span>กฎเหล็กในการติด Tag ทั้ง 5 ข้อ (Tagging Rules)</span>
              </div>
              <div className="space-y-2.5">
                {TAGGING_GOLDEN_RULES.map((rule) => (
                  <div
                    key={rule.ruleNo}
                    className="p-3 rounded-xl bg-[#FAF7F2] border border-[#E8DFD3] flex items-start gap-3"
                  >
                    <span className="w-6 h-6 rounded-lg bg-[#3B6845] text-white text-xs font-extrabold flex items-center justify-center shrink-0">
                      {rule.ruleNo}
                    </span>
                    <div className="space-y-0.5 text-xs">
                      <div className="font-extrabold text-[#3D332A]">
                        {rule.title}
                      </div>
                      <div className="text-[#6E5F52]">{rule.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'USE_CASES' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {DATA_DICTIONARY_USE_CASES.map((uc) => (
              <div
                key={uc.id}
                className="p-4 rounded-2xl bg-white border border-[#E5DACE] space-y-3 shadow-2xs flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  <div className="text-sm font-extrabold text-[#3D332A]">
                    {uc.title}
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-bold text-[#184366] w-14 shrink-0">
                        Tier 1:
                      </span>
                      {uc.tier1.map((t) => (
                        <span
                          key={t}
                          className="px-2 py-0.5 rounded-lg bg-[#EEF5FB] text-[#184366] border border-[#C5DCEF] font-bold"
                        >
                          {t}
                        </span>
                      ))}
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-bold text-[#6B4415] w-14 shrink-0">
                        Tier 2:
                      </span>
                      {uc.tier2.map((t) => (
                        <span
                          key={t}
                          className="px-2 py-0.5 rounded-lg bg-[#FEF6E8] text-[#6B4415] border border-[#E8CFA6] font-bold"
                        >
                          {t}
                        </span>
                      ))}
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-bold text-[#1D4D2B] w-14 shrink-0">
                        Tier 3:
                      </span>
                      {uc.tier3.length === 0 ? (
                        <span className="text-[#8C7B6C] italic">
                          (เว้นว่าง ไม่มีชื่อคนดัง/รายการ)
                        </span>
                      ) : (
                        uc.tier3.map((t) => (
                          <span
                            key={t}
                            className="px-2 py-0.5 rounded-lg bg-[#EDF6F0] text-[#1D4D2B] border border-[#BFE0C8] font-bold"
                          >
                            {t}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-2.5 border-t border-[#EFE7DC] text-xs text-[#524538]">
                  <strong className="text-[#3B6845]">การนำไปใช้จัดอันดับ: </strong>
                  {uc.rankingNote}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </BaseModal>
  );
};
