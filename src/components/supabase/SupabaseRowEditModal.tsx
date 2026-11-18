import React, { useEffect, useState } from 'react';
import { FileText, Save } from 'lucide-react';
import { BaseModal } from '../ui/BaseModal';
import { SupabaseSyncRowState } from '../../types/supabaseSync.types';

interface SupabaseRowEditModalProps {
  row: SupabaseSyncRowState | null;
  displayCategory: string | null;
  onClose: () => void;
  onSave: (
    episodeId: string,
    updates: Partial<SupabaseSyncRowState>
  ) => void;
}

export const SupabaseRowEditModal: React.FC<SupabaseRowEditModalProps> = ({
  row,
  displayCategory,
  onClose,
  onSave,
}) => {
  const [description, setDescription] = useState('');
  const [includePillar, setIncludePillar] = useState(false);
  const [includeCategory, setIncludeCategory] = useState(false);

  useEffect(() => {
    if (!row) return;
    setDescription(row.description || '');
    setIncludePillar(row.includePillar);
    setIncludeCategory(row.includeCategory);
  }, [row]);

  const handleSave = () => {
    if (!row) return;
    onSave(row.episode.id, {
      description,
      includePillar,
      includeCategory,
    });
    onClose();
  };

  return (
    <BaseModal
      isOpen={Boolean(row)}
      onClose={onClose}
      maxWidthClass="max-w-lg"
      icon={<FileText className="w-5 h-5 text-[#3B6845]" />}
      title="แก้ไขคำบรรยาย & ค่าเพิ่มเติมรายเรื่อง"
      subtitle={row?.episode.title}
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-[#6E5F52] hover:bg-[#FAF7F2] transition-colors cursor-pointer"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#3B6845] hover:bg-[#2D5236] text-white transition-colors cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>บันทึกการแก้ไข</span>
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Description Textarea */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[#3D332A] block">
            คำบรรยายคอนเทนต์ (Description)
          </label>
          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="เว้นว่างไว้หากต้องการให้ใช้คำบรรยายอัตโนมัติ หรือไปเขียนเพิ่มเติมใน Kontent OS ภายหลัง"
            className="w-full p-3 text-xs rounded-xl border border-[#E3D8CB] bg-white text-[#2D241E] placeholder:text-[#A89A8C] focus:outline-none focus:ring-2 focus:ring-[#8FA892]/40 focus:border-[#8FA892]"
          />
        </div>

        {/* Pillar & Category Optional Toggles */}
        <div className="pt-3 border-t border-[#EBE4D8] space-y-2.5">
          <div className="text-xs font-bold text-[#3D332A]">
            ส่งค่าหมวดหมู่เสริมเข้า Kontent OS
          </div>
          <p className="text-[11px] text-[#7D6E61]">
            หมวดหมู่ที่ตรวจพบจากคลิป:{' '}
            <strong className="text-[#3D332A]">
              {displayCategory || 'ยังไม่มีหมวดหมู่ (จะส่งเป็นค่าว่าง)'}
            </strong>
          </p>

          <label className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-[#E8DFD3] cursor-pointer hover:bg-[#FAF7F2] transition-colors">
            <div>
              <div className="text-xs font-bold text-[#3D332A]">
                ส่งค่าเสาหลัก (Pillar)
              </div>
              <div className="text-[11px] text-[#7D6E61]">
                {includePillar
                  ? `ส่งเป็น "${displayCategory || 'ตามหมวดหมู่'}"`
                  : 'ปิดไว้ (เว้นว่าง)'}
              </div>
            </div>
            <input
              type="checkbox"
              checked={includePillar}
              onChange={(e) => setIncludePillar(e.target.checked)}
              className="w-4 h-4 rounded text-[#3B6845] focus:ring-[#8FA892] border-[#C5B49E] cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-[#E8DFD3] cursor-pointer hover:bg-[#FAF7F2] transition-colors">
            <div>
              <div className="text-xs font-bold text-[#3D332A]">
                ส่งค่าหมวดหมู่ (Category)
              </div>
              <div className="text-[11px] text-[#7D6E61]">
                {includeCategory
                  ? `ส่งเป็น "${displayCategory || 'ตามหมวดหมู่'}"`
                  : 'ปิดไว้ (เว้นว่าง)'}
              </div>
            </div>
            <input
              type="checkbox"
              checked={includeCategory}
              onChange={(e) => setIncludeCategory(e.target.checked)}
              className="w-4 h-4 rounded text-[#3B6845] focus:ring-[#8FA892] border-[#C5B49E] cursor-pointer"
            />
          </label>
        </div>
      </div>
    </BaseModal>
  );
};
