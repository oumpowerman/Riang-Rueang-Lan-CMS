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
  SUPABASE_TARGET_PLATFORMS,
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
  const [isEditingPlatforms, setIsEditingPlatforms] = useState(false);

  const ep = row.episode;
  const isDuplicate = row.matchStatus === 'DUPLICATE';

  const activePlatforms =
    row.targetPlatforms && row.targetPlatforms.length > 0
      ? row.targetPlatforms
      : config.defaultTargetPlatforms || ['YOUTUBE', 'FACEBOOK', 'TIKTOK', 'INSTAGRAM'];

  const handleSaveDescription = () => {
    onUpdateRow(ep.id, { description: tempDescription });
    setIsEditingDescription(false);
  };

  const handleTogglePlatform = (platformId: string) => {
    const isSelected = activePlatforms.includes(platformId);
    const updated = isSelected
      ? activePlatforms.filter((p) => p !== platformId)
      : [...activePlatforms, platformId];
    onUpdateRow(ep.id, {
      targetPlatforms: updated.length > 0 ? updated : [platformId],
    });
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
      <td className="p-3 align-top min-w-[200px]">
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
        </div>

        {/* Row-Level Pillar & Category Toggles */}
        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
          <button
            type="button"
            onClick={() =>
              onUpdateRow(ep.id, { includePillar: !row.includePillar })
            }
            className={`px-1.5 py-0.5 rounded text-[10px] font-medium border transition-colors cursor-pointer flex items-center gap-1 ${
              row.includePillar
                ? 'bg-[#EEF5EE] text-[#1C4824] border-[#BAD8BF] font-bold shadow-2xs'
                : 'bg-white text-slate-400 border-slate-200 hover:text-slate-600'
            }`}
            title={
              row.includePillar
                ? 'Pillar: ส่งชื่อหมวดหมู่นี้ (คลิกเพื่อปิดเว้นว่าง null)'
                : 'Pillar: ปิดเว้นว่าง null (คลิกเพื่อเปิดส่งชื่อหมวดหมู่)'
            }
          >
            <span>Pillar:</span>
            <span className={row.includePillar ? 'font-bold' : 'italic'}>
              {row.includePillar
                ? ep.seriesTitle || ep.mainCategoryTagId || 'เปิด'
                : 'null'}
            </span>
          </button>

          <button
            type="button"
            onClick={() =>
              onUpdateRow(ep.id, { includeCategory: !row.includeCategory })
            }
            className={`px-1.5 py-0.5 rounded text-[10px] font-medium border transition-colors cursor-pointer flex items-center gap-1 ${
              row.includeCategory
                ? 'bg-[#EEF5EE] text-[#1C4824] border-[#BAD8BF] font-bold shadow-2xs'
                : 'bg-white text-slate-400 border-slate-200 hover:text-slate-600'
            }`}
            title={
              row.includeCategory
                ? 'Category: ส่งชื่อหมวดหมู่นี้ (คลิกเพื่อปิดเว้นว่าง null)'
                : 'Category: ปิดเว้นว่าง null (คลิกเพื่อเปิดส่งชื่อหมวดหมู่)'
            }
          >
            <span>Category:</span>
            <span className={row.includeCategory ? 'font-bold' : 'italic'}>
              {row.includeCategory
                ? ep.seriesTitle || ep.mainCategoryTagId || 'เปิด'
                : 'null'}
            </span>
          </button>
        </div>
      </td>

      {/* 4. Target Channel (Inline Switchable) */}
      <td className="p-3 align-top w-40">
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
          {row.channelId ? `UUID: ${row.channelId.slice(0, 10)}...` : '(เว้นว่าง)'}
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

      {/* 6. Target Platform (Multi-Select Interactive Badges) */}
      <td className="p-3 align-top w-44">
        <div className="relative">
          <div
            onClick={() => setIsEditingPlatforms((prev) => !prev)}
            className="p-1.5 rounded-lg border border-[#E3D8CB] bg-white hover:bg-[#FAF8F5] cursor-pointer flex flex-wrap gap-1 transition-colors min-h-[34px] items-center"
            title="คลิกเพื่อเลือก/แก้ไขแพลตฟอร์มปลายทาง target_platform"
          >
            {activePlatforms.map((platId) => {
              const info = SUPABASE_TARGET_PLATFORMS.find((p) => p.id === platId);
              return (
                <span
                  key={platId}
                  className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-[#EEF5EE] text-[#1C4824] border border-[#BAD8BF] whitespace-nowrap"
                >
                  {info ? info.shortLabel : platId}
                </span>
              );
            })}
            <ChevronDown className="w-3 h-3 text-slate-400 ml-auto shrink-0" />
          </div>

          {/* Inline Platform Picker Popover */}
          {isEditingPlatforms && (
            <div className="absolute left-0 top-full mt-1 z-20 w-52 p-2 rounded-xl bg-white border border-[#D8CFC3] shadow-lg space-y-1">
              <div className="text-[10px] font-bold text-[#3D332A] px-1 pb-1 border-b border-slate-100 flex items-center justify-between">
                <span>เลือก target_platform:</span>
                <button
                  type="button"
                  onClick={() => setIsEditingPlatforms(false)}
                  className="text-slate-400 hover:text-slate-700 text-[10px]"
                >
                  ปิด
                </button>
              </div>
              <div className="space-y-0.5 max-h-40 overflow-y-auto">
                {SUPABASE_TARGET_PLATFORMS.map((plat) => {
                  const isChecked = activePlatforms.includes(plat.id);
                  return (
                    <button
                      key={plat.id}
                      type="button"
                      onClick={() => handleTogglePlatform(plat.id)}
                      className={`w-full text-left px-2 py-1 rounded-md text-[11px] font-medium flex items-center justify-between cursor-pointer ${
                        isChecked
                          ? 'bg-[#EEF5EE] text-[#1C4824] font-bold'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <span>{plat.label}</span>
                      {isChecked && <Check className="w-3 h-3 text-[#3B6845]" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
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
