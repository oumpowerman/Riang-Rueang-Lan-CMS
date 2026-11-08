import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus,
  X,
  Edit2,
  Trash2,
  ChevronRight,
  Layers,
  MousePointerClick,
  Check,
} from 'lucide-react';
import { CategoryMatrixStat } from '../../../context/CMSContext';
import { CategoryGroup, CategoryTag } from '../../../types/tag.types';
import {
  COLOR_OPTIONS,
  getPastelColorConfig,
} from '../constants/tagPastelPalette';

interface Tier1MainCategoryColumnProps {
  activeGroup: CategoryGroup | null;
  mainCategoriesInActiveGroup: CategoryTag[];
  activeMainCat: CategoryTag | null;
  tags: CategoryTag[];
  categoryMatrix: CategoryMatrixStat[];
  isEditingMainCat: boolean;
  setIsEditingMainCat: (val: boolean) => void;
  editingMainCatId: string | null;
  mainCatFormName: string;
  setMainCatFormName: (val: string) => void;
  mainCatFormColor: string;
  setMainCatFormColor: (val: string) => void;
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
  categoryMatrix,
  isEditingMainCat,
  setIsEditingMainCat,
  editingMainCatId,
  mainCatFormName,
  setMainCatFormName,
  mainCatFormColor,
  setMainCatFormColor,
  mainCatFormDesc,
  setMainCatFormDesc,
  onOpenAddMainCat,
  onOpenEditMainCat,
  onSaveMainCat,
  onSelectMainCat,
  onRequestDeleteTag,
}) => {
  return (
    <div className="flex flex-col h-full min-h-0 bg-[#faf8f5] overflow-hidden">
      <div className="p-3 border-b border-[#e5ded4] flex items-center justify-between bg-white shrink-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="w-5 h-5 rounded-md bg-[#dce9f4] text-[#1b3d5b] text-[11px] font-bold flex items-center justify-center shrink-0">
            2
          </span>
          <span className="text-xs font-bold text-[#3e3427] truncate">
            ป้ายแท็กหลักใน:{' '}
            <span className="text-[#2b4c6b]">
              {activeGroup?.name || 'มิตินี้'}
            </span>
          </span>
          <span className="text-[10px] font-mono bg-[#eee7dc] text-[#635749] px-1.5 py-0.2 rounded-full shrink-0">
            {mainCategoriesInActiveGroup.length}
          </span>
        </div>
        {activeGroup && (
          <button
            type="button"
            onClick={onOpenAddMainCat}
            className="text-[11px] font-semibold text-[#24496b] hover:text-[#14324d] bg-[#edf4fa] hover:bg-[#dfeaf4] px-2 py-1 rounded-md transition-colors flex items-center gap-0.5 shrink-0 cursor-pointer"
          >
            <Plus className="w-3 h-3" />
            <span>เพิ่มแท็กหลัก</span>
          </button>
        )}
      </div>

      {/* Add / Edit Main Cat Inline Form (Now includes Pastel Color Swatch Picker!) */}
      <AnimatePresence>
        {isEditingMainCat && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={onSaveMainCat}
            className="p-3 bg-[#f2f7fb] border-b border-[#caddee] space-y-2.5 shrink-0 overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#1b3c5c]">
                {editingMainCatId
                  ? 'แก้ไขป้ายแท็กหลัก & โทนสี'
                  : `เพิ่มป้ายแท็กหลักใต้ ${activeGroup?.name}`}
              </span>
              <button
                type="button"
                onClick={() => setIsEditingMainCat(false)}
                className="text-xs text-[#8c8072] hover:text-[#3d3429] cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div>
              <label className="text-[10px] font-semibold text-[#2b4b6a] block mb-0.5">
                ชื่อป้ายแท็กหลัก (เช่น ดาราฮาๆ, แกล้งสุดฮา, สัมภาษณ์ฮาๆ):
              </label>
              <input
                type="text"
                value={mainCatFormName}
                onChange={(e) => setMainCatFormName(e.target.value)}
                placeholder="ชื่อป้ายแท็กหลัก..."
                autoFocus
                className="w-full bg-white border border-[#b8cfe3] rounded-md px-2.5 py-1 text-xs text-[#3e3427] focus:outline-hidden focus:ring-1 focus:ring-[#628fb6]"
              />
            </div>

            {/* Pastel Color Swatch Picker */}
            <div>
              <label className="text-[10px] font-semibold text-[#2b4b6a] block mb-1">
                เลือกโทนสีพาสเทลประจำป้าย (Pastel Color Swatch):
              </label>
              <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-white/95 rounded-xl border border-[#b8cfe3]">
                {COLOR_OPTIONS.map((c) => {
                  const isColorSelected = mainCatFormColor === c.value;
                  return (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setMainCatFormColor(c.value)}
                      title={c.label}
                      className={`px-2 py-1 rounded-lg border text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                        isColorSelected
                          ? `${c.badgeBg} ring-2 ${c.ringColor} shadow-2xs`
                          : 'bg-[#FAF8F5] border-[#E8E2D8] text-[#524538] hover:bg-white'
                      }`}
                    >
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${c.swatchBg}`}
                      />
                      <span>{c.shortLabel.split(' ')[0]}</span>
                      {isColorSelected && <Check className="w-2.5 h-2.5" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-semibold text-[#2b4b6a] block mb-0.5">
                คำอธิบายแท็ก (ไม่บังคับ):
              </label>
              <input
                type="text"
                value={mainCatFormDesc}
                onChange={(e) => setMainCatFormDesc(e.target.value)}
                placeholder="รายละเอียดสั้นๆ..."
                className="w-full bg-white border border-[#b8cfe3] rounded-md px-2.5 py-1 text-xs text-[#3e3427] focus:outline-hidden"
              />
            </div>

            <div className="flex items-center gap-1.5 pt-1">
              <button
                type="submit"
                disabled={!mainCatFormName.trim()}
                className="bg-[#2c5378] hover:bg-[#1e3c59] disabled:opacity-50 text-white text-xs px-3.5 py-1.5 rounded-lg font-semibold cursor-pointer transition-colors"
              >
                บันทึกแท็กหลัก
              </button>
              <button
                type="button"
                onClick={() => setIsEditingMainCat(false)}
                className="text-xs text-[#7d7162] hover:text-[#3d3429] px-2 py-1 cursor-pointer"
              >
                ยกเลิก
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Main Categories List */}
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin p-2.5">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeGroup?.id || 'no-group'}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            className="h-full space-y-1.5"
          >
            {!activeGroup ? (
              <div className="h-full flex flex-col items-center justify-center p-6 text-center">
                <div className="w-11 h-11 rounded-2xl bg-[#f0ebd9] border border-[#ded5be] text-[#78613d] flex items-center justify-center mb-3">
                  <MousePointerClick className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-[#453728] mb-1">
                  ยังไม่ได้เลือกมิติกลุ่มแท็ก
                </p>
                <p className="text-[11px] text-[#7d7162] max-w-[210px] leading-relaxed">
                  กรุณาเลือกมิติในคอลัมน์ที่ 1 เพื่อดูหรือจัดการป้ายแท็กหลัก
                </p>
              </div>
            ) : mainCategoriesInActiveGroup.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-6 text-center">
                <div className="w-11 h-11 rounded-2xl bg-[#edf4fa] border border-[#d2e3f2] text-[#2f557b] flex items-center justify-center mb-3">
                  <Layers className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-[#453728] mb-1">
                  ยังไม่มีแท็กหลักในมิติ &quot;{activeGroup.name}&quot;
                </p>
                <p className="text-[11px] text-[#7d7162] max-w-[220px] leading-relaxed mb-3.5">
                  สร้างป้ายแท็กหลักเพื่อใช้จัดกลุ่มเนื้อหาและเชื่อมโยงไปยังป้ายแท็กย่อย / คุณลักษณะ
                </p>
                {!isEditingMainCat && (
                  <button
                    type="button"
                    onClick={onOpenAddMainCat}
                    className="text-xs font-semibold text-[#24496b] bg-[#edf4fa] hover:bg-[#dfeaf4] border border-[#b8cfe3] px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>เพิ่มป้ายแท็กหลักรายการแรก</span>
                  </button>
                )}
              </div>
            ) : (
              mainCategoriesInActiveGroup.map((cat) => {
                const isSelected = activeMainCat?.id === cat.id;
                const subCount = tags.filter(
                  (t) => t.tier === 2 && t.parentId === cat.id
                ).length;
                const stat = categoryMatrix.find((m) => m.tag.id === cat.id);
                const usableCount = stat?.usableCount || 0;
                const totalCount = stat?.totalCount || 0;
                const epCount = stat?.producibleEpisodesCount || 0;
                const colorCfg = getPastelColorConfig(cat.color);

                return (
                  <div
                    key={cat.id}
                    onClick={() => onSelectMainCat(cat.id)}
                    className={`group p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                      isSelected
                        ? 'bg-[#e7f1f9] text-[#1b4369] border-[#b2d5ed] shadow-2xs font-semibold ring-1 ring-[#c2def4]'
                        : 'bg-white hover:bg-[#faf7f2] border-[#e8e2d8] text-[#4d4133] font-medium'
                    }`}
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="text-xs truncate flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`w-2.5 h-2.5 rounded-full shrink-0 ${colorCfg.swatchBg}`}
                          title={`โทนสี: ${colorCfg.shortLabel}`}
                        />
                        <span className="font-bold">#{cat.name}</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                            isSelected
                              ? 'bg-[#cce2f4] text-[#123657]'
                              : 'bg-[#eee7dc] text-[#695d4f]'
                          }`}
                        >
                          {subCount} ย่อย
                        </span>
                      </div>

                      {/* Integrated Footage & EP Capacity Statistics */}
                      <div className="flex items-center gap-1.5 flex-wrap text-[11px] font-mono">
                        <span className="px-1.5 py-0.2 rounded bg-white/90 border border-[#E2D5C4] text-[#524538]">
                          พร้อมใช้{' '}
                          <strong className="text-[#1C4824]">
                            {usableCount}
                          </strong>
                          /{totalCount} ฟุต
                        </span>
                        {epCount > 0 && (
                          <span className="px-1.5 py-0.2 rounded bg-[#EEF5EE] border border-[#BAD8BF] text-[#1C4824] font-bold">
                            {epCount} EP
                          </span>
                        )}
                      </div>

                      {cat.description && (
                        <p
                          className={`text-[10px] truncate ${
                            isSelected ? 'text-[#31567d]' : 'text-[#8c8072]'
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
                        className={`p-1 rounded-md transition-colors cursor-pointer ${
                          isSelected
                            ? 'text-[#2b5177] hover:text-[#142d45] hover:bg-[#d0e4f5]'
                            : 'text-[#8c8072] hover:text-[#3d3429] hover:bg-[#eee7dc]'
                        }`}
                        title="แก้ไขแท็กนี้และโทนสี"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRequestDeleteTag(cat.id);
                        }}
                        className={`p-1 rounded-md transition-colors cursor-pointer ${
                          isSelected
                            ? 'text-[#8a3c31] hover:text-[#612117] hover:bg-[#f8deda]'
                            : 'text-[#8c8072] hover:text-[#8a3c31] hover:bg-[#faeae8]'
                        }`}
                        title="ลบแท็กนี้ (รวมถึงคุณลักษณะด้านใน)"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                      <ChevronRight
                        className={`w-4 h-4 transition-transform ${
                          isSelected
                            ? 'text-[#1e4770] translate-x-0.5'
                            : 'text-[#c7bdb0]'
                        }`}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};
