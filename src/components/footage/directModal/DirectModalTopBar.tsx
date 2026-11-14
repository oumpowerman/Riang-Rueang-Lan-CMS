import React from 'react';
import { Check } from 'lucide-react';

interface DirectModalTopBarProps {
  currentStep: number;
  onSelectStep: (step: number) => void;
  canProceedToStep2: boolean;
  canProceedToStep3: boolean;
}

export const DirectModalTopBar: React.FC<DirectModalTopBarProps> = ({
  currentStep,
  onSelectStep,
  canProceedToStep2,
  canProceedToStep3,
}) => {
  const steps = [
    { num: 1, label: 'ลิงก์', ready: true },
    { num: 2, label: 'ชื่อคลิป', ready: canProceedToStep2 },
    { num: 3, label: 'หมวดหมู่', ready: canProceedToStep3 },
  ];

  return (
    <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#F4EFE6] rounded-xl border border-[#E5DACB]">
      {steps.map((s) => {
        const isActive = currentStep === s.num;
        const isPassed = currentStep > s.num;
        const canClick = s.ready || isPassed;

        return (
          <button
            key={s.num}
            type="button"
            disabled={!canClick}
            onClick={() => canClick && onSelectStep(s.num)}
            className={`flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              isActive
                ? 'bg-emerald-700 text-white shadow-2xs'
                : isPassed
                ? 'bg-emerald-100/80 text-emerald-900 hover:bg-emerald-100 cursor-pointer'
                : canClick
                ? 'bg-white/70 text-stone-700 hover:bg-white cursor-pointer'
                : 'text-stone-400 cursor-not-allowed'
            }`}
          >
            <span
              className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-mono font-bold shrink-0 ${
                isActive
                  ? 'bg-white text-emerald-800'
                  : isPassed
                  ? 'bg-emerald-600 text-white'
                  : 'bg-stone-200/80 text-stone-600'
              }`}
            >
              {isPassed ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : s.num}
            </span>
            <span>{s.label}</span>
          </button>
        );
      })}
    </div>
  );
};
