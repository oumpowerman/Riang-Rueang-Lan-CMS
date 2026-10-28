import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, X, Edit2, Trash2, Tags, MousePointerClick } from 'lucide-react';
import { CategoryTag, EntitySubtype } from '../../../types/tag.types';
import { getEntityIcon } from '../../ui/TagPill';

interface Tier2SubcategoryColumnProps {
  activeMainCat: CategoryTag | null;
  subcategoriesInActiveCat: CategoryTag[];
  isEditingSubCat: boolean;
  setIsEditingSubCat: (val: boolean) => void;
  editingSubCatId: string | null;
  subCatFormName: string;
  setSubCatFormName: (val: string) => void;
  subCatFormType: EntitySubtype;
  setSubCatFormType: (val: EntitySubtype) => void;
  subCatFormDesc: string;
  setSubCatFormDesc: (val: string) => void;
  onOpenAddSubCat: () => void;
  onOpenEditSubCat: (sub: CategoryTag, e: React.MouseEvent) => void;
  onSaveSubCat: (e: React.FormEvent) => void;
  onRequestDeleteTag: (tagId: string) => void;
}

export const Tier2SubcategoryColumn: React.FC<Tier2SubcategoryColumnProps> = ({
  activeMainCat,
  subcategoriesInActiveCat,
  isEditingSubCat,
  setIsEditingSubCat,
  editingSubCatId,
  subCatFormName,
  setSubCatFormName,
  subCatFormType,
  setSubCatFormType,
  subCatFormDesc,
  setSubCatFormDesc,
  onOpenAddSubCat,
  onOpenEditSubCat,
  onSaveSubCat,
  onRequestDeleteTag,
}) => {
  return (
    <div className="flex flex-col h-full min-h-0 bg-slate-50/50 overflow-hidden">
      <div className="p-3 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="w-5 h-5 rounded-md bg-amber-100 text-amber-800 text-[11px] font-bold flex items-center justify-center shrink-0">
            3
          </span>
          <span className="text-xs font-bold text-slate-800 truncate">
            หมวดย่อยใต้: <span className="text-blue-600">{activeMainCat?.name || 'หมวดนี้'}</span>
          </span>
          <span className="text-[10px] font-mono bg-slate-100 text-slate-500 px-1.5 py-0.2 rounded-full shrink-0">
            {subcategoriesInActiveCat.length}
          </span>
        </div>
        {activeMainCat && (
          <button
            type="button"
            onClick={onOpenAddSubCat}
            className="text-[11px] font-semibold text-amber-800 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 px-2 py-1 rounded-md transition-colors flex items-center gap-0.5 shrink-0 cursor-pointer"
          >
            <Plus className="w-3 h-3" />
            <span>เพิ่มหมวดย่อย</span>
          </button>
        )}
      </div>

      {/* Add / Edit Sub Cat Inline Form */}
      <AnimatePresence>
        {isEditingSubCat && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={onSaveSubCat}
            className="p-3 bg-amber-50/90 border-b border-amber-200 space-y-2.5 shrink-0"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-950">
                {editingSubCatId ? 'แก้ไขหมวดหมู่ย่อย' : `เพิ่มหมวดย่อยใต้ ${activeMainCat?.name}`}
              </span>
              <button
                type="button"
                onClick={() => setIsEditingSubCat(false)}
                className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div>
              <label className="text-[10px] font-semibold text-amber-900 block mb-0.5">
                ชื่อบุคคล / หมวดย่อย (เช่น พี่แจ๊ส, เอก HRK, คอร์กี้, ชวนคุย):
              </label>
              <input
                type="text"
                value={subCatFormName}
                onChange={(e) => setSubCatFormName(e.target.value)}
                placeholder="ชื่อบุคคลหรือหัวข้อ..."
                autoFocus
                className="w-full bg-white border border-amber-200 rounded-md px-2.5 py-1 text-xs text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="text-[10px] font-semibold text-amber-900 block mb-0.5">
                ประเภทข้อมูล (Entity Type):
              </label>
              <select
                value={subCatFormType}
                onChange={(e) => setSubCatFormType(e.target.value as EntitySubtype)}
                className="w-full bg-white border border-amber-200 rounded-md px-2 py-1 text-xs text-slate-700 focus:outline-hidden"
              >
                <option value="PERSON">บุคคล / สตรีมเมอร์ / ดารา</option>
                <option value="ANIMAL">สัตว์</option>
                <option value="TOPIC">หัวข้อ / เกม / คอนเซ็ปต์</option>
                <option value="ACTION">กิริยา / มุก / ท่าทาง</option>
                <option value="GENERAL">ทั่วไป</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-semibold text-amber-900 block mb-0.5">
                คำอธิบาย (ไม่บังคับ):
              </label>
              <input
                type="text"
                value={subCatFormDesc}
                onChange={(e) => setSubCatFormDesc(e.target.value)}
                placeholder="สไตล์มุกหรือจุดเด่น..."
                className="w-full bg-white border border-amber-200 rounded-md px-2.5 py-1 text-xs text-slate-800 focus:outline-hidden"
              />
            </div>

            <div className="flex items-center gap-1.5 pt-1">
              <button
                type="submit"
                disabled={!subCatFormName.trim()}
                className="bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs px-3 py-1 rounded-md font-semibold cursor-pointer"
              >
                บันทึกหมวดย่อย
              </button>
              <button
                type="button"
                onClick={() => setIsEditingSubCat(false)}
                className="text-xs text-slate-500 hover:text-slate-700 px-2 py-1"
              >
                ยกเลิก
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Subcategories List */}
      <div className="flex-1 min-h-0 overflow-y-auto p-2.5">
        {!activeMainCat ? (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center">
            <div className="w-11 h-11 rounded-2xl bg-slate-100 border border-slate-200 text-slate-400 flex items-center justify-center mb-3">
              <MousePointerClick className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-slate-600 mb-1">
              ยังไม่ได้เลือกหมวดหมู่หลัก
            </p>
            <p className="text-[11px] text-slate-400 max-w-[210px] leading-relaxed">
              กรุณาเลือกหมวดหมู่หลักในคอลัมน์ที่ 2 ก่อน เพื่อดูหรือเพิ่มหมวดหมู่ย่อย / บุคคล
            </p>
          </div>
        ) : subcategoriesInActiveCat.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center">
            <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center mb-3">
              <Tags className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-slate-700 mb-1">
              ยังไม่มีหมวดย่อยใต้ &quot;{activeMainCat.name}&quot;
            </p>
            <p className="text-[11px] text-slate-400 max-w-[220px] leading-relaxed mb-3.5">
              เพิ่มชื่อบุคคล สัตว์ หรือหัวข้อย่อย เพื่อระบุรายละเอียดฟุตเทจให้ชัดเจนยิ่งขึ้น
            </p>
            {!isEditingSubCat && (
              <button
                type="button"
                onClick={onOpenAddSubCat}
                className="text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>เพิ่มหมวดย่อยรายการแรก</span>
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-1.5">
            {subcategoriesInActiveCat.map((sub) => {
              return (
                <div
                  key={sub.id}
                  className="group p-2 rounded-xl border border-slate-200 bg-white hover:bg-amber-50/50 transition-all flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm shrink-0">{getEntityIcon(sub)}</span>
                    <div className="min-w-0">
                      <span className="text-xs font-semibold text-slate-800 truncate block">
                        {sub.name}
                      </span>
                      {sub.description && (
                        <p className="text-[10px] text-slate-400 truncate">{sub.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => onOpenEditSubCat(sub, e)}
                      className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                      title="แก้ไขหมวดย่อยนี้"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onRequestDeleteTag(sub.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                      title="ลบหมวดย่อยนี้"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
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
