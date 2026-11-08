import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, X, Edit2, Trash2, Tags, MousePointerClick } from 'lucide-react';
import { CategoryMatrixStat } from '../../../context/CMSContext';
import { CategoryTag, EntitySubtype } from '../../../types/tag.types';
import { getEntityIconNode } from '../../ui/TagPill';

interface Tier2SubcategoryColumnProps {
  activeMainCat: CategoryTag | null;
  subcategoriesInActiveCat: CategoryTag[];
  categoryMatrix: CategoryMatrixStat[];
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
  categoryMatrix,
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
    <div className="flex flex-col h-full min-h-0 bg-[#faf8f5] overflow-hidden">
      <div className="p-3 border-b border-[#e5ded4] flex items-center justify-between bg-white shrink-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="w-5 h-5 rounded-md bg-[#d8eedc] text-[#194523] text-[11px] font-bold flex items-center justify-center shrink-0">
            3
          </span>
          <span className="text-xs font-bold text-[#3e3427] truncate">
            ป้ายแท็กย่อยใต้:{' '}
            <span className="text-[#255431]">
              {activeMainCat?.name || 'แท็กนี้'}
            </span>
          </span>
          <span className="text-[10px] font-mono bg-[#eee7dc] text-[#635749] px-1.5 py-0.2 rounded-full shrink-0">
            {subcategoriesInActiveCat.length}
          </span>
        </div>
        {activeMainCat && (
          <button
            type="button"
            onClick={onOpenAddSubCat}
            className="text-[11px] font-semibold text-[#22502f] hover:text-[#13371e] bg-[#edf6ef] hover:bg-[#dfefe2] px-2 py-1 rounded-md transition-colors flex items-center gap-0.5 shrink-0 cursor-pointer"
          >
            <Plus className="w-3 h-3" />
            <span>เพิ่มแท็กย่อย</span>
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
            className="p-3 bg-[#f2f8f3] border-b border-[#c8dfce] space-y-2.5 shrink-0 overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#1a4725]">
                {editingSubCatId
                  ? 'แก้ไขป้ายแท็กย่อย'
                  : `เพิ่มป้ายแท็กย่อยใต้ #${activeMainCat?.name}`}
              </span>
              <button
                type="button"
                onClick={() => setIsEditingSubCat(false)}
                className="text-xs text-[#8c8072] hover:text-[#3d3429] cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div>
              <label className="text-[10px] font-semibold text-[#255431] block mb-0.5">
                ชื่อบุคคล / คุณลักษณะ (เช่น พี่แจ๊ส, เอก HRK, คอร์กี้, ในกองถ่าย):
              </label>
              <input
                type="text"
                value={subCatFormName}
                onChange={(e) => setSubCatFormName(e.target.value)}
                placeholder="ชื่อบุคคลหรือคุณลักษณะ..."
                autoFocus
                className="w-full bg-white border border-[#b8d6be] rounded-md px-2.5 py-1 text-xs text-[#3e3427] focus:outline-hidden focus:ring-1 focus:ring-[#5b9569]"
              />
            </div>

            <div>
              <label className="text-[10px] font-semibold text-[#255431] block mb-0.5">
                ประเภทข้อมูล (Entity Type):
              </label>
              <select
                value={subCatFormType}
                onChange={(e) =>
                  setSubCatFormType(e.target.value as EntitySubtype)
                }
                className="w-full bg-white border border-[#b8d6be] rounded-md px-2 py-1 text-xs text-[#3e3427] focus:outline-hidden"
              >
                <option value="PERSON">บุคคล / สตรีมเมอร์ / ดารา</option>
                <option value="ANIMAL">สัตว์</option>
                <option value="TOPIC">หัวข้อ / เกม / คอนเซ็ปต์</option>
                <option value="ACTION">กิริยา / มุก / ท่าทาง</option>
                <option value="GENERAL">ทั่วไป</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-semibold text-[#255431] block mb-0.5">
                คำอธิบาย (ไม่บังคับ):
              </label>
              <input
                type="text"
                value={subCatFormDesc}
                onChange={(e) => setSubCatFormDesc(e.target.value)}
                placeholder="สไตล์มุกหรือจุดเด่น..."
                className="w-full bg-white border border-[#b8d6be] rounded-md px-2.5 py-1 text-xs text-[#3e3427] focus:outline-hidden"
              />
            </div>

            <div className="flex items-center gap-1.5 pt-1">
              <button
                type="submit"
                disabled={!subCatFormName.trim()}
                className="bg-[#2d5d39] hover:bg-[#1d4327] disabled:opacity-50 text-white text-xs px-3.5 py-1.5 rounded-lg font-semibold cursor-pointer transition-colors"
              >
                บันทึกแท็กย่อย
              </button>
              <button
                type="button"
                onClick={() => setIsEditingSubCat(false)}
                className="text-xs text-[#7d7162] hover:text-[#3d3429] px-2 py-1 cursor-pointer"
              >
                ยกเลิก
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Subcategories List */}
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin p-2.5">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeMainCat?.id || 'no-main-cat'}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            className="h-full space-y-1.5"
          >
            {!activeMainCat ? (
              <div className="h-full flex flex-col items-center justify-center p-6 text-center">
                <div className="w-11 h-11 rounded-2xl bg-[#edf4fa] border border-[#d2e3f2] text-[#2f557b] flex items-center justify-center mb-3">
                  <MousePointerClick className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-[#453728] mb-1">
                  ยังไม่ได้เลือกป้ายแท็กหลัก
                </p>
                <p className="text-[11px] text-[#7d7162] max-w-[210px] leading-relaxed">
                  กรุณาเลือกป้ายแท็กหลักในคอลัมน์ที่ 2 เพื่อดูหรือจัดการป้ายแท็กย่อย / คุณลักษณะ
                </p>
              </div>
            ) : subcategoriesInActiveCat.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-6 text-center">
                <div className="w-11 h-11 rounded-2xl bg-[#edf6ef] border border-[#cae4d0] text-[#2d5d39] flex items-center justify-center mb-3">
                  <Tags className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-[#453728] mb-1">
                  ยังไม่มีแท็กย่อยใต้ &quot;{activeMainCat.name}&quot;
                </p>
                <p className="text-[11px] text-[#7d7162] max-w-[220px] leading-relaxed mb-3.5">
                  เพิ่มชื่อบุคคล สัตว์ หรือหัวข้อย่อย เพื่อระบุรายละเอียดฟุตเทจให้ชัดเจนและค้นหาได้ง่ายขึ้น
                </p>
                {!isEditingSubCat && (
                  <button
                    type="button"
                    onClick={onOpenAddSubCat}
                    className="text-xs font-semibold text-[#22502f] bg-[#edf6ef] hover:bg-[#dfefe2] border border-[#b8d6be] px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>เพิ่มป้ายแท็กย่อยรายการแรก</span>
                  </button>
                )}
              </div>
            ) : (
              subcategoriesInActiveCat.map((sub) => {
                const subStat = categoryMatrix.find((m) => m.tag.id === sub.id);
                const subTotal = subStat?.totalCount || 0;
                const subUsable = subStat?.usableCount || 0;
                const canSoloEp = subUsable >= 5;

                return (
                  <div
                    key={sub.id}
                    className="group p-2.5 rounded-xl border border-[#e8e2d8] bg-white hover:bg-[#faf7f2] transition-all flex items-center justify-between gap-2"
                  >
                    <div className="flex items-start gap-2 min-w-0 flex-1">
                      <span className="text-sm shrink-0 mt-0.5">
                        {getEntityIconNode(sub)}
                      </span>
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-[#3e3427] truncate">
                            #{sub.name}
                          </span>
                          {canSoloEp && (
                            <span className="px-1.5 py-0.2 rounded-md text-[10px] font-bold bg-[#EEF5EE] text-[#1C4824] border border-[#BAD8BF]">
                              Solo EP พร้อม!
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#6E5F52]">
                          <span>ทั้งหมด {subTotal} ฟุต</span>
                          <span>·</span>
                          <span className="text-[#1C4824] font-bold">
                            พร้อมใช้ {subUsable}/5
                          </span>
                        </div>

                        {sub.description && (
                          <p className="text-[10px] text-[#8c8072] truncate">
                            {sub.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => onOpenEditSubCat(sub, e)}
                        className="p-1 text-[#8c8072] hover:text-[#3d3429] hover:bg-[#eee7dc] rounded-md transition-colors cursor-pointer"
                        title="แก้ไขแท็กย่อยนี้"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onRequestDeleteTag(sub.id)}
                        className="p-1 text-[#8c8072] hover:text-[#8a3c31] hover:bg-[#faeae8] rounded-md transition-colors cursor-pointer"
                        title="ลบแท็กย่อยนี้"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
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
