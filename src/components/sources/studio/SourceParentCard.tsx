import React from 'react';
import {
  AlertTriangle,
  ExternalLink,
  Film,
  Plus,
  Rocket,
} from 'lucide-react';
import { ComputedFootage } from '../../../types/footage.types';
import { RawSource } from '../../../types/source.types';
import { CategoryTag, SystemSettings } from '../../../types/tag.types';
import { formatThaiDate } from '../../../utils/fileNameGenerator';
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
  const childFootages = source.splitFootageIds
    .map((fid) => computedFootageMap[fid])
    .filter(Boolean);

  const usableChildrenCount = childFootages.filter(
    (ft) =>
      ft.cooldownStatus === 'NEW_UNTOUCHED' || ft.cooldownStatus === 'READY_FRESH'
  ).length;

  const isUnderMined = childFootages.length < underMinedThreshold;
  const primaryTagId = source.tags[0] || defaultFallbackTagId;
  const primaryTag = tagMap[primaryTagId];

  // Collect unique child tags that aren't already on the parent source
  const extraChildTagIds = Array.from(
    new Set(
      childFootages
        .flatMap((ft) => ft.tags)
        .filter((tid) => !source.tags.includes(tid))
    )
  );

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-2xs">
      {/* Source Top Bar */}
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="font-mono font-bold text-slate-900 text-sm">
              {source.id}
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-semibold text-indigo-700">{source.platform}</span>
            <span aria-hidden="true">·</span>
            <span>ช่องต้นทาง: {source.channelOrCreator}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">
              ความยาวรวม {source.totalDuration || '-'}
            </span>
            <span aria-hidden="true">·</span>
            <span>เพิ่มเมื่อ {formatThaiDate(source.createdAt)}</span>

            {isUnderMined && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-800 font-bold text-[11px]">
                <AlertTriangle className="w-3 h-3 text-amber-600" />
                <span>รอขุดมุกเพิ่ม (เพิ่งหั่น {childFootages.length} ฟุต)</span>
              </span>
            )}
          </div>

          <h2 className="text-lg font-bold text-slate-900">{source.title}</h2>

          {source.notes && <p className="text-xs text-slate-600">{source.notes}</p>}

          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            {source.tags.map((tid) => (
              <TagPill key={tid} tag={tagMap[tid]} />
            ))}
            {extraChildTagIds.map((tid) => (
              <TagPill key={tid} tag={tagMap[tid]} size="sm" />
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <div className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-right">
            <div className="text-[11px] text-slate-500">
              หั่นเป็นฟุตย่อยแล้ว (พร้อมใช้ {usableChildrenCount})
            </div>
            <div className="text-base font-extrabold font-mono tabular-nums text-slate-900 inline-flex items-center gap-1.5">
              <Film className="w-4 h-4 text-indigo-600" />
              <span>{childFootages.length} ฟุต</span>
            </div>
          </div>

          <a
            href={source.originalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors whitespace-nowrap"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>เปิดคลิปต้นฉบับ</span>
          </a>

          <button
            type="button"
            onClick={() => onLaunchEpisodeForCategory(primaryTagId)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-colors whitespace-nowrap cursor-pointer"
            title="ส่งหมวดหมู่ของไลฟ์นี้ไปจัด 5 อันดับอัตโนมัติ"
          >
            <Rocket className="w-3.5 h-3.5" />
            <span>ส่งหมวด #{primaryTag?.name || 'หลัก'} ไปจัด 5 อันดับ</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenSourceSplitter(source)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>หั่นฟุตที่ #{childFootages.length + 1} เพิ่ม</span>
          </button>
        </div>
      </div>

      {/* Dimension 3: Visual Timestamp Timeline Bar */}
      <SourceTimelineBar
        totalDuration={source.totalDuration}
        childFootages={childFootages}
        onSelectClip={onSelectForTraceability}
        onSplitMore={() => onOpenSourceSplitter(source)}
      />

      {/* Dimension 5: Episode Builder Selection Action Bar + Child Split Footages Table */}
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
