import { CanvasPoint, CanvasViewport } from "./types";

const MIN_ZOOM = 0.10;
const MAX_ZOOM = 10.00;
const ZOOM_FACTOR = 1.10;

/**
 * Clamp zoom.
 */
export function clampZoom(zoom: number): number {
    return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom));
}

/**
 * Zoom in.
 */
export function zoomIn(viewport: CanvasViewport): CanvasViewport {
    return {
        ...viewport,
        zoom: clampZoom(viewport.zoom * ZOOM_FACTOR)
    };
}

/**
 * Zoom out.
 */
export function zoomOut(viewport: CanvasViewport): CanvasViewport {
    return {
        ...viewport,
        zoom: clampZoom(viewport.zoom / ZOOM_FACTOR)
    };
}

/**
 * Reset viewport.
 */
export function resetZoom(): CanvasViewport {
    return {
        zoom: 1,
        offsetX: 0,
        offsetY: 0
    };
}

/**
 * Zoom towards the mouse cursor.
 */
export function zoomAtPoint(
    viewport: CanvasViewport,
    cursor: CanvasPoint,
    delta: number
): CanvasViewport {
    const factor = delta < 0 ? ZOOM_FACTOR : 1 / ZOOM_FACTOR;
    const newZoom = clampZoom(viewport.zoom * factor);

    const worldX = (cursor.x - viewport.offsetX) / viewport.zoom;
    const worldY = (cursor.y - viewport.offsetY) / viewport.zoom;

    return {
        zoom: newZoom,
        offsetX: cursor.x - worldX * newZoom,
        offsetY: cursor.y - worldY * newZoom
    };
}
