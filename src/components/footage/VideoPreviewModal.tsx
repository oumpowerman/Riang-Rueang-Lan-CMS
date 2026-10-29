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
    tagMap,
    settings,
  } = useCMS();

  if (!previewFootageId) return null;
  const footage = computedFootageMap[previewFootageId];
  if (!footage) return null;

  const preview = getFootageVideoPreviewInfo(footage);
  const durationBadge = formatClipDurationBadge(footage);
  const inStaging = isFootageInStaging(footage.tags);

  const handleOpenFullDetail = () => {
    const id = footage.id;
    setPreviewFootageId(null);
    setTraceabilityFootageId(id);
  };

  return (
    <Modal
      isOpen={Boolean(previewFootageId)}
      onClose={() => setPreviewFootageId(null)}
      title={`${footage.id} • ${footage.title}`}
      subtitle={footage.standardFileName}
      maxWidthClass="max-w-3xl"
    >
      <div className="space-y-4">
        {/* Top Metadata Strip: Cooldown Status + Category Tags + Duration */}
        <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50/90 border border-slate-200/80 rounded-xl px-3.5 py-2.5">
          <div className="flex flex-wrap items-center gap-1.5">
            {inStaging ? (
              <TagPill tag={tagMap[STAGING_TAG_ID]} />
            ) : (
              footage.tags.map((tid) => <TagPill key={tid} tag={tagMap[tid]} />)
            )}
            {durationBadge && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-slate-200 text-xs font-mono font-bold text-slate-700">
                <Clock className="w-3 h-3 text-indigo-500" />
                <span>{durationBadge}</span>
              </span>
            )}
          </div>

          <StatusBadge
            status={footage.cooldownStatus}
            daysSinceLastUse={footage.daysSinceLastUsed}
            cooldownDays={settings.cooldownDays}
            greenReadyDays={settings.greenReadyDays}
            usageLast90Days={footage.usageLast90Days}
            totalUsageCount={footage.totalUsageCount}
            maxTotalUsageCount={settings.maxTotalUsageCount}
          />
        </div>

        {/* 16:9 Video Player Container */}
        <div className="w-full aspect-video rounded-2xl overflow-hidden border border-slate-200 bg-slate-950 shadow-xs relative">
          {preview.embedUrl ? (
            <iframe
              key={preview.embedUrl}
              src={preview.embedUrl}
              title={footage.title}
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
              className="w-full h-full border-0"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-50 via-indigo-50/50 to-sky-50/60 flex flex-col items-center justify-center p-6 text-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center justify-center text-slate-400">
                <Film className="w-6 h-6 text-indigo-500" />
              </div>
              <div className="space-y-1 max-w-md">
                <p className="text-sm font-bold text-slate-800">
                  ยังไม่มีลิงก์วิดีโอ Google Drive หรือ YouTube ที่พร้อมเล่น
                </p>
                <p className="text-xs text-slate-500">
                  คุณสามารถเพิ่มหรือแก้ไขลิงก์ Google Drive / YouTube ของฟุตเทจนี้ได้ในหน้ารายละเอียด
                </p>
              </div>
              <button
                type="button"
                onClick={handleOpenFullDetail}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                เพิ่ม / แก้ไขลิงก์วิดีโอ
              </button>
            </div>
          )}
        </div>

        {/* Optional Mascot Notes */}
        {footage.mascotNotes && (
          <div className="flex items-start gap-2 px-3.5 py-2.5 rounded-xl bg-indigo-50/50 border border-indigo-100 text-xs text-slate-700">
            <Sparkles className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{footage.mascotNotes}</span>
          </div>
        )}

        {/* Bottom Actions */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/80">
          <div className="flex items-center gap-2">
            {preview.externalUrl && (
              <a
                href={preview.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 text-xs font-bold transition-colors shadow-2xs"
              >
                {preview.provider === 'DRIVE' ? (
                  <>
                    <GoogleDriveIcon className="w-3.5 h-3.5" />
                    <span>เปิดใน Google Drive</span>
                  </>
                ) : preview.provider === 'YOUTUBE' ? (
                  <>
                    <Youtube className="w-3.5 h-3.5 text-rose-600" />
                    <span>เปิดใน YouTube</span>
                  </>
                ) : (
                  <span>เปิดลิงก์ต้นทาง</span>
                )}
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </a>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleOpenFullDetail}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80 text-xs font-bold transition-colors cursor-pointer"
            >
              <FolderEdit className="w-3.5 h-3.5" />
              <span>แก้ไขหมวดหมู่ / ดูประวัติ</span>
            </button>

            <button
              type="button"
              onClick={() => setPreviewFootageId(null)}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
