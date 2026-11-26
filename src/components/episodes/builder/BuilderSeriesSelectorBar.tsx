import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  Sparkles,
  X,
} from 'lucide-react';
import { BuilderSeriesCatalogItem, BuilderSeriesMode } from './builder.types';
import {
  buildCanonicalSeriesTitle,
  findExistingSeriesByName,
} from './builderSeriesEngine';

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
  onJumpToStep1?: () => void;
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
  onJumpToStep1,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isPickingExisting, setIsPickingExisting] = useState(false);
  const [pickerQuery, setPickerQuery] = useState('');

  const comboboxContainerRef = useRef<HTMLDivElement | null>(null);
  const unifiedInputRef = useRef<HTMLInputElement | null>(null);

  const finalizeComboboxOnDismiss = useCallback(() => {
    setIsDropdownOpen(false);
    if (!isPickingExisting) return;

    setIsPickingExisting(false);
    const trimmed = pickerQuery.trim();

    if (
      seriesMode === 'EXISTING' &&
      activeExistingSeries &&
      trimmed === activeExistingSeries.seriesName
    ) {
      setPickerQuery('');
      return;
    }

    if (!trimmed) {
      onSwitchToNewSeries();
      setPickerQuery('');
      return;
    }

    const matched = findExistingSeriesByName(trimmed, seriesCatalog);
    if (matched) {
      onSelectExistingSeries(matched.seriesKey);
    } else {
      onSwitchToNewSeries(trimmed);
    }
    setPickerQuery('');
  }, [
    isPickingExisting,
    pickerQuery,
    seriesMode,
    activeExistingSeries,
    seriesCatalog,
    onSelectExistingSeries,
    onSwitchToNewSeries,
  ]);

  useEffect(() => {
    if (!isDropdownOpen && !isPickingExisting) return;
    const handleOutsideMouseDown = (event: MouseEvent) => {
      if (
        comboboxContainerRef.current &&
        !comboboxContainerRef.current.contains(event.target as Node)
      ) {
        finalizeComboboxOnDismiss();
      }
    };
    document.addEventListener('mousedown', handleOutsideMouseDown);
    return () =>
      document.removeEventListener('mousedown', handleOutsideMouseDown);
  }, [isDropdownOpen, isPickingExisting, finalizeComboboxOnDismiss]);

  const effectiveFilterQuery = useMemo(() => {
    const q = pickerQuery.trim();
    if (
      activeExistingSeries &&
      q === activeExistingSeries.seriesName.trim()
    ) {
      return '';
    }
    return q.toLowerCase();
  }, [pickerQuery, activeExistingSeries]);

  const filteredCatalog = useMemo(() => {
    if (!effectiveFilterQuery) return seriesCatalog;
    return seriesCatalog.filter((item) => {
      if (item.seriesName.toLowerCase().includes(effectiveFilterQuery)) {
        return true;
      }
      if (item.fullSeriesTitle.toLowerCase().includes(effectiveFilterQuery)) {
        return true;
      }
      return item.matchedTagNames.some((t) =>
        t.toLowerCase().includes(effectiveFilterQuery)
      );
    });
  }, [seriesCatalog, effectiveFilterQuery]);

  const handlePickExisting = (seriesKey: string) => {
    onSelectExistingSeries(seriesKey);
    setIsPickingExisting(false);
    setIsDropdownOpen(false);
    setPickerQuery('');
  };

  const handleClickExistingTab = () => {
    if (seriesCatalog.length === 0) return;
    setIsPickingExisting(true);
    setPickerQuery(
      seriesMode === 'EXISTING' && activeExistingSeries
        ? activeExistingSeries.seriesName
        : ''
    );
    setIsDropdownOpen(true);
    window.setTimeout(() => {
      unifiedInputRef.current?.focus();
    }, 20);
  };

  const handleClickNewSeriesTab = () => {
    setIsPickingExisting(false);
    setIsDropdownOpen(false);
    setPickerQuery('');
    onSwitchToNewSeries();
    window.setTimeout(() => {
      unifiedInputRef.current?.focus();
    }, 20);
  };

  const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const nextFocused = e.relatedTarget as Node | null;
    if (
      nextFocused &&
      comboboxContainerRef.current &&
      comboboxContainerRef.current.contains(nextFocused)
    ) {
      return;
    }
    finalizeComboboxOnDismiss();
  };

  // =========================================================================
  // VARIANT 1: STEP 1 UNIFIED SERIES SMART COMBOBOX
  // =========================================================================
  if (variant === 'step1') {
    const isExistingTabActive = isPickingExisting || seriesMode === 'EXISTING';
    const inputValue = isPickingExisting
      ? pickerQuery
      : seriesMode === 'EXISTING' && activeExistingSeries
      ? activeExistingSeries.seriesName
      : customSeriesName;

    return (
      <div className="bg-[#f4f8f4] border border-[#d6e4d5] rounded-2xl p-3 space-y-2">
        <div
          ref={comboboxContainerRef}
          className="flex flex-col lg:flex-row lg:items-center gap-2 relative"
        >
          {/* Mode Segmented Toggle */}
          <div className="flex items-center justify-between lg:justify-start gap-2 shrink-0">
            <span className="text-xs font-extrabold text-[#244b2f] inline-flex items-center gap-1.5 whitespace-nowrap">
              <Library className="w-3.5 h-3.5 text-[#3b6845]" />
              <span>ซีรีส์</span>
            </span>

            <div className="inline-flex items-center p-0.5 rounded-xl bg-white border border-[#d6e4d5]">
              <button
                type="button"
                onClick={handleClickExistingTab}
                disabled={seriesCatalog.length === 0}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer whitespace-nowrap disabled:opacity-40 tabular-nums ${
                  isExistingTabActive
                    ? 'bg-[#3b6845] text-white'
                    : 'text-[#554d44] hover:bg-[#f4f8f4]'
                }`}
              >
                ต่อซีรีส์เดิม ({seriesCatalog.length})
              </button>
              <button
                type="button"
                onClick={handleClickNewSeriesTab}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer whitespace-nowrap ${
                  !isExistingTabActive
                    ? 'bg-[#3b6845] text-white'
                    : 'text-[#554d44] hover:bg-[#f4f8f4]'
                }`}
              >
                สร้างซีรีส์ใหม่
              </button>
            </div>
          </div>

          {/* Single Unified Search / Series Name Combobox */}
          <div className="relative flex-1 min-w-0">
            <div className="relative flex items-center">
              <input
                ref={unifiedInputRef}
                type="text"
                value={inputValue}
                onFocus={() => {
                  if (seriesMode === 'EXISTING' && !isPickingExisting) {
                    setIsPickingExisting(true);
                    setPickerQuery(activeExistingSeries?.seriesName || '');
                    setIsDropdownOpen(true);
                  }
                }}
                onBlur={handleInputBlur}
                onChange={(e) => {
                  const val = e.target.value;
                  if (isPickingExisting || seriesMode === 'EXISTING') {
                    setIsPickingExisting(true);
                    setPickerQuery(val);
                    setIsDropdownOpen(true);
                  } else {
                    onChangeCustomSeriesName(val);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    finalizeComboboxOnDismiss();
                    unifiedInputRef.current?.blur();
                  }
                }}
                placeholder={
                  isExistingTabActive
                    ? 'พิมพ์ค้นหาซีรีส์เดิม...'
                    : 'พิมพ์ชื่อซีรีส์ใหม่...'
                }
                className={`w-full pl-3 pr-24 py-1.5 text-xs font-semibold bg-white border rounded-xl focus:outline-none text-[#2d2926] ${
                  seriesMode === 'EXISTING' && activeExistingSeries
                    ? 'border-[#89b587] text-[#1e4628]'
                    : 'border-[#dcd3c5] focus:border-[#3b6845]'
                }`}
              />

              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <span className="text-[11px] font-mono tabular-nums font-bold text-[#2b5435] pointer-events-none">
                  EP.{effectiveEpisodeNo}
                </span>

                {isExistingTabActive && (
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      if (isDropdownOpen) {
                        finalizeComboboxOnDismiss();
                      } else {
                        handleClickExistingTab();
                      }
                    }}
                    className="p-0.5 rounded text-[#5a6c5d] hover:text-[#244b2f] cursor-pointer"
                    aria-label="เปิดหรือปิดรายการซีรีส์"
                  >
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform ${
                        isDropdownOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                )}

                {seriesMode === 'EXISTING' && activeExistingSeries && (
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={handleClickNewSeriesTab}
                    className="p-0.5 rounded text-[#787066] hover:text-[#2d2926] cursor-pointer"
                    title="ปลดล็อกเป็นสร้างซีรีส์ใหม่"
                    aria-label="ปลดล็อกเป็นสร้างซีรีส์ใหม่"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Unified Dropdown Directly Under Input */}
            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.16, ease: DROPDOWN_EASE }}
                  className="absolute left-0 right-0 top-full mt-1.5 z-40 rounded-xl border border-[#cfdece] bg-white shadow-lg overflow-hidden"
                >
                  <div className="max-h-60 overflow-y-auto scrollbar-thin divide-y divide-[#f2ece2]">
                    {filteredCatalog.length === 0 ? (
                      <div className="px-3.5 py-4 text-center space-y-2">
                        <p className="text-xs text-[#787066]">
                          ไม่พบซีรีส์ &ldquo;{pickerQuery.trim()}&rdquo; ในคลัง
                        </p>
                        {pickerQuery.trim().length > 0 && (
                          <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => {
                              const nextName = pickerQuery.trim();
                              setIsPickingExisting(false);
                              setIsDropdownOpen(false);
                              setPickerQuery('');
                              onSwitchToNewSeries(nextName);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-[#edf4ed] hover:bg-[#dfece0] text-[#244b2f] border border-[#bad8b9] cursor-pointer transition-colors"
                          >
                            <FolderPlus className="w-3.5 h-3.5" />
                            <span>สร้างซีรีส์ใหม่ &ldquo;{pickerQuery.trim()}&rdquo;</span>
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
                            onMouseDown={(e) => e.preventDefault()}
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
                              EP.{item.nextEpisodeNo}
                            </span>
                          </button>
                        );
                      })
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Match Hint when typing in NEW mode that already exists */}
        {!isExistingTabActive && matchingExistingSeriesForNewName && (
          <div className="flex flex-wrap items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl bg-[#fdf5e8] border border-[#e8cfa6] text-[11px] text-[#6b4415]">
            <span>
              พบในคลัง:{' '}
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
              ใช้ซีรีส์นี้ → EP.{matchingExistingSeriesForNewName.nextEpisodeNo}
            </button>
          </div>
        )}

        {/* Contextual 1-click Suggestion when in NEW mode */}
        {!isExistingTabActive &&
          !matchingExistingSeriesForNewName &&
          suggestedSeriesForActiveTag.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-[#5c6b5e]">
              <span className="inline-flex items-center gap-1 font-semibold text-[#3f5744]">
                <Sparkles className="w-3 h-3 text-[#3b6845]" />
                <span>ตรงแท็กนี้:</span>
              </span>
              {suggestedSeriesForActiveTag.map((s) => (
                <button
                  key={s.seriesKey}
                  type="button"
                  onClick={() => onSelectExistingSeries(s.seriesKey)}
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-white hover:bg-[#edf4ed] border border-[#cfdece] text-[#244b2f] font-bold transition-colors cursor-pointer whitespace-nowrap"
                >
                  <span className="truncate max-w-[180px]">{s.seriesName}</span>
                  <span className="font-mono tabular-nums text-[#3b6845]">
                    EP.{s.nextEpisodeNo}
                  </span>
                </button>
              ))}
            </div>
          )}
      </div>
    );
  }

  // =========================================================================
  // VARIANT 2: STEP 3 COMPACT SERIES SUMMARY + EDITABLE EP STEPPER
  // =========================================================================
  const displaySeriesTitle =
    seriesMode === 'EXISTING' && activeExistingSeries
      ? activeExistingSeries.fullSeriesTitle
      : buildCanonicalSeriesTitle(effectiveSeriesName);

  return (
    <div className="bg-[#edf4ed]/70 border border-[#cfdece] rounded-xl p-3.5 space-y-2.5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left: Chosen Series Summary + Jump to Step 1 */}
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold text-[#244b2f] inline-flex items-center gap-1">
              <Library className="w-3.5 h-3.5 text-[#3b6845]" />
              <span>{seriesMode === 'EXISTING' ? 'ซีรีส์เดิม' : 'ซีรีส์ใหม่'}</span>
            </span>
            <span className="text-[#b8c9b8]">·</span>
            <span className="text-xs sm:text-sm font-extrabold text-[#1e4628] truncate max-w-md">
              {displaySeriesTitle}
            </span>
            {onJumpToStep1 && (
              <button
                type="button"
                onClick={onJumpToStep1}
                className="text-[11px] font-bold text-[#3b6845] hover:underline cursor-pointer shrink-0"
              >
                เปลี่ยน
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#554d44] font-mono tabular-nums">
            {seriesMode === 'EXISTING' && activeExistingSeries ? (
              <span>
                มีแล้ว {existingSeriesEpisodesCount} ตอน · ล่าสุด EP.
                {latestSeriesEpisodeNo}
              </span>
            ) : (
              <span>ตอนแรกของซีรีส์</span>
            )}
            {nextEpisodeId && (
              <>
                <span aria-hidden="true" className="text-[#b8c9b8]">
                  ·
                </span>
                <span className="font-bold text-[#2b5435]">{nextEpisodeId}</span>
              </>
            )}
          </div>
        </div>

        {/* Right: Editable EP Number Stepper */}
        <div className="w-full md:w-64 shrink-0 space-y-1">
          <div className="flex items-center justify-between gap-2 text-[11px]">
            <label className="font-bold text-[#3f5744]">เลขตอน (EP)</label>
            {isManualEpisodeNo && onResetAutoEpisodeNo ? (
              <button
                type="button"
                onClick={onResetAutoEpisodeNo}
                className="inline-flex items-center gap-1 font-bold text-[#3b6845] hover:underline cursor-pointer tabular-nums"
              >
                <RotateCcw className="w-3 h-3" />
                <span>คืนค่า EP.{autoEpisodeNo}</span>
              </button>
            ) : (
              <span className="text-[#5c7361] font-mono tabular-nums">
                อัตโนมัติ
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
                  if (
                    onChangeEpisodeNo &&
                    Number.isFinite(parsed) &&
                    parsed >= 1
                  ) {
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

      {/* Duplicate EP Warning */}
      {isDuplicateEpisodeNo && (
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-xl bg-[#fdf5e8] border border-[#e8cfa6] text-xs text-[#7c4f15]">
          <div className="flex items-center gap-2 min-w-0">
            <AlertTriangle className="w-4 h-4 text-[#b37731] shrink-0" />
            <span>
              มี <strong>EP.{effectiveEpisodeNo}</strong> แล้ว (ล่าสุด EP.
              {latestSeriesEpisodeNo})
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
    </div>
  );
};
