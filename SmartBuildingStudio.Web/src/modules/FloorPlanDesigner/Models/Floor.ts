import { DrawingMetadata } from "@/modules/FloorPlanDesigner/Models/Base/Metadata";

export interface FloorOptions {
    metadata: DrawingMetadata;
    level: number;
    elevation: number;
    description?: string;
}

export class Floor {
    private metadata: DrawingMetadata;
    private level: number;

    /**
     * Elevation above project datum (mm)
     */
    private elevation: number;
    private description?: string;

    /**
     * FloorPlan owned by this floor.
     */
    private floorPlanId?: string;

    constructor(options: FloorOptions) {
        this.metadata = options.metadata;
        this.level = options.level;
        this.elevation = options.elevation;
        this.description = options.description;
    }

    public getId(): string {
        return this.metadata.id;
    }

    public getName(): string | undefined {
        return this.metadata.name;
    }

    public getLevel(): number {
        return this.level;
    }

    public setLevel(level: number): void {
        this.level = level;
        this.touch();
    }

    public getElevation(): number {
        return this.elevation;
    }

    public setElevation(elevation: number): void {
        this.elevation = elevation;
        this.touch();
    }

    public getFloorPlanId(): string | undefined {
        return this.floorPlanId;
    }

    public attachFloorPlan(id: string): void {
        this.floorPlanId = id;
        this.touch();
    }

    public getMetadata(): DrawingMetadata {
        return this.metadata;
    }

    private touch(): void {
        this.metadata.modifiedAt = new Date();
    }
}
