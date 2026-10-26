export interface Point2D {
  x: number;
  y: number;
}

export interface ViewportState {
  zoom: number;
  offsetX: number;
  offsetY: number;
}

/**
 * Converts screen-space pixel coordinates to real-world geometric designer coordinates.
 */
export function screenToWorld(screenPoint: Point2D, viewport: ViewportState): Point2D {
  return {
    x: (screenPoint.x - viewport.offsetX) / viewport.zoom,
    y: (screenPoint.y - viewport.offsetY) / viewport.zoom,
  };
}

/**
 * Converts real-world geometric coordinates to screen-space coordinates for accurate canvas rendering.
 */
export function worldToScreen(worldPoint: Point2D, viewport: ViewportState): Point2D {
  return {
    x: (worldPoint.x * viewport.zoom) + viewport.offsetX,
    y: (worldPoint.y * viewport.zoom) + viewport.offsetY,
  };
}
