import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FolderPlus,
  Layers,
  Sliders,
  Trash2,
} from 'lucide-react';
import { useCMS } from '../../context/CMSContext';
import { Modal } from '../ui/Modal';
import { Tab1StatusRulesConfig } from './tabs/Tab1StatusRulesConfig';
import {
  CategoryFormDraftState,
  Tab2CategoryForm,
} from './tabs/Tab2CategoryForm';
import { Tab3HierarchyExplorer } from './tabs/Tab3HierarchyExplorer';

export type TagModalTabId = 'RULES' | 'FORM' | 'HIERARCHY';

const INITIAL_FORM_STATE: CategoryFormDraftState = {
  editingTagId: null,
  name: '',
  tier: 1,
  parentId: '',
  groupType: 'THEME',
  entityType: 'PERSON',
  color: 'blue',
  description: '',
  jumpedFromHierarchy: false,
};

export const CategoryTagManagerModal: React.FC = () => {
  const {
    isTagManagerOpen,
    setIsTagManagerOpen,
    setIsClearClipsModalOpen,
    tags,
    categoryMatrix,
    settings,
    computedFootage,
    createTag,
    updateTag,
    deleteTag,
    updateSettings,
  } = useCMS();

  const [activeTab, setActiveTab] = useState<TagModalTabId>('RULES');
  const [formState, setFormState] = useState<CategoryFormDraftState>(INITIAL_FORM_STATE);

  const mainCategoriesList = useMemo(
    () => tags.filter((t) => t.tier === 1 || (!t.parentId && !t.tier)),
    [tags]
  );

  const subcategoriesCount = useMemo(
    () => tags.filter((t) => t.tier === 2 || Boolean(t.parentId)).length,
    [tags]
  );

  const handleResetForm = () => {
    setFormState(INITIAL_FORM_STATE);
  };

  const handleSaveTag = (e: React.FormEvent): string | null => {
    e.preventDefault();
    const trimmedName = formState.name.trim();
    if (!trimmedName) return null;

    if (formState.editingTagId) {
      updateTag(formState.editingTagId, {
        name: trimmedName,
        groupType: formState.groupType,
        color: formState.color,
        description: formState.description.trim(),
        tier: formState.tier,
        parentId: formState.tier === 2 ? formState.parentId || null : null,
        entityType: formState.tier === 2 ? formState.entityType : undefined,
      });
    } else {
      createTag(
        trimmedName,
        formState.groupType,
        formState.color,
        formState.description.trim(),
        formState.tier,
        formState.tier === 2 ? formState.parentId || null : null,
        formState.tier === 2 ? formState.entityType : undefined
      );
    }

    // Keep tier & parentId if user is batch-adding subcategories under a parent
    if (!formState.editingTagId && formState.tier === 2 && formState.parentId) {
      setFormState((prev) => ({
        ...prev,
        editingTagId: null,
        name: '',
        description: '',
      }));
    } else {
      handleResetForm();
    }

    return trimmedName;
  };

  // Triggered from Tab 3 ("แก้ไข") -> Automatically switches to Tab 2 with prefilled data
  const handleStartEditFromHierarchy = (tagId: string) => {
    const target = tags.find((item) => item.id === tagId);
    if (!target) return;

    setFormState({
      editingTagId: target.id,
      name: target.name,
      groupType: target.groupType,
      color: target.color,
      description: target.description || '',
      tier: target.tier || (target.parentId ? 2 : 1),
      parentId: target.parentId || '',
      entityType: target.entityType || 'PERSON',
      jumpedFromHierarchy: true,
    });
    setActiveTab('FORM');
  };

  // Triggered from Tab 3 ("+ เพิ่มหมวดย่อย") -> Automatically switches to Tab 2 with Parent preselected
  const handleQuickAddChildFromHierarchy = (parentTagId: string) => {
    const parent = tags.find((t) => t.id === parentTagId);
    setFormState({
      editingTagId: null,
      name: '',
      description: '',
      tier: 2,
      parentId: parentTagId,
      color: parent ? parent.color : 'purple',
      groupType: parent ? parent.groupType : 'THEME',
      entityType: 'PERSON',
      jumpedFromHierarchy: true,
    });
    setActiveTab('FORM');
  };

  const handleAddNewMainCategoryFromHierarchy = () => {
    setFormState({
      ...INITIAL_FORM_STATE,
      tier: 1,
      jumpedFromHierarchy: true,
    });
    setActiveTab('FORM');
  };

  const TABS_CONFIG: {
    id: TagModalTabId;
    step: string;
    label: string;
    shortLabel: string;
    badge?: string;
    icon: React.ReactNode;
    activePastel: string;
    dotColor: string;
  }[] = [
    {
      id: 'RULES',
      step: '01',
      label: 'ตั้งค่าเกณฑ์สี 4 สถานะ',
      shortLabel: 'ตั้งค่าเกณฑ์สี',
      badge: `${settings.cooldownDays}d / ${settings.greenReadyDays}d`,
      icon: <Sliders className="w-4 h-4" />,
      activePastel: 'text-sky-950 border-sky-200 bg-sky-50/90',
      dotColor: 'bg-sky-400',
    },
    {
      id: 'FORM',
      step: '02',
      label: formState.editingTagId ? 'แก้ไขหมวดหมู่ที่เลือก' : 'เพิ่มหมวดหมู่หลัก & ย่อย',
      shortLabel: formState.editingTagId ? 'แก้ไขหมวดหมู่' : 'เพิ่มหมวดหมู่',
      badge: formState.editingTagId ? 'โหมดแก้ไข' : formState.tier === 2 ? 'Tier 2' : 'Tier 1',
      icon: <FolderPlus className="w-4 h-4" />,
      activePastel: 'text-purple-950 border-purple-200 bg-purple-50/90',
      dotColor: 'bg-purple-400',
    },
    {
      id: 'HIERARCHY',
      step: '03',
      label: 'จัดการผังหมวดหมู่ 2 ชั้น',
      shortLabel: 'ผัง 2 ชั้น',
      badge: `${mainCategoriesList.length} หลัก · ${subcategoriesCount} ย่อย`,
      icon: <Layers className="w-4 h-4" />,
      activePastel: 'text-emerald-950 border-emerald-200 bg-emerald-50/90',
      dotColor: 'bg-emerald-400',
    },
  ];

  return (
    <Modal
      isOpen={isTagManagerOpen}
      onClose={() => setIsTagManagerOpen(false)}
      title="ตั้งค่าเกณฑ์สี & จัดการผังหมวดหมู่ฟุตเทจ 2 ชั้น"
      subtitle="เรียงลำดับ 3 ขั้นตอนเข้าใจง่าย: 01 ตั้งค่าเกณฑ์สี ➔ 02 เพิ่ม/แก้ไขหมวดหมู่ ➔ 03 จัดการผังหมวดหมู่ 2 ชั้น"
      maxWidthClass="max-w-5xl"
    >
      <div className="space-y-5">
        {/* Top Pastel 3-Step Tab Navigation Bar (Responsive on Mobile, Tablet & Desktop) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-slate-100/90 border border-slate-200/90 p-1.5 rounded-2xl">
          <div className="grid grid-cols-3 gap-1.5 flex-1">
            {TABS_CONFIG.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative min-h-[46px] px-2.5 sm:px-4 py-2 rounded-xl text-left transition-colors cursor-pointer flex items-center justify-between gap-2 ${
                    isActive
                      ? 'text-slate-900 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50 font-semibold'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTagModalTabPill"
                      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                      className={`absolute inset-0 rounded-xl border-2 shadow-xs ${tab.activePastel}`}
                    />
                  )}

                  <div className="relative z-10 flex items-center gap-2 min-w-0">
                    <span
                      className={`w-6 h-6 rounded-lg text-[11px] font-mono font-bold flex items-center justify-center shrink-0 ${
                        isActive
                          ? 'bg-white text-slate-900 shadow-2xs border border-slate-200/70'
                          : 'bg-slate-200/70 text-slate-600'
                      }`}
                    >
                      {tab.step}
                    </span>
                    <div className="min-w-0">
                      <div className="text-xs sm:text-sm truncate hidden md:block">
                        {tab.label}
                      </div>
                      <div className="text-xs truncate md:hidden">{tab.shortLabel}</div>
                    </div>
                  </div>

                  {tab.badge && (
                    <span
                      className={`relative z-10 hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold shrink-0 ${
                        isActive
                          ? 'bg-white/90 text-slate-800 border border-slate-200/80'
                          : 'bg-slate-200/70 text-slate-600'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${tab.dotColor}`} />
                      <span>{tab.badge}</span>
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Clear All Clips Action */}
          <button
            type="button"
            onClick={() => {
              setIsTagManagerOpen(false);
              setIsClearClipsModalOpen(true);
            }}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-[11px] font-bold text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 border border-rose-200/90 rounded-xl transition-colors cursor-pointer shrink-0 shadow-2xs"
            title="ล้างคลังคลิปทั้งหมด (เก็บหมวดหมู่ 3 ชั้นและการตั้งค่าไว้)"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
            <span className="sm:inline">ล้างคลังคลิปทั้งหมด</span>
          </button>
        </div>

        {/* Animated Tab Content Area */}
        <AnimatePresence mode="wait">
          {activeTab === 'RULES' && (
            <motion.div
              key="tab-1-rules"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <Tab1StatusRulesConfig
                settings={settings}
                computedFootage={computedFootage}
                onUpdateSettings={updateSettings}
                onProceedToTab2={() => setActiveTab('FORM')}
              />
            </motion.div>
          )}

          {activeTab === 'FORM' && (
            <motion.div
              key="tab-2-form"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <Tab2CategoryForm
                mainCategories={mainCategoriesList}
                allTags={tags}
                formState={formState}
                setFormState={setFormState}
                onSaveTag={handleSaveTag}
                onResetForm={handleResetForm}
                onGoToHierarchyTab={() => setActiveTab('HIERARCHY')}
              />
            </motion.div>
          )}

          {activeTab === 'HIERARCHY' && (
            <motion.div
              key="tab-3-hierarchy"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <Tab3HierarchyExplorer
                mainCategories={mainCategoriesList}
                allTags={tags}
                categoryMatrix={categoryMatrix}
                onQuickAddChild={handleQuickAddChildFromHierarchy}
                onStartEdit={handleStartEditFromHierarchy}
                onDeleteTag={deleteTag}
                onAddNewMainCategory={handleAddNewMainCategoryFromHierarchy}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Modal>
  );
};
