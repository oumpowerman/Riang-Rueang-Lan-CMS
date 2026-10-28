import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  ExternalLink,
  Film,
  Plus,
  RotateCcw,
  Scissors,
  Search,
  Video,
  Zap,
  Tag,
} from 'lucide-react';
import { useCMS } from '../../context/CMSContext';
import { SourcePlatform } from '../../types/source.types';
import { formatThaiDate } from '../../utils/fileNameGenerator';
import { PaginationBar } from '../ui/PaginationBar';
import { StatusBadge } from '../ui/StatusBadge';
import { TagPill } from '../ui/TagPill';

export const SourceLibraryView: React.FC = () => {
  const {
    sources,
    tags,
    computedFootageMap,
    tagMap,
    settings,
    openSourceSplitterFor,
    setTraceabilityFootageId,
  } = useCMS();

  // Filter & Sort state for Parent Sources
  const [searchQuery, setSearchQuery] = useState('');
  const [platformFilter, setPlatformFilter] = useState<SourcePlatform | 'ALL'>('ALL');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'NEWEST' | 'MOST_CLIPS' | 'MOST_USABLE'>('NEWEST');

  // Parent Source Pagination
  const [sourcePage, setSourcePage] = useState(1);
  const [sourcePageSize, setSourcePageSize] = useState(3);

  // Child Split-Footage Pagination per Source ID
  const [childPageMap, setChildPageMap] = useState<Record<string, number>>({});
  const [childPageSize, setChildPageSize] = useState(4);

  useEffect(() => {
    setSourcePage(1);
  }, [searchQuery, platformFilter, selectedTags, sortBy]);

  const handleToggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setPlatformFilter('ALL');
    setSelectedTags([]);
    setSortBy('NEWEST');
    setSourcePage(1);
  };

  const filteredAndSortedSources = useMemo(() => {
    const filtered = sources.filter((src) => {
      if (platformFilter !== 'ALL' && src.platform !== platformFilter) return false;
      if (selectedTags.length > 0) {
        const hasTag = selectedTags.some((tid) => src.tags.includes(tid));
        if (!hasTag) return false;
      }
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const inId = src.id.toLowerCase().includes(q);
        const inTitle = src.title.toLowerCase().includes(q);
        const inCreator = src.channelOrCreator.toLowerCase().includes(q);
        const inNotes = src.notes.toLowerCase().includes(q);
        const inChildClip = src.splitFootageIds.some((fid) => {
          const ft = computedFootageMap[fid];
          return (
            fid.toLowerCase().includes(q) ||
            (ft && ft.title.toLowerCase().includes(q))
          );
        });
        if (!inId && !inTitle && !inCreator && !inNotes && !inChildClip) return false;
      }
      return true;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === 'MOST_CLIPS') {
        return b.splitFootageIds.length - a.splitFootageIds.length;
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
  }, [sources, platformFilter, selectedTags, searchQuery, sortBy, computedFootageMap]);

  const paginatedSources = useMemo(() => {
    const start = (sourcePage - 1) * sourcePageSize;
    return filteredAndSortedSources.slice(start, start + sourcePageSize);
  }, [filteredAndSortedSources, sourcePage, sourcePageSize]);

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    platformFilter !== 'ALL' ||
    selectedTags.length > 0;

  return (
    <div className="space-y-5">
      {/* Studio Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200 rounded-2xl p-5">
        <div className="space-y-1">
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Scissors className="w-5 h-5 text-indigo-600" />
            <span>สตูดิโอหั่นไลฟ์สดและคลิปต้นฉบับยาว (Flow B: 1-to-Many Source Splitter)</span>
          </h1>
          <p className="text-xs text-slate-500">
            เก็บประวัติคลิปต้นฉบับยาว (`SRC-XXXX`) ทุกหมวดหมู่ ดูว่าแต่ละคลิปหั่นออกมาได้กี่ฟุตแล้ว พร้อมระบบแบ่งหน้าทั้งระดับไลฟ์สดและตารางฟุตย่อย
          </p>
        </div>

        <button
          type="button"
          onClick={() => openSourceSplitterFor(null)}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Scissors className="w-4 h-4" />
          <span>+ ลงทะเบียนคลิปยาว & หั่นหลายฟุต (Flow 1:N)</span>
        </button>
      </div>

      {/* Source Search, Platform, Tag & Sort Bar */}
      <div className="studio-card border border-slate-200/90 rounded-2xl p-4 space-y-3">
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
                className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
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
            </select>
          </div>
        </div>

        <div className="pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500 mr-1 inline-flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-slate-400" />
              <span>กรองหมวดต้นฉบับ:</span>
            </span>
            {tags.map((tag) => (
              <TagPill
                key={tag.id}
                tag={tag}
                selected={selectedTags.includes(tag.id)}
                onClick={() => handleToggleTag(tag.id)}
              />
            ))}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-mono font-bold text-slate-700 inline-flex items-center gap-1.5">
              <Video className="w-3.5 h-3.5 text-indigo-600" />
              <span>พบ {filteredAndSortedSources.length} คลิปต้นฉบับยาว</span>
            </span>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-800"
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
          <button
            type="button"
            onClick={handleResetFilters}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200"
          >
            ล้างตัวกรองทั้งหมด
          </button>
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
                    </div>

                    <h2 className="text-lg font-bold text-slate-900">{src.title}</h2>

                    {src.notes && <p className="text-xs text-slate-600">{src.notes}</p>}

                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {src.tags.map((tid) => (
                        <TagPill key={tid} tag={tagMap[tid]} />
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 shrink-0">
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
                      onClick={() => openSourceSplitterFor(src)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors whitespace-nowrap"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>หั่นฟุตที่ #{childFootages.length + 1} เพิ่ม</span>
                    </button>
                  </div>
                </div>

                {/* Child Split Footages Table with Inner Pagination */}
                <div className="space-y-2.5">
                  <div className="text-xs font-semibold text-slate-700 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <Film className="w-3.5 h-3.5 text-slate-500" />
                      <span>
                        รายการฟุตเทจย่อยที่ถูกหั่นออกจาก {src.id} ({childFootages.length}{' '}
                        รายการ):
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-emerald-700 font-bold inline-flex items-center gap-1">
                      <Zap className="w-3 h-3 text-emerald-600" />
                      <span>พร้อมหยิบไปทำคลิป {usableChildrenCount}/{childFootages.length} ฟุต</span>
                    </span>
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                          <th className="py-2.5 px-3.5">ช็อตที่</th>
                          <th className="py-2.5 px-3.5">รหัสฟุต</th>
                          <th className="py-2.5 px-3.5">ช่วงเวลา (Timestamp)</th>
                          <th className="py-2.5 px-3.5">รายละเอียดช็อตฮา</th>
                          <th className="py-2.5 px-3.5">สถิติความถี่เทียบเวลา</th>
                          <th className="py-2.5 px-3.5">สถานะความสด</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {paginatedChildFootages.map((ft, idx) => {
                          const globalIdx =
                            (currentChildPage - 1) * childPageSize + idx + 1;
                          return (
                            <tr
                              key={ft.id}
                              onClick={() => setTraceabilityFootageId(ft.id)}
                              className="hover:bg-slate-50 cursor-pointer transition-colors"
                            >
                              <td className="py-2.5 px-3.5 font-mono tabular-nums text-slate-500">
                                #{globalIdx}
                              </td>
                              <td className="py-2.5 px-3.5 font-mono font-bold text-slate-900 whitespace-nowrap">
                                {ft.id}
                              </td>
                              <td className="py-2.5 px-3.5 font-mono tabular-nums text-indigo-700 whitespace-nowrap">
                                {ft.timestampRange || '-'}
                              </td>
                              <td className="py-2.5 px-3.5 font-medium text-slate-900">
                                {ft.title}
                              </td>
                              <td className="py-2.5 px-3.5 font-mono tabular-nums text-slate-600">
                                {ft.velocitySummaryText}
                              </td>
                              <td className="py-2.5 px-3.5 whitespace-nowrap">
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
    </div>
  );
};
