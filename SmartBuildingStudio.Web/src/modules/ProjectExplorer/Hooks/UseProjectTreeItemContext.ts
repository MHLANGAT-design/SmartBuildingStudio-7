import { useCallback } from "react";
import { ExplorerNode } from "@/modules/ProjectExplorer/Models/ExplorerNode";

export function UseProjectTreeItemContext() {
  const getDocumentContext = useCallback((docNode: ExplorerNode) => {
    const defaultContext = {
      projectId: "", projectName: "Unknown Project",
      buildingId: "", buildingName: "Unknown Building",
      floorId: "", floorName: "Unknown Floor",
    };
    
    try {
      const state = (window as any).store?.getState?.() || (window as any).store?.state;
      if (!state) return defaultContext;
      
      const explorerSlice = state?.projectExplorer || state?.ProjectExplorer || {};
      const flatNodesArray = explorerSlice?.nodes || [];
      
      const findNodeById = (nodes: any[], targetId: string): any => {
        if (!nodes || !Array.isArray(nodes)) return null;
        return nodes.find(n => n && String(n.id) === String(targetId)) || null;
      };

      let projectId = "", projectName = "";
      let buildingId = "", buildingName = "";
      let floorId = "", floorName = "";
      
      let currentNode = docNode;
      let currentParentId = currentNode.parentId || (currentNode as any).ParentId;

      while (currentParentId) {
        const parentNode = findNodeById(flatNodesArray, currentParentId);
        if (!parentNode) break;
        
        const parentType = parentNode.type || (parentNode as any).Type;
        const parentName = parentNode.name || (parentNode as any).Name || "";
        
        if (parentType === "Floor") {
          floorId = String(parentNode.id || parentNode.Id);
          floorName = parentName;
        } else if (parentType === "Building") {
          buildingId = String(parentNode.id || parentNode.Id);
          buildingName = parentName;
        } else if (parentType === "Project") {
          projectId = String(parentNode.id || parentNode.Id);
          projectName = parentName;
          break;
        }
        
        currentParentId = parentNode.parentId || (parentNode as any).ParentId;
        currentNode = parentNode;
      }

      if (!projectName && (docNode as any).projectName) projectName = (docNode as any).projectName;
      if (!buildingName && (docNode as any).buildingName) buildingName = (docNode as any).buildingName;
      if (!floorName && (docNode as any).floorName) floorName = (docNode as any).floorName;

      return {
        projectId: projectId || "",
        projectName: projectName || "Unknown Project",
        buildingId: buildingId || "",
        buildingName: buildingName || "Unknown Building",
        floorId: floorId || "",
        floorName: floorName || "Unknown Floor",
      };
    } catch (err) {
      console.warn("[UseProjectTreeItemContext] Error extracting context:", err);
      return defaultContext;
    }
  }, []);

  return { getDocumentContext };
}
