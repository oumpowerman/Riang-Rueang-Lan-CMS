import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Edit3,
  Folder,
  FolderPlus,
  Layers,
  PawPrint,
  Plus,
  RotateCcw,
  Sparkles,
  Tag,
  Target,
  User,
  Zap,
} from 'lucide-react';
import {
  CategoryTag,
  CategoryTier,
  EntitySubtype,
  TagGroupType,
} from '../../../types/tag.types';
import {
  COLOR_OPTIONS,
  ENTITY_SUBTYPE_OPTIONS,
  TAG_GROUP_OPTIONS,
  getPastelColorConfig,
} from '../constants/tagPastelPalette';

export interface CategoryFormDraftState {
  editingTagId: string | null;
  name: string;
  tier: CategoryTier;
  parentId: string;
  groupType: TagGroupType;
  entityType: EntitySubtype;
  color: string;
  description: string;
  jumpedFromHierarchy?: boolean;
}

interface Tab2CategoryFormProps {
  mainCategories: CategoryTag[];
  allTags: CategoryTag[];
  formState: CategoryFormDraftState;
  setFormState: React.Dispatch<React.SetStateAction<CategoryFormDraftState>>;
  onSaveTag: (e: React.FormEvent) => string | null;
  onResetForm: () => void;
  onGoToHierarchyTab: () => void;
}

const getSubtypeIcon = (subtype?: EntitySubtype) => {
  if (subtype === 'PERSON') return <User className="w-3.5 h-3.5 text-indigo-600 shrink-0" />;
  if (subtype === 'ANIMAL') return <PawPrint className="w-3.5 h-3.5 text-emerald-600 shrink-0" />;
  if (subtype === 'TOPIC') return <Target className="w-3.5 h-3.5 text-rose-600 shrink-0" />;
  if (subtype === 'ACTION') return <Zap className="w-3.5 h-3.5 text-amber-600 shrink-0" />;
  return <Tag className="w-3.5 h-3.5 text-slate-500 shrink-0" />;
};

export const Tab2CategoryForm: React.FC<Tab2CategoryFormProps> = ({
  mainCategories,
  allTags,
  formState,
  setFormState,
  onSaveTag,
  onResetForm,
  onGoToHierarchyTab,
}) => {
  const [lastSavedName, setLastSavedName] = useState<string | null>(null);

  const selectedParent = mainCategories.find((m) => m.id === formState.parentId);
  const editingTag = formState.editingTagId
    ? allTags.find((t) => t.id === formState.editingTagId)
    : null;
  const activeColorConfig = getPastelColorConfig(formState.color);

  const handleSubmit = (e: React.FormEvent) => {
    const savedName = onSaveTag(e);
    if (savedName) {
      setLastSavedName(savedName);
      setTimeout(() => setLastSavedName(null), 4000);
    }
  };

  return (
    <div className="space-y-5">
      {/* Cross-Tab Context Banner (shown when editing or quick-adding child from Tab 3) */}
      <AnimatePresence mode="popLayout">
        {(formState.editingTagId || (formState.tier === 2 && selectedParent)) && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            className={`rounded-2xl p-3.5 sm:p-4 border-2 flex flex-wrap items-center justify-between gap-3 ${
              formState.editingTagId
                ? 'bg-amber-50/90 border-amber-200 text-amber-950'
                : 'bg-purple-50/90 border-purple-200 text-purple-950'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-xl bg-white border border-current/15 flex items-center justify-center text-base shadow-2xs">
                {formState.editingTagId ? (
                  <Edit3 className="w-4 h-4 text-amber-600" />
                ) : (
                  <span className="font-bold text-purple-600">↳</span>
                )}
              </span>
              <div>
                <div className="text-xs font-bold uppercase tracking-wider opacity-75">
                  {formState.editingTagId
                    ? `โหมดแก้ไขหมวดหมู่ (${formState.editingTagId})`
                    : 'โหมดเพิ่มหมวดย่อย (Tier 2) ภายใต้หมวดหลัก'}
                </div>
                <div className="text-sm font-bold">
                  {formState.editingTagId ? (
                    <>กำลังแก้ไข: &ldquo;{editingTag?.name || formState.name}&rdquo;</>
                  ) : (
                    <span className="flex items-center gap-1.5 flex-wrap">
                      <span>หมวดหมู่แม่ที่เลือกไว้:</span>
                      <span className="underline decoration-purple-400 font-bold inline-flex items-center gap-1">
                        <Folder className="w-3.5 h-3.5 text-purple-700 shrink-0" />
                        <span>{selectedParent?.name}</span>
                      </span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onResetForm}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold bg-white/90 hover:bg-white text-slate-700 border border-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>ล้างค่าเป็นฟอร์มใหม่</span>
              </button>
              <button
                type="button"
                onClick={onGoToHierarchyTab}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold bg-white/90 hover:bg-white text-indigo-700 border border-indigo-200 rounded-xl transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>กลับไปหน้าผัง 2 ชั้น</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Saved Toast Banner with Quick Link to Tab 3 */}
      <AnimatePresence>
        {lastSavedName && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-emerald-950"
          >
            <div className="flex items-center gap-2 text-xs sm:text-sm font-bold">
              <span className="w-6 h-6 rounded-full bg-emerald-200 text-emerald-900 flex items-center justify-center">
                <Check className="w-3.5 h-3.5" />
              </span>
              <span>
                บันทึกหมวดหมู่ <strong>&ldquo;{lastSavedName}&rdquo;</strong> เข้าสู่ระบบเรียบร้อยแล้ว!
              </span>
            </div>
            <button
              type="button"
              onClick={onGoToHierarchyTab}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-black bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl transition-colors cursor-pointer"
            >
              <span>ดูในผังหมวดหมู่ 2 ชั้น (แท็บ 3)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column (7 cols): Form Controls */}
        <div className="lg:col-span-7 space-y-4 bg-slate-50/70 border border-slate-200/90 rounded-2xl p-4 sm:p-5">
          {/* Step A: Select Tier 1 or Tier 2 */}
          <div>
            <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-2">
              1. เลือกระดับชั้นของหมวดหมู่ (2-Tier Hierarchy)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <motion.button
                type="button"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={() =>
                  setFormState((prev) => ({
                    ...prev,
                    tier: 1,
                    parentId: '',
                  }))
                }
                className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer flex items-start gap-3 ${
                  formState.tier === 1
                    ? 'bg-indigo-50/90 border-indigo-400 ring-2 ring-indigo-200/70 shadow-2xs'
                    : 'bg-white border-slate-200 hover:border-indigo-200'
                }`}
              >
                <span className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 text-base font-black">
                  ⭐
                </span>
                <div>
                  <div className="text-xs font-black text-indigo-950">
                    Tier 1 · หมวดหมู่หลัก (Main)
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                    หัวข้อใหญ่ประจำช่อง เช่น ดาราฮาๆ, สัตว์เลี้ยง, เกมเมอร์
                  </p>
                </div>
              </motion.button>

              <motion.button
                type="button"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={() =>
                  setFormState((prev) => {
                    const fallbackParent = prev.parentId || mainCategories[0]?.id || '';
                    const parentObj = mainCategories.find((m) => m.id === fallbackParent);
                    return {
                      ...prev,
                      tier: 2,
                      parentId: fallbackParent,
                      color: parentObj ? parentObj.color : prev.color,
                    };
                  })
                }
                className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer flex items-start gap-3 ${
                  formState.tier === 2
                    ? 'bg-purple-50/90 border-purple-400 ring-2 ring-purple-200/70 shadow-2xs'
                    : 'bg-white border-slate-200 hover:border-purple-200'
                }`}
              >
                <span className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 text-base font-black">
                  ↳
                </span>
                <div>
                  <div className="text-xs font-black text-purple-950">
                    Tier 2 · หมวดย่อย / บุคคล (Sub)
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                    ชื่อดารา สัตว์ หรือหัวข้อย่อยที่อยู่ภายใต้หมวดหลักอีกที
                  </p>
                </div>
              </motion.button>
            </div>
          </div>

          {/* Step B (Conditional for Tier 2): Select Parent Category & Entity Subtype */}
          <AnimatePresence initial={false}>
            {formState.tier === 2 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.22 }}
                className="overflow-hidden"
              >
                <div className="p-3.5 rounded-2xl bg-purple-50/60 border border-purple-200 space-y-3.5">
                  <div>
                    <label className="block text-xs font-black text-purple-950 mb-1.5">
                      เลือกหมวดหมู่หลัก (Parent Category) ที่สังกัด *
                    </label>
                    <select
                      required
                      value={formState.parentId}
                      onChange={(e) => {
                        const nextParentId = e.target.value;
                        const parentObj = mainCategories.find((m) => m.id === nextParentId);
                        setFormState((prev) => ({
                          ...prev,
                          parentId: nextParentId,
                          color: parentObj ? parentObj.color : prev.color,
                          groupType: parentObj ? parentObj.groupType : prev.groupType,
                        }));
                      }}
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm font-bold text-purple-950 bg-white border-2 border-purple-200 rounded-xl focus:outline-none focus:border-purple-500"
                    >
                      <option value="">-- เลือกหมวดหมู่หลัก (Tier 1) --</option>
                      {mainCategories.map((mainCat) => (
                        <option key={mainCat.id} value={mainCat.id}>
                          {mainCat.name} ({mainCat.id})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Entity Subtype Pastel Buttons */}
                  <div>
                    <label className="block text-xs font-bold text-purple-950 mb-1.5">
                      ประเภทของหมวดย่อย (Entity Subtype)
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {ENTITY_SUBTYPE_OPTIONS.map((opt) => {
                        const isSelected = formState.entityType === opt.value;
                        return (
                          <motion.button
                            key={opt.value}
                            type="button"
                            whileTap={{ scale: 0.96 }}
                            onClick={() =>
                              setFormState((prev) => ({ ...prev, entityType: opt.value }))
                            }
                            className={`px-2.5 py-2 rounded-xl border text-left transition-all cursor-pointer ${
                              isSelected
                                ? `${opt.pastelClass} border-current ring-2 ring-purple-200 font-bold`
                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold'
                            }`}
                          >
                            <div className="text-xs flex items-center gap-1.5">
                              {getSubtypeIcon(opt.value)}
                              <span className="truncate">{opt.label.split(' ')[0]}</span>
                            </div>
                            <div className="text-[10px] opacity-75 truncate mt-0.5">
                              {opt.desc}
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Step C: Category / Subcategory Name & Description */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-black text-slate-800 mb-1">
                {formState.tier === 1
                  ? '2. ชื่อหมวดหมู่หลัก (Tier 1) *'
                  : '2. ชื่อหมวดย่อย / ดารา / สัตว์ / หัวข้อ (Tier 2) *'}
              </label>
              <input
                type="text"
                required
                value={formState.name}
                onChange={(e) => setFormState((prev) => ({ ...prev, name: e.target.value }))}
                placeholder={
                  formState.tier === 1
                    ? 'เช่น 06 - ตำนานไวรัล, สัตว์โลกน่ารัก, รวมช็อตสตรีมเมอร์...'
                    : 'เช่น พี่แจ๊ส, เอก HRK, คอร์กี้, ปลาสวาย, เกมผี...'
                }
                className="w-full px-3.5 py-2.5 text-sm font-bold text-slate-900 bg-white border-2 border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                คำอธิบายแนวทางคัดฟุตเทจ (ไม่บังคับ)
              </label>
              <input
                type="text"
                value={formState.description}
                onChange={(e) =>
                  setFormState((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="เช่น เน้นจังหวะตลกธรรมชาติ ไม่ซ้ำมุกเดิม..."
                className="w-full px-3.5 py-2 text-xs font-medium text-slate-800 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-400"
              />
            </div>
          </div>

          {/* Step D: Group Type & Pastel Color Swatch Picker */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 pt-1">
            {formState.tier === 1 && (
              <div className="sm:col-span-5">
                <label className="block text-xs font-black text-slate-800 mb-1.5">
                  กลุ่มหมวดหมู่ (Group)
                </label>
                <select
                  value={formState.groupType}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      groupType: e.target.value as TagGroupType,
                    }))
                  }
                  className="w-full px-3 py-2 text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                >
                  {TAG_GROUP_OPTIONS.map((g) => (
                    <option key={g.value} value={g.value}>
                      {g.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className={formState.tier === 1 ? 'sm:col-span-7' : 'sm:col-span-12'}>
              <label className="block text-xs font-black text-slate-800 mb-1.5">
                เลือกโทนสีพาสเทลประจำป้าย ({activeColorConfig.shortLabel})
              </label>
              <div className="flex flex-wrap items-center gap-2 bg-white border border-slate-200 rounded-xl p-2.5">
                {COLOR_OPTIONS.map((c) => {
                  const isActive = formState.color === c.value;
                  return (
                    <motion.button
                      key={c.value}
                      type="button"
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.94 }}
                      onClick={() => setFormState((prev) => ({ ...prev, color: c.value }))}
                      title={c.label}
                      className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                        isActive
                          ? `${c.badgeBg} ring-2 ${c.ringColor} shadow-2xs scale-105`
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <span className={`w-3 h-3 rounded-full ${c.swatchBg}`} />
                      <span>{c.shortLabel.split(' ')[0]}</span>
                      {isActive && <Check className="w-3 h-3" />}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Live Pastel Preview & Quick Submit */}
        <div className="lg:col-span-5 flex flex-col justify-between gap-4 bg-gradient-to-br from-white via-indigo-50/30 to-purple-50/40 border border-slate-200 rounded-2xl p-4 sm:p-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-[11px] font-bold text-indigo-700">
                <Sparkles className="w-3.5 h-3.5" />
                <span>ตัวอย่างป้ายหมวดหมู่ (Live Preview)</span>
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                {formState.tier === 1 ? 'TIER 1 · MAIN' : 'TIER 2 · SUB'}
              </span>
            </div>

            {/* Preview Card */}
            <motion.div
              key={`${formState.tier}-${formState.color}-${formState.entityType}`}
              initial={{ opacity: 0.85, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`rounded-2xl p-4 border-2 ${activeColorConfig.pastelBg} ${activeColorConfig.pastelBorder} space-y-3 shadow-2xs`}
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${activeColorConfig.badgeBg}`}
                >
                  {formState.tier === 1 ? (
                    <span className="inline-flex items-center gap-1.5">
                      <Folder className="w-3.5 h-3.5 text-indigo-700 shrink-0" />
                      <span>{formState.name.trim() || 'ชื่อหมวดหมู่หลัก...'}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5">
                      {getSubtypeIcon(formState.entityType)}
                      <span>#{formState.name.trim() || 'ชื่อหมวดย่อย...'}</span>
                    </span>
                  )}
                </span>

                <span className="px-2 py-0.5 rounded-md bg-white/90 border border-slate-200 text-[10px] font-bold text-slate-600">
                  {formState.tier === 1 ? formState.groupType : formState.entityType}
                </span>
              </div>

              {formState.tier === 2 && (
                <div className="text-xs font-semibold text-slate-700 bg-white/80 rounded-xl px-3 py-2 border border-white flex items-center gap-1.5">
                  <span>สังกัดหมวดหลัก:</span>
                  <strong className="text-slate-900 inline-flex items-center gap-1">
                    {selectedParent ? (
                      <>
                        <Folder className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        <span>{selectedParent.name}</span>
                      </>
                    ) : (
                      'ยังไม่ได้เลือกหมวดหลัก'
                    )}
                  </strong>
                </div>
              )}

              <p className="text-xs text-slate-600 leading-relaxed">
                {formState.description.trim() ||
                  'ยังไม่ได้ระบุคำอธิบายแนวทางคัดเลือกคลิปของหมวดหมู่นี้'}
              </p>
            </motion.div>

            {/* Helpful UX Guide Box */}
            <div className="bg-white/90 border border-slate-200/80 rounded-xl p-3.5 space-y-2 text-xs text-slate-600">
              <div className="font-bold text-slate-800 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-indigo-500" />
                <span>โครงสร้างหมวดหมู่ 2 ชั้นทำงานอย่างไร?</span>
              </div>
              <p className="leading-relaxed">
                • <strong>Tier 1 (หมวดหลัก)</strong> ใช้จัดกลุ่มธีมใหญ่ของรายการ และเปรียบเทียบสัดส่วนการผลิตในหน้าคลังคลิปหลัก
              </p>
              <p className="leading-relaxed">
                • <strong>Tier 2 (หมวดย่อย)</strong> ใช้ระบุชื่อดารา สัตว์ หรือประเด็นย่อย เพื่อให้ระบบเช็คได้ว่ามีฟุตเทจครบ 5 คลิปสำหรับทำ <strong>Solo EP</strong> หรือยัง
              </p>
            </div>
          </div>

          {/* Submit & Secondary Buttons */}
          <div className="space-y-2 pt-2">
            <motion.button
              type="submit"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
            >
              {formState.editingTagId ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>บันทึกการแก้ไขหมวดหมู่</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>
                    {formState.tier === 1
                      ? 'เพิ่มหมวดหมู่หลักใหม่ (Tier 1)'
                      : 'เพิ่มหมวดย่อยใหม่ (Tier 2)'}
                  </span>
                </>
              )}
            </motion.button>

            <button
              type="button"
              onClick={onGoToHierarchyTab}
              className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <FolderPlus className="w-3.5 h-3.5 text-indigo-600" />
              <span>ไปดูผังหมวดหมู่ทั้งหมดในแท็บที่ 3</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
