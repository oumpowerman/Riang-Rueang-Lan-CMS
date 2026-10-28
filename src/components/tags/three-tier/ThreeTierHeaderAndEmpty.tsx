import React from 'react';
import { FolderTree, Trash2, RotateCcw, X, Sparkles, Plus, Info } from 'lucide-react';

interface ThreeTierModalHeaderProps {
  onRequestWipe: () => void;
  onRestoreDefaults: () => void;
  onClose: () => void;
}

export const ThreeTierModalHeader: React.FC<ThreeTierModalHeaderProps> = ({
  onRequestWipe,
  onRestoreDefaults,
  onClose,
}) => {
  return (
    <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4 bg-slate-50/70 shrink-0">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
          <FolderTree className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            จัดการโครงสร้างหมวดหมู่ 3 ชั้น (3-Tier Taxonomy Studio)
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            กลุ่มหมวดหมู่ (Tier 0) ➔ หมวดหมู่หลัก (Tier 1) ➔ หมวดหมู่ย่อย / บุคคล (Tier 2)
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={onRequestWipe}
          className="text-sm px-3 py-2 rounded-lg font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors flex items-center gap-1.5 cursor-pointer"
          title="ล้างโครงสร้างหมวดหมู่ทั้งหมดเพื่อเริ่มใส่ข้อมูลของคุณเอง"
        >
          <Trash2 className="w-4 h-4" />
          <span>ล้างทั้งหมดเพื่อเริ่มใหม่</span>
        </button>

        <button
          type="button"
          onClick={onRestoreDefaults}
          className="text-sm px-3 py-2 rounded-lg font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-colors flex items-center gap-1.5 cursor-pointer"
          title="โหลดชุดหมวดหมู่ตัวอย่างกลับมา"
        >
          <RotateCcw className="w-4 h-4" />
          <span>คืนค่าตัวอย่าง</span>
        </button>

        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

interface ThreeTierEmptyStateProps {
  onOpenAddGroup: () => void;
  onRestoreDefaults: () => void;
}

export const ThreeTierEmptyState: React.FC<ThreeTierEmptyStateProps> = ({
  onOpenAddGroup,
  onRestoreDefaults,
}) => {
  return (
    <div className="flex-1 min-h-0 p-10 flex flex-col items-center justify-center text-center space-y-5 overflow-y-auto">
      <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center">
        <Sparkles className="w-8 h-8" />
      </div>
      <div className="max-w-lg space-y-1.5">
        <h3 className="text-lg font-bold text-slate-800">
          ฐานข้อมูลหมวดหมู่ว่างเปล่า พร้อมสำหรับข้อมูลจริงของคุณแล้ว
        </h3>
        <p className="text-sm text-slate-500">
          คุณสามารถเริ่มสร้างกลุ่มหมวดหมู่แรก (เช่น &quot;คนมีชื่อเสียง&quot;, &quot;คอนเทนต์เกม&quot;, หรือ &quot;วิถีชีวิต&quot;) เพื่อเริ่มจัดหมวดหมู่คลิป หรือกดโหลดโครงสร้างตัวอย่างกลับมาใช้งาน
        </p>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenAddGroup}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>สร้างกลุ่มหมวดหมู่แรกของคุณ</span>
        </button>
        <button
          type="button"
          onClick={onRestoreDefaults}
          className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold flex items-center gap-1.5 cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          <span>โหลดโครงสร้างตัวอย่าง</span>
        </button>
      </div>
    </div>
  );
};

interface ThreeTierModalFooterProps {
  onClose: () => void;
}

export const ThreeTierModalFooter: React.FC<ThreeTierModalFooterProps> = ({ onClose }) => {
  return (
    <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs sm:text-sm text-slate-500 shrink-0">
      <div className="flex items-center gap-2">
        <Info className="w-4 h-4 text-indigo-500" />
        <span>
          ข้อมูลโครงสร้างจะอัปเดตแบบเรียลไทม์ และนำไปแสดงผลในตัวเลือกหมวดหมู่ทันที
        </span>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg text-sm cursor-pointer"
      >
        เสร็จสิ้น
      </button>
    </div>
  );
};
