import React from 'react';
import { Inbox } from 'lucide-react';
import { STAGING_TAG_ID } from '../../../services/seedData';
import { CategoryTag } from '../../../types/tag.types';
import { ParsedPastedItem } from './driveImport.types';

interface DriveManualPastePanelProps {
  pasteTargetTagId: string;
  onPasteTargetTagIdChange: (tagId: string) => void;
  selectableMainCategories: CategoryTag[];
  pastedText: string;
  onPastedTextChange: (text: string) => void;
  parsedPastedItems: ParsedPastedItem[];
}

export const DriveManualPastePanel: React.FC<DriveManualPastePanelProps> = ({
  pasteTargetTagId,
  onPasteTargetTagIdChange,
  selectableMainCategories,
  pastedText,
  onPastedTextChange,
  parsedPastedItems,
}) => {
  return (
    <div className="space-y-3">
      <div className="bg-slate-50/90 border border-slate-200 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="font-bold text-slate-800 flex items-center gap-1.5">
          <Inbox className="w-4 h-4 text-amber-600" />
          <span>หมวดหมู่ปลายทางสำหรับรายการที่วาง:</span>
        </span>
        <select
          value={pasteTargetTagId}
          onChange={(e) => onPasteTargetTagIdChange(e.target.value)}
          className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white font-bold text-slate-900 cursor-pointer focus:outline-none focus:border-indigo-500"
        >
          <option value={STAGING_TAG_ID}>
            พื้นที่พักรอจัดหมวดหมู่ (Staging Area - แนะนำ)
          </option>
          {selectableMainCategories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              หมวดหมู่หลัก: #{cat.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center justify-between text-xs">
        <label className="font-bold text-slate-800">
          วางรายชื่อไฟล์ และ/หรือ ลิงก์ Google Drive (1 บรรทัดต่อ 1 ไฟล์):
        </label>
        <span className="font-mono text-slate-500 font-semibold">
          {parsedPastedItems.length} บรรทัดที่ตรวจพบ
        </span>
      </div>
      <textarea
        rows={7}
        value={pastedText}
        onChange={(e) => onPastedTextChange(e.target.value)}
        placeholder={`https://drive.google.com/file/d/1ABC.../view แมวส้มกระโดดพลาดตกโต๊ะ.mp4
https://drive.google.com/file/d/2XYZ.../view น้องหมาโกลเด้นร้องเพลง.mov
พี่แจ๊สตบมุกฮากลางรายการ.mp4`}
        className="w-full p-3 text-xs font-mono bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:bg-white"
      />
    </div>
  );
};
