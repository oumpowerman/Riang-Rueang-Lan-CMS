import React from 'react';
import { AlertTriangle, Check, ExternalLink, FolderGit2 } from 'lucide-react';
import {
  hasRealMasterDriveLink,
  isPlaceholderMasterDriveLink,
} from '../../../utils/episodeValidator';

interface EpisodeMasterLinksFormProps {
  masterDriveUrl: string;
  onChangeMasterDriveUrl: (val: string) => void;
  youtubeUrl: string;
  onChangeYoutubeUrl: (val: string) => void;
  facebookUrl: string;
  onChangeFacebookUrl: (val: string) => void;
  tiktokUrl: string;
  onChangeTiktokUrl: (val: string) => void;
  instagramUrl: string;
  onChangeInstagramUrl: (val: string) => void;
  performanceNote: string;
  onChangePerformanceNote: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const EpisodeMasterLinksForm: React.FC<EpisodeMasterLinksFormProps> = ({
  masterDriveUrl,
  onChangeMasterDriveUrl,
  youtubeUrl,
  onChangeYoutubeUrl,
  facebookUrl,
  onChangeFacebookUrl,
  tiktokUrl,
  onChangeTiktokUrl,
  instagramUrl,
  onChangeInstagramUrl,
  performanceNote,
  onChangePerformanceNote,
  onSubmit,
}) => {
  return (
    <section className="space-y-3">
      <h4 className="text-sm font-bold text-[#2D2926] flex items-center gap-2">
        <FolderGit2 className="w-4 h-4 text-[#8A5A22]" />
        <span>02. ลิงก์ไฟล์คลิปหลักและหมายเหตุการใช้งาน</span>
      </h4>

      <form
        onSubmit={onSubmit}
        className="bg-[#FAF7F2] border border-[#E8DFD3] rounded-2xl p-4 sm:p-5 space-y-4"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-[#5C5349] mb-1">
              ลิงก์ไฟล์วิดีโอตัวเต็มใน Google Drive (รวม 5 ฟุต + มาสคอต)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="url"
                value={masterDriveUrl}
                onChange={(e) => onChangeMasterDriveUrl(e.target.value)}
                placeholder="https://drive.google.com/file/d/..."
                className="flex-1 min-w-0 px-3 py-2 text-xs bg-white border border-[#E2D8C9] rounded-xl focus:outline-hidden focus:border-[#C5AB84]"
              />
              {masterDriveUrl && (
                <a
                  href={masterDriveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-white border border-[#E2D8C9] rounded-xl text-[#5C5349] hover:text-[#6B4616] shrink-0"
                  title="เปิดไฟล์ใน Google Drive"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
            {!hasRealMasterDriveLink(masterDriveUrl) && (
              <p className="mt-1.5 text-[11px] font-medium text-[#8C4A19] flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-[#B56722] shrink-0" />
                <span>
                  {isPlaceholderMasterDriveLink(masterDriveUrl)
                    ? 'ลิงก์นี้เป็นลิงก์จำลองอัตโนมัติ (กรุณาวางลิงก์ไฟล์ Google Drive จริงแล้วกดบันทึก เพื่อให้สถานะเปลี่ยนเป็น "พร้อมสมบูรณ์")'
                    : 'ยังไม่ได้ระบุลิงก์ Master Drive จริง (กรุณาวางลิงก์แล้วกดบันทึก)'}
                </span>
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#5C5349] mb-1">
              ลิงก์อ้างอิง YouTube (ถ้ามี)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="url"
                value={youtubeUrl}
                onChange={(e) => onChangeYoutubeUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="flex-1 min-w-0 px-3 py-2 text-xs bg-white border border-[#E2D8C9] rounded-xl focus:outline-hidden focus:border-[#C5AB84]"
              />
              {youtubeUrl && (
                <a
                  href={youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-white border border-[#E2D8C9] rounded-xl text-[#5C5349] hover:text-[#6B4616] shrink-0"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#5C5349] mb-1">
              ลิงก์อ้างอิง Facebook (ถ้ามี)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="url"
                value={facebookUrl}
                onChange={(e) => onChangeFacebookUrl(e.target.value)}
                placeholder="https://www.facebook.com/..."
                className="flex-1 min-w-0 px-3 py-2 text-xs bg-white border border-[#E2D8C9] rounded-xl focus:outline-hidden focus:border-[#C5AB84]"
              />
              {facebookUrl && (
                <a
                  href={facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-white border border-[#E2D8C9] rounded-xl text-[#5C5349] hover:text-[#6B4616] shrink-0"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#5C5349] mb-1">
              ลิงก์อ้างอิง TikTok (ถ้ามี)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="url"
                value={tiktokUrl}
                onChange={(e) => onChangeTiktokUrl(e.target.value)}
                placeholder="https://www.tiktok.com/@juijui.j/video/..."
                className="flex-1 min-w-0 px-3 py-2 text-xs bg-white border border-[#E2D8C9] rounded-xl focus:outline-hidden focus:border-[#C5AB84]"
              />
              {tiktokUrl && (
                <a
                  href={tiktokUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-white border border-[#E2D8C9] rounded-xl text-[#5C5349] hover:text-[#6B4616] shrink-0"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#5C5349] mb-1">
              ลิงก์อ้างอิง Instagram (ถ้ามี)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="url"
                value={instagramUrl}
                onChange={(e) => onChangeInstagramUrl(e.target.value)}
                placeholder="https://www.instagram.com/reel/..."
                className="flex-1 min-w-0 px-3 py-2 text-xs bg-white border border-[#E2D8C9] rounded-xl focus:outline-hidden focus:border-[#C5AB84]"
              />
              {instagramUrl && (
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-white border border-[#E2D8C9] rounded-xl text-[#5C5349] hover:text-[#6B4616] shrink-0"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-[#5C5349] mb-1">
              บันทึกหมายเหตุการคัดเลือกฟุตเทจของตอนนี้
            </label>
            <input
              type="text"
              value={performanceNote}
              onChange={(e) => onChangePerformanceNote(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-[#E2D8C9] rounded-xl focus:outline-hidden focus:border-[#C5AB84]"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#3B6845] hover:bg-[#2C5234] rounded-xl transition-colors cursor-pointer shadow-2xs"
          >
            <Check className="w-3.5 h-3.5" />
            <span>อัปเดตข้อมูลไฟล์ตัวเต็ม & ลิงก์อ้างอิง</span>
          </button>
        </div>
      </form>
    </section>
  );
};
