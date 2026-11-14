/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { DashboardView } from './components/dashboard/DashboardView';
import { EpisodeBuilderView } from './components/episodes/EpisodeBuilderView';
import { EpisodeDetailModal } from './components/episodes/EpisodeDetailModal';
import { MasterEpisodeArchiveView } from './components/episodes/MasterEpisodeArchiveView';
import {
  DirectFootageModal,
  type SharedFootageInitialData,
} from './components/footage/DirectFootageModal';
import { GoogleDriveBatchImportModal } from './components/footage/GoogleDriveBatchImportModal';
import { SheetTagImportModal } from './components/footage/SheetTagImportModal';
import { BatchAssignCategoryModal } from './components/footage/BatchAssignCategoryModal';
import { BatchCategorizeFloatingBar } from './components/footage/BatchCategorizeFloatingBar';
import { FootageLibraryView } from './components/footage/FootageLibraryView';
import { FootageTraceabilityModal } from './components/footage/FootageTraceabilityModal';
import { VideoPreviewModal } from './components/footage/VideoPreviewModal';
import { MobileNavigation } from './components/layout/MobileNavigation';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { SourceLibraryView } from './components/sources/SourceLibraryView';
import { SourceSplitterModal } from './components/sources/SourceSplitterModal';
import { ThreeTierCategoryManagerModal } from './components/tags/ThreeTierCategoryManagerModal';
import { ClearAllClipsModal } from './components/settings/ClearAllClipsModal';
import { E2EPipelineBoard } from './components/workflow/E2EPipelineBoard';
import { AuthModal } from './components/auth/AuthModal';
import { SupabaseContentSyncModal } from './components/supabase/SupabaseContentSyncModal';
import { SupabaseConfigModal } from './components/supabase/SupabaseConfigModal';
import { OfflineIndicator } from './components/pwa/OfflineIndicator';
import { parseSharedInput } from './utils/platformDetector';
import { CMSProvider, useCMS } from './context/CMSContext';
import { AuthProvider } from './context/AuthContext';

const MainWorkspace: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    setIsDirectFootageModalOpen,
    isSupabaseSyncModalOpen,
    setIsSupabaseSyncModalOpen,
    isSupabaseConfigModalOpen,
    setIsSupabaseConfigModalOpen,
  } = useCMS();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [sharedInitialData, setSharedInitialData] =
    useState<SharedFootageInitialData | null>(null);

  // Intercept Web Share Target launches (?share-target=1&title=...&text=...&url=...)
  // and open the unified DirectFootageModal directly
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const isShareTarget = params.get('share-target') === '1';
    const rawUrl = params.get('url');
    const rawText = params.get('text');
    const rawTitle = params.get('title');

    if (isShareTarget || rawUrl || rawText) {
      const parsed = parseSharedInput(rawUrl, rawText, rawTitle);
      setSharedInitialData({
        url: parsed.url,
        suggestedTitle: parsed.suggestedTitle,
      });
      setActiveTab('FOOTAGE_LIBRARY');
      setIsDirectFootageModalOpen(true);

      // Clean up the query parameters from the URL bar without reloading
      const cleanUrl = window.location.pathname + window.location.hash;
      window.history.replaceState({}, document.title, cleanUrl);
    }
  }, [setActiveTab, setIsDirectFootageModalOpen]);

  return (
    <div className="h-screen w-screen overflow-hidden flex bg-slate-100/80 text-slate-900">
      {/* Auto-Expanding Hover Sidebar (Desktop/Laptop Only: hidden md:flex) */}
      <Sidebar />

      {/* Mobile Slide-Out Drawer + Fixed Bottom 5-Tab Bar (Mobile Only: md:hidden) */}
      <MobileNavigation
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Viewport Container */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Offline Mode Banner */}
        <OfflineIndicator />

        {/* Single-Screen Responsive Navbar */}
        <Navbar onOpenMobileMenu={() => setIsMobileMenuOpen(true)} />

        {/* Scrollable Content Viewport with Thin Scrollbars & Framer Motion Page Transitions */}
        <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden scrollbar-thin p-3 sm:p-6 pb-24 md:pb-6">
          <div className="max-w-[1440px] w-full mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              >
                {activeTab === 'DASHBOARD' && <DashboardView />}
                {activeTab === 'E2E_PIPELINE' && <E2EPipelineBoard />}
                {activeTab === 'FOOTAGE_LIBRARY' && <FootageLibraryView />}
                {activeTab === 'SOURCE_SPLITTER' && <SourceLibraryView />}
                {activeTab === 'EPISODE_BUILDER' && <EpisodeBuilderView />}
                {activeTab === 'MASTER_ARCHIVE' && <MasterEpisodeArchiveView />}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Global Interactive Modals */}
      <DirectFootageModal
        sharedInitialData={sharedInitialData}
        onClearSharedInitialData={() => setSharedInitialData(null)}
      />
      <SourceSplitterModal />
      <FootageTraceabilityModal />
      <VideoPreviewModal />
      <EpisodeDetailModal />
      <ThreeTierCategoryManagerModal />
      <ClearAllClipsModal />
      <AuthModal />
      <GoogleDriveBatchImportModal />
      <SheetTagImportModal />
      <BatchAssignCategoryModal />
      <SupabaseContentSyncModal
        isOpen={isSupabaseSyncModalOpen}
        onClose={() => setIsSupabaseSyncModalOpen(false)}
        onOpenConfig={() => setIsSupabaseConfigModalOpen(true)}
      />
      <SupabaseConfigModal
        isOpen={isSupabaseConfigModalOpen}
        onClose={() => setIsSupabaseConfigModalOpen(false)}
      />

      {/* Floating Batch Categorize Action Bar */}
      <BatchCategorizeFloatingBar />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <CMSProvider>
        <MainWorkspace />
      </CMSProvider>
    </AuthProvider>
  );
}
