import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, X, Edit2, Trash2, ChevronRight, Layers, MousePointerClick } from 'lucide-react';
import { CategoryGroup, CategoryTag } from '../../../types/tag.types';

interface Tier1MainCategoryColumnProps {
  activeGroup: CategoryGroup | null;
  mainCategoriesInActiveGroup: CategoryTag[];
  activeMainCat: CategoryTag | null;
  tags: CategoryTag[];
  isEditingMainCat: boolean;
  setIsEditingMainCat: (val: boolean) => void;
  editingMainCatId: string | null;
  mainCatFormName: string;
  setMainCatFormName: (val: string) => void;
  mainCatFormDesc: string;
  setMainCatFormDesc: (val: string) => void;
  onOpenAddMainCat: () => void;
  onOpenEditMainCat: (cat: CategoryTag, e: React.MouseEvent) => void;
  onSaveMainCat: (e: React.FormEvent) => void;
  onSelectMainCat: (catId: string) => void;
  onRequestDeleteTag: (tagId: string) => void;
}

export const Tier1MainCategoryColumn: React.FC<Tier1MainCategoryColumnProps> = ({
  activeGroup,
  mainCategoriesInActiveGroup,
  activeMainCat,
  tags,
  isEditingMainCat,
  setIsEditingMainCat,
  editingMainCatId,
  mainCatFormName,
  setMainCatFormName,
  mainCatFormDesc,
  setMainCatFormDesc,
  onOpenAddMainCat,
  onOpenEditMainCat,
  onSaveMainCat,
  onSelectMainCat,
  onRequestDeleteTag,
}) => {
  return (
    <div className="flex flex-col h-full min-h-0 bg-slate-50/50 overflow-hidden">
      <div className="p-3 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="w-5 h-5 rounded-md bg-blue-100 text-blue-700 text-[11px] font-bold flex items-center justify-center shrink-0">
            2
          </span>
          <span className="text-xs font-bold text-slate-800 truncate">
            หมวดหมู่หลักใต้: <span className="text-indigo-600">{activeGroup?.name || 'กลุ่มนี้'}</span>
          </span>
          <span className="text-[10px] font-mono bg-slate-100 text-slate-500 px-1.5 py-0.2 rounded-full shrink-0">
            {mainCategoriesInActiveGroup.length}
          </span>
        </div>
        {activeGroup && (
          <button
            type="button"
            onClick={onOpenAddMainCat}
            className="text-[11px] font-semibold text-blue-700 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-md transition-colors flex items-center gap-0.5 shrink-0 cursor-pointer"
          >
            <Plus className="w-3 h-3" />
            <span>เพิ่มหมวดหลัก</span>
          </button>
        )}
      </div>

      {/* Add / Edit Main Cat Inline Form */}
      <AnimatePresence>
        {isEditingMainCat && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={onSaveMainCat}
            className="p-3 bg-blue-50/90 border-b border-blue-200 space-y-2.5 shrink-0"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-950">
                {editingMainCatId ? 'แก้ไขหมวดหมู่หลัก' : `เพิ่มหมวดหลักใต้ ${activeGroup?.name}`}
              </span>
              <button
                type="button"
                onClick={() => setIsEditingMainCat(false)}
                className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div>
              <label className="text-[10px] font-semibold text-blue-900 block mb-0.5">
                ชื่อหมวดหลัก (เช่น ดาราฮาๆ, YouTuber ฮาๆ, สตรีมเมอร์):
              </label>
              <input
                type="text"
                value={mainCatFormName}
                onChange={(e) => setMainCatFormName(e.target.value)}
                placeholder="ชื่อหมวดหลัก..."
                autoFocus
                className="w-full bg-white border border-blue-200 rounded-md px-2.5 py-1 text-xs text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="text-[10px] font-semibold text-blue-900 block mb-0.5">
                คำอธิบายหมวดหมู่ (ไม่บังคับ):
              </label>
              <input
                type="text"
                value={mainCatFormDesc}
                onChange={(e) => setMainCatFormDesc(e.target.value)}
                placeholder="รายละเอียดสั้นๆ..."
                className="w-full bg-white border border-blue-200 rounded-md px-2.5 py-1 text-xs text-slate-800 focus:outline-hidden"
              />
            </div>

            <div className="flex items-center gap-1.5 pt-1">
              <button
                type="submit"
                disabled={!mainCatFormName.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs px-3 py-1 rounded-md font-semibold cursor-pointer"
              >
                บันทึกหมวดหลัก
              </button>
              <button
                type="button"
                onClick={() => setIsEditingMainCat(false)}
                className="text-xs text-slate-500 hover:text-slate-700 px-2 py-1"
              >
                ยกเลิก
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Main Categories List */}
      <div className="flex-1 min-h-0 overflow-y-auto p-2.5">
        {!activeGroup ? (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center">
            <div className="w-11 h-11 rounded-2xl bg-slate-100 border border-slate-200 text-slate-400 flex items-center justify-center mb-3">
              <MousePointerClick className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-slate-600 mb-1">
              ยังไม่ได้เลือกกลุ่มหมวดหมู่
            </p>
            <p className="text-[11px] text-slate-400 max-w-[210px] leading-relaxed">
              กรุณาเลือกกลุ่มหมวดหมู่ในคอลัมน์ที่ 1 เพื่อดูหรือจัดการหมวดหมู่หลัก
            </p>
          </div>
        ) : mainCategoriesInActiveGroup.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center">
            <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-100 text-blue-500 flex items-center justify-center mb-3">
              <Layers className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-slate-700 mb-1">
              ยังไม่มีหมวดหลักใต้ &quot;{activeGroup.name}&quot;
            </p>
            <p className="text-[11px] text-slate-400 max-w-[220px] leading-relaxed mb-3.5">
              สร้างหมวดหมู่หลักเพื่อใช้จัดกลุ่มเนื้อหาและเชื่อมโยงไปยังหมวดหมู่ย่อยในลำดับถัดไป
            </p>
            {!isEditingMainCat && (
              <button
                type="button"
                onClick={onOpenAddMainCat}
                className="text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>เพิ่มหมวดหลักรายการแรก</span>
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-1.5">
            {mainCategoriesInActiveGroup.map((cat) => {
              const isSelected = activeMainCat?.id === cat.id;
              const subCount = tags.filter((t) => t.tier === 2 && t.parentId === cat.id).length;

              return (
                <div
                  key={cat.id}
                  onClick={() => onSelectMainCat(cat.id)}
                  className={`group p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs font-semibold'
                      : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-800 font-medium'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="text-xs truncate flex items-center gap-1.5">
                      <span>{cat.name}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                          isSelected ? 'bg-blue-700/80 text-white' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {subCount} ย่อย
                      </span>
                    </div>
                    {cat.description && (
                      <p
                        className={`text-[10px] truncate ${
                          isSelected ? 'text-blue-100' : 'text-slate-400'
                        }`}
                      >
                        {cat.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => onOpenEditMainCat(cat, e)}
                      className={`p-1 rounded-md transition-colors ${
                        isSelected
                          ? 'text-blue-200 hover:text-white hover:bg-blue-700'
                          : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200'
                      }`}
                      title="แก้ไขหมวดนี้"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRequestDeleteTag(cat.id);
                      }}
                      className={`p-1 rounded-md transition-colors ${
                        isSelected
                          ? 'text-blue-200 hover:text-rose-200 hover:bg-rose-900/40'
                          : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                      }`}
                      title="ลบหมวดนี้ (รวมถึงหมวดย่อยด้านใน)"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                    <ChevronRight
                      className={`w-4 h-4 transition-transform ${
                        isSelected ? 'text-white translate-x-0.5' : 'text-slate-300'
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
