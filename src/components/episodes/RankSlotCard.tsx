import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowDown,
  ArrowUp,
  GripVertical,
  History,
  Trash2,
  Video,
  Scissors,
  Star,
  Mic,
  FileEdit,
  Quote,
  RefreshCw,
  Lock,
  UploadCloud,
} from 'lucide-react';
import { useCMS } from '../../context/CMSContext';
import { EpisodeRankingSlot } from '../../types/episode.types';
import { ComputedFootage } from '../../types/footage.types';
import {
  buildFootageCatchphraseUpdate,
  resolveSlotScriptValues,
} from '../../utils/episodeScriptGenerator';
import { VideoThumbnailPreview } from '../footage/VideoThumbnailPreview';
import { StatusBadge } from '../ui/StatusBadge';
import { TagPill } from '../ui/TagPill';

interface RankSlotCardProps {
  slot: EpisodeRankingSlot;
  footage: ComputedFootage | null;
  isActivePickerSlot: boolean;
  onActivatePicker: () => void;
  onClearSlot: () => void;
  onMoveRank: (direction: 'UP' | 'DOWN') => void;
  onScriptChange: (script: string) => void;
  onRankFieldChange?: (
    field: 'rankTitle' | 'punchlineNote' | 'mascotScript' | 'isCustomOverride',
    value: string | boolean
  ) => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  // Drag and Drop props
  onSlotDragStart: (rank: 1 | 2 | 3 | 4 | 5) => void;
  onDropItemOnSlot: (
    targetRank: 1 | 2 | 3 | 4 | 5,
    payload: { type: 'SLOT'; fromRank: 1 | 2 | 3 | 4 | 5 } | { type: 'FOOTAGE'; footageId: string }
  ) => void;
}

export const RankSlotCard: React.FC<RankSlotCardProps> = ({
  slot,
  footage,
  isActivePickerSlot,
  onActivatePicker,
  onClearSlot,
  onMoveRank,
  onScriptChange,
  onRankFieldChange,
  canMoveUp,
  canMoveDown,
  onSlotDragStart,
  onDropItemOnSlot,
}) => {
  const {
    tagMap,
    settings,
    setTraceabilityFootageId,
    setPreviewFootageId,
    updateFootage,
  } = useCMS();
  const [isScriptExpanded, setIsScriptExpanded] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [syncedToFootageNotice, setSyncedToFootageNotice] = useState(false);
  const resolvedValues = resolveSlotScriptValues(slot, footage);
  const isCustomMode = resolvedValues.isCustomOverride;

  const handleFieldEdit = (
    field: 'rankTitle' | 'punchlineNote',
    nextValue: string
  ) => {
    onRankFieldChange?.(field, nextValue);
    // In Realtime mode (default), also sync 2-way back to the master Footage item immediately
    if (!isCustomMode && footage) {
      const syncedUpdate = buildFootageCatchphraseUpdate(footage, {
        [field]: nextValue,
      });
      updateFootage(footage.id, syncedUpdate);
    }
  };

  const handlePushCustomToMasterFootage = () => {
    if (!footage) return;
    const syncedUpdate = buildFootageCatchphraseUpdate(footage, {
      rankTitle: resolvedValues.rankTitle,
      punchlineNote: resolvedValues.punchlineNote,
    });
    updateFootage(footage.id, syncedUpdate);
    onRankFieldChange?.('isCustomOverride', false);
    setSyncedToFootageNotice(true);
    setTimeout(() => setSyncedToFootageNotice(false), 2000);
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData(
      'application/json',
      JSON.stringify({ type: 'SLOT', fromRank: slot.rank })
    );
    e.dataTransfer.effectAllowed = 'move';
    onSlotDragStart(slot.rank);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    try {
      const raw = e.dataTransfer.getData('application/json');
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed.type === 'SLOT' && parsed.fromRank) {
        onDropItemOnSlot(slot.rank, { type: 'SLOT', fromRank: parsed.fromRank });
      } else if (parsed.type === 'FOOTAGE' && parsed.footageId) {
        onDropItemOnSlot(slot.rank, {
          type: 'FOOTAGE',
          footageId: parsed.footageId,
        });
      }
    } catch {
      // ignore invalid drag payload
    }
  };

  return (
    <motion.div
      layout
      draggable
      onDragStart={handleDragStart as unknown as undefined}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={onActivatePicker}
      className={`rounded-2xl border p-3.5 transition-all cursor-pointer select-none ${
        isDragOver
          ? 'border-[#8eb58c] bg-[#edf4ed] ring-2 ring-[#a4c5a1]/40 scale-[1.01]'
          : isActivePickerSlot
          ? 'bg-white border-[#3b6845] ring-2 ring-[#a4c5a1]/40 shadow-xs'
          : footage
          ? 'bg-[#fdfbf7] border-[#e8dfd3] hover:border-[#bad8b9]'
          : 'bg-[#faf7f2]/80 border-dashed border-[#e2d8cb] hover:border-[#bad8b9]'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Left: Drag Handle + Rank Badge + Thumbnail Preview + Footage Info */}
        <div className="flex items-start gap-2 sm:gap-2.5 flex-1 min-w-0">
          <div
            className="hidden sm:block pt-2 text-[#9a9186] hover:text-[#4d4740] cursor-grab active:cursor-grabbing shrink-0"
            title="ลากเพื่อสลับอันดับขึ้น-ลง"
          >
            <GripVertical className="w-4 h-4" />
          </div>

          <div
            className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex flex-col items-center justify-center shrink-0 font-mono border ${
              slot.rank === 1
                ? 'bg-[#fef4e8] text-[#7d5622] border-[#f0dfc8] font-black shadow-xs'
                : footage
                ? 'bg-[#edf4ed] text-[#2b5435] border-[#cbe0cb] font-extrabold'
                : 'bg-[#f3ede3] text-[#716960] border-[#e2d9cd]'
            }`}
          >
            <span className="text-[8px] sm:text-[9px] uppercase tracking-wider opacity-80 leading-none">
              อันดับ
            </span>
            <span className="text-sm sm:text-base font-extrabold tabular-nums leading-tight">
              {slot.rank}
            </span>
          </div>

          {footage ? (
            <>
              <VideoThumbnailPreview
                footage={footage}
                size="md"
                onClick={(e) => {
                  e.stopPropagation();
                  setPreviewFootageId(footage.id);
                }}
              />

              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex flex-wrap items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-mono">
                    <span className="font-extrabold text-[#2d2926]">{footage.id}</span>
                    <span className="text-[#c7bdb2] hidden sm:inline">·</span>
                    <span className="text-[#787066] text-[11px] hidden sm:inline-flex items-center gap-1">
                      {footage.ingestionFlow === 'DIRECT_1_TO_1' ? (
                        <>
                          <Video className="w-3 h-3 text-[#4a634b]" />
                          <span>1:1</span>
                        </>
                      ) : (
                        <>
                          <Scissors className="w-3 h-3 text-[#8a632b]" />
                          <span>{footage.sourceId}</span>
                        </>
                      )}
                    </span>
                  </div>

                  <StatusBadge
                    status={footage.cooldownStatus}
                    daysSinceLastUse={footage.daysSinceLastUsed}
                    cooldownDays={settings.cooldownDays}
                    usageLast90Days={footage.usageLast90Days}
                    compact
                  />
                </div>

                <h4 className="text-xs sm:text-sm font-bold text-[#2d2926] line-clamp-1">
                  {footage.title}
                </h4>

                <div className="flex flex-wrap items-center gap-1 pt-0.5">
                  {footage.tags.map((tid) => (
                    <TagPill key={tid} tag={tagMap[tid]} />
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 py-0.5 sm:py-1 min-w-0">
              <div className="text-xs sm:text-sm font-bold text-[#554d44] truncate">
                <span className="sm:hidden">ว่าง — กดเลือกคลิปจากคลัง</span>
                <span className="hidden sm:inline">
                  ว่าง — ลากฟุตเทจมาวางที่นี่ หรือกดปุ่ม [{slot.rank}] จากคลังด้านขวา
                </span>
              </div>
              <p className="text-[11px] text-[#8c8378] mt-0.5 truncate">
                {slot.rank === 1 ? (
                  <span className="inline-flex items-center gap-1 text-[#855621] font-medium">
                    <Star className="w-3 h-3 text-[#b37731] shrink-0" />
                    <span>อันดับ 1 แนะนำช็อตที่พีคที่สุด</span>
                  </span>
                ) : (
                  `เลือกฟุตเทจสำหรับอันดับที่ ${slot.rank}`
                )}
              </p>
            </div>
          )}
        </div>

        {/* Right Compact Controls */}
        <div
          className="flex items-center gap-1 shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            disabled={!canMoveUp}
            onClick={() => onMoveRank('UP')}
            className="p-1.5 text-[#787066] hover:text-[#2d2926] hover:bg-[#f4eee4] rounded-lg disabled:opacity-30 cursor-pointer"
            title="เลื่อนขึ้น"
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            disabled={!canMoveDown}
            onClick={() => onMoveRank('DOWN')}
            className="p-1.5 text-[#787066] hover:text-[#2d2926] hover:bg-[#f4eee4] rounded-lg disabled:opacity-30 cursor-pointer"
            title="เลื่อนลง"
          >
            <ArrowDown className="w-3.5 h-3.5" />
          </button>

          {footage && (
            <>
              <button
                type="button"
                onClick={() => setIsScriptExpanded((prev) => !prev)}
                className={`inline-flex items-center gap-1 px-2 py-1 text-[11px] font-bold rounded-lg border transition-colors cursor-pointer ${
                  isScriptExpanded || slot.mascotScript
                    ? 'bg-[#fef8ed] text-[#7d5622] border-[#f0e2ca]'
                    : 'bg-[#f4eee4] text-[#554d44] border-[#e2d9cd] hover:text-[#2d2926]'
                }`}
                title="เปิด/ปิดช่องเขียนบทพากย์มาสคอตของอันดับนี้"
              >
                <Mic className="w-3 h-3" />
                <span>บทพากย์</span>
              </button>

              <button
                type="button"
                onClick={() => setTraceabilityFootageId(footage.id)}
                className="p-1.5 text-[#787066] hover:text-[#2d2926] hover:bg-[#f4eee4] rounded-lg cursor-pointer"
                title="ดูและแก้ไขข้อมูลฟุตเทจหลัก"
              >
                <History className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={onClearSlot}
                className="p-1.5 text-[#9a9186] hover:text-[#a34c3c] hover:bg-[#fdf3ec] rounded-lg cursor-pointer"
                title="นำฟุตเทจออกจากอันดับนี้"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Auto-populated & Editable Script Fields (ชื่อฟุต & คำสร้อย) with Realtime / Custom EP Toggle */}
      {footage && (
        <div
          className="mt-2.5 pt-2.5 border-t border-[#ede7dc] space-y-2"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Mode Bar: Realtime Sync with Footage vs Custom for this EP only */}
          <div className="flex flex-wrap items-center justify-between gap-1.5">
            <div className="inline-flex items-center gap-1 p-0.5 rounded-lg bg-[#f4eee4] border border-[#e2d8cb]">
              <button
                type="button"
                onClick={() => onRankFieldChange?.('isCustomOverride', false)}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold transition-colors cursor-pointer ${
                  !isCustomMode
                    ? 'bg-[#edf4ed] text-[#244b2f] border border-[#bbd6b9] shadow-2xs'
                    : 'text-[#6e6459] hover:text-[#2d2926]'
                }`}
                title="ดึงคำสร้อยและชื่อฟุตจากตัวฟุตเทจแบบ Realtime และเมื่อพิมพ์แก้จะอัปเดตกลับไปที่ฟุตเทจหลักทันที"
              >
                <RefreshCw className="w-2.5 h-2.5 text-[#3b6845]" />
                <span>ซิงก์ตามฟุตเทจ (Realtime)</span>
              </button>

              <button
                type="button"
                onClick={() => onRankFieldChange?.('isCustomOverride', true)}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold transition-colors cursor-pointer ${
                  isCustomMode
                    ? 'bg-[#fef6e8] text-[#7d5622] border border-[#f0dfc8] shadow-2xs'
                    : 'text-[#6e6459] hover:text-[#2d2926]'
                }`}
                title="ล็อกคำสร้อยหรือชื่อฟุตไว้ใช้เฉพาะในคลิป EP นี้เท่านั้น โดยไม่ไปเปลี่ยนตัวฟุตเทจหลัก"
              >
                <Lock className="w-2.5 h-2.5 text-[#8a5a22]" />
                <span>ใช้เฉพาะ EP นี้ (Custom)</span>
              </button>
            </div>

            {isCustomMode ? (
              <button
                type="button"
                onClick={handlePushCustomToMasterFootage}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white hover:bg-[#edf4ed] text-[#244b2f] border border-[#bbd6b9] text-[10px] font-bold transition-colors cursor-pointer"
                title="บันทึกคำสร้อยและชื่อฟุตที่แต่งในช่องนี้ กลับไปเป็นค่าหลักของฟุตเทจด้วย"
              >
                <UploadCloud className="w-3 h-3 text-[#3b6845]" />
                <span>อัปเดตเข้าฟุตเทจหลักด้วย</span>
              </button>
            ) : (
              <span className="text-[10px] text-[#557a5b] font-semibold">
                {syncedToFootageNotice
                  ? 'อัปเดตเข้าฟุตเทจหลักแล้ว!'
                  : 'พิมพ์แก้ที่นี่ = อัปเดตฟุตเทจหลักให้อัตโนมัติ'}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="min-w-0">
              <label className="flex items-center gap-1 text-[11px] font-bold text-[#554d44] mb-1">
                <FileEdit className="w-3 h-3 text-[#8a5a22] shrink-0" />
                <span>ชื่อฟุตที่ {slot.rank} (ใช้ในสคริปต์):</span>
              </label>
              <input
                type="text"
                value={resolvedValues.rankTitle}
                onChange={(e) => handleFieldEdit('rankTitle', e.target.value)}
                placeholder={footage.title || `ระบุชื่อฟุตที่ ${slot.rank}...`}
                className={`w-full px-2.5 py-1.5 text-xs border rounded-lg focus:outline-none text-[#2d2926] ${
                  isCustomMode
                    ? 'bg-[#fffdf9] border-[#e8cfa8] focus:border-[#8a5a22]'
                    : 'bg-white border-[#e2d8cb] focus:border-[#3b6845]'
                }`}
              />
            </div>

            <div className="min-w-0">
              <label className="flex items-center gap-1 text-[11px] font-bold text-[#554d44] mb-1">
                <Quote className="w-3 h-3 text-[#3b6845] shrink-0" />
                <span>คำสร้อยที่ {slot.rank}:</span>
              </label>
              <input
                type="text"
                value={resolvedValues.punchlineNote}
                onChange={(e) =>
                  handleFieldEdit('punchlineNote', e.target.value)
                }
                placeholder="พิมพ์คำสร้อยประจำอันดับนี้..."
                className={`w-full px-2.5 py-1.5 text-xs border rounded-lg focus:outline-none text-[#2d2926] ${
                  isCustomMode
                    ? 'bg-[#fffdf9] border-[#e8cfa8] focus:border-[#8a5a22]'
                    : 'bg-white border-[#e2d8cb] focus:border-[#3b6845]'
                }`}
              />
            </div>
          </div>
        </div>
      )}

      {/* Collapsible Mascot Script Input */}
      <AnimatePresence initial={false}>
        {isScriptExpanded && footage && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mt-2 pt-2 border-t border-[#ede7dc]">
              <label className="flex items-center gap-1.5 text-[11px] font-bold text-[#47413a] mb-1">
                <Mic className="w-3.5 h-3.5 text-[#b37731]" />
                <span>
                  บทพากย์มาสคอต ({settings.defaultMascotName}) สำหรับอันดับที่{' '}
                  {slot.rank}:
                </span>
              </label>
              <input
                type="text"
                value={slot.mascotScript}
                onChange={(e) => onScriptChange(e.target.value)}
                placeholder={
                  footage.mascotNotes
                    ? `ไกด์มุก: ${footage.mascotNotes}`
                    : `พิมพ์บทพากย์มาสคอตเกริ่นนำก่อนเข้าคลิปอันดับที่ ${slot.rank}...`
                }
                className="w-full px-3 py-1.5 text-xs bg-[#faf7f2] border border-[#e8dfd3] rounded-lg focus:outline-none focus:bg-white focus:border-[#3b6845] text-[#2d2926]"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
