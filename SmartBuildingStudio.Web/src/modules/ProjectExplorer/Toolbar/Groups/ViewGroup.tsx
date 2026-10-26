import React from 'react';
import ExpandAllButton from '@/modules/ProjectExplorer/Toolbar/Buttons/ExpandAllButton';
import CollapseAllButton from '@/modules/ProjectExplorer/Toolbar/Buttons/CollapseAllButton';

export const ViewGroup: React.FC = () => {
  return (
    <div className="sbs-toolbar-group-view flex items-center space-x-1">
      <ExpandAllButton />
      <CollapseAllButton />
    </div>
  );
};

export default ViewGroup;
