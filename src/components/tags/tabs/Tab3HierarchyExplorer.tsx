import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronDown,
  ChevronRight,
  Edit3,
  Folder,
  FolderOpen,
  FolderPlus,
  LayoutGrid,
  PawPrint,
  Plus,
  Search,
  Table2,
  Tag,
  Target,
  Trash2,
  User,
  Zap,
} from 'lucide-react';
import { CategoryMatrixStat } from '../../../context/CMSContext';
import { CategoryTag, TagGroupType } from '../../../types/tag.types';
import {
  getPastelColorConfig,
} from '../constants/tagPastelPalette';

interface Tab3HierarchyExplorerProps {
  mainCategories: CategoryTag[];
  allTags: CategoryTag[];
  categoryMatrix: CategoryMatrixStat[];
  onQuickAddChild: (parentTagId: string) => void;
  onStartEdit: (tagId: string) => void;
  onDeleteTag: (tagId: string) => void;
  onAddNewMainCategory: () => void;
}

export const Tab3HierarchyExplorer: React.FC<Tab3HierarchyExplorerProps> = ({
  mainCategories,
  allTags,
  categoryMatrix,
  onQuickAddChild,
  onStartEdit,
  onDeleteTag,
  onAddNewMainCategory,
}) => {
  const [viewMode, setViewMode] = useState<'CARDS' | 'TABLE'>('CARDS');
  const [searchQuery, setSearchQuery] = useState('');
  const [groupFilter, setGroupFilter] = useState<'ALL' | TagGroupType>('ALL');
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    mainCategories.forEach((cat) => {
      initial[cat.id] = true;
    });
    return initial;
  });

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => ({
      ...prev,
      [id]: !(prev[id] ?? true),
    }));
  };

  const expandAll = (open: boolean) => {
    const next: Record<string, boolean> = {};
    mainCategories.forEach((cat) => {
      next[cat.id] = open;
    });
    setExpandedIds(next);
  };

  // Filtered Main Categories + Matched Child Tags
  const filteredHierarchy = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return mainCategories
      .filter((mainCat) => {
        if (groupFilter !== 'ALL' && mainCat.groupType !== groupFilter) {
          return false;
        }
        const children = allTags.filter((t) => t.parentId === mainCat.id);
        if (!q) return true;

        const matchMain =
          mainCat.name.toLowerCase().includes(q) ||
          mainCat.id.toLowerCase().includes(q) ||
          (mainCat.description || '').toLowerCase().includes(q);
        const matchChild = children.some(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            c.id.toLowerCase().includes(q) ||
            (c.description || '').toLowerCase().includes(q)
        );
        return matchMain || matchChild;
      })
      .map((mainCat) => {
        const allChildren = allTags.filter((t) => t.parentId === mainCat.id);
        const visibleChildren = q
          ? allChildren.filter(
              (c) =>
                mainCat.name.toLowerCase().includes(q) ||
                c.name.toLowerCase().includes(q) ||
                c.id.toLowerCase().includes(q)
            )
          : allChildren;
        const mainStat = categoryMatrix.find((m) => m.tag.id === mainCat.id);
        return {
          mainCat,
          mainStat,
          allChildrenCount: allChildren.length,
          children: visibleChildren,
        };
      });
  }, [mainCategories, allTags, categoryMatrix, searchQuery, groupFilter]);

  const totalSubcategoriesCount = allTags.filter((t) => t.tier === 2 || Boolean(t.parentId)).length;
  const totalProducibleEps = categoryMatrix.reduce(
    (sum, item) => sum + (item.tag.tier === 1 ? item.producibleEpisodesCount : 0),
    0
  );

  const getEntityIconNode = (entityType?: string) => {
    if (entityType === 'PERSON') return <User className="w-3.5 h-3.5 text-indigo-600 shrink-0" />;
    if (entityType === 'ANIMAL') return <PawPrint className="w-3.5 h-3.5 text-emerald-600 shrink-0" />;
    if (entityType === 'TOPIC') return <Target className="w-3.5 h-3.5 text-rose-600 shrink-0" />;
    if (entityType === 'ACTION') return <Zap className="w-3.5 h-3.5 text-amber-600 shrink-0" />;
    return <Tag className="w-3.5 h-3.5 text-slate-500 shrink-0" />;
  };

  return (
    <div className="space-y-4">
      {/* Top Summary Strip + Add Main Category CTA */}
      <div className="bg-gradient-to-r from-indigo-50/80 via-purple-50/60 to-sky-50/80 border border-indigo-100 rounded-2xl p-3.5 sm:p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="px-3 py-1.5 rounded-xl bg-white/90 border border-indigo-200 flex items-center gap-2 shadow-2xs">
            <span className="text-xs font-bold text-slate-600">หมวดหลัก (Tier 1):</span>
            <span className="text-sm font-mono font-bold text-indigo-700">
              {mainCategories.length} หมวด
            </span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-white/90 border border-purple-200 flex items-center gap-2 shadow-2xs">
            <span className="text-xs font-bold text-slate-600">หมวดย่อย (Tier 2):</span>
            <span className="text-sm font-mono font-black text-purple-700">
              {totalSubcategoriesCount} รายการ
            </span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-white/90 border border-emerald-200 flex items-center gap-2 shadow-2xs">
            <span className="text-xs font-bold text-slate-600">พร้อมจัดทำคลิป:</span>
            <span className="text-sm font-mono font-black text-emerald-700">
              {totalProducibleEps} ตอน (EP)
            </span>
          </div>
        </div>

        <motion.button
          type="button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={onAddNewMainCategory}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-black text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-2xs transition-colors cursor-pointer"
        >
          <FolderPlus className="w-4 h-4" />
          <span>+ สร้างหมวดหมู่หลักใหม่ (ไปแท็บ 2)</span>
        </motion.button>
      </div>

      {/* Responsive Toolbar: Search + Group Filter + Expand/Collapse + View Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/90 border border-slate-200/90 rounded-2xl p-3">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาชื่อหมวดหลัก, ชื่อดารา, สัตว์ หรือรหัสแท็ก..."
              className="w-full pl-9 pr-3 py-2 text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-400"
            />
          </div>

          {/* Group Filter */}
          <select
            value={groupFilter}
            onChange={(e) => setGroupFilter(e.target.value as 'ALL' | TagGroupType)}
            className="px-3 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-400"
          >
            <option value="ALL">ทุกกลุ่มหมวดหมู่</option>
            <option value="THEME">THEME (เนื้อหาหลัก)</option>
            <option value="PERSON">PERSON (บุคคล/ดารา)</option>
            <option value="ACTION">ACTION (จังหวะ/อาการ)</option>
            <option value="GENERAL">GENERAL (ทั่วไป)</option>
          </select>
        </div>

        {/* View Mode Switcher & Accordion Controls */}
        <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2">
          {viewMode === 'CARDS' && (
            <div className="inline-flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1">
              <button
                type="button"
                onClick={() => expandAll(true)}
                className="px-2 py-1 text-[11px] font-bold text-slate-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
              >
                กางทั้งหมด
              </button>
              <span className="text-slate-300">|</span>
              <button
                type="button"
                onClick={() => expandAll(false)}
                className="px-2 py-1 text-[11px] font-bold text-slate-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
              >
                พับทั้งหมด
              </button>
            </div>
          )}

          {/* Animated View Mode Toggle (Cards vs Table) */}
          <div className="inline-flex items-center bg-slate-200/75 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode('CARDS')}
              className={`relative px-3 py-1.5 text-xs font-black rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
                viewMode === 'CARDS' ? 'text-indigo-950' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {viewMode === 'CARDS' && (
                <motion.div
                  layoutId="hierarchyViewModePill"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  className="absolute inset-0 bg-white rounded-lg shadow-2xs border border-indigo-100"
                />
              )}
              <LayoutGrid className="w-3.5 h-3.5 relative z-10 text-indigo-600" />
              <span className="relative z-10">การ์ดพับ-กางได้</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('TABLE')}
              className={`relative px-3 py-1.5 text-xs font-black rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
                viewMode === 'TABLE' ? 'text-indigo-950' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {viewMode === 'TABLE' && (
                <motion.div
                  layoutId="hierarchyViewModePill"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  className="absolute inset-0 bg-white rounded-lg shadow-2xs border border-indigo-100"
                />
              )}
              <Table2 className="w-3.5 h-3.5 relative z-10 text-indigo-600" />
              <span className="relative z-10">ตารางเปรียบเทียบ</span>
            </button>
          </div>
        </div>
      </div>

      {/* Empty Search State */}
      {filteredHierarchy.length === 0 && (
        <div className="bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-8 text-center space-y-2">
          <div className="text-base font-bold text-slate-700">
            ไม่พบหมวดหมู่ที่ตรงกับคำค้นหา &ldquo;{searchQuery}&rdquo;
          </div>
          <p className="text-xs text-slate-500">
            ลองเปลี่ยนคำค้นหา หรือกดปุ่มด้านบนเพื่อเพิ่มหมวดหมู่ใหม่ในแท็บที่ 2
          </p>
        </div>
      )}

      {/* =================================================================
          MODE 1: EXPANDABLE PASTEL CARDS VIEW (การ์ดหมวดหลักพับ-กางดูหมวดย่อยได้)
         ================================================================= */}
      <AnimatePresence mode="wait">
        {viewMode === 'CARDS' && filteredHierarchy.length > 0 && (
          <motion.div
            key="cards-view"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 gap-3.5"
          >
            {filteredHierarchy.map(({ mainCat, mainStat, children }, idx) => {
              const pastel = getPastelColorConfig(mainCat.color);
              const isExpanded = expandedIds[mainCat.id] ?? true;
              const totalCount = mainStat?.totalCount || 0;
              const usableCount = mainStat?.usableCount || 0;
              const epCount = mainStat?.producibleEpisodesCount || 0;
              const usablePct = totalCount > 0 ? Math.round((usableCount / totalCount) * 100) : 0;

              return (
                <motion.div
                  key={mainCat.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  className={`rounded-2xl border-2 ${pastel.pastelBorder} ${pastel.pastelBg} overflow-hidden shadow-2xs transition-shadow hover:shadow-md`}
                >
                  {/* Card Header (Tier 1 Main Category) */}
                  <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div
                      onClick={() => toggleExpand(mainCat.id)}
                      className="flex items-start sm:items-center gap-3 cursor-pointer select-none flex-1"
                    >
                      <button
                        type="button"
                        aria-label="พับหรือกางหมวดย่อย"
                        className="w-8 h-8 rounded-xl bg-white/90 border border-slate-200/80 flex items-center justify-center text-slate-700 hover:bg-white shrink-0 shadow-2xs"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </button>

                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-md border ${pastel.badgeBg}`}
                          >
                            Tier 1 · {mainCat.groupType}
                          </span>
                          <h4 className={`text-sm sm:text-base font-bold ${pastel.pastelText} flex items-center gap-1.5`}>
                            <Folder className="w-4 h-4 text-indigo-600 shrink-0" />
                            <span>{mainCat.name}</span>
                          </h4>
                          <span className="text-[11px] font-mono text-slate-500 bg-white/80 px-2 py-0.5 rounded-md border border-slate-200/60">
                            {children.length} หมวดย่อย
                          </span>
                        </div>

                        {mainCat.description && (
                          <p className="text-xs text-slate-600 line-clamp-1">
                            {mainCat.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right Stats & Quick Actions on Tier 1 Card */}
                    <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/60">
                      {/* Footage & EP Badges */}
                      <div className="flex items-center gap-2 bg-white/90 border border-slate-200/80 rounded-xl px-3 py-1.5">
                        <div className="text-right">
                          <div className="text-[10px] font-bold text-slate-500">
                            พร้อมใช้ / ทั้งหมด
                          </div>
                          <div className="text-xs font-mono font-black text-slate-900 tabular-nums">
                            <span className="text-emerald-700">{usableCount}</span> / {totalCount}{' '}
                            ฟุต ({usablePct}%)
                          </div>
                        </div>
                        <span className="text-slate-200">|</span>
                        <div className="px-2 py-0.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono font-black">
                          {epCount} EP
                        </div>
                      </div>

                      {/* Action Buttons (+ Add Child -> Switches to Tab 2 automatically!) */}
                      <div className="flex items-center gap-1.5">
                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.96 }}
                          onClick={() => onQuickAddChild(mainCat.id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-black text-purple-900 bg-white hover:bg-purple-100 border-2 border-purple-200 rounded-xl shadow-2xs transition-colors cursor-pointer"
                          title="สลับไปแท็บที่ 2 พร้อมเลือกหมวดหลักนี้เป็นหมวดแม่ทันที"
                        >
                          <Plus className="w-3.5 h-3.5 text-purple-700" />
                          <span>เพิ่มหมวดย่อย</span>
                        </motion.button>

                        <button
                          type="button"
                          onClick={() => onStartEdit(mainCat.id)}
                          className="p-2 text-slate-600 hover:text-indigo-700 bg-white/90 hover:bg-white border border-slate-200/80 rounded-xl transition-colors cursor-pointer"
                          title="แก้ไขหมวดหลักนี้ในแท็บที่ 2"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => onDeleteTag(mainCat.id)}
                          className="p-2 text-slate-400 hover:text-rose-600 bg-white/90 hover:bg-rose-50 border border-slate-200/80 rounded-xl transition-colors cursor-pointer"
                          title="ลบหมวดหลัก"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Accordion Body: Tier 2 Subcategory Grid */}
                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22 }}
                        className="overflow-hidden"
                      >
                        <div className="bg-white/90 border-t border-slate-200/70 p-3.5 sm:p-4">
                          {children.length === 0 ? (
                            <div className="flex flex-wrap items-center justify-between gap-2 py-2 px-3 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-xs text-slate-500">
                              <span>ยังไม่มีหมวดย่อย (Tier 2) ภายใต้หมวดหมู่หลักนี้</span>
                              <button
                                type="button"
                                onClick={() => onQuickAddChild(mainCat.id)}
                                className="font-bold text-purple-700 hover:underline cursor-pointer"
                              >
                                + คลิกเพื่อเพิ่มหมวดย่อยแรกทันที
                              </button>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                              {children.map((child) => {
                                const childStat = categoryMatrix.find(
                                  (m) => m.tag.id === child.id
                                );
                                const childTotal = childStat?.totalCount || 0;
                                const childUsable = childStat?.usableCount || 0;
                                const canSoloEp = childUsable >= 5;

                                return (
                                  <motion.div
                                    key={child.id}
                                    whileHover={{ y: -1 }}
                                    className="group rounded-xl border border-slate-200/90 bg-slate-50/70 hover:bg-white hover:border-purple-300 p-3 flex items-center justify-between gap-2 transition-all shadow-2xs"
                                  >
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center gap-1.5">
                                        {getEntityIconNode(child.entityType)}
                                        <span className="text-xs font-bold text-slate-900 truncate">
                                          #{child.name}
                                        </span>
                                        {canSoloEp && (
                                          <span className="px-1.5 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-800 rounded-md">
                                            Solo EP พร้อม!
                                          </span>
                                        )}
                                      </div>
                                      <div className="text-[11px] font-mono text-slate-500 mt-1 flex items-center gap-2">
                                        <span>ทั้งหมด {childTotal} ฟุต</span>
                                        <span>·</span>
                                        <span className="text-emerald-700 font-bold">
                                          พร้อมใช้ {childUsable}/5
                                        </span>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-1 shrink-0">
                                      <button
                                        type="button"
                                        onClick={() => onStartEdit(child.id)}
                                        className="p-1.5 text-slate-500 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                                        title="แก้ไขหมวดย่อยนี้ในแท็บที่ 2"
                                      >
                                        <Edit3 className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => onDeleteTag(child.id)}
                                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                        title="ลบหมวดย่อย"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </motion.div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* =================================================================
            MODE 2: RESPONSIVE TABLE VIEW (ตารางเปรียบเทียบหมวดหลัก & หมวดย่อย)
           ================================================================= */}
        {viewMode === 'TABLE' && filteredHierarchy.length > 0 && (
          <motion.div
            key="table-view"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[680px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-indigo-50/60 text-xs font-black text-slate-700">
                    <th className="py-3 px-4">ระดับ / ชื่อหมวดหมู่</th>
                    <th className="py-3 px-3">กลุ่ม / ประเภท</th>
                    <th className="py-3 px-3 text-right">ฟุตเทจรวม</th>
                    <th className="py-3 px-3 text-right">พร้อมใช้ (ฟ้า+เขียว)</th>
                    <th className="py-3 px-3 text-right">ความจุตอน (EP)</th>
                    <th className="py-3 px-4 text-right">จัดการ (สลับไปแท็บ 2 อัตโนมัติ)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredHierarchy.map(({ mainCat, mainStat, children }) => {
                    const pastel = getPastelColorConfig(mainCat.color);
                    return (
                      <React.Fragment key={mainCat.id}>
                        {/* Tier 1 Parent Row */}
                        <tr className={`${pastel.pastelBg} font-semibold border-t border-slate-200`}>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <span
                                className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-md border ${pastel.badgeBg}`}
                              >
                                Tier 1
                              </span>
                              <span className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                                <Folder className="w-4 h-4 text-indigo-600 shrink-0" />
                                <span>{mainCat.name}</span>
                              </span>
                              <span className="text-[11px] font-normal text-slate-500">
                                ({children.length} หมวดย่อย)
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-3 font-mono font-bold text-slate-600">
                            {mainCat.groupType}
                          </td>
                          <td className="py-3 px-3 text-right font-mono tabular-nums font-bold text-slate-900">
                            {mainStat?.totalCount || 0}
                          </td>
                          <td className="py-3 px-3 text-right font-mono tabular-nums font-bold text-emerald-700">
                            {mainStat?.usableCount || 0}
                          </td>
                          <td className="py-3 px-3 text-right font-mono tabular-nums font-bold text-indigo-700">
                            {mainStat?.producibleEpisodesCount || 0} EP
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => onQuickAddChild(mainCat.id)}
                                className="px-2.5 py-1 text-[11px] font-bold text-purple-900 bg-white hover:bg-purple-100 border border-purple-200 rounded-lg transition-colors cursor-pointer"
                              >
                                + เพิ่มหมวดย่อย
                              </button>
                              <button
                                type="button"
                                onClick={() => onStartEdit(mainCat.id)}
                                className="p-1.5 text-slate-600 hover:text-indigo-700 bg-white border border-slate-200 rounded-lg cursor-pointer"
                                title="แก้ไข"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => onDeleteTag(mainCat.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 bg-white border border-slate-200 rounded-lg cursor-pointer"
                                title="ลบ"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Tier 2 Child Rows */}
                        {children.map((child) => {
                          const childStat = categoryMatrix.find((m) => m.tag.id === child.id);
                          const childUsable = childStat?.usableCount || 0;
                          return (
                            <tr key={child.id} className="bg-white hover:bg-purple-50/40">
                              <td className="py-2.5 px-4 pl-10">
                                <div className="flex items-center gap-2">
                                  <span className="text-purple-400 font-bold">↳</span>
                                  {getEntityIconNode(child.entityType)}
                                  <span className="font-bold text-slate-800">#{child.name}</span>
                                </div>
                              </td>
                              <td className="py-2.5 px-3 font-mono text-[11px] text-purple-800">
                                {child.entityType || 'SUB'}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-700">
                                {childStat?.totalCount || 0}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold text-emerald-700">
                                {childUsable}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                                {childUsable >= 5 ? (
                                  <span className="px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold">
                                    ทำ Solo EP ได้
                                  </span>
                                ) : (
                                  <span className="text-slate-400">{childUsable}/5</span>
                                )}
                              </td>
                              <td className="py-2.5 px-4 text-right">
                                <div className="inline-flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => onStartEdit(child.id)}
                                    className="p-1.5 text-slate-500 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg cursor-pointer"
                                    title="แก้ไข"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => onDeleteTag(child.id)}
                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                                    title="ลบ"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
