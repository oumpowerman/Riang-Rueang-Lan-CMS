import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

export interface AnimatedMetricNumberProps {
  value: number;
  className?: string;
  suffix?: string;
}

/**
 * Reusable Spring Vertical Flip + Counter for KPI Metrics & Clip Counts
 */
export const AnimatedMetricNumber: React.FC<AnimatedMetricNumberProps> = ({
  value,
  className = '',
  suffix = '',
}) => {
  return (
    <span className={`inline-flex items-baseline overflow-hidden ${className}`}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={value}
          initial={{ y: 14, opacity: 0, filter: 'blur(3px)', scale: 0.92 }}
          animate={{ y: 0, opacity: 1, filter: 'blur(0px)', scale: 1 }}
          exit={{ y: -14, opacity: 0, filter: 'blur(3px)', scale: 0.92 }}
          transition={{
            type: 'spring',
            stiffness: 420,
            damping: 28,
            mass: 0.75,
          }}
          className="inline-block font-mono tabular-nums"
        >
          {value}
          {suffix}
        </motion.span>
      </AnimatePresence>
    </span>
  );
};
