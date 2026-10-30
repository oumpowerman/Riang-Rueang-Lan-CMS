import React from 'react';
import { Link2, Clock, User, Clipboard, ArrowRight, FileText, Check } from 'lucide-react';
import { SourcePlatform } from '../../../types/source.types';
import { detectPlatformFromUrl } from '../../../utils/platformDetector';
import { PlatformIcon } from '../../footage/directModal/PlatformIcons';
import { TagSelectorInput } from '../../tags/TagSelectorInput';

interface SourceStepInfoProps {
  title: string;
  setTitle: (val: string) => void;
  originalUrl: string;
  setOriginalUrl: (val: string) => void;
  platform: SourcePlatform;
  setPlatform: (val: SourcePlatform) => void;
  channelOrCreator: string;
  setChannelOrCreator: (val: string) => void;
  totalDuration: string;
  setTotalDuration: (val: string) => void;
  sourceTags: string[];
  setSourceTags: (tags: string[]) => void;
  isExistingSource: boolean;
  onNext: () => void;
}

export const SourceStepInfo: React.FC<SourceStepInfoProps> = ({
  title,
  setTitle,
  originalUrl,
  setOriginalUrl,
  platform,
  setPlatform,
  channelOrCreator,
  setChannelOrCreator,
  totalDuration,
  setTotalDuration,
  sourceTags,
  setSourceTags,
  isExistingSource,
  onNext,
}) => {
  const detected = detectPlatformFromUrl(originalUrl);
  const hasTitle = Boolean(title.trim());
  const hasUrl = Boolean(originalUrl.trim());
  const canProceed = isExistingSource || (hasTitle && hasUrl);

  const platformsList: { id: SourcePlatform; label: string; iconPlatform: 'YOUTUBE' | 'FACEBOOK' | 'TIKTOK' | 'INSTAGRAM' | 'GENERIC_WEB' }[] = [
    { id: 'YOUTUBE', label: 'YouTube', iconPlatform: 'YOUTUBE' },
    { id: 'FACEBOOK', label: 'Facebook', iconPlatform: 'FACEBOOK' },
    { id: 'TIKTOK', label: 'TikTok', iconPlatform: 'TIKTOK' },
    { id: 'INSTAGRAM', label: 'Instagram', iconPlatform: 'INSTAGRAM' },
    { id: 'TWITCH', label: 'Twitch', iconPlatform: 'GENERIC_WEB' },
  ];

  const handlePasteUrl = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setOriginalUrl(text.trim());
        const autoP = detectPlatformFromUrl(text.trim());
        if (autoP) {
          if (autoP.type === 'FACEBOOK') setPlatform('FACEBOOK');
          else if (autoP.type === 'YOUTUBE') setPlatform('YOUTUBE');
          else if (autoP.type === 'TIKTOK') setPlatform('TIKTOK');
          else if (autoP.type === 'INSTAGRAM') setPlatform('INSTAGRAM');
        }
      }
    } catch {
      // Fallback
    }
  };

  const handleUrlChange = (val: string) => {
    setOriginalUrl(val);
    const autoP = detectPlatformFromUrl(val);
    if (autoP) {
      if (autoP.type === 'FACEBOOK') setPlatform('FACEBOOK');
      else if (autoP.type === 'YOUTUBE') setPlatform('YOUTUBE');
      else if (autoP.type === 'TIKTOK') setPlatform('TIKTOK');
      else if (autoP.type === 'INSTAGRAM') setPlatform('INSTAGRAM');
    }
  };

  const handleSelectPlatform = (selected: SourcePlatform) => {
    if (isExistingSource) return;
    setPlatform(selected);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-stone-900">1. ข้อมูลต้นฉบับ</h3>
          <p className="text-xs text-stone-500 mt-0.5">
            {isExistingSource
              ? 'ข้อมูลของคลิปต้นฉบับที่เลือกไว้สำหรับหั่นช็อต'
              : 'ระบุข้อมูลคลิปยาวหรือไลฟ์สดสำหรับใช้ตัดแบ่งช็อต'}
          </p>
        </div>

        {canProceed && (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
            <Check className="w-3.5 h-3.5 text-emerald-600" />
            <span>ข้อมูลพร้อม</span>
          </span>
        )}
      </div>

      <div className="space-y-3">
        {/* Source URL & Interactive Platform Selector */}
        <div className="p-3.5 rounded-2xl border border-stone-200 bg-white space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="text-xs sm:text-sm font-bold text-stone-800 flex items-center gap-1.5">
              <Link2 className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>ลิงก์ต้นฉบับ <span className="text-rose-500">*</span></span>
            </label>

            {/* Clickable Platform Quick Selector Badges */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-stone-400 mr-0.5">คลิกเลือก:</span>
              {platformsList.map((p) => {
                const isSelected = platform === p.id;
                const isDetected = detected && (
                  (detected.type === 'YOUTUBE' && p.id === 'YOUTUBE') ||
                  (detected.type === 'FACEBOOK' && p.id === 'FACEBOOK') ||
                  (detected.type === 'TIKTOK' && p.id === 'TIKTOK') ||
                  (detected.type === 'INSTAGRAM' && p.id === 'INSTAGRAM')
                );

                return (
                  <button
                    key={p.id}
                    type="button"
                    disabled={isExistingSource}
                    onClick={() => handleSelectPlatform(p.id)}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      isSelected || isDetected
                        ? p.id === 'YOUTUBE'
                          ? 'bg-rose-50 text-rose-800 border border-rose-300 ring-2 ring-rose-500/20'
                          : p.id === 'FACEBOOK'
                          ? 'bg-blue-50 text-blue-800 border border-blue-300 ring-2 ring-blue-500/20'
                          : p.id === 'TIKTOK'
                          ? 'bg-stone-100 text-stone-900 border border-stone-400 ring-2 ring-stone-900/15'
                          : p.id === 'INSTAGRAM'
                          ? 'bg-fuchsia-50 text-fuchsia-800 border border-fuchsia-300 ring-2 ring-fuchsia-500/20'
                          : 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                        : 'bg-stone-50 text-stone-600 border border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    <PlatformIcon platform={p.iconPlatform} className="w-3.5 h-3.5" />
                    <span>{p.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="relative flex items-center">
            <input
              type="url"
              required
              disabled={isExistingSource}
              value={originalUrl}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder="วางลิงก์ เช่น https://www.youtube.com/watch?v=... หรือ facebook.com/live/..."
              className="w-full pl-3.5 pr-20 py-2.5 text-xs sm:text-sm font-mono bg-[#FAF8F5] focus:bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/15 transition-all text-stone-900 placeholder:text-stone-400 disabled:opacity-75"
            />
            {!isExistingSource && (
              <button
                type="button"
                onClick={handlePasteUrl}
                className="absolute right-2 px-2.5 py-1 text-xs font-semibold text-stone-600 hover:text-emerald-800 bg-white hover:bg-stone-50 border border-stone-200 rounded-lg flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
              >
                <Clipboard className="w-3 h-3" />
                <span>วาง</span>
              </button>
            )}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-xs sm:text-sm font-bold text-stone-800 mb-1.5 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>ชื่อคลิปต้นฉบับยาว / ไลฟ์สด <span className="text-rose-500">*</span></span>
          </label>
          <input
            type="text"
            required
            disabled={isExistingSource}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="เช่น ไลฟ์สดพี่แจ๊สงานวัด 2 ชม., สัมภาษณ์คนดัง..."
            className="w-full px-3.5 py-2.5 text-sm bg-[#FAF8F5] focus:bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/15 transition-all text-stone-900 placeholder:text-stone-400 disabled:opacity-75"
          />
        </div>

        {/* Creator & Duration */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-7">
            <label className="block text-xs sm:text-sm font-bold text-stone-800 mb-1.5 flex items-center gap-1.5">
              <User className="w-4 h-4 text-stone-400 shrink-0" />
              <span>ช่อง / ผู้สร้างคลิป</span>
            </label>
            <input
              type="text"
              disabled={isExistingSource}
              value={channelOrCreator}
              onChange={(e) => setChannelOrCreator(e.target.value)}
              placeholder="เช่น Jazz Chuanchuen"
              className="w-full px-3.5 py-2 text-sm bg-[#FAF8F5] focus:bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-emerald-600 text-stone-900 placeholder:text-stone-400 disabled:opacity-75"
            />
          </div>

          <div className="sm:col-span-5">
            <label className="block text-xs sm:text-sm font-bold text-stone-800 mb-1.5 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-stone-400 shrink-0" />
              <span>ความยาวรวม</span>
            </label>
            <input
              type="text"
              disabled={isExistingSource}
              value={totalDuration}
              onChange={(e) => setTotalDuration(e.target.value)}
              placeholder="01:30:00"
              className="w-full px-3.5 py-2 text-sm font-mono bg-[#FAF8F5] focus:bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-emerald-600 text-stone-900 disabled:opacity-75"
            />
          </div>
        </div>

        {/* Category Tags */}
        <div className="bg-[#FAF8F5] p-3 rounded-2xl border border-stone-200">
          <TagSelectorInput
            selectedTagIds={sourceTags}
            onChange={setSourceTags}
            label="หมวดหมู่หลักของต้นฉบับ"
            helperText="ช็อตที่หั่นย่อยจะได้รับแท็กเหล่านี้เป็นค่าเริ่มต้น"
          />
        </div>
      </div>

      <div className="pt-2 flex items-center justify-end">
        <button
          type="button"
          disabled={!canProceed}
          onClick={onNext}
          className={`inline-flex items-center gap-1.5 px-5 py-2 text-sm font-bold rounded-xl transition-all cursor-pointer ${
            canProceed
              ? 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs'
              : 'bg-stone-100 text-stone-400 cursor-not-allowed'
          }`}
        >
          <span>ถัดไป: หั่นช็อตฮา</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
