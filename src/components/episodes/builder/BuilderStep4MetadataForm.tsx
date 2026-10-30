import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Check, ChevronDown, ChevronUp, CheckCircle2, Folder, Video, Mic, Plus, Sparkles } from 'lucide-react';
import { PublishSlot } from '../../../types/episode.types';

interface BuilderStep4MetadataFormProps {
  isOpen: boolean;
  onToggle: () => void;
  nextEpisodeId: string;
  selectedCount: number;
  previewMasterFileName: string;
  title: string;
  onChangeTitle: (val: string) => void;
  categoryName?: string;
  subcategoryName?: string;
  categoryEpisodeNo?: number;
  existingCategoryEpisodesCount?: number;
  categoryEpisodeScope?: 'MAIN_CATEGORY' | 'SUBCATEGORY';
  onToggleEpisodeScope?: (scope: 'MAIN_CATEGORY' | 'SUBCATEGORY') => void;
  productionTarget?: 'MAIN_CATEGORY_VARIETY' | 'SINGLE_SUBCATEGORY_SPECIAL';
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
  categoryName,
  subcategoryName,
  categoryEpisodeNo = 1,
  existingCategoryEpisodesCount = 0,
  categoryEpisodeScope = 'MAIN_CATEGORY',
  onToggleEpisodeScope,
  productionTarget = 'MAIN_CATEGORY_VARIETY',
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
            {isOpen ? 'ขั้นที่ 3' : 'ขั้นที่ 3 · ข้อมูลตอน & บันทึก'}
          </span>

          {isOpen ? (
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-[#2d2926]">
                ข้อมูลตอน & ตรวจสอบก่อนบันทึก
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
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-[#554d44] bg-[#f4eee4] hover:bg-[#eae1d4] rounded-xl transition-colors cursor-pointer border border-[#e2d8cb]"
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
                  <span>ลิงก์ Drive / YouTube / FB & บทเปิด-ปิด</span>
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
              {/* Series Category Episode Summary Banner */}
              {categoryName && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 px-3.5 py-2.5 bg-[#edf4ed] border border-[#cfdece] rounded-xl text-xs text-[#244b2f]">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 font-bold rounded-lg bg-white text-[#2b5435] border border-[#bad8b9] flex items-center gap-1 shadow-2xs">
                      <Sparkles className="w-3 h-3 text-[#3b6845]" />
                      <span>
                        ซีรีส์:{' '}
                        {categoryEpisodeScope === 'SUBCATEGORY' && subcategoryName
                          ? subcategoryName
                          : categoryName}
                      </span>
                    </span>
                    <span className="text-[#554d44]">
                      หมวดนี้มีแล้ว <strong className="font-mono text-[#2d2926]">{existingCategoryEpisodesCount}</strong> ตอน ➔ บันทึกเป็น <strong className="text-[#244b2f] font-bold">EP.{categoryEpisodeNo}</strong> ของหมวดนี้
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {productionTarget === 'SINGLE_SUBCATEGORY_SPECIAL' && subcategoryName && onToggleEpisodeScope && (
                      <div className="inline-flex items-center gap-1 p-0.5 bg-white border border-[#cfdece] rounded-lg text-[11px]">
                        <button
                          type="button"
                          onClick={() => onToggleEpisodeScope('MAIN_CATEGORY')}
                          className={`px-2.5 py-0.5 rounded-md font-bold transition-colors cursor-pointer ${
                            categoryEpisodeScope === 'MAIN_CATEGORY'
                              ? 'bg-[#3b6845] text-white shadow-xs'
                              : 'text-[#6b645b] hover:text-[#2d2926]'
                          }`}
                        >
                          หมวดหลัก
                        </button>
                        <button
                          type="button"
                          onClick={() => onToggleEpisodeScope('SUBCATEGORY')}
                          className={`px-2.5 py-0.5 rounded-md font-bold transition-colors cursor-pointer ${
                            categoryEpisodeScope === 'SUBCATEGORY'
                              ? 'bg-[#3b6845] text-white shadow-xs'
                              : 'text-[#6b645b] hover:text-[#2d2926]'
                          }`}
                        >
                          หมวดย่อย
                        </button>
                      </div>
                    )}
                    <span className="text-[11px] font-mono text-[#2b5435] bg-white border border-[#bad8b9] px-2 py-0.5 rounded-md">
                      Global: {nextEpisodeId}
                    </span>
                  </div>
                </div>
              )}

              {/* Core Required Episode Fields */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-[#fdfbf7] border border-[#e8dfd3] rounded-xl p-4">
                <div className="md:col-span-7">
                  <label className="block text-xs font-bold text-[#38332d] mb-1">
                    ชื่อคลิป 5 อันดับ *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => onChangeTitle(e.target.value)}
                    placeholder="เช่น 5 อันดับคนไทยเป็นคนตลก #12..."
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
                            placeholder="https://www.facebook.com/riangrueanglan/videos/..."
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
