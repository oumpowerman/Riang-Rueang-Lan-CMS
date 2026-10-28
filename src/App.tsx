/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { DashboardView } from './components/dashboard/DashboardView';
import { EpisodeBuilderView } from './components/episodes/EpisodeBuilderView';
import { EpisodeDetailModal } from './components/episodes/EpisodeDetailModal';
import { MasterEpisodeArchiveView } from './components/episodes/MasterEpisodeArchiveView';
import { DirectFootageModal } from './components/footage/DirectFootageModal';
import { FootageLibraryView } from './components/footage/FootageLibraryView';
import { FootageTraceabilityModal } from './components/footage/FootageTraceabilityModal';
import { MobileNavigation } from './components/layout/MobileNavigation';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { SourceLibraryView } from './components/sources/SourceLibraryView';
import { SourceSplitterModal } from './components/sources/SourceSplitterModal';
import { CategoryTagManagerModal } from './components/tags/CategoryTagManagerModal';
import { ThreeTierCategoryManagerModal } from './components/tags/ThreeTierCategoryManagerModal';
import { StatusColorRulesModal } from './components/settings/StatusColorRulesModal';
import { ClearAllClipsModal } from './components/settings/ClearAllClipsModal';
import { E2EPipelineBoard } from './components/workflow/E2EPipelineBoard';
import { AuthModal } from './components/auth/AuthModal';
import { CMSProvider, useCMS } from './context/CMSContext';
import { AuthProvider } from './context/AuthContext';

const MainWorkspace: React.FC = () => {
  const { activeTab } = useCMS();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
        {/* Single-Screen Responsive Navbar */}
        <Navbar onOpenMobileMenu={() => setIsMobileMenuOpen(true)} />

        {/* Scrollable Content Viewport with Thin Scrollbars & Framer Motion Page Transitions */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-6 pb-24 md:pb-6">
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
      <DirectFootageModal />
      <SourceSplitterModal />
      <FootageTraceabilityModal />
      <EpisodeDetailModal />
      <CategoryTagManagerModal />
      <ThreeTierCategoryManagerModal />
      <StatusColorRulesModal />
      <ClearAllClipsModal />
      <AuthModal />
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
