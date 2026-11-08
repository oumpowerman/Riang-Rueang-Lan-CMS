import React from 'react';
import { Database, RefreshCw } from 'lucide-react';
import { SupabaseSyncProgress } from '../../types/supabaseSync.types';

interface SupabaseSyncProgressViewProps {
  progress: SupabaseSyncProgress;
}

export const SupabaseSyncProgressView: React.FC<SupabaseSyncProgressViewProps> = ({
  progress,
}) => {
  return (
    <div className="p-8 max-w-lg mx-auto text-center space-y-5">
      <div className="w-16 h-16 rounded-2xl bg-[#EEF5EE] border border-[#BAD8BF] flex items-center justify-center mx-auto text-[#2E7D32] shadow-xs">
        <RefreshCw className="w-8 h-8 animate-spin" />
      </div>

      <div className="space-y-1.5">
        <h3 className="text-base font-bold text-[#2D241E]">
          {progress.phaseLabel}
        </h3>
        {progress.currentTitle && (
          <p className="text-xs text-[#6E5F52] truncate max-w-sm mx-auto">
            {progress.currentTitle}
          </p>
        )}
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="w-full bg-[#E5DED4] h-2.5 rounded-full overflow-hidden">
          <div
            className="bg-[#3B6845] h-full transition-all duration-300 rounded-full"
            style={{ width: `${progress.percent}%` }}
          />
        </div>
        <div className="flex justify-between text-xs font-mono text-[#6E5F52]">
          <span>{progress.percent}%</span>
          <span>
            {progress.completedItems} / {progress.totalItems} รายการ
          </span>
        </div>
      </div>
    </div>
  );
};
