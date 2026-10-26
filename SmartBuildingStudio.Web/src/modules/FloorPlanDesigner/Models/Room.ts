import { DrawingObject } from "@/modules/FloorPlanDesigner/Models/Base/DrawingObject";
import { Drawable } from "@/modules/FloorPlanDesigner/Models/Base/Drawable";
import { Point2D } from "@/modules/FloorPlanDesigner/Models/Base/Geometry";

export interface RoomProps {
    height: number;
    usage?: string;
    wallIds: string[];
}

export interface RoomGeometry {
    vertices: Point2D[];
}

export class Room extends DrawingObject implements Drawable {
    private geometry: RoomGeometry;
    private props: RoomProps;

    constructor(
        metadata: any,
        geometry: RoomGeometry,
        props?: Partial<RoomProps>
    ) {
        super(metadata);
        this.geometry = geometry;
        this.props = {
            height: 3000,
            wallIds: [],
            ...props
        };
    }

    // --------------------------------------------------------
    // Geometry
    // --------------------------------------------------------

    public getVertices(): readonly Point2D[] {
        return this.geometry.vertices;
    }

    public setVertices(vertices: Point2D[]): void {
        this.geometry.vertices = vertices;
        this.touch();
    }

    public addVertex(vertex: Point2D): void {
        this.geometry.vertices.push(vertex);
        this.touch();
    }

    public removeVertex(index: number): void {
        this.geometry.vertices.splice(index, 1);
        this.touch();
    }

    // --------------------------------------------------------
    // Wall references
    // --------------------------------------------------------

    public getWallIds(): readonly string[] {
        return this.props.wallIds;
    }

    public addWall(wallId: string): void {
        if (!this.props.wallIds.includes(wallId)) {
            this.props.wallIds.push(wallId);
            this.touch();
        }
    }

    public removeWall(wallId: string): void {
        this.props.wallIds = this.props.wallIds.filter(id => id !== wallId);
        this.touch();
    }

    // --------------------------------------------------------
    // Properties
    // --------------------------------------------------------

    public getHeight(): number {
        return this.props.height;
    }

    public setHeight(height: number): void {
        this.props.height = height;
        this.touch();
    }

    public getUsage(): string | undefined {
        return this.props.usage;
    }

    public setUsage(usage: string): void {
        this.props.usage = usage;
        this.touch();
    }

    // --------------------------------------------------------
    // Measurements
    // --------------------------------------------------------

    public getArea(): number {
        let area = 0;
        const v = this.geometry.vertices;

        for (let i = 0; i < v.length; i++) {
            const current = v[i];
            const next = v[(i + 1) % v.length];

            area += current.x * next.y;
            area -= next.x * current.y;
        }

        return Math.abs(area) / 2;
    }

    public getCentroid(): Point2D {
        const v = this.geometry.vertices;
        const x = v.reduce((sum, p) => sum + p.x, 0) / v.length;
        const y = v.reduce((sum, p) => sum + p.y, 0) / v.length;

        return { x, y };
    }

    // --------------------------------------------------------
    // Drawable implementation
    // --------------------------------------------------------

    public draw(ctx: CanvasRenderingContext2D, zoom: number): void {
        if (!this.isVisible()) return;

        const style = this.getStyle();
        const v = this.geometry.vertices;
        if (v.length < 3) return;

        ctx.save();
        ctx.globalAlpha = style.opacity;
        ctx.fillStyle = style.fillColor ?? "#dbeafe";
        ctx.strokeStyle = style.strokeColor;
        ctx.lineWidth = style.lineWidth ?? 1;

        ctx.beginPath();
        ctx.moveTo(v[0].x * zoom, v[0].y * zoom);

        for (let i = 1; i < v.length; i++) {
            ctx.lineTo(v[i].x * zoom, v[i].y * zoom);
        }

        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    }

    public containsPoint(point: Point2D): boolean {
        const v = this.geometry.vertices;
        let inside = false;

        for (let i = 0, j = v.length - 1; i < v.length; j = i++) {
            const xi = v[i].x;
            const yi = v[i].y;
            const xj = v[j].x;
            const yj = v[j].y;

            const intersect = (yi > point.y !== yj > point.y) &&
                (point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi);

            if (intersect) inside = !inside;
        }

        return inside;
    }

    public getBounds() {
        const v = this.geometry.vertices;
        return {
            minX: Math.min(...v.map(p => p.x)),
            minY: Math.min(...v.map(p => p.y)),
            maxX: Math.max(...v.map(p => p.x)),
            maxY: Math.max(...v.map(p => p.y))
        };
    }

    // --------------------------------------------------------
    // Clone
    // --------------------------------------------------------

    public clone(): Room {
        return new Room(
            { ...this.getMetadata() },
            { vertices: this.geometry.vertices.map(p => ({ ...p })) },
            {
                ...this.props,
                wallIds: [...this.props.wallIds]
            }
        );
    }
}
