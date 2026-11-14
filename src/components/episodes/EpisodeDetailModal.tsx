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
  Play,
  Edit3,
  X,
  Save,
  RefreshCw,
  Lock,
} from 'lucide-react';
import { useCMS } from '../../context/CMSContext';
import { formatThaiDate } from '../../utils/fileNameGenerator';
import { deriveSeriesTitleFromEpisodeTitle } from '../../utils/episodeValidator';
import {
  extractDefaultRankFields,
  resolveSlotScriptValues,
} from '../../utils/episodeScriptGenerator';
import { Modal } from '../ui/Modal';
import { StatusBadge } from '../ui/StatusBadge';
import { TagPill } from '../ui/TagPill';
import { VideoThumbnailPreview } from '../footage/VideoThumbnailPreview';
import { EpisodeHeaderEditor } from './detail/EpisodeHeaderEditor';
import { EpisodeRankingsEditor } from './detail/EpisodeRankingsEditor';
import { EpisodeScriptExporterPanel } from './detail/EpisodeScriptExporterPanel';
import { FootagePickerSubModal } from './detail/FootagePickerSubModal';
import type { EpisodeRankingSlot } from '../../types/episode.types';
import type { RankNumber } from './builder/builder.types';

export const EpisodeDetailModal: React.FC = () => {
  const {
    selectedEpisodeDetailId,
    setSelectedEpisodeDetailId,
    episodes,
    tagMap,
    computedFootageMap,
    settings,
    saveEpisode,
    updateEpisodeMasterInfo,
    setTraceabilityFootageId,
    setPreviewFootageId,
  } = useCMS();

  const episode = episodes.find((e) => e.id === selectedEpisodeDetailId) || null;

  // Edit Mode Toggle
  const [isEditMode, setIsEditMode] = useState(false);

  // Editable fields draft state
  const [draftTitle, setDraftTitle] = useState('');
  const [draftSeriesTitle, setDraftSeriesTitle] = useState('');
  const [draftRankings, setDraftRankings] = useState<EpisodeRankingSlot[]>([]);

  // Sub-modal for picking footage
  const [pickerTargetRank, setPickerTargetRank] = useState<RankNumber | null>(null);

  // External Links state
  const [masterDriveUrl, setMasterDriveUrl] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [facebookUrl, setFacebookUrl] = useState('');
  const [tiktokUrl, setTiktokUrl] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [performanceNote, setPerformanceNote] = useState('');
  const [savedNotice, setSavedNotice] = useState(false);

  // Initialize draft states whenever episode changes or modal opens
  useEffect(() => {
    if (episode) {
      setDraftTitle(episode.title || '');
      setDraftSeriesTitle(episode.seriesTitle || '');
      setDraftRankings(JSON.parse(JSON.stringify(episode.rankings || [])));

      setMasterDriveUrl(episode.masterVideoInfo?.masterDriveUrl || '');
      setYoutubeUrl(episode.masterVideoInfo?.youtubeUrl || '');
      setFacebookUrl(episode.masterVideoInfo?.facebookUrl || '');
      setTiktokUrl(episode.masterVideoInfo?.tiktokUrl || '');
      setInstagramUrl(episode.masterVideoInfo?.instagramUrl || '');
      setPerformanceNote(episode.masterVideoInfo?.performanceNote || '');
      setSavedNotice(false);
      setIsEditMode(false);
      setPickerTargetRank(null);
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
      tiktokUrl: tiktokUrl.trim(),
      instagramUrl: instagramUrl.trim(),
      viewsCount: episode.masterVideoInfo?.viewsCount || 0,
      performanceNote: performanceNote.trim(),
    });
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  const handleSlotChange = (
    rank: RankNumber,
    field:
      | 'rankTitle'
      | 'punchlineNote'
      | 'mascotScript'
      | 'snapshotNote'
      | 'isCustomOverride',
    value: string | boolean
  ) => {
    setDraftRankings((prev) =>
      prev.map((slot) => {
        if (slot.rank !== rank) return slot;
        const ft = slot.footageId ? computedFootageMap[slot.footageId] : null;
        const defaults = extractDefaultRankFields(ft);
        const currentResolved = resolveSlotScriptValues(slot, ft);

        if (field === 'isCustomOverride') {
          const nextCustom = Boolean(value);
          return {
            ...slot,
            isCustomOverride: nextCustom,
            rankTitle: nextCustom
              ? currentResolved.rankTitle
              : defaults.rankTitle,
            punchlineNote: nextCustom
              ? currentResolved.punchlineNote
              : defaults.punchlineNote,
          };
        }

        return { ...slot, [field]: String(value) };
      })
    );
  };

  const handleSelectFootageForRank = (rank: RankNumber, footageId: string) => {
    const pickedFt = computedFootageMap[footageId] || null;
    const defaults = extractDefaultRankFields(pickedFt);
    setDraftRankings((prev) =>
      prev.map((slot) =>
        slot.rank === rank
          ? {
              ...slot,
              footageId,
              isCustomOverride: false,
              rankTitle: defaults.rankTitle,
              punchlineNote: defaults.punchlineNote,
            }
          : slot
      )
    );
  };

  const handleSwapRanks = (rankA: RankNumber, rankB: RankNumber) => {
    setDraftRankings((prev) => {
      const copy = [...prev];
      const idxA = copy.findIndex((s) => s.rank === rankA);
      const idxB = copy.findIndex((s) => s.rank === rankB);
      if (idxA === -1 || idxB === -1) return prev;

      // Swap contents except keep the rank identifier
      const slotA = { ...copy[idxA] };
      const slotB = { ...copy[idxB] };

      copy[idxA] = {
        ...slotB,
        rank: rankA,
      };
      copy[idxB] = {
        ...slotA,
        rank: rankB,
      };
      return copy;
    });
  };

  const handleSaveAllEdits = () => {
    const cleanTitle = draftTitle.trim() || episode.title;
    const cleanSeriesTitle =
      draftSeriesTitle.trim() ||
      deriveSeriesTitleFromEpisodeTitle(cleanTitle, episode.seriesTitle);

    const resolvedDraftRankings = draftRankings.map((slot) => {
      const ft = slot.footageId ? computedFootageMap[slot.footageId] : null;
      const resolved = resolveSlotScriptValues(slot, ft);
      return {
        ...slot,
        isCustomOverride: resolved.isCustomOverride,
        rankTitle: resolved.rankTitle,
        punchlineNote: resolved.punchlineNote,
      };
    });

    saveEpisode({
      ...episode,
      title: cleanTitle,
      seriesTitle: cleanSeriesTitle,
      rankings: resolvedDraftRankings,
    });
    setIsEditMode(false);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  const handleCancelEdits = () => {
    setDraftTitle(episode.title || '');
    setDraftSeriesTitle(episode.seriesTitle || '');
    setDraftRankings(JSON.parse(JSON.stringify(episode.rankings || [])));
    setIsEditMode(false);
  };

  const currentPickingSlot = draftRankings.find(
    (s) => s.rank === pickerTargetRank
  );

  return (
    <>
      <Modal
        isOpen={Boolean(episode)}
        onClose={() => {
          if (isEditMode) {
            handleCancelEdits();
          }
          setSelectedEpisodeDetailId(null);
        }}
        title={
          isEditMode
            ? `แก้ไขส่วนผสมและรายชื่อคลิป 5 อันดับ — ${episode.id}`
            : `รายละเอียดส่วนผสมฟุตเทจ 5 อันดับ — ${episode.id}`
        }
        subtitle={
          isEditMode
            ? 'แก้ไขชื่อคลิปหลัก, ชื่อซีรีส์, รายชื่ออันดับ, คำสร้อย, บทพากย์ และคลิปฟุตเทจในแต่ละอันดับ'
            : 'ตรวจสอบฟุตเทจย่อยทั้ง 5 อันดับที่นำมาประกอบในตอนนี้ สถานะความสด และลิงก์ไฟล์อ้างอิง'
        }
        maxWidthClass="max-w-6xl"
        headerContent={
          <div className="flex items-center gap-2">
            {!isEditMode ? (
              <button
                type="button"
                onClick={() => setIsEditMode(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#FAF2E1] hover:bg-[#F3E5C8] text-[#6E4919] border border-[#DEC190] shadow-2xs transition-all cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5 text-[#8A5A22]" />
                <span>แก้ไขรายละเอียด & ส่วนผสม</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleCancelEdits}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-white hover:bg-[#FAF7F2] text-[#5C5349] border border-[#E2D8C9] transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>ยกเลิก</span>
                </button>
                <button
                  type="button"
                  onClick={handleSaveAllEdits}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#224A2D] hover:bg-[#1A3A23] text-white shadow-2xs transition-colors cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>บันทึกการแก้ไข</span>
                </button>
              </div>
            )}
          </div>
        }
        footer={
          isEditMode ? (
            <div className="flex items-center justify-between w-full text-xs">
              <span className="text-[#6E665E]">
                กด &ldquo;บันทึกการแก้ไข&rdquo; เพื่ออัปเดตข้อมูลคลิปหลักและส่วนผสมฟุตเทจทั้งระบบ
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCancelEdits}
                  className="px-3.5 py-2 rounded-xl bg-white hover:bg-[#FAF7F2] border border-[#E2D8C9] text-[#5C5349] font-bold transition-colors cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={handleSaveAllEdits}
                  className="px-4 py-2 rounded-xl bg-[#224A2D] hover:bg-[#1A3A23] text-white font-bold transition-colors shadow-2xs cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>บันทึกการแก้ไข</span>
                </button>
              </div>
            </div>
          ) : undefined
        }
      >
        <div className="space-y-6">
          {savedNotice && (
            <div className="p-3 bg-[#EEF5EE] border border-[#BAD8BF] rounded-xl text-xs font-bold text-[#1C4824] flex items-center justify-between">
              <span>บันทึกข้อมูลและส่วนผสมของคลิปหลักสำเร็จเรียบร้อยแล้ว!</span>
              <Check className="w-4 h-4 text-[#2E7D32]" />
            </div>
          )}

          {/* EDIT MODE VIEW */}
          {isEditMode ? (
            <div className="space-y-5">
              {/* 1. Header Editor: Title and Series Title */}
              <EpisodeHeaderEditor
                title={draftTitle}
                onChangeTitle={setDraftTitle}
                seriesTitle={draftSeriesTitle}
                onChangeSeriesTitle={setDraftSeriesTitle}
                episode={episode}
                mainTag={tagMap[episode.mainCategoryTagId]}
              />

              {/* 2. Rankings Editor: Rank 5 -> 1 Slots */}
              <EpisodeRankingsEditor
                rankings={draftRankings}
                onChangeSlot={handleSlotChange}
                onOpenFootagePicker={(rank) => setPickerTargetRank(rank)}
                onSwapRanks={handleSwapRanks}
              />
            </div>
          ) : (
            /* NORMAL READ-ONLY VIEW */
            <>
              {/* Episode Header & Footage Utilization Summary */}
              <div className="bg-[#FAF7F2] border border-[#E8DFD3] rounded-2xl p-5 space-y-4 shadow-2xs">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[#5C5349]">
                    <span className="font-mono font-bold text-sm text-[#6B4616] bg-[#F4EEE4] px-2 py-0.5 rounded-lg border border-[#E2D5C3]">
                      {episode.id}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="px-2 py-0.5 rounded-lg bg-[#EBF3EB] text-[#244B2F] border border-[#BBD6B9] font-bold text-xs">
                      {tagMap[episode.mainCategoryTagId]?.name || 'หมวด'} · EP.
                      {episode.categoryEpisodeNo || 1}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">
                      {formatThaiDate(episode.publishDate)}
                    </span>
                    <span aria-hidden="true">·</span>
                    {episode.publishSlot === 'MORNING_0600' ? (
                      <span className="inline-flex items-center gap-1 text-[#8A5A22] font-medium">
                        <Sun className="w-3.5 h-3.5" />
                        <span>รอบเช้า 06:00 น.</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[#23546E] font-medium">
                        <Moon className="w-3.5 h-3.5" />
                        <span>รอบเย็น 18:00 น.</span>
                      </span>
                    )}
                    <span aria-hidden="true">·</span>
                    <TagPill tag={tagMap[episode.mainCategoryTagId]} />
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-[#2D2926]">
                    {episode.title}
                  </h3>
                  {episode.seriesTitle && (
                    <p className="text-xs text-[#787066] mt-0.5">
                      ซีรีส์: <strong className="text-[#6B4616]">{episode.seriesTitle}</strong>
                    </p>
                  )}
                </div>

                {/* Mix Composition Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div className="bg-white border border-[#E8DFD3] rounded-xl p-3 shadow-2xs">
                    <div className="text-xs text-[#787066]">
                      สัดส่วนการผสมฟุตเทจในคลิปนี้
                    </div>
                    <div className="text-sm font-bold font-mono tabular-nums text-[#2D2926] mt-1 flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 text-[#23546E] bg-[#EDF5F8] px-1.5 py-0.5 rounded border border-[#C4DFED] text-xs">
                        <Sparkles className="w-3 h-3 text-[#2E6B8A]" />
                        <span>ใหม่ {newCountInEp}</span>
                      </span>
                      <span className="text-[#D5C7B4]">·</span>
                      <span className="inline-flex items-center gap-1 text-[#244B2F] bg-[#EBF3EB] px-1.5 py-0.5 rounded border border-[#BBD6B9] text-xs">
                        <CheckCircle2 className="w-3 h-3 text-[#386B46]" />
                        <span>วนใช้ {recycledCountInEp}</span>
                      </span>
                    </div>
                  </div>

                  <div className="bg-white border border-[#E8DFD3] rounded-xl p-3 shadow-2xs">
                    <div className="text-xs text-[#787066]">
                      ความคุ้มค่าการใช้ซ้ำข้ามตอน
                    </div>
                    <div className="text-sm font-bold font-mono tabular-nums text-[#244B2F] mt-1 flex items-center gap-1.5">
                      <Repeat className="w-3.5 h-3.5 text-[#386B46] shrink-0" />
                      <span>ใช้ซ้ำหลาย EP {multiUsedCount}/5 ชิ้น</span>
                    </div>
                  </div>

                  <div className="bg-white border border-[#E8DFD3] rounded-xl p-3 flex items-center justify-between gap-2 shadow-2xs">
                    <div className="min-w-0">
                      <div className="text-xs text-[#787066]">
                        ชื่อไฟล์คลิปหลัก (Master File)
                      </div>
                      <div
                        className="text-xs font-mono text-[#2D2926] truncate"
                        title={episode.masterVideoInfo?.masterFileName}
                      >
                        {episode.masterVideoInfo?.masterFileName}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        navigator.clipboard?.writeText(
                          episode.masterVideoInfo?.masterFileName || ''
                        )
                      }
                      className="p-1.5 text-[#787066] hover:text-[#6B4616] hover:bg-[#FAF2E1] rounded-lg cursor-pointer"
                      title="คัดลอกชื่อไฟล์คลิปหลัก"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* 2-Template Script Exporter Panel (Editor Script & Voiceover TTS Script) */}
              <EpisodeScriptExporterPanel
                episode={episode}
                computedFootageMap={computedFootageMap}
                tagMap={tagMap}
              />

              {/* Section 1: Component 5 Footages Breakdown (Rank 5 -> 1) */}
              <section className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-sm font-bold text-[#2D2926] flex items-center gap-2">
                    <Film className="w-4 h-4 text-[#8A5A22]" />
                    <span>
                      01. ส่วนผสมฟุตเทจย่อยทั้ง 5 อันดับในคลิปนี้
                    </span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => setIsEditMode(true)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#785324] hover:underline cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>แก้ไขรายชื่อ/ส่วนผสม</span>
                  </button>
                </div>

                <div className="border border-[#E8DFD3] rounded-2xl overflow-hidden bg-white shadow-2xs">
                  <div className="overflow-x-auto scrollbar-earth">
                    <table className="w-full text-left border-collapse min-w-[850px]">
                      <thead>
                        <tr className="bg-[#FAF7F2] border-b border-[#E8DFD3] text-xs font-semibold text-[#5C5349]">
                          <th className="py-3 px-4 w-24 text-center align-middle">
                            อันดับ
                          </th>
                          <th className="py-3 px-4 w-32 text-center align-middle">
                            ภาพพรีวิว
                          </th>
                          <th className="py-3 px-4 w-32 align-middle">
                            รหัสฟุต
                          </th>
                          <th className="py-3 px-4 min-w-[340px] align-middle">
                            รายละเอียดช็อตฮา & บทพากย์มาสคอต
                          </th>
                          <th className="py-3 px-4 w-48 align-middle">
                            บันทึกตอนผสม
                          </th>
                          <th className="py-3 px-4 w-40 text-center align-middle">
                            สถานะปัจจุบันของฟุต
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#EDE5D8] text-xs">
                        {rankingFootages.map(({ slot, footage }) => {
                          const resolvedSlot = resolveSlotScriptValues(
                            slot,
                            footage
                          );
                          return (
                            <tr
                              key={slot.rank}
                              onClick={() => {
                                if (footage) {
                                  setSelectedEpisodeDetailId(null);
                                  setTraceabilityFootageId(footage.id);
                                }
                              }}
                              className="hover:bg-[#FAF3E6]/50 cursor-pointer transition-colors align-top"
                            >
                              <td className="py-3.5 px-4 font-mono font-bold text-[#2D2926] whitespace-nowrap text-center align-top">
                                <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg bg-[#FAF2E1] text-[#6E4919] border border-[#E6D4B3] text-xs font-mono font-black">
                                  #{slot.rank}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 whitespace-nowrap text-center align-top">
                                {footage ? (
                                  <div
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setPreviewFootageId(footage.id);
                                    }}
                                    className="group/thumb cursor-pointer relative rounded-xl overflow-hidden border border-[#E8DFD3] shadow-2xs hover:border-[#D6BD94] transition-all inline-block"
                                    title="คลิกเพื่อเปิดเล่นวิดีโอตัวเต็ม"
                                  >
                                    <VideoThumbnailPreview
                                      footage={footage}
                                      size="sm"
                                    />
                                  </div>
                                ) : (
                                  <div className="w-20 h-12 bg-[#F5EFE6] rounded-xl border border-[#E8DFD3] flex items-center justify-center text-[10px] text-[#8C8277] font-mono mx-auto">
                                    ไม่มีข้อมูล
                                  </div>
                                )}
                              </td>
                              <td className="py-3.5 px-4 font-mono font-bold text-[#6B4616] whitespace-nowrap align-top">
                                {slot.footageId || '-'}
                              </td>
                              <td className="py-3.5 px-4 align-top">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-bold text-[#2D2926] text-[13px]">
                                    {footage ? footage.title : 'ไม่พบข้อมูลฟุตเทจ'}
                                  </span>
                                  {resolvedSlot.isCustomOverride ? (
                                    <span
                                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#FEF6E8] text-[#7D5622] border border-[#F0DFC8] text-[10px] font-bold"
                                      title="ล็อกคำสร้อย/ชื่อฟุตเฉพาะ EP นี้"
                                    >
                                      <Lock className="w-2.5 h-2.5" />
                                      <span>เฉพาะ EP นี้</span>
                                    </span>
                                  ) : (
                                    <span
                                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#EDF4ED] text-[#244B2F] border border-[#BBD6B9] text-[10px] font-bold"
                                      title="ซิงก์คำสร้อยและชื่อฟุตแบบ Realtime จากตัวฟุตเทจหลัก"
                                    >
                                      <RefreshCw className="w-2.5 h-2.5" />
                                      <span>Realtime</span>
                                    </span>
                                  )}
                                </div>
                                {(resolvedSlot.rankTitle ||
                                  resolvedSlot.punchlineNote) && (
                                  <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                                    {resolvedSlot.rankTitle && (
                                      <span className="px-2 py-0.5 rounded-md bg-[#FAF2E1] text-[#6E4919] border border-[#E6D4B3] font-semibold text-[11px]">
                                        ชื่ออันดับ: {resolvedSlot.rankTitle}
                                      </span>
                                    )}
                                    {resolvedSlot.punchlineNote && (
                                      <span className="px-2 py-0.5 rounded-md bg-[#EBF3EB] text-[#244B2F] border border-[#BBD6B9] font-semibold text-[11px]">
                                        คำสร้อย: &ldquo;{resolvedSlot.punchlineNote}&rdquo;
                                      </span>
                                    )}
                                  </div>
                                )}
                                {slot.mascotScript && (
                                  <div className="text-[#5C5349] mt-1.5 bg-[#FAF7F2] border border-[#EFE8DC] p-2.5 rounded-xl">
                                    <span className="font-semibold text-[#2D2926]">
                                      บทมาสคอต:
                                    </span>{' '}
                                    &ldquo;{slot.mascotScript}&rdquo;
                                  </div>
                                )}
                              </td>
                              <td className="py-3.5 px-4 text-[#6E665E] align-top leading-relaxed">
                                {slot.snapshotNote || '-'}
                              </td>
                              <td className="py-3.5 px-4 text-center align-middle">
                                {footage && (
                                  <div className="inline-block">
                                    <StatusBadge
                                      status={footage.cooldownStatus}
                                      daysSinceLastUse={footage.daysSinceLastUsed}
                                      cooldownDays={settings.cooldownDays}
                                      usageLast90Days={footage.usageLast90Days}
                                      compact
                                    />
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>

              {/* Section 2: Master Video Links Editor */}
              <section className="space-y-3">
                <h4 className="text-sm font-bold text-[#2D2926] flex items-center gap-2">
                  <FolderGit2 className="w-4 h-4 text-[#8A5A22]" />
                  <span>02. ลิงก์ไฟล์คลิปหลักและหมายเหตุการใช้งาน</span>
                </h4>

                <form
                  onSubmit={handleSaveMasterLinks}
                  className="bg-[#FAF7F2] border border-[#E8DFD3] rounded-2xl p-5 space-y-4"
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
                          onChange={(e) => setMasterDriveUrl(e.target.value)}
                          placeholder="https://drive.google.com/file/d/..."
                          className="flex-1 px-3 py-2 text-xs bg-white border border-[#E2D8C9] rounded-xl focus:outline-hidden focus:border-[#C5AB84]"
                        />
                        {masterDriveUrl && (
                          <a
                            href={masterDriveUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 bg-white border border-[#E2D8C9] rounded-xl text-[#5C5349] hover:text-[#6B4616]"
                            title="เปิดไฟล์ใน Google Drive"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#5C5349] mb-1">
                        ลิงก์อ้างอิง YouTube (ถ้ามี)
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="url"
                          value={youtubeUrl}
                          onChange={(e) => setYoutubeUrl(e.target.value)}
                          placeholder="https://www.youtube.com/watch?v=..."
                          className="flex-1 px-3 py-2 text-xs bg-white border border-[#E2D8C9] rounded-xl focus:outline-hidden focus:border-[#C5AB84]"
                        />
                        {youtubeUrl && (
                          <a
                            href={youtubeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 bg-white border border-[#E2D8C9] rounded-xl text-[#5C5349] hover:text-[#6B4616]"
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
                          onChange={(e) => setFacebookUrl(e.target.value)}
                          placeholder="https://www.facebook.com/..."
                          className="flex-1 px-3 py-2 text-xs bg-white border border-[#E2D8C9] rounded-xl focus:outline-hidden focus:border-[#C5AB84]"
                        />
                        {facebookUrl && (
                          <a
                            href={facebookUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 bg-white border border-[#E2D8C9] rounded-xl text-[#5C5349] hover:text-[#6B4616]"
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
                          onChange={(e) => setTiktokUrl(e.target.value)}
                          placeholder="https://www.tiktok.com/@juijui.j/video/..."
                          className="flex-1 px-3 py-2 text-xs bg-white border border-[#E2D8C9] rounded-xl focus:outline-hidden focus:border-[#C5AB84]"
                        />
                        {tiktokUrl && (
                          <a
                            href={tiktokUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 bg-white border border-[#E2D8C9] rounded-xl text-[#5C5349] hover:text-[#6B4616]"
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
                          onChange={(e) => setInstagramUrl(e.target.value)}
                          placeholder="https://www.instagram.com/reel/..."
                          className="flex-1 px-3 py-2 text-xs bg-white border border-[#E2D8C9] rounded-xl focus:outline-hidden focus:border-[#C5AB84]"
                        />
                        {instagramUrl && (
                          <a
                            href={instagramUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 bg-white border border-[#E2D8C9] rounded-xl text-[#5C5349] hover:text-[#6B4616]"
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
                        onChange={(e) => setPerformanceNote(e.target.value)}
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
            </>
          )}
        </div>
      </Modal>

      {/* Sub-modal: Pick or Change Footage for a Rank */}
      {pickerTargetRank !== null && (
        <FootagePickerSubModal
          isOpen={pickerTargetRank !== null}
          onClose={() => setPickerTargetRank(null)}
          targetRank={pickerTargetRank}
          currentFootageId={currentPickingSlot?.footageId || null}
          onSelectFootage={handleSelectFootageForRank}
        />
      )}
    </>
  );
};
