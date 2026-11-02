import { DrawingObject } from "@/modules/FloorPlanDesigner/Models/Base/DrawingObject";
import { Drawable } from "@/modules/FloorPlanDesigner/Models/Base/Drawable";
import {
    Point2D,
    distance,
    midpoint,
    angle
} from "@/modules/FloorPlanDesigner/Models/Base/Geometry";

export interface WallGeometry {
    start: Point2D;
    end: Point2D;
}

export interface WallProps {
    thickness: number;
    height: number;
}

export class Wall extends DrawingObject implements Drawable {
    private geometry: WallGeometry;
    private props: WallProps;

    constructor(
        metadata: any,
        geometry: WallGeometry,
        props?: Partial<WallProps>
    ) {
        super(metadata);
        this.geometry = geometry;
        this.props = {
            thickness: 150,
            height: 3000,
            ...props
        };
    }

    // --------------------------------------------------------
    // Geometry
    // --------------------------------------------------------

    public getStart(): Point2D {
        return this.geometry.start;
    }

    public setStart(point: Point2D): void {
        this.geometry.start = point;
        this.touch();
    }

    public getEnd(): Point2D {
        return this.geometry.end;
    }

    public setEnd(point: Point2D): void {
        this.geometry.end = point;
        this.touch();
    }

    public move(dx: number, dy: number): void {
        this.geometry.start = {
            x: this.geometry.start.x + dx,
            y: this.geometry.start.y + dy
        };
        this.geometry.end = {
            x: this.geometry.end.x + dx,
            y: this.geometry.end.y + dy
        };
        this.touch();
    }

    // --------------------------------------------------------
    // Properties
    // --------------------------------------------------------

    public getThickness(): number {
        return this.props.thickness;
    }

    public setThickness(value: number): void {
        this.props.thickness = value;
        this.touch();
    }

    public getHeight(): number {
        return this.props.height;
    }

    public setHeight(value: number): void {
        this.props.height = value;
        this.touch();
    }

    // --------------------------------------------------------
    // Measurements
    // --------------------------------------------------------

    public getLength(): number {
        return distance(this.geometry.start, this.geometry.end);
    }

    public getMidPoint(): Point2D {
        return midpoint(this.geometry.start, this.geometry.end);
    }

    public getAngle(): number {
        return angle(this.geometry.start, this.geometry.end);
    }

    // --------------------------------------------------------
    // Drawable implementation
    // --------------------------------------------------------

    public draw(ctx: CanvasRenderingContext2D, zoom: number): void {
        if (!this.isVisible()) return;

        const style = this.getStyle();
        ctx.save();

        ctx.globalAlpha = style.opacity;
        ctx.strokeStyle = style.strokeColor;
        ctx.lineWidth = style.lineWidth ?? 1;

        ctx.beginPath();
        ctx.moveTo(this.geometry.start.x * zoom, this.geometry.start.y * zoom);
        ctx.lineTo(this.geometry.end.x * zoom, this.geometry.end.y * zoom);
        ctx.stroke();

        ctx.restore();
    }

    public containsPoint(point: Point2D): boolean {
        const threshold = 5;
        const { x1, y1, x2, y2 } = {
            x1: this.geometry.start.x,
            y1: this.geometry.start.y,
            x2: this.geometry.end.x,
            y2: this.geometry.end.y
        };

        const dx = x2 - x1;
        const dy = y2 - y1;
        const lengthSquared = dx * dx + dy * dy;

        const t = ((point.x - x1) * dx + (point.y - y1) * dy) / lengthSquared;
        const clampedT = Math.max(0, Math.min(1, t));

        const closestPoint = {
            x: x1 + clampedT * dx,
            y: y1 + clampedT * dy
        };

        const dist = distance(point, closestPoint);
        return dist <= threshold;
    }

    public getBounds() {
        return {
            minX: Math.min(this.geometry.start.x, this.geometry.end.x),
            minY: Math.min(this.geometry.start.y, this.geometry.end.y),
            maxX: Math.max(this.geometry.start.x, this.geometry.end.x),
            maxY: Math.max(this.geometry.start.y, this.geometry.end.y)
        };
    }

    // --------------------------------------------------------
    // Clone
    // --------------------------------------------------------

    public clone(): Wall {
        return new Wall(
            { ...this.getMetadata() },
            {
                start: { ...this.geometry.start },
                end: { ...this.geometry.end }
            },
            { ...this.props }
        );
    }
}
