import React from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';

interface ThreeTierConfirmModalsProps {
  showWipeConfirm: boolean;
  setShowWipeConfirm: (val: boolean) => void;
  onConfirmWipe: () => void;
  showDeleteGroupConfirm: string | null;
  setShowDeleteGroupConfirm: (val: string | null) => void;
  onConfirmDeleteGroup: (id: string) => void;
  showDeleteTagConfirm: string | null;
  setShowDeleteTagConfirm: (val: string | null) => void;
  onConfirmDeleteTag: (id: string) => void;
}

export const ThreeTierConfirmModals: React.FC<ThreeTierConfirmModalsProps> = ({
  showWipeConfirm,
  setShowWipeConfirm,
  onConfirmWipe,
  showDeleteGroupConfirm,
  setShowDeleteGroupConfirm,
  onConfirmDeleteGroup,
  showDeleteTagConfirm,
  setShowDeleteTagConfirm,
  onConfirmDeleteTag,
}) => {
  return (
    <>
      {/* Wipe All Safeguard Modal */}
      {showWipeConfirm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-5 max-w-md w-full shadow-2xl border border-rose-200 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  ยืนยันการล้างข้อมูลหมวดหมู่ทั้งหมด?
                </h3>
                <p className="text-[11px] text-slate-500">ระบบความปลอดภัยป้องกันการลบผิดพลาด</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed bg-rose-50/70 p-3 rounded-xl border border-rose-100">
              การกระทำนี้จะ **ลบกลุ่มหมวดหมู่ (Tier 0), หมวดหมู่หลัก (Tier 1), และหมวดหมู่ย่อย (Tier 2) ทั้งหมด**
              ออกจากฐานข้อมูล เพื่อให้คุณเริ่มต้นใส่ข้อมูลของตนเองได้แบบ 100% สะอาดหมดจด
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowWipeConfirm(false)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={onConfirmWipe}
                className="px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>ยืนยันลบทั้งหมด</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Group Confirm */}
      {showDeleteGroupConfirm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full shadow-2xl border border-slate-200 space-y-3 animate-in zoom-in-95">
            <h3 className="text-sm font-bold text-slate-900">ยืนยันลบกลุ่มนี้?</h3>
            <p className="text-xs text-slate-500">
              คุณต้องการลบกลุ่มนี้ใช่หรือไม่? หมวดหมู่หลักที่อยู่ข้างในจะไม่ถูกลบแต่จะถูกปลดออกจากกลุ่มนี้
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteGroupConfirm(null)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={() => onConfirmDeleteGroup(showDeleteGroupConfirm)}
                className="px-3.5 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs"
              >
                ลบกลุ่ม
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Tag Confirm */}
      {showDeleteTagConfirm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full shadow-2xl border border-slate-200 space-y-3 animate-in zoom-in-95">
            <h3 className="text-sm font-bold text-slate-900">ยืนยันลบรายการนี้?</h3>
            <p className="text-xs text-slate-500">
              หากเป็นหมวดหมู่หลัก หมวดหมู่ย่อยทั้งหมดที่สังกัดอยู่จะถูกลบไปด้วย
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteTagConfirm(null)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={() => onConfirmDeleteTag(showDeleteTagConfirm)}
                className="px-3.5 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs"
              >
                ลบรายการ
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
