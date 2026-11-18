import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Check,
  ChevronDown,
  Columns3,
  KeyRound,
  Layers,
  Lock,
  Search,
  Tag,
  X,
} from 'lucide-react';
import {
  DEFAULT_SHEET_COLUMN_SYNC_CONFIG,
  EpisodeGroupFilterMode,
  FootageRowFilterMode,
  ParsedEpisodeGroup,
  SheetColumnSyncConfig,
  SheetSyncSummaryStats,
} from './sheetImport.types';

interface SheetColumnSelectorBarProps {
  columnSyncConfig: SheetColumnSyncConfig;
  onChangeColumnSyncConfig: (next: SheetColumnSyncConfig) => void;
  syncEpisodesFromColD: boolean;
  stats: SheetSyncSummaryStats;
  activePreviewTab: 'FOOTAGE_ROWS' | 'EPISODE_GROUPS';
  onChangeActivePreviewTab: (tab: 'FOOTAGE_ROWS' | 'EPISODE_GROUPS') => void;
  rowFilterMode: FootageRowFilterMode;
  onChangeRowFilterMode: (mode: FootageRowFilterMode) => void;
  rowSearchQuery: string;
  onChangeRowSearchQuery: (q: string) => void;
  epFilterMode: EpisodeGroupFilterMode;
  onChangeEpFilterMode: (mode: EpisodeGroupFilterMode) => void;
  epSearchQuery: string;
  onChangeEpSearchQuery: (q: string) => void;
  episodeGroups: ParsedEpisodeGroup[];
  excludedRowIndices: Set<number>;
  autoCreateMissingFootage: boolean;
}

interface ColumnToggleItem {
  key: keyof SheetColumnSyncConfig;
  colBadge: string;
  label: string;
  desc: string;
}

const COLUMN_TOGGLE_ITEMS: ColumnToggleItem[] = [
  {
    key: 'syncColB_EpTitle',
    colBadge: 'Col B',
    label: 'ชื่อคลิป EP',
    desc: 'ถ้าปิด = ล็อกชื่อคลิปหลักในระบบไว้ ไม่เอาชื่อในชีทไปทับ',
  },
  {
    key: 'syncColC_RankTitle',
    colBadge: 'Col C',
    label: 'ชื่ออันดับ',
    desc: 'อัปเดตหัวข้ออันดับ 5–1 และโน้ตฟุตเทจ',
  },
  {
    key: 'syncColD_Punchline',
    colBadge: 'Col D',
    label: 'คำสร้อย',
    desc: 'อัปเดตคำสร้อย/มุกประจำอันดับลงสล็อต 5–1',
  },
  {
    key: 'syncColE_Tier1Tags',
    colBadge: 'Col E',
    label: 'แท็ก Tier 1',
    desc: 'หมวดกว้าง/วงการ (เช่น #คนดัง #ศิลปิน)',
  },
  {
    key: 'syncColF_Tier2Tags',
    colBadge: 'Col F',
    label: 'แท็ก Tier 2',
    desc: 'บริบท/สไตล์คลิป (เช่น #ไลฟ์สด #สัมภาษณ์)',
  },
  {
    key: 'syncColG_Tier3Tags',
    colBadge: 'Col G',
    label: 'แท็ก Tier 3',
    desc: 'ชื่อบุคคล/รายการเฉพาะ (เช่น #พี่เสก #โหนกระแส)',
  },
  {
    key: 'syncColH_Url',
    colBadge: 'Col H',
    label: 'ลิงก์ YouTube',
    desc: 'อัปเดตลิงก์ YouTube Shorts เข้าคลิปหลัก EP',
  },
  {
    key: 'syncColIJ_DateAndTime',
    colBadge: 'Col I–J',
    label: 'วันที่ & เวลาลง',
    desc: 'อัปเดตวันที่และรอบเช้า/เย็น (ถ้าปิด จะคงวันที่เดิมไว้)',
  },
];

type SyncScopePresetKey =
  | 'ALL'
  | 'KEEP_EP_TITLE'
  | 'TAGS_ONLY'
  | 'RANK_PUNCHLINE_ONLY'
  | 'CUSTOM';

export const SheetColumnSelectorBar: React.FC<SheetColumnSelectorBarProps> = ({
  columnSyncConfig,
  onChangeColumnSyncConfig,
  syncEpisodesFromColD,
  stats,
  activePreviewTab,
  onChangeActivePreviewTab,
  rowFilterMode,
  onChangeRowFilterMode,
  rowSearchQuery,
  onChangeRowSearchQuery,
  epFilterMode,
  onChangeEpFilterMode,
  epSearchQuery,
  onChangeEpSearchQuery,
  episodeGroups,
  excludedRowIndices,
  autoCreateMissingFootage,
}) => {
  const [isScopeOpen, setIsScopeOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isScopeOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node)
      ) {
        setIsScopeOpen(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsScopeOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isScopeOpen]);

  const handleToggleKey = (key: keyof SheetColumnSyncConfig) => {
    onChangeColumnSyncConfig({
      ...columnSyncConfig,
      [key]: !columnSyncConfig[key],
    });
  };

  const applyPresetAll = () => {
    onChangeColumnSyncConfig({ ...DEFAULT_SHEET_COLUMN_SYNC_CONFIG });
  };

  const applyPresetKeepSystemEpTitle = () => {
    onChangeColumnSyncConfig({
      syncColB_EpTitle: false,
      syncColC_RankTitle: true,
      syncColD_Punchline: true,
      syncColE_Tier1Tags: true,
      syncColF_Tier2Tags: true,
      syncColG_Tier3Tags: true,
      syncColH_Url: true,
      syncColIJ_DateAndTime: false,
    });
  };

  const applyPresetTagsOnly = () => {
    onChangeColumnSyncConfig({
      syncColB_EpTitle: false,
      syncColC_RankTitle: false,
      syncColD_Punchline: false,
      syncColE_Tier1Tags: true,
      syncColF_Tier2Tags: true,
      syncColG_Tier3Tags: true,
      syncColH_Url: false,
      syncColIJ_DateAndTime: false,
    });
  };

  const applyPresetPunchlineAndRankOnly = () => {
    onChangeColumnSyncConfig({
      syncColB_EpTitle: false,
      syncColC_RankTitle: true,
      syncColD_Punchline: true,
      syncColE_Tier1Tags: false,
      syncColF_Tier2Tags: false,
      syncColG_Tier3Tags: false,
      syncColH_Url: false,
      syncColIJ_DateAndTime: false,
    });
  };

  const detectActivePreset = (): SyncScopePresetKey => {
    const c = columnSyncConfig;
    if (
      c.syncColB_EpTitle &&
      c.syncColC_RankTitle &&
      c.syncColD_Punchline &&
      c.syncColE_Tier1Tags &&
      c.syncColF_Tier2Tags &&
      c.syncColG_Tier3Tags &&
      c.syncColH_Url &&
      c.syncColIJ_DateAndTime
    ) {
      return 'ALL';
    }
    if (
      !c.syncColB_EpTitle &&
      c.syncColC_RankTitle &&
      c.syncColD_Punchline &&
      c.syncColE_Tier1Tags &&
      c.syncColF_Tier2Tags &&
      c.syncColG_Tier3Tags &&
      c.syncColH_Url &&
      !c.syncColIJ_DateAndTime
    ) {
      return 'KEEP_EP_TITLE';
    }
    if (
      !c.syncColB_EpTitle &&
      !c.syncColC_RankTitle &&
      !c.syncColD_Punchline &&
      c.syncColE_Tier1Tags &&
      c.syncColF_Tier2Tags &&
      c.syncColG_Tier3Tags &&
      !c.syncColH_Url &&
      !c.syncColIJ_DateAndTime
    ) {
      return 'TAGS_ONLY';
    }
    if (
      !c.syncColB_EpTitle &&
      c.syncColC_RankTitle &&
      c.syncColD_Punchline &&
      !c.syncColE_Tier1Tags &&
      !c.syncColF_Tier2Tags &&
      !c.syncColG_Tier3Tags &&
      !c.syncColH_Url &&
      !c.syncColIJ_DateAndTime
    ) {
      return 'RANK_PUNCHLINE_ONLY';
    }
    return 'CUSTOM';
  };

  const activePreset = detectActivePreset();
  const enabledCount = Object.values(columnSyncConfig).filter(Boolean).length;

  const activePresetShortLabel =
    activePreset === 'ALL'
      ? 'ครบทุกช่อง'
      : activePreset === 'KEEP_EP_TITLE'
      ? 'ไม่ทับชื่อ EP'
      : activePreset === 'TAGS_ONLY'
      ? 'เฉพาะแท็ก'
      : activePreset === 'RANK_PUNCHLINE_ONLY'
      ? 'อันดับ & คำสร้อย'
      : 'กำหนดเอง';

  const presetItems: Array<{
    key: Exclude<SyncScopePresetKey, 'CUSTOM'>;
    label: string;
    onClick: () => void;
    title: string;
  }> = [
    {
      key: 'ALL',
      label: 'ครบทุกช่อง (B–J)',
      onClick: applyPresetAll,
      title: 'ซิงก์ครบทั้งชื่อ EP, ชื่ออันดับ, คำสร้อย, แท็ก 3 ชั้น, ลิงก์ และวันที่ลง',
    },
    {
      key: 'KEEP_EP_TITLE',
      label: 'คำสร้อย + แท็ก (ไม่ทับชื่อ EP)',
      onClick: applyPresetKeepSystemEpTitle,
      title: 'ล็อกชื่อคลิป EP และวันที่เดิมในระบบไว้ แล้วอัปเดตเฉพาะอันดับ คำสร้อย และแท็ก',
    },
    {
      key: 'TAGS_ONLY',
      label: 'เฉพาะ Tag 3 Tier',
      onClick: applyPresetTagsOnly,
      title: 'อัปเดตเฉพาะแท็ก Tier 1–3 ของฟุตเทจอย่างเดียว',
    },
    {
      key: 'RANK_PUNCHLINE_ONLY',
      label: 'เฉพาะอันดับ & คำสร้อย',
      onClick: applyPresetPunchlineAndRankOnly,
      title: 'อัปเดตเฉพาะชื่ออันดับ (Col C) และคำสร้อย (Col D)',
    },
  ];

  // Episode Group filter counts for when EPISODE_GROUPS view is active
  const epFilterCounts = useMemo(() => {
    let issues = 0;
    let complete = 0;
    let newEp = 0;
    let updateEp = 0;

    episodeGroups.forEach((g) => {
      const activeRowsCount = g.rows.filter(
        (r) => !excludedRowIndices.has(r.rowIndex)
      ).length;
      const hasIssue =
        activeRowsCount !== 5 ||
        (!autoCreateMissingFootage && g.missingFootageCount > 0) ||
        g.hasDuplicateClipsInGroup;

      if (hasIssue) issues += 1;
      else complete += 1;

      if (g.existingEpisode) updateEp += 1;
      else newEp += 1;
    });

    return { issues, complete, newEp, updateEp };
  }, [episodeGroups, excludedRowIndices, autoCreateMissingFootage]);

  const rowFilterButtons: Array<{
    mode: FootageRowFilterMode;
    label: string;
    count: number;
    activeTextClass: string;
    show?: boolean;
  }> = [
    {
      mode: 'ALL',
      label: 'ทั้งหมด',
      count: stats.totalRows,
      activeTextClass: 'text-[#3D332A]',
      show: true,
    },
    {
      mode: 'MATCHED_ONLY',
      label: 'ตรงกับคลัง',
      count: stats.matchedCount,
      activeTextClass: 'text-[#1C4824]',
      show: true,
    },
    {
      mode: 'STAGING_ONLY',
      label: 'ไร้หมวดหมู่',
      count: stats.stagingMatchedCount,
      activeTextClass: 'text-[#734B17]',
      show: true,
    },
    {
      mode: 'UNMATCHED_ONLY',
      label: 'ไม่พบในคลัง',
      count: stats.unmatchedCount,
      activeTextClass: 'text-[#8A4D1F]',
      show: true,
    },
    {
      mode: 'DUPLICATE_ONLY',
      label: 'ซ้ำข้าม EP',
      count: stats.duplicateRowsInSheetCount,
      activeTextClass: 'text-[#734B17]',
      show: stats.duplicateRowsInSheetCount > 0,
    },
  ];

  const epFilterButtons: Array<{
    mode: EpisodeGroupFilterMode;
    label: string;
    count: number;
    activeTextClass: string;
  }> = [
    {
      mode: 'ALL',
      label: 'ทั้งหมด',
      count: episodeGroups.length,
      activeTextClass: 'text-[#3D332A]',
    },
    {
      mode: 'ISSUES_ONLY',
      label: 'ไม่ครบ 5 อันดับ',
      count: epFilterCounts.issues,
      activeTextClass: 'text-[#8A4D1F]',
    },
    {
      mode: 'COMPLETE_ONLY',
      label: 'ครบ 5 อันดับ',
      count: epFilterCounts.complete,
      activeTextClass: 'text-[#1C4824]',
    },
    {
      mode: 'NEW_EP_ONLY',
      label: 'EP ใหม่',
      count: epFilterCounts.newEp,
      activeTextClass: 'text-[#1C4824]',
    },
    {
      mode: 'UPDATE_EP_ONLY',
      label: 'อัปเดต EP เดิม',
      count: epFilterCounts.updateEp,
      activeTextClass: 'text-[#734B17]',
    },
  ];

  const isRowsView = activePreviewTab === 'FOOTAGE_ROWS';
  const currentSearch = isRowsView ? rowSearchQuery : epSearchQuery;
  const handleSearchChange = isRowsView
    ? onChangeRowSearchQuery
    : onChangeEpSearchQuery;

  return (
    <div className="px-4 sm:px-5 py-2 bg-[#FAF8F5] border-b border-[#E8DFD3] shrink-0 flex flex-wrap items-center justify-between gap-2.5">
      {/* Left + Center: Segmented View Switcher + Filter Pills */}
      <div className="flex flex-wrap items-center gap-2 min-w-0">
        {/* 1. iOS Segmented View Switcher */}
        <div className="inline-flex items-center p-0.5 rounded-xl bg-[#E8DFD3] border border-[#DDD0C0] text-xs shrink-0">
          <button
            type="button"
            onClick={() => onChangeActivePreviewTab('FOOTAGE_ROWS')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap ${
              isRowsView
                ? 'bg-white text-[#2D241E] shadow-2xs'
                : 'text-[#6E5F52] hover:text-[#2D241E]'
            }`}
          >
            <Tag className="w-3.5 h-3.5 text-[#3B6845]" />
            <span>ฟุตเทจ ({stats.totalRows.toLocaleString()})</span>
          </button>

          {syncEpisodesFromColD && stats.episodeGroupsCount > 0 && (
            <button
              type="button"
              onClick={() => onChangeActivePreviewTab('EPISODE_GROUPS')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap ${
                !isRowsView
                  ? 'bg-white text-[#2D241E] shadow-2xs'
                  : 'text-[#6E5F52] hover:text-[#2D241E]'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-[#3B6845]" />
              <span>กลุ่ม EP ({stats.episodeGroupsCount.toLocaleString()})</span>
              {stats.incompleteEpisodesCount > 0 && (
                <span className="text-[10px] font-mono font-bold text-[#8A4D1F] tabular-nums">
                  !{stats.incompleteEpisodesCount}
                </span>
              )}
            </button>
          )}
        </div>

        {/* 2. Compact Status Filter Pills */}
        <div className="flex flex-wrap items-center gap-1 p-0.5 bg-[#EFE7DC] rounded-xl text-xs">
          {isRowsView
            ? rowFilterButtons
                .filter((btn) => btn.show !== false)
                .map((btn) => {
                  const isActive = rowFilterMode === btn.mode;
                  return (
                    <button
                      key={btn.mode}
                      type="button"
                      onClick={() => onChangeRowFilterMode(btn.mode)}
                      className={`px-2 py-1 rounded-lg font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                        isActive
                          ? `bg-white shadow-2xs ${btn.activeTextClass}`
                          : 'text-[#6E5F52] hover:text-[#3D332A]'
                      }`}
                    >
                      <span>{btn.label}</span>{' '}
                      <span className="font-mono tabular-nums text-[11px] opacity-85">
                        ({btn.count.toLocaleString()})
                      </span>
                    </button>
                  );
                })
            : epFilterButtons.map((btn) => {
                const isActive = epFilterMode === btn.mode;
                return (
                  <button
                    key={btn.mode}
                    type="button"
                    onClick={() => onChangeEpFilterMode(btn.mode)}
                    className={`px-2 py-1 rounded-lg font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                      isActive
                        ? `bg-white shadow-2xs ${btn.activeTextClass}`
                        : 'text-[#6E5F52] hover:text-[#3D332A]'
                    }`}
                  >
                    <span>{btn.label}</span>{' '}
                    <span className="font-mono tabular-nums text-[11px] opacity-85">
                      ({btn.count.toLocaleString()})
                    </span>
                  </button>
                );
              })}
        </div>
      </div>

      {/* Right: Search Input + Consolidated Sync Scope Dropdown Button */}
      <div className="flex flex-wrap items-center gap-2 ml-auto">
        <div className="relative min-w-[175px] flex-1 sm:w-56">
          <Search className="w-3.5 h-3.5 text-[#8C7B6C] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={currentSearch}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder={
              isRowsView
                ? 'ค้นหาชื่อฟุต, คำสร้อย, #แท็ก...'
                : 'ค้นหาชื่อคลิป EP, ซีรีส์...'
            }
            className="w-full pl-8 pr-7 py-1.5 rounded-xl bg-white border border-[#E3D8CB] text-xs text-[#3D332A] placeholder:text-[#A39485] focus:outline-none focus:border-[#8FA892]"
          />
          {currentSearch && (
            <button
              type="button"
              onClick={() => handleSearchChange('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8C7B6C] hover:text-[#3D332A] cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Single Consolidated Sync Scope Popover Button */}
        <div className="relative shrink-0" ref={popoverRef}>
          <button
            type="button"
            onClick={() => setIsScopeOpen((prev) => !prev)}
            aria-expanded={isScopeOpen}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              isScopeOpen || activePreset !== 'ALL'
                ? 'bg-[#EEF5EE] text-[#1C4824] border-[#9CC5A4]'
                : 'bg-white hover:bg-[#FAF7F2] text-[#524538] border-[#E2D5C4]'
            }`}
            title="เลือกขอบเขตข้อมูลและคอลัมน์ที่จะอนุญาตให้ซิงก์ (Col B–J)"
          >
            <Columns3 className="w-3.5 h-3.5 text-[#3B6845]" />
            <span>ซิงก์: {activePresetShortLabel}</span>
            <span className="font-mono text-[11px] tabular-nums opacity-80">
              ({enabledCount}/8)
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform ${
                isScopeOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          <AnimatePresence>
            {isScopeOpen && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.97 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-80 sm:w-96 p-3.5 rounded-2xl bg-white border border-[#E8DFD3] shadow-xl z-50 space-y-2.5 text-left"
              >
                <div className="flex items-center justify-between border-b border-[#F2EBE0] pb-2">
                  <span className="text-xs font-extrabold text-[#3D332A]">
                    ขอบเขตข้อมูลที่จะซิงก์ ({enabledCount}/8 คอลัมน์)
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsScopeOpen(false)}
                    className="text-[11px] font-semibold text-[#7D6E61] hover:text-[#3D332A] cursor-pointer"
                  >
                    ปิด
                  </button>
                </div>

                {/* Quick Presets */}
                <div className="space-y-1">
                  <div className="text-[11px] font-bold text-[#7D6E61] px-0.5">
                    โหมดลัด (เลือกได้ในคลิกเดียว)
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {presetItems.map((preset) => {
                      const isActive = activePreset === preset.key;
                      return (
                        <button
                          key={preset.key}
                          type="button"
                          onClick={preset.onClick}
                          title={preset.title}
                          className={`px-2.5 py-2 rounded-xl text-left text-[11px] font-bold border transition-colors cursor-pointer ${
                            isActive
                              ? 'bg-[#EEF5EE] border-[#3B6845] text-[#1C4824]'
                              : 'bg-[#FAF8F5] hover:bg-[#F2EBE0] border-[#E8DFD3] text-[#524538]'
                          }`}
                        >
                          {preset.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Locked Primary Key Info */}
                <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-[#FAF8F5] border border-[#E8DFD3] text-[11px] text-[#6E5F52]">
                  <KeyRound className="w-3.5 h-3.5 text-[#3B6845] shrink-0" />
                  <span>
                    <strong className="font-mono text-[#3D332A]">Col A</strong>{' '}
                    ใช้จับคู่ฟุตเทจเสมอ (ไม่แก้ชื่อในคลัง)
                  </span>
                </div>

                {/* Individual Column Checkboxes */}
                <div className="space-y-1 max-h-60 overflow-y-auto scrollbar-thin pr-0.5">
                  {COLUMN_TOGGLE_ITEMS.map((item) => {
                    const isChecked = columnSyncConfig[item.key];
                    const isEpRelatedDisabled =
                      !syncEpisodesFromColD &&
                      (item.key === 'syncColB_EpTitle' ||
                        item.key === 'syncColH_Url' ||
                        item.key === 'syncColIJ_DateAndTime');

                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => handleToggleKey(item.key)}
                        disabled={isEpRelatedDisabled}
                        className={`w-full flex items-start gap-2.5 px-2.5 py-1.5 rounded-xl border text-left transition-colors ${
                          isEpRelatedDisabled
                            ? 'bg-[#FAF8F5] border-[#EDE5D9] opacity-50 cursor-not-allowed'
                            : isChecked
                            ? 'bg-[#FAFDF9] hover:bg-[#EEF5EE]/60 border-[#BAD8BF] cursor-pointer'
                            : 'bg-white hover:bg-[#FAF7F2] border-[#E8DFD3] cursor-pointer opacity-80'
                        }`}
                      >
                        <span
                          className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center border shrink-0 ${
                            isChecked && !isEpRelatedDisabled
                              ? 'bg-[#3B6845] border-[#3B6845] text-white'
                              : 'bg-white border-[#C5B49E]'
                          }`}
                        >
                          {isChecked && !isEpRelatedDisabled && (
                            <Check className="w-3 h-3 stroke-[3]" />
                          )}
                        </span>

                        <div className="min-w-0 flex-1 text-xs">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-[10px] font-bold text-[#6E5F52] bg-[#EFE7DC] px-1.5 py-0.5 rounded">
                              {item.colBadge}
                            </span>
                            <span className="font-bold text-[#3D332A]">
                              {item.label}
                            </span>
                            {!isChecked && !isEpRelatedDisabled && (
                              <span className="text-[10px] text-[#8A4D1F] font-semibold inline-flex items-center gap-0.5 ml-auto">
                                <Lock className="w-2.5 h-2.5" /> ล็อกไว้
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-[#7D6E61] mt-0.5 leading-snug">
                            {item.desc}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
