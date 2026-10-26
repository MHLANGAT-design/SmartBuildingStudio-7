import React, { useCallback, useMemo } from 'react';
import { useAppSelector } from '@/Application/ConfigureStore';

export const OpenButton: React.FC = () => {
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

  const isDocumentNode = selectedNode && (selectedNode.type === "Document" || selectedNode.Type === "Document");

  const handleAction = useCallback(() => {
    if (!selectedNode || !isDocumentNode) return;
    
    // 🚀 FIXED: Targets your functional designer layout path route to avoid the 404 Module Resource error!
    const path = `/designer`;
    
    console.log(`[Router Redirect Active]: Routing straight to workspace path container: ${path}`);
    window.location.href = path;
  }, [selectedNode, isDocumentNode]);

  return (
    <button
      type="button"
      onClick={handleAction}
      disabled={!isDocumentNode}
      className={`flex items-center space-x-1 h-8 px-2.5 rounded text-xs font-medium transition-colors ${
        isDocumentNode
          ? 'text-slate-200 hover:text-white bg-slate-700 hover:bg-slate-650 cursor-pointer'
          : 'text-slate-500 bg-slate-800/50 cursor-not-allowed'
      }`}
      style={{ outline: 'none' }}
      title={isDocumentNode ? "Open Selected Vector Layout Canvas" : "Select an Engineering Document sheet to open canvas"}
    >
      <span>📂</span>
      <span>Open</span>
    </button>
  );
};

export default OpenButton;
