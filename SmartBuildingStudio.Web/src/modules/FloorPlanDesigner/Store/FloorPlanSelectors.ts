// Location: C:\Users\Tif\Documents\Smart Building Studio\SmartBuildingStudio.Web\src\modules\FloorPlanDesigner\Store\FloorPlanSelectors.ts

import { RootState } from "@/Application/ConfigureStore";
import { 
  FloorPlanState, 
  FloorPlanTool, 
  FloorPlanMode,
  LayerVisibilityState,
  ViewportState,
  ValidationState,
  FloorPlanUiState,
  DeserializedDrawingDocument
} from "@/modules/FloorPlanDesigner/Store/FloorPlanTypes";

// --- Base Module State Routing ---
export const selectFloorPlanState = (state: RootState): FloorPlanState => state.floorPlan || ({} as FloorPlanState);

// --- Synchronization Core ---
export const selectChangeTrigger = (state: RootState) => selectFloorPlanState(state).changeTrigger ?? 0;

// --- Document Properties ---
export const selectDocument = (state: RootState): DeserializedDrawingDocument | null => 
  selectFloorPlanState(state).document ?? null;

// --- Document ID Selectors ---
export const selectDocumentId = (state: RootState): string | null => 
  selectDocument(state)?.id ?? null;

export const selectDocumentName = (state: RootState): string => 
  selectDocument(state)?.name ?? "";

export const selectDocumentMetadata = (state: RootState): Partial<DeserializedDrawingDocument> | null => {
  const doc = selectDocument(state);
  if (!doc) return null;
  return {
    id: doc.id,
    name: doc.name,
    activeProjectName: doc.activeProjectName,
    activeFloorName: doc.activeFloorName,
    activeBuildingName: doc.activeBuildingName
  };
};

// --- Document Data Selectors ---
export const selectFetchedWalls = (state: RootState): any[] => 
  selectDocument(state)?.walls ?? [];

export const selectFetchedDoors = (state: RootState): any[] => 
  selectDocument(state)?.doors ?? [];

export const selectFetchedWindows = (state: RootState): any[] => 
  selectDocument(state)?.windows ?? [];

export const selectFetchedRooms = (state: RootState): any[] => 
  selectDocument(state)?.rooms ?? [];

export const selectFetchedImportedDrawings = (state: RootState): any[] => 
  selectDocument(state)?.importedDrawings ?? selectDocument(state)?.importedDrawing ?? [];

export const selectFetchedElectricalFixtures = (state: RootState): any[] => 
  selectDocument(state)?.electricalFixtures ?? [];

// --- Document State Selectors ---
export const selectIsDirty = (state: RootState): boolean => 
  selectFloorPlanState(state).dirty ?? false;

export const selectIsSaving = (state: RootState): boolean => 
  selectFloorPlanState(state).dirty ?? false; // Note: You may want to add isSaving to FloorPlanState

export const selectIsLoading = (state: RootState): boolean => 
  selectFloorPlanState(state).loading ?? false;

export const selectLastSaved = (state: RootState): Date | undefined => 
  selectFloorPlanState(state).lastSaved;

export const selectError = (state: RootState): string | null | undefined => 
  selectFloorPlanState(state).error;

export const selectHasData = (state: RootState): boolean => {
  const doc = selectDocument(state);
  if (!doc) return false;
  return (doc.walls?.length ?? 0) > 0 ||
         (doc.doors?.length ?? 0) > 0 ||
         (doc.windows?.length ?? 0) > 0 ||
         (doc.rooms?.length ?? 0) > 0 ||
         (doc.importedDrawings?.length ?? 0) > 0 ||
         (doc.importedDrawing?.length ?? 0) > 0;
};

// --- Selection ---
export const selectSelection = (state: RootState) => 
  selectFloorPlanState(state).selection ?? null;

// --- Active Interaction Tools ---
export const selectActiveTool = (state: RootState): FloorPlanTool => 
  selectFloorPlanState(state).activeTool ?? "select";

export const selectEditorMode = (state: RootState): FloorPlanMode => 
  selectFloorPlanState(state).mode ?? "idle";

// --- Viewport Scaling Coordinates ---
export const selectViewport = (state: RootState): ViewportState => 
  selectFloorPlanState(state).viewport || { zoom: 1, offsetX: 0, offsetY: 0 };

export const selectZoom = (state: RootState): number => 
  selectViewport(state).zoom ?? 1;

export const selectViewportOffset = (state: RootState): { x: number; y: number } => ({
  x: selectViewport(state).offsetX ?? 0,
  y: selectViewport(state).offsetY ?? 0
});

// --- Dynamic Canvas Render Layers ---
export const selectLayers = (state: RootState): LayerVisibilityState => 
  selectFloorPlanState(state).layers || {
    grid: true,
    importedDrawing: true,
    rooms: true,
    walls: true,
    doors: true,
    windows: true,
    measurements: true,
    calibration: true,
    snap: true,
    selection: true,
    preview: true
  };

export const selectGridVisible = (state: RootState): boolean => 
  !!selectLayers(state).grid;

export const selectImportedDrawingVisible = (state: RootState): boolean => 
  !!selectLayers(state).importedDrawing;

export const selectWallsVisible = (state: RootState): boolean => 
  !!selectLayers(state).walls;

export const selectRoomsVisible = (state: RootState): boolean => 
  !!selectLayers(state).rooms;

export const selectDoorsVisible = (state: RootState): boolean => 
  !!selectLayers(state).doors;

export const selectWindowsVisible = (state: RootState): boolean => 
  !!selectLayers(state).windows;

export const selectMeasurementsVisible = (state: RootState): boolean => 
  !!selectLayers(state).measurements;

export const selectCalibrationVisible = (state: RootState): boolean => 
  !!selectLayers(state).calibration;

export const selectSnapVisible = (state: RootState): boolean => 
  !!selectLayers(state).snap;

export const selectSelectionVisible = (state: RootState): boolean => 
  !!selectLayers(state).selection;

export const selectPreviewVisible = (state: RootState): boolean => 
  !!selectLayers(state).preview;

// --- Validation ---
export const selectValidation = (state: RootState): ValidationState => 
  selectFloorPlanState(state).validation || { 
    hasErrors: false, 
    hasWarnings: false, 
    errorCount: 0, 
    warningCount: 0 
  };

export const selectHasValidationErrors = (state: RootState): boolean => 
  !!selectValidation(state).hasErrors;

export const selectHasValidationWarnings = (state: RootState): boolean => 
  !!selectValidation(state).hasWarnings;

// --- UI Layout Toggles ---
export const selectUiState = (state: RootState): FloorPlanUiState => 
  selectFloorPlanState(state).ui || {
    leftSidebarVisible: true,
    rightInspectorVisible: true,
    toolbarVisible: true,
    statusBarVisible: true
  };

export const selectLeftSidebarVisible = (state: RootState): boolean => 
  !!selectUiState(state).leftSidebarVisible;

export const selectRightInspectorVisible = (state: RootState): boolean => 
  !!selectUiState(state).rightInspectorVisible;

export const selectToolbarVisible = (state: RootState): boolean => 
  !!selectUiState(state).toolbarVisible;

export const selectStatusBarVisible = (state: RootState): boolean => 
  !!selectUiState(state).statusBarVisible;

// --- Last Saved Payload ---
export const selectLastSavedPayload = (state: RootState) => 
  selectFloorPlanState(state).lastSavedPayload;