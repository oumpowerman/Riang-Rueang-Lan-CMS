import React from 'react';
import { SourcePlatform } from '../../../types/source.types';
import { PlatformIcon } from '../../footage/directModal/PlatformIcons';

interface DrivePlatformSelectorProps {
  platform: SourcePlatform;
  onChange: (platform: SourcePlatform) => void;
}

const PLATFORMS: {
  id: SourcePlatform;
  label: string;
  iconPlatform: 'YOUTUBE' | 'FACEBOOK' | 'TIKTOK' | 'INSTAGRAM' | 'TWITCH' | 'GENERIC_WEB';
  activeClass: string;
}[] = [
  {
    id: 'YOUTUBE',
    label: 'YouTube',
    iconPlatform: 'YOUTUBE',
    activeClass: 'bg-rose-50 text-rose-800 border-rose-300 ring-2 ring-rose-500/20 shadow-xs',
  },
  {
    id: 'FACEBOOK',
    label: 'Facebook',
    iconPlatform: 'FACEBOOK',
    activeClass: 'bg-blue-50 text-blue-800 border-blue-300 ring-2 ring-blue-500/20 shadow-xs',
  },
  {
    id: 'TIKTOK',
    label: 'TikTok',
    iconPlatform: 'TIKTOK',
    activeClass: 'bg-stone-100 text-stone-900 border-stone-400 ring-2 ring-stone-900/15 shadow-xs',
  },
  {
    id: 'INSTAGRAM',
    label: 'Instagram',
    iconPlatform: 'INSTAGRAM',
    activeClass: 'bg-fuchsia-50 text-fuchsia-800 border-fuchsia-300 ring-2 ring-fuchsia-500/20 shadow-xs',
  },
  {
    id: 'TWITCH',
    label: 'Twitch',
    iconPlatform: 'TWITCH',
    activeClass: 'bg-purple-50 text-purple-800 border-purple-300 ring-2 ring-purple-500/20 shadow-xs',
  },
  {
    id: 'OTHER',
    label: 'อื่นๆ',
    iconPlatform: 'GENERIC_WEB',
    activeClass: 'bg-emerald-50 text-emerald-800 border-emerald-300 ring-2 ring-emerald-500/20 shadow-xs',
  },
];

export const DrivePlatformSelector: React.FC<DrivePlatformSelectorProps> = ({
  platform,
  onChange,
}) => {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {PLATFORMS.map((p) => {
        const isSelected = platform === p.id;
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => onChange(p.id)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 border ${
              isSelected
                ? p.activeClass
                : 'bg-white hover:bg-stone-50 text-stone-600 border-stone-200/90'
            }`}
          >
            <PlatformIcon platform={p.iconPlatform} className="w-3.5 h-3.5 shrink-0" />
            <span>{p.label}</span>
          </button>
        );
      })}
    </div>
  );
};
