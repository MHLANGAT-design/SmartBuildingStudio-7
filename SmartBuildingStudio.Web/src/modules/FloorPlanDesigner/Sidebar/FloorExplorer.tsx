// src/modules/FloorPlanDesigner/Sidebar/FloorExplorer.tsx

import React, { useMemo } from 'react';
import { useAppSelector } from '@/Application/ConfigureStore';
import { Layers, HelpCircle } from 'lucide-react';

interface FloorExplorerProps {
  onClose?: () => void;
}

export const FloorExplorer: React.FC<FloorExplorerProps> = ({ onClose }) => {
  const explorerState = useAppSelector((state: any) => state.projectExplorer || state.ProjectExplorer || {});
  const flatNodesArray = explorerState.nodes || [];
  const selectedNodeId = explorerState.selectedNodeId || null;

  const activeDocument = useAppSelector((state: any) => state.floorPlan?.document || {});

  const currentContext = useMemo(() => {
    if (!selectedNodeId) return null;
    const findNode = (nodes: any[], id: string): any => {
      if (!nodes || !Array.isArray(nodes)) return null;
      return nodes.find((n: any) => n && String(n.id) === String(id)) || null;
    };
    return findNode(flatNodesArray, selectedNodeId);
  }, [flatNodesArray, selectedNodeId]);

  const buildingLevelSummary = useMemo(() => {
    let buildingNode = null;
    let currentNode = currentContext;
    
    if (!currentNode && selectedNodeId) {
      currentNode = flatNodesArray.find((n: any) => String(n.id) === String(selectedNodeId));
    }

    if (currentNode) {
      let node = currentNode;
      while (node) {
        if (node.type === 'Building') {
          buildingNode = node;
          break;
        }
        const parentId = node.parentId;
        if (!parentId) break;
        node = flatNodesArray.find((n: any) => String(n.id) === String(parentId));
      }
    }

    if (!buildingNode) {
      const buildingId = activeDocument?.buildingId;
      if (buildingId) {
        buildingNode = flatNodesArray.find((n: any) => String(n.id) === String(buildingId));
      }
    }

    if (!buildingNode) {
      return "1 Level Profile Registered";
    }

    const floorNodes = flatNodesArray.filter((n: any) => 
      n && 
      String(n.parentId) === String(buildingNode.id) && 
      (n.type === 'Floor' || n.nodeType === 'Floor') &&
      !n.name?.toLowerCase().includes('document') &&
      !n.name?.toLowerCase().includes('drawing')
    );

    const uniqueIds = new Set(floorNodes.map((n: any) => String(n.id)));
    const uniqueNames = new Set(floorNodes.map((n: any) => n.name?.toLowerCase()));
    let levelCount = Math.max(1, uniqueIds.size);
    if (uniqueNames.size < uniqueIds.size && uniqueNames.size > 0) {
      levelCount = uniqueNames.size;
    }

    if (levelCount === 1 && currentNode && (currentNode.type === 'Floor' || currentNode.nodeType === 'Floor')) {
      if (!floorNodes.some((n: any) => String(n.id) === String(currentNode.id))) {
        levelCount = 2;
        const allFloorIds = new Set(floorNodes.map((n: any) => String(n.id)));
        allFloorIds.add(String(currentNode.id));
        levelCount = allFloorIds.size;
      }
    }

    return `${levelCount} ${levelCount === 1 ? 'Level' : 'Levels'} Matrix Registered`;
  }, [flatNodesArray, currentContext, selectedNodeId, activeDocument]);

  const activeRoomsCount = activeDocument?.rooms?.length || 0;

  return (
    <div style={{ padding: "16px", backgroundColor: "#060814", height: "100%", fontFamily: "monospace", fontSize: "12px", color: "#94A3B8" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #1E293B", paddingBottom: "12px", marginBottom: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Layers className="h-4 w-4 text-sky-400" />
          <span style={{ fontWeight: "bold", color: "#F1F5F9", textTransform: "uppercase", letterSpacing: "0.05em" }}>// Floor Navigator Metric</span>
        </div>
      </div>

      <div style={{ backgroundColor: "#0B0F19", border: "1px solid #1E293B", borderRadius: "8px", padding: "12px", marginBottom: "16px" }}>
        <div style={{ fontSize: "9px", color: "#64748B", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.1em" }}>Active Envelope Track</div>
        <div style={{ fontSize: "14px", color: "#38BDF8", fontWeight: "bold", marginTop: "4px" }}>
          {activeDocument?.activeFloorName || currentContext?.name || "Unselected Level Mapping"}
        </div>
        
        <div style={{ display: "flex", gap: "12px", marginTop: "12px", borderTop: "1px solid rgba(30,41,59,0.5)", paddingTop: "8px", fontSize: "11px" }}>
          <div style={{ flex: 1 }}>
            <span style={{ color: "#64748B" }}>BUILDING LEVELS:</span>
            <div style={{ color: "#F59E0B", fontWeight: "bold", marginTop: "2px" }}>{buildingLevelSummary}</div>
          </div>
          <div style={{ width: "90px" }}>
            <span style={{ color: "#64748B" }}>ROOM COUNT:</span>
            <div style={{ color: "#10B981", fontWeight: "bold", marginTop: "2px" }}>{activeRoomsCount} Space Units</div>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: "10px", padding: "12px", backgroundColor: "rgba(30,41,59,0.2)", border: "1px solid #1E293B", borderRadius: "6px" }}>
        <HelpCircle className="h-4 w-4 text-slate-500 shrink-0 mt-0.5" />
        <span style={{ fontSize: "10px", lineHeight: "1.4" }}>
          Use the project explorer sidebar to change active building blocks. Viewport framing shifts spatial transformations seamlessly on layer changes.
        </span>
      </div>
    </div>
  );
};

export default FloorExplorer;