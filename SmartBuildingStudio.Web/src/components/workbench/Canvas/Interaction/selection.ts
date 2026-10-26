import { CanvasPoint, CanvasSelection } from "./types";

export interface SelectionBounds {
    x: number;
    y: number;
    width: number;
    height: number;
}

/**
 * Build normalized selection rectangle.
 */
export function selectionBounds(selection: CanvasSelection): SelectionBounds {
    const x = Math.min(selection.start.x, selection.current.x);
    const y = Math.min(selection.start.y, selection.current.y);
    const width = Math.abs(selection.current.x - selection.start.x);
    const height = Math.abs(selection.current.y - selection.start.y);

    return { x, y, width, height };
}

/**
 * Test point.
 */
export function pointInsideSelection(point: CanvasPoint, selection: CanvasSelection): boolean {
    const box = selectionBounds(selection);
    return (
        point.x >= box.x &&
        point.x <= box.x + box.width &&
        point.y >= box.y &&
        point.y <= box.y + box.height
    );
}

/**
 * Rectangle intersection.
 */
export function rectanglesIntersect(a: SelectionBounds, b: SelectionBounds): boolean {
    return !(
        a.x + a.width < b.x ||
        b.x + b.width < a.x ||
        a.y + a.height < b.y ||
        b.y + b.height < a.y
    );
}

/**
 * Rectangle contains rectangle.
 */
export function rectangleContains(outer: SelectionBounds, inner: SelectionBounds): boolean {
    return (
        inner.x >= outer.x &&
        inner.y >= outer.y &&
        inner.x + inner.width <= outer.x + outer.width &&
        inner.y + inner.height <= outer.y + outer.height
    );
}

/**
 * Rectangle center.
 */
export function selectionCenter(selection: CanvasSelection): CanvasPoint {
    const box = selectionBounds(selection);
    return {
        x: box.x + box.width / 2,
        y: box.y + box.height / 2
    };
}
