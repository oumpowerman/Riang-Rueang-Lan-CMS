import React, { useState } from 'react';
import {
  Film,
  RefreshCw,
  ArrowUpDown,
  Play,
  FileEdit,
  Quote,
  MessageSquare,
  Lock,
  UploadCloud,
} from 'lucide-react';
import { VideoThumbnailPreview } from '../../footage/VideoThumbnailPreview';
import { StatusBadge } from '../../ui/StatusBadge';
import { useCMS } from '../../../context/CMSContext';
import {
  buildFootageCatchphraseUpdate,
  resolveSlotScriptValues,
} from '../../../utils/episodeScriptGenerator';
import type { EpisodeRankingSlot } from '../../../types/episode.types';
import type { RankNumber } from '../builder/builder.types';

interface EpisodeRankingsEditorProps {
  rankings: EpisodeRankingSlot[];
  onChangeSlot: (
    rank: RankNumber,
    field:
      | 'rankTitle'
      | 'punchlineNote'
      | 'mascotScript'
      | 'snapshotNote'
      | 'isCustomOverride',
    value: string | boolean
  ) => void;
  onOpenFootagePicker: (rank: RankNumber) => void;
  onSwapRanks: (rankA: RankNumber, rankB: RankNumber) => void;
}

export const EpisodeRankingsEditor: React.FC<EpisodeRankingsEditorProps> = ({
  rankings,
  onChangeSlot,
  onOpenFootagePicker,
  onSwapRanks,
}) => {
  const { computedFootageMap, settings, setPreviewFootageId, updateFootage } =
    useCMS();
  const [syncedRankNotice, setSyncedRankNotice] = useState<number | null>(null);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-xs font-bold text-[#2D2926] flex items-center gap-2">
          <Film className="w-4 h-4 text-[#8A5A22]" />
          <span>
            แก้ไขรายละเอียดช็อต 5 อันดับ, คำสร้อย, บทพากย์มาสคอต และสลับเปลี่ยนฟุตเทจ (Rank 5 &rarr; 1)
          </span>
        </h4>
        <span className="text-[11px] text-[#787066]">
          เลือกโหมด <strong>ซิงก์ตามฟุตเทจ (Realtime)</strong> หรือ <strong>ใช้เฉพาะ EP นี้ (Custom)</strong> ได้รายอันดับ
        </span>
      </div>

      <div className="space-y-3">
        {rankings.map((slot, index) => {
          const rankNum = slot.rank as RankNumber;
          const footage = slot.footageId
            ? computedFootageMap[slot.footageId] || null
            : null;
          const resolvedValues = resolveSlotScriptValues(slot, footage);
          const isCustomMode = resolvedValues.isCustomOverride;

          const handleFieldEdit = (
            field: 'rankTitle' | 'punchlineNote',
            nextValue: string
          ) => {
            onChangeSlot(rankNum, field, nextValue);
            if (!isCustomMode && footage) {
              const syncedUpdate = buildFootageCatchphraseUpdate(footage, {
                [field]: nextValue,
              });
              updateFootage(footage.id, syncedUpdate);
            }
          };

          const handlePushCustomToFootage = () => {
            if (!footage) return;
            const syncedUpdate = buildFootageCatchphraseUpdate(footage, {
              rankTitle: resolvedValues.rankTitle,
              punchlineNote: resolvedValues.punchlineNote,
            });
            updateFootage(footage.id, syncedUpdate);
            onChangeSlot(rankNum, 'isCustomOverride', false);
            setSyncedRankNotice(rankNum);
            setTimeout(() => setSyncedRankNotice(null), 2000);
          };

          return (
            <div
              key={slot.rank}
              className="bg-[#FDFBF7] border border-[#E8DFD3] rounded-2xl p-4 shadow-2xs space-y-3 hover:border-[#D6BD94] transition-colors"
            >
              {/* Row Header: Rank Badge + Swap buttons + Footage Info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2.5 border-b border-[#EFE8DC]">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-xl bg-[#FAF2E1] text-[#6E4919] border border-[#E6D4B3] font-mono font-extrabold text-sm flex items-center justify-center shrink-0">
                    #{slot.rank}
                  </span>

                  {/* Thumbnail & Video Preview */}
                  {footage ? (
                    <div
                      onClick={() => setPreviewFootageId(footage.id)}
                      className="group/thumb relative rounded-xl overflow-hidden border border-[#E8DFD3] w-20 h-13 shrink-0 cursor-pointer bg-black/5 flex items-center justify-center"
                      title="คลิกเพื่อดูวิดีโอตัวเต็ม"
                    >
                      <VideoThumbnailPreview footage={footage} size="xs" />
                      <div className="absolute inset-0 bg-black/20 group-hover/thumb:bg-black/0 transition-colors flex items-center justify-center pointer-events-none">
                        <Play className="w-3 h-3 text-white drop-shadow-xs" />
                      </div>
                    </div>
                  ) : (
                    <div className="w-20 h-13 rounded-xl border border-dashed border-[#D5C7B4] bg-[#F5EFE6] flex items-center justify-center text-[10px] text-[#8C8277] shrink-0 font-mono">
                      ยังไม่มีฟุต
                    </div>
                  )}

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-xs text-[#6B4616]">
                        {slot.footageId || '—'}
                      </span>
                      {footage && (
                        <StatusBadge
                          status={footage.cooldownStatus}
                          daysSinceLastUse={footage.daysSinceLastUsed}
                          cooldownDays={settings.cooldownDays}
                          usageLast90Days={footage.usageLast90Days}
                          compact
                        />
                      )}
                    </div>
                    <div className="text-xs font-bold text-[#2D2926] truncate max-w-sm sm:max-w-md mt-0.5">
                      {footage ? footage.title : 'ไม่ได้ระบุฟุตเทจ'}
                    </div>
                  </div>
                </div>

                {/* Slot Action Controls: Change Footage + Swap with other ranks */}
                <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                  {/* Swap Up */}
                  {index > 0 && (
                    <button
                      type="button"
                      onClick={() =>
                        onSwapRanks(rankNum, rankings[index - 1].rank as RankNumber)
                      }
                      className="p-1.5 rounded-lg bg-white border border-[#E2D8C9] hover:bg-[#FAF7F2] text-[#6E665E] text-xs cursor-pointer"
                      title={`สลับกับอันดับ #${rankings[index - 1].rank}`}
                    >
                      <ArrowUpDown className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => onOpenFootagePicker(rankNum)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#EEF5EE] hover:bg-[#E1EDE1] text-[#224A2D] border border-[#BBD6B9] text-xs font-bold transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-[#386B46]" />
                    <span>เปลี่ยนฟุตเทจ</span>
                  </button>
                </div>
              </div>

              {/* Mode Selector Bar: Realtime Sync vs Custom EP Override */}
              {footage && (
                <div className="flex flex-wrap items-center justify-between gap-2 bg-[#FAF7F2] px-3 py-2 rounded-xl border border-[#EAE0D2]">
                  <div className="inline-flex items-center gap-1 p-0.5 rounded-lg bg-white border border-[#E2D8C9]">
                    <button
                      type="button"
                      onClick={() =>
                        onChangeSlot(rankNum, 'isCustomOverride', false)
                      }
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors cursor-pointer ${
                        !isCustomMode
                          ? 'bg-[#EDF4ED] text-[#244B2F] border border-[#BBD6B9] shadow-2xs'
                          : 'text-[#6E6459] hover:text-[#2D2926]'
                      }`}
                    >
                      <RefreshCw className="w-3 h-3 text-[#386B46]" />
                      <span>ซิงก์ตามฟุตเทจ (Realtime)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        onChangeSlot(rankNum, 'isCustomOverride', true)
                      }
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors cursor-pointer ${
                        isCustomMode
                          ? 'bg-[#FEF6E8] text-[#7D5622] border border-[#F0DFC8] shadow-2xs'
                          : 'text-[#6E6459] hover:text-[#2D2926]'
                      }`}
                    >
                      <Lock className="w-3 h-3 text-[#8A5A22]" />
                      <span>ใช้เฉพาะ EP นี้ (Custom)</span>
                    </button>
                  </div>

                  {isCustomMode ? (
                    <button
                      type="button"
                      onClick={handlePushCustomToFootage}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white hover:bg-[#EDF4ED] text-[#244B2F] border border-[#BBD6B9] text-[11px] font-bold transition-colors cursor-pointer"
                      title="นำชื่ออันดับและคำสร้อยที่แต่งใน EP นี้ไปอัปเดตเป็นค่าหลักของตัวฟุตเทจด้วย"
                    >
                      <UploadCloud className="w-3.5 h-3.5 text-[#386B46]" />
                      <span>อัปเดตคำนี้เข้าฟุตเทจหลักด้วย</span>
                    </button>
                  ) : (
                    <span className="text-[11px] text-[#386B46] font-semibold">
                      {syncedRankNotice === rankNum
                        ? 'อัปเดตเข้าฟุตเทจหลักเรียบร้อยแล้ว!'
                        : 'พิมพ์แก้ในโหมดนี้ = อัปเดตกลับไปที่ตัวฟุตเทจหลักทันที'}
                    </span>
                  )}
                </div>
              )}

              {/* Editable Fields for this Slot */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {/* 1. Rank Title (ชื่ออันดับในคลิป) */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-[#4D4740] flex items-center gap-1">
                    <FileEdit className="w-3 h-3 text-[#8A5A22]" />
                    <span>ชื่ออันดับในคลิป (Rank Title)</span>
                  </label>
                  <input
                    type="text"
                    value={resolvedValues.rankTitle}
                    onChange={(e) =>
                      handleFieldEdit('rankTitle', e.target.value)
                    }
                    placeholder="เช่น จอมยุทธ์เสก, อยากเก่งแบบพี่เสก..."
                    className={`w-full px-3 py-1.5 text-xs border rounded-xl focus:outline-hidden text-[#2D2926] ${
                      isCustomMode
                        ? 'bg-[#FFFDF9] border-[#E8CFA8] focus:border-[#8A5A22]'
                        : 'bg-white border-[#E2D8C9] focus:border-[#386B46]'
                    }`}
                  />
                </div>

                {/* 2. Punchline Note (คำสร้อย / มุกตลก) */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-[#4D4740] flex items-center gap-1">
                    <Quote className="w-3 h-3 text-[#386B46]" />
                    <span>คำสร้อย / มุกตลก (Punchline)</span>
                  </label>
                  <input
                    type="text"
                    value={resolvedValues.punchlineNote}
                    onChange={(e) =>
                      handleFieldEdit('punchlineNote', e.target.value)
                    }
                    placeholder="เช่น ไทยแท้แน่นอน, คิดดีไม่ได้เลย..."
                    className={`w-full px-3 py-1.5 text-xs border rounded-xl focus:outline-hidden text-[#2D2926] ${
                      isCustomMode
                        ? 'bg-[#FFFDF9] border-[#E8CFA8] focus:border-[#8A5A22]'
                        : 'bg-white border-[#E2D8C9] focus:border-[#9EC49C]'
                    }`}
                  />
                </div>

                {/* 3. Mascot Script (บทพากย์มาสคอต) */}
                <div className="space-y-1 md:col-span-2">
                  <label className="block text-[11px] font-bold text-[#4D4740] flex items-center gap-1">
                    <MessageSquare className="w-3 h-3 text-[#2E6B8A]" />
                    <span>บทพากย์มาสคอตประจำอันดับ (Mascot Script)</span>
                  </label>
                  <textarea
                    rows={2}
                    value={slot.mascotScript || ''}
                    onChange={(e) =>
                      onChangeSlot(rankNum, 'mascotScript', e.target.value)
                    }
                    placeholder="บทพูดของตัวมาสคอตสำหรับช็อตอันดับนี้..."
                    className="w-full px-3 py-2 text-xs bg-white border border-[#E2D8C9] rounded-xl focus:outline-hidden focus:border-[#8EBFDB] text-[#2D2926] resize-y"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
