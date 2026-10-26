import React, { useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/Application/ConfigureStore';
import { deleteExplorerNode } from '@/modules/ProjectExplorer/Store/ProjectExplorerThunks';

export const DeleteButton: React.FC = () => {
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
    const nodeName = selectedNode.name || "this asset node";

    // 🚀 FIXED: Bypasses faulty modal layout boundaries to fire a native confirm dialogue prompt window cleanly!
    const executePurgeConfirmation = window.confirm(`🚨 EXTREME PURGE SYSTEM WARNING:\n\nAre you absolutely certain you want to permanently erase and delete "${nodeName}" from remote SQL Server persistence indexes? This action cannot be reversed.`);
    
    if (executePurgeConfirmation) {
      dispatch(deleteExplorerNode(targetId) as any);
    }
  }, [selectedNode, stateSelectedNodeId, dispatch]);

  return (
    <button
      type="button"
      onClick={handleAction}
      disabled={!stateSelectedNodeId}
      className={`flex items-center space-x-1 h-8 px-2 rounded text-xs font-medium transition-colors ${
        stateSelectedNodeId ? 'text-red-400 hover:text-red-300 hover:bg-red-950/40 cursor-pointer' : 'text-slate-600 cursor-not-allowed bg-transparent'
      }`}
      style={{ outline: 'none' }}
      title="Purge Active Operational Unit Element File Profile"
    >
      <span>🗑️</span>
      <span>Delete</span>
    </button>
  );
};

export default DeleteButton;
