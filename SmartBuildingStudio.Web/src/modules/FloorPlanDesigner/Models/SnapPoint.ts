import { Point2D } from "@/modules/FloorPlanDesigner/Models/Base/Geometry";

export type SnapType =
    | "endpoint"
    | "midpoint"
    | "center"
    | "intersection"
    | "perpendicular"
    | "nearest"
    | "grid"
    | "guide"
    | "quadrant"
    | "tangent"
    | "extension"
    | "custom";

export interface SnapPointOptions {
    /**
     * Unique identifier
     */
    id: string;

    /**
     * World coordinates
     */
    position: Point2D;

    /**
     * Object that owns this snap point
     */
    objectId?: string;

    /**
     * Kind of snap
     */
    type: SnapType;

    /**
     * Display priority.
     * Higher values win if multiple snap points overlap.
     */
    priority?: number;

    /**
     * Whether the snap point is currently active.
     */
    enabled?: boolean;
}

export class SnapPoint {
    private id: string;
    private position: Point2D;
    private objectId?: string;
    private type: SnapType;
    private priority: number;
    private enabled: boolean;

    constructor(options: SnapPointOptions) {
        this.id = options.id;
        this.position = options.position;
        this.objectId = options.objectId;
        this.type = options.type;
        this.priority = options.priority ?? 0;
        this.enabled = options.enabled ?? true;
    }

    // --------------------------------------------------------
    // Identity
    // --------------------------------------------------------

    public getId(): string {
        return this.id;
    }

    public getObjectId(): string | undefined {
        return this.objectId;
    }

    // --------------------------------------------------------
    // Position
    // --------------------------------------------------------

    public getPosition(): Point2D {
        return this.position;
    }

    public setPosition(position: Point2D): void {
        this.position = position;
    }

    // --------------------------------------------------------
    // Type
    // --------------------------------------------------------

    public getType(): SnapType {
        return this.type;
    }

    // --------------------------------------------------------
    // Priority
    // --------------------------------------------------------

    public getPriority(): number {
        return this.priority;
    }

    public setPriority(priority: number): void {
        this.priority = priority;
    }

    // --------------------------------------------------------
    // Enabled
    // --------------------------------------------------------

    public isEnabled(): boolean {
        return this.enabled;
    }

    public setEnabled(enabled: boolean): void {
        this.enabled = enabled;
    }

    // --------------------------------------------------------
    // Utilities
    // --------------------------------------------------------

    public distanceTo(point: Point2D): number {
        const dx = this.position.x - point.x;
        const dy = this.position.y - point.y;

        return Math.sqrt(dx * dx + dy * dy);
    }

    public clone(): SnapPoint {
        return new SnapPoint({
            id: this.id,
            position: { ...this.position },
            objectId: this.objectId,
            type: this.type,
            priority: this.priority,
            enabled: this.enabled
        });
    }
}
