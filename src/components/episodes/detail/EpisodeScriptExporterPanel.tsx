import React, { useEffect, useMemo, useState } from 'react';
import {
  Check,
  Copy,
  Download,
  FileText,
  Mic,
  Scissors,
  Sparkles,
  RotateCcw,
} from 'lucide-react';
import { Episode } from '../../../types/episode.types';
import { ComputedFootage } from '../../../types/footage.types';
import { CategoryTag } from '../../../types/tag.types';
import {
  buildEpisodeSeriesHeader,
  downloadScriptTextFile,
  formatThaiShortDateDDMMYY,
  generateEditorTemplateScript,
  generateVoiceoverTemplateScript,
} from '../../../utils/episodeScriptGenerator';

export type ScriptTemplateMode = 'EDITOR_SCRIPT' | 'VOICEOVER_TTS';

interface EpisodeScriptExporterPanelProps {
  episode: Episode;
  computedFootageMap: Record<string, ComputedFootage>;
  tagMap: Record<string, CategoryTag>;
  compact?: boolean;
}

export const EpisodeScriptExporterPanel: React.FC<
  EpisodeScriptExporterPanelProps
> = ({ episode, computedFootageMap, tagMap, compact = false }) => {
  const [activeMode, setActiveMode] =
    useState<ScriptTemplateMode>('EDITOR_SCRIPT');
  const [copiedMode, setCopiedMode] = useState<ScriptTemplateMode | null>(null);
  const [downloadedNotice, setDownloadedNotice] = useState<string | null>(null);

  const shortDate = useMemo(
    () => formatThaiShortDateDDMMYY(episode.publishDate),
    [episode.publishDate]
  );

  const seriesHeader = useMemo(
    () => buildEpisodeSeriesHeader(episode, tagMap),
    [episode, tagMap]
  );

  const autoEditorScript = useMemo(
    () => generateEditorTemplateScript(episode, computedFootageMap, tagMap),
    [episode, computedFootageMap, tagMap]
  );

  const autoVoiceoverScript = useMemo(
    () => generateVoiceoverTemplateScript(episode, computedFootageMap, tagMap),
    [episode, computedFootageMap, tagMap]
  );

  const [customEditorScript, setCustomEditorScript] =
    useState(autoEditorScript);
  const [customVoiceoverScript, setCustomVoiceoverScript] =
    useState(autoVoiceoverScript);

  useEffect(() => {
    setCustomEditorScript(autoEditorScript);
  }, [autoEditorScript]);

  useEffect(() => {
    setCustomVoiceoverScript(autoVoiceoverScript);
  }, [autoVoiceoverScript]);

  const currentScriptText =
    activeMode === 'EDITOR_SCRIPT' ? customEditorScript : customVoiceoverScript;

  const isEdited =
    activeMode === 'EDITOR_SCRIPT'
      ? customEditorScript !== autoEditorScript
      : customVoiceoverScript !== autoVoiceoverScript;

  const epNo = episode.categoryEpisodeNo || 1;
  const editorFileName = `Template_Script_${shortDate}_EP${epNo}.txt`;
  const voiceoverFileName = `สคริปต์ ${shortDate} .txt`;
  const currentFileName =
    activeMode === 'EDITOR_SCRIPT' ? editorFileName : voiceoverFileName;

  const handleCopyCurrent = () => {
    navigator.clipboard?.writeText(currentScriptText);
    setCopiedMode(activeMode);
    setTimeout(() => setCopiedMode(null), 1800);
  };

  const handleDownloadCurrent = () => {
    downloadScriptTextFile(currentFileName, currentScriptText);
    setDownloadedNotice(
      activeMode === 'EDITOR_SCRIPT'
        ? 'ดาวน์โหลดไฟล์สคริปต์ตัดต่อ (.txt) แล้ว'
        : 'ดาวน์โหลดไฟล์สคริปต์เจนเสียง (.txt) แล้ว'
    );
    setTimeout(() => setDownloadedNotice(null), 2200);
  };

  const handleDownloadBoth = () => {
    downloadScriptTextFile(editorFileName, customEditorScript);
    setTimeout(() => {
      downloadScriptTextFile(voiceoverFileName, customVoiceoverScript);
    }, 180);
    setDownloadedNotice('ดาวน์โหลดสคริปต์ครบทั้ง 2 รูปแบบ (.txt) เรียบร้อยแล้ว');
    setTimeout(() => setDownloadedNotice(null), 2500);
  };

  const handleResetToAuto = () => {
    if (activeMode === 'EDITOR_SCRIPT') {
      setCustomEditorScript(autoEditorScript);
    } else {
      setCustomVoiceoverScript(autoVoiceoverScript);
    }
  };

  return (
    <div className="bg-[#FAF8F5] border border-[#E2D8C9] rounded-2xl p-3.5 sm:p-4 space-y-3 shadow-2xs">
      {/* Header & Both Download Action */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-[#EAE0D2]">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-xl bg-[#EDF4ED] border border-[#C6DEC5] text-[#2B5435] flex items-center justify-center shrink-0">
            <FileText className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs sm:text-sm font-extrabold text-[#2D2926] flex items-center gap-1.5">
              <span>ส่งออกสคริปต์ 5 อันดับ (เลือกใช้งาน 2 รูปแบบ)</span>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-[#E2D8C9] text-[10px] font-mono text-[#5E554B]">
                <Sparkles className="w-2.5 h-2.5 text-[#8A5A22]" />
                <span>{seriesHeader}</span>
              </span>
            </h4>
            <p className="text-[11px] text-[#787066] truncate">
              ระบบดึงชื่อซีรีส์ ชื่อฟุต และคำสร้อยเรียงจากอันดับ 5 ➔ 1 ให้อัตโนมัติ (แก้ไขข้อความในกล่องก่อนโหลดได้)
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleDownloadBoth}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-[#F3EDE2] text-[#3D332A] border border-[#D8C9B8] text-xs font-bold transition-colors cursor-pointer shadow-2xs shrink-0"
          title="ดาวน์โหลดไฟล์ .txt ทั้งสำหรับตัดต่อและสำหรับเจนเสียงพร้อมกัน"
        >
          <Download className="w-3.5 h-3.5 text-[#3B6845]" />
          <span>โหลดทั้ง 2 ไฟล์ (.txt)</span>
        </button>
      </div>

      {/* Mode Selector Tabs (2 Templates) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setActiveMode('EDITOR_SCRIPT')}
          className={`flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl border text-left transition-all cursor-pointer ${
            activeMode === 'EDITOR_SCRIPT'
              ? 'bg-white border-[#3B6845] ring-2 ring-[#3B6845]/15 text-[#244B2F] shadow-2xs'
              : 'bg-[#F4EFE6]/70 hover:bg-white border-[#E2D8C9] text-[#5C5349]'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                activeMode === 'EDITOR_SCRIPT'
                  ? 'bg-[#EDF4ED] text-[#2B5435]'
                  : 'bg-[#EAE2D6] text-[#6E6459]'
              }`}
            >
              <Scissors className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-extrabold truncate">
                1. สคริปต์สำหรับทีมตัดต่อ
              </div>
              <div className="text-[11px] opacity-80 truncate font-mono">
                Template Script.txt (มีหัวข้อ = ชื่อฟุต & คำสร้อย)
              </div>
            </div>
          </div>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0 ${
              activeMode === 'EDITOR_SCRIPT'
                ? 'bg-[#3B6845] text-white'
                : 'bg-white/80 text-[#787066]'
            }`}
          >
            ทีมตัดต่อ
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveMode('VOICEOVER_TTS')}
          className={`flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl border text-left transition-all cursor-pointer ${
            activeMode === 'VOICEOVER_TTS'
              ? 'bg-white border-[#8A5A22] ring-2 ring-[#8A5A22]/15 text-[#6B4415] shadow-2xs'
              : 'bg-[#F4EFE6]/70 hover:bg-white border-[#E2D8C9] text-[#5C5349]'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                activeMode === 'VOICEOVER_TTS'
                  ? 'bg-[#FEF6E8] text-[#8A5A22]'
                  : 'bg-[#EAE2D6] text-[#6E6459]'
              }`}
            >
              <Mic className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-extrabold truncate">
                2. สคริปต์สำหรับเจนเสียง
              </div>
              <div className="text-[11px] opacity-80 truncate font-mono">
                สคริปต์ {shortDate} .txt (เรียงบรรทัดพร้อมอ่าน)
              </div>
            </div>
          </div>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0 ${
              activeMode === 'VOICEOVER_TTS'
                ? 'bg-[#8A5A22] text-white'
                : 'bg-white/80 text-[#787066]'
            }`}
          >
            เจนเสียง
          </span>
        </button>
      </div>

      {/* Editable Script Preview Box */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2 text-[11px] text-[#6E6459]">
          <span className="font-mono font-semibold truncate">
            ชื่อไฟล์ที่จะบันทึก: <strong className="text-[#2D2926]">{currentFileName}</strong>
          </span>
          {isEdited && (
            <button
              type="button"
              onClick={handleResetToAuto}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-[#8A5A22] hover:underline cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>รีเซ็ตกลับเป็นคำอัตโนมัติ</span>
            </button>
          )}
        </div>

        <textarea
          rows={compact ? 8 : 11}
          value={currentScriptText}
          onChange={(e) => {
            if (activeMode === 'EDITOR_SCRIPT') {
              setCustomEditorScript(e.target.value);
            } else {
              setCustomVoiceoverScript(e.target.value);
            }
          }}
          className="w-full p-3 rounded-xl bg-white border border-[#DED3C5] text-xs font-mono text-[#2D2926] leading-relaxed focus:outline-none focus:border-[#3B6845] resize-y"
          spellCheck={false}
        />
      </div>

      {/* Action Footer: Copy & Download .txt */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <div className="text-[11px] text-[#6E6459]">
          {downloadedNotice ? (
            <span className="inline-flex items-center gap-1 font-bold text-[#2B5435]">
              <Check className="w-3.5 h-3.5 text-[#3B6845]" />
              <span>{downloadedNotice}</span>
            </span>
          ) : (
            <span>
              * บรรทัดแรกเว้นท้ายหลังวันที่ ({shortDate}) ไว้ให้เติมชื่อคนตัดต่อได้ทันที
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={handleCopyCurrent}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-[#F3EDE2] text-[#3D332A] border border-[#D8C9B8] text-xs font-bold transition-colors cursor-pointer shadow-2xs"
          >
            {copiedMode === activeMode ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-800">คัดลอกสคริปต์แล้ว!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-[#6E6459]" />
                <span>
                  คัดลอก{activeMode === 'EDITOR_SCRIPT' ? 'สคริปต์ตัดต่อ' : 'สคริปต์เจนเสียง'}
                </span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleDownloadCurrent}
            className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-white text-xs font-bold transition-colors cursor-pointer shadow-xs ${
              activeMode === 'EDITOR_SCRIPT'
                ? 'bg-[#3B6845] hover:bg-[#2C5234]'
                : 'bg-[#8A5A22] hover:bg-[#6E4518]'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>
              ดาวน์โหลดไฟล์ .txt ({activeMode === 'EDITOR_SCRIPT' ? 'สำหรับตัดต่อ' : 'สำหรับเจนเสียง'})
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
