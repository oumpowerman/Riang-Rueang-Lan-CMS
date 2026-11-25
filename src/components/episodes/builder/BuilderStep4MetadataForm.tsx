import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Check,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Folder,
  Video,
  Mic,
  Plus,
  RotateCcw,
} from 'lucide-react';
import { PublishSlot } from '../../../types/episode.types';
import { BuilderSeriesCatalogItem, BuilderSeriesMode } from './builder.types';
import { BuilderSeriesSelectorBar } from './BuilderSeriesSelectorBar';

interface BuilderStep4MetadataFormProps {
  isOpen: boolean;
  onToggle: () => void;
  nextEpisodeId: string;
  selectedCount: number;
  previewMasterFileName: string;
  title: string;
  onChangeTitle: (val: string) => void;
  isTitleManuallyEdited?: boolean;
  standardizedTitlePreview?: string;
  onResetTitleToStandard?: () => void;
  seriesCatalog: BuilderSeriesCatalogItem[];
  seriesMode: BuilderSeriesMode;
  activeExistingSeries: BuilderSeriesCatalogItem | null;
  customSeriesName: string;
  effectiveSeriesName: string;
  autoEpisodeNo: number;
  effectiveEpisodeNo: number;
  isManualEpisodeNo: boolean;
  isDuplicateEpisodeNo: boolean;
  existingSeriesEpisodesCount: number;
  latestSeriesEpisodeNo: number;
  matchingExistingSeriesForNewName: BuilderSeriesCatalogItem | null;
  onSelectExistingSeries: (seriesKey: string) => void;
  onSwitchToNewSeries: (initialName?: string) => void;
  onChangeCustomSeriesName: (val: string) => void;
  onChangeEpisodeNo: (epNo: number) => void;
  onResetAutoEpisodeNo: () => void;
  publishDate: string;
  onChangePublishDate: (val: string) => void;
  publishSlot: PublishSlot;
  onChangePublishSlot: (val: PublishSlot) => void;
  isOptionalMasterOpen: boolean;
  onToggleOptionalMaster: () => void;
  masterDriveUrl: string;
  onChangeMasterDriveUrl: (val: string) => void;
  youtubeUrl: string;
  onChangeYoutubeUrl: (val: string) => void;
  facebookUrl: string;
  onChangeFacebookUrl: (val: string) => void;
  tiktokUrl?: string;
  onChangeTiktokUrl?: (val: string) => void;
  instagramUrl?: string;
  onChangeInstagramUrl?: (val: string) => void;
  introMascotScript: string;
  onChangeIntroMascotScript: (val: string) => void;
  outroMascotScript: string;
  onChangeOutroMascotScript: (val: string) => void;
  onSubmitEpisode: (e: React.FormEvent) => void;
}

const SLIDE_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

export const BuilderStep4MetadataForm: React.FC<
  BuilderStep4MetadataFormProps
> = ({
  isOpen,
  onToggle,
  nextEpisodeId,
  selectedCount,
  previewMasterFileName,
  title,
  onChangeTitle,
  isTitleManuallyEdited = false,
  standardizedTitlePreview = '',
  onResetTitleToStandard,
  seriesCatalog,
  seriesMode,
  activeExistingSeries,
  customSeriesName,
  effectiveSeriesName,
  autoEpisodeNo,
  effectiveEpisodeNo,
  isManualEpisodeNo,
  isDuplicateEpisodeNo,
  existingSeriesEpisodesCount,
  latestSeriesEpisodeNo,
  matchingExistingSeriesForNewName,
  onSelectExistingSeries,
  onSwitchToNewSeries,
  onChangeCustomSeriesName,
  onChangeEpisodeNo,
  onResetAutoEpisodeNo,
  publishDate,
  onChangePublishDate,
  publishSlot,
  onChangePublishSlot,
  isOptionalMasterOpen,
  onToggleOptionalMaster,
  masterDriveUrl,
  onChangeMasterDriveUrl,
  youtubeUrl,
  onChangeYoutubeUrl,
  facebookUrl,
  onChangeFacebookUrl,
  tiktokUrl = '',
  onChangeTiktokUrl,
  instagramUrl = '',
  onChangeInstagramUrl,
  introMascotScript,
  onChangeIntroMascotScript,
  outroMascotScript,
  onChangeOutroMascotScript,
  onSubmitEpisode,
}) => {
  return (
    <motion.form
      layout="position"
      transition={{ duration: 0.28, ease: SLIDE_EASE }}
      onSubmit={onSubmitEpisode}
      className={`rounded-2xl border p-4 sm:p-5 transition-colors duration-200 ${
        isOpen
          ? 'border-[#bad8b9] bg-[#f9fbf8]'
          : 'border-[#e8dfd3] bg-[#fdfbf7] shadow-xs hover:border-[#bad8b9]'
      }`}
    >
      {/* Persistent Accordion Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div
          onClick={!isOpen ? onToggle : undefined}
          className={`flex flex-wrap items-center gap-2 text-xs min-w-0 ${
            !isOpen ? 'cursor-pointer' : ''
          }`}
        >
          <span
            className={`px-2.5 py-1 rounded-lg font-bold shrink-0 transition-colors ${
              isOpen
                ? 'bg-[#3b6845] text-white'
                : 'bg-[#edf4ed] text-[#2b5435]'
            }`}
          >
            ขั้นที่ 3
          </span>

          {isOpen ? (
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-[#2d2926]">
                ข้อมูลตอน & บันทึก
              </h2>
              <p className="text-[11px] font-mono text-[#787066] truncate">
                {previewMasterFileName}
              </p>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-wrap items-center gap-2 min-w-0"
            >
              <span className="font-bold text-[#2d2926] truncate max-w-md">
                {title || 'ยังไม่ได้ระบุชื่อคลิป'}
              </span>
              <span className="text-[#c7bdb2]">·</span>
              <span className="font-mono tabular-nums text-[#787066]">
                {publishDate} ({publishSlot === 'MORNING_0600' ? '06:00' : '18:00'})
              </span>
            </motion.div>
          )}
        </div>

        {isOpen ? (
          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={onToggleOptionalMaster}
            className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 text-xs font-bold text-[#554d44] bg-[#f4eee4] hover:bg-[#eae1d4] rounded-xl transition-colors cursor-pointer border border-[#e2d8cb]"
          >
            {isOptionalMasterOpen ? (
              <>
                <ChevronUp className="w-3.5 h-3.5" />
                <span>ซ่อนข้อมูลเสริม</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5" />
                <span className="inline-flex items-center gap-1">
                  <Plus className="w-3 h-3" />
                  <span className="sm:hidden">ลิงก์ & บทพากย์</span>
                  <span className="hidden sm:inline">
                    ลิงก์ Drive / YouTube / FB & บทเปิด-ปิด
                  </span>
                </span>
              </>
            )}
          </motion.button>
        ) : (
          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={onToggle}
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer border ${
              selectedCount === 5
                ? 'bg-[#3b6845] hover:bg-[#2c5234] text-white border-[#3b6845]'
                : 'bg-[#f4eee4] hover:bg-[#eae1d4] text-[#4d4740] border-[#e2d8cb]'
            }`}
          >
            <span>{selectedCount === 5 ? 'เปิดบันทึกคลิป' : 'ตั้งค่าชื่อคลิป'}</span>
            <motion.span
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={{ duration: 0.25 }}
              className="inline-flex"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </motion.span>
          </motion.button>
        )}
      </div>

      {/* Animated Slide Up / Down Accordion Body */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="step4-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: SLIDE_EASE }}
            className="overflow-hidden"
          >
            <motion.div
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -10, opacity: 0 }}
              transition={{ duration: 0.24, ease: 'easeOut' }}
              className="pt-4 space-y-4"
            >
              {/* Interactive Series Selector & Editable EP Number Panel */}
              <BuilderSeriesSelectorBar
                variant="step3"
                seriesCatalog={seriesCatalog}
                seriesMode={seriesMode}
                activeExistingSeries={activeExistingSeries}
                customSeriesName={customSeriesName}
                effectiveSeriesName={effectiveSeriesName}
                autoEpisodeNo={autoEpisodeNo}
                effectiveEpisodeNo={effectiveEpisodeNo}
                isManualEpisodeNo={isManualEpisodeNo}
                isDuplicateEpisodeNo={isDuplicateEpisodeNo}
                existingSeriesEpisodesCount={existingSeriesEpisodesCount}
                latestSeriesEpisodeNo={latestSeriesEpisodeNo}
                matchingExistingSeriesForNewName={matchingExistingSeriesForNewName}
                nextEpisodeId={nextEpisodeId}
                onSelectExistingSeries={onSelectExistingSeries}
                onSwitchToNewSeries={onSwitchToNewSeries}
                onChangeCustomSeriesName={onChangeCustomSeriesName}
                onChangeEpisodeNo={onChangeEpisodeNo}
                onResetAutoEpisodeNo={onResetAutoEpisodeNo}
              />

              {/* Core Required Episode Fields */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-[#fdfbf7] border border-[#e8dfd3] rounded-xl p-4">
                <div className="md:col-span-7">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                    <label className="block text-xs font-bold text-[#38332d]">
                      ชื่อคลิป 5 อันดับ *
                    </label>
                    {isTitleManuallyEdited &&
                      standardizedTitlePreview &&
                      title.trim() !== standardizedTitlePreview.trim() &&
                      onResetTitleToStandard && (
                        <button
                          type="button"
                          onClick={onResetTitleToStandard}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-[#3b6845] hover:underline cursor-pointer"
                          title={standardizedTitlePreview}
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>ใช้ชื่อมาตรฐาน ({effectiveSeriesName} · EP.{effectiveEpisodeNo})</span>
                        </button>
                      )}
                  </div>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => onChangeTitle(e.target.value)}
                    placeholder="เช่น 5 อันดับ คนไทยเป็นคนตลก EP.12"
                    className="w-full px-3 py-2 text-xs sm:text-sm font-semibold bg-[#faf7f2] border border-[#e8dfd3] rounded-xl focus:outline-none focus:bg-white focus:border-[#3b6845] text-[#2d2926]"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-[#38332d] mb-1">
                    วันที่คิวโพสต์
                  </label>
                  <input
                    type="date"
                    value={publishDate}
                    onChange={(e) => onChangePublishDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono tabular-nums bg-[#faf7f2] border border-[#e8dfd3] rounded-xl focus:outline-none focus:bg-white focus:border-[#3b6845] text-[#2d2926]"
                  />
                </div>

                <div className="md:col-span-3">
                  <label className="block text-xs font-bold text-[#38332d] mb-1">
                    รอบเวลาอ้างอิง
                  </label>
                  <select
                    value={publishSlot}
                    onChange={(e) =>
                      onChangePublishSlot(e.target.value as PublishSlot)
                    }
                    className="w-full px-3 py-2 text-xs font-semibold bg-[#faf7f2] border border-[#e8dfd3] rounded-xl focus:outline-none focus:bg-white focus:border-[#3b6845] text-[#2d2926] cursor-pointer"
                  >
                    <option value="MORNING_0600">รอบเช้า 06:00 น.</option>
                    <option value="EVENING_1800">รอบเย็น 18:00 น.</option>
                  </select>
                </div>
              </div>

              {/* Collapsible Optional Master Video Links & Intro/Outro Mascot Scripts */}
              <AnimatePresence initial={false}>
                {isOptionalMasterOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: SLIDE_EASE }}
                    className="overflow-hidden"
                  >
                    <div className="bg-[#fdfbf7] border border-[#e8dfd3] rounded-xl p-4 space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="flex items-center gap-1.5 text-xs font-semibold text-[#47413a] mb-1">
                            <Folder className="w-3.5 h-3.5 text-[#7b5d3a]" />
                            <span>ลิงก์ไฟล์ตัวเต็มใน Google Drive</span>
                          </label>
                          <input
                            type="url"
                            value={masterDriveUrl}
                            onChange={(e) =>
                              onChangeMasterDriveUrl(e.target.value)
                            }
                            placeholder="https://drive.google.com/file/d/MASTER-..."
                            className="w-full px-3 py-1.5 text-xs bg-[#faf7f2] border border-[#e8dfd3] rounded-lg focus:outline-none focus:bg-white focus:border-[#3b6845] text-[#2d2926]"
                          />
                        </div>
                        <div>
                          <label className="flex items-center gap-1.5 text-xs font-semibold text-[#47413a] mb-1">
                            <Video className="w-3.5 h-3.5 text-[#a34c3c]" />
                            <span>ลิงก์ YouTube</span>
                          </label>
                          <input
                            type="url"
                            value={youtubeUrl}
                            onChange={(e) => onChangeYoutubeUrl(e.target.value)}
                            placeholder="https://www.youtube.com/watch?v=..."
                            className="w-full px-3 py-1.5 text-xs bg-[#faf7f2] border border-[#e8dfd3] rounded-lg focus:outline-none focus:bg-white focus:border-[#3b6845] text-[#2d2926]"
                          />
                        </div>
                        <div>
                          <label className="flex items-center gap-1.5 text-xs font-semibold text-[#47413a] mb-1">
                            <Video className="w-3.5 h-3.5 text-[#3b6845]" />
                            <span>ลิงก์ Facebook</span>
                          </label>
                          <input
                            type="url"
                            value={facebookUrl}
                            onChange={(e) =>
                              onChangeFacebookUrl(e.target.value)
                            }
                            placeholder="https://www.facebook.com/..."
                            className="w-full px-3 py-1.5 text-xs bg-[#faf7f2] border border-[#e8dfd3] rounded-lg focus:outline-none focus:bg-white focus:border-[#3b6845] text-[#2d2926]"
                          />
                        </div>
                        <div>
                          <label className="flex items-center gap-1.5 text-xs font-semibold text-[#47413a] mb-1">
                            <Video className="w-3.5 h-3.5 text-[#2563EB]" />
                            <span>ลิงก์ TikTok</span>
                          </label>
                          <input
                            type="url"
                            value={tiktokUrl}
                            onChange={(e) =>
                              onChangeTiktokUrl && onChangeTiktokUrl(e.target.value)
                            }
                            placeholder="https://www.tiktok.com/@juijui.j/video/..."
                            className="w-full px-3 py-1.5 text-xs bg-[#faf7f2] border border-[#e8dfd3] rounded-lg focus:outline-none focus:bg-white focus:border-[#3b6845] text-[#2d2926]"
                          />
                        </div>
                        <div>
                          <label className="flex items-center gap-1.5 text-xs font-semibold text-[#47413a] mb-1">
                            <Video className="w-3.5 h-3.5 text-[#D946EF]" />
                            <span>ลิงก์ Instagram</span>
                          </label>
                          <input
                            type="url"
                            value={instagramUrl}
                            onChange={(e) =>
                              onChangeInstagramUrl && onChangeInstagramUrl(e.target.value)
                            }
                            placeholder="https://www.instagram.com/reel/..."
                            className="w-full px-3 py-1.5 text-xs bg-[#faf7f2] border border-[#e8dfd3] rounded-lg focus:outline-none focus:bg-white focus:border-[#3b6845] text-[#2d2926]"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-[#ede7dc]">
                        <div>
                          <label className="flex items-center gap-1.5 text-xs font-semibold text-[#47413a] mb-1">
                            <Mic className="w-3.5 h-3.5 text-[#b37731]" />
                            <span>บทพากย์มาสคอตเปิดคลิป (Intro)</span>
                          </label>
                          <input
                            type="text"
                            value={introMascotScript}
                            onChange={(e) =>
                              onChangeIntroMascotScript(e.target.value)
                            }
                            className="w-full px-3 py-1.5 text-xs bg-[#faf7f2] border border-[#e8dfd3] rounded-lg focus:outline-none focus:bg-white focus:border-[#3b6845] text-[#2d2926]"
                          />
                        </div>
                        <div>
                          <label className="flex items-center gap-1.5 text-xs font-semibold text-[#47413a] mb-1">
                            <Mic className="w-3.5 h-3.5 text-[#b37731]" />
                            <span>บทพากย์มาสคอตปิดท้ายคลิป (Outro)</span>
                          </label>
                          <input
                            type="text"
                            value={outroMascotScript}
                            onChange={(e) =>
                              onChangeOutroMascotScript(e.target.value)
                            }
                            className="w-full px-3 py-1.5 text-xs bg-[#faf7f2] border border-[#e8dfd3] rounded-lg focus:outline-none focus:bg-white focus:border-[#3b6845] text-[#2d2926]"
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                <div className="text-xs font-semibold text-[#47413a]">
                  สถานะชุดจัดอันดับ:{' '}
                  <span className="font-mono font-bold tabular-nums text-[#2d2926]">
                    {selectedCount}/5 อันดับ
                  </span>
                  {selectedCount < 5 ? (
                    <span className="text-[#a34c3c] ml-2">
                      (ขาดอีก {5 - selectedCount} อันดับ)
                    </span>
                  ) : (
                    <span className="text-[#2b5435] ml-2 inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#3b6845]" />
                      <span>ครบ 5 อันดับ พร้อมบันทึก</span>
                    </span>
                  )}
                </div>

                <motion.button
                  type="submit"
                  whileHover={{ scale: selectedCount === 5 ? 1.02 : 1 }}
                  whileTap={{ scale: selectedCount === 5 ? 0.97 : 1 }}
                  disabled={selectedCount < 5}
                  className="inline-flex items-center justify-center gap-2 px-6 py-2.5 text-xs sm:text-sm font-bold text-white bg-[#3b6845] hover:bg-[#2c5234] disabled:opacity-40 rounded-xl shadow-xs transition-colors whitespace-nowrap cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>บันทึกคลิป 5 อันดับ ({nextEpisodeId})</span>
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.form>
  );
};
