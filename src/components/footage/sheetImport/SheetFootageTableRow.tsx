import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronDown,
  ExternalLink,
  Lock,
  MessageSquareQuote,
  Trophy,
} from 'lucide-react';
import {
  ParsedEpisodeGroup,
  ParsedSheetRow,
  TagTierAssignment,
} from './sheetImport.types';

const getSoftPastelTagStyle = (tier: 1 | 2 | 3) => {
  if (tier === 1) {
    return {
      chipClass: 'bg-[#EEF5FB] text-[#1E40AF]',
      dotClass: 'bg-[#2563EB]',
    };
  }
  if (tier === 2) {
    return {
      chipClass: 'bg-[#FEF6E8] text-[#8A4D1F]',
      dotClass: 'bg-[#D97706]',
    };
  }
  return {
    chipClass: 'bg-[#EDF6F0] text-[#1C4824]',
    dotClass: 'bg-[#16A34A]',
  };
};

interface SheetFootageTableRowProps {
  row: ParsedSheetRow;
  cellPadClass: string;
  isSelected: boolean;
  isTagsExpanded: boolean;
  autoCreateMissingFootage: boolean;
  epGroup?: ParsedEpisodeGroup;
  syncEpisodesFromColD: boolean;
  lockFlags: {
    isRankLocked: boolean;
    isPunchlineLocked: boolean;
    isRankAndPunchlineAllLocked: boolean;
    isTier1Locked: boolean;
    isTier2Locked: boolean;
    isTier3Locked: boolean;
    isAllTagsLocked: boolean;
    isEpTitleLocked: boolean;
    isEpUrlLocked: boolean;
    isEpDateLocked: boolean;
    isAllEpColLocked: boolean;
  };
  onToggleRowSelection: (rowIndex: number) => void;
  onToggleExpandTags: (rowIndex: number) => void;
}

export const SheetFootageTableRow: React.FC<SheetFootageTableRowProps> = ({
  row,
  cellPadClass,
  isSelected,
  isTagsExpanded,
  autoCreateMissingFootage,
  epGroup,
  syncEpisodesFromColD,
  lockFlags,
  onToggleRowSelection,
  onToggleExpandTags,
}) => {
  const isMatched = row.matchedFootage !== null;
  const isExpanded = isTagsExpanded;

  const {
    isRankLocked,
    isPunchlineLocked,
    isRankAndPunchlineAllLocked,
    isTier1Locked,
    isTier2Locked,
    isTier3Locked,
    isAllTagsLocked,
    isEpTitleLocked,
    isEpUrlLocked,
    isEpDateLocked,
    isAllEpColLocked,
  } = lockFlags;

  const combinedTagItems: TagTierAssignment[] = [];
  const seenLower = new Set<string>();

  row.resolvedTags.forEach((rt) => {
    seenLower.add(rt.name.toLowerCase());
    combinedTagItems.push(rt);
  });

  row.existingTags.forEach((et) => {
    const l = et.name.toLowerCase();
    if (!seenLower.has(l)) {
      seenLower.add(l);
      combinedTagItems.push({
        name: et.name,
        tier: et.tier || 1,
        isNew: false,
        existingTag: et,
      });
    }
  });

  const previewTags = combinedTagItems.slice(0, 2);
  const extraTagCount = Math.max(
    0,
    combinedTagItems.length - previewTags.length
  );

  const effectiveEpTitle = epGroup?.episodeTitle || row.episodeTitle;
  const effectivePublishDate = epGroup?.publishDate || row.publishDate;
  const effectivePublishTime = epGroup?.publishTime || row.publishTime;

  const summaryRankText = isRankAndPunchlineAllLocked
    ? 'ล็อกอันดับ/คำสร้อย'
    : row.rankTitle || row.punchlineNote
    ? `${row.rankTitle || 'อันดับ'}${
        row.punchlineNote ? ` · "${row.punchlineNote}"` : ''
      }`
    : null;

  return (
    <>
      <tr
        onClick={() => onToggleExpandTags(row.rowIndex)}
        className={`transition-colors cursor-pointer ${
          !isSelected
            ? 'bg-[#F7F3EE]/60 opacity-55'
            : isExpanded
            ? 'bg-[#FAF6F0]'
            : isMatched
            ? 'bg-white hover:bg-[#FAF7F2]'
            : 'bg-[#FFFDF9] hover:bg-[#FAF6EE]'
        }`}
      >
        {/* 1. Selection Checkbox + Row Index */}
        <td
          className={`${cellPadClass} w-16 align-middle`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onToggleRowSelection(row.rowIndex)}
              className="rounded border-[#C5B49E] text-[#3B6845] focus:ring-[#3B6845] cursor-pointer"
            />
            <span className="text-[#998A7C] font-mono tabular-nums text-[11px]">
              {row.rowIndex}
            </span>
          </div>
        </td>

        {/* 2. Col A: Footage Title & Match Status Badge */}
        <td className={`${cellPadClass} min-w-[240px] align-middle`}>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="font-bold text-[13px] text-[#2D241E] truncate max-w-[340px]"
              title={row.title}
            >
              {row.title}
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap mt-0.5 text-[11px] tabular-nums">
            {isMatched ? (
              row.isFuzzyMatched ? (
                <span
                  className="inline-flex items-center gap-1.5 text-[#8A4D1F] font-semibold"
                  title={`จับคู่ใกล้เคียง (${row.matchSimilarityPercent}%): ในคลังชื่อ "${row.matchedFootage?.title}"`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D97706] shrink-0" />
                  <span>
                    ใกล้เคียง{' '}
                    <span className="font-mono">{row.matchedFootage?.id}</span>{' '}
                    ({row.matchSimilarityPercent}%)
                  </span>
                </span>
              ) : (
                <span
                  className="inline-flex items-center gap-1.5 text-[#1C4824] font-semibold"
                  title={`ตรงกับไฟล์ในคลัง 100%: ${row.matchedFootage?.standardFileName}`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#3B6845] shrink-0" />
                  <span>
                    คลัง{' '}
                    <span className="font-mono">{row.matchedFootage?.id}</span>{' '}
                    (ตรง 100%)
                  </span>
                </span>
              )
            ) : autoCreateMissingFootage ? (
              <span className="inline-flex items-center gap-1.5 text-[#734B17] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D97706] shrink-0" />
                <span>คลิปใหม่ (สร้างอัตโนมัติ)</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-[#8A4D1F] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626] shrink-0" />
                <span>ไม่พบในคลัง (ข้าม)</span>
              </span>
            )}

            {row.isInStaging && (
              <>
                <span className="text-[#C5B49E]">·</span>
                <span className="text-[#734B17] font-medium">ไร้หมวดหมู่</span>
              </>
            )}

            {row.occurrenceCountInSheet > 1 && (
              <>
                <span className="text-[#C5B49E]">·</span>
                <span className="text-[#8A4D1F] font-medium">
                  ซ้ำในชีท {row.occurrenceCountInSheet} ครั้ง
                </span>
              </>
            )}
          </div>
        </td>

        {/* 3. Single-Line iOS Summary Pills (Rank/Punchline + Tags + EP + Chevron) */}
        <td className={`${cellPadClass} align-middle text-right`}>
          <div className="inline-flex flex-wrap items-center justify-end gap-1.5">
            {/* Rank & Punchline Summary Pill */}
            {summaryRankText && (
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-medium max-w-[210px] truncate ${
                  isRankAndPunchlineAllLocked
                    ? 'bg-[#FAF8F5] border-[#E8DFD3] text-[#8E8174]'
                    : 'bg-[#FAF8F5] border-[#E3D8CB] text-[#3D332A]'
                }`}
                title={summaryRankText}
              >
                {isRankAndPunchlineAllLocked ? (
                  <Lock className="w-3 h-3 shrink-0" />
                ) : (
                  <Trophy className="w-3 h-3 text-[#8A5A22] shrink-0" />
                )}
                <span className="truncate">{summaryRankText}</span>
              </span>
            )}

            {/* Compact Tags Summary Pill */}
            {isAllTagsLocked ? (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[#FAF8F5] border border-[#E8DFD3] text-[11px] text-[#8E8174]">
                <Lock className="w-3 h-3" />
                <span>ล็อกแท็ก</span>
              </span>
            ) : combinedTagItems.length > 0 ? (
              <div className="inline-flex items-center gap-1">
                {previewTags.map((tagItem) => {
                  const style = getSoftPastelTagStyle(tagItem.tier);
                  return (
                    <span
                      key={`${row.rowIndex}-${tagItem.tier}-${tagItem.name}`}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold ${style.chipClass}`}
                    >
                      {tagItem.isNew && (
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${style.dotClass}`}
                        />
                      )}
                      <span className="max-w-[95px] truncate">
                        #{tagItem.name}
                      </span>
                    </span>
                  );
                })}
                {extraTagCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-md bg-[#EFE7DC] text-[#524538] font-mono text-[10px] font-bold">
                    +{extraTagCount}
                  </span>
                )}
              </div>
            ) : null}

            {/* Episode & Date Summary Pill */}
            {effectiveEpTitle && (
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-semibold max-w-[210px] truncate ${
                  isAllEpColLocked
                    ? 'bg-[#FAF8F5] border-[#E8DFD3] text-[#8E8174]'
                    : 'bg-[#EEF5EE]/70 border-[#CBE0CE] text-[#1C4824]'
                }`}
                title={`${effectiveEpTitle}${
                  effectivePublishDate ? ` · ${effectivePublishDate}` : ''
                }`}
              >
                {isAllEpColLocked && <Lock className="w-3 h-3 shrink-0" />}
                <span className="truncate">{effectiveEpTitle}</span>
              </span>
            )}

            {/* Expand/Collapse Chevron */}
            <span
              className={`p-1 rounded-lg border transition-colors ${
                isExpanded
                  ? 'bg-[#3B6845] border-[#3B6845] text-white'
                  : 'bg-white border-[#E3D8CB] text-[#6E5F52]'
              }`}
              title="คลิกเพื่อกางดูรายละเอียดครบ 10 คอลัมน์"
            >
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform ${
                  isExpanded ? 'rotate-180' : ''
                }`}
              />
            </span>
          </div>
        </td>
      </tr>

      {/* Progressive Disclosure: Inline iOS Expandable Drawer showing full 10-Column details */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <tr className="bg-[#FAF6F0]/90 border-b border-[#E5DBC9]">
            <td colSpan={3} className="px-4 sm:px-6 py-3">
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.14 }}
                className="rounded-2xl bg-white border border-[#E2D5C4] p-3.5 shadow-xs grid grid-cols-1 md:grid-cols-3 gap-3 text-xs"
              >
                {/* 1. Col C & D: Full Rank Title & Punchline */}
                <div className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#EDE5D8] space-y-1">
                  <div className="text-[11px] font-bold text-[#7D6E61] flex items-center justify-between">
                    <span>Col C–D: อันดับ &amp; คำสร้อย</span>
                    {(isRankLocked || isPunchlineLocked) && (
                      <span className="inline-flex items-center gap-0.5 text-[#8A4D1F]">
                        <Lock className="w-3 h-3" />
                        <span>ล็อกบางส่วน</span>
                      </span>
                    )}
                  </div>
                  <div className="font-bold text-[#2D241E] flex items-center gap-1.5">
                    <Trophy className="w-3.5 h-3.5 text-[#8A5A22] shrink-0" />
                    <span>{row.rankTitle || 'ไม่ได้ระบุชื่ออันดับ'}</span>
                  </div>
                  {row.punchlineNote && (
                    <div className="text-[#524538] italic flex items-start gap-1.5 pt-0.5">
                      <MessageSquareQuote className="w-3.5 h-3.5 text-[#3B6845] shrink-0 mt-0.5" />
                      <span>&ldquo;{row.punchlineNote}&rdquo;</span>
                    </div>
                  )}
                  {row.isFuzzyMatched && row.matchedFootage && (
                    <div className="text-[11px] text-[#8A4D1F] pt-1 border-t border-[#EDE5D8]">
                      ชื่อในคลัง: &ldquo;{row.matchedFootage.title}&rdquo;
                    </div>
                  )}
                </div>

                {/* 2. Col E–G: Full 3-Tier Tags */}
                <div className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#EDE5D8] space-y-1.5">
                  <div className="text-[11px] font-bold text-[#7D6E61] flex items-center justify-between">
                    <span>
                      Col E–G: แท็กทั้งหมด ({combinedTagItems.length})
                    </span>
                    {(isTier1Locked || isTier2Locked || isTier3Locked) && (
                      <span className="inline-flex items-center gap-0.5 text-[#8A4D1F]">
                        <Lock className="w-3 h-3" />
                        <span>ล็อกบาง Tier</span>
                      </span>
                    )}
                  </div>
                  {combinedTagItems.length === 0 ? (
                    <span className="text-[#998A7C]">ไม่มีแท็กในแถวนี้</span>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {combinedTagItems.map((tagItem) => {
                        const style = getSoftPastelTagStyle(tagItem.tier);
                        return (
                          <span
                            key={`full-${row.rowIndex}-${tagItem.tier}-${tagItem.name}`}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold ${style.chipClass}`}
                          >
                            {tagItem.isNew && (
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${style.dotClass}`}
                              />
                            )}
                            <span>
                              T{tagItem.tier}: #{tagItem.name}
                            </span>
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 3. Col B, H, I, J: Full Episode Title, YouTube Link & Publish Date/Slot */}
                <div className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#EDE5D8] space-y-1">
                  <div className="text-[11px] font-bold text-[#7D6E61] flex items-center justify-between">
                    <span>Col B, H–J: คลิปหลัก EP &amp; วันลง</span>
                    {(isEpTitleLocked || isEpUrlLocked || isEpDateLocked) && (
                      <span className="inline-flex items-center gap-0.5 text-[#8A4D1F]">
                        <Lock className="w-3 h-3" />
                        <span>ล็อกบางช่อง</span>
                      </span>
                    )}
                  </div>
                  <div className="font-bold text-[#2D241E]">
                    {effectiveEpTitle || 'ไม่ได้ระบุคลิปหลัก EP'}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#524538] pt-0.5">
                    {effectivePublishDate && (
                      <span className="font-mono font-semibold text-[#1C4824]">
                        วันที่: {effectivePublishDate}{' '}
                        {effectivePublishTime ? `(${effectivePublishTime})` : ''}
                      </span>
                    )}
                    {row.episodeUrl && (
                      <a
                        href={row.episodeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 text-[#2563EB] hover:underline font-semibold"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>เปิดลิงก์ YouTube</span>
                      </a>
                    )}
                  </div>
                </div>
              </motion.div>
            </td>
          </tr>
        )}
      </AnimatePresence>
    </>
  );
};
