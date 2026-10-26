import React, { useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/Application/ConfigureStore';
import { renameExplorerNode } from '@/modules/ProjectExplorer/Store/ProjectExplorerThunks';

export const RenameButton: React.FC = () => {
  const dispatch = useAppDispatch();

  // Extract selected IDs securely directly from raw state slice tracks
  const stateSelectedNodeId = useAppSelector((state: any) => 
    state.projectExplorer?.selectedNodeId || state.ProjectExplorer?.selectedNodeId
  );
  
  const allRawNodes = useAppSelector((state: any) => 
    state.projectExplorer?.nodes || state.ProjectExplorer?.nodes || []
  );

  const selectedNode = useMemo(() => {
    if (!stateSelectedNodeId || !Array.isArray(allRawNodes)) return null;
    return allRawNodes.find((n: any) => n && String(n.id || n.Id || "") === String(stateSelectedNodeId)) || null;
  }, [stateSelectedNodeId, allRawNodes]);

  const handleAction = useCallback((e: React.MouseEvent) => {
    e.stopPropagation(); // Stop click events bubbling into background layers
    if (!selectedNode || !stateSelectedNodeId) return;
    
    const targetId = String(stateSelectedNodeId);
    const nodeName = selectedNode.name || "Selected Asset";

    // 🚀 FIXED: Replaced frozen modal dialog wrappers with a direct window.prompt to capture changes instantly!
    const incomingPromptName = window.prompt(`Modify structural name property token tag value:`, nodeName);
    
    if (incomingPromptName && incomingPromptName.trim() !== "") {
      dispatch(renameExplorerNode({ nodeId: targetId, newName: incomingPromptName.trim() }) as any);
    }
  }, [selectedNode, stateSelectedNodeId, dispatch]);

  return (
    <button
      type="button"
      onClick={handleAction}
      disabled={!stateSelectedNodeId}
      className={`flex items-center space-x-1 h-8 px-2 rounded text-xs font-medium transition-colors ${
        stateSelectedNodeId ? 'text-slate-300 hover:text-white hover:bg-slate-700 cursor-pointer' : 'text-slate-600 cursor-not-allowed'
      }`}
      style={{ outline: 'none' }}
      title="Rename Selected Structural Component Node"
    >
      <span>✏️</span>
      <span>Rename</span>
    </button>
  );
};

export default RenameButton;
