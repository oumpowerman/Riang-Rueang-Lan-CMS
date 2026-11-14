import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Copy, Check, Layers } from 'lucide-react';
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

      if (sharedInitialData.suggestedTitle) {
        setTitle(sharedInitialData.suggestedTitle);
      }
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

  // Distinctive 100px Horizontal Slide & Fade Carousel
  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 100 : -100,
      opacity: 0,
      filter: 'blur(3px)',
    }),
    center: {
      x: 0,
      opacity: 1,
      filter: 'blur(0px)',
      transition: {
        x: { type: 'spring' as const, stiffness: 280, damping: 26 },
        opacity: { duration: 0.22 },
        filter: { duration: 0.2 },
      },
    },
    exit: (dir: number) => ({
      x: dir < 0 ? 100 : -100,
      opacity: 0,
      filter: 'blur(3px)',
      transition: {
        x: { type: 'spring' as const, stiffness: 280, damping: 26 },
        opacity: { duration: 0.18 },
        filter: { duration: 0.16 },
      },
    }),
  };

  return (
    <Modal
      isOpen={isDirectFootageModalOpen}
      onClose={handleClose}
      title="นำเข้าฟุตเดี่ยว"
      maxWidthClass="max-w-xl"
      badge={
        <div className="inline-flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleCopyFileName}
            title={`คลิกเพื่อคัดลอกชื่อไฟล์: ${previewFileName}`}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-100/90 hover:bg-amber-200/80 text-amber-900 border border-amber-300/80 font-mono font-bold text-xs cursor-pointer transition-all select-none"
          >
            <span>{previewNextId}</span>
            {copiedFileName ? (
              <Check className="w-3 h-3 text-emerald-700" />
            ) : (
              <Copy className="w-3 h-3 text-amber-700/80" />
            )}
          </button>

          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-semibold border ${
              isInStaging
                ? 'bg-stone-100 text-stone-700 border-stone-200'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
            }`}
          >
            <Layers className="w-3 h-3 shrink-0" />
            <span>{isInStaging ? 'พื้นที่พักรอ' : `${realTagCount} หมวดหมู่`}</span>
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
    >
      <div className="overflow-hidden relative">
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
                previewNextId={previewNextId}
                duplicateMatch={linkDuplicateMatch}
                onViewFootage={setTraceabilityFootageId}
                onSuggestedTitle={handleSuggestedTitle}
                onQuickSave={handleQuickSave}
                onNext={() => goToStep(2)}
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
                previewNextId={previewNextId}
                previewFileName={previewFileName}
                duplicateMatch={titleDuplicateMatch}
                onViewFootage={setTraceabilityFootageId}
                onBack={() => goToStep(1)}
                onQuickSave={handleQuickSave}
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
                previewNextId={previewNextId}
                hasDriveUrl={hasDriveUrl}
                hasOriginalUrl={hasOriginalUrl}
                canSubmit={canSubmit}
                onBack={() => goToStep(2)}
                onSubmit={handleSubmit}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Modal>
  );
};
