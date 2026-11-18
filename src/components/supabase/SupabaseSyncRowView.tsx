import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Check,
  RotateCcw,
  FileText,
  Code,
  Package,
  ChevronDown,
} from 'lucide-react';
import {
  SupabaseConnectionConfig,
  SupabaseSyncRowState,
  SUPABASE_CONTENT_STATUSES,
  SUPABASE_TARGET_PLATFORMS,
} from '../../types/supabaseSync.types';
import { CategoryTag } from '../../types/tag.types';
import { EpisodeCompletenessResult } from '../../utils/episodeValidator';
import { resolveEpisodeDisplayCategory } from '../../utils/supabasePayloadMapper';
import { formatThaiSyncTimestamp } from './supabaseRowMatcher';

const PLATFORM_SHORT_CODES: Record<string, string> = {
  YOUTUBE: 'YT',
  FACEBOOK: 'FB',
  TIKTOK: 'TT',
  INSTAGRAM: 'IG',
};

interface SupabaseSyncRowViewProps {
  row: SupabaseSyncRowState;
  config: SupabaseConnectionConfig;
  tagMap?: Record<string, CategoryTag>;
  seriesName?: string;
  completeness?: EpisodeCompletenessResult;
  onToggleSelect: (episodeId: string) => void;
  onUpdateRow: (
    episodeId: string,
    updates: Partial<SupabaseSyncRowState>
  ) => void;
  onOpenRowEdit: (
    row: SupabaseSyncRowState,
    displayCategory: string | null
  ) => void;
  onPreviewPayload: (row: SupabaseSyncRowState) => void;
  onMarkAsSent?: (episodeId: string) => void;
  onUnmarkSent?: (episodeId: string) => void;
}

export const SupabaseSyncRowView: React.FC<SupabaseSyncRowViewProps> = ({
  row,
  config,
  tagMap,
  seriesName,
  completeness,
  onToggleSelect,
  onUpdateRow,
  onOpenRowEdit,
  onPreviewPayload,
  onMarkAsSent,
  onUnmarkSent,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const ep = row.episode;
  const isSent = row.matchStatus === 'SENT';
  const isDuplicate = row.matchStatus === 'DUPLICATE';
  const canUpsert = isSent || isDuplicate;

  const filledClipCount = Array.isArray(ep.rankings)
    ? ep.rankings.filter((slot) => Boolean(slot.footageId)).length
    : 0;
  const displayCategory = resolveEpisodeDisplayCategory(ep, tagMap);
  const subtitleLabel = displayCategory || seriesName || '';

  const activePlatforms =
    row.targetPlatforms && row.targetPlatforms.length > 0
      ? row.targetPlatforms
      : config.defaultTargetPlatforms || [
          'YOUTUBE',
          'FACEBOOK',
          'TIKTOK',
          'INSTAGRAM',
        ];

  const compactPlatformLabel = activePlatforms
    .map((id) => PLATFORM_SHORT_CODES[id] || id)
    .join(' · ');

  const currentChannelName =
    config.channels.find((ch) => ch.id === row.channelId)?.name ||
    config.channels[0]?.name ||
    'ช่องหลัก';

  const hasRowCustomizations =
    Boolean(row.description?.trim()) || row.includePillar || row.includeCategory;

  const sentTimeText = ep.supabaseSyncInfo?.syncedAt
    ? formatThaiSyncTimestamp(ep.supabaseSyncInfo.syncedAt)
    : row.existingCreatedAt
    ? formatThaiSyncTimestamp(row.existingCreatedAt)
    : '';

  const isManuallyMarked = Boolean(ep.supabaseSyncInfo?.isManuallyMarked);

  const statusTooltip = isSent
    ? `ส่งเข้า Kontent OS แล้ว${isManuallyMarked ? ' (มาร์กด้วยมือ)' : ''}${
        row.existingRecordId ? ` (รหัส: ${row.existingRecordId})` : ''
      }${sentTimeText ? ` · ${sentTimeText}` : ''}`
    : isDuplicate
    ? `พบข้อมูลตรงกันใน Kontent OS${
        row.existingRecordId ? ` (รหัส: ${row.existingRecordId})` : ''
      }`
    : 'คลิปใหม่ ยังไม่มีใน Kontent OS';

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
    <>
      <tr
        onClick={() => setIsExpanded((prev) => !prev)}
        className={`border-b border-[#EBE4D8] transition-colors cursor-pointer ${
          row.isSelected
            ? 'bg-[#EDF7EE] hover:bg-[#E2F2E4]'
            : isExpanded
            ? 'bg-[#FAF6F0]'
            : 'bg-white hover:bg-[#FAF8F5]'
        }`}
      >
        {/* 1. Selection Checkbox */}
        <td
          className="px-3 py-3 text-center align-middle w-10"
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="checkbox"
            checked={row.isSelected}
            onChange={() => onToggleSelect(ep.id)}
            aria-label={`เลือก ${ep.title}`}
            className="w-4 h-4 rounded text-[#3B6845] focus:ring-[#8FA892] border-[#C5B49E] cursor-pointer"
          />
        </td>

        {/* 2. Episode Title, Status Badge & Readiness Metadata */}
        <td className="px-3 py-3 align-middle min-w-[260px]">
          <div className="flex flex-wrap items-center gap-2">
            {/* Compact Status Badge */}
            <span
              title={statusTooltip}
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold whitespace-nowrap shrink-0 ${
                isSent
                  ? 'bg-[#E0F2FE] text-[#0369A1]'
                  : isDuplicate
                  ? 'bg-[#FEF3C7] text-[#9A3412]'
                  : 'bg-[#E6F4EA] text-[#1C4824]'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isSent
                    ? 'bg-[#0284C7]'
                    : isDuplicate
                    ? 'bg-[#D97706]'
                    : 'bg-[#2E7D32]'
                }`}
              />
              <span>
                {isSent ? 'ส่งแล้ว' : isDuplicate ? 'ซ้ำในระบบ' : 'คลิปใหม่'}
              </span>
            </span>

            <span className="font-bold text-[13px] text-[#2D241E] leading-snug">
              {ep.title}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 mt-1 text-[11px] text-[#6E5F52]">
            {subtitleLabel && (
              <>
                <span className="font-medium text-[#524538] truncate max-w-[200px]">
                  {subtitleLabel}
                </span>
                <span className="text-[#C5B49E]" aria-hidden="true">
                  ·
                </span>
              </>
            )}

            <span
              className={`font-mono tabular-nums font-semibold ${
                filledClipCount >= 5 ? 'text-[#2E7D32]' : 'text-[#B45309]'
              }`}
            >
              {filledClipCount}/5 ฟุต
            </span>

            {completeness && (
              <>
                <span className="text-[#C5B49E]" aria-hidden="true">
                  ·
                </span>
                <span
                  className={`font-medium ${
                    completeness.hasRealMasterDrive
                      ? 'text-[#1C4824]'
                      : 'text-[#9A3412]'
                  }`}
                  title={completeness.detailText}
                >
                  {completeness.hasRealMasterDrive
                    ? 'Drive จริง'
                    : completeness.isPlaceholderDrive
                    ? 'Drive จำลอง'
                    : 'รอ Drive จริง'}
                </span>
              </>
            )}

            {hasRowCustomizations && (
              <>
                <span className="text-[#C5B49E]" aria-hidden="true">
                  ·
                </span>
                <span className="text-[#784A22] font-semibold">
                  มีคำบรรยาย/หมวดเสริม
                </span>
              </>
            )}
          </div>
        </td>

        {/* 3. Single-Line iOS Summary Pills (Click to Expand & Edit) */}
        <td className="px-3 py-3 align-middle text-right">
          <div className="inline-flex flex-wrap items-center justify-end gap-1.5">
            {canUpsert && (
              <span
                className={`px-2 py-0.5 rounded-lg text-[11px] font-bold border whitespace-nowrap ${
                  row.upsertMode === 'UPDATE'
                    ? 'bg-amber-50 border-amber-300 text-amber-800'
                    : 'bg-[#FAF8F5] border-[#E3D8CB] text-[#6E5F52]'
                }`}
              >
                {row.upsertMode === 'UPDATE' ? 'อัปเดตทับ' : 'ข้ามซ้ำ'}
              </span>
            )}

            <span
              title={
                row.channelId
                  ? `รหัสช่อง (UUID): ${row.channelId}`
                  : 'ไม่ได้ระบุรหัสช่อง'
              }
              className="px-2.5 py-1 rounded-lg bg-[#FAF8F5] border border-[#E3D8CB] text-[11px] font-semibold text-[#3D332A] whitespace-nowrap max-w-[150px] truncate"
            >
              {currentChannelName}
            </span>

            <span className="px-2.5 py-1 rounded-lg bg-[#FAF8F5] border border-[#E3D8CB] text-[11px] font-semibold text-[#3D332A] whitespace-nowrap max-w-[155px] truncate">
              {row.status}
            </span>

            <span className="px-2 py-1 rounded-lg bg-[#FAF8F5] border border-[#E3D8CB] text-[11px] font-bold text-[#524538] whitespace-nowrap">
              {compactPlatformLabel}
            </span>

            <span
              className={`px-2 py-1 rounded-lg text-[11px] font-semibold border whitespace-nowrap ${
                row.includeAssets
                  ? 'bg-[#EEF5EE] border-[#BAD8BF] text-[#1C4824]'
                  : 'bg-[#FAF8F5] border-[#E3D8CB] text-[#8E8174]'
              }`}
            >
              {row.includeAssets ? `แนบ ${filledClipCount} ฟุต` : 'ไม่แนบฟุต'}
            </span>

            <span
              className={`p-1 rounded-lg border transition-colors ${
                isExpanded
                  ? 'bg-[#3B6845] border-[#3B6845] text-white'
                  : 'bg-white border-[#E3D8CB] text-[#6E5F52]'
              }`}
              title="คลิกเพื่อกางหรือพับตั้งค่ารายตัว"
            >
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform ${
                  isExpanded ? 'rotate-180' : ''
                }`}
              />
            </span>
          </div>
        </td>
      </tr>

      {/* Progressive Disclosure: Inline iOS Expandable Drawer for Per-Row Editing */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <tr className="border-b border-[#E5DBC9] bg-[#FAF6F0]/90">
            <td colSpan={3} className="px-4 sm:px-6 py-3">
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.14 }}
                className="rounded-2xl bg-white border border-[#E2D5C4] p-3.5 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs"
              >
                {/* Left Group: Channel, Status, Upsert Mode */}
                <div className="flex flex-wrap items-center gap-3">
                  {/* Target Channel */}
                  <label className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold text-[#6E5F52] whitespace-nowrap">
                      ช่องปลายทาง:
                    </span>
                    <select
                      value={row.channelId}
                      onChange={(e) =>
                        onUpdateRow(ep.id, { channelId: e.target.value })
                      }
                      title={
                        row.channelId
                          ? `รหัสช่อง (UUID): ${row.channelId}`
                          : 'ไม่ได้ระบุรหัสช่อง'
                      }
                      className="text-xs px-2.5 py-1.5 rounded-xl border border-[#E3D8CB] bg-[#FAF8F5] text-[#2D241E] font-semibold focus:outline-none focus:ring-1 focus:ring-[#8FA892] cursor-pointer"
                    >
                      {config.channels.map((ch) => (
                        <option key={ch.id || 'default'} value={ch.id}>
                          {ch.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  {/* Workflow Status */}
                  <label className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold text-[#6E5F52] whitespace-nowrap">
                      สถานะงาน:
                    </span>
                    <select
                      value={row.status}
                      onChange={(e) =>
                        onUpdateRow(ep.id, { status: e.target.value })
                      }
                      className="text-xs px-2.5 py-1.5 rounded-xl border border-[#E3D8CB] bg-[#FAF8F5] text-[#2D241E] font-semibold focus:outline-none focus:ring-1 focus:ring-[#8FA892] cursor-pointer"
                    >
                      {SUPABASE_CONTENT_STATUSES.map((statusVal) => (
                        <option key={statusVal} value={statusVal}>
                          {statusVal}
                        </option>
                      ))}
                    </select>
                  </label>

                  {/* Upsert Mode if Duplicate or Sent */}
                  {canUpsert && (
                    <label className="flex items-center gap-1.5">
                      <span className="text-[11px] font-bold text-[#6E5F52] whitespace-nowrap">
                        การส่งซ้ำ:
                      </span>
                      <select
                        value={row.upsertMode}
                        onChange={(e) =>
                          onUpdateRow(ep.id, {
                            upsertMode: e.target.value as 'SKIP' | 'UPDATE',
                          })
                        }
                        className="text-xs px-2.5 py-1.5 rounded-xl border border-[#E3D8CB] bg-[#FAF8F5] font-semibold text-[#2D241E] focus:outline-none focus:ring-1 focus:ring-[#8FA892] cursor-pointer"
                      >
                        <option value="SKIP">ข้าม (ไม่ทับข้อมูลเดิม)</option>
                        <option value="UPDATE">อัปเดตทับข้อมูลเดิม</option>
                      </select>
                    </label>
                  )}
                </div>

                {/* Middle Group: Target Platforms + Attach Footage */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="inline-flex items-center gap-1 bg-[#FAF8F5] p-1 rounded-xl border border-[#E3D8CB]">
                    {SUPABASE_TARGET_PLATFORMS.map((plat) => {
                      const isChecked = activePlatforms.includes(plat.id);
                      return (
                        <button
                          key={plat.id}
                          type="button"
                          onClick={() => handleTogglePlatform(plat.id)}
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                            isChecked
                              ? 'bg-[#3B6845] text-white'
                              : 'text-[#6E5F52] hover:text-[#2D241E]'
                          }`}
                        >
                          {isChecked && <Check className="w-3 h-3" />}
                          <span>{PLATFORM_SHORT_CODES[plat.id] || plat.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      onUpdateRow(ep.id, { includeAssets: !row.includeAssets })
                    }
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-bold border transition-colors cursor-pointer whitespace-nowrap ${
                      row.includeAssets
                        ? 'bg-[#EEF5EE] border-[#BAD8BF] text-[#1C4824]'
                        : 'bg-[#FAF8F5] border-[#E3D8CB] text-[#7D6E61] hover:text-[#3D332A]'
                    }`}
                  >
                    <Package className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      {row.includeAssets
                        ? `แนบฟุตเทจ (${filledClipCount})`
                        : 'ไม่แนบฟุตเทจ'}
                    </span>
                  </button>
                </div>

                {/* Right Group: Manual Mark Icon, Description/Category Modal & JSON Preview */}
                <div className="flex items-center gap-1.5 ml-auto">
                  {/* Manual Mark / Unmark Icon Button */}
                  {row.matchStatus !== 'SENT' ? (
                    onMarkAsSent && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onMarkAsSent(ep.id);
                        }}
                        className="p-1.5 rounded-xl border border-[#BAD8BF] bg-[#EEF5EE] text-[#1C4824] hover:bg-[#E2EFE2] transition-colors cursor-pointer shrink-0"
                        title="มาร์กส่งแล้ว (มีใน Kontent OS แล้ว)"
                        aria-label="มาร์กส่งแล้ว"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )
                  ) : (
                    onUnmarkSent && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onUnmarkSent(ep.id);
                        }}
                        className="p-1.5 rounded-xl border border-[#E2D5C4] bg-[#FAF8F5] text-[#8C7B6C] hover:text-[#B44335] hover:bg-[#FDF4EB] transition-colors cursor-pointer shrink-0"
                        title="ยกเลิกมาร์ก (เปลี่ยนกลับเป็นคลิปใหม่)"
                        aria-label="ยกเลิกมาร์ก"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    )
                  )}

                  <button
                    type="button"
                    onClick={() => onOpenRowEdit(row, displayCategory || null)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[11px] font-semibold cursor-pointer transition-colors ${
                      hasRowCustomizations
                        ? 'bg-[#FAF0E6] text-[#784A22] border-[#EED7C5]'
                        : 'bg-[#FAF8F5] text-[#524538] border-[#E3D8CB] hover:bg-[#F2EBE0]'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>คำบรรยาย & หมวดเสริม</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onPreviewPayload(row)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-[#E3D8CB] bg-[#FAF8F5] text-[#524538] hover:bg-[#F2EBE0] text-[11px] font-semibold cursor-pointer transition-colors"
                    title="ดูตัวอย่างข้อมูลที่จะส่งออก (JSON)"
                  >
                    <Code className="w-3.5 h-3.5" />
                    <span>JSON</span>
                  </button>
                </div>
              </motion.div>
            </td>
          </tr>
        )}
      </AnimatePresence>
    </>
  );
};
