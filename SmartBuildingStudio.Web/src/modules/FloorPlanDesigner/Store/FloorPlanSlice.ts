// src/modules/FloorPlanDesigner/Store/FloorPlanSlice.ts
// ✅ CONSOLIDATED + reclassifyElement reducer + calibration/measurements/hoveredId
// ── ADDED ── calibration, measurements, hoveredId state + reducers

import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  doorShapeFrom,
  wallShapeFrom,
  windowShapeFrom,
  type ReclassifyTarget,
} from "./reclassifyHelpers";

// ─── Core Types ───────────────────────────────────────────────────────────────

export interface Point2D { x: number; y: number; }

export interface Wall {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  thickness: number;
  height: number;
  material: string;
}

export interface Door {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: string;
}

export interface Window {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: string;
}

export interface Room {
  id: string;
  name: string;
  points: Point2D[];
  targetLux: number;
  primaryGroup: number;
}

export interface ImportedDrawing {
  id: string;
  name: string;
  fileName: string;
  sourceFile: string;
  activeProjectName?: string;
  activeBuildingName?: string;
  activeFloorName?: string;
  activeDocumentName?: string;
  importedAt: string;
  wallsCount: number;
  x: number;
  y: number;
  width: number;
  height: number;
  opacity: number;
  visible: boolean;
}

export interface ElectricalFixture {
  id: string;
  x: number;
  y: number;
  type: string;
  daliGroup: number;
  [key: string]: any;
}

export interface FloorPlanDocument {
  id: string;
  name: string;
  walls: Wall[];
  doors: Door[];
  windows: Window[];
  rooms: Room[];
  importedDrawings: ImportedDrawing[];
  electricalFixtures: ElectricalFixture[];
  activeProjectName?: string;
  activeBuildingName?: string;
  activeFloorName?: string;
  activeDocumentName?: string;
  projectId?: string;
  buildingId?: string;
  floorId?: string;
}

// ─── State Slices ─────────────────────────────────────────────────────────────

export interface ViewportState { zoom: number; offsetX: number; offsetY: number; }

export interface LayerVisibilityState {
  grid: boolean;
  importedDrawing: boolean;
  rooms: boolean;
  walls: boolean;
  doors: boolean;
  windows: boolean;
  fixtures: boolean;
  rawgeometry: boolean;
  measurements: boolean;
  calibration: boolean;
  snap: boolean;
  selection: boolean;
  preview: boolean;
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

export type FloorPlanTool =
  | "select" | "pan" | "wall" | "room" | "door" | "window" | "measure" | "calibration";

export type FloorPlanMode =
  | "idle" | "drawing" | "editing" | "measuring" | "panning";

// ── ADDED ── CalibrationState ──────────────────────────────────────────────
export interface CalibrationState {
  p1: Point2D | null;
  p2: Point2D | null;
  knownDistance: number | null;
  unit: string;
  pxPerUnit: number | null;
}

// ── ADDED ── MeasurementState ──────────────────────────────────────────────
export interface Measurement {
  id: string;
  from: Point2D;
  to: Point2D;
  label?: string;
}

export interface MeasurementState {
  committed: Measurement[];
  draftFrom: Point2D | null;
  cursor: Point2D | null;
}

export interface FloorPlanState {
  document: FloorPlanDocument;
  isSaving: boolean;
  isDirty: boolean;
  loading: boolean;
  error: string | null;
  selection: any;
  multiSelection: string[];
  viewport: ViewportState;
  layers: LayerVisibilityState;
  validation: ValidationState;
  ui: FloorPlanUiState;
  activeTool: FloorPlanTool;
  mode: FloorPlanMode;
  changeTrigger: number;
  version: number;
  lastSaved?: Date;
  lastSavedPayload?: any;
  // ── ADDED ──
  calibration: CalibrationState;
  measurements: MeasurementState;
  hoveredId: string | null;
}

const initialViewport: ViewportState = { zoom: 1, offsetX: 0, offsetY: 0 };

const initialLayers: LayerVisibilityState = {
  grid: true,
  importedDrawing: true,
  rooms: true,
  walls: true,
  doors: true,
  windows: true,
  fixtures: true,
  rawgeometry: false,
  measurements: true,
  calibration: true,
  snap: false,
  selection: true,
  preview: true,
};

const initialValidation: ValidationState = {
  hasErrors: false, hasWarnings: false, errorCount: 0, warningCount: 0,
};

const initialUi: FloorPlanUiState = {
  leftSidebarVisible: true, rightInspectorVisible: true,
  toolbarVisible: true, statusBarVisible: true,
};

// ── ADDED ── new initial state slices
const initialCalibration: CalibrationState = {
  p1: null, p2: null, knownDistance: null, unit: "mm", pxPerUnit: null,
};

const initialMeasurements: MeasurementState = {
  committed: [], draftFrom: null, cursor: null,
};

const initialState: FloorPlanState = {
  document: {
    id: "", name: "",
    walls: [], doors: [], windows: [], rooms: [],
    importedDrawings: [], electricalFixtures: [],
  },
  isSaving: false, isDirty: false, loading: false, error: null,
  selection: null, multiSelection: [],
  viewport: initialViewport,
  layers: initialLayers,
  validation: initialValidation,
  ui: initialUi,
  activeTool: "select",
  mode: "idle",
  changeTrigger: 0,
  version: 0,
  lastSaved: undefined, lastSavedPayload: undefined,
  // ── ADDED ──
  calibration: initialCalibration,
  measurements: initialMeasurements,
  hoveredId: null,
};

// ── ADDED ── derive pxPerUnit from calibration geometry
function recomputePxPerUnit(c: CalibrationState): number | null {
  if (!c.p1 || !c.p2 || !c.knownDistance || c.knownDistance <= 0) return null;
  const worldDist = Math.hypot(c.p2.x - c.p1.x, c.p2.y - c.p1.y);
  if (worldDist <= 0) return null;
  return worldDist / c.knownDistance;
}

// ─── Merge helpers ────────────────────────────────────────────────────────────

const mergeArrays = <T,>(incoming: T[] | undefined, existing: T[] | undefined): T[] | undefined => {
  if (incoming === undefined) return existing;
  if (Array.isArray(incoming) && incoming.length === 0 && Array.isArray(existing) && existing.length > 0) {
    return existing;
  }
  return incoming;
};

const mergeElements = (incoming: any[] | undefined, existing: any[] | undefined): any[] => {
  const incomingList = Array.isArray(incoming) ? incoming : [];
  const existingList = Array.isArray(existing) ? existing : [];
  if (incomingList.length === 0) return existingList;
  return incomingList;
};

// ─── Slice ────────────────────────────────────────────────────────────────────

const floorPlanSlice = createSlice({
  name: "floorPlan",
  initialState,
  reducers: {
    // ── Document & Metadata ────────────────────────────────────────────
    setDocument: (state, action: PayloadAction<any>) => {
      const raw = action.payload;
      if (!raw) return;

      const incomingId = String(raw.id ?? raw.Id ?? raw.documentId ?? "");
      const currentId = String(state.document?.id ?? "");
      const isDocumentSwitch = incomingId && currentId && incomingId !== currentId;

      if (isDocumentSwitch) {
        state.document = {
          id: incomingId,
          name: raw.name || "Untitled Layout",
          walls: Array.isArray(raw.walls) ? raw.walls : [],
          doors: Array.isArray(raw.doors) ? raw.doors : [],
          windows: Array.isArray(raw.windows) ? raw.windows : [],
          rooms: Array.isArray(raw.rooms) ? raw.rooms : [],
          importedDrawings: Array.isArray(raw.importedDrawings) ? raw.importedDrawings : [],
          electricalFixtures: Array.isArray(raw.electricalFixtures) ? raw.electricalFixtures : [],
          elements: Array.isArray(raw.elements) ? raw.elements : [],
          lightingZones: Array.isArray(raw.lightingZones) ? raw.lightingZones : [],
          drawnWallsJson: raw.drawnWallsJson ?? null,
          definedRoomsJson: raw.definedRoomsJson ?? null,
          placedFixturesJson: raw.placedFixturesJson ?? null,
          activeProjectName: raw.activeProjectName || "Unknown Project",
          activeBuildingName: raw.activeBuildingName || "Unknown Building",
          activeFloorName: raw.activeFloorName || "Unknown Floor",
          activeDocumentName: raw.activeDocumentName || raw.name || "Untitled Layout",
        } as any;

        state.selection = null;
        state.multiSelection = [];
        state.isDirty = false;
        // ── ADDED ── clear calibration/measurements on document switch
        state.calibration = { ...initialCalibration };
        state.measurements = { ...initialMeasurements, committed: [] };
        state.hoveredId = null;

        const newWalls = (state.document as any).walls;
        if (Array.isArray(newWalls) && newWalls.length > 0) {
          (window as any).__persistentDwgVectorBackupCache = [...newWalls];
          (window as any).__floorPlanActiveDocumentInstance = state.document;
        } else {
          (window as any).__persistentDwgVectorBackupCache = [];
        }

        console.log("[setDocument] DOCUMENT SWITCH — replaced state with", incomingId);
        return;
      }

      const incomingHasNothing =
        !raw.walls?.length && !raw.doors?.length && !raw.windows?.length &&
        !raw.rooms?.length && !raw.electricalFixtures?.length && !raw.elements?.length;

      const stateHasSomething =
        (state.document?.walls?.length || 0) > 0 ||
        (state.document?.electricalFixtures?.length || 0) > 0 ||
        ((state.document as any)?.elements?.length || 0) > 0;

      if (incomingHasNothing && stateHasSomething) {
        console.warn("[setDocument] GUARD: skipping fully-empty payload — state has data.");
        return;
      }

      const payload: any = {
        ...raw,
        walls: mergeArrays(raw.walls, state.document?.walls),
        doors: mergeArrays(raw.doors, state.document?.doors),
        windows: mergeArrays(raw.windows, state.document?.windows),
        rooms: mergeArrays(raw.rooms, state.document?.rooms),
        elements: mergeElements(raw.elements, (state.document as any)?.elements),
        electricalFixtures: mergeArrays(raw.electricalFixtures, state.document?.electricalFixtures),
        lightingZones: mergeArrays(raw.lightingZones, (state.document as any)?.lightingZones),
      };

      if (payload.rooms) {
        payload.rooms = payload.rooms.map((r: any) => ({
          ...r, targetLux: r.targetLux || 500, primaryGroup: r.primaryGroup || 1,
        }));
      }
      if (payload.doors) {
        payload.doors = payload.doors.map((d: any) => ({
          ...d, x: d.x || 0, y: d.y || 0, width: d.width || 900,
          height: d.height || 2100, type: d.type || "Door",
        }));
      }
      if (payload.windows) {
        payload.windows = payload.windows.map((w: any) => ({
          ...w, x: w.x || 0, y: w.y || 0, width: w.width || 1200,
          height: w.height || 1200, type: w.type || "Window",
        }));
      }

      const queryParams = new URLSearchParams(window.location.search);
      const targetTreeGuid = queryParams.get("documentId") || (window as any).__activeDocumentId;
      const context = (window as any).__activeDocumentContext || {};
      const isImportTrack =
        queryParams.get("mode") === "import" || (window as any).__designerMode === "import";

      const existingDoc = state.document || {};
      const isIncomingGeneric = !payload.activeFloorName || payload.activeFloorName === "Unknown Floor";

      state.document = {
        ...state.document,
        ...payload,
        id: isImportTrack && targetTreeGuid ? String(targetTreeGuid) : payload.id || existingDoc.id || "",
        name: isImportTrack && context.floorName
          ? context.documentName || (window as any).__activeDocumentContext?.docName || "Untitled Layout"
          : payload.name || existingDoc.name || "Untitled Layout",
        activeProjectId: isImportTrack && isIncomingGeneric
          ? context.projectId || existingDoc.projectId
          : payload.activeProjectId || payload.projectId || existingDoc.projectId,
        activeProjectName: context.projectName || payload.activeProjectName || existingDoc.activeProjectName || "Unknown Project",
        activeBuildingId: isImportTrack && isIncomingGeneric
          ? context.buildingId || existingDoc.buildingId
          : payload.activeBuildingId || payload.buildingId || existingDoc.buildingId,
        activeBuildingName: context.buildingName || payload.activeBuildingName || existingDoc.activeBuildingName || "Unknown Building",
        activeFloorId: isImportTrack && isIncomingGeneric
          ? context.floorId || existingDoc.floorId
          : payload.activeFloorId || payload.floorId || existingDoc.floorId,
        activeFloorName: context.floorName || payload.activeFloorName || existingDoc.activeFloorName || "Unknown Floor",
        activeDocumentName: isImportTrack && context.floorName
          ? context.documentName || "Untitled Layout"
          : payload.activeDocumentName || payload.name || existingDoc.activeDocumentName || "Untitled Layout",
      };

      let rawLinesArray: any[] = [];
      if (state.document.importedDrawings && state.document.importedDrawings.length > 0) {
        rawLinesArray = state.document.importedDrawings;
        const testTarget = rawLinesArray[0];
        if (testTarget?.walls && Array.isArray(testTarget.walls)) rawLinesArray = testTarget.walls;
        else if (testTarget?.DrawnWalls && Array.isArray(testTarget.DrawnWalls)) rawLinesArray = testTarget.DrawnWalls;
      }
      if (rawLinesArray.length === 0 && state.document.walls && state.document.walls.length > 0) {
        rawLinesArray = state.document.walls;
      }
      if (Array.isArray(rawLinesArray) && rawLinesArray.length > 0) {
        (window as any).__persistentDwgVectorBackupCache = [...rawLinesArray];
        (window as any).__floorPlanActiveDocumentInstance = state.document;
      }
      state.isDirty = true;
    },

    setDocumentMetadata: (state, action: PayloadAction<any>) => {
      const payload = action.payload;
      if (!payload) return;
      const queryParams = new URLSearchParams(window.location.search);
      const targetTreeGuid = queryParams.get("documentId") || (window as any).__activeDocumentId;
      const context = (window as any).__activeDocumentContext || {};
      const isImportTrack =
        queryParams.get("mode") === "import" || (window as any).__designerMode === "import";
      const existingDoc = state.document || {};
      const isIncomingGeneric = !payload.activeFloorName || payload.activeFloorName === "Unknown Floor";

      state.document = {
        ...state.document,
        ...payload,
        id: isImportTrack && targetTreeGuid ? String(targetTreeGuid) : payload.id || existingDoc.id || "",
        name: isImportTrack && context.floorName
          ? context.documentName || "Untitled Layout"
          : payload.name || existingDoc.name || "Untitled Layout",
        activeProjectId: isImportTrack && isIncomingGeneric
          ? context.projectId || existingDoc.projectId
          : payload.activeProjectId || payload.projectId || existingDoc.projectId,
        activeProjectName: context.projectName || payload.activeProjectName || existingDoc.activeProjectName || "Unknown Project",
        activeBuildingId: isImportTrack && isIncomingGeneric
          ? context.buildingId || existingDoc.buildingId
          : payload.activeBuildingId || payload.buildingId || existingDoc.buildingId,
        activeBuildingName: context.buildingName || payload.activeBuildingName || existingDoc.activeBuildingName || "Unknown Building",
        activeFloorId: isImportTrack && isIncomingGeneric
          ? context.floorId || existingDoc.floorId
          : payload.activeFloorId || payload.floorId || existingDoc.floorId,
        activeFloorName: context.floorName || payload.activeFloorName || existingDoc.activeFloorName || "Unknown Floor",
        activeDocumentName: isImportTrack && context.floorName
          ? context.documentName || "Untitled Layout"
          : payload.activeDocumentName || payload.name || existingDoc.activeDocumentName || "Untitled Layout",
      };

      state.isDirty = true;
    },

    // ── Reclassify ────────────────────────────────────────────────────
    reclassifyElement: (
      state,
      action: PayloadAction<{ id: string; target: ReclassifyTarget }>
    ) => {
      const { id, target } = action.payload;
      if (!id) return;

      const idStr = String(id);
      const doc = state.document as any;
      const elements: any[] = Array.isArray(doc?.elements) ? doc.elements : [];

      const element = elements.find((e) => String(e.id ?? e.Id) === idStr);
      if (!element) {
        console.warn("[reclassifyElement] element not found:", idStr);
        return;
      }

      const prevWalls = doc.walls ?? [];
      const prevDoors = doc.doors ?? [];
      const prevWindows = doc.windows ?? [];

      const notMine = (arr: any[]) =>
        arr.filter((r: any) => String(r.id ?? r.Id) !== idStr);

      const cleanedWalls = notMine(prevWalls);
      const cleanedDoors = notMine(prevDoors);
      const cleanedWindows = notMine(prevWindows);

      let nextWalls = cleanedWalls;
      let nextDoors = cleanedDoors;
      let nextWindows = cleanedWindows;

      if (target === "wall") {
        const wall = wallShapeFrom(element);
        if (wall) nextWalls = [...cleanedWalls, wall as any];
      } else if (target === "door") {
        const door = doorShapeFrom(element);
        if (door) nextDoors = [...cleanedDoors, door];
      } else if (target === "window") {
        const win = windowShapeFrom(element);
        if (win) nextWindows = [...cleanedWindows, win];
      }

      const nextElements = elements.map((e) => {
        if (String(e.id ?? e.Id) !== idStr) return e;
        const newType =
          target === "raw" ? "rawgeometry" :
          target === "wall" ? "wall" :
          target === "door" ? "door" :
          "window";
        return { ...e, type: newType };
      });

      state.document = {
        ...doc,
        walls: nextWalls,
        doors: nextDoors,
        windows: nextWindows,
        elements: nextElements,
      } as any;

      state.isDirty = true;
    },

    // ── Dirty / Saving Flags ────────────────────────────────────────────
    markDirty: (state) => { state.isDirty = true; },
    markClean: (state) => { state.isDirty = false; },
    clearDirty: (state) => { state.isDirty = false; },
    markSaved: (state) => { state.isDirty = false; state.isSaving = false; },
    setSaving: (state, action: PayloadAction<boolean>) => { state.isSaving = action.payload; },

    // ── Loading / Error ────────────────────────────────────────────────
    setLoading: (state, action: PayloadAction<boolean>) => { state.loading = action.payload; },
    setError: (state, action: PayloadAction<string | null>) => { state.error = action.payload; },
    clearError: (state) => { state.error = null; },

    // ── Selection ──────────────────────────────────────────────────────
    setSelection: (state, action: PayloadAction<any>) => { state.selection = action.payload; },
    clearSelection: (state) => { state.selection = null; },

    // ── Multi-Selection ───────────────────────────────────────────────
    setMultiSelection: (state, action: PayloadAction<string[]>) => {
      state.multiSelection = Array.isArray(action.payload)
        ? Array.from(new Set(action.payload.map(String)))
        : [];
    },
    addToMultiSelection: (state, action: PayloadAction<string[]>) => {
      const incoming = Array.isArray(action.payload) ? action.payload.map(String) : [];
      const merged = new Set([...(state.multiSelection || []), ...incoming]);
      state.multiSelection = Array.from(merged);
    },
    clearMultiSelection: (state) => { state.multiSelection = []; },

    // ── ADDED ── Hover ────────────────────────────────────────────────
    setHoveredId: (state, action: PayloadAction<string | null>) => {
      state.hoveredId = action.payload;
    },

    // ── ADDED ── Calibration ─────────────────────────────────────────
    setCalibrationPoint: (
      state,
      action: PayloadAction<{ which: "p1" | "p2"; point: Point2D | null }>
    ) => {
      state.calibration[action.payload.which] = action.payload.point;
      state.calibration.pxPerUnit = recomputePxPerUnit(state.calibration);
    },
    setCalibrationDistance: (
      state,
      action: PayloadAction<{ knownDistance: number | null; unit?: string }>
    ) => {
      state.calibration.knownDistance = action.payload.knownDistance;
      if (action.payload.unit) state.calibration.unit = action.payload.unit;
      state.calibration.pxPerUnit = recomputePxPerUnit(state.calibration);
    },
    resetCalibration: (state) => {
      state.calibration = { ...initialCalibration };
    },

    // ── ADDED ── Measurement ─────────────────────────────────────────
    addMeasurement: (state, action: PayloadAction<Measurement>) => {
      state.measurements.committed.push(action.payload);
      state.measurements.draftFrom = null;
      state.measurements.cursor = null;
      state.isDirty = true;
    },
    removeMeasurement: (state, action: PayloadAction<string>) => {
      state.measurements.committed = state.measurements.committed.filter(
        (m) => m.id !== action.payload
      );
      state.isDirty = true;
    },
    clearMeasurements: (state) => {
      state.measurements.committed = [];
      state.measurements.draftFrom = null;
      state.measurements.cursor = null;
      state.isDirty = true;
    },
    setMeasurementDraft: (
      state,
      action: PayloadAction<{ draftFrom: Point2D | null; cursor?: Point2D | null }>
    ) => {
      state.measurements.draftFrom = action.payload.draftFrom;
      if (action.payload.cursor !== undefined) {
        state.measurements.cursor = action.payload.cursor;
      }
    },

    // ── Room CRUD ──────────────────────────────────────────────────────
    addRoom: (state, action: PayloadAction<Room>) => {
      const r = action.payload;
      state.document.rooms.push({
        id: r.id, name: r.name, points: r.points || [],
        targetLux: r.targetLux || 500, primaryGroup: r.primaryGroup || 1,
      });
      state.isDirty = true;
    },
    updateRoom: (state, action: PayloadAction<Room>) => {
      const u = action.payload;
      const idx = state.document.rooms.findIndex((r) => r.id === u.id);
      if (idx !== -1) {
        state.document.rooms[idx] = {
          ...u, targetLux: u.targetLux || 500, primaryGroup: u.primaryGroup || 1,
        };
        state.isDirty = true;
      }
    },
    removeRoom: (state, action: PayloadAction<string>) => {
      state.document.rooms = state.document.rooms.filter((r) => r.id !== action.payload);
      state.isDirty = true;
    },

    // ── Door CRUD ──────────────────────────────────────────────────────
    addDoor: (state, action: PayloadAction<Door>) => {
      const d = action.payload;
      state.document.doors.push({
        id: d.id, x: d.x || 0, y: d.y || 0, width: d.width || 900,
        height: d.height || 2100, type: d.type || "Door",
      });
      state.isDirty = true;
    },
    updateDoor: (state, action: PayloadAction<Door>) => {
      const u = action.payload;
      const idx = state.document.doors.findIndex((d) => d.id === u.id);
      if (idx !== -1) {
        state.document.doors[idx] = {
          ...u, x: u.x || 0, y: u.y || 0, width: u.width || 900,
          height: u.height || 2100, type: u.type || "Door",
        };
        state.isDirty = true;
      }
    },
    removeDoor: (state, action: PayloadAction<string>) => {
      state.document.doors = state.document.doors.filter((d) => d.id !== action.payload);
      state.isDirty = true;
    },

    // ── Window CRUD ────────────────────────────────────────────────────
    addWindow: (state, action: PayloadAction<Window>) => {
      const w = action.payload;
      state.document.windows.push({
        id: w.id, x: w.x || 0, y: w.y || 0, width: w.width || 1200,
        height: w.height || 1200, type: w.type || "Window",
      });
      state.isDirty = true;
    },
    updateWindow: (state, action: PayloadAction<Window>) => {
      const u = action.payload;
      const idx = state.document.windows.findIndex((w) => w.id === u.id);
      if (idx !== -1) {
        state.document.windows[idx] = {
          ...u, x: u.x || 0, y: u.y || 0, width: u.width || 1200,
          height: u.height || 1200, type: u.type || "Window",
        };
        state.isDirty = true;
      }
    },
    removeWindow: (state, action: PayloadAction<string>) => {
      state.document.windows = state.document.windows.filter((w) => w.id !== action.payload);
      state.isDirty = true;
    },

    // ── Wall CRUD ──────────────────────────────────────────────────────
    addWall: (state, action: PayloadAction<Wall>) => {
      const w = action.payload;
      state.document.walls.push({
        id: w.id, startX: w.startX || 0, startY: w.startY || 0,
        endX: w.endX || 0, endY: w.endY || 0,
        thickness: w.thickness || 250, height: w.height || 2800,
        material: w.material || "Concrete",
      });
      state.isDirty = true;
    },
    updateWall: (state, action: PayloadAction<Wall>) => {
      const u = action.payload;
      const idx = state.document.walls.findIndex((w) => w.id === u.id);
      if (idx !== -1) {
        state.document.walls[idx] = {
          ...u, startX: u.startX || 0, startY: u.startY || 0,
          endX: u.endX || 0, endY: u.endY || 0,
          thickness: u.thickness || 250, height: u.height || 2800,
          material: u.material || "Concrete",
        };
        state.isDirty = true;
      }
    },
    removeWall: (state, action: PayloadAction<string>) => {
      state.document.walls = state.document.walls.filter((w) => w.id !== action.payload);
      state.isDirty = true;
    },

    // ── Electrical Fixture CRUD ──────────────────────────────────────
    addElectricalFixture: (state, action: PayloadAction<ElectricalFixture>) => {
      const f = action.payload;
      state.document.electricalFixtures.push({
        ...f, id: f.id, x: f.x || 0, y: f.y || 0,
        type: f.type || f.kind || "LED_Panel", daliGroup: f.daliGroup || 1,
      });
      state.isDirty = true;
    },
    updateElectricalFixture: (state, action: PayloadAction<ElectricalFixture>) => {
      const u = action.payload;
      const idx = state.document.electricalFixtures.findIndex((f) => f.id === u.id);
      if (idx !== -1) {
        state.document.electricalFixtures[idx] = {
          ...u, x: u.x || 0, y: u.y || 0,
          type: u.type || u.kind || "LED_Panel", daliGroup: u.daliGroup || 1,
        };
        state.isDirty = true;
      }
    },
    removeElectricalFixture: (state, action: PayloadAction<string>) => {
      state.document.electricalFixtures = state.document.electricalFixtures.filter(
        (f) => f.id !== action.payload
      );
      state.isDirty = true;
    },

    // ── Imported Drawing CRUD ────────────────────────────────────────
    addImportedDrawing: (state, action: PayloadAction<ImportedDrawing>) => {
      const d = action.payload;
      state.document.importedDrawings.push({
        id: d.id, name: d.name || "Imported Drawing",
        fileName: d.fileName || "unknown.dwg",
        sourceFile: d.sourceFile || "unknown.dwg",
        activeProjectName: d.activeProjectName,
        activeBuildingName: d.activeBuildingName,
        activeFloorName: d.activeFloorName,
        activeDocumentName: d.activeDocumentName,
        importedAt: d.importedAt || new Date().toISOString(),
        wallsCount: d.wallsCount || 0,
        x: d.x || 0, y: d.y || 0, width: d.width || 0, height: d.height || 0,
        opacity: d.opacity || 0.5, visible: d.visible !== undefined ? d.visible : true,
      });
      state.isDirty = true;
    },
    updateImportedDrawing: (state, action: PayloadAction<ImportedDrawing>) => {
      const u = action.payload;
      const idx = state.document.importedDrawings.findIndex((d) => d.id === u.id);
      if (idx !== -1) {
        state.document.importedDrawings[idx] = {
          ...u, opacity: u.opacity || 0.5,
          visible: u.visible !== undefined ? u.visible : true,
        };
        state.isDirty = true;
      }
    },
    removeImportedDrawing: (state, action: PayloadAction<string>) => {
      state.document.importedDrawings = state.document.importedDrawings.filter(
        (d) => d.id !== action.payload
      );
      state.isDirty = true;
    },

    // ── Viewport ──────────────────────────────────────────────────────
    setViewport: (state, action: PayloadAction<Partial<ViewportState>>) => {
      state.viewport = { ...state.viewport, ...action.payload };
    },
    setZoom: (state, action: PayloadAction<number>) => { state.viewport.zoom = action.payload; },
    setOffset: (state, action: PayloadAction<{ x: number; y: number }>) => {
      state.viewport.offsetX = action.payload.x;
      state.viewport.offsetY = action.payload.y;
    },

    // ── Layers ────────────────────────────────────────────────────────
    setLayerVisibility: (state, action: PayloadAction<Partial<LayerVisibilityState>>) => {
      state.layers = { ...state.layers, ...action.payload };
    },
    toggleLayer: (state, action: PayloadAction<keyof LayerVisibilityState>) => {
      const key = action.payload;
      state.layers[key] = !state.layers[key];
    },

    // ── Validation ────────────────────────────────────────────────────
    setValidation: (state, action: PayloadAction<Partial<ValidationState>>) => {
      state.validation = { ...state.validation, ...action.payload };
    },
    resetValidation: (state) => { state.validation = { ...initialValidation }; },

    // ── UI ────────────────────────────────────────────────────────────
    setUiState: (state, action: PayloadAction<Partial<FloorPlanUiState>>) => {
      state.ui = { ...state.ui, ...action.payload };
    },
    toggleSidebarLeft: (state) => { state.ui.leftSidebarVisible = !state.ui.leftSidebarVisible; },
    toggleSidebarRight: (state) => { state.ui.rightInspectorVisible = !state.ui.rightInspectorVisible; },
    toggleToolbar: (state) => { state.ui.toolbarVisible = !state.ui.toolbarVisible; },
    toggleStatusBar: (state) => { state.ui.statusBarVisible = !state.ui.statusBarVisible; },

    // ── Tool & Mode ──────────────────────────────────────────────────
    setActiveTool: (state, action: PayloadAction<FloorPlanTool>) => { state.activeTool = action.payload; },
    setMode: (state, action: PayloadAction<FloorPlanMode>) => { state.mode = action.payload; },

    // ── Change Trigger & Version ─────────────────────────────────────
    incrementChangeTrigger: (state) => { state.changeTrigger += 1; },
    setChangeTrigger: (state, action: PayloadAction<number>) => { state.changeTrigger = action.payload; },
    setVersion: (state, action: PayloadAction<number>) => { state.version = action.payload; },
    incrementVersion: (state) => { state.version += 1; },

    // ── Last Saved ──────────────────────────────────────────────────
    setLastSaved: (state, action: PayloadAction<Date>) => { state.lastSaved = action.payload; },
    setLastSavedPayload: (state, action: PayloadAction<any>) => { state.lastSavedPayload = action.payload; },

    // ── Reset ────────────────────────────────────────────────────────
    clearDocument: (state) => {
      state.document = initialState.document;
      state.isDirty = false;
      state.selection = null;
      state.multiSelection = [];
      // ── ADDED ──
      state.calibration = { ...initialCalibration };
      state.measurements = { ...initialMeasurements, committed: [] };
      state.hoveredId = null;
    },
    resetState: () => initialState,
  },
});

// ─── Exports ──────────────────────────────────────────────────────────────────

export const {
  setDocument, setDocumentMetadata,
  markDirty, markClean, clearDirty, markSaved, setSaving,
  setLoading, setError, clearError,
  setSelection, clearSelection,
  setMultiSelection, addToMultiSelection, clearMultiSelection,
  addRoom, updateRoom, removeRoom,
  addDoor, updateDoor, removeDoor,
  addWindow, updateWindow, removeWindow,
  addWall, updateWall, removeWall,
  addElectricalFixture, updateElectricalFixture, removeElectricalFixture,
  addImportedDrawing, updateImportedDrawing, removeImportedDrawing,
  setViewport, setZoom, setOffset,
  setLayerVisibility, toggleLayer,
  setValidation, resetValidation,
  setUiState, toggleSidebarLeft, toggleSidebarRight, toggleToolbar, toggleStatusBar,
  setActiveTool, setMode,
  incrementChangeTrigger, setChangeTrigger, setVersion, incrementVersion,
  setLastSaved, setLastSavedPayload,
  clearDocument, resetState,
  reclassifyElement,
  // ── ADDED ──
  setHoveredId,
  setCalibrationPoint, setCalibrationDistance, resetCalibration,
  addMeasurement, removeMeasurement, clearMeasurements, setMeasurementDraft,
} = floorPlanSlice.actions;

export default floorPlanSlice.reducer;