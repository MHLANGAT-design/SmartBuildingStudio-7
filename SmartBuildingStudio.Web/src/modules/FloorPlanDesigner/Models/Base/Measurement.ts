import { Point2D, distance } from "@/modules/FloorPlanDesigner/Models/Base/Geometry";

export class Measurements {
    public static length(start: Point2D, end: Point2D): number {
        return distance(start, end);
    }

    public static perimeter(vertices: Point2D[]): number {
        if (vertices.length < 2) return 0;

        let result = 0;

        for (let i = 0; i < vertices.length; i++) {
            const current = vertices[i];
            const next = vertices[(i + 1) % vertices.length];
            result += distance(current, next);
        }

        return result;
    }

    public static area(vertices: Point2D[]): number {
        let area = 0;

        for (let i = 0; i < vertices.length; i++) {
            const current = vertices[i];
            const next = vertices[(i + 1) % vertices.length];

            area += current.x * next.y;
            area -= next.x * current.y;
        }

        return Math.abs(area) / 2;
    }

    public static centroid(vertices: Point2D[]): Point2D {
        const x = vertices.reduce((s, p) => s + p.x, 0) / vertices.length;
        const y = vertices.reduce((s, p) => s + p.y, 0) / vertices.length;

        return { x, y };
    }

    public static angle(start: Point2D, end: Point2D): number {
        return Math.atan2(end.y - start.y, end.x - start.x);
    }
}
