import React from 'react';
import { motion } from 'motion/react';
import {
  Flame,
  Gem,
  Globe,
  PanelRightOpen,
  Shuffle,
  Sparkles,
  Star,
} from 'lucide-react';
import { MixRecipeId } from '../../../utils/collisionDetector';
import { RecipeShortfallNotice } from './builder.types';
import { RecipeShortfallNoticeBanner } from './RecipeShortfallNoticeBanner';

export const QUICK_MIX_RECIPES: {
  id: MixRecipeId;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  hint: string;
}[] = [
  {
    id: 'FORMULA_2_NEW_3_FRESH',
    title: 'สูตร 2 ใหม่ + 3 สด',
    icon: Star,
    hint: 'ใหม่ 2 + พักสด 3 (แนะนำ)',
  },
  {
    id: 'FORMULA_3_NEW_2_FRESH',
    title: 'สูตร 3 ใหม่ + 2 สด',
    icon: Flame,
    hint: 'ใหม่ 3 + พักสด 2',
  },
  {
    id: 'FORMULA_ALL_NEW',
    title: 'ใหม่แกะกล่อง 5',
    icon: Sparkles,
    hint: 'ฟุตใหม่ล้วน 5 คลิป',
  },
  {
    id: 'FORMULA_CLASSIC_RETRO_60D',
    title: 'ย้อนยุคพักนาน (>60 วัน)',
    icon: Gem,
    hint: 'ฟุตเก่าที่พักจนสด',
  },
];

interface BuilderStep2QuickRecipeBarProps {
  compact?: boolean;
  selectedNewCount: number;
  selectedFreshCount: number;
  activeRecipe: MixRecipeId;
  onApplyRecipe?: (recipe: MixRecipeId) => void;
  showManualPoolButton?: boolean;
  onOpenManualPool: () => void;
  allowCrossCategory: boolean;
  onDisableCrossCategory?: () => void;
  recipeShortfallNotice: RecipeShortfallNotice | null;
  onDismissRecipeShortfall?: () => void;
  onSwitchToOrAndRefill?: () => void;
  onEnableCrossCategoryAndRefill?: () => void;
}

export const BuilderStep2QuickRecipeBar: React.FC<
  BuilderStep2QuickRecipeBarProps
> = ({
  compact = false,
  selectedNewCount,
  selectedFreshCount,
  activeRecipe,
  onApplyRecipe,
  showManualPoolButton = false,
  onOpenManualPool,
  allowCrossCategory,
  onDisableCrossCategory,
  recipeShortfallNotice,
  onDismissRecipeShortfall,
  onSwitchToOrAndRefill,
  onEnableCrossCategoryAndRefill,
}) => {
  return (
    <div
      className={`bg-[#fdfbf7] border border-[#e8dfd3] rounded-2xl shadow-2xs ${
        compact ? 'p-3 space-y-2.5' : 'p-4 space-y-3'
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-bold text-[#2d2926]">
          <div className="w-6 h-6 rounded-lg bg-[#edf4ed] text-[#3b6845] flex items-center justify-center shrink-0">
            <Shuffle className="w-3.5 h-3.5" />
          </div>
          <span className={compact ? 'text-xs' : 'text-sm'}>
            สูตรผสมด่วน
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#faf7f2] border border-[#e8dfd3] text-[11px] font-mono tabular-nums whitespace-nowrap">
            <span className="text-[#855621] font-bold">
              ใหม่ {selectedNewCount}/5
            </span>
            <span className="text-[#d5cbc0]">·</span>
            <span className="text-[#2b5435] font-bold">
              สด {selectedFreshCount}/5
            </span>
          </div>

          {showManualPoolButton && (
            <motion.button
              type="button"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={onOpenManualPool}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#edf4ed] hover:bg-[#3b6845] text-[#244b2f] hover:text-white border border-[#bad8b9] text-xs font-bold cursor-pointer whitespace-nowrap"
            >
              <PanelRightOpen className="w-3.5 h-3.5" />
              <span>เปิดคลังเลือกเอง «</span>
            </motion.button>
          )}
        </div>
      </div>

      <div
        className={`grid gap-2 ${
          compact ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-4 gap-2.5'
        }`}
      >
        {QUICK_MIX_RECIPES.map((rec) => {
          const Icon = rec.icon;
          const isRecActive = activeRecipe === rec.id;
          return (
            <motion.button
              key={rec.id}
              type="button"
              whileHover={{ y: -2, scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onApplyRecipe && onApplyRecipe(rec.id)}
              className={`px-3 py-2 rounded-xl text-left border cursor-pointer flex items-center gap-2 ${
                isRecActive
                  ? 'bg-[#edf4ed] text-[#244b2f] border-[#bad8b9] ring-2 ring-[#a4c5a1]/40 shadow-xs'
                  : 'bg-[#faf7f2] hover:bg-white text-[#4d4740] border-[#e8dfd3]'
              }`}
              title={rec.hint}
            >
              <Icon className="w-3.5 h-3.5 shrink-0 text-[#3b6845]" />
              <span className="text-xs font-bold truncate">{rec.title}</span>
            </motion.button>
          );
        })}
      </div>

      {allowCrossCategory && (
        <div className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-[#edf4ed] border border-[#bad8b9] text-xs font-bold text-[#244b2f]">
          <span className="inline-flex items-center gap-1.5 min-w-0">
            <Globe className="w-3.5 h-3.5 text-[#3b6845] shrink-0" />
            <span className="truncate">กำลังสุ่มข้ามหมวด (ทั้งคลัง)</span>
          </span>
          {onDisableCrossCategory && (
            <button
              type="button"
              onClick={onDisableCrossCategory}
              className="px-2.5 py-0.5 rounded-lg bg-white hover:bg-[#faf7f2] text-[#244b2f] border border-[#bad8b9] text-[11px] font-bold cursor-pointer whitespace-nowrap shrink-0"
            >
              กลับกรอบเดิม
            </button>
          )}
        </div>
      )}

      <RecipeShortfallNoticeBanner
        notice={recipeShortfallNotice}
        onDismiss={() => onDismissRecipeShortfall?.()}
        onOpenManualPool={onOpenManualPool}
        onSwitchToOrAndRefill={() => onSwitchToOrAndRefill?.()}
        onEnableCrossCategoryAndRefill={() =>
          onEnableCrossCategoryAndRefill?.()
        }
      />
    </div>
  );
};
