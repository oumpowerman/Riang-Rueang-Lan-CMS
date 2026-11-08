import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronDown,
  ChevronRight,
  FolderTree,
  Inbox,
  Check,
  Layers,
  Plus,
  Search,
  Settings,
  X,
  Tags,
  Sparkles,
  Info,
} from 'lucide-react';
import { useCMS } from '../../context/CMSContext';
import {
  STAGING_TAG_ID,
  isFootageInStaging,
  isStagingGroupId,
  isStagingTagId,
} from '../../services/seedData';
import { CategoryTag, EntitySubtype } from '../../types/tag.types';
import { CategoryGroupIcon } from '../ui/CategoryGroupIcon';
import { TagPill, getEntityIcon } from '../ui/TagPill';

interface CascadeCategorySelectorProps {
  selectedTagIds: string[];
  onChange: (newTagIds: string[]) => void;
  label?: string;
  helperText?: string;
  allowMultipleSubcategories?: boolean;
}

export const CascadeCategorySelector: React.FC<CascadeCategorySelectorProps> = ({
  selectedTagIds,
  onChange,
  label = 'ระบบแท็กหลายมิติ (Multi-Dimensional Tagging)',
  helperText = 'เลือกแท็กได้หลายมิติพร้อมกันอย่างอิสระ (เช่น ติดทั้ง #ดาราฮาๆ #แกล้งสุดฮา #พี่แจ๊ส เพื่อให้คลิปแสดงในทุกซีรีส์ที่เกี่ยวข้อง)',
  allowMultipleSubcategories = true,
}) => {
  const {
    categoryGroups,
    mainCategories,
    subcategories,
    getSubcategoriesByParent,
    createSubcategory,
    tagMap,
    setIsThreeTierManagerOpen,
  } = useCMS();

  // Active cluster for browsing (null = collapsed, or group ID, or 'ALL')
  const [activeCluster, setActiveCluster] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeMainCatId, setActiveMainCatId] = useState<string>('');
  const [isAddingNewSub, setIsAddingNewSub] = useState(false);
  const [newSubName, setNewSubName] = useState('');
  const [newSubType, setNewSubType] = useState<EntitySubtype>('PERSON');

  const isSearching = searchQuery.trim().length > 0;
  const activeMainCat = activeMainCatId ? tagMap[activeMainCatId] : undefined;
  const isCurrentlyInStaging = isFootageInStaging(selectedTagIds);

  // Active real tags (excluding staging)
  const realSelectedTagIds = useMemo(() => {
    return selectedTagIds.filter((id) => Boolean(id) && !isStagingTagId(id));
  }, [selectedTagIds]);

  const handleSelectStagingDefault = () => {
    setActiveCluster(null);
    setActiveMainCatId('');
    setIsAddingNewSub(false);
    onChange([STAGING_TAG_ID]);
  };

  const handleRemoveSingleTag = (tagIdToRemove: string) => {
    const remaining = selectedTagIds.filter(
      (id) => id !== tagIdToRemove && !isStagingTagId(id)
    );
    onChange(remaining.length > 0 ? remaining : [STAGING_TAG_ID]);
  };

  const handleClearAllTags = () => {
    handleSelectStagingDefault();
  };

  // Dynamic Clusters Ribbon
  const displayClusters = useMemo(() => {
    return [
      ...categoryGroups.map((g) => ({
        id: g.id,
        label: g.name,
        icon: g.icon || 'folder',
        hint: g.description || g.name,
      })),
      { id: 'ALL', label: 'ดูทุกมิติ', icon: 'folder', hint: 'แสดงป้ายแท็กหลักจากทุกกลุ่ม' },
    ];
  }, [categoryGroups]);

  // Group count map for badges
  const clusterCounts = useMemo(() => {
    const counts: Record<string, number> = {
      ALL: mainCategories.length,
    };
    categoryGroups.forEach((g) => {
      counts[g.id] = 0;
    });

    mainCategories.forEach((mc) => {
      if (mc.groupId && counts[mc.groupId] !== undefined) {
        counts[mc.groupId] += 1;
      } else {
        const groupShort = mc.groupType;
        const matched = categoryGroups.find(
          (g) => g.id === `GRP-${groupShort}` || g.id === groupShort
        );
        if (matched && counts[matched.id] !== undefined) {
          counts[matched.id] += 1;
        }
      }
    });
    return counts;
  }, [mainCategories, categoryGroups]);

  // Filtered Tier 1 categories based on Cluster + Search
  const filteredMainCategories = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return mainCategories.filter((mc) => {
      if (!query) {
        if (!activeCluster) return false;
        if (activeCluster !== 'ALL') {
          const groupShort = activeCluster.replace('GRP-', '');
          const belongsToCluster =
            mc.groupId === activeCluster ||
            mc.groupType === groupShort ||
            mc.groupType === activeCluster;
          if (!belongsToCluster) return false;
        }
        return true;
      }

      // Search query match (matches main cat name/desc OR any child subcategories)
      const mainMatches =
        mc.name.toLowerCase().includes(query) ||
        (mc.description && mc.description.toLowerCase().includes(query));
      if (mainMatches) return true;

      const childSubs = getSubcategoriesByParent(mc.id);
      return childSubs.some((sub) => sub.name.toLowerCase().includes(query));
    });
  }, [mainCategories, activeCluster, searchQuery, getSubcategoriesByParent]);

  // Subcategories to display (either under activeMainCat, or matching searchQuery)
  const displayedSubcategories = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (query) {
      const directMatches = subcategories.filter(
        (sub) =>
          sub.name.toLowerCase().includes(query) ||
          (sub.description && sub.description.toLowerCase().includes(query))
      );
      if (directMatches.length > 0) return directMatches;
      if (activeMainCatId) return getSubcategoriesByParent(activeMainCatId);
      return [];
    }
    return activeMainCatId ? getSubcategoriesByParent(activeMainCatId) : [];
  }, [searchQuery, subcategories, activeMainCatId, getSubcategoriesByParent]);

  // Determine visibility of Progressive Tiers
  const isTier1Open = Boolean(activeCluster) || isSearching;
  const isTier2Open = Boolean(activeMainCat) || (isSearching && displayedSubcategories.length > 0);

  // Current active sub-step (1 = Group/Dimension, 2 = Main Tag, 3 = Sub-Tag)
  const currentSubStep: 1 | 2 | 3 = isTier2Open ? 3 : isTier1Open ? 2 : 1;

  // Handle Cluster selection (Step 1 -> expands Step 2)
  const handleSelectCluster = (clusterId: string) => {
    if (isStagingGroupId(clusterId)) {
      handleSelectStagingDefault();
      return;
    }
    if (activeCluster === clusterId && !isSearching) {
      setActiveCluster(null);
      setActiveMainCatId('');
      setIsAddingNewSub(false);
      return;
    }
    setActiveCluster(clusterId);
    setActiveMainCatId('');
    setIsAddingNewSub(false);
  };

  // Handle Main Category selection (Multi-Tag: toggle selection without clearing other tags!)
  const handleSelectMainCategory = (mainCatId: string) => {
    if (isStagingTagId(mainCatId)) {
      handleSelectStagingDefault();
      return;
    }

    const baseWithoutStaging = selectedTagIds.filter((id) => !isStagingTagId(id));
    const isAlreadySelected = baseWithoutStaging.includes(mainCatId);

    // If user clicked the same active main category that was already selected, clicking it again toggles it off
    // If clicking a different category, switch active browsing view and add to selection if not present
    if (activeMainCatId === mainCatId) {
      if (isAlreadySelected) {
        // Toggle off
        const updated = baseWithoutStaging.filter((id) => id !== mainCatId);
        onChange(updated.length > 0 ? updated : [STAGING_TAG_ID]);
      } else {
        onChange([...baseWithoutStaging, mainCatId]);
      }
    } else {
      setActiveMainCatId(mainCatId);
      if (!isAlreadySelected) {
        onChange([...baseWithoutStaging, mainCatId]);
      }
    }
  };

  // Toggle Subcategory (Multi-Tag: keep all other tags, ensure parent is present)
  const handleToggleSubcategory = (sub: CategoryTag) => {
    const subId = sub.id;
    const parentId = sub.parentId || activeMainCatId;
    const baseWithoutStaging = selectedTagIds.filter((id) => !isStagingTagId(id));
    const isSelected = baseWithoutStaging.includes(subId);
    let updated: string[];

    if (isSelected) {
      updated = baseWithoutStaging.filter((id) => id !== subId);
    } else {
      if (allowMultipleSubcategories) {
        updated = [...baseWithoutStaging, subId];
      } else {
        const siblingIds = (parentId ? getSubcategoriesByParent(parentId) : displayedSubcategories).map(
          (s) => s.id
        );
        updated = [...baseWithoutStaging.filter((id) => !siblingIds.includes(id)), subId];
      }
      // Ensure parent main category is also included so the clip is categorized broadly and specifically
      if (parentId && !updated.includes(parentId)) {
        updated.push(parentId);
      }
      if (parentId && activeMainCatId !== parentId) {
        setActiveMainCatId(parentId);
      }
    }
    onChange(updated.length > 0 ? updated : [STAGING_TAG_ID]);
  };

  const handleCreateSubcategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubName.trim() || !activeMainCatId) return;

    const created = createSubcategory(
      activeMainCatId,
      newSubName.trim(),
      newSubType,
      activeMainCat?.color || 'amber'
    );

    const nextSelected = [
      ...selectedTagIds.filter((id) => id !== created.id && !isStagingTagId(id)),
      created.id,
    ];
    if (!nextSelected.includes(activeMainCatId)) {
      nextSelected.push(activeMainCatId);
    }
    onChange(nextSelected);

    setNewSubName('');
    setIsAddingNewSub(false);
  };

  // Count how many subcategories under activeMainCat are currently selected
  const activeCatSelectedSubCount = useMemo(() => {
    return displayedSubcategories.filter((sc) => selectedTagIds.includes(sc.id)).length;
  }, [displayedSubcategories, selectedTagIds]);

  const activeClusterObj = useMemo(
    () => displayClusters.find((c) => c.id === activeCluster),
    [displayClusters, activeCluster]
  );

  return (
    <div className="space-y-3.5 bg-[#faf8f5] p-4 rounded-2xl border border-[#e8e2d8] shadow-2xs">
      {/* Header bar with Studio Settings Link */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div>
          <label className="text-sm font-bold text-[#3d3429] flex items-center gap-1.5">
            <Tags className="w-4 h-4 text-[#7d5630] shrink-0" />
            {label}
          </label>
          {helperText && <p className="text-xs text-[#706456] mt-0.5 leading-relaxed">{helperText}</p>}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsThreeTierManagerOpen(true)}
            className="text-xs font-bold text-[#5c4426] hover:text-[#382613] bg-[#f2ebd9] hover:bg-[#eae0cb] border border-[#dfd4be] px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
            title="เปิดสตูดิโอจัดการมิติกลุ่มแท็ก ป้ายแท็กหลัก และคุณลักษณะ"
          >
            <Settings className="w-3.5 h-3.5 text-[#7d5630]" />
            <span>สตูดิโอกลุ่มแท็กหลายมิติ</span>
          </button>
        </div>
      </div>

      {/* =====================================================================
          MULTI-TAG TRAY: Selected Tags on this Footage (Light Pastel Earth-Tone)
      ====================================================================== */}
      <div className="bg-white rounded-xl p-3 border border-[#e5ded4] shadow-2xs space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs font-bold text-[#3e3428] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#8c673b]" />
              <span>ป้ายแท็กที่ติดกับคลิปนี้ ({realSelectedTagIds.length}):</span>
            </span>
            {realSelectedTagIds.length > 0 && (
              <span className="text-[11px] font-semibold text-[#2c5338] bg-[#eaf4ec] px-2 py-0.5 rounded-full border border-[#cbe3cf]">
                พร้อมแสดงใน {realSelectedTagIds.length} ซีรีส์
              </span>
            )}
          </div>

          {realSelectedTagIds.length > 0 && (
            <button
              type="button"
              onClick={handleClearAllTags}
              className="text-[11px] font-semibold text-[#8b4336] hover:text-[#5a231a] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>ล้างแท็กทั้งหมด</span>
            </button>
          )}
        </div>

        {isCurrentlyInStaging ? (
          <div className="flex items-center gap-2 p-2 bg-[#fef9f0] border border-[#f2e1c4] rounded-lg text-xs text-[#7e5522]">
            <Inbox className="w-4 h-4 text-[#a67438] shrink-0" />
            <span className="font-medium">
              คลิปนี้ยังไม่ได้ติดแท็ก (อยู่ในพื้นที่พักรอจัดหมวดหมู่ Staging Area) — คลิกเลือกแท็กด้านล่างเพื่อเริ่มติดแท็ก
            </span>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            {realSelectedTagIds.map((tid) => {
              const tag = tagMap[tid];
              if (!tag) return null;
              return (
                <TagPill
                  key={tag.id}
                  tag={tag}
                  showEntityIcon={true}
                  onRemove={() => handleRemoveSingleTag(tag.id)}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Staging Area Default Toggle Banner (Pastel Earth Tone) */}
      <div
        className={`rounded-xl p-3 border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
          isCurrentlyInStaging
            ? 'bg-[#fef8ed] border border-[#ebcf9e] shadow-2xs'
            : 'bg-white/80 border-[#e8e2d8]'
        }`}
      >
        <div className="flex items-start sm:items-center gap-3 min-w-0">
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
              isCurrentlyInStaging
                ? 'bg-[#ebd3a8] text-[#5e3e14] font-bold'
                : 'bg-[#f4efe8] text-[#7d7162]'
            }`}
          >
            <Inbox className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-[#3d3326]">
                พื้นที่พักรอจัดหมวดหมู่ (Staging Area)
              </span>
              {isCurrentlyInStaging ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold bg-[#f3e3c3] text-[#5e3e14] rounded-md border border-[#e4cca0]">
                  <Check className="w-3 h-3" />
                  <span>ยังไม่ได้เลือกแท็กจริง (สถานะพักรอ)</span>
                </span>
              ) : (
                <span className="text-[11px] font-semibold text-[#245233] bg-[#edf6ef] border border-[#c6e1cb] px-2 py-0.5 rounded-md">
                  ติดแท็กจริงแล้ว ({realSelectedTagIds.length} แท็ก)
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#716557] mt-0.5">
              {isCurrentlyInStaging
                ? 'คลิปในพื้นที่พักจะไม่ถูกนับในโควตาสร้าง 5 อันดับ จนกว่าจะเลือกแท็กจริง'
                : 'สามารถย้ายกลับพื้นที่พักได้หากต้องการคัดแยกแท็กใหม่ในภายหลัง'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSelectStagingDefault}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
            isCurrentlyInStaging
              ? 'bg-[#ebd3a8] text-[#4f320e] border border-[#dcbc86]'
              : 'bg-[#fbf7f0] hover:bg-[#f3ebd9] text-[#735123] border border-[#e3d7bf]'
          }`}
        >
          <span>
            {isCurrentlyInStaging
              ? '✓ อยู่ในพื้นที่พักแล้ว'
              : 'ย้ายไปพื้นที่พักรอจัดหมวดหมู่'}
          </span>
        </button>
      </div>

      {/* 3-Stage Mini Stepper Pill Bar */}
      <div className="flex items-center gap-2 text-xs bg-white px-3.5 py-2 rounded-xl border border-[#e5dfd5] overflow-x-auto scrollbar-none">
        <span
          className={`font-semibold whitespace-nowrap flex items-center gap-1.5 ${
            currentSubStep === 1
              ? 'text-[#614524] font-bold'
              : isTier1Open
              ? 'text-[#2e593a]'
              : 'text-[#8b8071]'
          }`}
        >
          <span
            className={`w-5 h-5 rounded-full text-xs font-mono font-bold flex items-center justify-center ${
              currentSubStep === 1
                ? 'bg-[#eedbc0] text-[#523715] ring-2 ring-[#e4cb9f]'
                : isTier1Open
                ? 'bg-[#d2ead7] text-[#1b4327]'
                : 'bg-[#ede7dd] text-[#7b7062]'
            }`}
          >
            1
          </span>
          <span>มิติแท็ก{activeClusterObj ? `: ${activeClusterObj.label}` : ''}</span>
        </span>

        <ChevronRight className="w-3.5 h-3.5 text-[#d4cbbe] shrink-0" />

        <span
          className={`font-semibold whitespace-nowrap flex items-center gap-1.5 ${
            currentSubStep === 2
              ? 'text-[#2a4d6c] font-bold'
              : isTier2Open
              ? 'text-[#2e593a]'
              : 'text-[#8b8071]'
          }`}
        >
          <span
            className={`w-5 h-5 rounded-full text-xs font-mono font-bold flex items-center justify-center ${
              currentSubStep === 2
                ? 'bg-[#d3e5f4] text-[#1c3a54] ring-2 ring-[#bbd8f0]'
                : isTier2Open
                ? 'bg-[#d2ead7] text-[#1b4327]'
                : 'bg-[#ede7dd] text-[#7b7062]'
            }`}
          >
            2
          </span>
          <span>แท็กหลัก{activeMainCat ? `: ${activeMainCat.name}` : ''}</span>
        </span>

        <ChevronRight className="w-3.5 h-3.5 text-[#d4cbbe] shrink-0" />

        <span
          className={`font-semibold whitespace-nowrap flex items-center gap-1.5 ${
            currentSubStep === 3 ? 'text-[#6e4b1c] font-bold' : 'text-[#8b8071]'
          }`}
        >
          <span
            className={`w-5 h-5 rounded-full text-xs font-mono font-bold flex items-center justify-center ${
              currentSubStep === 3
                ? 'bg-[#f4e4cb] text-[#553810] ring-2 ring-[#e5cca4]'
                : 'bg-[#ede7dd] text-[#7b7062]'
            }`}
          >
            3
          </span>
          <span>ป้ายแท็กย่อย / บุคคล</span>
        </span>
      </div>

      {/* Quick Search (Fast Search Across All Tag Dimensions) */}
      <div className="relative">
        <Search className="w-4 h-4 text-[#9c9183] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="ค้นหาแท็กด่วน (พิมพ์ชื่อดารา มุก หรือหัวข้อ เพื่อกางผลลัพธ์ทันที)..."
          className="w-full pl-9 pr-8 py-2 text-sm bg-white border border-[#dfd7ca] rounded-xl placeholder:text-[#9e9487] text-[#3a3125] focus:outline-hidden focus:ring-2 focus:ring-[#d5c2a5] focus:border-[#c2ae8f] transition-all"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9e9487] hover:text-[#524637] p-0.5 cursor-pointer"
            title="ล้างคำค้นหา"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* =====================================================================
          STAGE 1: Super-Category Dimensions (มิติกลุ่มแท็ก)
      ====================================================================== */}
      <div
        className={`rounded-xl p-3.5 transition-all duration-200 ${
          currentSubStep === 1 && !isSearching
            ? 'bg-white border-2 border-[#d6c4a8] ring-2 ring-[#ede3d1]'
            : 'bg-white border border-[#e5dfd5]'
        }`}
      >
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs font-bold text-[#42372a] flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-[#7d5630]" />
            <span>ขั้นที่ 1 — เลือกมิติกลุ่มแท็ก (คลิกเพื่อดูกลุ่มแท็กหลัก):</span>
          </span>
          {activeCluster && !isSearching && (
            <button
              type="button"
              onClick={() => {
                setActiveCluster(null);
                setActiveMainCatId('');
              }}
              className="text-xs font-semibold text-[#736657] hover:text-[#382f23] flex items-center gap-1 cursor-pointer"
            >
              <span>พับเก็บ</span>
              <ChevronDown className="w-3.5 h-3.5 rotate-180" />
            </button>
          )}
        </div>

        {categoryGroups.length === 0 && mainCategories.length === 0 ? (
          <div className="p-3.5 bg-[#fbf9f6] rounded-lg border border-dashed border-[#dfd7ca] text-center space-y-2">
            <p className="text-sm text-[#736758] font-medium">
              ยังไม่มีมิติกลุ่มแท็กในระบบ
            </p>
            <button
              type="button"
              onClick={() => setIsThreeTierManagerOpen(true)}
              className="px-3.5 py-2 bg-[#78593a] text-white rounded-lg text-xs font-bold hover:bg-[#62462a] transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>สร้างมิติกลุ่มแท็ก</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {displayClusters.map((cluster) => {
              const isActive = activeCluster === cluster.id;
              const count = clusterCounts[cluster.id] || 0;
              return (
                <button
                  key={cluster.id}
                  type="button"
                  onClick={() => handleSelectCluster(cluster.id)}
                  className={`text-sm px-3.5 py-2 rounded-xl font-semibold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#ede0c8] text-[#473016] border border-[#d2be9b] shadow-2xs'
                      : 'bg-[#faf7f2] text-[#4d4234] border border-[#e4ded4] hover:bg-[#f3ebd9] hover:border-[#d9cbaf]'
                  }`}
                  title={cluster.hint}
                >
                  <CategoryGroupIcon
                    icon={cluster.id === 'ALL' ? 'folder' : cluster.icon}
                    className="w-4 h-4 shrink-0 text-[#694b29]"
                  />
                  <span>{cluster.label}</span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-mono tabular-nums ${
                      isActive ? 'bg-[#dfceb0] text-[#3d2912]' : 'bg-[#ede7dd] text-[#695d4f]'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* =====================================================================
          STAGE 2: Primary Tags (Tier 1 Main Tags)
      ====================================================================== */}
      <AnimatePresence initial={false}>
        {isTier1Open && (
          <motion.div
            key="tier1-accordion"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden p-0 m-0 border-none"
          >
            <div
              className={`rounded-xl p-3.5 space-y-2.5 transition-all duration-200 ${
                currentSubStep === 2
                  ? 'bg-white border-2 border-[#b5cde2] ring-2 ring-[#e4eff8]'
                  : 'bg-white border border-[#e5dfd5]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#35465c] flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-[#dbe8f4] text-[#1b3d5d] text-xs font-mono font-bold flex items-center justify-center">
                    2
                  </span>
                  <span>
                    ขั้นที่ 2 — ป้ายแท็กหลัก (คลิกเพื่อติดแท็ก/ดูกลุ่มย่อย){' '}
                    {isSearching
                      ? `(ผลค้นหา "${searchQuery}")`
                      : activeClusterObj
                      ? `ในมิติ "${activeClusterObj.label}"`
                      : ''}
                    :
                  </span>
                </span>
                {activeMainCat && !isSearching && (
                  <span className="text-xs text-[#2b4c6b] font-bold">
                    กำลังดู: #{activeMainCat.name}
                  </span>
                )}
              </div>

              {filteredMainCategories.length === 0 ? (
                <div className="text-xs text-[#8c8072] italic py-2.5 text-center bg-[#faf7f2] rounded-lg border border-dashed border-[#e3dbcf]">
                  {isSearching
                    ? `ไม่พบป้ายแท็กหลักที่ตรงกับ "${searchQuery}"`
                    : 'ยังไม่มีป้ายแท็กหลักในมิตินี้'}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {filteredMainCategories.map((mainCat) => {
                    const isSelected = selectedTagIds.includes(mainCat.id);
                    const isActive = activeMainCatId === mainCat.id;

                    return (
                      <button
                        key={mainCat.id}
                        type="button"
                        onClick={() => handleSelectMainCategory(mainCat.id)}
                        className={`text-sm px-3.5 py-2 rounded-xl font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                          isSelected && isActive
                            ? 'bg-[#d8eaf6] text-[#143d60] border border-[#a8cee9] shadow-2xs ring-2 ring-[#c0dcf2]'
                            : isSelected
                            ? 'bg-[#e7f1f9] text-[#1c476d] border border-[#b8d6ec]'
                            : isActive
                            ? 'bg-[#faf8f5] text-[#33465e] border border-[#b8cee2]'
                            : 'bg-[#faf7f2] text-[#4d4234] border border-[#e4ded4] hover:bg-[#f3ebd9]'
                        }`}
                        title={mainCat.description || mainCat.name}
                      >
                        {isSelected ? (
                          <Check className="w-3.5 h-3.5 text-[#1b5585] shrink-0" />
                        ) : (
                          <Plus className="w-3.5 h-3.5 text-[#889cb2] shrink-0" />
                        )}
                        <span>#{mainCat.name}</span>
                        {isActive && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#1b5585] ml-0.5" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* =====================================================================
          STAGE 3: Sub-Tags & Attributes (Tier 2)
      ====================================================================== */}
      <AnimatePresence initial={false}>
        {isTier2Open && (
          <motion.div
            key="tier2-accordion"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden p-0 m-0 border-none"
          >
            <div
              className={`rounded-xl p-3.5 space-y-2.5 transition-all duration-200 ${
                currentSubStep === 3
                  ? 'bg-white border-2 border-[#c2dac7] ring-2 ring-[#e8f5ec]'
                  : 'bg-white border border-[#e5dfd5]'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-[#d6eedc] text-[#1c4b2a] text-xs font-mono font-bold flex items-center justify-center">
                    3
                  </span>
                  <span className="text-xs font-bold text-[#354a39]">
                    ขั้นที่ 3 — ป้ายแท็กย่อย / บุคคล{' '}
                    {isSearching ? (
                      <span className="text-[#245b34] font-bold">(ตรงกับคำค้นหา)</span>
                    ) : (
                      <>
                        ใต้ <span className="text-[#245b34] font-bold">#{activeMainCat?.name}</span>
                      </>
                    )}
                    :
                  </span>
                  {activeCatSelectedSubCount > 0 && (
                    <span className="text-xs font-mono font-semibold text-[#1f4e2c] bg-[#edf7ef] px-2 py-0.5 rounded-md border border-[#cbe5d2] tabular-nums">
                      เลือกแล้ว {activeCatSelectedSubCount}
                    </span>
                  )}
                </div>

                {!isAddingNewSub && activeMainCat && (
                  <button
                    type="button"
                    onClick={() => setIsAddingNewSub(true)}
                    className="text-xs font-bold text-[#2e623b] hover:text-[#184423] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>เพิ่มป้ายแท็กย่อยใหม่</span>
                  </button>
                )}
              </div>

              {/* Inline Add New Subcategory Form (Pastel Earth Tone) */}
              <AnimatePresence initial={false}>
                {isAddingNewSub && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.16 }}
                    className="overflow-hidden p-0 m-0 border-none"
                  >
                    <form
                      onSubmit={handleCreateSubcategory}
                      className="bg-[#faf5eb] border border-[#e3d3ba] p-3 rounded-xl space-y-2 mb-1"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <input
                          type="text"
                          placeholder="เช่น พี่แจ๊ส, FiveM, ในกองถ่าย, จังหวะหลุดขำ..."
                          value={newSubName}
                          onChange={(e) => setNewSubName(e.target.value)}
                          autoFocus
                          className="flex-1 min-w-[160px] bg-white border border-[#d8c5a6] rounded-lg px-3 py-1.5 text-sm text-[#3d3326] focus:outline-hidden focus:ring-1 focus:ring-[#9e7c4f]"
                        />

                        <select
                          value={newSubType}
                          onChange={(e) => setNewSubType(e.target.value as EntitySubtype)}
                          className="bg-white border border-[#d8c5a6] rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[#4f4233] focus:outline-hidden"
                        >
                          <option value="PERSON">บุคคล / สตรีมเมอร์</option>
                          <option value="ANIMAL">สัตว์</option>
                          <option value="TOPIC">หัวข้อ / เกม / ประเด็น</option>
                          <option value="ACTION">กิริยา / มุก</option>
                          <option value="GENERAL">ทั่วไป</option>
                        </select>

                        <button
                          type="submit"
                          disabled={!newSubName.trim()}
                          className="bg-[#78593a] hover:bg-[#604427] disabled:opacity-50 text-white text-xs px-3.5 py-1.5 rounded-lg font-bold shrink-0 cursor-pointer transition-colors"
                        >
                          บันทึกแท็ก
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsAddingNewSub(false)}
                          className="text-xs text-[#7d7162] hover:text-[#3d3429] px-2 py-1.5 font-semibold cursor-pointer"
                        >
                          ยกเลิก
                        </button>
                      </div>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Subcategory Pills Container */}
              <div className="max-h-44 overflow-y-auto pr-1 p-2.5 rounded-xl bg-[#faf8f5] border border-[#e5dfd5] overscroll-contain">
                {displayedSubcategories.length === 0 ? (
                  <p className="text-xs text-[#8c8072] italic py-1.5 text-center">
                    ยังไม่มีป้ายแท็กย่อยใต้หมวดนี้ กด &quot;+ เพิ่มป้ายแท็กย่อยใหม่&quot; เพื่อสร้างแท็กแรกได้ทันที
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2 items-center">
                    {displayedSubcategories.map((sub) => {
                      const isSelected = selectedTagIds.includes(sub.id);
                      return (
                        <button
                          key={sub.id}
                          type="button"
                          onClick={() => handleToggleSubcategory(sub)}
                          className={`text-sm px-3 py-1.5 rounded-xl font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                            isSelected
                              ? 'bg-[#d5ebda] text-[#144220] font-bold border border-[#aed7b7] shadow-2xs ring-2 ring-[#c5e6cd]'
                              : 'bg-white text-[#4a3f31] border border-[#dfd7ca] hover:bg-[#edf6f0] hover:border-[#c5dfcc]'
                          }`}
                        >
                          {isSelected ? (
                            <Check className="w-3.5 h-3.5 text-[#1b572a] shrink-0" />
                          ) : (
                            <Plus className="w-3.5 h-3.5 text-[#88a891] shrink-0" />
                          )}
                          <span className="text-sm shrink-0">{getEntityIcon(sub)}</span>
                          <span>#{sub.name}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
