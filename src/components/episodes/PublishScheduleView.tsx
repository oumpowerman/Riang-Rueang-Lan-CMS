import React from 'react';
import { MasterEpisodeArchiveView } from './MasterEpisodeArchiveView';

/**
 * Re-exports MasterEpisodeArchiveView so any legacy import of PublishScheduleView
 * renders the full Master Episode Archive & Published DB seamlessly.
 */
export const PublishScheduleView: React.FC = () => {
  return <MasterEpisodeArchiveView />;
};
