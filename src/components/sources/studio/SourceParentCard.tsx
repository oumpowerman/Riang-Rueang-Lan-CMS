import React from 'react';
import {
  AlertTriangle,
  ExternalLink,
  Film,
  Plus,
  Rocket,
  Zap,
} from 'lucide-react';
import { useCMS } from '../../../context/CMSContext';
import { ComputedFootage } from '../../../types/footage.types';
import { RawSource } from '../../../types/source.types';
import { CategoryTag, SystemSettings } from '../../../types/tag.types';
import { formatThaiDate } from '../../../utils/fileNameGenerator';
import { VideoThumbnailPreview } from '../../footage/VideoThumbnailPreview';
import { TagPill } from '../../ui/TagPill';
import { SourceTimelineBar } from '../SourceTimelineBar';
import { SourceChildClipsTable } from './SourceChildClipsTable';

interface SourceParentCardProps {
  source: RawSource;
  computedFootageMap: Record<string, ComputedFootage>;
  tagMap: Record<string, CategoryTag>;
  defaultFallbackTagId: string;
  underMinedThreshold: number;
  selectedIdsForSource: string[];
  currentChildPage: number;
  childPageSize: number;
  settings: SystemSettings;
  onLaunchEpisodeForCategory: (tagId: string) => void;
  onOpenSourceSplitter: (source: RawSource) => void;
  onSelectForTraceability: (footageId: string) => void;
  onSelectTop5Ready: (source: RawSource) => void;
  onLaunchEpisodeWithCustomClips: (
    clipIds: string[],
    categoryTagId: string,
    suggestedTitle: string
  ) => void;
  onToggleSelectClip: (sourceId: string, footageId: string) => void;
  onChildPageChange: (page: number) => void;
  onChildPageSizeChange: (size: number) => void;
}

export const SourceParentCard: React.FC<SourceParentCardProps> = ({
  source,
  computedFootageMap,
  tagMap,
  defaultFallbackTagId,
  underMinedThreshold,
  selectedIdsForSource,
  currentChildPage,
  childPageSize,
  settings,
  onLaunchEpisodeForCategory,
  onOpenSourceSplitter,
  onSelectForTraceability,
  onSelectTop5Ready,
  onLaunchEpisodeWithCustomClips,
  onToggleSelectClip,
  onChildPageChange,
  onChildPageSizeChange,
}) => {
  const { setPreviewFootageId } = useCMS();

  const childFootages = source.splitFootageIds
    .map((fid) => computedFootageMap[fid])
    .filter(Boolean);

  const usableChildrenCount = childFootages.filter(
    (ft) =>
      ft.cooldownStatus === 'NEW_UNTOUCHED' || ft.cooldownStatus === 'READY_FRESH'
  ).length;

  const isUnderMined = childFootages.length < underMinedThreshold;
  const primaryTagId = source.tags[0] || defaultFallbackTagId;

  const extraChildTagIds = Array.from(
    new Set(
      childFootages
        .flatMap((ft) => ft.tags)
        .filter((tid) => !source.tags.includes(tid))
    )
  );

  // Representative preview metadata for the parent live source
  const sourcePreviewTarget = {
    id: source.id,
    title: source.title,
    originalUrl: source.originalUrl || '',
    driveFileUrl: childFootages[0]?.driveFileUrl || '',
    thumbnailUrl: childFootages[0]?.thumbnailUrl || '',
    timestampRange: source.totalDuration || null,
    durationSec: undefined,
  };

  return (
    <div className="bg-[#fdfbf7] border border-[#e8dfd3] rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-2xs">
      {/* Source Top Bar */}
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3 border-b border-[#eee6da] pb-3.5">
        <div className="flex items-start gap-3.5 min-w-0 flex-1">
          <VideoThumbnailPreview
            footage={sourcePreviewTarget}
            size="md"
            onClick={(e) => {
              e.stopPropagation();
              setPreviewFootageId(source.id);
            }}
          />

          <div className="space-y-1.5 min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#787066]">
              <span className="font-mono font-bold text-[#244b2f] text-xs bg-[#edf4ed] px-2 py-0.5 rounded-md border border-[#bad8b9]">
                {source.id}
              </span>
              <span className="font-semibold text-[#4d4740]">{source.platform}</span>
              <span aria-hidden="true">·</span>
              <span className="truncate">{source.channelOrCreator}</span>
              {source.totalDuration && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">{source.totalDuration}</span>
                </>
              )}
              <span aria-hidden="true">·</span>
              <span>{formatThaiDate(source.createdAt)}</span>

              {isUnderMined && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#fef8ed] border border-[#f0e2ca] text-[#7d5622] font-bold text-[11px]">
                  <AlertTriangle className="w-3 h-3 text-[#b37731]" />
                  <span>หั่นน้อย ({childFootages.length})</span>
                </span>
              )}
            </div>

            <h2 className="text-base sm:text-lg font-bold text-[#2d2926] truncate">
              {source.title}
            </h2>

            {source.notes && (
              <p className="text-xs text-[#787066] line-clamp-1">{source.notes}</p>
            )}

            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              {source.tags.map((tid) => (
                <TagPill key={tid} tag={tagMap[tid]} />
              ))}
              {extraChildTagIds.map((tid) => (
                <TagPill key={tid} tag={tagMap[tid]} size="sm" />
              ))}
            </div>
          </div>
        </div>

        {/* Right Side Badges & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#faf7f2] border border-[#e8dfd3] rounded-xl text-xs font-mono tabular-nums">
            <span className="inline-flex items-center gap-1 font-bold text-[#2d2926]">
              <Film className="w-3.5 h-3.5 text-[#3b6845]" />
              <span>{childFootages.length} คลิป</span>
            </span>
            <span className="text-[#d5cbc0]">|</span>
            <span className="inline-flex items-center gap-1 font-bold text-[#244b2f]">
              <Zap className="w-3 h-3 text-[#3b6845]" />
              <span>พร้อมใช้ {usableChildrenCount}</span>
            </span>
          </div>

          <a
            href={source.originalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-[#4d4740] bg-[#f4eee4] hover:bg-[#eae1d4] border border-[#e2d8cb] rounded-xl transition-colors whitespace-nowrap"
            title="เปิดคลิปต้นฉบับ"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>ต้นฉบับ</span>
          </a>

          <button
            type="button"
            onClick={() => onLaunchEpisodeForCategory(primaryTagId)}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-[#244b2f] bg-[#edf4ed] hover:bg-[#dceadc] border border-[#bad8b9] rounded-xl transition-colors whitespace-nowrap cursor-pointer"
          >
            <Rocket className="w-3.5 h-3.5" />
            <span>จัด 5 อันดับ</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenSourceSplitter(source)}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-[#3b6845] hover:bg-[#2c5234] rounded-xl transition-colors whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>หั่นเพิ่ม</span>
          </button>
        </div>
      </div>

      {/* Visual Timestamp Timeline Bar */}
      <SourceTimelineBar
        totalDuration={source.totalDuration}
        childFootages={childFootages}
        onSelectClip={onSelectForTraceability}
        onSplitMore={() => onOpenSourceSplitter(source)}
      />

      {/* Child Split Footages Table */}
      <SourceChildClipsTable
        source={source}
        childFootages={childFootages}
        usableChildrenCount={usableChildrenCount}
        selectedIdsForSource={selectedIdsForSource}
        primaryTagId={primaryTagId}
        currentChildPage={currentChildPage}
        childPageSize={childPageSize}
        settings={settings}
        onSelectTop5Ready={onSelectTop5Ready}
        onLaunchEpisodeWithCustomClips={onLaunchEpisodeWithCustomClips}
        onToggleSelectClip={onToggleSelectClip}
        onSelectForTraceability={onSelectForTraceability}
        onChildPageChange={onChildPageChange}
        onChildPageSizeChange={onChildPageSizeChange}
      />
    </div>
  );
};
