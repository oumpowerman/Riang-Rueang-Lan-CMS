import React, { useState, useMemo } from 'react';
import {
  Trash2,
  CheckCircle2,
  Search,
  Tag,
} from 'lucide-react';
import { BaseModal } from '../ui/BaseModal';
import { useCMS } from '../../context/CMSContext';
import { isStagingTagId } from '../../services/seedData';
import { CategoryTag } from '../../types/tag.types';
import { normalizeCompareKey } from '../footage/sheetImport/sheetImportParser';

interface JunkTagCleanupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export type JunkTagConcreteType =
  | 'MATCHES_CLIP_OR_EP'
  | 'CONTAINS_EP_OR_RANK'
  | 'ZERO_USAGE'
  | 'LONG_TITLE';

export type JunkTagFilterType = 'ALL_JUNK' | JunkTagConcreteType;

interface AnalyzedTagItem {
  tag: CategoryTag;
  usageCount: number;
  reason: string;
  categoryType: JunkTagConcreteType;
  matchedTitleSnippet?: string;
}

export const JunkTagCleanupModal: React.FC<JunkTagCleanupModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    tags,
    computedFootage,
    episodes,
    batchDeleteTags,
  } = useCMS();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<JunkTagFilterType>('ALL_JUNK');
  const [selectedTagIds, setSelectedTagIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteProgress, setDeleteProgress] = useState<{
    completed: number;
    total: number;
  } | null>(null);
  const [successReport, setSuccessReport] = useState<{
    deletedCount: number;
    updatedFootagesCount: number;
  } | null>(null);

  // 1. Analyze and detect junk or clip-title tags
  const analyzedJunkTags = useMemo<AnalyzedTagItem[]>(() => {
    // Build lookup sets
    const footageTitleNormMap = new Map<string, string>();
    computedFootage.forEach((f) => {
      footageTitleNormMap.set(normalizeCompareKey(f.title), f.title);
    });

    const episodeTitleNormMap = new Map<string, string>();
    episodes.forEach((e) => {
      episodeTitleNormMap.set(normalizeCompareKey(e.title), e.title);
      if (e.seriesTitle) {
        episodeTitleNormMap.set(normalizeCompareKey(e.seriesTitle), e.seriesTitle);
      }
    });

    // Tag usage count
    const tagUsageMap = new Map<string, number>();
    computedFootage.forEach((f) => {
      f.tags.forEach((tId) => {
        tagUsageMap.set(tId, (tagUsageMap.get(tId) || 0) + 1);
      });
    });

    const results: AnalyzedTagItem[] = [];

    tags.forEach((tag) => {
      if (isStagingTagId(tag.id)) return; // protect staging tag

      const normName = normalizeCompareKey(tag.name);
      const usage = tagUsageMap.get(tag.id) || 0;

      // Detection 1: Name matches a Footage Title or Episode Title
      const matchedFtTitle = footageTitleNormMap.get(normName);
      const matchedEpTitle = episodeTitleNormMap.get(normName);

      if (matchedFtTitle) {
        results.push({
          tag,
          usageCount: usage,
          reason: `ชื่อตรงกับคลิปฟุตเทจ: "${matchedFtTitle}"`,
          categoryType: 'MATCHES_CLIP_OR_EP',
          matchedTitleSnippet: matchedFtTitle,
        });
        return;
      }

      if (matchedEpTitle) {
        results.push({
          tag,
          usageCount: usage,
          reason: `ชื่อตรงกับคลิปหลัก/EP: "${matchedEpTitle}"`,
          categoryType: 'MATCHES_CLIP_OR_EP',
          matchedTitleSnippet: matchedEpTitle,
        });
        return;
      }

      // Detection 2: Created automatically from EP titles or contains EP pattern
      const hasEpPattern =
        /\b(?:ep\.?|ตอนที่)\s*\d+/i.test(tag.name) ||
        tag.name.includes('5 อันดับ') ||
        tag.name.includes('10 อันดับ') ||
        tag.name.includes('20 อันดับ') ||
        (tag.description && tag.description.includes('สร้างอัตโนมัติจากชื่อรายการจัดอันดับ'));

      if (hasEpPattern) {
        results.push({
          tag,
          usageCount: usage,
          reason: `มีรูปแบบชื่อตอน/ลำดับ EP ในชื่อแท็ก`,
          categoryType: 'CONTAINS_EP_OR_RANK',
        });
        return;
      }

      // Detection 3: Long sentence (unusually long for a category tag, likely a title)
      if (tag.name.length >= 25 || tag.name.split(' ').length >= 5) {
        results.push({
          tag,
          usageCount: usage,
          reason: `ชื่อยาวผิดปกติคล้ายชื่อคลิป (${tag.name.length} ตัวอักษร)`,
          categoryType: 'LONG_TITLE',
        });
        return;
      }

      // Detection 4: Zero usage count & created by Sheet import description
      if (
        usage === 0 &&
        tag.description &&
        tag.description.includes('นำเข้าอัตโนมัติจาก Google Sheets')
      ) {
        results.push({
          tag,
          usageCount: usage,
          reason: `แท็กว่างที่ถูกสร้างจากชีทแต่ไม่มีคลิปใดใช้งาน (0 คลิป)`,
          categoryType: 'ZERO_USAGE',
        });
        return;
      }
    });

    return results.sort((a, b) => b.usageCount - a.usageCount || a.tag.name.localeCompare(b.tag.name));
  }, [tags, computedFootage, episodes]);

  // Filtered by Search & Tab Filter
  const filteredTags = useMemo(() => {
    return analyzedJunkTags.filter((item) => {
      if (filterType !== 'ALL_JUNK' && item.categoryType !== filterType) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          item.tag.name.toLowerCase().includes(q) ||
          item.reason.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [analyzedJunkTags, filterType, searchQuery]);

  // Pre-select all detected junk tags initially
  const handleSelectAllFiltered = () => {
    setSelectedTagIds((prev) => {
      const next = new Set(prev);
      filteredTags.forEach((item) => next.add(item.tag.id));
      return next;
    });
  };

  const handleDeselectAll = () => {
    setSelectedTagIds(new Set());
  };

  const handleToggleTag = (tagId: string) => {
    setSelectedTagIds((prev) => {
      const next = new Set(prev);
      if (next.has(tagId)) {
        next.delete(tagId);
      } else {
        next.add(tagId);
      }
      return next;
    });
  };

  // Execution: Batch Delete Selected Tags
  const handleExecuteDelete = async () => {
    if (selectedTagIds.size === 0) return;
    setIsDeleting(true);
    setDeleteProgress({ completed: 0, total: selectedTagIds.size });

    try {
      const result = await batchDeleteTags(Array.from(selectedTagIds), (chunkProg) => {
        setDeleteProgress({
          completed: chunkProg.completedOps,
          total: chunkProg.totalOps,
        });
      });

      setSuccessReport(result);
      setSelectedTagIds(new Set());
    } catch (err) {
      console.error('Batch delete junk tags failed:', err);
    } finally {
      setIsDeleting(false);
      setDeleteProgress(null);
    }
  };

  const countsByCategory = useMemo<Record<JunkTagConcreteType, number>>(() => {
    const counts: Record<JunkTagConcreteType, number> = {
      MATCHES_CLIP_OR_EP: 0,
      CONTAINS_EP_OR_RANK: 0,
      ZERO_USAGE: 0,
      LONG_TITLE: 0,
    };
    analyzedJunkTags.forEach((item) => {
      counts[item.categoryType] = (counts[item.categoryType] || 0) + 1;
    });
    return counts;
  }, [analyzedJunkTags]);

  const selectedCount = selectedTagIds.size;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={isDeleting ? () => {} : onClose}
      maxWidthClass="max-w-4xl"
      heightClass="h-[88dvh] sm:h-[84vh]"
      icon={<Trash2 className="w-5 h-5 text-rose-600" />}
      title="เครื่องมือสแกนและล้างแท็กชื่อคลิป / แท็กขยะออกจากคลัง"
      badge={
        <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 font-bold">
          {analyzedJunkTags.length} แท็กต้องสงสัย
        </span>
      }
      subtitle="ระบบตรวจจับแท็กที่ตรงกับชื่อคลิป, มีคำว่า EP./อันดับ, หรือเป็นประโยคยาวที่เผลอถูกสร้างตอนซิงก์จาก Sheet"
      bodyClassName="p-0 bg-[#FAF8F5] flex flex-col overflow-hidden"
      footer={
        !successReport && (
          <div className="flex flex-wrap items-center justify-between gap-3 w-full">
            <div className="text-xs text-[#6E5F52]">
              เลือกที่จะลบ:{' '}
              <strong className="font-mono tabular-nums text-rose-700 font-extrabold text-sm">
                {selectedCount.toLocaleString()}
              </strong>
              /{filteredTags.length.toLocaleString()} แท็ก{' '}
              <span className="text-slate-400">
                (ถอดออกจากคลิปอย่างปลอดภัย คลิปที่เหลือ 0 แท็กจะกลับสู่ไม่มีหมวดหมู่)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#6E5F52] hover:bg-[#FAF7F2] transition-colors cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
              <button
                type="button"
                onClick={handleExecuteDelete}
                disabled={selectedCount === 0 || isDeleting}
                className={`inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                  selectedCount > 0 && !isDeleting
                    ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs hover:shadow-md active:scale-98'
                    : 'bg-[#E5DED4] text-[#8E8174] border border-[#D8CFC3] cursor-not-allowed opacity-70'
                }`}
              >
                <Trash2 className="w-4 h-4" />
                <span>
                  {isDeleting
                    ? `กำลังลบแท็ก (${deleteProgress?.completed || 0}/${deleteProgress?.total || selectedCount})...`
                    : selectedCount > 0
                    ? `ยืนยันลบ ${selectedCount.toLocaleString()} แท็กออกจากคลัง ➔`
                    : 'กรุณาติ๊กเลือกแท็กที่ต้องการลบ'}
                </span>
              </button>
            </div>
          </div>
        )
      }
    >
      {successReport ? (
        <div className="flex-1 p-8 flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-extrabold text-[#2D241E]">
              ลบแท็กชื่อคลิป/แท็กขยะเรียบร้อยแล้ว!
            </h3>
            <p className="text-xs text-[#6E5F52]">
              ลบแท็กออกจากระบบทั้งหมด{' '}
              <strong className="text-emerald-700 font-mono text-sm">
                {successReport.deletedCount}
              </strong>{' '}
              แท็ก และปรับปรุงฟุตเทจ{' '}
              <strong className="text-emerald-700 font-mono text-sm">
                {successReport.updatedFootagesCount}
              </strong>{' '}
              คลิป ซิงก์ขึ้น Cloud (Firestore) เรียบร้อยแล้ว
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setSuccessReport(null);
            }}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-[#3B6845] hover:bg-[#2D5236] text-white cursor-pointer"
          >
            สแกนตรวจสอบต่อ
          </button>
        </div>
      ) : (
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          {/* Top Search & Filter Toolbar */}
          <div className="p-3 bg-white border-b border-[#E8DFD3] shrink-0 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              {/* Category Pills */}
              <div className="flex flex-wrap items-center gap-1.5 bg-[#FAF7F2] p-1 rounded-xl border border-[#E8DFD3] text-xs">
                <button
                  type="button"
                  onClick={() => setFilterType('ALL_JUNK')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    filterType === 'ALL_JUNK'
                      ? 'bg-white text-rose-800 shadow-xs'
                      : 'text-[#6E5F52] hover:text-[#2D241E]'
                  }`}
                >
                  ทั้งหมด ({analyzedJunkTags.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType('MATCHES_CLIP_OR_EP')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                    filterType === 'MATCHES_CLIP_OR_EP'
                      ? 'bg-rose-50 text-rose-800 shadow-xs font-bold'
                      : 'text-[#6E5F52] hover:text-rose-800'
                  }`}
                >
                  ตรงกับชื่อคลิป/EP ({countsByCategory.MATCHES_CLIP_OR_EP})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType('CONTAINS_EP_OR_RANK')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                    filterType === 'CONTAINS_EP_OR_RANK'
                      ? 'bg-rose-50 text-rose-800 shadow-xs font-bold'
                      : 'text-[#6E5F52] hover:text-rose-800'
                  }`}
                >
                  มีคำว่า EP./อันดับ ({countsByCategory.CONTAINS_EP_OR_RANK})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType('ZERO_USAGE')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                    filterType === 'ZERO_USAGE'
                      ? 'bg-rose-50 text-rose-800 shadow-xs font-bold'
                      : 'text-[#6E5F52] hover:text-rose-800'
                  }`}
                >
                  ไม่ได้ใช้งาน (0 คลิป) ({countsByCategory.ZERO_USAGE})
                </button>
              </div>

              {/* Search */}
              <div className="relative min-w-[200px] sm:min-w-[240px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ค้นหาชื่อแท็ก..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-[#E3D8CB] bg-[#FAF8F5] text-xs focus:outline-none focus:ring-1 focus:ring-rose-400"
                />
              </div>
            </div>

            {/* Selection Quick Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 text-xs">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSelectAllFiltered}
                  className="px-2.5 py-1 rounded-lg font-bold bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100 transition-colors cursor-pointer"
                >
                  เลือกแท็กที่พบทั้งหมด ({filteredTags.length})
                </button>
                <button
                  type="button"
                  onClick={handleDeselectAll}
                  className="px-2.5 py-1 rounded-lg text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
                >
                  ล้างการเลือก
                </button>
              </div>

              <div className="text-[11px] text-slate-400">
                คลิกแถวเพื่อเลือกหรือยกเลิกทีละรายการ
              </div>
            </div>
          </div>

          {/* Table / List View */}
          <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin">
            {filteredTags.length === 0 ? (
              <div className="p-12 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="text-xs font-bold text-[#2D241E]">
                  ไม่พบแท็กที่เป็นชื่อคลิปหรือแท็กต้องสงสัยในเงื่อนไขนี้
                </div>
                <div className="text-[11px] text-[#8E8174]">
                  หมวดหมู่ในคลังคลิปสะอาดเรียบร้อยดี
                </div>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#FAF7F2] text-[11px] font-bold text-[#6E5F52] border-b border-[#E8DFD3] sticky top-0 z-10 select-none">
                  <tr>
                    <th className="p-3 text-center w-10">
                      <input
                        type="checkbox"
                        checked={
                          filteredTags.length > 0 &&
                          filteredTags.every((t) => selectedTagIds.has(t.tag.id))
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            handleSelectAllFiltered();
                          } else {
                            handleDeselectAll();
                          }
                        }}
                        className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-slate-300 cursor-pointer"
                      />
                    </th>
                    <th className="p-3">ชื่อแท็กในคลัง (#TagName)</th>
                    <th className="p-3 w-48">สาเหตุที่ตรวจพบ</th>
                    <th className="p-3 w-28 text-center">คลิปที่ใช้งาน</th>
                    <th className="p-3 w-32">ระดับหมวดหมู่</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredTags.map((item) => {
                    const isSelected = selectedTagIds.has(item.tag.id);
                    return (
                      <tr
                        key={item.tag.id}
                        onClick={() => handleToggleTag(item.tag.id)}
                        className={`transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-rose-50/70 hover:bg-rose-50'
                            : 'hover:bg-slate-50'
                        }`}
                      >
                        <td
                          className="p-3 text-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleTag(item.tag.id)}
                            className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-slate-300 cursor-pointer"
                          />
                        </td>
                        <td className="p-3">
                          <div className="font-extrabold text-[#2D241E] flex items-center gap-1.5">
                            <Tag className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                            <span>#{item.tag.name}</span>
                          </div>
                          {item.matchedTitleSnippet && (
                            <div className="text-[11px] text-slate-500 truncate max-w-md mt-0.5">
                              คลิป: {item.matchedTitleSnippet}
                            </div>
                          )}
                        </td>
                        <td className="p-3 text-[11px] text-rose-700 font-semibold">
                          {item.reason}
                        </td>
                        <td className="p-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full font-mono text-[11px] font-bold ${
                              item.usageCount === 0
                                ? 'bg-slate-100 text-slate-500'
                                : 'bg-amber-100 text-amber-900'
                            }`}
                          >
                            {item.usageCount.toLocaleString()} คลิป
                          </span>
                        </td>
                        <td className="p-3 text-[11px] text-slate-500">
                          {item.tag.tier === 2 ? 'หมวดย่อย (Tier 2)' : 'หมวดหลัก (Tier 1)'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </BaseModal>
  );
};
