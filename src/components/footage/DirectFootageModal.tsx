import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useCMS } from '../../context/CMSContext';
import {
  STAGING_TAG_ID,
  isFootageInStaging,
  isStagingTagId,
  normalizeFootageTags,
} from '../../services/seedData';
import { generateNextId, generateStandardFileName } from '../../utils/fileNameGenerator';
import { Modal } from '../ui/Modal';
import { DirectModalTopBar } from './directModal/DirectModalTopBar';
import { DirectStepLinks } from './directModal/DirectStepLinks';
import { DirectStepDetails } from './directModal/DirectStepDetails';
import { DirectStepTagsAndNotes } from './directModal/DirectStepTagsAndNotes';

export const DirectFootageModal: React.FC = () => {
  const {
    isDirectFootageModalOpen,
    setIsDirectFootageModalOpen,
    computedFootage,
    addDirectFootage,
  } = useCMS();

  // Wizard Navigation State
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [direction, setDirection] = useState<number>(1);

  // Core Form Fields
  const [title, setTitle] = useState('');
  const [driveFileUrl, setDriveFileUrl] = useState('');
  const [originalUrl, setOriginalUrl] = useState('');

  // Metadata Fields
  const [durationSec, setDurationSec] = useState<number>(25);
  const [selectedTags, setSelectedTags] = useState<string[]>([STAGING_TAG_ID]);
  const [mascotNotes, setMascotNotes] = useState('');

  // Auto-ID & File Name Calculation
  const previewNextId = generateNextId(
    'FT',
    computedFootage.map((f) => f.id)
  );
  const previewFileName = generateStandardFileName(previewNextId, title || 'ชื่อช็อตฮา');

  // Validation States
  const hasTitle = Boolean(title.trim());
  const hasDriveUrl = Boolean(driveFileUrl.trim());
  const hasOriginalUrl = Boolean(originalUrl.trim());
  const hasAnyLink = hasDriveUrl || hasOriginalUrl;
  const canSubmit = hasTitle && hasAnyLink;

  const isInStaging = isFootageInStaging(selectedTags);
  const realTagCount = selectedTags.filter((id) => !isStagingTagId(id)).length;

  const goToStep = (newStep: number) => {
    setDirection(newStep > currentStep ? 1 : -1);
    setCurrentStep(newStep);
  };

  const handleAutoAdvanceFromStep1 = () => {
    // Smooth delayed auto-advance so user perceives the detected badge and transition
    setTimeout(() => {
      goToStep(2);
    }, 450);
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
  };

  const handleClose = () => {
    handleReset();
    setIsDirectFootageModalOpen(false);
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
      subtitle="ฟาร์มฟุตหรือเก็บบุ๊กมาร์กคลิปน่าสนใจเข้าคลัง"
      maxWidthClass="max-w-2xl"
      headerContent={
        <DirectModalTopBar
          previewNextId={previewNextId}
          previewFileName={previewFileName}
          originalUrl={originalUrl}
          driveFileUrl={driveFileUrl}
          isInStaging={isInStaging}
          tagCount={realTagCount}
          currentStep={currentStep}
          onSelectStep={goToStep}
          canProceedToStep2={hasAnyLink}
          canProceedToStep3={hasAnyLink && hasTitle}
        />
      }
    >
      <div className="space-y-4">
        {/* Sliding Step Carousel Container with Clear 100px Slide & Fade */}
        <div className="overflow-hidden relative min-h-[300px] px-1 py-1">
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
                  onValidAutoAdvance={handleAutoAdvanceFromStep1}
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
                  onBack={() => goToStep(1)}
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
      </div>
    </Modal>
  );
};
