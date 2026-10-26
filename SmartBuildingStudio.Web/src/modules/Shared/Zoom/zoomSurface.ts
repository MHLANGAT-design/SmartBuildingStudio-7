// src/modules/Shared/Zoom/zoomSurface.ts
//
// Cross-module zoom contract. Any canvas that wants to participate in
// the app-level zoom control implements ZoomableSurface and registers
// itself with the shared registry (see zoomRegistry.tsx).

export interface WorldRect {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface ZoomToRectOptions {
  /** Fraction of canvas the rect should occupy (0..1). Default 0.4. */
  fill?: number;
  /** Hard cap on resulting user zoom. Default 4. */
  maxZoom?: number;
  /** Hard floor on resulting user zoom. Default 0.5. */
  minZoom?: number;
}

export interface ZoomableSurface {
  /** Human-readable module name for tooltips / debugging. */
  readonly moduleName: string;

  /** Current zoom level. 1 = 100%. */
  getZoom(): number;

  /** Set an absolute zoom level. Clamped by the implementation. */
  setZoom(zoom: number): void;

  /** Zoom in / out by one step. Implementations choose the step. */
  zoomIn(): void;
  zoomOut(): void;

  /** Fit content to view. No-op if the surface has no content. */
  fitToContent(): void;

  /**
   * Zoom so that the given world-space rect is centred on the canvas
   * and occupies approximately `fill` of the smaller canvas dimension.
   *
   * Implementations clamp the resulting user zoom between `minZoom`
   * and `maxZoom`, and clamp internally to their own zoom bounds.
   *
   * Callers pass world coordinates (the same coord space that the
   * canvas draws in). Each canvas converts to screen internally.
   */
  zoomToRect(rect: WorldRect, opts?: ZoomToRectOptions): void;
}

/** Absolute zoom bounds common to all modules. */
export const ZOOM_MIN = 0.05;
export const ZOOM_MAX = 20;

export const clampZoom = (z: number): number =>
  Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z));