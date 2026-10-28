import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight } from 'lucide-react';
import { STAGING_TAG_ID, isFootageInStaging } from '../../../services/seedData';
import { ComputedFootage } from '../../../types/footage.types';
import { CategoryTag, SystemSettings } from '../../../types/tag.types';
import { PaginationBar } from '../../ui/PaginationBar';
import { StatusBadge } from '../../ui/StatusBadge';
import { TagPill } from '../../ui/TagPill';
import { FootageCard } from '../FootageCard';
import { ActiveScopeDescription, VaultViewMode } from './vault.types';

export interface VaultFootageResultsSectionProps {
  resultsTransitionKey: string;
  activeScopeDescription: ActiveScopeDescription;
  viewMode: VaultViewMode;
  filteredCount: number;
  paginatedFootage: ComputedFootage[];
  tagMap: Record<string, CategoryTag>;
  settings: SystemSettings;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onSelectForTraceability: (id: string) => void;
  onQuickTagClick: (tagId: string) => void;
  onResetFilters: () => void;
  onOpenDirectFootageModal: () => void;
}

export const VaultFootageResultsSection: React.FC<VaultFootageResultsSectionProps> = ({
  resultsTransitionKey,
  activeScopeDescription,
  viewMode,
  filteredCount,
  paginatedFootage,
  tagMap,
  settings,
  currentPage,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onSelectForTraceability,
  onQuickTagClick,
  onResetFilters,
  onOpenDirectFootageModal,
}) => {
  return (
    <AnimatePresence mode="wait" initial={false}>
      {filteredCount === 0 ? (
        <motion.div
          key={`empty-${resultsTransitionKey}`}
          initial={{ opacity: 0, y: 12, scale: 0.98, filter: 'blur(4px)' }}
          animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -8, scale: 0.98, filter: 'blur(3px)' }}
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
          className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-3"
        >
          <p className="text-base font-bold text-slate-900">
            ไม่พบฟุตเทจที่ตรงกับเงื่อนไขตัวกรองใน {activeScopeDescription.label}
          </p>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            ลองกดล้างตัวกรองทั้งหมด หรือเพิ่มฟุตเทจใหม่เข้าคลัง
          </p>
          <div className="pt-2 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={onResetFilters}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 cursor-pointer"
            >
              ล้างตัวกรองทั้งหมด
            </button>
            <button
              type="button"
              onClick={onOpenDirectFootageModal}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 cursor-pointer"
            >
              + เพิ่มฟุตเดี่ยว (Flow 1:1)
            </button>
          </div>
        </motion.div>
      ) : viewMode === 'GRID' ? (
        <motion.div
          key={`grid-${resultsTransitionKey}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.12 } }}
          className="space-y-4"
        >
          <motion.div
            layout
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5"
          >
            {paginatedFootage.map((ft, index) => (
              <motion.div
                key={ft.id}
                layout="position"
                initial={{
                  opacity: 0,
                  y: 22,
                  scale: 0.95,
                  filter: 'blur(4px)',
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  filter: 'blur(0px)',
                }}
                exit={{
                  opacity: 0,
                  y: -12,
                  scale: 0.95,
                  filter: 'blur(3px)',
                }}
                transition={{
                  type: 'spring',
                  stiffness: 380,
                  damping: 26,
                  mass: 0.78,
                  delay: Math.min(index * 0.045, 0.32),
                }}
              >
                <FootageCard
                  footage={ft}
                  onSelectForTraceability={onSelectForTraceability}
                  onQuickTagClick={onQuickTagClick}
                />
              </motion.div>
            ))}
          </motion.div>

          <PaginationBar
            currentPage={currentPage}
            totalItems={filteredCount}
            pageSize={pageSize}
            onPageChange={onPageChange}
            onPageSizeChange={onPageSizeChange}
            pageSizeOptions={[9, 18, 27, 45]}
            itemLabel="ฟุตเทจ"
          />
        </motion.div>
      ) : (
        <motion.div
          key={`table-${resultsTransitionKey}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8, transition: { duration: 0.12 } }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="space-y-4"
        >
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                    <th className="py-3 px-4 w-28">รหัส</th>
                    <th className="py-3 px-4">ชื่อคลิป</th>
                    <th className="py-3 px-4">หมวดหมู่</th>
                    <th className="py-3 px-4 w-44">สถานะความพร้อมใช้</th>
                    <th className="py-3 px-4 w-28 text-right">การจัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {paginatedFootage.map((ft, index) => (
                    <motion.tr
                      key={ft.id}
                      initial={{
                        opacity: 0,
                        y: 14,
                        filter: 'blur(3px)',
                      }}
                      animate={{
                        opacity: 1,
                        y: 0,
                        filter: 'blur(0px)',
                      }}
                      transition={{
                        type: 'spring',
                        stiffness: 400,
                        damping: 28,
                        delay: Math.min(index * 0.035, 0.28),
                      }}
                      onClick={() => onSelectForTraceability(ft.id)}
                      className="hover:bg-slate-50 cursor-pointer transition-colors group"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-slate-600 whitespace-nowrap tabular-nums">
                        {ft.id}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 text-sm line-clamp-1">
                          {ft.title}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {isFootageInStaging(ft.tags) ? (
                          <TagPill tag={tagMap[STAGING_TAG_ID]} />
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {ft.tags.map((tid) => (
                              <TagPill key={tid} tag={tagMap[tid]} />
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <StatusBadge
                          status={ft.cooldownStatus}
                          daysSinceLastUse={ft.daysSinceLastUsed}
                          cooldownDays={settings.cooldownDays}
                          greenReadyDays={settings.greenReadyDays}
                          usageLast90Days={ft.usageLast90Days}
                          totalUsageCount={ft.totalUsageCount}
                          maxTotalUsageCount={settings.maxTotalUsageCount}
                          compact
                        />
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 font-semibold text-slate-500 group-hover:text-slate-900">
                          <span>รายละเอียด</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <PaginationBar
            currentPage={currentPage}
            totalItems={filteredCount}
            pageSize={pageSize}
            onPageChange={onPageChange}
            onPageSizeChange={onPageSizeChange}
            pageSizeOptions={[10, 20, 30, 50]}
            itemLabel="ฟุตเทจ"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};
