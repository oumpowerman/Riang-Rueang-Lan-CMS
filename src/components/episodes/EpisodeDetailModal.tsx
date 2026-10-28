import React, { useEffect, useState } from 'react';
import {
  Check,
  Copy,
  ExternalLink,
  Film,
  FolderGit2,
  Moon,
  Sun,
  Sparkles,
  CheckCircle2,
  Repeat,
} from 'lucide-react';
import { useCMS } from '../../context/CMSContext';
import { formatThaiDate } from '../../utils/fileNameGenerator';
import { Modal } from '../ui/Modal';
import { StatusBadge } from '../ui/StatusBadge';
import { TagPill } from '../ui/TagPill';

export const EpisodeDetailModal: React.FC = () => {
  const {
    selectedEpisodeDetailId,
    setSelectedEpisodeDetailId,
    episodes,
    tagMap,
    computedFootageMap,
    settings,
    updateEpisodeMasterInfo,
    setTraceabilityFootageId,
  } = useCMS();

  const episode = episodes.find((e) => e.id === selectedEpisodeDetailId) || null;

  const [masterDriveUrl, setMasterDriveUrl] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [facebookUrl, setFacebookUrl] = useState('');
  const [performanceNote, setPerformanceNote] = useState('');
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    if (episode) {
      setMasterDriveUrl(episode.masterVideoInfo.masterDriveUrl);
      setYoutubeUrl(episode.masterVideoInfo.youtubeUrl);
      setFacebookUrl(episode.masterVideoInfo.facebookUrl);
      setPerformanceNote(episode.masterVideoInfo.performanceNote);
      setSavedNotice(false);
    }
  }, [episode]);

  if (!episode) return null;

  const rankingFootages = episode.rankings.map((slot) => ({
    slot,
    footage: slot.footageId ? computedFootageMap[slot.footageId] || null : null,
  }));

  // Calculate how many footages in this episode were brand new vs recycled
  const newCountInEp = rankingFootages.filter(
    (item) =>
      (item.slot.snapshotNote || '').includes('ใหม่') ||
      (item.footage && item.footage.totalUsageCount <= 1)
  ).length;
  const recycledCountInEp = 5 - newCountInEp;

  // Calculate how many footages in this episode have been reused in multiple episodes
  const multiUsedCount = rankingFootages.filter(
    (item) => item.footage && item.footage.totalUsageCount >= 2
  ).length;

  const handleSaveMasterLinks = (e: React.FormEvent) => {
    e.preventDefault();
    updateEpisodeMasterInfo(episode.id, {
      masterDriveUrl: masterDriveUrl.trim(),
      youtubeUrl: youtubeUrl.trim(),
      facebookUrl: facebookUrl.trim(),
      viewsCount: episode.masterVideoInfo.viewsCount || 0,
      performanceNote: performanceNote.trim(),
    });
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  return (
    <Modal
      isOpen={Boolean(episode)}
      onClose={() => setSelectedEpisodeDetailId(null)}
      title={`รายละเอียดส่วนผสมฟุตเทจ 5 อันดับ — ${episode.id}`}
      subtitle="ตรวจสอบฟุตเทจย่อยทั้ง 5 อันดับที่นำมาประกอบในตอนนี้ สถานะความสด และลิงก์ไฟล์อ้างอิง"
      maxWidthClass="max-w-4xl"
    >
      <div className="space-y-6">
        {/* Episode Header & Footage Utilization Summary */}
        <div className="bg-indigo-50/50 border border-indigo-200/80 rounded-xl p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
              <span className="font-mono font-bold text-sm text-indigo-700">{episode.id}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">
                {formatThaiDate(episode.publishDate)}
              </span>
              <span aria-hidden="true">·</span>
              {episode.publishSlot === 'MORNING_0600' ? (
                <span className="inline-flex items-center gap-1 text-amber-700 font-medium">
                  <Sun className="w-3.5 h-3.5" />
                  <span>รอบเช้า 06:00 น.</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-indigo-700 font-medium">
                  <Moon className="w-3.5 h-3.5" />
                  <span>รอบเย็น 18:00 น.</span>
                </span>
              )}
              <span aria-hidden="true">·</span>
              <TagPill tag={tagMap[episode.mainCategoryTagId]} />
            </div>
          </div>

          <h3 className="text-lg font-bold text-slate-900">{episode.title}</h3>

          {/* Mix Composition Summary (Focused 100% on Footage Reuse & Value) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div className="bg-white border border-slate-200/90 rounded-lg p-3">
              <div className="text-xs text-slate-500">สัดส่วนการผสมฟุตเทจในคลิปนี้</div>
              <div className="text-sm font-bold font-mono tabular-nums text-slate-900 mt-1 flex items-center gap-2">
                <span className="inline-flex items-center gap-1 text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200 text-xs">
                  <Sparkles className="w-3 h-3 text-sky-600" />
                  <span>ใหม่ {newCountInEp}</span>
                </span>
                <span className="text-slate-300">·</span>
                <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 text-xs">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>วนใช้ {recycledCountInEp}</span>
                </span>
              </div>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-lg p-3">
              <div className="text-xs text-slate-500">ความคุ้มค่าการใช้ซ้ำข้ามตอน</div>
              <div className="text-sm font-bold font-mono tabular-nums text-emerald-700 mt-1 flex items-center gap-1.5">
                <Repeat className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>ใช้ซ้ำหลาย EP {multiUsedCount}/5 ชิ้น</span>
              </div>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-lg p-3 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="text-xs text-slate-500">ชื่อไฟล์คลิปหลัก (Master File)</div>
                <div
                  className="text-xs font-mono text-slate-900 truncate"
                  title={episode.masterVideoInfo.masterFileName}
                >
                  {episode.masterVideoInfo.masterFileName}
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  navigator.clipboard?.writeText(episode.masterVideoInfo.masterFileName)
                }
                className="p-1.5 text-slate-500 hover:text-indigo-700 hover:bg-indigo-50 rounded cursor-pointer"
                title="คัดลอกชื่อไฟล์คลิปหลัก"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Section 1: Component 5 Footages Breakdown (Rank 5 -> 1) */}
        <section className="space-y-3">
          <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Film className="w-4 h-4 text-indigo-600" />
            <span>
              01. ส่วนผสมฟุตเทจย่อยทั้ง 5 อันดับในคลิปนี้ (คลิกที่แถวเพื่อดูประวัติการใช้ซ้ำของฟุตแต่ละตัว)
            </span>
          </h4>

          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                  <th className="py-2.5 px-4">อันดับ</th>
                  <th className="py-2.5 px-4">รหัสฟุต</th>
                  <th className="py-2.5 px-4">รายละเอียดช็อตฮา & บทพากย์มาสคอต</th>
                  <th className="py-2.5 px-4">บันทึกตอนผสม</th>
                  <th className="py-2.5 px-4">สถานะปัจจุบันของฟุต</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {rankingFootages.map(({ slot, footage }) => (
                  <tr
                    key={slot.rank}
                    onClick={() => {
                      if (footage) {
                        setSelectedEpisodeDetailId(null);
                        setTraceabilityFootageId(footage.id);
                      }
                    }}
                    className="hover:bg-indigo-50/40 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                      อันดับ {slot.rank}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-indigo-700 whitespace-nowrap">
                      {slot.footageId || '-'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">
                        {footage ? footage.title : 'ไม่พบข้อมูลฟุตเทจ'}
                      </div>
                      <div className="text-slate-500 mt-0.5">
                        บทมาสคอต: &ldquo;{slot.mascotScript}&rdquo;
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                      {slot.snapshotNote || '-'}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {footage && (
                        <StatusBadge
                          status={footage.cooldownStatus}
                          daysSinceLastUse={footage.daysSinceLastUsed}
                          cooldownDays={settings.cooldownDays}
                          usageLast90Days={footage.usageLast90Days}
                          compact
                        />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Section 2: Master Video Links Editor */}
        <section className="space-y-3">
          <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <FolderGit2 className="w-4 h-4 text-indigo-600" />
            <span>
              02. ลิงก์ไฟล์คลิปหลักและหมายเหตุการใช้งาน
            </span>
          </h4>

          <form
            onSubmit={handleSaveMasterLinks}
            className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ลิงก์ไฟล์วิดีโอตัวเต็มใน Google Drive (รวม 5 ฟุต + มาสคอต)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    value={masterDriveUrl}
                    onChange={(e) => setMasterDriveUrl(e.target.value)}
                    placeholder="https://drive.google.com/file/d/..."
                    className="flex-1 px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                  />
                  {masterDriveUrl && (
                    <a
                      href={masterDriveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-white border border-slate-200 rounded-lg text-slate-700 hover:text-indigo-700"
                      title="เปิดไฟล์ใน Google Drive"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ลิงก์อ้างอิง YouTube (ถ้ามี)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="flex-1 px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                  />
                  {youtubeUrl && (
                    <a
                      href={youtubeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-white border border-slate-200 rounded-lg text-slate-700 hover:text-indigo-700"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ลิงก์อ้างอิง Facebook (ถ้ามี)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    value={facebookUrl}
                    onChange={(e) => setFacebookUrl(e.target.value)}
                    placeholder="https://www.facebook.com/riangrueanglan/videos/..."
                    className="flex-1 px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                  />
                  {facebookUrl && (
                    <a
                      href={facebookUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-white border border-slate-200 rounded-lg text-slate-700 hover:text-indigo-700"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  บันทึกหมายเหตุการคัดเลือกฟุตเทจของตอนนี้
                </label>
                <input
                  type="text"
                  value={performanceNote}
                  onChange={(e) => setPerformanceNote(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              {savedNotice && (
                <span className="text-xs font-semibold text-emerald-700">
                  บันทึกข้อมูลไฟล์และลิงก์สำเร็จแล้ว!
                </span>
              )}
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors cursor-pointer shadow-xs"
              >
                <Check className="w-3.5 h-3.5" />
                <span>อัปเดตข้อมูลไฟล์ตัวเต็ม & ลิงก์อ้างอิง</span>
              </button>
            </div>
          </form>
        </section>
      </div>
    </Modal>
  );
};
