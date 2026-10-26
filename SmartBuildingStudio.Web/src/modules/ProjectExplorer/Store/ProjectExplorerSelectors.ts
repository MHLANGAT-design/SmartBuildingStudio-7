import { RootState } from "@/Application/ConfigureStore";
import { createSelector } from "@reduxjs/toolkit";

export const selectProjectExplorerState = (state: RootState) => state.projectExplorer || (state as any).ProjectExplorer || {};

export const selectAllExplorerNodes = (state: RootState) => selectProjectExplorerState(state).nodes || [];
export const selectSelectedNodeId = (state: RootState) => selectProjectExplorerState(state).selectedNodeId;
export const selectActiveProjectId = (state: RootState) => selectProjectExplorerState(state).activeProjectId;
export const selectExplorerStatistics = (state: RootState) => selectProjectExplorerState(state).statistics;
export const selectExplorerFilters = (state: RootState) => selectProjectExplorerState(state).filters || { searchQuery: "", showOnlyErrors: false };
export const selectExplorerLoading = (state: RootState) => selectProjectExplorerState(state).loading;
export const selectExplorerError = (state: RootState) => selectProjectExplorerState(state).error;

/**
 * Memoized Selector: Returns the currently highlighted entity node model context.
 * 🚀 FIXED: Normalizes identities into explicit string primitives to eliminate strict type comparison blocks!
 */
export const selectSelectedNode = createSelector(
  [selectAllExplorerNodes, selectSelectedNodeId],
  (nodes, selectedId) => {
    if (!nodes || !Array.isArray(nodes) || !selectedId) return null;
    
    // Unpack object containers if selection holds nested reference proxies
    const targetId = typeof selectedId === "object" 
      ? String((selectedId as any).id || (selectedId as any).Id || "") 
      : String(selectedId);

    if (!targetId) return null;
    return nodes.find(n => n && String(n.id || n.Id || "") === targetId) || null;
  }
);
/**
 * Memoized Selector: Filters raw lists flatly based on active search parameters.
 */
export const selectFilteredNodes = createSelector(
  [selectAllExplorerNodes, selectExplorerFilters],
  (nodes, filters) => {
    if (!nodes || !Array.isArray(nodes)) return [];
    const query = (filters?.searchQuery || "").trim().toLowerCase();
    
    return nodes.filter(node => {
      if (!node) return false;
      const nodeName = String(node.name || node.Name || "");
      
      let passFilter = true;
      if (filters.showOnlyErrors && (node.validationErrorCount || 0) === 0) passFilter = false;
      if (query && !nodeName.toLowerCase().includes(query)) passFilter = false;
      
      return passFilter;
    });
  }
);

/**
 * Memoized Selector: Filters and returns only top-level engineering roots matching search terms.
 */
export const selectRootProjects = createSelector(
  [selectAllExplorerNodes, selectExplorerFilters],
  (nodes, filters) => {
    if (!nodes || !Array.isArray(nodes)) return [];
    const query = (filters?.searchQuery || "").trim().toLowerCase();
    
    return nodes.filter(n => {
      if (!n || n.type !== "Project" || n.parentId !== null) return false;
      const nodeName = String(n.name || n.Name || "");
      if (query && !nodeName.toLowerCase().includes(query)) return false;
      return true;
    });
  }
);
/**
 * Memoized Selector: Computes child list sets map matching an isolated parent identifier token.
 * 🚀 FIXED: Retains branch elements matching query parameters without hiding parent folders!
 */
export const selectChildNodesMap = createSelector(
  [selectAllExplorerNodes, selectExplorerFilters],
  (nodes, filters) => {
    const lookup: Record<string, typeof nodes> = {};
    if (!nodes || !Array.isArray(nodes)) return lookup;
    
    nodes.forEach(node => {
      if (!node) return;
      const parentId = node.parentId || node.ParentId;
      
      if (parentId) {
        const key = String(parentId);
        if (!lookup[key]) lookup[key] = [];
        
        let passFilter = true;
        if (filters.showOnlyErrors && (node.validationErrorCount || 0) === 0) passFilter = false;
        
        // Removed the strict parent text elimination trap to ensure full recursive folder tree parsing
        if (passFilter) {
          lookup[key].push(node);
        }
      }
    });
    
    return lookup;
  }
);

/**
 * =========================================================================
 * 🚀 MEMOIZED COMPREHENSIVE HIERARCHICAL CORE TREE REFACTOR
 * =========================================================================
 */
export const selectAllProjects = createSelector(
  [selectAllExplorerNodes],
  (nodes) => {
    if (!nodes || !Array.isArray(nodes)) return [];
    
    const projects = nodes.filter(n => n && n.type === "Project");
    
    return projects.map(project => {
      const buildings = nodes.filter(n => n && n.type === "Building" && String(n.parentId) === String(project.id));
      
      return {
        ...project,
        buildings: buildings.map(building => {
          const floors = nodes.filter(n => n && n.type === "Floor" && String(n.parentId) === String(building.id));
          
          return {
            ...building,
            floors: floors.map(floor => {
              const documents = nodes.filter(n => n && n.type === "Document" && String(n.parentId) === String(floor.id));
              return { ...floor, documents };
            })
          };
        })
      };
    });
  }
);
