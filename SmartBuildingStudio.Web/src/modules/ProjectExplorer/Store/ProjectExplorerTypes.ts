export type ExplorerNodeType = 
  | "Project" 
  | "Building" 
  | "Floor" 
  | "CategoryFolder" 
  | "Document";

export type ProjectDocumentType = 
  | "ReflectedCeiling" 
  | "LightingBase" 
  | "FixtureLayout" 
  | "DaliNetwork" 
  | "EmergencyLighting" 
  | "ValidationReport" 
  | "AssetInventory";

export interface ExplorerNode {
  id: string;
  parentId: string | null;
  name: string;
  type: ExplorerNodeType;
  documentType?: ProjectDocumentType;
  isExpanded: boolean;
  isLocked: boolean;
  revision?: string;
  modifiedBy?: string;
  modifiedAt?: string;
  validationErrorCount: number;
}

export interface ExplorerStatistics {
  buildingCount: number;
  floorCount: number;
  drawingCount: number;
  fixtureLayoutCount: number;
  daliNetworkCount: number;
  emergencyReportCount: number;
  validationErrorTotal: number;
}

export interface ExplorerFilter {
  searchQuery: string;
  selectedModuleOwner: string | null;
  showOnlyErrors: boolean;
}

export interface ProjectExplorerState {
  nodes: ExplorerNode[];
  selectedNodeId: string | null;
  activeProjectId: string | null;
  statistics: ExplorerStatistics | null;
  filters: ExplorerFilter;
  loading: boolean;
  error: string | null;
}
