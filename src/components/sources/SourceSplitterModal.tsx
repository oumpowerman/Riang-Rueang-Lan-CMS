import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SplitClipDraft, useCMS } from '../../context/CMSContext';
import { SourcePlatform } from '../../types/source.types';
import { generateNextId } from '../../utils/fileNameGenerator';
import { Modal } from '../ui/Modal';
import { SourceSplitterTopBar } from './sourceSplitter/SourceSplitterTopBar';
import { SourceStepInfo } from './sourceSplitter/SourceStepInfo';
import { SourceStepClips } from './sourceSplitter/SourceStepClips';

export const SourceSplitterModal: React.FC = () => {
  const {
    isSourceSplitterModalOpen,
    setIsSourceSplitterModalOpen,
    activeSourceForSplitting,
    sources,
    computedFootage,
    createSourceWithSplitFootage,
    appendSplitFootageToSource,
  } = useCMS();

  // Step and Slide State (Step 1: ข้อมูลต้นฉบับ, Step 2: รายการช็อต)
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [direction, setDirection] = useState<number>(1);

  // Source Fields (Brand new SRC-XXXX)
  const [title, setTitle] = useState('');
  const [originalUrl, setOriginalUrl] = useState('');
  const [platform, setPlatform] = useState<SourcePlatform>('FACEBOOK');
  const [channelOrCreator, setChannelOrCreator] = useState('');
  const [totalDuration, setTotalDuration] = useState('01:30:00');
  const [sourceTags, setSourceTags] = useState<string[]>(['TAG-0003']);

  // Multi-row Split Clips List
  const [clips, setClips] = useState<SplitClipDraft[]>([
    {
      title: '',
      timestampRange: '05:10 - 05:50',
      tags: [],
      mascotNotes: '',
    },
    {
      title: '',
      timestampRange: '18:20 - 19:00',
      tags: [],
      mascotNotes: '',
    },
  ]);

  // Sync state when modal opens or activeSourceForSplitting changes
  useEffect(() => {
    if (activeSourceForSplitting) {
      setTitle(activeSourceForSplitting.title);
      setOriginalUrl(activeSourceForSplitting.originalUrl);
      setPlatform(activeSourceForSplitting.platform);
      setChannelOrCreator(activeSourceForSplitting.channelOrCreator || '');
      setTotalDuration(activeSourceForSplitting.totalDuration || '01:30:00');
      setSourceTags([...activeSourceForSplitting.tags]);
      setClips([
        {
          title: '',
          timestampRange: '02:05:10 - 02:05:50',
          tags: [...activeSourceForSplitting.tags],
          mascotNotes: '',
        },
      ]);
      // Jump directly to Step 2 for existing source
      setCurrentStep(2);
      setDirection(1);
    } else {
      setTitle('');
      setOriginalUrl('');
      setPlatform('FACEBOOK');
      setChannelOrCreator('');
      setTotalDuration('01:30:00');
      setSourceTags(['TAG-0003']);
      setClips([
        {
          title: '',
          timestampRange: '05:10 - 05:50',
          tags: [],
          mascotNotes: '',
        },
        {
          title: '',
          timestampRange: '18:20 - 19:00',
          tags: [],
          mascotNotes: '',
        },
      ]);
      setCurrentStep(1);
      setDirection(1);
    }
  }, [activeSourceForSplitting, isSourceSplitterModalOpen]);

  const nextSourceId = generateNextId(
    'SRC',
    sources.map((s) => s.id)
  );

  const baseFootageIdNumber = (() => {
    let max = 0;
    for (const f of computedFootage) {
      const m = f.id.match(/^FT-(\d+)$/);
      if (m) {
        const n = parseInt(m[1], 10);
        if (n > max) max = n;
      }
    }
    return max;
  })();

  const goToStep = (newStep: number) => {
    setDirection(newStep > currentStep ? 1 : -1);
    setCurrentStep(newStep);
  };

  const handleAddClipRow = () => {
    setClips((prev) => [
      ...prev,
      {
        title: '',
        timestampRange: '',
        tags: activeSourceForSplitting ? [...activeSourceForSplitting.tags] : [],
        mascotNotes: '',
      },
    ]);
  };

  const handleRemoveClipRow = (index: number) => {
    if (clips.length <= 1) return;
    setClips((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleUpdateClipRow = (index: number, updates: Partial<SplitClipDraft>) => {
    setClips((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, ...updates } : item))
    );
  };

  const handleClose = () => {
    setIsSourceSplitterModalOpen(false);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const validClips = clips.filter((c) => c.title.trim() !== '');
    if (validClips.length === 0) return;

    if (activeSourceForSplitting) {
      appendSplitFootageToSource(activeSourceForSplitting.id, validClips);
    } else {
      if (!title.trim()) return;
      createSourceWithSplitFootage(
        {
          title: title.trim(),
          originalUrl: originalUrl.trim() || 'https://www.facebook.com/watch/live/?v=new_stream',
          platform,
          channelOrCreator: channelOrCreator.trim(),
          totalDuration: totalDuration.trim(),
          tags: sourceTags.length > 0 ? sourceTags : ['TAG-0001'],
          notes: '',
        },
        validClips
      );
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

  const currentSourceId = activeSourceForSplitting ? activeSourceForSplitting.id : nextSourceId;
  const initialShotOffset = activeSourceForSplitting
    ? activeSourceForSplitting.splitFootageIds.length
    : 0;

  return (
    <Modal
      isOpen={isSourceSplitterModalOpen}
      onClose={handleClose}
      title={activeSourceForSplitting ? `หั่นช็อตเพิ่ม: ${currentSourceId}` : 'หั่นคลิปยาว'}
      subtitle={
        activeSourceForSplitting
          ? `ต้นฉบับ: ${activeSourceForSplitting.title}`
          : 'สร้างต้นฉบับและแยกช็อตฮาเข้าคลัง'
      }
      maxWidthClass="max-w-4xl"
      headerContent={
        <SourceSplitterTopBar
          sourceId={currentSourceId}
          sourceTitle={title}
          originalUrl={originalUrl}
          platform={platform}
          clipCount={clips.length}
          currentStep={currentStep}
          onSelectStep={goToStep}
          isExistingSource={Boolean(activeSourceForSplitting)}
          canProceedToStep2={Boolean(title.trim() && originalUrl.trim())}
        />
      }
    >
      <div className="space-y-4">
        {/* Sliding Step Carousel Container with 100px Motion Slide */}
        <div className="overflow-hidden relative min-h-[360px] px-1 py-1">
          <AnimatePresence initial={false} custom={direction} mode="wait">
            {currentStep === 1 && (
              <motion.div
                key="source-step-1"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
              >
                <SourceStepInfo
                  title={title}
                  setTitle={setTitle}
                  originalUrl={originalUrl}
                  setOriginalUrl={setOriginalUrl}
                  platform={platform}
                  setPlatform={setPlatform}
                  channelOrCreator={channelOrCreator}
                  setChannelOrCreator={setChannelOrCreator}
                  totalDuration={totalDuration}
                  setTotalDuration={setTotalDuration}
                  sourceTags={sourceTags}
                  setSourceTags={setSourceTags}
                  isExistingSource={Boolean(activeSourceForSplitting)}
                  onNext={() => goToStep(2)}
                />
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div
                key="source-step-2"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
              >
                <SourceStepClips
                  clips={clips}
                  baseFootageIdNumber={baseFootageIdNumber}
                  initialShotOffset={initialShotOffset}
                  onAddClip={handleAddClipRow}
                  onRemoveClip={handleRemoveClipRow}
                  onUpdateClip={handleUpdateClipRow}
                  onBack={() => goToStep(1)}
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
