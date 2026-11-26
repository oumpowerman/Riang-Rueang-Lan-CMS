import React from 'react';
import { TagSelectorInput } from '../../tags/TagSelectorInput';
import { MessageSquareText } from 'lucide-react';

interface DirectStepTagsAndNotesProps {
  selectedTags: string[];
  setSelectedTags: (tags: string[]) => void;
  mascotNotes: string;
  setMascotNotes: (notes: string) => void;
}

export const DirectStepTagsAndNotes: React.FC<DirectStepTagsAndNotesProps> = ({
  selectedTags,
  setSelectedTags,
  mascotNotes,
  setMascotNotes,
}) => {
  return (
    <div className="space-y-2.5">
      {/* Tag Selector */}
      <div className="bg-[#FAF8F5] p-2.5 sm:p-3 rounded-xl border border-stone-200">
        <TagSelectorInput
          selectedTagIds={selectedTags}
          onChange={setSelectedTags}
          label="เลือกหมวดหมู่ 3 ชั้น"
          helperText="ข้ามได้ ระบบจะตั้งเป็นพื้นที่พักรอให้อัตโนมัติ"
        />
      </div>

      {/* Mascot Notes */}
      <div>
        <label className="block text-xs font-bold text-stone-800 mb-1 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <MessageSquareText className="w-3.5 h-3.5 text-amber-700 shrink-0" />
            <span>โน้ตมุกมาสคอต</span>
          </span>
          <span className="text-[11px] text-stone-400 font-normal">ไม่บังคับ</span>
        </label>
        <textarea
          rows={2}
          value={mascotNotes}
          onChange={(e) => setMascotNotes(e.target.value)}
          placeholder="ระบุจังหวะตบมุก หรือจุดน่าสนใจ..."
          className="w-full px-3 py-2 text-sm bg-[#FAF8F5] focus:bg-white border border-stone-200 rounded-lg focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/15 transition-colors text-stone-900 placeholder:text-stone-400"
        />
      </div>
    </div>
  );
};
