// src/modules/ProjectExplorer/Toolbar/Groups/ProjectGroup.tsx

import React from 'react';
import RenameButton from '@/modules/ProjectExplorer/Toolbar/Buttons/RenameButton';
import DeleteButton from '@/modules/ProjectExplorer/Toolbar/Buttons/DeleteButton';
import SettingsButton from '@/modules/ProjectExplorer/Toolbar/Buttons/SettingsButton';

export const ProjectGroup: React.FC = () => {
  return (
    <div className="sbs-toolbar-group-project flex items-center space-x-1">
      <RenameButton />
      <DeleteButton />
      <SettingsButton />
    </div>
  );
};

export default ProjectGroup;