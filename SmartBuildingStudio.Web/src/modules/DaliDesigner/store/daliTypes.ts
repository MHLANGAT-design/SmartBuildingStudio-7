// src/modules/DaliDesigner/store/daliTypes.ts

import { DaliDocument } from "@/modules/DaliDesigner/Document/DaliDocument";
import { ValidationIssue } from "@/modules/DaliDesigner/services/ValidationService";
import { FloorplanRenderModel } from "@/modules/DaliDesigner/Document/FloorplanLoader";

export type AssignmentSubMode = "add" | "remove";

export interface DaliSelection {
  deviceIds: string[];
  lineId?: string;
  groupId?: string;
  sceneId?: string;
  activeSceneId?: string;
  assignmentMode?: boolean;
  assignmentSubMode?: AssignmentSubMode;
}

export type DaliStatus = "idle" | "loading" | "saving" | "error";

export interface FloorplanState {
  model: FloorplanRenderModel | null;
  status: "idle" | "loading" | "ready" | "error";
  error: string | null;
}

export interface RawGeometryState {
  elements: any[];
  status: "idle" | "loading" | "ready" | "error";
}

export interface DaliViewport {
  zoom: number;
  offsetX: number;
  offsetY: number;
}

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
  rawgeometry: boolean;
}

export type SidebarSectionKey = "lines" | "devices" | "groups" | "scenes";
export type SidebarExpansion = Record<SidebarSectionKey, boolean>;

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
  rawGeometry: RawGeometryState;
  viewport: DaliViewport;
}