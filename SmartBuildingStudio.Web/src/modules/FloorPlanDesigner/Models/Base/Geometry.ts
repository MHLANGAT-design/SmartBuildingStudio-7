export interface Point2D {
    x: number;
    y: number;
}

export interface BoundingBox {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
}

export function distance(a: Point2D, b: Point2D): number {
    return Math.sqrt(
        Math.pow(b.x - a.x, 2) +
        Math.pow(b.y - a.y, 2)
    );
}

export function midpoint(a: Point2D, b: Point2D): Point2D {
    return {
        x: (a.x + b.x) / 2,
        y: (a.y + b.y) / 2
    };
}

export function angle(a: Point2D, b: Point2D): number {
    return Math.atan2(b.y - a.y, b.x - a.x);
}
