import { CanvasPoint, CanvasViewport } from "./types";

/**
 * Convert screen coordinates to world coordinates.
 */
export function screenToWorld(point: CanvasPoint, viewport: CanvasViewport): CanvasPoint {
    return {
        x: (point.x - viewport.offsetX) / viewport.zoom,
        y: (point.y - viewport.offsetY) / viewport.zoom
    };
}

/**
 * Convert world coordinates to screen coordinates.
 */
export function worldToScreen(point: CanvasPoint, viewport: CanvasViewport): CanvasPoint {
    return {
        x: point.x * viewport.zoom + viewport.offsetX,
        y: point.y * viewport.zoom + viewport.offsetY
    };
}

/**
 * Euclidean distance.
 */
export function distance(a: CanvasPoint, b: CanvasPoint): number {
    return Math.sqrt((b.x - a.x) * (b.x - a.x) + (b.y - a.y) * (b.y - a.y));
}

/**
 * Midpoint.
 */
export function midpoint(a: CanvasPoint, b: CanvasPoint): CanvasPoint {
    return {
        x: (a.x + b.x) / 2,
        y: (a.y + b.y) / 2
    };
}

/**
 * Snap point to grid.
 */
export function snapToGrid(point: CanvasPoint, gridSize: number): CanvasPoint {
    return {
        x: Math.round(point.x / gridSize) * gridSize,
        y: Math.round(point.y / gridSize) * gridSize
    };
}

/**
 * Clamp point.
 */
export function clampPoint(point: CanvasPoint, min: CanvasPoint, max: CanvasPoint): CanvasPoint {
    return {
        x: Math.min(max.x, Math.max(min.x, point.x)),
        y: Math.min(max.y, Math.max(min.y, point.y))
    };
}

/**
 * Angle in radians.
 */
export function angleBetween(a: CanvasPoint, b: CanvasPoint): number {
    return Math.atan2(b.y - a.y, b.x - a.x);
}
