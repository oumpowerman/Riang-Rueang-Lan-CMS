import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  AlertTriangle,
  CheckSquare,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Film,
  HardDrive,
  Layers,
  Pickaxe,
  Plus,
  Rocket,
  RotateCcw,
  Scissors,
  Search,
  Sparkles,
  Square,
  Tag,
  TrendingUp,
  Video,
  Zap,
} from 'lucide-react';
import { useCMS } from '../../context/CMSContext';
import { SourcePlatform, RawSource } from '../../types/source.types';
import { formatThaiDate, hasRealDriveLink } from '../../utils/fileNameGenerator';
import { PaginationBar } from '../ui/PaginationBar';
import { StatusBadge } from '../ui/StatusBadge';
import { TagPill } from '../ui/TagPill';
import { GoogleDriveSource1ToNModal } from './GoogleDriveSource1ToNModal';
import { SourceTimelineBar } from './SourceTimelineBar';

type MiningQuickFilter = 'ALL' | 'UNDER_MINED' | 'HAS_READY_CLIPS';

export const SourceLibraryView: React.FC = () => {
  const {
    sources,
    tags,
    categoryGroups,
    computedFootageMap,
    tagMap,
    settings,
    openSourceSplitterFor,
    setTraceabilityFootageId,
    launchEpisodeBuilderForCategory,
    launchEpisodeBuilderWithCustomClips,
  } = useCMS();

  // Filter & Sort state for Parent Sources
  const [searchQuery, setSearchQuery] = useState('');
  const [platformFilter, setPlatformFilter] = useState<SourcePlatform | 'ALL'>('ALL');
  const [selectedGroupId, setSelectedGroupId] = useState<string>('ALL');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showAllTags, setShowAllTags] = useState(false);
  const [miningFilter, setMiningFilter] = useState<MiningQuickFilter>('ALL');
  const [underMinedThreshold, setUnderMinedThreshold] = useState<number>(3); // Default: < 3 clips (0-2 clips)
  const [sortBy, setSortBy] = useState<'NEWEST' | 'MOST_CLIPS' | 'MOST_USABLE' | 'LEAST_MINED'>(
    'NEWEST'
  );

  // Google Drive 1:N Modal state
  const [isDrive1ToNOpen, setIsDrive1ToNOpen] = useState(false);

  // Selected child clips per source for direct hand-off to Episode Builder (Dimension 5)
  const [selectedClipIdsBySource, setSelectedClipIdsBySource] = useState<
    Record<string, string[]>
  >({});

  // Parent Source Pagination
  const [sourcePage, setSourcePage] = useState(1);
  const [sourcePageSize, setSourcePageSize] = useState(3);

  // Child Split-Footage Pagination per Source ID
  const [childPageMap, setChildPageMap] = useState<Record<string, number>>({});
  const [childPageSize, setChildPageSize] = useState(4);

  useEffect(() => {
    setSourcePage(1);
  }, [
    searchQuery,
    platformFilter,
    selectedGroupId,
    selectedTags,
    miningFilter,
    underMinedThreshold,
    sortBy,
  ]);

  // Helper: check if a source or any of its split child clips has a tag
  const sourceMatchesTagDeep = (src: RawSource, tagId: string): boolean => {
    if (src.tags.includes(tagId)) return true;
    return src.splitFootageIds.some((fid: string) => {
      const ft = computedFootageMap[fid];
      return ft ? ft.tags.includes(tagId) : false;
    });
  };

  // Compute source count per tag (deep matching: parent source + split child clips)
  const tagSourceCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const tag of tags) {
      counts[tag.id] = sources.filter((src) => sourceMatchesTagDeep(src, tag.id)).length;
    }
    return counts;
  }, [tags, sources, computedFootageMap]);

  // Compute KPI metrics (Dimension 2)
  const miningKpis = useMemo(() => {
    const totalSources = sources.length;
    let totalSplitClips = 0;
    let totalReadySplitClips = 0;
    let underMinedSourcesCount = 0;
    let sourcesWithReadyClipsCount = 0;

    for (const src of sources) {
      const children = src.splitFootageIds
        .map((fid) => computedFootageMap[fid])
        .filter(Boolean);
      const count = children.length;
      totalSplitClips += count;

      if (count < underMinedThreshold) {
        underMinedSourcesCount += 1;
      }

      const readyCount = children.filter(
        (ft) =>
          ft.cooldownStatus === 'NEW_UNTOUCHED' || ft.cooldownStatus === 'READY_FRESH'
      ).length;
      totalReadySplitClips += readyCount;
      if (readyCount > 0) {
        sourcesWithReadyClipsCount += 1;
      }
    }

    const avgYield =
      totalSources > 0 ? (totalSplitClips / totalSources).toFixed(1) : '0.0';

    return {
      totalSources,
      totalSplitClips,
      avgYield,
      underMinedSourcesCount,
      totalReadySplitClips,
      sourcesWithReadyClipsCount,
    };
  }, [sources, computedFootageMap, underMinedThreshold]);

  // Filter tags for the 3-Tier Compact Bar (Dimension 1)
  const visibleTagsForBar = useMemo(() => {
    const groupFiltered =
      selectedGroupId === 'ALL'
        ? tags
        : tags.filter((t) => t.groupId === selectedGroupId);

    const activeOnly = groupFiltered.filter(
      (t) => (tagSourceCounts[t.id] || 0) > 0 || selectedTags.includes(t.id)
    );

    if (showAllTags) {
      return [...groupFiltered].sort(
        (a, b) => (tagSourceCounts[b.id] || 0) - (tagSourceCounts[a.id] || 0)
      );
    }

    return activeOnly.sort(
      (a, b) => (tagSourceCounts[b.id] || 0) - (tagSourceCounts[a.id] || 0)
    );
  }, [tags, selectedGroupId, tagSourceCounts, selectedTags, showAllTags]);

  const hiddenZeroTagCount = useMemo(() => {
    const groupFiltered =
      selectedGroupId === 'ALL'
        ? tags
        : tags.filter((t) => t.groupId === selectedGroupId);
    const activeCount = groupFiltered.filter(
      (t) => (tagSourceCounts[t.id] || 0) > 0 || selectedTags.includes(t.id)
    ).length;
    return Math.max(0, groupFiltered.length - activeCount);
  }, [tags, selectedGroupId, tagSourceCounts, selectedTags]);

  const handleToggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setPlatformFilter('ALL');
    setSelectedGroupId('ALL');
    setSelectedTags([]);
    setMiningFilter('ALL');
    setSortBy('NEWEST');
    setSourcePage(1);
  };

  const filteredAndSortedSources = useMemo(() => {
    const filtered = sources.filter((src) => {
      if (platformFilter !== 'ALL' && src.platform !== platformFilter) return false;

      const children = src.splitFootageIds
        .map((fid) => computedFootageMap[fid])
        .filter(Boolean);

      // Mining KPI quick filter
      if (miningFilter === 'UNDER_MINED' && children.length >= underMinedThreshold) {
        return false;
      }
      if (miningFilter === 'HAS_READY_CLIPS') {
        const hasReady = children.some(
          (ft) =>
            ft.cooldownStatus === 'NEW_UNTOUCHED' || ft.cooldownStatus === 'READY_FRESH'
        );
        if (!hasReady) return false;
      }

      // Group filter (matches parent tag or child clip tag in that group)
      if (selectedGroupId !== 'ALL') {
        const groupTagIds = new Set(
          tags.filter((t) => t.groupId === selectedGroupId).map((t) => t.id)
        );
        const inParent = src.tags.some((tid) => groupTagIds.has(tid));
        const inChild = children.some((ft) => ft.tags.some((tid) => groupTagIds.has(tid)));
        if (!inParent && !inChild) return false;
      }

      // Selected Tags filter (Deep match: parent source OR child split footage)
      if (selectedTags.length > 0) {
        const hasTag = selectedTags.some((tid) => sourceMatchesTagDeep(src, tid));
        if (!hasTag) return false;
      }

      // Search query
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const inId = src.id.toLowerCase().includes(q);
        const inTitle = src.title.toLowerCase().includes(q);
        const inCreator = src.channelOrCreator.toLowerCase().includes(q);
        const inNotes = src.notes.toLowerCase().includes(q);
        const inChildClip = children.some(
          (ft) =>
            ft.id.toLowerCase().includes(q) ||
            ft.title.toLowerCase().includes(q) ||
            (ft.mascotNotes && ft.mascotNotes.toLowerCase().includes(q))
        );
        if (!inId && !inTitle && !inCreator && !inNotes && !inChildClip) return false;
      }
      return true;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === 'MOST_CLIPS') {
        return b.splitFootageIds.length - a.splitFootageIds.length;
      }
      if (sortBy === 'LEAST_MINED') {
        return a.splitFootageIds.length - b.splitFootageIds.length;
      }
      if (sortBy === 'MOST_USABLE') {
        const usableA = a.splitFootageIds.filter((fid) => {
          const ft = computedFootageMap[fid];
          return (
            ft &&
            (ft.cooldownStatus === 'NEW_UNTOUCHED' ||
              ft.cooldownStatus === 'READY_FRESH')
          );
        }).length;
        const usableB = b.splitFootageIds.filter((fid) => {
          const ft = computedFootageMap[fid];
          return (
            ft &&
            (ft.cooldownStatus === 'NEW_UNTOUCHED' ||
              ft.cooldownStatus === 'READY_FRESH')
          );
        }).length;
        return usableB - usableA;
      }
      return b.createdAt.localeCompare(a.createdAt);
    });
  }, [
    sources,
    platformFilter,
    miningFilter,
    underMinedThreshold,
    selectedGroupId,
    selectedTags,
    searchQuery,
    sortBy,
    computedFootageMap,
    tags,
  ]);

  const paginatedSources = useMemo(() => {
    const start = (sourcePage - 1) * sourcePageSize;
    return filteredAndSortedSources.slice(start, start + sourcePageSize);
  }, [filteredAndSortedSources, sourcePage, sourcePageSize]);

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    platformFilter !== 'ALL' ||
    selectedGroupId !== 'ALL' ||
    selectedTags.length > 0 ||
    miningFilter !== 'ALL';

  // Toggle selection of a child clip for Episode Builder hand-off
  const handleToggleSelectClip = (sourceId: string, footageId: string) => {
    setSelectedClipIdsBySource((prev) => {
      const current = prev[sourceId] || [];
      if (current.includes(footageId)) {
        return { ...prev, [sourceId]: current.filter((id) => id !== footageId) };
      }
      if (current.length >= 5) {
        return { ...prev, [sourceId]: [...current.slice(1), footageId] };
      }
      return { ...prev, [sourceId]: [...current, footageId] };
    });
  };

  const handleSelectTop5ReadyInSource = (src: RawSource) => {
    const readyIds = src.splitFootageIds
      .map((fid: string) => computedFootageMap[fid])
      .filter(
        (ft) =>
          Boolean(ft) &&
          (ft.cooldownStatus === 'NEW_UNTOUCHED' || ft.cooldownStatus === 'READY_FRESH')
      )
      .slice(0, 5)
      .map((ft) => ft.id);

    setSelectedClipIdsBySource((prev) => ({
      ...prev,
      [src.id]: readyIds,
    }));
  };

  return (
    <div className="space-y-5">
      {/* Studio Header */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white border border-slate-200 rounded-2xl p-5">
        <div className="space-y-1">
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Scissors className="w-5 h-5 text-indigo-600" />
            <span>
              สตูดิโอวางแผนขุดทองจากไลฟ์สด (Flow B: 1-to-Many Source Mining Studio)
            </span>
          </h1>
          <p className="text-xs text-slate-500">
            บริหารคลิปต้นฉบับยาว (`SRC-XXXX`) วิเคราะห์ช่วงเวลาที่ยังขุดไม่ครบ ดึงโฟลเดอร์ไลฟ์จาก Google Drive แบบ 1:N และส่งช็อตเด็ดเข้าหน้าจัด 5 อันดับได้ทันที
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setIsDrive1ToNOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-colors whitespace-nowrap cursor-pointer"
          >
            <HardDrive className="w-4 h-4" />
            <span>+ ดึงโฟลเดอร์ไลฟ์จาก Google Drive (1:N)</span>
          </button>

          <button
            type="button"
            onClick={() => openSourceSplitterFor(null)}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors whitespace-nowrap cursor-pointer"
          >
            <Scissors className="w-4 h-4" />
            <span>+ ลงทะเบียนคลิปยาว & หั่นหลายฟุต (Flow 1:N)</span>
          </button>
        </div>
      </div>

      {/* Dimension 2: 4-Card Source Yield & Mining KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
        {/* KPI 1: Total Sources */}
        <button
          type="button"
          onClick={() => setMiningFilter('ALL')}
          className={`text-left p-4 rounded-2xl border transition-all cursor-pointer ${
            miningFilter === 'ALL'
              ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
              : 'bg-white text-slate-900 border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span
              className={`text-xs font-bold ${
                miningFilter === 'ALL' ? 'text-slate-300' : 'text-slate-500'
              }`}
            >
              คลิปยาวต้นฉบับทั้งหมด (Total Sources)
            </span>
            <Video
              className={`w-4 h-4 ${
                miningFilter === 'ALL' ? 'text-indigo-400' : 'text-indigo-600'
              }`}
            />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold font-mono tabular-nums">
              {miningKpis.totalSources}
            </span>
            <span
              className={`text-xs font-medium ${
                miningFilter === 'ALL' ? 'text-slate-300' : 'text-slate-500'
              }`}
            >
              ไลฟ์ต้นฉบับในคลัง
            </span>
          </div>
          <div
            className={`mt-1.5 text-[11px] ${
              miningFilter === 'ALL' ? 'text-indigo-300 font-semibold' : 'text-slate-400'
            }`}
          >
            คลิกเพื่อดูคลิปยาวต้นฉบับทั้งหมด
          </div>
        </button>

        {/* KPI 2: Average Yield Rate */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-500">
              อัตราการขุดช็อตฮา (Average Yield Rate)
            </span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold font-mono tabular-nums text-slate-900">
              {miningKpis.avgYield}
            </span>
            <span className="text-xs font-semibold text-emerald-700">
              ฟุตย่อย / 1 ไลฟ์
            </span>
          </div>
          <div className="mt-1.5 text-[11px] text-slate-500 font-mono tabular-nums">
            หั่นช็อตย่อยสะสมแล้วรวม {miningKpis.totalSplitClips} ฟุต
          </div>
        </div>

        {/* KPI 3: Under-mined Sources */}
        <div
          onClick={() =>
            setMiningFilter((prev) => (prev === 'UNDER_MINED' ? 'ALL' : 'UNDER_MINED'))
          }
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            miningFilter === 'UNDER_MINED'
              ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-500/20'
              : 'bg-white border-slate-200 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-amber-800 inline-flex items-center gap-1">
              <Pickaxe className="w-3.5 h-3.5 text-amber-600" />
              <span>ไลฟ์ที่ยังขุดไม่คุ้ม (Under-mined)</span>
            </span>
            <select
              value={underMinedThreshold}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => {
                setUnderMinedThreshold(Number(e.target.value));
                setMiningFilter('UNDER_MINED');
              }}
              className="text-[11px] font-mono font-bold bg-amber-100/80 text-amber-900 border border-amber-300 rounded-md px-1.5 py-0.5 cursor-pointer"
            >
              <option value={3}>&lt; 3 ฟุต (0–2 ช็อต)</option>
              <option value={5}>&lt; 5 ฟุต (0–4 ช็อต)</option>
              <option value={1}>0 ฟุต (ยังไม่หั่น)</option>
            </select>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold font-mono tabular-nums text-amber-900">
              {miningKpis.underMinedSourcesCount}
            </span>
            <span className="text-xs font-semibold text-amber-700">
              ไลฟ์ที่รอขุดมุกเพิ่ม
            </span>
          </div>
          <div className="mt-1.5 text-[11px] text-amber-700 font-medium">
            {miningFilter === 'UNDER_MINED'
              ? 'กำลังกรองเฉพาะไลฟ์ที่ยังขุดไม่คุ้ม (คลิกเพื่อยกเลิก)'
              : 'คลิกเพื่อกรองไลฟ์ที่หั่นน้อยกว่าเกณฑ์'}
          </div>
        </div>

        {/* KPI 4: Ready Split Clips */}
        <button
          type="button"
          onClick={() =>
            setMiningFilter((prev) =>
              prev === 'HAS_READY_CLIPS' ? 'ALL' : 'HAS_READY_CLIPS'
            )
          }
          className={`text-left p-4 rounded-2xl border transition-all cursor-pointer ${
            miningFilter === 'HAS_READY_CLIPS'
              ? 'bg-emerald-50 border-emerald-600 ring-2 ring-emerald-500/20'
              : 'bg-white border-slate-200 hover:border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-emerald-800">
              ฟุตย่อยพร้อมใช้งาน (Ready Split Clips)
            </span>
            <Zap className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold font-mono tabular-nums text-emerald-900">
              {miningKpis.totalReadySplitClips}
            </span>
            <span className="text-xs font-semibold text-emerald-700">
              ช็อตสดใหม่พร้อมจัด 5 อันดับ
            </span>
          </div>
          <div className="mt-1.5 text-[11px] text-emerald-700 font-medium">
            กระจายอยู่ใน {miningKpis.sourcesWithReadyClipsCount} ไลฟ์ต้นฉบับ (คลิกเพื่อกรอง)
          </div>
        </button>
      </div>

      {/* Dimension 1: Smart Filter & 3-Tier Compact Bar */}
      <div className="studio-card border border-slate-200/90 rounded-2xl p-4 space-y-3 bg-white">
        {/* Top Row: Search, Platform, Sort */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหารหัส SRC-XXXX, ชื่อไลฟ์สด, ช่องต้นทาง หรือชื่อฟุตย่อยที่หั่นออกมา..."
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-900 focus:bg-white"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-xl">
            {(
              [
                { id: 'ALL', label: 'ทุกแพลตฟอร์ม' },
                { id: 'FACEBOOK', label: 'Facebook' },
                { id: 'YOUTUBE', label: 'YouTube' },
                { id: 'TIKTOK', label: 'TikTok' },
              ] as const
            ).map((plat) => (
              <motion.button
                key={plat.id}
                type="button"
                whileTap={{ scale: 0.95 }}
                onClick={() => setPlatformFilter(plat.id)}
                className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                  platformFilter === plat.id
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {plat.label}
              </motion.button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600 whitespace-nowrap">
              เรียงตาม:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="px-3 py-1.5 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none cursor-pointer"
            >
              <option value="NEWEST">วันที่เพิ่มล่าสุด</option>
              <option value="MOST_USABLE">มีฟุตพร้อมใช้มากสุด</option>
              <option value="MOST_CLIPS">หั่นฟุตย่อยได้เยอะสุด</option>
              <option value="LEAST_MINED">ไลฟ์ที่ยังหั่นน้อยสุด (รอขุดเพิ่ม)</option>
            </select>
          </div>
        </div>

        {/* Tier 0: Category Group Tabs */}
        <div className="pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-bold text-slate-500 mr-1 inline-flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
              <span>กลุ่มหมวดใหญ่ (Tier 0):</span>
            </span>
            <button
              type="button"
              onClick={() => setSelectedGroupId('ALL')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                selectedGroupId === 'ALL'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              ทุกกลุ่มหมวด ({tags.length})
            </button>
            {categoryGroups.map((grp) => (
              <button
                key={grp.id}
                type="button"
                onClick={() => setSelectedGroupId(grp.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  selectedGroupId === grp.id
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {grp.name}
              </button>
            ))}
          </div>

          <span className="text-[11px] text-slate-500">
            *รองรับการค้นหาลึกถึงหมวดของฟุตย่อยที่หั่นออกมาในไลฟ์นั้นด้วย
          </span>
        </div>

        {/* Smart Active Tags Bar (with counts + collapse/expand 54+ tags) */}
        <div className="pt-2.5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5 flex-1">
            <span className="text-xs font-semibold text-slate-500 mr-1 inline-flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-slate-400" />
              <span>
                {showAllTags
                  ? 'ทุกหมวดหมู่ทั้งหมด:'
                  : 'หมวดที่มีไลฟ์ต้นฉบับหรือฟุตย่อยอยู่จริง:'}
              </span>
            </span>

            {visibleTagsForBar.length === 0 ? (
              <span className="text-xs text-slate-400 italic">
                ยังไม่มีคลิปต้นฉบับในกลุ่มหมวดนี้
              </span>
            ) : (
              visibleTagsForBar.map((tag) => (
                <TagPill
                  key={tag.id}
                  tag={tag}
                  count={tagSourceCounts[tag.id] || 0}
                  selected={selectedTags.includes(tag.id)}
                  onClick={() => handleToggleTag(tag.id)}
                />
              ))
            )}

            {hiddenZeroTagCount > 0 && !showAllTags && (
              <button
                type="button"
                onClick={() => setShowAllTags(true)}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors cursor-pointer"
              >
                <ChevronDown className="w-3.5 h-3.5" />
                <span>+ ดูทุกหมวดทั้งหมด (+{hiddenZeroTagCount} หมวดว่าง)</span>
              </button>
            )}

            {showAllTags && (
              <button
                type="button"
                onClick={() => setShowAllTags(false)}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors cursor-pointer"
              >
                <ChevronUp className="w-3.5 h-3.5" />
                <span>ย่อแสดงเฉพาะหมวดที่มีคลิป</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
            <span className="text-xs font-mono font-bold text-slate-700 inline-flex items-center gap-1.5">
              <Video className="w-3.5 h-3.5 text-indigo-600" />
              <span>พบ {filteredAndSortedSources.length} คลิปต้นฉบับยาว</span>
            </span>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-800 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>ล้างตัวกรอง</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Sources List with Parent & Child Pagination */}
      {filteredAndSortedSources.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-3">
          <p className="text-sm font-bold text-slate-900">
            ไม่พบคลิปต้นฉบับยาวตามตัวกรองที่เลือก
          </p>
          <p className="text-xs text-slate-500">
            คุณสามารถล้างตัวกรอง หรือกดดึงโฟลเดอร์ไลฟ์สดจาก Google Drive แบบ 1:N เพื่อเพิ่มไลฟ์ต้นฉบับเข้าคลังได้ทันที
          </p>
          <div className="flex items-center justify-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 cursor-pointer"
            >
              ล้างตัวกรองทั้งหมด
            </button>
            <button
              type="button"
              onClick={() => setIsDrive1ToNOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 cursor-pointer"
            >
              <HardDrive className="w-3.5 h-3.5" />
              <span>ดึงโฟลเดอร์ไลฟ์จาก Google Drive (1:N)</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {paginatedSources.map((src) => {
            const childFootages = src.splitFootageIds
              .map((fid) => computedFootageMap[fid])
              .filter(Boolean);

            const usableChildrenCount = childFootages.filter(
              (ft) =>
                ft.cooldownStatus === 'NEW_UNTOUCHED' ||
                ft.cooldownStatus === 'READY_FRESH'
            ).length;

            const isUnderMined = childFootages.length < underMinedThreshold;
            const selectedIdsForSource = selectedClipIdsBySource[src.id] || [];
            const primaryTagId = src.tags[0] || tags[0]?.id || 'tag-streamer';
            const primaryTag = tagMap[primaryTagId];

            // Collect unique child tags that aren't already on the parent source
            const extraChildTagIds = Array.from(
              new Set(
                childFootages
                  .flatMap((ft) => ft.tags)
                  .filter((tid) => !src.tags.includes(tid))
              )
            );

            const currentChildPage = childPageMap[src.id] || 1;
            const paginatedChildFootages = childFootages.slice(
              (currentChildPage - 1) * childPageSize,
              currentChildPage * childPageSize
            );

            return (
              <div
                key={src.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-2xs"
              >
                {/* Source Top Bar */}
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 border-b border-slate-100 pb-4">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span className="font-mono font-bold text-slate-900 text-sm">
                        {src.id}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-semibold text-indigo-700">{src.platform}</span>
                      <span aria-hidden="true">·</span>
                      <span>ช่องต้นทาง: {src.channelOrCreator}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">
                        ความยาวรวม {src.totalDuration || '-'}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>เพิ่มเมื่อ {formatThaiDate(src.createdAt)}</span>

                      {isUnderMined && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-800 font-bold text-[11px]">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          <span>รอขุดมุกเพิ่ม (เพิ่งหั่น {childFootages.length} ฟุต)</span>
                        </span>
                      )}
                    </div>

                    <h2 className="text-lg font-bold text-slate-900">{src.title}</h2>

                    {src.notes && <p className="text-xs text-slate-600">{src.notes}</p>}

                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {src.tags.map((tid) => (
                        <TagPill key={tid} tag={tagMap[tid]} />
                      ))}
                      {extraChildTagIds.map((tid) => (
                        <TagPill key={tid} tag={tagMap[tid]} size="sm" />
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                    <div className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-right">
                      <div className="text-[11px] text-slate-500">
                        หั่นเป็นฟุตย่อยแล้ว (พร้อมใช้ {usableChildrenCount})
                      </div>
                      <div className="text-base font-extrabold font-mono tabular-nums text-slate-900 inline-flex items-center gap-1.5">
                        <Film className="w-4 h-4 text-indigo-600" />
                        <span>{childFootages.length} ฟุต</span>
                      </div>
                    </div>

                    <a
                      href={src.originalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors whitespace-nowrap"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>เปิดคลิปต้นฉบับ</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => launchEpisodeBuilderForCategory(primaryTagId)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-colors whitespace-nowrap cursor-pointer"
                      title="ส่งหมวดหมู่ของไลฟ์นี้ไปจัด 5 อันดับอัตโนมัติ"
                    >
                      <Rocket className="w-3.5 h-3.5" />
                      <span>ส่งหมวด #{primaryTag?.name || 'หลัก'} ไปจัด 5 อันดับ</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => openSourceSplitterFor(src)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors whitespace-nowrap cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>หั่นฟุตที่ #{childFootages.length + 1} เพิ่ม</span>
                    </button>
                  </div>
                </div>

                {/* Dimension 3: Visual Timestamp Timeline Bar */}
                <SourceTimelineBar
                  totalDuration={src.totalDuration}
                  childFootages={childFootages}
                  onSelectClip={(fid) => setTraceabilityFootageId(fid)}
                  onSplitMore={() => openSourceSplitterFor(src)}
                />

                {/* Dimension 5: Episode Builder Selection Action Bar + Child Split Footages Table */}
                <div className="space-y-2.5">
                  <div className="text-xs font-semibold text-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Film className="w-3.5 h-3.5 text-slate-500" />
                      <span>
                        รายการฟุตเทจย่อยที่ถูกหั่นออกจาก {src.id} ({childFootages.length}{' '}
                        รายการ):
                      </span>
                      <span className="text-[11px] font-mono text-emerald-700 font-bold inline-flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        <Zap className="w-3 h-3 text-emerald-600" />
                        <span>
                          พร้อมหยิบไปทำคลิป {usableChildrenCount}/{childFootages.length} ฟุต
                        </span>
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {usableChildrenCount > 0 && (
                        <button
                          type="button"
                          onClick={() => handleSelectTop5ReadyInSource(src)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                        >
                          <Sparkles className="w-3 h-3 text-indigo-600" />
                          <span>ติ๊กเลือกช็อตพร้อมใช้สูงสุด 5 อันดับแรก</span>
                        </button>
                      )}

                      {selectedIdsForSource.length > 0 && (
                        <button
                          type="button"
                          onClick={() =>
                            launchEpisodeBuilderWithCustomClips(
                              selectedIdsForSource,
                              primaryTagId,
                              `5 อันดับ ${src.title.slice(0, 32)} คัดช็อตเน้นๆ`
                            )
                          }
                          className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-2xs transition-colors cursor-pointer"
                        >
                          <Rocket className="w-3.5 h-3.5" />
                          <span>
                            ส่ง {selectedIdsForSource.length} ช็อตที่ติ๊กไปหน้าจัด 5 อันดับทันที
                          </span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                          <th className="py-2.5 px-3 w-10 text-center">เลือก</th>
                          <th className="py-2.5 px-3">ช็อตที่</th>
                          <th className="py-2.5 px-3">รหัสฟุต</th>
                          <th className="py-2.5 px-3">ช่วงเวลา (Timestamp)</th>
                          <th className="py-2.5 px-3">รายละเอียดช็อตฮา</th>
                          <th className="py-2.5 px-3">ไฟล์ Google Drive</th>
                          <th className="py-2.5 px-3">สถิติความถี่เทียบเวลา</th>
                          <th className="py-2.5 px-3">สถานะความสด</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {paginatedChildFootages.map((ft, idx) => {
                          const globalIdx =
                            (currentChildPage - 1) * childPageSize + idx + 1;
                          const isSelected = selectedIdsForSource.includes(ft.id);
                          const hasDrive = hasRealDriveLink(ft.driveFileUrl);

                          return (
                            <tr
                              key={ft.id}
                              onClick={() => setTraceabilityFootageId(ft.id)}
                              className={`hover:bg-slate-50 cursor-pointer transition-colors ${
                                isSelected ? 'bg-indigo-50/50' : ''
                              }`}
                            >
                              <td
                                className="py-2.5 px-3 text-center"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleSelectClip(src.id, ft.id);
                                }}
                              >
                                <button
                                  type="button"
                                  className="text-slate-500 hover:text-indigo-600 cursor-pointer"
                                  title="ติ๊กเลือกช็อตนี้เพื่อส่งไปจัด 5 อันดับ"
                                >
                                  {isSelected ? (
                                    <CheckSquare className="w-4 h-4 text-indigo-600" />
                                  ) : (
                                    <Square className="w-4 h-4" />
                                  )}
                                </button>
                              </td>
                              <td className="py-2.5 px-3 font-mono tabular-nums text-slate-500">
                                #{globalIdx}
                              </td>
                              <td className="py-2.5 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                                {ft.id}
                              </td>
                              <td className="py-2.5 px-3 font-mono tabular-nums text-indigo-700 whitespace-nowrap">
                                {ft.timestampRange || '-'}
                              </td>
                              <td className="py-2.5 px-3 font-medium text-slate-900">
                                {ft.title}
                              </td>
                              <td
                                className="py-2.5 px-3 whitespace-nowrap"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {hasDrive ? (
                                  <a
                                    href={ft.driveFileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 font-semibold text-[11px]"
                                  >
                                    <HardDrive className="w-3 h-3" />
                                    <span>เปิดไฟล์ Drive</span>
                                  </a>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[11px]">
                                    รอแนบลิงก์
                                  </span>
                                )}
                              </td>
                              <td className="py-2.5 px-3 font-mono tabular-nums text-slate-600">
                                {ft.velocitySummaryText}
                              </td>
                              <td className="py-2.5 px-3 whitespace-nowrap">
                                <StatusBadge
                                  status={ft.cooldownStatus}
                                  daysSinceLastUse={ft.daysSinceLastUsed}
                                  cooldownDays={settings.cooldownDays}
                                  usageLast90Days={ft.usageLast90Days}
                                  compact
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Child Split Footages Pagination */}
                  {childFootages.length > childPageSize && (
                    <PaginationBar
                      currentPage={currentChildPage}
                      totalItems={childFootages.length}
                      pageSize={childPageSize}
                      onPageChange={(p) =>
                        setChildPageMap((prev) => ({ ...prev, [src.id]: p }))
                      }
                      onPageSizeChange={setChildPageSize}
                      pageSizeOptions={[4, 6, 10]}
                      itemLabel="ช็อตย่อย"
                      compact
                    />
                  )}
                </div>
              </div>
            );
          })}

          {/* Parent Sources PaginationBar */}
          <PaginationBar
            currentPage={sourcePage}
            totalItems={filteredAndSortedSources.length}
            pageSize={sourcePageSize}
            onPageChange={setSourcePage}
            onPageSizeChange={setSourcePageSize}
            pageSizeOptions={[2, 3, 5, 10]}
            itemLabel="คลิปต้นฉบับยาว"
          />
        </div>
      )}

      {/* Dimension 4: Google Drive 1:N Importer Modal */}
      <GoogleDriveSource1ToNModal
        isOpen={isDrive1ToNOpen}
        onClose={() => setIsDrive1ToNOpen(false)}
      />
    </div>
  );
};
