import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowRight,
  ChevronDown,
  Shuffle,
  Star,
  Flame,
  Sparkles,
  Gem,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Zap,
  Check,
  type LucideIcon,
} from 'lucide-react';
import { CategoryMatrixStat } from '../../context/CMSContext';
import { ComputedFootage } from '../../types/footage.types';
import { MixRecipeId } from '../../utils/collisionDetector';

interface SmartMixRecipeSelectorProps {
  isOpen: boolean;
  onToggle: () => void;
  onSkipToStep3: () => void;
  selectedFootages: (ComputedFootage | null)[];
  activeRecipe: MixRecipeId;
  activeCategoryStat: CategoryMatrixStat | null;
  onSelectRecipeAndMix: (recipe: MixRecipeId) => void;
}

const SLIDE_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

const RECIPES: {
  id: MixRecipeId;
  icon: LucideIcon;
  title: string;
  subtitle: string;
  requiredNew: number;
  requiredTotalUsable: number;
}[] = [
  {
    id: 'FORMULA_2_NEW_3_FRESH',
    icon: Star,
    title: 'สูตร 2 ใหม่ + 3 เก่าสด',
    subtitle: 'ใหม่ 2 + พักสด 3 (แนะนำ)',
    requiredNew: 2,
    requiredTotalUsable: 5,
  },
  {
    id: 'FORMULA_3_NEW_2_FRESH',
    icon: Flame,
    title: 'สูตร 3 ใหม่ + 2 เก่าสด',
    subtitle: 'ใหม่ 3 + พักสด 2',
    requiredNew: 3,
    requiredTotalUsable: 5,
  },
  {
    id: 'FORMULA_ALL_NEW',
    icon: Sparkles,
    title: 'ฟุตใหม่ล้วน 5 อันดับ',
    subtitle: 'คัดเฉพาะฟุตใหม่แกะกล่อง 5 ชิ้น',
    requiredNew: 5,
    requiredTotalUsable: 5,
  },
  {
    id: 'FORMULA_CLASSIC_RETRO_60D',
    icon: Gem,
    title: 'ย้อนยุคพักนาน (>60 วัน)',
    subtitle: 'คัดฟุตเก่าคลาสสิกที่พักจนสด',
    requiredNew: 0,
    requiredTotalUsable: 5,
  },
];

export const SmartMixRecipeSelector: React.FC<SmartMixRecipeSelectorProps> = ({
  isOpen,
  onToggle,
  onSkipToStep3,
  selectedFootages,
  activeRecipe,
  activeCategoryStat,
  onSelectRecipeAndMix,
}) => {
  const validFootages = selectedFootages.filter(
    (f): f is ComputedFootage => Boolean(f)
  );
  const totalSelected = validFootages.length;

  const newCount = validFootages.filter(
    (f) => f.cooldownStatus === 'NEW_UNTOUCHED'
  ).length;
  const freshRecycledCount = validFootages.filter(
    (f) => f.cooldownStatus === 'READY_FRESH'
  ).length;
  const warningOrCooldownCount = validFootages.filter(
    (f) =>
      f.cooldownStatus === 'HIGH_VELOCITY_WARNING' ||
      f.cooldownStatus === 'RECENT_COOLDOWN'
  ).length;

  const currentRecipeObj =
    RECIPES.find((r) => r.id === activeRecipe) || RECIPES[0];

  const catNew = activeCategoryStat?.newCount ?? 0;
  const catUsable = activeCategoryStat?.usableCount ?? 0;

  return (
    <motion.section
      layout="position"
      transition={{ duration: 0.28, ease: SLIDE_EASE }}
      className={`rounded-2xl border p-4 transition-colors duration-200 ${
        isOpen
          ? 'border-indigo-200/90 bg-indigo-50/40'
          : 'border-slate-200 bg-white shadow-2xs hover:border-indigo-200'
      }`}
    >
      {/* Persistent Accordion Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          onClick={!isOpen ? onToggle : undefined}
          className={`flex flex-wrap items-center gap-2 text-xs ${
            !isOpen ? 'cursor-pointer' : ''
          }`}
        >
          <span
            className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
              isOpen
                ? 'bg-indigo-600 text-white'
                : 'bg-indigo-100 text-indigo-900'
            }`}
          >
            {isOpen ? 'ขั้นที่ 2' : 'ขั้นที่ 2 · สูตรผสมอัตโนมัติ'}
          </span>

          {isOpen ? (
            <h2 className="text-sm font-bold text-slate-900">
              เลือกสูตรผสมอัตโนมัติ (คลิกเลือกสูตรเพื่อจัดลงช่อง 1–5 ทันที)
            </h2>
          ) : (
            <motion.div
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-wrap items-center gap-2"
            >
              <div className="flex items-center gap-1.5 font-bold text-slate-900">
                <currentRecipeObj.icon className="w-4 h-4 text-indigo-600" />
                <span>{currentRecipeObj.title}</span>
              </div>
              <span className="text-slate-400">·</span>
              <div className="inline-flex items-center gap-2 font-mono tabular-nums text-xs">
                <span className="inline-flex items-center gap-1 text-sky-700 font-bold bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200">
                  <Sparkles className="w-3 h-3 text-sky-600" />
                  <span>ใหม่ {newCount}</span>
                </span>
                <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>เก่าสด {freshRecycledCount}</span>
                </span>
                {warningOrCooldownCount > 0 && (
                  <span className="inline-flex items-center gap-1 text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                    <AlertTriangle className="w-3 h-3 text-amber-600" />
                    <span>{warningOrCooldownCount}</span>
                  </span>
                )}
              </div>
            </motion.div>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs">
          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => onSelectRecipeAndMix(activeRecipe)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-colors whitespace-nowrap cursor-pointer ${
              isOpen
                ? 'text-white bg-indigo-600 hover:bg-indigo-700'
                : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200'
            }`}
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span>{isOpen ? 'สุ่มจัดชุดใหม่' : 'สุ่มชุดใหม่'}</span>
          </motion.button>

          {isOpen ? (
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={onSkipToStep3}
              className="inline-flex items-center gap-1 px-3 py-1.5 font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl whitespace-nowrap cursor-pointer"
            >
              <span>ไปขั้นที่ 3: จัดอันดับ</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </motion.button>
          ) : (
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={onToggle}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold transition-colors cursor-pointer"
            >
              <span>เปลี่ยนสูตร</span>
              <motion.span
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ duration: 0.25 }}
                className="inline-flex"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </motion.span>
            </motion.button>
          )}
        </div>
      </div>

      {/* Animated Slide Up / Down Accordion Body */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="step2-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: SLIDE_EASE }}
            className="overflow-hidden"
          >
            <motion.div
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -10, opacity: 0 }}
              transition={{ duration: 0.24, ease: 'easeOut' }}
              className="pt-3.5 space-y-3.5"
            >
              {/* 4 Recipe Formula Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                {RECIPES.map((recipe) => {
                  const isSelected = activeRecipe === recipe.id;
                  const hasEnoughInCat =
                    catUsable >= recipe.requiredTotalUsable &&
                    catNew >= recipe.requiredNew;

                  return (
                    <motion.button
                      key={recipe.id}
                      type="button"
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => onSelectRecipeAndMix(recipe.id)}
                      className={`text-left p-3 rounded-xl border transition-colors flex flex-col justify-between gap-2 cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-100/90 text-indigo-950 border-indigo-500 ring-1 ring-indigo-300'
                          : 'bg-white text-slate-900 border-slate-200 hover:border-indigo-400'
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="text-xs font-bold flex items-center gap-1.5">
                          <recipe.icon className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-indigo-700' : 'text-indigo-600'}`} />
                          <span>{recipe.title}</span>
                        </div>
                        <div
                          className={`text-[11px] ${
                            isSelected ? 'text-indigo-800' : 'text-slate-500'
                          }`}
                        >
                          {recipe.subtitle}
                        </div>
                      </div>

                      <div className="pt-1.5 border-t border-indigo-200/50 flex items-center justify-between text-[10px] font-mono tabular-nums">
                        {hasEnoughInCat ? (
                          <span className="font-bold text-emerald-700 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>วัตถุดิบพอจัด</span>
                          </span>
                        ) : (
                          <span className="font-bold text-amber-700 flex items-center gap-1">
                            <Zap className="w-3 h-3 text-amber-600" />
                            <span>จัดเท่าที่มี ({catNew} ใหม่ / {catUsable} พร้อม)</span>
                          </span>
                        )}
                        <span className="underline font-sans font-bold text-indigo-700">
                          ใช้สูตร →
                        </span>
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              {/* Compact Live Mix Ratio Bar */}
              <div className="bg-white border border-indigo-100 rounded-xl px-3.5 py-2 flex flex-wrap items-center justify-between gap-3 text-xs font-mono tabular-nums">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="font-sans font-bold text-slate-700">
                    สัดส่วนที่เลือกตอนนี้ ({totalSelected}/5):
                  </span>
                  <span className="inline-flex items-center gap-1 text-sky-700 font-bold bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200">
                    <Sparkles className="w-3 h-3 text-sky-600" />
                    <span>ใหม่ {newCount}</span>
                  </span>
                  <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>เก่าพักสด {freshRecycledCount}</span>
                  </span>
                  {warningOrCooldownCount > 0 && (
                    <span className="inline-flex items-center gap-1 text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                      <AlertTriangle className="w-3 h-3 text-amber-600" />
                      <span>ใช้ถี่/พัก {warningOrCooldownCount}</span>
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
};
