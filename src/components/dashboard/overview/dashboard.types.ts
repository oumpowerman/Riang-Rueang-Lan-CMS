import { Variants } from 'motion/react';
import { CategoryMatrixStat } from '../../../context/CMSContext';
import { CooldownStatus, ComputedFootage } from '../../../types/footage.types';

export type WorkflowStep = 1 | 2 | 3 | 4;
export type DashboardViewMode = 'FOCUS' | 'ALL';
export type StepTransitionDirection = 1 | -1;

export const stepSectionVariants: Variants = {
  enter: (direction: number = 1) => ({
    opacity: 0,
    x: direction > 0 ? 36 : -36,
    scale: 0.985,
  }),
  center: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 340,
      damping: 30,
      mass: 0.85,
    },
  },
  exit: (direction: number = 1) => ({
    opacity: 0,
    x: direction > 0 ? -36 : 36,
    scale: 0.985,
    transition: {
      duration: 0.18,
      ease: [0.4, 0, 1, 1],
    },
  }),
};

export type CategoryFilterMode = 'ALL' | 'READY_EP' | 'ALMOST_READY' | 'TIER_1' | 'TIER_2';
export type CategorySortMode =
  | 'USABLE_DESC'
  | 'EP_QUOTA_DESC'
  | 'ALMOST_5_ASC'
  | 'TOTAL_DESC'
  | 'NAME_ASC';

export type FootageSortMode =
  | 'SMART_ROI'
  | 'REST_DAYS_DESC'
  | 'USAGE_DESC'
  | 'Usage_ASC'
  | 'ID_DESC';

export type StatusFilter = CooldownStatus | 'ALL';
export type FlowFilter = 'ALL' | 'DIRECT_1_TO_1' | 'SPLIT_1_TO_N';

export interface DashboardMetrics {
  total: number;
  newCount: number;
  readyCount: number;
  warningCount: number;
  cooldownCount: number;
  directCount: number;
  splitCount: number;
  usableTotal: number;
  totalProducibleEps: number;
  everUsedCount: number;
  utilizationRate: number;
  totalUsagesAllClips: number;
  avgUsagePerClip: string;
}

export interface DashboardProductionRadarData {
  readyCategories: CategoryMatrixStat[];
  almostReadyCategories: CategoryMatrixStat[];
  topRoiFootages: ComputedFootage[];
}

export interface StatusBadgeConfig {
  emoji: string;
  label: string;
  bg: string;
}

export const getStatusBadgeConfig = (status: CooldownStatus): StatusBadgeConfig => {
  switch (status) {
    case 'NEW_UNTOUCHED':
      return {
        emoji: '🔵',
        label: 'คลิปใหม่',
        bg: 'bg-sky-50 border-sky-200 text-sky-800',
      };
    case 'READY_FRESH':
      return {
        emoji: '🟢',
        label: 'พร้อมใช้',
        bg: 'bg-emerald-50 border-emerald-200 text-emerald-800',
      };
    case 'HIGH_VELOCITY_WARNING':
      return {
        emoji: '🟡',
        label: 'ใช้ถี่',
        bg: 'bg-amber-50 border-amber-200 text-amber-800',
      };
    case 'RECENT_COOLDOWN':
      return {
        emoji: '🔴',
        label: 'ติดคูลดาวน์',
        bg: 'bg-rose-50 border-rose-200 text-rose-800',
      };
  }
};
