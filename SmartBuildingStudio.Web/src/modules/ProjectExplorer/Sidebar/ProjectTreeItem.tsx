import React, { useCallback, useMemo, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/Application/ConfigureStore';
import { ExplorerNode } from '@/modules/ProjectExplorer/Models/ExplorerNode';
import { UseExplorerTree } from '@/modules/ProjectExplorer/Hooks/UseExplorerTree';
import { UseProjectTreeItemNavigation } from '@/modules/ProjectExplorer/Hooks/UseProjectTreeItemNavigation';
import { UseProjectTreeItemCreation } from '@/modules/ProjectExplorer/Hooks/UseProjectTreeItemCreation';
import { CreateDocumentModal } from '@/modules/ProjectExplorer/Components/CreateDocumentModal';

interface ProjectTreeItemProps {
  node: ExplorerNode;
  depth: number;
}

export const ProjectTreeItem: React.FC<ProjectTreeItemProps> = ({ node, depth }) => {
  const dispatch = useAppDispatch();
  const { childNodesMap, toggleExpand } = UseExplorerTree();

  // Navigation hook — no longer returns modal state.
  const { handleDocumentClick } = UseProjectTreeItemNavigation();
  const { handleCreateDocument } = UseProjectTreeItemCreation();

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createFloorId, setCreateFloorId] = useState<string | null>(null);

  const explorerState = useAppSelector((state: any) => state?.projectExplorer);
  const stateSelectedNodeId = explorerState?.selectedNodeId || null;
  const activeProjectId = explorerState?.activeProjectId || null;
  const activeBuildingId = explorerState?.activeBuildingId || null;
  const activeFloorId = explorerState?.activeFloorId || null;

  const activeNodeId = node.id || (node as any).Id;

  const isSelected = useMemo(() => {
    const activeSelectedId =
      stateSelectedNodeId && typeof stateSelectedNodeId === 'object'
        ? (stateSelectedNodeId as any).id || (stateSelectedNodeId as any).Id
        : stateSelectedNodeId;
    return (
      !!activeNodeId &&
      !!activeSelectedId &&
      String(activeSelectedId) === String(activeNodeId)
    );
  }, [stateSelectedNodeId, activeNodeId]);

  const isPartiallyActiveAncestor = useMemo(() => {
    if (isSelected) return false;
    const cleanId = String(activeNodeId);
    return (
      (node.type === 'Project' && cleanId === String(activeProjectId)) ||
      (node.type === 'Building' && cleanId === String(activeBuildingId)) ||
      (node.type === 'Floor' && cleanId === String(activeFloorId))
    );
  }, [isSelected, node.type, activeNodeId, activeProjectId, activeBuildingId, activeFloorId]);

  const isExpanded = !!node.isExpanded || !!(node as any).IsExpanded;
  const childNodes = childNodesMap[node.id || (node as any).Id] || [];
  const hasChildren = childNodes.length > 0;

  const handleItemSelectOnly = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();
      if (!activeNodeId) return;

      if (node.type === 'Document') {
        handleDocumentClick(node);
        return;
      }

      if (node.type === 'Floor') {
        // Selecting a Floor also selects its first document, which
        // drives the DocumentActionsPanel in the right column.
        dispatch({ type: 'projectExplorer/selectNode', payload: String(activeNodeId) });
        const existingDoc = childNodes.find((child) => child.type === 'Document');
        if (existingDoc) {
          handleDocumentClick(existingDoc);
        }
        return;
      }

      dispatch({ type: 'projectExplorer/selectNode', payload: String(activeNodeId) });
    },
    [activeNodeId, node, dispatch, handleDocumentClick, childNodes]
  );

  const handleArrowToggleOnly = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();
      const cleanId = node.id || (node as any).Id;
      if (!cleanId || node.type === 'Document') return;
      toggleExpand(cleanId);
    },
    [node.id, node.type, toggleExpand]
  );

  const typeIcon = useMemo(() => {
    switch (node.type) {
      case 'Project': return '🏢';
      case 'Building': return '🏬';
      case 'Floor': return '🥞';
      case 'Document': return '📄';
      default: return '📁';
    }
  }, [node.type]);

  const backgroundStyle = isSelected
    ? 'rgba(12, 74, 110, 0.9)'
    : isPartiallyActiveAncestor
    ? 'rgba(15, 23, 42, 0.4)'
    : 'transparent';

  const borderLeftStyle = isSelected
    ? '4px solid #38bdf8'
    : isPartiallyActiveAncestor
    ? '4px solid #0ea5e9'
    : '4px solid transparent';

  const handleOpenCreateModal = useCallback((floorNodeId: string) => {
    setCreateFloorId(floorNodeId);
    setCreateModalOpen(true);
  }, []);

  const handleCreateConfirm = useCallback(
    (docName: string) => {
      if (createFloorId) {
        handleCreateDocument(createFloorId, docName);
      }
      setCreateModalOpen(false);
      setCreateFloorId(null);
    },
    [createFloorId, handleCreateDocument]
  );

  const handleCreateCancel = useCallback(() => {
    setCreateModalOpen(false);
    setCreateFloorId(null);
  }, []);

  const createContext = useMemo(() => {
    if (!createFloorId) return { projectName: '', buildingName: '', floorName: '' };
    const state =
      (window as any).store?.getState?.() || (window as any).store?.state;
    const explorerSlice = state?.projectExplorer || state?.ProjectExplorer || {};
    const flatNodesArray = explorerSlice?.nodes || [];
    const findNodeById = (nodes: any[], targetId: string) => {
      if (!nodes || !Array.isArray(nodes)) return null;
      return nodes.find((n) => n && String(n.id) === String(targetId)) || null;
    };
    const floorNode = findNodeById(flatNodesArray, createFloorId);
    let floorName = floorNode?.name || 'Unknown Floor';
    let buildingName = 'Unknown Building';
    let projectName = 'Unknown Project';
    if (floorNode?.parentId) {
      const bNode = findNodeById(flatNodesArray, floorNode.parentId);
      if (bNode) {
        buildingName = bNode.name || 'Unknown Building';
        if (bNode.parentId) {
          const pNode = findNodeById(flatNodesArray, bNode.parentId);
          if (pNode) projectName = pNode.name || 'Unknown Project';
        }
      }
    }
    return { projectName, buildingName, floorName };
  }, [createFloorId]);

  return (
    <div className="sbs-tree-item-group w-full">
      <div
        onClick={handleItemSelectOnly}
        style={{
          paddingLeft: `${depth * 12 + 8}px`,
          background: backgroundStyle,
          borderLeft: borderLeftStyle,
        }}
        className={`flex items-center justify-between py-1.5 pr-2 rounded text-sm cursor-pointer select-none transition-all duration-150 group ${
          isSelected
            ? 'text-sky-200 font-semibold shadow-inner shadow-sky-400/10'
            : isPartiallyActiveAncestor
            ? 'text-sky-300/90 font-medium bg-slate-800/30'
            : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100'
        }`}
      >
        <div className="flex items-center space-x-2 truncate">
          {node.type !== 'Document' ? (
            <span
              onClick={handleArrowToggleOnly}
              className={`p-1 text-[10px] text-slate-500 transform transition-transform duration-100 hover:text-sky-400 ${
                isExpanded ? 'rotate-90' : ''
              }`}
            >
              ▶
            </span>
          ) : (
            <span className="w-4" />
          )}
          <span className="text-base leading-none">{typeIcon}</span>
          <span className="truncate">{node.name || (node as any).Name}</span>
        </div>

        <div className="flex items-center space-x-1.5 shrink-0">
          {node.type === 'Project' && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (typeof (window as any).openExplorerDialog === 'function') {
                  (window as any).openExplorerDialog('NEW_BUILDING', activeNodeId);
                }
              }}
              className="opacity-0 group-hover:opacity-100 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/10 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/20 transition-all outline-none"
            >
              + Bldg
            </button>
          )}
          {node.type === 'Building' && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (typeof (window as any).openExplorerDialog === 'function') {
                  (window as any).openExplorerDialog('NEW_FLOOR', activeNodeId);
                }
              }}
              className="opacity-0 group-hover:opacity-100 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/20 transition-all outline-none"
            >
              + Floor
            </button>
          )}
          {node.type === 'Floor' && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenCreateModal(String(activeNodeId));
              }}
              className="opacity-0 group-hover:opacity-100 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 hover:bg-amber-500/30 text-amber-400 border border-amber-500/20 transition-all outline-none"
            >
              + Doc
            </button>
          )}
          {(node.isLocked || (node as any).IsLocked) && (
            <span className="text-amber-500 text-xs" title="Asset Checked Out Locked">
              🔒
            </span>
          )}
        </div>
      </div>

      {isExpanded && hasChildren && (
        <div className="sbs-tree-children-wrapper mt-0.5 space-y-0.5">
          {childNodes.map((childNode) => (
            <ProjectTreeItem
              key={childNode.id || (childNode as any).Id}
              node={childNode}
              depth={depth + 1}
            />
          ))}
        </div>
      )}

      {/* DesignAccessModal was here — removed. Document actions now render
          inline in the Explorer's right-hand column via
          DocumentActionsPanel, driven by the store's selectedNodeId. */}

      <CreateDocumentModal
        isOpen={createModalOpen}
        onClose={handleCreateCancel}
        onCreate={handleCreateConfirm}
        projectName={createContext.projectName}
        buildingName={createContext.buildingName}
        floorName={createContext.floorName}
      />
    </div>
  );
};

export default ProjectTreeItem;