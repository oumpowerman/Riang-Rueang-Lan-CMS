import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Copy,
  Check,
  Layers,
  ArrowLeft,
  ArrowRight,
  BookmarkPlus,
} from 'lucide-react';
import { useCMS } from '../../context/CMSContext';
import {
  STAGING_TAG_ID,
  isFootageInStaging,
  isStagingTagId,
  normalizeFootageTags,
} from '../../services/seedData';
import { generateNextId, generateStandardFileName } from '../../utils/fileNameGenerator';
import { detectPlatformFromUrl, getDefaultClipTitle } from '../../utils/platformDetector';
import { findDuplicateFootage } from '../../utils/duplicateDetector';
import { Modal } from '../ui/Modal';
import { DirectModalTopBar } from './directModal/DirectModalTopBar';
import { DirectStepLinks } from './directModal/DirectStepLinks';
import { DirectStepDetails } from './directModal/DirectStepDetails';
import { DirectStepTagsAndNotes } from './directModal/DirectStepTagsAndNotes';

export interface SharedFootageInitialData {
  url: string;
  suggestedTitle: string;
  fallbackNote?: string;
}

interface DirectFootageModalProps {
  sharedInitialData?: SharedFootageInitialData | null;
  onClearSharedInitialData?: () => void;
}

export const DirectFootageModal: React.FC<DirectFootageModalProps> = ({
  sharedInitialData,
  onClearSharedInitialData,
}) => {
  const {
    isDirectFootageModalOpen,
    setIsDirectFootageModalOpen,
    computedFootage,
    addDirectFootage,
    setActiveTab,
    setTraceabilityFootageId,
  } = useCMS();

  // Wizard Navigation State
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [direction, setDirection] = useState<number>(1);
  const [copiedFileName, setCopiedFileName] = useState(false);

  // Core Form Fields
  const [title, setTitle] = useState('');
  const [driveFileUrl, setDriveFileUrl] = useState('');
  const [originalUrl, setOriginalUrl] = useState('');

  // Metadata Fields
  const [durationSec, setDurationSec] = useState<number>(25);
  const [selectedTags, setSelectedTags] = useState<string[]>([STAGING_TAG_ID]);
  const [mascotNotes, setMascotNotes] = useState('');

  // Populate fields when launched via Web Share Target
  useEffect(() => {
    if (isDirectFootageModalOpen && sharedInitialData) {
      const incomingUrl = (sharedInitialData.url || '').trim();
      const detected = detectPlatformFromUrl(incomingUrl);
      if (detected?.type === 'GOOGLE_DRIVE') {
        setDriveFileUrl(incomingUrl);
        setOriginalUrl('');
      } else {
        setOriginalUrl(incomingUrl);
        setDriveFileUrl('');
      }

      setTitle(sharedInitialData.suggestedTitle || '');
      setMascotNotes(sharedInitialData.fallbackNote || '');
      setCurrentStep(1);
    }
  }, [isDirectFootageModalOpen, sharedInitialData]);

  // Auto-ID & File Name Calculation
  const previewNextId = generateNextId(
    'FT',
    computedFootage.map((f) => f.id)
  );
  const previewFileName = generateStandardFileName(
    previewNextId,
    title || getDefaultClipTitle(originalUrl || driveFileUrl)
  );

  // Validation States
  const hasTitle = Boolean(title.trim());
  const hasDriveUrl = Boolean(driveFileUrl.trim());
  const hasOriginalUrl = Boolean(originalUrl.trim());
  const hasAnyLink = hasDriveUrl || hasOriginalUrl;
  const canSubmit = hasTitle && hasAnyLink;

  // Real-time Duplicate Footage Detection
  const linkDuplicateMatch = useMemo(() => {
    if (!driveFileUrl.trim() && !originalUrl.trim()) return null;
    return findDuplicateFootage(computedFootage, {
      originalUrl,
      driveFileUrl,
    });
  }, [computedFootage, originalUrl, driveFileUrl]);

  const titleDuplicateMatch = useMemo(() => {
    if (!title.trim() && !driveFileUrl.trim() && !originalUrl.trim()) return null;
    return findDuplicateFootage(computedFootage, {
      title,
      originalUrl,
      driveFileUrl,
    });
  }, [computedFootage, title, originalUrl, driveFileUrl]);

  const isInStaging = isFootageInStaging(selectedTags);
  const realTagCount = selectedTags.filter((id) => !isStagingTagId(id)).length;

  const handleCopyFileName = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(previewFileName);
    setCopiedFileName(true);
    setTimeout(() => setCopiedFileName(false), 1600);
  };

  const goToStep = (newStep: number) => {
    setDirection(newStep > currentStep ? 1 : -1);
    setCurrentStep(newStep);
  };

  const handleSuggestedTitle = (suggested: string) => {
    if (suggested && !title.trim()) {
      setTitle(suggested);
    }
  };

  const handleReset = () => {
    setTitle('');
    setDriveFileUrl('');
    setOriginalUrl('');
    setDurationSec(25);
    setSelectedTags([STAGING_TAG_ID]);
    setMascotNotes('');
    setCurrentStep(1);
    setDirection(1);
    onClearSharedInitialData?.();
  };

  const handleClose = () => {
    handleReset();
    setIsDirectFootageModalOpen(false);
  };

  // Quick Save from Step 1 or Step 2 (auto-generates title if blank, keeps in Staging if no tags selected)
  const handleQuickSave = () => {
    if (!hasAnyLink) return;

    const finalTitle =
      title.trim() || getDefaultClipTitle(originalUrl.trim() || driveFileUrl.trim());
    const detected = detectPlatformFromUrl(originalUrl.trim() || driveFileUrl.trim());
    const autoNote =
      mascotNotes.trim() ||
      (!hasDriveUrl && detected
        ? `บันทึกด่วนจาก ${detected.name} (รอดาวน์โหลดฝากลิงก์ Google Drive)`
        : '');

    addDirectFootage({
      title: finalTitle,
      originalUrl: originalUrl.trim(),
      tags: normalizeFootageTags(selectedTags),
      driveFileUrl: driveFileUrl.trim(),
      mascotNotes: autoNote,
      durationSec: durationSec || 25,
    });

    if (!hasDriveUrl) {
      setActiveTab('FOOTAGE_LIBRARY');
    }

    handleClose();
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!canSubmit) return;

    addDirectFootage({
      title: title.trim(),
      originalUrl: originalUrl.trim(),
      tags: normalizeFootageTags(selectedTags),
      driveFileUrl: driveFileUrl.trim(),
      mascotNotes: mascotNotes.trim(),
      durationSec: durationSec || 25,
    });

    if (!hasDriveUrl) {
      setActiveTab('FOOTAGE_LIBRARY');
    }

    handleClose();
  };

  // GPU-accelerated Horizontal Slide & Fade Carousel (zero filter/layout conflict)
  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 36 : -36,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
      transition: {
        x: { type: 'spring' as const, stiffness: 360, damping: 32 },
        opacity: { duration: 0.16 },
      },
    },
    exit: (dir: number) => ({
      x: dir < 0 ? 36 : -36,
      opacity: 0,
      transition: {
        x: { duration: 0.14, ease: [0.4, 0, 1, 1] as const },
        opacity: { duration: 0.12 },
      },
    }),
  };

  const modalFooter = (
    <div className="w-full flex items-center justify-between gap-2">
      {currentStep > 1 ? (
        <button
          type="button"
          onClick={() => goToStep(currentStep - 1)}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg cursor-pointer shrink-0 whitespace-nowrap"
        >
          <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
          <span>กลับ</span>
        </button>
      ) : (
        <div />
      )}

      <div className="flex items-center gap-1.5 ml-auto">
        {currentStep < 3 && (
          <>
            <button
              type="button"
              disabled={!hasAnyLink}
              onClick={handleQuickSave}
              className={`inline-flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg border cursor-pointer whitespace-nowrap ${
                hasAnyLink
                  ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300 shadow-2xs'
                  : 'bg-stone-100 text-stone-400 border-stone-200 cursor-not-allowed'
              }`}
              title="บันทึกเข้าคลังทันที (ตั้งชื่อตามแพลตฟอร์มและเก็บเข้าพื้นที่พักรออัตโนมัติ)"
            >
              <BookmarkPlus className="w-3.5 h-3.5 shrink-0" />
              <span>บันทึกด่วน</span>
            </button>

            <button
              type="button"
              disabled={currentStep === 1 ? !hasAnyLink : !hasTitle}
              onClick={() => goToStep(currentStep + 1)}
              className={`inline-flex items-center justify-center gap-1 px-3.5 py-1.5 text-xs font-bold rounded-lg cursor-pointer whitespace-nowrap ${
                (currentStep === 1 ? hasAnyLink : hasTitle)
                  ? 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-2xs'
                  : 'bg-stone-100 text-stone-400 cursor-not-allowed'
              }`}
            >
              <span>ถัดไป</span>
              <ArrowRight className="w-3.5 h-3.5 shrink-0" />
            </button>
          </>
        )}

        {currentStep === 3 && (
          <motion.button
            type="button"
            disabled={!canSubmit}
            onClick={() => handleSubmit()}
            whileHover={canSubmit ? { scale: 1.01 } : undefined}
            whileTap={canSubmit ? { scale: 0.98 } : undefined}
            className={`inline-flex items-center justify-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-lg shadow-2xs cursor-pointer whitespace-nowrap ${
              canSubmit
                ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                : 'bg-stone-200 text-stone-400 cursor-not-allowed'
            }`}
          >
            {hasDriveUrl ? (
              <>
                <Check className="w-3.5 h-3.5 shrink-0" />
                <span>บันทึกพร้อมใช้ ({previewNextId})</span>
              </>
            ) : (
              <>
                <BookmarkPlus className="w-3.5 h-3.5 shrink-0" />
                <span>บันทึกเข้าคิว ({previewNextId})</span>
              </>
            )}
          </motion.button>
        )}
      </div>
    </div>
  );

  return (
    <Modal
      isOpen={isDirectFootageModalOpen}
      onClose={handleClose}
      title="นำเข้าฟุตเดี่ยว"
      maxWidthClass="max-w-xl"
      heightClass="h-[82dvh] sm:h-[600px] max-h-[90dvh] sm:max-h-[85dvh]"
      badge={
        <div className="inline-flex items-center gap-1">
          <button
            type="button"
            onClick={handleCopyFileName}
            title={`คลิกเพื่อคัดลอกชื่อไฟล์: ${previewFileName}`}
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-100/90 hover:bg-amber-200/80 text-amber-900 border border-amber-300/80 font-mono tabular-nums font-bold text-[11px] cursor-pointer select-none whitespace-nowrap"
          >
            <span>{previewNextId}</span>
            {copiedFileName ? (
              <Check className="w-2.5 h-2.5 text-emerald-700" />
            ) : (
              <Copy className="w-2.5 h-2.5 text-amber-700/80" />
            )}
          </button>

          <span
            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold border whitespace-nowrap ${
              isInStaging
                ? 'bg-stone-100 text-stone-700 border-stone-200'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
            }`}
          >
            <Layers className="w-2.5 h-2.5 shrink-0" />
            <span>{isInStaging ? 'พักรอ' : `${realTagCount} หมวด`}</span>
          </span>
        </div>
      }
      headerContent={
        <DirectModalTopBar
          currentStep={currentStep}
          onSelectStep={goToStep}
          canProceedToStep2={hasAnyLink}
          canProceedToStep3={hasAnyLink && hasTitle}
        />
      }
      footer={modalFooter}
    >
      <AnimatePresence initial={false} custom={direction} mode="wait">
        {currentStep === 1 && (
          <motion.div
            key="step-1"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
          >
            <DirectStepLinks
              originalUrl={originalUrl}
              setOriginalUrl={setOriginalUrl}
              driveFileUrl={driveFileUrl}
              setDriveFileUrl={setDriveFileUrl}
              duplicateMatch={linkDuplicateMatch}
              onViewFootage={setTraceabilityFootageId}
              onSuggestedTitle={handleSuggestedTitle}
            />
          </motion.div>
        )}

        {currentStep === 2 && (
          <motion.div
            key="step-2"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
          >
            <DirectStepDetails
              title={title}
              setTitle={setTitle}
              durationSec={durationSec}
              setDurationSec={setDurationSec}
              previewFileName={previewFileName}
              duplicateMatch={titleDuplicateMatch}
              onViewFootage={setTraceabilityFootageId}
              onNext={() => goToStep(3)}
            />
          </motion.div>
        )}

        {currentStep === 3 && (
          <motion.div
            key="step-3"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
          >
            <DirectStepTagsAndNotes
              selectedTags={selectedTags}
              setSelectedTags={setSelectedTags}
              mascotNotes={mascotNotes}
              setMascotNotes={setMascotNotes}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  );
};
