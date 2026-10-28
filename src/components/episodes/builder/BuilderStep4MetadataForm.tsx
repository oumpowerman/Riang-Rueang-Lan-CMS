import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Check, ChevronDown, ChevronUp, CheckCircle2, Folder, Video, Mic, Plus } from 'lucide-react';
import { PublishSlot } from '../../../types/episode.types';

interface BuilderStep4MetadataFormProps {
  isOpen: boolean;
  onToggle: () => void;
  nextEpisodeId: string;
  selectedCount: number;
  previewMasterFileName: string;
  title: string;
  onChangeTitle: (val: string) => void;
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
          ? 'border-amber-200/90 bg-amber-50/40'
          : 'border-slate-200 bg-white shadow-2xs hover:border-amber-200'
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
                ? 'bg-amber-500 text-slate-950'
                : 'bg-amber-100 text-amber-950'
            }`}
          >
            {isOpen ? 'ขั้นที่ 4' : 'ขั้นที่ 4 · ตรวจสอบชื่อ & บันทึก'}
          </span>

          {isOpen ? (
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-slate-900">
                ตรวจสอบชื่อคลิป & กดบันทึกเข้าคลัง
              </h2>
              <p className="text-[11px] font-mono text-slate-500 truncate">
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
              <span className="font-bold text-slate-900 truncate max-w-md">
                {title || 'ยังไม่ได้ระบุชื่อคลิป'}
              </span>
              <span className="text-slate-400">·</span>
              <span className="font-mono tabular-nums text-slate-600">
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
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:border-slate-400 rounded-xl transition-colors cursor-pointer"
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
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              selectedCount === 5
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
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
              {/* Core Required Episode Fields in One Clean Row */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-white border border-amber-200/80 rounded-xl p-4">
                <div className="md:col-span-7">
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    ชื่อคลิป 5 อันดับ *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => onChangeTitle(e.target.value)}
                    placeholder="เช่น 5 อันดับคนไทยเป็นคนตลก #12..."
                    className="w-full px-3 py-2 text-xs sm:text-sm font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-indigo-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    วันที่คิวโพสต์
                  </label>
                  <input
                    type="date"
                    value={publishDate}
                    onChange={(e) => onChangePublishDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono tabular-nums bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-indigo-500"
                  />
                </div>

                <div className="md:col-span-3">
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    รอบเวลาอ้างอิง
                  </label>
                  <select
                    value={publishSlot}
                    onChange={(e) =>
                      onChangePublishSlot(e.target.value as PublishSlot)
                    }
                    className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-indigo-500"
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
                    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1">
                            <Folder className="w-3.5 h-3.5 text-indigo-600" />
                            <span>ลิงก์ไฟล์ตัวเต็มใน Google Drive</span>
                          </label>
                          <input
                            type="url"
                            value={masterDriveUrl}
                            onChange={(e) =>
                              onChangeMasterDriveUrl(e.target.value)
                            }
                            placeholder="https://drive.google.com/file/d/MASTER-..."
                            className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-slate-900"
                          />
                        </div>
                        <div>
                          <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1">
                            <Video className="w-3.5 h-3.5 text-rose-600" />
                            <span>ลิงก์ YouTube</span>
                          </label>
                          <input
                            type="url"
                            value={youtubeUrl}
                            onChange={(e) => onChangeYoutubeUrl(e.target.value)}
                            placeholder="https://www.youtube.com/watch?v=..."
                            className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-slate-900"
                          />
                        </div>
                        <div>
                          <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1">
                            <Video className="w-3.5 h-3.5 text-sky-600" />
                            <span>ลิงก์ Facebook</span>
                          </label>
                          <input
                            type="url"
                            value={facebookUrl}
                            onChange={(e) =>
                              onChangeFacebookUrl(e.target.value)
                            }
                            placeholder="https://www.facebook.com/riangrueanglan/videos/..."
                            className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-slate-900"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                        <div>
                          <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1">
                            <Mic className="w-3.5 h-3.5 text-amber-600" />
                            <span>บทพากย์มาสคอตเปิดคลิป (Intro)</span>
                          </label>
                          <input
                            type="text"
                            value={introMascotScript}
                            onChange={(e) =>
                              onChangeIntroMascotScript(e.target.value)
                            }
                            className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-slate-900"
                          />
                        </div>
                        <div>
                          <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1">
                            <Mic className="w-3.5 h-3.5 text-amber-600" />
                            <span>บทพากย์มาสคอตปิดท้ายคลิป (Outro)</span>
                          </label>
                          <input
                            type="text"
                            value={outroMascotScript}
                            onChange={(e) =>
                              onChangeOutroMascotScript(e.target.value)
                            }
                            className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-slate-900"
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                <div className="text-xs font-semibold text-slate-700">
                  สถานะชุดจัดอันดับ:{' '}
                  <span className="font-mono font-bold tabular-nums text-slate-900">
                    {selectedCount}/5 อันดับ
                  </span>
                  {selectedCount < 5 ? (
                    <span className="text-rose-600 ml-2">
                      (ขาดอีก {5 - selectedCount} อันดับ)
                    </span>
                  ) : (
                    <span className="text-emerald-700 ml-2 inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>ครบ 5 อันดับ พร้อมบันทึก</span>
                    </span>
                  )}
                </div>

                <motion.button
                  type="submit"
                  whileHover={{ scale: selectedCount === 5 ? 1.02 : 1 }}
                  whileTap={{ scale: selectedCount === 5 ? 0.97 : 1 }}
                  disabled={selectedCount < 5}
                  className="inline-flex items-center justify-center gap-2 px-6 py-2.5 text-xs sm:text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 rounded-xl shadow-xs transition-colors whitespace-nowrap cursor-pointer"
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
