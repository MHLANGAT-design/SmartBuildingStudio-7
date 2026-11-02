// src/modules/FloorPlanDesigner/Components/Canvas/FloorPlanCanvas/constants.ts
//
// Constants owned by FloorPlanCanvas. All values are read at module load
// and never mutate; do not export mutable references from here.

/** Default visibility for every render layer, before Redux overrides. */
export const DEFAULT_LAYERS: Record<string, boolean> = {
  grid: true,
  importedDrawing: true,
  rooms: true,
  walls: true,
  doors: true,
  windows: true,
  rawgeometry: false,
  measurements: true,
  calibration: true,
  snap: false,
  selection: true,
  preview: true,
  exitRoutes: false,
};

/**
 * Maps an active-tool id to the layer key that must be visible for its
 * overlay to render. `null` means "always render the overlay".
 */
export const TOOL_TO_LAYER_KEY: Record<string, string | null> = {
  door: 'doors',
  wall: 'walls',
  window: 'windows',
  room: 'rooms',
  select: null,
  pan: null,
  measure: null,
  calibration: null,
  'split-wall': 'walls',
};

/** Screen-pixel tolerance used by all hit-test calls. */
export const HIT_TEST_TOLERANCE_PX = 8;

/** Below this many screen pixels of movement, a click is treated as a click, not a drag. */
export const DRAG_DEAD_ZONE_PX = 4;

/** DOM MouseEvent.button values. */
export const MOUSE_LEFT = 0;
export const MOUSE_MIDDLE = 1;
export const MOUSE_RIGHT = 2;

/** Zoom clamping and stepping. */
export const ZOOM_MIN = 0.05;
export const ZOOM_MAX = 20;
export const ZOOM_STEP = 1.2;

/** Double-click-to-fill parameters. */
export const DOUBLE_CLICK_ZOOM_FILL = 0.4;
export const DOUBLE_CLICK_ZOOM_MAX = 4;

/** Fixed canvas size in CSS pixels (backing store = this × DPR). */
export const CANVAS_CSS_WIDTH = 1024;
export const CANVAS_CSS_HEIGHT = 650;

/** Padding (in backing-store pixels) reserved on each axis when fitting content. */
export const FIT_PADDING_PX = 120;

/** Fallback world bounds used when the document has no points at all. */
export const EMPTY_WORLD_BOUNDS = {
  minX: -1000,
  maxX: 1000,
  minY: -1000,
  maxY: 1000,
} as const;