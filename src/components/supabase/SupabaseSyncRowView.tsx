import React, { useState } from 'react';
import {
  Check,
  AlertTriangle,
  Sparkles,
  FileText,
  Code,
  Package,
  Layers,
  ChevronDown,
} from 'lucide-react';
import {
  SupabaseChannelPreset,
  SupabaseConnectionConfig,
  SupabaseSyncRowState,
  SUPABASE_CONTENT_STATUSES,
} from '../../types/supabaseSync.types';
import { mapEpisodeToSupabasePayload } from '../../utils/supabasePayloadMapper';

interface SupabaseSyncRowViewProps {
  row: SupabaseSyncRowState;
  config: SupabaseConnectionConfig;
  onToggleSelect: (episodeId: string) => void;
  onUpdateRow: (episodeId: string, updates: Partial<SupabaseSyncRowState>) => void;
  onPreviewPayload: (row: SupabaseSyncRowState) => void;
}

export const SupabaseSyncRowView: React.FC<SupabaseSyncRowViewProps> = ({
  row,
  config,
  onToggleSelect,
  onUpdateRow,
  onPreviewPayload,
}) => {
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [tempDescription, setTempDescription] = useState(row.description);

  const ep = row.episode;
  const isDuplicate = row.matchStatus === 'DUPLICATE';

  const handleSaveDescription = () => {
    onUpdateRow(ep.id, { description: tempDescription });
    setIsEditingDescription(false);
  };

  return (
    <tr
      className={`border-b border-[#EBE4D8] transition-colors ${
        row.isSelected
          ? 'bg-[#F4F9F4]/70 hover:bg-[#EEF5EE]'
          : 'bg-white hover:bg-[#FAF8F5]'
      }`}
    >
      {/* 1. Selection Checkbox */}
      <td className="p-3 text-center align-top w-10">
        <input
          type="checkbox"
          checked={row.isSelected}
          onChange={() => onToggleSelect(ep.id)}
          className="w-4 h-4 rounded text-[#3B6845] focus:ring-[#8FA892] border-slate-300 cursor-pointer"
        />
      </td>

      {/* 2. Deduplication Match Status */}
      <td className="p-3 align-top w-36">
        {isDuplicate ? (
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
              <AlertTriangle className="w-3 h-3 text-[#B45309]" />
              <span>ซ้ำในระบบ</span>
            </span>
            <div className="text-[10px] text-slate-500 font-mono truncate max-w-[130px]">
              {row.existingRecordId ? `ID: ${row.existingRecordId.slice(0, 8)}...` : ''}
            </div>
            {/* Upsert Mode Toggle */}
            <div className="pt-1">
              <select
                value={row.upsertMode}
                onChange={(e) =>
                  onUpdateRow(ep.id, {
                    upsertMode: e.target.value as 'SKIP' | 'UPDATE',
                  })
                }
                className="text-[10px] px-1.5 py-0.5 rounded border border-[#E3D8CB] bg-white font-semibold text-[#524538]"
              >
                <option value="SKIP">โหมด: ข้าม (Skip)</option>
                <option value="UPDATE">โหมด: อัปเดตทับ (Update)</option>
              </select>
            </div>
          </div>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]">
            <Sparkles className="w-3 h-3 text-[#059669]" />
            <span>คลิปใหม่ (New)</span>
          </span>
        )}
      </td>

      {/* 3. Title & Category */}
      <td className="p-3 align-top min-w-[220px]">
        <div className="font-bold text-xs text-[#2D241E] leading-snug">
          {ep.title}
        </div>
        <div className="flex flex-wrap items-center gap-1.5 mt-1">
          {(ep.seriesTitle || ep.mainCategoryTagId) && (
            <span className="px-1.5 py-0.5 rounded bg-[#FAF0E6] text-[#784A22] text-[10px] font-semibold border border-[#EED7C5]">
              {ep.seriesTitle || ep.mainCategoryTagId}
            </span>
          )}
          {ep.rankings && (
            <span className="text-[10px] text-slate-500 font-medium">
              ({ep.rankings.length} ฟุตเทจ)
            </span>
          )}
          {ep.masterVideoInfo?.youtubeUrl && (
            <span className="text-[10px] text-indigo-600 font-mono">
              YouTube
            </span>
          )}
        </div>
      </td>

      {/* 4. Target Channel (Inline Switchable) */}
      <td className="p-3 align-top w-44">
        <select
          value={row.channelId}
          onChange={(e) => onUpdateRow(ep.id, { channelId: e.target.value })}
          className="w-full text-xs px-2 py-1 rounded-lg border border-[#E3D8CB] bg-white text-[#3D332A] focus:outline-none focus:ring-1 focus:ring-[#8FA892]"
        >
          {config.channels.map((ch) => (
            <option key={ch.id || 'default'} value={ch.id}>
              {ch.name}
            </option>
          ))}
        </select>
        <div className="text-[10px] text-slate-400 font-mono truncate mt-0.5">
          {row.channelId ? `UUID: ${row.channelId.slice(0, 12)}...` : '(เว้นว่าง)'}
        </div>
      </td>

      {/* 5. Status (Inline Switchable) */}
      <td className="p-3 align-top w-32">
        <select
          value={row.status}
          onChange={(e) => onUpdateRow(ep.id, { status: e.target.value })}
          className="w-full text-xs px-2 py-1 rounded-lg border border-[#E3D8CB] bg-white font-bold text-[#3D332A] focus:outline-none focus:ring-1 focus:ring-[#8FA892]"
        >
          {SUPABASE_CONTENT_STATUSES.map((statusVal) => (
            <option key={statusVal} value={statusVal}>
              {statusVal}
            </option>
          ))}
        </select>
      </td>

      {/* 6. Assets Option (5 clips vs empty) */}
      <td className="p-3 align-top w-28 text-center">
        <button
          type="button"
          onClick={() =>
            onUpdateRow(ep.id, { includeAssets: !row.includeAssets })
          }
          className={`px-2 py-1 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer whitespace-nowrap ${
            row.includeAssets
              ? 'bg-[#EEF5EE] border-[#BAD8BF] text-[#1C4824]'
              : 'bg-slate-100 border-slate-200 text-slate-500'
          }`}
          title={
            row.includeAssets
              ? 'แนบฟุตเทจ 5 ชิ้นใน assets JSONB'
              : 'เว้นว่าง assets เป็น [] เพื่อใส่ระยะหลัง'
          }
        >
          <Package className="w-3 h-3 inline-block mr-1" />
          <span>{row.includeAssets ? 'แนบ 5 ฟุต' : 'เว้นว่าง'}</span>
        </button>
      </td>

      {/* 7. Description & Payload Actions */}
      <td className="p-3 align-top w-28 text-right">
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={() => {
              setTempDescription(row.description);
              setIsEditingDescription((prev) => !prev);
            }}
            className={`p-1.5 rounded-lg border text-xs cursor-pointer transition-colors ${
              row.description
                ? 'bg-[#FAF0E6] text-[#784A22] border-[#EED7C5]'
                : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
            }`}
            title="แก้ไขคำบรรยาย description"
          >
            <FileText className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => onPreviewPayload(row)}
            className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 cursor-pointer transition-colors"
            title="ดูตัวอย่าง JSON Payload"
          >
            <Code className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Inline Description Editor Popup */}
        {isEditingDescription && (
          <div className="mt-2 text-left p-2.5 rounded-lg bg-white border border-[#D8CFC3] shadow-md space-y-2">
            <span className="text-[11px] font-bold text-[#3D332A] block">
              ปรับแต่งคำบรรยาย (description):
            </span>
            <textarea
              rows={3}
              value={tempDescription}
              onChange={(e) => setTempDescription(e.target.value)}
              placeholder="เว้นว่างไว้หากต้องการให้สร้างตามระบบ หรือไปเขียนใน Supabase ทีหลัง"
              className="w-full p-2 text-xs border border-slate-200 rounded focus:outline-none"
            />
            <div className="flex justify-end gap-1.5">
              <button
                type="button"
                onClick={() => setIsEditingDescription(false)}
                className="px-2 py-0.5 rounded text-[11px] text-slate-600 hover:bg-slate-100"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleSaveDescription}
                className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-[#3B6845] text-white"
              >
                บันทึก
              </button>
            </div>
          </div>
        )}
      </td>
    </tr>
  );
};
