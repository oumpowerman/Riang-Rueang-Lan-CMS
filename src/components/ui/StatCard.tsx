import React from 'react';
import { motion } from 'motion/react';

interface StatCardProps {
  label: string;
  value: number | string;
  subtext: string;
  icon: React.ReactNode;
  emoji?: string;
  accentClass?: string;
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subtext,
  icon,
  emoji,
  accentClass = 'bg-slate-100 text-slate-700',
  onClick,
}) => {
  return (
    <motion.button
      type="button"
      whileHover={{ y: -3, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
      onClick={onClick}
      className="studio-card w-full text-left border border-slate-200/90 rounded-2xl p-5 transition-all cursor-pointer flex flex-col justify-between gap-2"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-semibold text-slate-600 whitespace-nowrap truncate">
          {emoji ? `${emoji} ${label}` : label}
        </span>
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${accentClass}`}>
          {icon}
        </div>
      </div>

      <div className="text-2xl font-extrabold text-slate-900 font-mono tabular-nums tracking-tight">
        {value}
      </div>

      <div className="text-xs text-slate-500 truncate">{subtext}</div>
    </motion.button>
  );
};
