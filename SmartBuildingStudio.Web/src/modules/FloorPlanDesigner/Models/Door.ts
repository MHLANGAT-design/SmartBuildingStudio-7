import { DrawingObject } from "@/modules/FloorPlanDesigner/Models/Base/DrawingObject";
import { Drawable } from "@/modules/FloorPlanDesigner/Models/Base/Drawable";
import { Point2D } from "@/modules/FloorPlanDesigner/Models/Base/Geometry";

export type DoorSwing =
    | "left-in"
    | "left-out"
    | "right-in"
    | "right-out"
    | "double"
    | "sliding";

export interface DoorProps {
    wallId: string;
    offset: number;
    width: number;
    height: number;
    thickness: number;
    swing: DoorSwing;
    rotation: number;
}

export class Door extends DrawingObject implements Drawable {
    private props: DoorProps;

    constructor(metadata: any, props: DoorProps) {
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

    public getThickness(): number {
        return this.props.thickness;
    }

    public setThickness(value: number): void {
        this.props.thickness = value;
        this.touch();
    }

    // --------------------------------------------------------
    // Swing
    // --------------------------------------------------------

    public getSwing(): DoorSwing {
        return this.props.swing;
    }

    public setSwing(swing: DoorSwing): void {
        this.props.swing = swing;
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
        ctx.lineWidth = style.lineWidth ?? 1;

        // Placeholder rendering (wall-aligned arc will come later
        // when we implement Wall resolver + geometry engine)
        const x = this.props.offset * zoom;

        ctx.beginPath();
        ctx.moveTo(x - 10, 0);
        ctx.lineTo(x + 10, 0);
        ctx.stroke();

        ctx.restore();
    }

    public containsPoint(point: Point2D): boolean {
        const x = this.props.offset;
        const tolerance = 10;

        return Math.abs(point.x - x) < tolerance;
    }

    public getBounds() {
        const x = this.props.offset;

        return {
            minX: x - this.props.width / 2,
            minY: -this.props.thickness / 2,
            maxX: x + this.props.width / 2,
            maxY: this.props.thickness / 2
        };
    }

    // --------------------------------------------------------
    // Clone
    // --------------------------------------------------------

    public clone(): Door {
        return new Door(
            { ...this.getMetadata() },
            { ...this.props }
        );
    }

    // --------------------------------------------------------
    // Future hook (important)
    // --------------------------------------------------------

    /**
     * Later we will resolve this via:
     * - Wall geometry lookup
     * - coordinate transform system
     */
    public getWorldPosition(): Point2D | null {
        return null;
    }
}
