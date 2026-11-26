import React from 'react';
import {
  ArrowDown,
  ArrowUp,
  ChevronRight,
  ListOrdered,
  X,
} from 'lucide-react';
import { useCMS } from '../../../context/CMSContext';
import { EpisodeRankingSlot } from '../../../types/episode.types';
import { ComputedFootage } from '../../../types/footage.types';
import { SystemSettings } from '../../../types/tag.types';
import { VideoThumbnailPreview } from '../../footage/VideoThumbnailPreview';
import { StatusBadge } from '../../ui/StatusBadge';
import {
  RankNumber,
  RecipeShortfallNotice,
  SlotDropPayload,
} from './builder.types';
import { RecipeShortfallNoticeBanner } from './RecipeShortfallNoticeBanner';

interface BuilderStep2CompactRankRailProps {
  rankings: EpisodeRankingSlot[];
  computedFootageMap: Record<string, ComputedFootage>;
  selectedFootageIds: string[];
  activeSlotRank: RankNumber;
  settings: SystemSettings;
  onExpandToFormulaFocused: () => void;
  onActivatePickerSlot: (rank: RankNumber) => void;
  onDropItemOnSlot: (targetRank: RankNumber, payload: SlotDropPayload) => void;
  onMoveSlotByIndex: (index: number, direction: 'UP' | 'DOWN') => void;
  onClearSlotByRank: (rank: RankNumber) => void;
  recipeShortfallNotice: RecipeShortfallNotice | null;
  onDismissRecipeShortfall?: () => void;
  onSwitchToOrAndRefill?: () => void;
  onEnableCrossCategoryAndRefill?: () => void;
}

export const BuilderStep2CompactRankRail: React.FC<
  BuilderStep2CompactRankRailProps
> = ({
  rankings,
  computedFootageMap,
  selectedFootageIds,
  activeSlotRank,
  settings,
  onExpandToFormulaFocused,
  onActivatePickerSlot,
  onDropItemOnSlot,
  onMoveSlotByIndex,
  onClearSlotByRank,
  recipeShortfallNotice,
  onDismissRecipeShortfall,
  onSwitchToOrAndRefill,
  onEnableCrossCategoryAndRefill,
}) => {
  const { setPreviewFootageId } = useCMS();

  return (
    <div className="space-y-2.5 w-full">
      <RecipeShortfallNoticeBanner
        notice={recipeShortfallNotice}
        onDismiss={() => onDismissRecipeShortfall?.()}
        onOpenManualPool={() => {}}
        onSwitchToOrAndRefill={() => onSwitchToOrAndRefill?.()}
        onEnableCrossCategoryAndRefill={() =>
          onEnableCrossCategoryAndRefill?.()
        }
      />

      {/* Compact 5-Rank Summary Board with Single Mode Switch */}
      <div className="bg-[#fdfbf7] border border-[#e8dfd3] rounded-2xl p-3 space-y-2.5 shadow-xs">
        <div className="flex items-center justify-between gap-2 pb-2 border-b border-[#eee6da]">
          <div className="flex items-center gap-1.5 min-w-0">
            <ListOrdered className="w-4 h-4 text-[#3b6845] shrink-0" />
            <h3 className="text-xs font-bold text-[#2d2926] tabular-nums truncate">
              5 อันดับ ({selectedFootageIds.length}/5)
            </h3>
          </div>

          <button
            type="button"
            onClick={onExpandToFormulaFocused}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-[#244b2f] bg-[#edf4ed] hover:bg-[#3b6845] hover:text-white border border-[#bad8b9] rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <span>กางบอร์ดเต็ม</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-1.5">
          {rankings.map((slot, index) => {
            const footage = slot.footageId
              ? computedFootageMap[slot.footageId]
              : null;
            const isSlotActive = activeSlotRank === slot.rank;

            return (
              <div
                key={slot.rank}
                onClick={() => onActivatePickerSlot(slot.rank)}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  const raw = e.dataTransfer.getData('application/json');
                  if (!raw) return;
                  try {
                    const payload = JSON.parse(raw) as SlotDropPayload;
                    onDropItemOnSlot(slot.rank, payload);
                  } catch {
                    // ignore malformed drop
                  }
                }}
                className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                  isSlotActive
                    ? 'border-[#3b6845] bg-[#edf4ed] ring-1 ring-[#3b6845]/40'
                    : footage
                    ? 'border-[#bad8b9] bg-white'
                    : 'border-dashed border-[#e2d8cb] bg-[#faf7f2] hover:bg-white'
                }`}
              >
                <div className="flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`w-5 h-5 rounded-md flex items-center justify-center font-mono font-extrabold text-[11px] shrink-0 ${
                        footage
                          ? 'bg-[#3b6845] text-white'
                          : 'bg-[#e8dfd3] text-[#554d44]'
                      }`}
                    >
                      {slot.rank}
                    </span>

                    {footage ? (
                      <div className="flex items-center gap-2 min-w-0">
                        <VideoThumbnailPreview
                          footage={footage}
                          size="xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewFootageId(footage.id);
                          }}
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-xs text-[#2d2926]">
                              {footage.id}
                            </span>
                            <StatusBadge
                              status={footage.cooldownStatus}
                              daysSinceLastUse={footage.daysSinceLastUsed}
                              cooldownDays={settings.cooldownDays}
                              greenReadyDays={settings.greenReadyDays}
                              usageLast90Days={footage.usageLast90Days}
                              totalUsageCount={footage.totalUsageCount}
                              maxTotalUsageCount={settings.maxTotalUsageCount}
                              compact
                            />
                          </div>
                          <p className="text-[11px] text-[#554d44] truncate max-w-[130px]">
                            {footage.title}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <span className="text-[11px] font-medium text-[#8c8275]">
                        ว่าง · กด [{slot.rank}]
                      </span>
                    )}
                  </div>

                  {footage && (
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={(e) => {
                          e.stopPropagation();
                          onMoveSlotByIndex(index, 'UP');
                        }}
                        className="w-5 h-5 rounded flex items-center justify-center text-[#787066] hover:text-[#2d2926] disabled:opacity-20 cursor-pointer"
                        title="เลื่อนขึ้น"
                        aria-label="เลื่อนขึ้น"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        disabled={index === rankings.length - 1}
                        onClick={(e) => {
                          e.stopPropagation();
                          onMoveSlotByIndex(index, 'DOWN');
                        }}
                        className="w-5 h-5 rounded flex items-center justify-center text-[#787066] hover:text-[#2d2926] disabled:opacity-20 cursor-pointer"
                        title="เลื่อนลง"
                        aria-label="เลื่อนลง"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onClearSlotByRank(slot.rank);
                        }}
                        className="w-5 h-5 rounded flex items-center justify-center text-[#8e4537] hover:bg-[#fdf3ec] cursor-pointer"
                        title="นำคลิปออก"
                        aria-label="นำคลิปออก"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
