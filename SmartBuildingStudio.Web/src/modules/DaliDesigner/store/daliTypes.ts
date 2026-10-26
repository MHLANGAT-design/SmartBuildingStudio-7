// src/modules/DaliDesigner/store/daliTypes.ts
import { DaliDocument } from "@/modules/DaliDesigner/Document/DaliDocument";
import { ValidationIssue } from "@/modules/DaliDesigner/services/ValidationService";
import { FloorplanRenderModel } from "@/modules/DaliDesigner/Document/FloorplanLoader";

// ─────────────────────────────────────────────────────────────────────
// Selection
// ─────────────────────────────────────────────────────────────────────

export type AssignmentSubMode = "add" | "remove";

export interface DaliSelection {
  deviceIds: string[];

  /**
   * Currently selected DALI line. Set when the user clicks a line in
   * the sidebar's DaliLineExplorer. Cleared whenever a device, group,
   * or scene is selected instead — the inspector shows one of these
   * at a time, and the four are mutually exclusive by design.
   */
  lineId?: string;

  groupId?: string;
  sceneId?: string;
  activeSceneId?: string;

  assignmentMode?: boolean;
  assignmentSubMode?: AssignmentSubMode;
}

// ─────────────────────────────────────────────────────────────────────
// Network load/save status
// ─────────────────────────────────────────────────────────────────────

export type DaliStatus = "idle" | "loading" | "saving" | "error";

// ─────────────────────────────────────────────────────────────────────
// Floorplan geometry sub-state
// ─────────────────────────────────────────────────────────────────────

export interface FloorplanState {
  model: FloorplanRenderModel | null;
  status: "idle" | "loading" | "ready" | "error";
  error: string | null;
}

// ─────────────────────────────────────────────────────────────────────
// Canvas viewport (zoom + pan)
// ─────────────────────────────────────────────────────────────────────

export interface DaliViewport {
  zoom: number;
  offsetX: number;
  offsetY: number;
}

// ─────────────────────────────────────────────────────────────────────
// Layer visibility
// ─────────────────────────────────────────────────────────────────────

export interface LayerVisibility {
  rooms: boolean;
  network: boolean;
  devices: boolean;
  groups: boolean;
  scenes: boolean;
  lineTopology: boolean;
  addressMap: boolean;
  signalFlow: boolean;
  validation: boolean;
}

// ─────────────────────────────────────────────────────────────────────
// Sidebar expansion
// ─────────────────────────────────────────────────────────────────────

export type SidebarSectionKey =
  | "lines"
  | "devices"
  | "groups"
  | "scenes";

export type SidebarExpansion = Record<SidebarSectionKey, boolean>;

// ─────────────────────────────────────────────────────────────────────
// Root state
// ─────────────────────────────────────────────────────────────────────

export interface DaliState {
  document: DaliDocument;
  selection: DaliSelection;
  validation: ValidationIssue[];
  status: DaliStatus;
  dirty: boolean;
  lastSavedAt: string | null;
  error: string | null;
  layerVisibility: LayerVisibility;
  sidebarExpansion: SidebarExpansion;
  floorplan: FloorplanState;
  viewport: DaliViewport;
}