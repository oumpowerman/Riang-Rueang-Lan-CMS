import React, { useState } from 'react';
import {
  Sparkles,
  Layers,
  Hash,
  AlertTriangle,
  Wand2,
  Link2,
  Unlink,
} from 'lucide-react';
import {
  validateEpisodeStandard,
  deriveSeriesTitleFromEpisodeTitle,
} from '../../../utils/episodeValidator';
import {
  DEFAULT_TEMPLATE_OPTIONS,
  formatEpisodeToStandardTemplate,
} from '../../../utils/episodeTemplateStandardizer';
import type { Episode } from '../../../types/episode.types';
import type { CategoryTag } from '../../../types/tag.types';

interface EpisodeHeaderEditorProps {
  title: string;
  onChangeTitle: (val: string) => void;
  seriesTitle: string;
  onChangeSeriesTitle: (val: string) => void;
  episode: Episode;
  mainTag: CategoryTag | undefined;
}

export const EpisodeHeaderEditor: React.FC<EpisodeHeaderEditorProps> = ({
  title,
  onChangeTitle,
  seriesTitle,
  onChangeSeriesTitle,
  episode,
  mainTag,
}) => {
  // Auto-sync seriesTitle from title by default (strip EP.x and hashtags)
  const [isManualSeriesOverride, setIsManualSeriesOverride] = useState(false);

  const currentEpMock: Episode = {
    ...episode,
    title,
    seriesTitle,
  };
  const validation = validateEpisodeStandard(currentEpMock);

  const handleTitleInputChange = (nextTitle: string) => {
    onChangeTitle(nextTitle);
    if (!isManualSeriesOverride) {
      const derived = deriveSeriesTitleFromEpisodeTitle(nextTitle, seriesTitle);
      onChangeSeriesTitle(derived);
    }
  };

  const templatePreview = formatEpisodeToStandardTemplate(
    currentEpMock,
    DEFAULT_TEMPLATE_OPTIONS
  );

  const handleAutoFormatTitle = () => {
    const formattedTitle = validation.suggestedTitle;
    onChangeTitle(formattedTitle);
    const derivedSeries = deriveSeriesTitleFromEpisodeTitle(formattedTitle);
    onChangeSeriesTitle(derivedSeries);
    setIsManualSeriesOverride(false);
  };

  const handleApplyStandardTemplate = () => {
    onChangeTitle(templatePreview.afterTitle);
    onChangeSeriesTitle(templatePreview.afterSeriesTitle);
    setIsManualSeriesOverride(false);
  };

  const handleToggleAutoSync = () => {
    if (isManualSeriesOverride) {
      // Re-enable auto-sync and immediately sync seriesTitle from title
      const derived = deriveSeriesTitleFromEpisodeTitle(title, seriesTitle);
      onChangeSeriesTitle(derived);
      setIsManualSeriesOverride(false);
    } else {
      setIsManualSeriesOverride(true);
    }
  };

  return (
    <div className="bg-[#FAF7F2] border border-[#E8DFD3] rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-2xs">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono font-bold text-xs text-[#6B4616] bg-[#F4EEE4] px-2 py-0.5 rounded-lg border border-[#E2D5C3]">
            {episode.id}
          </span>
          <span className="px-2 py-0.5 rounded-lg bg-[#EBF3EB] text-[#244B2F] border border-[#BBD6B9] font-bold text-xs flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-[#386B46]" />
            <span>
              {mainTag?.name || 'หมวด'} · EP.{episode.categoryEpisodeNo || 1}
            </span>
          </span>
          <span className="text-[#8C8277]">
            รอบเผยแพร่: {episode.publishDate} (
            {episode.publishSlot === 'MORNING_0600' ? 'เช้า 06:00' : 'เย็น 18:00'})
          </span>
        </div>

        <span className="text-[11px] font-semibold text-[#8A5A22] bg-[#FAF2E1] px-2.5 py-0.5 rounded-full border border-[#E6D4B3]">
          โหมดแก้ไขข้อมูลคลิปหลัก
        </span>
      </div>

      {/* Validation Issue Alert Banner in Editor */}
      {!validation.isStandard && (
        <div className="p-3 rounded-xl bg-[#FFF9F2] border border-[#EED7C0] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 text-xs text-[#7A3F17]">
            <AlertTriangle className="w-4 h-4 text-[#B56722] shrink-0" />
            <div>
              <span className="font-bold">คลิปนี้ยังไม่เข้าเกณฑ์มาตรฐาน: </span>
              {validation.hasMissingTitle && <span>ยังไม่ได้ตั้งชื่อ · </span>}
              {validation.hasNon5Rank && (
                <span>ไม่มีคำว่า &ldquo;5 อันดับ&rdquo; ในชื่อ · </span>
              )}
              {validation.hasIncompleteSlots && (
                <span>มีฟุตเทจเพียง {validation.filledSlotCount}/5 ชิ้น</span>
              )}
            </div>
          </div>

          {(validation.hasMissingTitle || validation.hasNon5Rank) && (
            <button
              type="button"
              onClick={handleAutoFormatTitle}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FAF0E1] hover:bg-[#F3E2C8] text-[#7A3F17] border border-[#E8D1B5] text-xs font-bold transition-colors cursor-pointer shrink-0"
              title="เติมคำว่า '5 อันดับ' นำหน้าชื่อและซิงก์ชื่อซีรีส์อัตโนมัติ"
            >
              <Wand2 className="w-3.5 h-3.5 text-[#B56722]" />
              <span>จัดฟอร์แมตเป็น &ldquo;5 อันดับ&rdquo; อัตโนมัติ</span>
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3.5 pt-1">
        {/* Episode Title Input */}
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="text-xs font-bold text-[#2D2926] flex items-center gap-1.5 flex-wrap">
              <Hash className="w-3.5 h-3.5 text-[#8A5A22]" />
              <span>ชื่อคลิปหลัก (Episode Title)</span>
              <span className="text-[11px] text-[#787066] font-normal">
                (เช่น 5 อันดับ มายเมทเนท สุดฮา! EP.12)
              </span>
            </label>

            {templatePreview.needsUpdate && (
              <button
                type="button"
                onClick={handleApplyStandardTemplate}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FAF2E1] hover:bg-[#F3E4C5] text-[#6B4616] border border-[#DFC69E] text-[11px] font-bold transition-colors cursor-pointer"
                title={`ปรับเป็น: ${templatePreview.afterTitle}`}
              >
                <Wand2 className="w-3 h-3 text-[#8A5A22]" />
                <span>จัดตาม Template สุดฮา! EP.n</span>
              </button>
            )}
          </div>
          <input
            type="text"
            value={title}
            onChange={(e) => handleTitleInputChange(e.target.value)}
            placeholder="กรอกชื่อคลิปหลัก..."
            className="w-full px-3.5 py-2 text-xs sm:text-sm font-bold bg-white border border-[#E2D8C9] rounded-xl focus:outline-hidden focus:border-[#C5AB84] focus:ring-2 focus:ring-[#D5C2A5]/30 text-[#2D2926]"
          />
        </div>

        {/* Series Title Input (Auto-Synced by Default) */}
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="text-xs font-bold text-[#2D2926] flex items-center gap-1.5 flex-wrap">
              <Layers className="w-3.5 h-3.5 text-[#386B46]" />
              <span>ชื่อซีรีส์ / รายการหลัก (Series Title)</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border inline-flex items-center gap-1 ${
                  isManualSeriesOverride
                    ? 'bg-[#FAF2E1] text-[#785324] border-[#E6D4B3]'
                    : 'bg-[#EBF3EB] text-[#244B2F] border-[#BBD6B9]'
                }`}
              >
                {isManualSeriesOverride ? (
                  <>
                    <Unlink className="w-2.5 h-2.5" />
                    <span>กำหนดเองแยกอิสระ</span>
                  </>
                ) : (
                  <>
                    <Link2 className="w-2.5 h-2.5" />
                    <span>ซิงก์อัตโนมัติจากชื่อคลิป (ตัดเลข EP ออก)</span>
                  </>
                )}
              </span>
            </label>

            <button
              type="button"
              onClick={handleToggleAutoSync}
              className="text-[11px] font-bold text-[#6B4616] hover:underline cursor-pointer"
            >
              {isManualSeriesOverride
                ? 'เปิดซิงก์อัตโนมัติจากชื่อคลิป'
                : 'แก้ไขชื่อซีรีส์แยกเอง'}
            </button>
          </div>

          <input
            type="text"
            value={seriesTitle}
            disabled={!isManualSeriesOverride}
            onChange={(e) => onChangeSeriesTitle(e.target.value)}
            placeholder="ระบบจะสกัดชื่อซีรีส์ให้อัตโนมัติ (เช่น 5 อันดับ คนไทยเป็นคนตลก)..."
            className={`w-full px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl border transition-colors ${
              isManualSeriesOverride
                ? 'bg-white border-[#E2D8C9] focus:outline-hidden focus:border-[#9EC49C] text-[#2D2926]'
                : 'bg-[#F3EFE8] border-[#E5DDD0] text-[#5C5349] cursor-not-allowed'
            }`}
          />
          <p className="text-[11px] text-[#787066]">
            ระบบใช้ชื่อซีรีส์นี้ในการจัดกลุ่มรายการ &ldquo;5 อันดับ&rdquo; และซิงก์หมวดหมู่กับ YouTube / Kontent OS
          </p>
        </div>
      </div>
    </div>
  );
};
