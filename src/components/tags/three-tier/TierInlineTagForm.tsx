import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { FolderPlus, X } from 'lucide-react';
import { EntitySubtype } from '../../../types/tag.types';
import { COLOR_OPTIONS } from '../constants/tagPastelPalette';
import { TierThemeConfig } from './IndependentTierColumn';

interface TierInlineTagFormProps {
  theme: TierThemeConfig;
  subCategories: string[];
  // Add Sub-category Form State
  isAddingSubCat: boolean;
  setIsAddingSubCat: (val: boolean) => void;
  newSubCatName: string;
  setNewSubCatName: (val: string) => void;
  onSubmitNewSubCat: (e: React.FormEvent) => void;
  // Add / Edit Tag Form State
  activeTagFormSubCat: string | null;
  editingTagId: string | null;
  tagFormName: string;
  setTagFormName: (val: string) => void;
  tagFormSubCat: string;
  setTagFormSubCat: (val: string) => void;
  tagFormColor: string;
  setTagFormColor: (val: string) => void;
  tagFormEntity: EntitySubtype;
  setTagFormEntity: (val: EntitySubtype) => void;
  onSubmitTagForm: (e: React.FormEvent) => void;
  onCloseTagForm: () => void;
}

export const TierInlineTagForm: React.FC<TierInlineTagFormProps> = ({
  theme,
  subCategories,
  isAddingSubCat,
  setIsAddingSubCat,
  newSubCatName,
  setNewSubCatName,
  onSubmitNewSubCat,
  activeTagFormSubCat,
  editingTagId,
  tagFormName,
  setTagFormName,
  tagFormSubCat,
  setTagFormSubCat,
  tagFormColor,
  setTagFormColor,
  tagFormEntity,
  setTagFormEntity,
  onSubmitTagForm,
  onCloseTagForm,
}) => {
  return (
    <>
      {/* Inline Add New Sub-category Form */}
      <AnimatePresence initial={false}>
        {isAddingSubCat && (
          <motion.form
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            onSubmit={onSubmitNewSubCat}
            className="overflow-hidden"
          >
            <div className="p-2.5 rounded-xl bg-white border border-[#D8C5A6] flex items-center gap-2 shadow-2xs">
              <FolderPlus className="w-4 h-4 text-[#78593A] shrink-0" />
              <input
                type="text"
                value={newSubCatName}
                onChange={(e) => setNewSubCatName(e.target.value)}
                placeholder="ตั้งชื่อหมวดหมู่ย่อยใหม่ (เช่น สถานการณ์, สไตล์คลิป)..."
                autoFocus
                className="flex-1 min-w-0 h-8 text-xs px-2.5 rounded-lg border border-[#E2D5C4] text-[#3D332A] focus:outline-none focus:border-[#78593A]"
              />
              <button
                type="submit"
                disabled={!newSubCatName.trim()}
                className={`h-8 px-3 rounded-lg text-xs font-bold text-white disabled:opacity-50 ${theme.accentBtnBg} inline-flex items-center justify-center shrink-0 cursor-pointer`}
              >
                บันทึกหมวดย่อย
              </button>
              <button
                type="button"
                onClick={() => setIsAddingSubCat(false)}
                className="h-8 px-2.5 rounded-lg text-xs font-semibold text-[#7D6E61] hover:text-[#3D332A] hover:bg-[#FAF7F2] inline-flex items-center justify-center shrink-0 cursor-pointer"
              >
                ยกเลิก
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Inline Create / Edit Tag Form (Aligned 2x2 Grid Layout) */}
      <AnimatePresence initial={false}>
        {activeTagFormSubCat !== null && (
          <motion.form
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            onSubmit={onSubmitTagForm}
            className="overflow-hidden"
          >
            <div className="p-3.5 rounded-xl bg-white border-2 border-[#C8B69E] space-y-3 shadow-xs">
              {/* Form Header */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-extrabold text-[#3D332A] truncate">
                  {editingTagId
                    ? 'แก้ไขป้ายแท็ก'
                    : `เพิ่มป้ายแท็กใหม่ใน ${theme.badgeText}`}
                </span>
                <button
                  type="button"
                  onClick={onCloseTagForm}
                  className="w-6 h-6 rounded-md flex items-center justify-center text-[#8C7B6C] hover:text-[#3D332A] hover:bg-[#FAF7F2] transition-colors cursor-pointer shrink-0"
                  title="ปิดฟอร์ม"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Row 1: Tag Name + Sub-category (Strictly Aligned Horizontal Plane) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 items-end">
                <div className="min-w-0">
                  <label className="block text-[11px] font-bold text-[#6E5F52] leading-4 mb-1 truncate whitespace-nowrap">
                    ชื่อป้ายแท็ก (ไม่ต้องพิมพ์ #)
                  </label>
                  <input
                    type="text"
                    value={tagFormName}
                    onChange={(e) => setTagFormName(e.target.value)}
                    placeholder={theme.examplesPlaceholder}
                    autoFocus
                    className="w-full h-9 px-2.5 rounded-lg border border-[#D8C9B8] bg-white text-xs font-bold text-[#3D332A] placeholder:font-normal placeholder:text-[#A39485] focus:outline-none focus:border-[#78593A]"
                  />
                </div>

                <div className="min-w-0">
                  <label
                    className="block text-[11px] font-bold text-[#6E5F52] leading-4 mb-1 truncate whitespace-nowrap"
                    title="อยู่ในหมวดหมู่ย่อย (Sub-category)"
                  >
                    หมวดหมู่ย่อย (Sub-category)
                  </label>
                  <select
                    value={tagFormSubCat}
                    onChange={(e) => setTagFormSubCat(e.target.value)}
                    className="w-full h-9 px-2.5 rounded-lg border border-[#D8C9B8] bg-[#FAF8F5] text-xs font-semibold text-[#3D332A] focus:outline-none focus:border-[#78593A] cursor-pointer"
                  >
                    {subCategories.map((sc) => (
                      <option key={sc} value={sc}>
                        {sc}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 2: Color Swatches + Entity Type (Strictly Aligned Horizontal Plane) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 items-end">
                <div className="min-w-0">
                  <label className="block text-[11px] font-bold text-[#6E5F52] leading-4 mb-1 truncate whitespace-nowrap">
                    โทนสีป้ายแท็ก
                  </label>
                  <div className="w-full h-9 px-2.5 rounded-lg border border-[#D8C9B8] bg-[#FAF8F5] flex items-center justify-between gap-1">
                    {COLOR_OPTIONS.map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => setTagFormColor(c.value)}
                        className={`w-4 h-4 rounded-full flex items-center justify-center border transition-transform cursor-pointer shrink-0 ${
                          tagFormColor === c.value
                            ? 'scale-120 ring-2 ring-[#3D332A] border-white'
                            : 'border-black/10 opacity-75 hover:opacity-100'
                        }`}
                        title={c.label}
                      >
                        <span className={`w-3 h-3 rounded-full ${c.swatchBg}`} />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="min-w-0">
                  <label className="block text-[11px] font-bold text-[#6E5F52] leading-4 mb-1 truncate whitespace-nowrap">
                    ประเภทไอคอน (Entity)
                  </label>
                  <select
                    value={tagFormEntity}
                    onChange={(e) => setTagFormEntity(e.target.value as EntitySubtype)}
                    className="w-full h-9 px-2.5 rounded-lg border border-[#D8C9B8] bg-[#FAF8F5] text-xs font-semibold text-[#3D332A] focus:outline-none focus:border-[#78593A] cursor-pointer"
                  >
                    <option value="TOPIC">🎯 หมวด/ประเด็น</option>
                    <option value="ACTION">⚡ สถานการณ์/สไตล์</option>
                    <option value="PERSON">👤 บุคคล/รายการ</option>
                    <option value="ANIMAL">🐾 สัตว์</option>
                    <option value="GENERAL">🏷️ ทั่วไป</option>
                  </select>
                </div>
              </div>

              {/* Row 3: Action Buttons Footer */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#EFE8DC]">
                <button
                  type="button"
                  onClick={onCloseTagForm}
                  className="h-8 px-3.5 rounded-lg text-xs font-bold text-[#6E5F52] bg-[#FAF8F5] hover:bg-[#EFE8DC] border border-[#E2D5C4] inline-flex items-center justify-center transition-colors cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={!tagFormName.trim()}
                  className={`h-8 px-4 rounded-lg text-xs font-bold text-white disabled:opacity-50 ${theme.accentBtnBg} ${theme.accentBtnHover} inline-flex items-center justify-center transition-colors cursor-pointer shadow-2xs`}
                >
                  {editingTagId ? 'บันทึกการแก้ไข' : 'สร้างป้ายแท็ก'}
                </button>
              </div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </>
  );
};
