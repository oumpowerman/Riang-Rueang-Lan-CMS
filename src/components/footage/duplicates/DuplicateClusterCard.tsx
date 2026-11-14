import React, { useMemo } from 'react';
import {
  CheckCircle2,
  Crown,
  ExternalLink,
  Film,
  GitMerge,
  Link2,
  Loader2,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { isStagingTagId } from '../../../services/seedData';
import { Episode } from '../../../types/episode.types';
import { CategoryTag } from '../../../types/tag.types';
import {
  buildMergedSurvivorPreview,
  DuplicateCluster,
  getDuplicateReasonLabel,
} from '../../../utils/duplicateClusterScanner';
import { extractDefaultRankFields } from '../../../utils/episodeScriptGenerator';
import { formatThaiDate, hasRealDriveLink } from '../../../utils/fileNameGenerator';
import { GoogleDriveIcon } from '../../ui/GoogleDriveIcon';
import { TagPill } from '../../ui/TagPill';

interface DuplicateClusterCardProps {
  cluster: DuplicateCluster;
  clusterIndex: number;
  selectedSurvivorId: string;
  excludedDuplicateIds: string[];
  episodes: Episode[];
  tagMap: Record<string, CategoryTag>;
  isMerging: boolean;
  onSelectSurvivor: (clusterId: string, survivorId: string) => void;
  onToggleExcludeDuplicate: (clusterId: string, footageId: string) => void;
  onMergeCluster: (cluster: DuplicateCluster) => void;
}

export const DuplicateClusterCard: React.FC<DuplicateClusterCardProps> = ({
  cluster,
  clusterIndex,
  selectedSurvivorId,
  excludedDuplicateIds,
  episodes,
  tagMap,
  isMerging,
  onSelectSurvivor,
  onToggleExcludeDuplicate,
  onMergeCluster,
}) => {
  const excludedSet = useMemo(
    () => new Set(excludedDuplicateIds),
    [excludedDuplicateIds]
  );

  const survivor =
    cluster.items.find((ft) => ft.id === selectedSurvivorId) || cluster.items[0];

  const duplicatesToMerge = useMemo(
    () =>
      cluster.items.filter(
        (ft) => ft.id !== survivor.id && !excludedSet.has(ft.id)
      ),
    [cluster.items, survivor.id, excludedSet]
  );

  const preview = useMemo(
    () => buildMergedSurvivorPreview(survivor, duplicatesToMerge, episodes),
    [survivor, duplicatesToMerge, episodes]
  );

  return (
    <div className="bg-white border border-[#E8DFD3] rounded-2xl overflow-hidden shadow-2xs">
      {/* Cluster Header */}
      <div className="px-3.5 sm:px-4 py-2.5 bg-[#FDFBF7] border-b border-[#EFE7DC] flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2 min-w-0">
          <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-[#F5EDE2] border border-[#E4D5C1] text-[#5D4938] font-mono text-[11px] font-extrabold tabular-nums">
            กลุ่ม #{clusterIndex + 1} · {cluster.items.length} คลิป
          </span>

          {cluster.reasons.map((reason) => (
            <span
              key={reason}
              className="inline-flex items-center px-2 py-0.5 rounded-lg bg-[#FEF3E6] border border-[#F2CEAE] text-[#8A4A18] text-[11px] font-bold"
            >
              {getDuplicateReasonLabel(reason)}
            </span>
          ))}

          <span className="text-xs sm:text-sm font-bold text-[#3D332A] truncate max-w-[300px] sm:max-w-[460px]">
            {cluster.matchedKeysSummary}
          </span>
        </div>

        <button
          type="button"
          disabled={isMerging || duplicatesToMerge.length === 0}
          onClick={() => onMergeCluster(cluster)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#DDF0E2] hover:bg-[#CBE7D2] disabled:opacity-50 disabled:cursor-not-allowed border border-[#A8D5BA] text-[#1E5631] text-xs font-extrabold transition-colors cursor-pointer shrink-0 whitespace-nowrap"
        >
          {isMerging ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
          ) : (
            <GitMerge className="w-3.5 h-3.5 shrink-0" />
          )}
          <span>
            รวมกลุ่มนี้ ({duplicatesToMerge.length} ตัวซ้ำ ➔ {survivor.id})
          </span>
        </button>
      </div>

      {/* Member Cards Grid/List */}
      <div className="p-3 sm:p-4 space-y-2.5">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
          {cluster.items.map((ft) => {
            const isSurvivor = ft.id === survivor.id;
            const isExcluded = !isSurvivor && excludedSet.has(ft.id);
            const isRecommended = ft.id === cluster.recommendedSurvivorId;
            const hasDrive = hasRealDriveLink(ft.driveFileUrl);
            const hasOrig = Boolean(ft.originalUrl?.trim());
            const { punchlineNote } = extractDefaultRankFields(ft);
            const realTags = Array.from(
              new Set((ft.tags || []).filter((t) => !isStagingTagId(t)))
            );

            return (
              <div
                key={ft.id}
                onClick={() => onSelectSurvivor(cluster.clusterId, ft.id)}
                className={`rounded-xl border p-3 transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                  isSurvivor
                    ? 'bg-[#EDF7F1] border-[#8EC7A4] ring-2 ring-[#BFE4CD]/70'
                    : isExcluded
                    ? 'bg-[#FAF8F5] border-[#E8DFD3] opacity-70'
                    : 'bg-[#FDF4F5] border-[#F0C8CE] hover:border-[#E2A5AE]'
                }`}
              >
                {/* Top Row: Survivor Selector + ID + Badges */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-extrabold border ${
                        isSurvivor
                          ? 'bg-[#22543D] text-white border-[#22543D]'
                          : isExcluded
                          ? 'bg-white text-[#7D6E61] border-[#DFD4C7]'
                          : 'bg-white text-[#9B2C38] border-[#ECC1C6]'
                      }`}
                    >
                      {isSurvivor ? (
                        <>
                          <Crown className="w-3 h-3 shrink-0" />
                          <span>ตัวหลัก (เก็บไว้)</span>
                        </>
                      ) : isExcluded ? (
                        <span>ไม่รวมตัวนี้</span>
                      ) : (
                        <>
                          <Trash2 className="w-3 h-3 shrink-0" />
                          <span>ตัวซ้ำ (จะถูกลบ)</span>
                        </>
                      )}
                    </span>

                    <span className="inline-flex items-center gap-1 font-mono text-xs font-extrabold text-[#3D332A] tabular-nums">
                      <Film className="w-3 h-3 text-[#7D6E61]" />
                      {ft.id}
                    </span>

                    {isRecommended && (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-[#EBF3FE] border border-[#BFD8FA] text-[#1E4B8F] text-[10px] font-bold">
                        <Sparkles className="w-2.5 h-2.5" />
                        <span>แนะนำ</span>
                      </span>
                    )}
                  </div>

                  {!isSurvivor && (
                    <label
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#6F6053] hover:text-[#3D332A] cursor-pointer shrink-0 select-none"
                    >
                      <input
                        type="checkbox"
                        checked={!isExcluded}
                        onChange={() =>
                          onToggleExcludeDuplicate(cluster.clusterId, ft.id)
                        }
                        className="w-3.5 h-3.5 rounded accent-[#9B2C38] cursor-pointer"
                      />
                      <span>ยุบรวม</span>
                    </label>
                  )}
                </div>

                {/* Title & Catchphrase */}
                <div className="space-y-1">
                  <div className="text-xs sm:text-sm font-bold text-[#2F2720] line-clamp-2">
                    {ft.title}
                  </div>
                  {punchlineNote && (
                    <div className="text-[11px] font-medium text-[#2B5435] truncate">
                      คำสร้อย: &ldquo;{punchlineNote}&rdquo;
                    </div>
                  )}
                </div>

                {/* Metadata: Links + EP Usage + Date */}
                <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                  <span
                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border font-semibold ${
                      hasDrive
                        ? 'bg-white border-[#C4DEC9] text-[#235732]'
                        : 'bg-white/80 border-[#EAD8C3] text-[#9A6324]'
                    }`}
                  >
                    <GoogleDriveIcon className="w-2.5 h-2.5 shrink-0" />
                    <span>{hasDrive ? 'มีลิงก์ Drive' : 'ไม่มี Drive'}</span>
                  </span>

                  {hasOrig && (
                    <a
                      href={ft.originalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-white border border-[#D4DFEE] text-[#2F538C] hover:bg-[#F3F8FF] font-semibold max-w-[180px]"
                      title={ft.originalUrl}
                    >
                      <Link2 className="w-2.5 h-2.5 shrink-0" />
                      <span className="truncate">ลิงก์ต้นฉบับ</span>
                      <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                    </a>
                  )}

                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-white border border-[#E6DDD1] text-[#5D4938] font-mono tabular-nums font-bold">
                    ใช้ใน EP: {ft.totalUsageCount}
                  </span>

                  <span className="text-[10px] font-mono text-[#8A7B6E] tabular-nums">
                    {formatThaiDate(ft.createdAt)}
                  </span>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1 pt-1 border-t border-black/5">
                  {realTags.length > 0 ? (
                    realTags.map((tid) => <TagPill key={tid} tag={tagMap[tid]} />)
                  ) : (
                    <span className="text-[11px] text-[#9B743D] font-medium">
                      ยังไม่มีหมวดหมู่
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Merged Result Preview Strip */}
        {duplicatesToMerge.length > 0 && (
          <div className="rounded-xl bg-[#F4F9F5] border border-[#C6E2CD] px-3 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[#214D2F] min-w-0">
              <span className="inline-flex items-center gap-1 font-extrabold shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#2E7D4A]" />
                <span>ผลลัพธ์ตัวหลัก ({survivor.id}):</span>
              </span>

              <span className="font-semibold">
                แท็กรวม{' '}
                <span className="font-mono tabular-nums">
                  {
                    preview.mergedTags.filter((tid) => !isStagingTagId(tid))
                      .length
                  }
                </span>{' '}
                แท็ก
              </span>

              <span>·</span>
              <span className="font-semibold">
                {hasRealDriveLink(preview.mergedDriveFileUrl)
                  ? 'มีลิงก์ Drive ครบ'
                  : 'ยังไม่มี Drive'}
              </span>

              {preview.mergedPunchlineNote && (
                <>
                  <span>·</span>
                  <span className="truncate max-w-[220px]">
                    คำสร้อย: &ldquo;{preview.mergedPunchlineNote}&rdquo;
                  </span>
                </>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0 text-[11px] font-bold">
              {preview.affectedEpisodeCount > 0 ? (
                <span className="px-2 py-0.5 rounded-lg bg-white border border-[#BBDAC3] text-[#1E5631] font-mono tabular-nums">
                  ย้ายอ้างอิง EP {preview.affectedEpisodeCount} ตอน ➔{' '}
                  {survivor.id}
                </span>
              ) : (
                <span className="text-[#4F755A]">ไม่มีประวัติ EP ที่ต้องย้าย</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
