// Location: C:\Users\Tif\Documents\Smart Building Studio\SmartBuildingStudio.Web\src\modules\FloorPlanDesigner\Store\FloorPlanTypes.ts

import { Selection } from "@/modules/FloorPlanDesigner/Models/Selection";
import { ComprehensiveUpdateFloorPlanPayloadDto } from "@/modules/FloorPlanDesigner/Store/FloorPlanBackendContracts";

export type FloorPlanTool =
  | "select"
  | "pan"
  | "wall"
  | "room"
  | "door"
  | "window"
  | "measure"
  | "calibration";

export type FloorPlanMode =
  | "idle"
  | "drawing"
  | "editing"
  | "measuring"
  | "panning";

export interface LayerVisibilityState {
  grid: boolean;
  importedDrawing: boolean;
  rooms: boolean;
  walls: boolean;
  doors: boolean;
  windows: boolean;
  measurements: boolean;
  calibration: boolean;
  snap: boolean;
  selection: boolean;
  preview: boolean;
}

export interface ViewportState {
  zoom: number;
  offsetX: number;
  offsetY: number;
}

export interface ValidationState {
  hasErrors: boolean;
  hasWarnings: boolean;
  errorCount: number;
  warningCount: number;
}

export interface FloorPlanUiState {
  leftSidebarVisible: boolean;
  rightInspectorVisible: boolean;
  toolbarVisible: boolean;
  statusBarVisible: boolean;
}

/**
 * 🛠️ ALIGNED PLAIN DATA DESERIALIZATION CONTRACT
 * Mirrors the plain data properties expected by selectors, hooks, and layout rendering layers.
 */
export interface DeserializedDrawingDocument {
  id: string | null;
  name: string;
  walls: any[];
  doors: any[];
  windows: any[];
  rooms: any[];
  importedDrawing: any[];
  importedDrawings: any[];
  electricalFixtures: any[];
  activeProjectName?: string;
  activeFloorName?: string;
  activeBuildingName?: string;
}

/**
 * Complete Floor Plan Designer Redux state declaration
 */
export interface FloorPlanState {
  // 🚀 ALIGNED: Accepts both standard plain data object maps or class definitions to keep typing safe
  document: DeserializedDrawingDocument | any | null;
  /**
   * Numeric version trigger to bypass Redux immutability limits 
   * and push state synchronization changes from DocumentManager to React.
   */
  changeTrigger: number;
  selection: Selection | null;
  activeTool: FloorPlanTool;
  mode: FloorPlanMode;
  viewport: ViewportState;
  layers: LayerVisibilityState;
  validation: ValidationState;
  ui: FloorPlanUiState;
  loading: boolean;
  dirty: boolean;
  lastSaved?: Date;
  error?: string | null;
  
  // ADDED: isSaving field for save operations
  isSaving: boolean;
  
  // ADDED: version field for tracking changes
  version: number;
  
  /**
   * Optional helper field to reference our clean backend schema types if required by thunks
   */
  lastSavedPayload?: ComprehensiveUpdateFloorPlanPayloadDto;
}