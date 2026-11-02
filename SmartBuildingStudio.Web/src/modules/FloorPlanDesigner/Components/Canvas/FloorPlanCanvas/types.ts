// src/modules/FloorPlanDesigner/Components/Canvas/FloorPlanCanvas/types.ts
//
// Types owned by FloorPlanCanvas. Do not import these from outside
// Components/Canvas/FloorPlanCanvas/ — they describe the internal
// contract between the orchestrator and its hooks/utils.

import type { SnapResult } from '@/modules/FloorPlanDesigner/Utils/SnapService';

/** Props accepted by the FloorPlanCanvas orchestrator. */
export interface FloorPlanCanvasProps {
  plan?: any;
  activeTool?: string;
  isReadOnly?: boolean;
  /** Shared ToolManager (owns split-wall, future tools). */
  toolManager?: any;
  /** Shared ToolContext for the manager. */
  toolContext?: any;
}

/**
 * Immutable snapshot of the canvas transform, computed once per frame
 * and stashed in `transformRef.current`. Hooks and pointer handlers
 * read this instead of re-deriving from scale/offset every time.
 */
export interface CanvasTransform {
  /** Pixels-per-world-unit along X (positive). */
  finalScale: number;
  /** Pixels-per-world-unit along Y (negative when flipY is on). */
  yScale: number;
  /** World-space center X of the render bounds. */
  centerX: number;
  /** World-space center Y of the render bounds. */
  centerY: number;
  /** Backing-store width (already multiplied by DPR). */
  width: number;
  /** Backing-store height (already multiplied by DPR). */
  height: number;
  /** User pan offset X (in backing-store pixels). */
  offsetX: number;
  /** User pan offset Y (in backing-store pixels). */
  offsetY: number;
}

/** Screen↔world converter pair handed to tools and overlay renderers. */
export interface Viewport {
  worldToScreen: (wp: { x: number; y: number }) => { x: number; y: number };
  screenToWorld: (sp: { x: number; y: number }) => { x: number; y: number };
}

/** Payload the pointer hooks forward to a per-canvas tool instance. */
export interface ToolPointerDownPayload {
  screenX: number;
  screenY: number;
  worldX: number;
  worldY: number;
  button: number;
  originalEvent: React.MouseEvent<HTMLCanvasElement>;
}

export interface ToolPointerMovePayload {
  screenX: number;
  screenY: number;
  worldX: number;
  worldY: number;
  originalEvent: React.MouseEvent<HTMLCanvasElement>;
}

/**
 * Payload the pointer hooks forward to the shared ToolManager when it
 * owns the active tool (e.g. split-wall). Superset of the per-tool
 * payload so the manager can apply snapping and know the document.
 */
export interface ToolManagerPointerDownPayload extends ToolPointerDownPayload {
  snapType: SnapResult['type'] | null;
  document: any;
  viewport: Viewport | null;
}

export interface ToolManagerPointerMovePayload extends ToolPointerMovePayload {
  snapType: SnapResult['type'] | null;
  document: any;
  viewport: Viewport | null;
}

export interface ToolManagerPointerUpPayload {
  screenX: number;
  screenY: number;
  worldX: number;
  worldY: number;
  button: number;
  originalEvent: React.MouseEvent<HTMLCanvasElement>;
  document: any;
  viewport: Viewport | null;
}

export interface ToolManagerPointerLeavePayload {
  originalEvent: React.MouseEvent<HTMLCanvasElement>;
  document: any;
}