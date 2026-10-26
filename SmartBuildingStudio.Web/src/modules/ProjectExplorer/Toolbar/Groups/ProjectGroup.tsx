// src/modules/ProjectExplorer/Toolbar/Groups/ProjectGroup.tsx
import React from 'react';
import { useAppSelector } from "@/Application/ConfigureStore";
import { selectSelectedNode, selectSelectedNodeId } from "@/modules/ProjectExplorer/Store/ProjectExplorerSelectors";
import RenameButton from '@/modules/ProjectExplorer/Toolbar/Buttons/RenameButton';
import DeleteButton from '@/modules/ProjectExplorer/Toolbar/Buttons/DeleteButton';
import SettingsButton from '@/modules/ProjectExplorer/Toolbar/Buttons/SettingsButton';

export const ProjectGroup: React.FC = () => {
  // Read selection metrics directly from the global store context.
  const selectedNode = useAppSelector(selectSelectedNode);
  const selectedNodeId = useAppSelector(selectSelectedNodeId);

  return (
    <div className="sbs-toolbar-group-project flex items-center space-x-1">
      <RenameButton selectedNode={selectedNode} selectedNodeId={selectedNodeId} />
      <DeleteButton selectedNode={selectedNode} selectedNodeId={selectedNodeId} />
      <SettingsButton selectedNode={selectedNode} selectedNodeId={selectedNodeId} />
    </div>
  );
};

export default ProjectGroup;