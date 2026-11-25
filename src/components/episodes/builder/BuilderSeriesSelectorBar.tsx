import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  AlertTriangle,
  Check,
  ChevronDown,
  FolderPlus,
  Library,
  Minus,
  Plus,
  RotateCcw,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import { BuilderSeriesCatalogItem, BuilderSeriesMode } from './builder.types';

interface BuilderSeriesSelectorBarProps {
  variant: 'step1' | 'step3';
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
  suggestedSeriesForActiveTag?: BuilderSeriesCatalogItem[];
  nextEpisodeId?: string;
  onSelectExistingSeries: (seriesKey: string) => void;
  onSwitchToNewSeries: (initialName?: string) => void;
  onChangeCustomSeriesName: (val: string) => void;
  onChangeEpisodeNo?: (epNo: number) => void;
  onResetAutoEpisodeNo?: () => void;
}

const DROPDOWN_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

export const BuilderSeriesSelectorBar: React.FC<
  BuilderSeriesSelectorBarProps
> = ({
  variant,
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
  suggestedSeriesForActiveTag = [],
  nextEpisodeId,
  onSelectExistingSeries,
  onSwitchToNewSeries,
  onChangeCustomSeriesName,
  onChangeEpisodeNo,
  onResetAutoEpisodeNo,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownContainerRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isDropdownOpen) return;
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        dropdownContainerRef.current &&
        !dropdownContainerRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isDropdownOpen]);

  useEffect(() => {
    if (isDropdownOpen) {
      const timer = window.setTimeout(() => {
        searchInputRef.current?.focus();
      }, 40);
      return () => window.clearTimeout(timer);
    }
    setSearchQuery('');
  }, [isDropdownOpen]);

  const filteredCatalog = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return seriesCatalog;
    return seriesCatalog.filter((item) => {
      if (item.seriesName.toLowerCase().includes(q)) return true;
      if (item.fullSeriesTitle.toLowerCase().includes(q)) return true;
      return item.matchedTagNames.some((t) => t.toLowerCase().includes(q));
    });
  }, [seriesCatalog, searchQuery]);

  const handlePickExisting = (seriesKey: string) => {
    onSelectExistingSeries(seriesKey);
    setIsDropdownOpen(false);
  };

  const handleOpenExistingDropdown = () => {
    setIsDropdownOpen((prev) => !prev);
  };

  const handleClickExistingTab = () => {
    if (seriesMode === 'EXISTING') {
      setIsDropdownOpen((prev) => !prev);
      return;
    }
    if (activeExistingSeries) {
      onSelectExistingSeries(activeExistingSeries.seriesKey);
    } else if (seriesCatalog.length > 0) {
      setIsDropdownOpen(true);
    }
  };

  const renderSeriesDropdown = () => (
    <AnimatePresence>
      {isDropdownOpen && (
        <motion.div
          initial={{ opacity: 0, y: -4, scale: 0.99 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -4, scale: 0.99 }}
          transition={{ duration: 0.16, ease: DROPDOWN_EASE }}
          className="absolute left-0 right-0 top-full mt-1.5 z-40 rounded-xl border border-[#cfdece] bg-white shadow-lg overflow-hidden"
        >
          {/* Search Bar */}
          <div className="p-2 border-b border-[#ede6da] bg-[#faf7f2]">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#8a7f73] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหาชื่อซีรีส์หรือแท็กในคลังตอน..."
                className="w-full pl-8 pr-7 py-1.5 text-xs bg-white border border-[#e3d9cb] rounded-lg focus:outline-none focus:border-[#3b6845] text-[#2d2926]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8a7f73] hover:text-[#2d2926] cursor-pointer"
                  aria-label="ล้างคำค้นหาซีรีส์"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Series List */}
          <div className="max-h-64 overflow-y-auto scrollbar-thin divide-y divide-[#f2ece2]">
            {filteredCatalog.length === 0 ? (
              <div className="px-3.5 py-5 text-center space-y-2">
                <p className="text-xs text-[#787066]">
                  ไม่พบซีรีส์ที่ตรงกับ &ldquo;{searchQuery}&rdquo; ในคลังตอน
                </p>
                {searchQuery.trim().length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      onSwitchToNewSeries(searchQuery.trim());
                      setIsDropdownOpen(false);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#edf4ed] hover:bg-[#dfece0] text-[#244b2f] border border-[#bad8b9] cursor-pointer transition-colors"
                  >
                    <FolderPlus className="w-3.5 h-3.5" />
                    <span>สร้างซีรีส์ใหม่ &ldquo;{searchQuery.trim()}&rdquo; (EP.1)</span>
                  </button>
                )}
              </div>
            ) : (
              filteredCatalog.map((item) => {
                const isSelected =
                  seriesMode === 'EXISTING' &&
                  activeExistingSeries?.seriesKey === item.seriesKey;
                return (
                  <button
                    key={item.seriesKey}
                    type="button"
                    onClick={() => handlePickExisting(item.seriesKey)}
                    className={`w-full text-left px-3 py-2 flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#edf4ed] text-[#1e4628]'
                        : 'hover:bg-[#faf7f2] text-[#2d2926]'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        {isSelected && (
                          <Check className="w-3.5 h-3.5 text-[#3b6845] shrink-0" />
                        )}
                        <span className="text-xs font-bold truncate">
                          {item.fullSeriesTitle}
                        </span>
                      </div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-[11px] text-[#787066] font-mono tabular-nums">
                        <span>{item.episodeCount} ตอน</span>
                        <span aria-hidden="true">·</span>
                        <span>ล่าสุด EP.{item.maxEpisodeNo}</span>
                        {item.matchedTagNames.length > 0 && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="font-sans text-[#6b6258] truncate max-w-[200px]">
                              #{item.matchedTagNames.slice(0, 2).join(' #')}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <span className="shrink-0 font-mono tabular-nums text-[11px] font-bold text-[#2b5435] bg-[#edf4ed] border border-[#cfdece] px-2 py-0.5 rounded-md whitespace-nowrap">
                      รัน EP.{item.nextEpisodeNo}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // =========================================================================
  // VARIANT 1: STEP 1 COMPACT SERIES QUICK-SELECTOR STRIP
  // =========================================================================
  if (variant === 'step1') {
    return (
      <div className="bg-[#f4f8f4] border border-[#d6e4d5] rounded-2xl p-3 space-y-2">
        <div className="flex flex-col lg:flex-row lg:items-center gap-2">
          {/* Mode Segmented Toggle */}
          <div className="flex items-center justify-between lg:justify-start gap-2 shrink-0">
            <span className="text-xs font-extrabold text-[#244b2f] inline-flex items-center gap-1.5 whitespace-nowrap">
              <Library className="w-3.5 h-3.5 text-[#3b6845]" />
              <span>ซีรีส์ &amp; รัน EP</span>
            </span>

            <div className="inline-flex items-center p-0.5 rounded-xl bg-white border border-[#d6e4d5]">
              <button
                type="button"
                onClick={handleClickExistingTab}
                disabled={seriesCatalog.length === 0}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer whitespace-nowrap disabled:opacity-40 ${
                  seriesMode === 'EXISTING'
                    ? 'bg-[#3b6845] text-white'
                    : 'text-[#554d44] hover:bg-[#f4f8f4]'
                }`}
              >
                ต่อซีรีส์เดิม ({seriesCatalog.length})
              </button>
              <button
                type="button"
                onClick={() => onSwitchToNewSeries()}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer whitespace-nowrap ${
                  seriesMode === 'NEW'
                    ? 'bg-[#3b6845] text-white'
                    : 'text-[#554d44] hover:bg-[#f4f8f4]'
                }`}
              >
                สร้างซีรีส์ใหม่
              </button>
            </div>
          </div>

          {/* Series Combobox OR New Series Input */}
          <div ref={dropdownContainerRef} className="relative flex-1 min-w-0">
            {seriesMode === 'EXISTING' ? (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleOpenExistingDropdown}
                  className="flex-1 min-w-0 flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-white border border-[#bad8b9] hover:border-[#7ca77a] text-left transition-colors cursor-pointer"
                >
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 min-w-0">
                    <span className="text-xs font-bold text-[#1e4628] truncate">
                      {activeExistingSeries
                        ? activeExistingSeries.fullSeriesTitle
                        : 'เลือกซีรีส์จากคลังตอน...'}
                    </span>
                    {activeExistingSeries && (
                      <span className="text-[11px] text-[#6d655b] font-mono tabular-nums whitespace-nowrap">
                        {existingSeriesEpisodesCount} ตอน · ล่าสุด EP.
                        {latestSeriesEpisodeNo}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="font-mono tabular-nums text-xs font-extrabold text-[#244b2f] whitespace-nowrap">
                      → EP.{effectiveEpisodeNo}
                    </span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-[#5a6c5d] transition-transform ${
                        isDropdownOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => onSwitchToNewSeries()}
                  className="p-1.5 rounded-xl bg-white border border-[#e3d9cb] hover:bg-[#faf7f2] text-[#787066] hover:text-[#2d2926] cursor-pointer shrink-0"
                  title="ปลดล็อกซีรีส์เดิม เปลี่ยนเป็นสร้างซีรีส์ใหม่"
                  aria-label="ปลดล็อกซีรีส์เดิม"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <div className="relative flex-1 min-w-0">
                  <input
                    type="text"
                    value={customSeriesName}
                    onChange={(e) => onChangeCustomSeriesName(e.target.value)}
                    placeholder="ชื่อซีรีส์ใหม่ (หรือกดปุ่ม 'ต่อซีรีส์เดิม' เพื่อเลือกจากคลัง)"
                    className="w-full pl-3 pr-20 py-1.5 text-xs font-semibold bg-white border border-[#dcd3c5] rounded-xl focus:outline-none focus:border-[#3b6845] text-[#2d2926]"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] font-mono tabular-nums font-bold text-[#2b5435] pointer-events-none">
                    EP.{effectiveEpisodeNo}
                  </span>
                </div>

                {seriesCatalog.length > 0 && (
                  <button
                    type="button"
                    onClick={handleOpenExistingDropdown}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white hover:bg-[#edf4ed] border border-[#cfdece] text-[11px] font-bold text-[#2b5435] transition-colors cursor-pointer whitespace-nowrap shrink-0"
                    title="เลือกซีรีส์ที่มีอยู่แล้วในคลังตอน"
                  >
                    <Search className="w-3 h-3" />
                    <span className="hidden sm:inline">เลือกจากคลัง</span>
                  </button>
                )}
              </div>
            )}

            {renderSeriesDropdown()}
          </div>
        </div>

        {/* Gentle Match Hint when typing a name that already exists in Archive */}
        {seriesMode === 'NEW' && matchingExistingSeriesForNewName && (
          <div className="flex flex-wrap items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl bg-[#fdf5e8] border border-[#e8cfa6] text-[11px] text-[#6b4415]">
            <span>
              พบซีรีส์นี้ในคลังแล้ว:{' '}
              <strong>{matchingExistingSeriesForNewName.fullSeriesTitle}</strong>{' '}
              <span className="font-mono tabular-nums">
                (ล่าสุด EP.{matchingExistingSeriesForNewName.maxEpisodeNo})
              </span>
            </span>
            <button
              type="button"
              onClick={() =>
                onSelectExistingSeries(
                  matchingExistingSeriesForNewName.seriesKey
                )
              }
              className="px-2.5 py-0.5 rounded-lg bg-[#8a5a22] hover:bg-[#6f4619] text-white font-bold transition-colors cursor-pointer whitespace-nowrap"
            >
              เชื่อมเพื่อรันต่อ EP.{matchingExistingSeriesForNewName.nextEpisodeNo}
            </button>
          </div>
        )}

        {/* Contextual 1-click Suggestion when browsing tags in NEW mode */}
        {seriesMode === 'NEW' &&
          !matchingExistingSeriesForNewName &&
          suggestedSeriesForActiveTag.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-[#5c6b5e]">
              <span className="inline-flex items-center gap-1 font-semibold text-[#3f5744]">
                <Sparkles className="w-3 h-3 text-[#3b6845]" />
                <span>ซีรีส์ในคลังที่ตรงแท็กนี้:</span>
              </span>
              {suggestedSeriesForActiveTag.map((s) => (
                <button
                  key={s.seriesKey}
                  type="button"
                  onClick={() => onSelectExistingSeries(s.seriesKey)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-white hover:bg-[#edf4ed] border border-[#cfdece] text-[#244b2f] font-bold transition-colors cursor-pointer whitespace-nowrap"
                >
                  <span className="truncate max-w-[200px]">{s.seriesName}</span>
                  <span className="font-mono tabular-nums text-[#3b6845]">
                    → EP.{s.nextEpisodeNo}
                  </span>
                </button>
              ))}
            </div>
          )}
      </div>
    );
  }

  // =========================================================================
  // VARIANT 2: STEP 3 FULL SERIES TARGET & EDITABLE EP NUMBER PANEL
  // =========================================================================
  return (
    <div className="bg-[#edf4ed]/80 border border-[#cfdece] rounded-xl p-3.5 space-y-3">
      {/* Top Row: Mode Switcher + Archive Code */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-extrabold text-[#244b2f] inline-flex items-center gap-1.5">
            <Library className="w-3.5 h-3.5 text-[#3b6845]" />
            <span>รายการซีรีส์เป้าหมาย</span>
          </span>

          <div className="inline-flex items-center p-0.5 rounded-lg bg-white border border-[#cfdece]">
            <button
              type="button"
              onClick={handleClickExistingTab}
              disabled={seriesCatalog.length === 0}
              className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold transition-colors cursor-pointer whitespace-nowrap disabled:opacity-40 ${
                seriesMode === 'EXISTING'
                  ? 'bg-[#3b6845] text-white'
                  : 'text-[#5c534a] hover:bg-[#f4f8f4]'
              }`}
            >
              ต่อจากซีรีส์เดิม ({seriesCatalog.length})
            </button>
            <button
              type="button"
              onClick={() => onSwitchToNewSeries(effectiveSeriesName)}
              className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold transition-colors cursor-pointer whitespace-nowrap ${
                seriesMode === 'NEW'
                  ? 'bg-[#3b6845] text-white'
                  : 'text-[#5c534a] hover:bg-[#f4f8f4]'
              }`}
            >
              สร้างซีรีส์ใหม่
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-[#554d44] font-mono tabular-nums">
          {seriesMode === 'EXISTING' && activeExistingSeries ? (
            <span>
              มีแล้ว {existingSeriesEpisodesCount} ตอน · ล่าสุด EP.
              {latestSeriesEpisodeNo}
            </span>
          ) : (
            <span>ซีรีส์ใหม่เริ่มต้นที่ EP.1</span>
          )}
          {nextEpisodeId && (
            <>
              <span aria-hidden="true" className="text-[#b8c9b8]">
                ·
              </span>
              <span className="font-bold text-[#2b5435] bg-white border border-[#bad8b9] px-2 py-0.5 rounded-md">
                {nextEpisodeId}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Main Controls Row: Series Selector/Input (8 cols) + Editable EP Number Stepper (4 cols) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-start">
        <div ref={dropdownContainerRef} className="md:col-span-8 relative">
          <label className="block text-[11px] font-bold text-[#3f5744] mb-1">
            {seriesMode === 'EXISTING'
              ? 'เลือกซีรีส์จากคลังตอนเพื่อรันเลข EP ต่อเนื่อง'
              : 'ระบุชื่อซีรีส์ใหม่ (ไม่ต้องพิมพ์ "5 อันดับ" หรือ "EP")'}
          </label>

          {seriesMode === 'EXISTING' ? (
            <button
              type="button"
              onClick={handleOpenExistingDropdown}
              className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-white border border-[#bad8b9] hover:border-[#7ca77a] text-left transition-colors cursor-pointer"
            >
              <span className="text-xs sm:text-sm font-bold text-[#1e4628] truncate">
                {activeExistingSeries
                  ? activeExistingSeries.fullSeriesTitle
                  : 'เลือกซีรีส์เดิมจากคลัง...'}
              </span>
              <ChevronDown
                className={`w-4 h-4 text-[#4a6b50] shrink-0 transition-transform ${
                  isDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>
          ) : (
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={customSeriesName}
                onChange={(e) => onChangeCustomSeriesName(e.target.value)}
                placeholder="เช่น มายเมทเนท, คนเมายา, คนไทยเป็นคนตลก..."
                className="flex-1 min-w-0 px-3 py-2 text-xs sm:text-sm font-semibold bg-white border border-[#cfdece] rounded-xl focus:outline-none focus:border-[#3b6845] text-[#2d2926]"
              />
              {seriesCatalog.length > 0 && (
                <button
                  type="button"
                  onClick={handleOpenExistingDropdown}
                  className="px-2.5 py-2 rounded-xl bg-white hover:bg-[#f4f8f4] border border-[#cfdece] text-xs font-bold text-[#2b5435] cursor-pointer whitespace-nowrap shrink-0"
                >
                  เลือกจากคลัง
                </button>
              )}
            </div>
          )}

          {renderSeriesDropdown()}
        </div>

        {/* Editable EP Number Stepper */}
        <div className="md:col-span-4">
          <div className="flex items-center justify-between gap-1 mb-1">
            <label className="text-[11px] font-bold text-[#3f5744]">
              เลขตอน (EP)
            </label>
            {isManualEpisodeNo && onResetAutoEpisodeNo ? (
              <button
                type="button"
                onClick={onResetAutoEpisodeNo}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-[#3b6845] hover:underline cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>คืนค่าอัตโนมัติ (EP.{autoEpisodeNo})</span>
              </button>
            ) : (
              <span className="text-[11px] text-[#5c7361] font-mono tabular-nums">
                {seriesMode === 'EXISTING' ? 'อัตโนมัติ (สูงสุด+1)' : 'อัตโนมัติ'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() =>
                onChangeEpisodeNo &&
                onChangeEpisodeNo(Math.max(1, effectiveEpisodeNo - 1))
              }
              disabled={effectiveEpisodeNo <= 1}
              className="w-9 h-9 rounded-xl bg-white border border-[#cfdece] hover:bg-[#f4f8f4] disabled:opacity-40 flex items-center justify-center text-[#2b5435] cursor-pointer shrink-0"
              aria-label="ลดเลข EP"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>

            <div className="relative flex-1 min-w-0">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono font-extrabold text-[#3b6845] pointer-events-none">
                EP.
              </span>
              <input
                type="number"
                min={1}
                step={1}
                value={effectiveEpisodeNo}
                onChange={(e) => {
                  const parsed = parseInt(e.target.value, 10);
                  if (onChangeEpisodeNo && Number.isFinite(parsed) && parsed >= 1) {
                    onChangeEpisodeNo(parsed);
                  }
                }}
                className={`w-full pl-9 pr-2 py-2 text-xs sm:text-sm font-mono tabular-nums font-extrabold bg-white border rounded-xl focus:outline-none text-center ${
                  isDuplicateEpisodeNo
                    ? 'border-[#d99b43] text-[#7c4f15] bg-[#fffaf0]'
                    : 'border-[#bad8b9] focus:border-[#3b6845] text-[#1e4628]'
                }`}
              />
            </div>

            <button
              type="button"
              onClick={() =>
                onChangeEpisodeNo && onChangeEpisodeNo(effectiveEpisodeNo + 1)
              }
              className="w-9 h-9 rounded-xl bg-white border border-[#cfdece] hover:bg-[#f4f8f4] flex items-center justify-center text-[#2b5435] cursor-pointer shrink-0"
              aria-label="เพิ่มเลข EP"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Duplicate EP Warning (Non-blocking Light Pastel Amber) */}
      {isDuplicateEpisodeNo && (
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-xl bg-[#fdf5e8] border border-[#e8cfa6] text-xs text-[#7c4f15]">
          <div className="flex items-center gap-2 min-w-0">
            <AlertTriangle className="w-4 h-4 text-[#b37731] shrink-0" />
            <span>
              ในซีรีส์นี้มี <strong>EP.{effectiveEpisodeNo}</strong> อยู่ในคลังแล้ว
              (ล่าสุดคือ EP.{latestSeriesEpisodeNo}) — ยังบันทึกได้หากทำเป็นตอนพิเศษ
            </span>
          </div>
          {onResetAutoEpisodeNo && (
            <button
              type="button"
              onClick={onResetAutoEpisodeNo}
              className="px-2.5 py-1 rounded-lg bg-[#8a5a22] hover:bg-[#6f4619] text-white text-[11px] font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              เปลี่ยนเป็น EP.{autoEpisodeNo}
            </button>
          )}
        </div>
      )}

      {/* Existing Series Match Suggestion when typing in NEW mode */}
      {seriesMode === 'NEW' && matchingExistingSeriesForNewName && (
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-xl bg-[#fdf5e8] border border-[#e8cfa6] text-xs text-[#7c4f15]">
          <span>
            ชื่อนี้ตรงกับซีรีส์เดิมในคลัง:{' '}
            <strong>{matchingExistingSeriesForNewName.fullSeriesTitle}</strong>{' '}
            <span className="font-mono tabular-nums">
              (มีแล้ว {matchingExistingSeriesForNewName.episodeCount} ตอน · ล่าสุด EP.
              {matchingExistingSeriesForNewName.maxEpisodeNo})
            </span>
          </span>
          <button
            type="button"
            onClick={() =>
              onSelectExistingSeries(matchingExistingSeriesForNewName.seriesKey)
            }
            className="px-2.5 py-1 rounded-lg bg-[#8a5a22] hover:bg-[#6f4619] text-white text-[11px] font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            เชื่อมเพื่อรันต่อ EP.{matchingExistingSeriesForNewName.nextEpisodeNo}
          </button>
        </div>
      )}
    </div>
  );
};
