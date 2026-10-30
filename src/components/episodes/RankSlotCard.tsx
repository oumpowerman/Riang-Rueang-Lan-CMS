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
  Clock,
} from 'lucide-react';
import { useCMS } from '../../context/CMSContext';
import { EpisodeRankingSlot } from '../../types/episode.types';
import { ComputedFootage } from '../../types/footage.types';
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
  canMoveUp,
  canMoveDown,
  onSlotDragStart,
  onDropItemOnSlot,
}) => {
  const { tagMap, settings, setTraceabilityFootageId, setPreviewFootageId } = useCMS();
  const [isScriptExpanded, setIsScriptExpanded] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

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
        <div className="flex items-start gap-2.5 flex-1 min-w-0">
          <div
            className="pt-2 text-[#9a9186] hover:text-[#4d4740] cursor-grab active:cursor-grabbing shrink-0"
            title="ลากเพื่อสลับอันดับขึ้น-ลง"
          >
            <GripVertical className="w-4 h-4" />
          </div>

          <div
            className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center shrink-0 font-mono border ${
              slot.rank === 1
                ? 'bg-[#fef4e8] text-[#7d5622] border-[#f0dfc8] font-black shadow-xs'
                : footage
                ? 'bg-[#edf4ed] text-[#2b5435] border-[#cbe0cb] font-extrabold'
                : 'bg-[#f3ede3] text-[#716960] border-[#e2d9cd]'
            }`}
          >
            <span className="text-[9px] uppercase tracking-wider opacity-80 leading-none">
              อันดับ
            </span>
            <span className="text-base font-extrabold tabular-nums leading-tight">
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
                    <span className="text-[#c7bdb2]">·</span>
                    <span className="text-[#787066] text-[11px] inline-flex items-center gap-1">
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

              <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                <div className="flex flex-wrap items-center gap-1">
                  {footage.tags.map((tid) => (
                    <TagPill key={tid} tag={tagMap[tid]} />
                  ))}
                </div>

                <span className="inline-flex items-center gap-1 text-[11px] font-mono text-[#787066]">
                  <Clock className="w-3 h-3 text-[#9a9186]" />
                  <span>
                    {footage.daysSinceLastUsed !== null
                      ? `พัก ${footage.daysSinceLastUsed} วัน`
                      : 'ฟุตใหม่แกะกล่อง'}
                  </span>
                </span>
              </div>
            </div>
            </>
          ) : (
            <div className="flex-1 py-1">
              <div className="text-xs sm:text-sm font-bold text-[#554d44]">
                ว่าง — ลากฟุตเทจมาวางที่นี่ หรือกดปุ่ม [{slot.rank}] จากคลังด้านขวา
              </div>
              <p className="text-[11px] text-[#8c8378] mt-0.5">
                {slot.rank === 1 ? (
                  <span className="inline-flex items-center gap-1 text-[#855621] font-medium">
                    <Star className="w-3 h-3 text-[#b37731] shrink-0" />
                    <span>อันดับ 1 แนะนำช็อตที่พีคและดึงดูดสายตาที่สุด</span>
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
                title="ดูประวัติการใช้งานฟุตนี้"
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
            <div className="mt-2.5 pt-2.5 border-t border-[#ede7dc]">
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
