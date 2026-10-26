import { DrawingObject } from "@/modules/FloorPlanDesigner/Models/Base/DrawingObject";
import { Drawable } from "@/modules/FloorPlanDesigner/Models/Base/Drawable";
import { Point2D } from "@/modules/FloorPlanDesigner/Models/Base/Geometry";

export type WindowType =
    | "fixed"
    | "casement"
    | "awning"
    | "sliding"
    | "double-hung"
    | "louvre";

export interface WindowProps {
    wallId: string;
    offset: number;
    width: number;
    height: number;
    sillHeight: number;
    rotation: number;
    type: WindowType;
}

export class Window extends DrawingObject implements Drawable {
    private props: WindowProps;

    constructor(metadata: any, props: WindowProps) {
        super(metadata);
        this.props = props;
    }

    // --------------------------------------------------------
    // Wall binding
    // --------------------------------------------------------

    public getWallId(): string {
        return this.props.wallId;
    }

    public attachToWall(wallId: string): void {
        this.props.wallId = wallId;
        this.touch();
    }

    // --------------------------------------------------------
    // Placement
    // --------------------------------------------------------

    public getOffset(): number {
        return this.props.offset;
    }

    public setOffset(offset: number): void {
        this.props.offset = offset;
        this.touch();
    }

    public getRotation(): number {
        return this.props.rotation;
    }

    public setRotation(rotation: number): void {
        this.props.rotation = rotation;
        this.touch();
    }

    // --------------------------------------------------------
    // Dimensions
    // --------------------------------------------------------

    public getWidth(): number {
        return this.props.width;
    }

    public setWidth(width: number): void {
        this.props.width = width;
        this.touch();
    }

    public getHeight(): number {
        return this.props.height;
    }

    public setHeight(height: number): void {
        this.props.height = height;
        this.touch();
    }

    public getSillHeight(): number {
        return this.props.sillHeight;
    }

    public setSillHeight(height: number): void {
        this.props.sillHeight = height;
        this.touch();
    }

    // --------------------------------------------------------
    // Type
    // --------------------------------------------------------

    public getType(): WindowType {
        return this.props.type;
    }

    public setType(type: WindowType): void {
        this.props.type = type;
        this.touch();
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
        ctx.fillStyle = style.fillColor ?? "#bfdbfe";
        ctx.lineWidth = style.lineWidth ?? 1;

        // Simple placeholder representation:
        const x = this.props.offset * zoom;
        const w = this.props.width * zoom;

        ctx.beginPath();
        ctx.rect(x - w / 2, -5, w, 10);
        ctx.fill();
        ctx.stroke();

        ctx.restore();
    }

    public containsPoint(point: Point2D): boolean {
        const x = this.props.offset;
        const half = this.props.width / 2;

        return point.x >= x - half && point.x <= x + half;
    }

    public getBounds() {
        const x = this.props.offset;
        const w = this.props.width;

        return {
            minX: x - w / 2,
            minY: -this.props.height / 2,
            maxX: x + w / 2,
            maxY: this.props.height / 2
        };
    }

    // --------------------------------------------------------
    // Clone
    // --------------------------------------------------------

    public clone(): Window {
        return new Window(
            { ...this.getMetadata() },
            { ...this.props }
        );
    }

    // --------------------------------------------------------
    // Future hook
    // --------------------------------------------------------

    public getWorldPosition(): Point2D | null {
        return null;
    }
}
