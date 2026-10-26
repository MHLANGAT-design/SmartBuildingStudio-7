import { CanvasPoint, CanvasViewport } from "./types";

export interface PanSession {
    startMouse: CanvasPoint;
    startViewport: CanvasViewport;
}

/**
 * Creates a new pan session.
 */
export function createPanSession(mouse: CanvasPoint, viewport: CanvasViewport): PanSession {
    return {
        startMouse: mouse,
        startViewport: { ...viewport }
    };
}

/**
 * Calculates the updated viewport while panning.
 */
export function updatePan(session: PanSession, currentMouse: CanvasPoint): CanvasViewport {
    const dx = currentMouse.x - session.startMouse.x;
    const dy = currentMouse.y - session.startMouse.y;

    return {
        ...session.startViewport,
        offsetX: session.startViewport.offsetX + dx,
        offsetY: session.startViewport.offsetY + dy
    };
}

/**
 * Ends the current pan session.
 */
export function endPan(viewport: CanvasViewport): CanvasViewport {
    return {
        ...viewport
    };
}
