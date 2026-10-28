import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AlertTriangle } from 'lucide-react';
import { DuplicateSubcategoryWarning } from './builder.types';

interface DiversityCollisionBannerProps {
  duplicateSubcategories: DuplicateSubcategoryWarning[];
}

export const DiversityCollisionBanner: React.FC<DiversityCollisionBannerProps> = ({
  duplicateSubcategories,
}) => {
  return (
    <AnimatePresence initial={false}>
      {duplicateSubcategories.length > 0 && (
        <motion.div
          key="diversity-collision-banner"
          initial={{ height: 0, opacity: 0, y: -6 }}
          animate={{ height: 'auto', opacity: 1, y: 0 }}
          exit={{ height: 0, opacity: 0, y: -6 }}
          transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
          className="overflow-hidden"
        >
          <div className="bg-amber-50 border border-amber-300 rounded-xl px-3.5 py-2.5 flex items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2 text-amber-950">
              <span className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>หมวดย่อยซ้ำกันในโหมดรวมหลากหลาย:</span>
              </span>
              {duplicateSubcategories.map((item, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-semibold"
                >
                  #{item.tag.name} (อันดับ {item.ranks.join(', ')})
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
