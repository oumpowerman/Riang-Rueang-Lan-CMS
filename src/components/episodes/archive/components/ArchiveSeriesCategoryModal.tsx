import React, { useMemo, useState } from 'react';
import {
  Check,
  Edit2,
  FolderKanban,
  Plus,
  Search,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { ArchiveSeriesCategory } from '../../../../types/tag.types';
import { BaseModal } from '../../../ui/BaseModal';
import type {
  ArchiveCategorySummary,
  CategoryRankingItem,
} from '../hooks/useMasterArchiveMetrics';

interface ArchiveSeriesCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  archiveCategories: ArchiveSeriesCategory[];
  archiveCategoryStats: ArchiveCategorySummary[];
  seriesRanking: CategoryRankingItem[];
  onAssignSeriesToCategory: (seriesKey: string, categoryId: string) => void;
  onAddCategory: (name: string, color?: string) => void;
  onRenameCategory: (categoryId: string, newName: string) => void;
  onDeleteCategory: (categoryId: string) => void;
}

export const ArchiveSeriesCategoryModal: React.FC<
  ArchiveSeriesCategoryModalProps
> = ({
  isOpen,
  onClose,
  archiveCategories,
  archiveCategoryStats,
  seriesRanking,
  onAssignSeriesToCategory,
  onAddCategory,
  onRenameCategory,
  onDeleteCategory,
}) => {
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(
    null
  );
  const [editingNameValue, setEditingNameValue] = useState('');
  const [filterCatId, setFilterCatId] = useState<string>('ALL');
  const [seriesSearch, setSeriesSearch] = useState('');

  const filteredSeries = useMemo(() => {
    const q = seriesSearch.trim().toLowerCase();
    return seriesRanking.filter((item) => {
      if (filterCatId !== 'ALL' && item.archiveCategoryId !== filterCatId) {
        return false;
      }
      if (!q) return true;
      return (
        item.seriesName.toLowerCase().includes(q) ||
        item.fullSeriesTitle.toLowerCase().includes(q)
      );
    });
  }, [seriesRanking, filterCatId, seriesSearch]);

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    onAddCategory(newCategoryName.trim());
    setNewCategoryName('');
  };

  const handleSaveRename = (catId: string) => {
    if (editingNameValue.trim()) {
      onRenameCategory(catId, editingNameValue.trim());
    }
    setEditingCategoryId(null);
    setEditingNameValue('');
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      maxWidthClass="max-w-5xl"
      icon={<FolderKanban className="w-5 h-5 text-[#3B6845]" />}
      title="จัดการหมวดหมู่คลังคลิปหลัก & จัดกลุ่มรายการ 5 อันดับ"
      subtitle={`สกัดพบรายการ "5 อันดับ..." ทั้งหมด ${seriesRanking.length} รายการ (แยกอิสระจากแท็กฟุตเทจย่อย สามารถสร้างหมวดและจัดกลุ่มเองได้ทันที)`}
      footer={
        <div className="flex items-center justify-between gap-3 text-xs">
          <span className="text-[#6E665E]">
            การเปลี่ยนแปลงหมวดหมู่คลังคลิปหลักจะถูกบันทึกอัตโนมัติแบบเรียลไทม์
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#3B6845] hover:bg-[#2C5234] text-white font-bold transition-colors cursor-pointer"
          >
            เสร็จสิ้น
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* SECTION 1: Custom Archive Categories Management */}
        <div className="bg-white border border-[#E5DED4] rounded-2xl p-4 space-y-3 shadow-2xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-xs font-extrabold text-[#2D2926]">
                1. หมวดหมู่ของคลังคลิปหลัก ({archiveCategories.length} หมวด)
              </h3>
              <p className="text-[11px] text-[#787066]">
                สร้างหมวดหมู่เพื่อจัดระเบียบรายการ 5 อันดับในคลังคลิปหลักของคุณเอง
              </p>
            </div>

            <form
              onSubmit={handleCreateCategory}
              className="flex items-center gap-1.5"
            >
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="ตั้งชื่อหมวดคลังคลิปใหม่..."
                className="px-3 py-1.5 rounded-xl bg-[#FAF8F5] border border-[#DED3C5] text-xs text-[#2D2926] placeholder:text-[#9C9286] focus:outline-none focus:border-[#3B6845] w-48 sm:w-60"
              />
              <button
                type="submit"
                disabled={!newCategoryName.trim()}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#3B6845] hover:bg-[#2C5234] disabled:opacity-40 text-white text-xs font-bold transition-colors cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>เพิ่มหมวดคลังคลิป</span>
              </button>
            </form>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {archiveCategoryStats.map(({ category, seriesCount, episodeCount }) => {
              const isEditing = editingCategoryId === category.id;
              const isFilterActive = filterCatId === category.id;

              return (
                <div
                  key={category.id}
                  className={`p-2.5 rounded-xl border transition-all flex items-center justify-between gap-2 ${
                    isFilterActive
                      ? 'bg-[#EDF4ED] border-[#9EC49C] ring-1 ring-[#BAD8B9]'
                      : 'bg-[#FAF8F5] border-[#E5DED4]'
                  }`}
                >
                  {isEditing ? (
                    <div className="flex items-center gap-1 flex-1 min-w-0">
                      <input
                        type="text"
                        value={editingNameValue}
                        onChange={(e) => setEditingNameValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveRename(category.id);
                          if (e.key === 'Escape') setEditingCategoryId(null);
                        }}
                        autoFocus
                        className="flex-1 min-w-0 px-2 py-1 rounded-lg bg-white border border-[#3B6845] text-xs font-bold text-[#2D2926] focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveRename(category.id)}
                        className="p-1 rounded-lg bg-[#3B6845] text-white cursor-pointer"
                        title="บันทึกชื่อหมวด"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingCategoryId(null)}
                        className="p-1 rounded-lg bg-[#EFECE6] text-[#5C5349] cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          setFilterCatId(
                            isFilterActive ? 'ALL' : category.id
                          )
                        }
                        className="text-left min-w-0 flex-1 cursor-pointer"
                      >
                        <div className="text-xs font-extrabold text-[#2D2926] truncate">
                          {category.name}
                        </div>
                        <div className="text-[11px] font-mono text-[#6E665E] tabular-nums">
                          {seriesCount} รายการ · {episodeCount} คลิป
                        </div>
                      </button>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCategoryId(category.id);
                            setEditingNameValue(category.name);
                          }}
                          className="p-1.5 rounded-lg text-[#6E665E] hover:text-[#2D2926] hover:bg-white transition-colors cursor-pointer"
                          title="เปลี่ยนชื่อหมวดหมู่"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {archiveCategories.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              if (filterCatId === category.id) {
                                setFilterCatId('ALL');
                              }
                              onDeleteCategory(category.id);
                            }}
                            className="p-1.5 rounded-lg text-[#8E4537] hover:bg-[#FDF3EC] transition-colors cursor-pointer"
                            title="ลบหมวดหมู่นี้ (รายการข้างในจะถูกย้ายไปหมวดแรกอัตโนมัติ)"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* SECTION 2: Assign "5 อันดับ [ชื่อรายการ]" Series into Archive Categories */}
        <div className="bg-white border border-[#E5DED4] rounded-2xl p-4 space-y-3 shadow-2xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#8A5A22]" />
              <h3 className="text-xs font-extrabold text-[#2D2926]">
                2. รายการ &ldquo;5 อันดับ...&rdquo; ที่สกัดได้จากคลังคลิปหลัก ({filteredSeries.length}/
                {seriesRanking.length} รายการ)
              </h3>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {filterCatId !== 'ALL' && (
                <button
                  type="button"
                  onClick={() => setFilterCatId('ALL')}
                  className="px-2.5 py-1 rounded-lg bg-[#FAF2E1] text-[#6B4616] text-xs font-bold cursor-pointer"
                >
                  แสดงทุกรายการ ({seriesRanking.length})
                </button>
              )}

              <div className="relative w-60">
                <Search className="w-3.5 h-3.5 text-[#8C7B6C] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={seriesSearch}
                  onChange={(e) => setSeriesSearch(e.target.value)}
                  placeholder="ค้นหาชื่อรายการ 5 อันดับ..."
                  className="w-full pl-8 pr-7 py-1.5 rounded-xl bg-[#FAF8F5] border border-[#DED3C5] text-xs text-[#2D2926] placeholder:text-[#9C9286] focus:outline-none focus:border-[#3B6845]"
                />
                {seriesSearch && (
                  <button
                    type="button"
                    onClick={() => setSeriesSearch('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8C7B6C]"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto scrollbar-thin divide-y divide-[#EFE8DC] border border-[#EAE1D5] rounded-xl bg-[#FAF8F5]">
            {filteredSeries.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#8C7B6C]">
                ไม่พบรายการ 5 อันดับตามคำค้นหา
              </div>
            ) : (
              filteredSeries.map((series, idx) => (
                <div
                  key={series.seriesKey}
                  className="p-3 bg-white hover:bg-[#FAF7F2] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-6 h-6 rounded-lg bg-[#F3EDE3] text-[#5C5349] font-mono text-[11px] font-extrabold flex items-center justify-center shrink-0 tabular-nums">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-extrabold text-[#2D2926] truncate">
                          {series.fullSeriesTitle}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-[#E6F2E6] text-[#224A2D] border border-[#B5D6B3] font-mono text-[11px] font-bold tabular-nums shrink-0">
                          {series.episodeCount} คลิป
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Category Selector Pills for this Series */}
                  <div className="flex flex-wrap items-center gap-1 shrink-0">
                    {archiveCategories.map((cat) => {
                      const isAssigned = series.archiveCategoryId === cat.id;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() =>
                            onAssignSeriesToCategory(series.seriesKey, cat.id)
                          }
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer border ${
                            isAssigned
                              ? 'bg-[#3B6845] text-white border-[#3B6845] shadow-2xs'
                              : 'bg-[#FAF8F5] text-[#5C5349] border-[#E2D8C9] hover:bg-[#EDF4ED] hover:text-[#244B2F]'
                          }`}
                        >
                          {cat.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </BaseModal>
  );
};
