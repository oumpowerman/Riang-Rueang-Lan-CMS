import React from 'react';
import {
  Car,
  Film,
  Flame,
  Folder,
  Gamepad2,
  Inbox,
  Mic,
  Monitor,
  PawPrint,
  Sparkles,
  Star,
  Tag,
  Trophy,
  Users,
  Utensils,
  Zap,
  LucideIcon,
} from 'lucide-react';

export interface GroupIconOption {
  key: string;
  label: string;
  icon: LucideIcon;
}

export const GROUP_ICON_OPTIONS: GroupIconOption[] = [
  { key: 'star', label: 'ดารา / คนดัง', icon: Star },
  { key: 'sparkles', label: 'ไวรัล / ไฮไลต์', icon: Sparkles },
  { key: 'users', label: 'ทีม / กลุ่มคน', icon: Users },
  { key: 'paw', label: 'สัตว์โลกแสนซน', icon: PawPrint },
  { key: 'zap', label: 'จังหวะฮา / โบ๊ะบ๊ะ', icon: Zap },
  { key: 'tag', label: 'ทั่วไป / ป้ายแท็ก', icon: Tag },
  { key: 'gamepad', label: 'เกม / สตรีมเมอร์', icon: Gamepad2 },
  { key: 'mic', label: 'สัมภาษณ์ / พากย์เสียง', icon: Mic },
  { key: 'trophy', label: 'การแข่งขัน / กีฬา', icon: Trophy },
  { key: 'utensils', label: 'วิถีสายกิน / อาหาร', icon: Utensils },
  { key: 'car', label: 'รถ / ท้องถนน', icon: Car },
  { key: 'film', label: 'รายการทีวี / ซีรีส์', icon: Film },
  { key: 'flame', label: 'ประเด็นร้อน / ดราม่า', icon: Flame },
  { key: 'monitor', label: 'ไลฟ์สตรีม / ไอที', icon: Monitor },
  { key: 'inbox', label: 'พื้นที่พักรอจัด', icon: Inbox },
  { key: 'folder', label: 'โฟลเดอร์มาตรฐาน', icon: Folder },
];

export const ICON_MAP: Record<string, LucideIcon> = {
  star: Star,
  sparkles: Sparkles,
  users: Users,
  paw: PawPrint,
  zap: Zap,
  tag: Tag,
  gamepad: Gamepad2,
  mic: Mic,
  trophy: Trophy,
  utensils: Utensils,
  car: Car,
  film: Film,
  flame: Flame,
  monitor: Monitor,
  inbox: Inbox,
  folder: Folder,
};

// Automatic backward compatibility mapping for legacy emojis in storage
export const LEGACY_EMOJI_TO_ICON_KEY: Record<string, string> = {
  '🌟': 'star',
  '🎭': 'sparkles',
  '🐾': 'paw',
  '⚡': 'zap',
  '🏷️': 'tag',
  '🎮': 'gamepad',
  '🎤': 'mic',
  '⚽': 'trophy',
  '🍔': 'utensils',
  '🚗': 'car',
  '🎬': 'film',
  '🏆': 'trophy',
  '🔥': 'flame',
  '💻': 'monitor',
  '📥': 'inbox',
  '📁': 'folder',
};

export function resolveIconKey(rawIcon?: string | null): string {
  if (!rawIcon) return 'folder';
  const trimmed = rawIcon.trim();
  if (LEGACY_EMOJI_TO_ICON_KEY[trimmed]) {
    return LEGACY_EMOJI_TO_ICON_KEY[trimmed];
  }
  if (ICON_MAP[trimmed.toLowerCase()]) {
    return trimmed.toLowerCase();
  }
  return 'folder';
}

interface CategoryGroupIconProps {
  icon?: string | null;
  className?: string;
  size?: number;
}

export const CategoryGroupIcon: React.FC<CategoryGroupIconProps> = ({
  icon,
  className = 'w-4 h-4',
  size,
}) => {
  const iconKey = resolveIconKey(icon);
  const IconComponent = ICON_MAP[iconKey] || Folder;

  return <IconComponent className={className} size={size} />;
};
