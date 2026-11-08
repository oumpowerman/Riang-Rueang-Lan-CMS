import React from 'react';
import { motion } from 'motion/react';
import {
  Inbox,
  PawPrint,
  Tag,
  Target,
  User,
  X,
  Zap,
} from 'lucide-react';
import { isStagingTagId } from '../../services/seedData';
import { CategoryTag } from '../../types/tag.types';

interface TagPillProps {
  tag: CategoryTag | undefined;
  parentTag?: CategoryTag | undefined;
  selected?: boolean;
  onClick?: () => void;
  onRemove?: () => void;
  count?: number;
  showEntityIcon?: boolean;
  showParent?: boolean;
  size?: 'sm' | 'md';
  activeLayoutId?: string;
}

const COLOR_PASTEL_MAP: Record<
  string,
  { bg: string; text: string; border: string; hover: string; activeBg: string }
> = {
  blue: {
    bg: 'bg-[#eef4f9]',
    text: 'text-[#24496b]',
    border: 'border-[#cce0ef]',
    hover: 'hover:bg-[#e2eef7]',
    activeBg: 'bg-[#d8eaf6] text-[#183955] border-[#b4d2e8]',
  },
  emerald: {
    bg: 'bg-[#edf5ee]',
    text: 'text-[#1e4a2d]',
    border: 'border-[#c7e0cb]',
    hover: 'hover:bg-[#e1efe4]',
    activeBg: 'bg-[#d4ebda] text-[#14371f] border-[#afd4b8]',
  },
  amber: {
    bg: 'bg-[#fbf5eb]',
    text: 'text-[#6e4b1c]',
    border: 'border-[#e8dac1]',
    hover: 'hover:bg-[#f5ead8]',
    activeBg: 'bg-[#f5e4cb] text-[#553810] border-[#dec49e]',
  },
  purple: {
    bg: 'bg-[#f4eff8]',
    text: 'text-[#50356c]',
    border: 'border-[#d9cbe6]',
    hover: 'hover:bg-[#ebe1f3]',
    activeBg: 'bg-[#e2d3ee] text-[#3e2557] border-[#c6b0db]',
  },
  rose: {
    bg: 'bg-[#faeeee]',
    text: 'text-[#7d3227]',
    border: 'border-[#eed0cc]',
    hover: 'hover:bg-[#f6e0dd]',
    activeBg: 'bg-[#f3d2cd] text-[#612117] border-[#e2b1a9]',
  },
  cyan: {
    bg: 'bg-[#edf7f6]',
    text: 'text-[#20514d]',
    border: 'border-[#c7e5e3]',
    hover: 'hover:bg-[#e0f1ef]',
    activeBg: 'bg-[#d0ece9] text-[#143f3b] border-[#aedcd7]',
  },
  indigo: {
    bg: 'bg-[#eff2f9]',
    text: 'text-[#2f4272]',
    border: 'border-[#cbd5ea]',
    hover: 'hover:bg-[#e3e9f6]',
    activeBg: 'bg-[#d6e0f3] text-[#213057] border-[#b3c3e4]',
  },
  slate: {
    bg: 'bg-[#f7f5f1]',
    text: 'text-[#544c41]',
    border: 'border-[#ded7cb]',
    hover: 'hover:bg-[#eee9e1]',
    activeBg: 'bg-[#e7dfd1] text-[#3d362d] border-[#cac0b0]',
  },
};

export const getEntityIconNode = (tag: CategoryTag): React.ReactNode => {
  if (isStagingTagId(tag.id) || tag.groupType === 'STAGING') {
    return <Inbox className="w-3.5 h-3.5 text-[#a16828] shrink-0" />;
  }
  if (tag.entityType === 'PERSON' || tag.groupType === 'PERSON') {
    return <User className="w-3.5 h-3.5 text-[#3b5284] shrink-0" />;
  }
  if (tag.entityType === 'ANIMAL') {
    return <PawPrint className="w-3.5 h-3.5 text-[#2d5f3d] shrink-0" />;
  }
  if (tag.entityType === 'TOPIC') {
    return <Target className="w-3.5 h-3.5 text-[#8f3e32] shrink-0" />;
  }
  if (tag.groupType === 'ACTION') {
    return <Zap className="w-3.5 h-3.5 text-[#916223] shrink-0" />;
  }
  return <Tag className="w-3.5 h-3.5 text-[#6c6457] shrink-0" />;
};

// Backward-compatible helper for legacy components expecting string (returns empty string or fallback)
export const getEntityIcon = (tag: CategoryTag): string => {
  if (isStagingTagId(tag.id) || tag.groupType === 'STAGING') return '';
  return '';
};

export const TagPill: React.FC<TagPillProps> = ({
  tag,
  parentTag,
  selected = false,
  onClick,
  onRemove,
  count,
  showEntityIcon = true,
  showParent = false,
  size = 'sm',
  activeLayoutId,
}) => {
  if (!tag) return null;

  const isStaging = isStagingTagId(tag.id) || tag.groupType === 'STAGING';
  const isSubcategory = tag.tier === 2 || Boolean(tag.parentId);
  const paddingClass = size === 'md' ? 'px-3 py-1.5 text-sm' : 'px-2.5 py-1 text-xs';

  const pastel = COLOR_PASTEL_MAP[tag.color] || COLOR_PASTEL_MAP.slate;
  const iconNode = showEntityIcon ? getEntityIconNode(tag) : null;
  const displayLabel = isStaging ? 'ไม่มีหมวดหมู่' : `#${tag.name}`;

  if (onClick || onRemove) {
    return (
      <motion.button
        type="button"
        whileHover={{ y: -1 }}
        whileTap={{ scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 450, damping: 28 }}
        onClick={onClick}
        className={`relative inline-flex items-center gap-1.5 ${paddingClass} font-semibold rounded-lg border transition-all whitespace-nowrap shrink-0 cursor-pointer overflow-hidden ${
          selected
            ? `${pastel.activeBg} shadow-2xs ring-2 ring-[#b0cbba]/70 font-bold`
            : isStaging
            ? 'bg-[#fef8ed] text-[#7a4c16] border-[#f0dbb2] hover:bg-[#faeed5]'
            : isSubcategory
            ? `${pastel.bg} ${pastel.text} ${pastel.border} ${pastel.hover}`
            : `${pastel.bg} ${pastel.text} ${pastel.border} ${pastel.hover}`
        }`}
      >
        <span className="relative z-10 inline-flex items-center gap-1.5">
          {iconNode}
          {showParent && parentTag && (
            <span className="text-[#8c8273] font-normal">{parentTag.name} &rsaquo;</span>
          )}
          <span>{displayLabel}</span>
          {count !== undefined && (
            <span className="font-mono tabular-nums opacity-85 text-xs">({count})</span>
          )}
          {onRemove && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.stopPropagation();
                  onRemove();
                }
              }}
              className="ml-0.5 hover:text-[#9c3629] transition-colors p-0.5 rounded hover:bg-[#eed7d3]/50"
              title="ลบแท็กนี้"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
        </span>
      </motion.button>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 ${paddingClass} font-semibold rounded-lg border ${
        isStaging
          ? 'bg-[#fef8ed] text-[#7a4c16] border-[#f0dbb2]'
          : isSubcategory
          ? `${pastel.bg} ${pastel.text} ${pastel.border}`
          : `${pastel.bg} ${pastel.text} ${pastel.border}`
      } whitespace-nowrap shrink-0`}
    >
      {iconNode}
      {showParent && parentTag && (
        <span className="text-[#8c8273] font-normal">{parentTag.name} &rsaquo;</span>
      )}
      <span>{displayLabel}</span>
      {count !== undefined && (
        <span className="font-mono tabular-nums opacity-75 text-xs">({count})</span>
      )}
    </span>
  );
};
