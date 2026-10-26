import { ProjectExplorerState, ExplorerNode, ExplorerStatistics } from
"@/modules/ProjectExplorer/Store/ProjectExplorerTypes";

const initialState: ProjectExplorerState = {
  nodes: [], 
  selectedNodeId: null, 
  activeProjectId: null, 
  activeProjectName: null, 
  activeBuildingId: null, 
  activeFloorId: null,    
  statistics: null,
  filters: { searchQuery: "", selectedModuleOwner: null, showOnlyErrors: false },
  loading: false, 
  error: null
};

export default function projectExplorerReducer(
  state: ProjectExplorerState = initialState, 
  action: { type: string; payload?: any }
): ProjectExplorerState {
  switch (action.type) {
    case "projectExplorer/setExplorerLoading": 
      return { ...state, loading: action.payload ?? false };
      
    case "projectExplorer/setExplorerError": 
      return { ...state, error: action.payload ?? null };
      
    case "projectExplorer/populateExplorerTree": {
      if (!action.payload) return state;
      const dbPayload = Array.isArray(action.payload) ? action.payload : (action.payload.nodes || []);
      const flattenedNodes: any[] = [];
      
      dbPayload.forEach((proj: any) => {
        if (!proj) return;
        const pId = proj.Id || proj.id;
        const pName = proj.Name || proj.name;
        const pNum = proj.ProjectNumber || proj.projectNumber;
        const pClient = proj.ClientName || proj.clientName;
        if (!pId || !pName) return;
        
        flattenedNodes.push({ id: String(pId), parentId: null, name: pName, type: "Project", projectNumber: pNum || "", clientName: pClient || "", validationErrorCount: 0, isExpanded: true });
        
        const buildings = proj.Buildings || proj.buildings;
        if (buildings && Array.isArray(buildings)) {
          buildings.forEach((bldg: any) => {
            const bId = bldg.Id || bldg.id;
            const bName = bldg.Name || bldg.name;
            const bCode = bldg.Code || bldg.code;
            if (!bId || !bName) return;
            
            flattenedNodes.push({ id: String(bId), parentId: String(pId), name: bName, code: bCode || "", type: "Building", validationErrorCount: 0, isExpanded: true });
            
            const floors = bldg.Floors || bldg.floors;
            if (floors && Array.isArray(floors)) {
              floors.forEach((floor: any) => {
                const fId = floor.Id || floor.id;
                const fName = floor.Name || floor.name;
                if (!fId || !fName) return;
                
                flattenedNodes.push({ id: String(fId), parentId: String(bId), name: fName, type: "Floor", validationErrorCount: 0, isExpanded: false });
                
                const docs = floor.Documents || floor.documents;
                if (docs && Array.isArray(docs)) {
                  docs.forEach((doc: any) => {
                    const dId = doc.Id || doc.id;
                    const dName = doc.Name || doc.name;
                    const dPath = doc.RoutePath || doc.routePath;
                    if (!dId || !dName) return;
                    
                    flattenedNodes.push({ id: String(dId), parentId: String(fId), name: dName, type: "Document", routePath: dPath || "", validationErrorCount: 0 });
                  });
                }
              });
            }
          });
        }
      });
      return { ...state, nodes: flattenedNodes, statistics: action.payload.statistics || null, error: null };
    }

    case "projectExplorer/selectNode": {
      if (action.payload === undefined) return state;

      let selectedId: string | null = null;
      if (action.payload) {
        if (typeof action.payload === 'object') {
          selectedId = action.payload.id || action.payload.Id || action.payload.guid || action.payload.Guid || null;
        } else {
          selectedId = String(action.payload);
        }
      }

      let activeProjId = state.activeProjectId;
      let activeProjName = state.activeProjectName; 
      let activeBldgId: string | null = null;
      let activeFlrId: string | null = null;

      if (state.nodes && Array.isArray(state.nodes) && selectedId) {
        const targetNode = state.nodes.find(n => n && String(n.id || "") === String(selectedId));
        
        if (targetNode) {
          let currentParentId = targetNode.parentId;
          const currentNodeType = targetNode.type;

          if (currentNodeType === "Project") {
            activeProjId = targetNode.id;
            activeProjName = targetNode.name;
          }
          if (currentNodeType === "Building") activeBldgId = targetNode.id;
          if (currentNodeType === "Floor") activeFlrId = targetNode.id;

          let safetyCounter = 0;
          while (currentParentId && safetyCounter < 10) {
            const parentNode = state.nodes.find(n => n && String(n.id || "") === String(currentParentId));
            if (!parentNode) break;

            if (parentNode.type === "Floor") {
              activeFlrId = parentNode.id;
            } else if (parentNode.type === "Building") {
              activeBldgId = parentNode.id;
            } else if (parentNode.type === "Project") {
              activeProjId = parentNode.id;
              activeProjName = parentNode.name; 
            }

            currentParentId = parentNode.parentId;
            safetyCounter++;
          }
        }
      }

      return {
        ...state,
        selectedNodeId: selectedId,
        activeProjectId: activeProjId,
        activeProjectName: activeProjName, 
        activeBuildingId: activeBldgId,
        activeFloorId: activeFlrId
      };
    }

    case "projectExplorer/toggleNodeExpansion": {
      if (!action.payload) return state;
      return { ...state, nodes: state.nodes.map(n => n.id === action.payload ? { ...n, isExpanded: !n.isExpanded } : n) };
    }

    case "projectExplorer/clearNodeErrorsSimulation": {
      if (!action.payload) return state;
      return { ...state, nodes: state.nodes.map(n => n.id === action.payload ? { ...n, validationErrorCount: 0 } : n) };
    }

    case "projectExplorer/expandAllTreeNodes": 
      return { ...state, nodes: state.nodes.map(n => n.type !== "Document" ? { ...n, isExpanded: true } : n) };
      
    case "projectExplorer/collapseAllTreeNodes": 
      return { ...state, nodes: state.nodes.map(n => n.type !== "Document" ? { ...n, isExpanded: false } : n) };
      
    case "projectExplorer/updateExplorerSearch": 
      return { ...state, filters: { ...state.filters, searchQuery: action.payload ?? "" } };
      
    case "projectExplorer/toggleErrorFilter": 
      return { ...state, filters: { ...state.filters, showOnlyErrors: !state.filters.showOnlyErrors } };
      
    case "projectExplorer/resetExplorerState": 
      return { ...initialState };
      
    default: 
      return state;
  }
}

// 🚀 RESTORED NAMED ACTION CREATORS EXPORTS FOR COMPONENTS LIKE ExpandAllButton
export const setExplorerLoading = (loading: boolean) => ({ type: "projectExplorer/setExplorerLoading", payload: loading });
export const setExplorerError = (error: string | null) => ({ type: "projectExplorer/setExplorerError", payload: error });
export const populateExplorerTree = (payload: { nodes: ExplorerNode[]; statistics: ExplorerStatistics }) => ({ type: "projectExplorer/populateExplorerTree", payload });
export const selectNode = (nodeId: string | null) => ({ type: "projectExplorer/selectNode", payload: nodeId });
export const toggleNodeExpansion = (nodeId: string) => ({ type: "projectExplorer/toggleNodeExpansion", payload: nodeId });
export const expandAllTreeNodes = () => ({ type: "projectExplorer/expandAllTreeNodes" });
export const collapseAllTreeNodes = () => ({ type: "projectExplorer/collapseAllTreeNodes" });
export const updateExplorerSearch = (query: string) => ({ type: "projectExplorer/updateExplorerSearch", payload: query });
export const toggleErrorFilter = () => ({ type: "projectExplorer/toggleErrorFilter" });
export const resetExplorerState = () => ({ type: "projectExplorer/resetExplorerState" });
