import React, { useEffect, useState } from 'react';
import { Check, Plus, Scissors, Trash2 } from 'lucide-react';
import { SplitClipDraft, useCMS } from '../../context/CMSContext';
import { SourcePlatform } from '../../types/source.types';
import { generateNextId, generateStandardFileName } from '../../utils/fileNameGenerator';
import { TagSelectorInput } from '../tags/TagSelectorInput';
import { Modal } from '../ui/Modal';
import { TagPill } from '../ui/TagPill';

export const SourceSplitterModal: React.FC = () => {
  const {
    isSourceSplitterModalOpen,
    setIsSourceSplitterModalOpen,
    activeSourceForSplitting,
    sources,
    computedFootage,
    tagMap,
    createSourceWithSplitFootage,
    appendSplitFootageToSource,
  } = useCMS();

  // Source fields (used when creating a brand new SRC-XXXX)
  const [title, setTitle] = useState('');
  const [originalUrl, setOriginalUrl] = useState('');
  const [platform, setPlatform] = useState<SourcePlatform>('FACEBOOK');
  const [channelOrCreator, setChannelOrCreator] = useState('');
  const [totalDuration, setTotalDuration] = useState('01:30:00');
  const [sourceTags, setSourceTags] = useState<string[]>(['TAG-0003']);
  const [notes, setNotes] = useState('');

  // Multi-row Split Clips list
  const [clips, setClips] = useState<SplitClipDraft[]>([
    {
      title: '',
      timestampRange: '05:10 - 05:50',
      tags: [],
      mascotNotes: '',
    },
    {
      title: '',
      timestampRange: '18:20 - 19:00',
      tags: [],
      mascotNotes: '',
    },
  ]);

  useEffect(() => {
    if (activeSourceForSplitting) {
      setClips([
        {
          title: '',
          timestampRange: '02:05:10 - 02:05:50',
          tags: [...activeSourceForSplitting.tags],
          mascotNotes: '',
        },
      ]);
    } else {
      setTitle('');
      setOriginalUrl('');
      setPlatform('FACEBOOK');
      setChannelOrCreator('');
      setTotalDuration('01:30:00');
      setSourceTags(['TAG-0003']);
      setNotes('');
      setClips([
        {
          title: '',
          timestampRange: '05:10 - 05:50',
          tags: [],
          mascotNotes: '',
        },
        {
          title: '',
          timestampRange: '18:20 - 19:00',
          tags: [],
          mascotNotes: '',
        },
      ]);
    }
  }, [activeSourceForSplitting, isSourceSplitterModalOpen]);

  const nextSourceId = generateNextId(
    'SRC',
    sources.map((s) => s.id)
  );

  const baseFootageIdNumber = (() => {
    let max = 0;
    for (const f of computedFootage) {
      const m = f.id.match(/^FT-(\d+)$/);
      if (m) {
        const n = parseInt(m[1], 10);
        if (n > max) max = n;
      }
    }
    return max;
  })();

  const handleAddClipRow = () => {
    setClips((prev) => [
      ...prev,
      {
        title: '',
        timestampRange: '',
        tags: activeSourceForSplitting ? [...activeSourceForSplitting.tags] : [],
        mascotNotes: '',
      },
    ]);
  };

  const handleRemoveClipRow = (index: number) => {
    if (clips.length <= 1) return;
    setClips((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleUpdateClipRow = (index: number, updates: Partial<SplitClipDraft>) => {
    setClips((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, ...updates } : item))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validClips = clips.filter((c) => c.title.trim() !== '');
    if (validClips.length === 0) return;

    if (activeSourceForSplitting) {
      appendSplitFootageToSource(activeSourceForSplitting.id, validClips);
    } else {
      if (!title.trim()) return;
      createSourceWithSplitFootage(
        {
          title,
          originalUrl: originalUrl || 'https://www.facebook.com/watch/live/?v=new_stream',
          platform,
          channelOrCreator,
          totalDuration,
          tags: sourceTags.length > 0 ? sourceTags : ['TAG-0001'],
          notes,
        },
        validClips
      );
    }

    setIsSourceSplitterModalOpen(false);
  };

  return (
    <Modal
      isOpen={isSourceSplitterModalOpen}
      onClose={() => setIsSourceSplitterModalOpen(false)}
      title={
        activeSourceForSplitting
          ? `หั่นช็อตฮาเพิ่มจากต้นฉบับ ${activeSourceForSplitting.id} (ช็อตที่ ${
              activeSourceForSplitting.splitFootageIds.length + 1
            } เป็นต้นไป)`
          : 'หั่นฟุตเทจจากไลฟ์สด / คลิปยาว (Flow B: 1-to-Many Source Splitter)'
      }
      subtitle="สร้างต้นฉบับ SRC-XXXX เพียง 1 ครั้ง แล้วหั่นแยกย่อยออกเป็นหลายฟุต (FT-XXXX) พร้อมระบุ Timestamp และแท็กได้อิสระ"
      maxWidthClass="max-w-5xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Source Header Info */}
        {activeSourceForSplitting ? (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
              <span className="font-mono font-bold text-slate-900">
                ต้นฉบับ: {activeSourceForSplitting.id} ({activeSourceForSplitting.platform})
              </span>
              <span className="font-mono tabular-nums">
                หั่นไปแล้ว {activeSourceForSplitting.splitFootageIds.length} ฟุตเทจ
              </span>
            </div>
            <div className="text-sm font-bold text-slate-900">{activeSourceForSplitting.title}</div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {activeSourceForSplitting.tags.map((tid) => (
                <TagPill key={tid} tag={tagMap[tid]} />
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                ส่วนที่ 1: ข้อมูลคลิปต้นฉบับยาว / ไลฟ์สด ({nextSourceId})
              </h3>
              <span className="text-xs font-mono text-slate-500">1 ต้นฉบับ = หั่นได้ไม่จำกัดฟุต</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-6">
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  ชื่อไลฟ์สด / คลิปต้นฉบับยาว *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="เช่น ไลฟ์สดพี่แจ๊สงานวัด 2 ชม., รวมสัมภาษณ์ชาวบ้านแข่งเรือยาว..."
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900"
                />
              </div>

              <div className="md:col-span-3">
                <label className="block text-xs font-semibold text-slate-800 mb-1">แพลตฟอร์ม</label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value as SourcePlatform)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900"
                >
                  <option value="FACEBOOK">Facebook Live / Video</option>
                  <option value="YOUTUBE">YouTube Long / Live</option>
                  <option value="TIKTOK">TikTok Live Replay</option>
                  <option value="TWITCH">Twitch / Kick Stream</option>
                  <option value="INSTAGRAM">Instagram Live</option>
                  <option value="OTHER">อื่นๆ</option>
                </select>
              </div>

              <div className="md:col-span-3">
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  ความยาวรวมคลิปต้นฉบับ
                </label>
                <input
                  type="text"
                  value={totalDuration}
                  onChange={(e) => setTotalDuration(e.target.value)}
                  placeholder="01:45:00"
                  className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900"
                />
              </div>

              <div className="md:col-span-8">
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  ลิงก์ต้นฉบับ (URL) *
                </label>
                <input
                  type="url"
                  required
                  value={originalUrl}
                  onChange={(e) => setOriginalUrl(e.target.value)}
                  placeholder="https://www.facebook.com/watch/live/?v=..."
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900"
                />
              </div>

              <div className="md:col-span-4">
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  ชื่อช่อง / เจ้าของคลิปต้นทาง
                </label>
                <input
                  type="text"
                  value={channelOrCreator}
                  onChange={(e) => setChannelOrCreator(e.target.value)}
                  placeholder="เช่น Jazz Chuanchuen / ขอบสนามบอลวัด"
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900"
                />
              </div>
            </div>

            <TagSelectorInput
              selectedTagIds={sourceTags}
              onChange={setSourceTags}
              label="แท็กหมวดหมู่หลักของคลิปต้นฉบับนี้ (ฟุตเทจย่อยทุกชิ้นจะได้รับแท็กเหล่านี้อัตโนมัติ)"
            />
          </div>
        )}

        {/* Split Clips Multi-Row Editor */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                ส่วนที่ 2: รายการช็อตฮาที่หั่นแยกออกมาเป็นฟุตเทจย่อย (FT-XXXX)
              </h3>
              <p className="text-xs text-slate-500">
                ระบุช่วงเวลา Timestamp และรายละเอียดแต่ละช็อต ระบบจะตั้งชื่อไฟล์มาตรฐาน Google Drive ให้อัตโนมัติ
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddClipRow}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>เพิ่มช็อตที่หั่น (+1 ฟุตเทจ)</span>
            </button>
          </div>

          <div className="space-y-3">
            {clips.map((clip, idx) => {
              const previewFtId = `FT-${String(baseFootageIdNumber + idx + 1).padStart(4, '0')}`;
              const previewFile = generateStandardFileName(
                previewFtId,
                clip.title || `ช็อตที่_${idx + 1}`
              );
              const shotOrderNum = activeSourceForSplitting
                ? activeSourceForSplitting.splitFootageIds.length + idx + 1
                : idx + 1;

              return (
                <div
                  key={idx}
                  className="bg-white border border-slate-200 rounded-xl p-4 space-y-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-mono font-bold text-indigo-700">
                        ช็อตที่ #{shotOrderNum} → {previewFtId}
                      </span>
                      <span aria-hidden="true" className="text-slate-300">
                        ·
                      </span>
                      <span className="font-mono text-slate-500 truncate max-w-md">
                        {previewFile}
                      </span>
                    </div>

                    {clips.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveClipRow(idx)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                        title="ลบช็อตนี้"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                    <div className="md:col-span-3">
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        ช่วงเวลา Timestamp *
                      </label>
                      <input
                        type="text"
                        required
                        value={clip.timestampRange}
                        onChange={(e) =>
                          handleUpdateClipRow(idx, { timestampRange: e.target.value })
                        }
                        placeholder="เช่น 14:20 - 15:05"
                        className="w-full px-3 py-1.5 text-xs font-mono tabular-nums bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-slate-900"
                      />
                    </div>

                    <div className="md:col-span-5">
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        รายละเอียดช็อตฮา (Title ของฟุตเทจนี้) *
                      </label>
                      <input
                        type="text"
                        required
                        value={clip.title}
                        onChange={(e) => handleUpdateClipRow(idx, { title: e.target.value })}
                        placeholder="เช่น จังหวะไมค์ดับตอนท่อนฮุก, กรรมการวิ่งชนนักเตะ..."
                        className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-slate-900"
                      />
                    </div>

                    <div className="md:col-span-4">
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        ไกด์มุกมาสคอตเชื่อมเรื่อง
                      </label>
                      <input
                        type="text"
                        value={clip.mascotNotes}
                        onChange={(e) =>
                          handleUpdateClipRow(idx, { mascotNotes: e.target.value })
                        }
                        placeholder="ประโยคตบมุกสำหรับช็อตนี้..."
                        className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-slate-900"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={handleAddClipRow}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>เพิ่มแถวหั่นฟุตเทจอีกช็อต</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsSourceSplitterModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap"
            >
              <Scissors className="w-4 h-4" />
              <span>
                บันทึกการหั่นฟุตเทจ ({clips.filter((c) => c.title.trim()).length} ฟุต)
              </span>
              <Check className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
