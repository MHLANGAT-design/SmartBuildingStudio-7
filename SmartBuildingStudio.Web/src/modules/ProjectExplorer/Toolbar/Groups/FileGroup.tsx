import React from 'react';
import NewProjectButton from '@/modules/ProjectExplorer/Toolbar/Buttons/NewProjectButton';
import OpenButton from '@/modules/ProjectExplorer/Toolbar/Buttons/OpenButton';
import RefreshButton from '@/modules/ProjectExplorer/Toolbar/Buttons/RefreshButton';

export const FileGroup: React.FC = () => {
  return (
    <div className="sbs-toolbar-group-file flex items-center space-x-1">
      <NewProjectButton />
      <OpenButton />
      <RefreshButton />
    </div>
  );
};

export default FileGroup;
