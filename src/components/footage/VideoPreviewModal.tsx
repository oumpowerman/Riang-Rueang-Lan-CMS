import React from 'react';
import {
  Clock,
  ExternalLink,
  Film,
  FolderEdit,
  Sparkles,
  Youtube,
} from 'lucide-react';
import { useCMS } from '../../context/CMSContext';
import { isFootageInStaging, STAGING_TAG_ID } from '../../services/seedData';
import {
  formatClipDurationBadge,
  getFootageVideoPreviewInfo,
} from '../../utils/videoPreviewUtils';
import { GoogleDriveIcon } from '../ui/GoogleDriveIcon';
import { Modal } from '../ui/Modal';
import { StatusBadge } from '../ui/StatusBadge';
import { TagPill } from '../ui/TagPill';

export const VideoPreviewModal: React.FC = () => {
  const {
    previewFootageId,
    setPreviewFootageId,
    setTraceabilityFootageId,
    computedFootageMap,
    sources,
    tagMap,
    settings,
  } = useCMS();

  if (!previewFootageId) return null;

  const footage = computedFootageMap[previewFootageId];
  const rawSource = !footage
    ? sources.find((s) => s.id === previewFootageId)
    : undefined;

  if (!footage && !rawSource) return null;

  // Build unified preview target for either a Footage item or a RawSource parent item
  const fallbackChildFootage = rawSource
    ? rawSource.splitFootageIds.map((fid) => computedFootageMap[fid]).find(Boolean)
    : undefined;

  const previewTarget = footage
    ? footage
    : {
        id: rawSource!.id,
        title: rawSource!.title,
        originalUrl: rawSource!.originalUrl || '',
        driveFileUrl: fallbackChildFootage?.driveFileUrl || '',
        thumbnailUrl: fallbackChildFootage?.thumbnailUrl || '',
        timestampRange: rawSource!.totalDuration || null,
        durationSec: undefined,
      };

  const preview = getFootageVideoPreviewInfo(previewTarget);
  const durationBadge = formatClipDurationBadge(previewTarget);
  const itemTags = footage ? footage.tags : rawSource?.tags || [];
  const inStaging = isFootageInStaging(itemTags);

  const handleOpenFullDetail = () => {
    if (footage) {
      const id = footage.id;
      setPreviewFootageId(null);
      setTraceabilityFootageId(id);
    } else if (fallbackChildFootage) {
      const id = fallbackChildFootage.id;
      setPreviewFootageId(null);
      setTraceabilityFootageId(id);
    }
  };

  return (
    <Modal
      isOpen={Boolean(previewFootageId)}
      onClose={() => setPreviewFootageId(null)}
      title={`${previewTarget.id} • ${previewTarget.title}`}
      subtitle={
        footage
          ? footage.standardFileName
          : `${rawSource?.platform || 'Live Source'} • ${rawSource?.channelOrCreator || ''}`
      }
      maxWidthClass="max-w-3xl"
    >
      <div className="space-y-4">
        {/* Top Metadata Strip: Cooldown Status + Category Tags + Duration */}
        <div className="flex flex-wrap items-center justify-between gap-2 bg-[#faf7f2] border border-[#e8dfd3] rounded-xl px-3.5 py-2.5">
          <div className="flex flex-wrap items-center gap-1.5">
            {inStaging ? (
              <TagPill tag={tagMap[STAGING_TAG_ID]} />
            ) : (
              itemTags.map((tid) => <TagPill key={tid} tag={tagMap[tid]} />)
            )}
            {durationBadge && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#fdfbf7] border border-[#e2d8cb] text-xs font-mono font-bold text-[#4d4740]">
                <Clock className="w-3 h-3 text-[#3b6845]" />
                <span>{durationBadge}</span>
              </span>
            )}
          </div>

          {footage ? (
            <StatusBadge
              status={footage.cooldownStatus}
              daysSinceLastUse={footage.daysSinceLastUsed}
              cooldownDays={settings.cooldownDays}
              greenReadyDays={settings.greenReadyDays}
              usageLast90Days={footage.usageLast90Days}
              totalUsageCount={footage.totalUsageCount}
              maxTotalUsageCount={settings.maxTotalUsageCount}
            />
          ) : (
            <span className="px-2.5 py-1 rounded-lg bg-[#edf4ed] text-[#244b2f] border border-[#bad8b9] text-xs font-bold">
              ไลฟ์ต้นฉบับ ({rawSource?.splitFootageIds.length || 0} คลิปย่อย)
            </span>
          )}
        </div>

        {/* 16:9 Video Player Container in Light Pastel Earth Tone */}
        <div className="w-full aspect-video rounded-2xl overflow-hidden border border-[#e2d8cb] bg-[#f4eee4] shadow-xs relative">
          {preview.embedUrl ? (
            <iframe
              key={preview.embedUrl}
              src={preview.embedUrl}
              title={previewTarget.title}
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
              className="w-full h-full border-0"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#fdfbf7] via-[#f4eee4] to-[#edf4ed]/70 flex flex-col items-center justify-center p-6 text-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#fdfbf7] border border-[#e2d8cb] shadow-2xs flex items-center justify-center text-[#3b6845]">
                <Film className="w-6 h-6 text-[#3b6845]" />
              </div>
              <div className="space-y-1 max-w-md">
                <p className="text-sm font-bold text-[#2d2926]">
                  ยังไม่มีลิงก์วิดีโอ Google Drive หรือ YouTube ที่พร้อมเล่น
                </p>
                <p className="text-xs text-[#787066]">
                  คุณสามารถเพิ่มหรือแก้ไขลิงก์ Google Drive / YouTube ของรายการนี้ได้ในหน้ารายละเอียด
                </p>
              </div>
              {(footage || fallbackChildFootage) && (
                <button
                  type="button"
                  onClick={handleOpenFullDetail}
                  className="px-3.5 py-2 rounded-xl bg-[#3b6845] hover:bg-[#2c5234] text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  เพิ่ม / แก้ไขลิงก์วิดีโอ
                </button>
              )}
            </div>
          )}
        </div>

        {/* Optional Mascot Notes / Source Notes */}
        {(footage?.mascotNotes || rawSource?.notes) && (
          <div className="flex items-start gap-2 px-3.5 py-2.5 rounded-xl bg-[#edf4ed]/70 border border-[#bad8b9] text-xs text-[#2d2926]">
            <Sparkles className="w-4 h-4 text-[#3b6845] shrink-0 mt-0.5" />
            <span className="leading-relaxed">
              {footage?.mascotNotes || rawSource?.notes}
            </span>
          </div>
        )}

        {/* Bottom Actions */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#e8dfd3]">
          <div className="flex items-center gap-2">
            {preview.externalUrl && (
              <a
                href={preview.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#fdfbf7] hover:bg-[#f4eee4] text-[#4d4740] border border-[#e2d8cb] text-xs font-bold transition-colors shadow-2xs"
              >
                {preview.provider === 'DRIVE' ? (
                  <>
                    <GoogleDriveIcon className="w-3.5 h-3.5" />
                    <span>เปิดใน Google Drive</span>
                  </>
                ) : preview.provider === 'YOUTUBE' ? (
                  <>
                    <Youtube className="w-3.5 h-3.5 text-[#c95b48]" />
                    <span>เปิดใน YouTube</span>
                  </>
                ) : (
                  <span>เปิดลิงก์ต้นทาง</span>
                )}
                <ExternalLink className="w-3.5 h-3.5 text-[#8c8275]" />
              </a>
            )}
          </div>

          <div className="flex items-center gap-2">
            {(footage || fallbackChildFootage) && (
              <button
                type="button"
                onClick={handleOpenFullDetail}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#edf4ed] hover:bg-[#dceadc] text-[#244b2f] border border-[#bad8b9] text-xs font-bold transition-colors cursor-pointer"
              >
                <FolderEdit className="w-3.5 h-3.5" />
                <span>แก้ไขหมวดหมู่ / ดูประวัติ</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setPreviewFootageId(null)}
              className="px-4 py-2 rounded-xl bg-[#3b6845] hover:bg-[#2c5234] text-white text-xs font-bold transition-colors cursor-pointer"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
