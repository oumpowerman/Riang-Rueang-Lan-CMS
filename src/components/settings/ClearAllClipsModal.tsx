import React, { useState } from 'react';
import {
  AlertTriangle,
  Archive,
  CheckCircle2,
  Film,
  FolderTree,
  RefreshCw,
  Scissors,
  ShieldCheck,
  Sliders,
  Trash2,
} from 'lucide-react';
import { useCMS } from '../../context/CMSContext';
import { Modal } from '../ui/Modal';

export const ClearAllClipsModal: React.FC = () => {
  const {
    isClearClipsModalOpen,
    setIsClearClipsModalOpen,
    sources,
    computedFootage,
    episodes,
    categoryGroups,
    mainCategories,
    subcategories,
    settings,
    clearAllClips,
    isClearingClips,
  } = useCMS();

  const [justCleared, setJustCleared] = useState(false);

  const totalClipsCount = sources.length + computedFootage.length + episodes.length;

  const handleClose = () => {
    if (isClearingClips) return;
    setJustCleared(false);
    setIsClearClipsModalOpen(false);
  };

  const handleConfirmClear = async () => {
    await clearAllClips();
    setJustCleared(true);
  };

  return (
    <Modal
      isOpen={isClearClipsModalOpen}
      onClose={handleClose}
      title="ล้างคลังคลิปทั้งหมด (เตรียมระบบใช้งานจริง)"
      subtitle="ลบเฉพาะข้อมูลคลิปต้นฉบับ ฟุตเทจ และชุดคลิป 5 อันดับ ออกจากทั้งเครื่องและ Firestore โดยเก็บรักษาหมวดหมู่ 3 ชั้นและการตั้งค่าไว้ครบถ้วน"
      maxWidthClass="max-w-xl"
    >
      <div className="space-y-5">
        {justCleared ? (
          <div className="p-6 rounded-2xl bg-emerald-50/90 border border-emerald-200 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-emerald-950">
                ล้างคลังคลิปทั้งหมดเรียบร้อยแล้ว!
              </h3>
              <p className="text-xs text-emerald-800 leading-relaxed max-w-md mx-auto">
                คลังต้นฉบับไลฟ์สด คลังฟุตเทจ และชุดคลิป 5 อันดับ ถูกล้างเป็นคลังว่างพร้อมเริ่มใช้งานจริงแล้ว
                โดยผังหมวดหมู่ 3 ชั้น ({categoryGroups.length} กลุ่ม · {mainCategories.length} หมวดหลัก ·{' '}
                {subcategories.length} หมวดย่อย) และการตั้งค่าระบบยังคงอยู่ครบถ้วน
              </p>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
              >
                พร้อมเริ่มใช้งานจริง
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Warning Banner */}
            <div className="p-4 rounded-2xl bg-rose-50/90 border border-rose-200/90 flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1 min-w-0">
                <div className="text-xs sm:text-sm font-bold text-rose-950">
                  ยืนยันการล้างข้อมูลคลิปทั้งหมดออกจากระบบและ Cloud (Firestore)
                </div>
                <p className="text-xs text-rose-800/90 leading-relaxed">
                  ระบบตัดการดึงข้อมูลตัวอย่างอัตโนมัติ (Auto-Seed) ออกถาวรแล้ว เมื่อล้างข้อมูลเสร็จ
                  คลังคลิปจะเริ่มต้นที่ศูนย์เสมอแม้กดรีเฟรชหน้าจอ
                </p>
              </div>
            </div>

            {/* Section 1: Items to be wiped */}
            <div className="space-y-2.5">
              <div className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>รายการข้อมูลที่จะถูกล้างเป็นศูนย์ (0)</span>
                <span className="font-mono text-[11px] px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 font-bold">
                  รวม {totalClipsCount} รายการ
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/90 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                    <Scissors className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] text-slate-500 font-semibold truncate">
                      ต้นฉบับไลฟ์ / คลิปยาว
                    </div>
                    <div className="text-sm font-mono font-bold text-slate-900">
                      {sources.length} รายการ
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/90 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                    <Film className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] text-slate-500 font-semibold truncate">
                      คลังฟุตเทจ (1:1 & 1:N)
                    </div>
                    <div className="text-sm font-mono font-bold text-slate-900">
                      {computedFootage.length} คลิป
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/90 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                    <Archive className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] text-slate-500 font-semibold truncate">
                      ชุดคลิป 5 อันดับ
                    </div>
                    <div className="text-sm font-mono font-bold text-slate-900">
                      {episodes.length} EP
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Protected Items */}
            <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-950">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>ข้อมูลที่จะถูกเก็บรักษาไว้ (ไม่ถูกลบ)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-emerald-900">
                <div className="flex items-center gap-2 bg-white/80 px-3 py-2 rounded-xl border border-emerald-200/60">
                  <FolderTree className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="truncate font-semibold">
                    หมวดหมู่ 3 ชั้น: {categoryGroups.length} กลุ่ม · {mainCategories.length} หลัก ·{' '}
                    {subcategories.length} ย่อย
                  </span>
                </div>
                <div className="flex items-center gap-2 bg-white/80 px-3 py-2 rounded-xl border border-emerald-200/60">
                  <Sliders className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="truncate font-semibold">
                    กฎพักคลิป: เขียว ≥{settings.greenReadyDays ?? 21}วัน · แดง &lt;
                    {settings.cooldownDays}วัน
                  </span>
                </div>
              </div>
            </div>

            {/* Action Footer */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={handleClose}
                disabled={isClearingClips}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              >
                ยกเลิก
              </button>

              <button
                type="button"
                onClick={handleConfirmClear}
                disabled={isClearingClips}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
              >
                {isClearingClips ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>กำลังล้างคลังคลิปบน Cloud...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>ยืนยันล้างคลิปทั้งหมด</span>
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};
