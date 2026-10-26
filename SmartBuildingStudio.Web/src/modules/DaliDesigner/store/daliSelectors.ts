// src/modules/DaliDesigner/store/daliSelectors.ts
import type { RootState } from "@/store";
import { DaliDevice } from "@/modules/DaliDesigner/models/DaliDevice";
import type {
  LayerVisibility,
  SidebarExpansion,
} from "@/modules/DaliDesigner/store/daliTypes";

// ─── Root ────────────────────────────────────────────────────────────
export const selectDali = (s: RootState) => s.dali;

// ─── Document ────────────────────────────────────────────────────────
export const selectDocument   = (s: RootState) => s.dali.document;
export const selectDevices    = (s: RootState): DaliDevice[] => s.dali.document.devices;
export const selectLines      = (s: RootState) => s.dali.document.lines;
export const selectGroups     = (s: RootState) => s.dali.document.groups;
export const selectScenes     = (s: RootState) => s.dali.document.scenes;

// ─── Selection ───────────────────────────────────────────────────────
export const selectSelection  = (s: RootState) => s.dali.selection;

// ─── Validation / status ─────────────────────────────────────────────
export const selectValidationIssues = (s: RootState) => s.dali.validation;
export const selectStatus           = (s: RootState) => s.dali.status;
export const selectError            = (s: RootState) => s.dali.error;
export const selectDirty            = (s: RootState) => s.dali.dirty;

// ─── Layer visibility ────────────────────────────────────────────────
export const selectLayerVisibility = (s: RootState): LayerVisibility =>
  s.dali.layerVisibility;

// ─── Sidebar expansion ───────────────────────────────────────────────
export const selectSidebarExpansion = (s: RootState): SidebarExpansion =>
  s.dali.sidebarExpansion;

// ─── Floorplan geometry ──────────────────────────────────────────────
//
// The plan is rendered beneath the DALI layers. These three selectors
// back DaliCanvas: model = render primitives, status = loading state,
// error = failure message when the load rejects.
export const selectFloorplanModel  = (s: RootState) => s.dali.floorplan.model;
export const selectFloorplanStatus = (s: RootState) => s.dali.floorplan.status;
export const selectFloorplanError  = (s: RootState) => s.dali.floorplan.error;

// ─── Derived ─────────────────────────────────────────────────────────
export const selectDeviceById = (s: RootState, id: string) =>
  s.dali.document.devices.find((d) => d.id === id);

export const selectActiveScene = (s: RootState) => {
  const id = s.dali.selection.activeSceneId;
  if (!id) return null;
  return s.dali.document.scenes.find((sc) => sc.id === id) ?? null;
};

/**
 * Placeholder until the DALI canvas reads geometry from the store
 * instead of fetching it directly. Returns null; DaliCanvas no longer
 * uses this (it uses selectFloorplanModel).
 */
export const selectFloorplanGeometry = (_s: RootState) => null as
  | { rooms?: Array<{ id: string; points: Array<{ x: number; y: number }> }> }
  | null;