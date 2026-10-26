import { DrawingLayer } from "@/modules/FloorPlanDesigner/Models/DrawingLayer";

export type LengthUnit = "mm" | "cm" | "m" | "inch" | "feet";

export interface FloorPlanBounds {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
}

export interface FloorPlanGrid {
    enabled: boolean;
    spacing: number;
    snapToGrid: boolean;
}

export interface FloorPlanSettings {
    units: LengthUnit;
    scale: number;
    grid: FloorPlanGrid;
    showGrid: boolean;
    showAxes: boolean;
    showDimensions: boolean;
    showLabels: boolean;
    backgroundColor: string;
}

export interface FloorPlanMetadata {
    id: string;
    name: string;
    description?: string;
    projectId?: string;
    buildingName?: string;
    buildingLevel?: string;
    architect?: string;
    client?: string;
    createdAt: Date;
    modifiedAt: Date;
    version: number;
}

export class FloorPlan {
    private metadata: FloorPlanMetadata;
    private settings: FloorPlanSettings;
    private bounds: FloorPlanBounds;
    private layers: DrawingLayer[] = [];

    constructor(
        metadata: FloorPlanMetadata,
        settings?: Partial<FloorPlanSettings>
    ) {
        this.metadata = metadata;
        this.settings = {
            units: "mm",
            scale: 1,
            grid: {
                enabled: true,
                spacing: 100,
                snapToGrid: true
            },
            showGrid: true,
            showAxes: true,
            showDimensions: true,
            showLabels: true,
            backgroundColor: "#ffffff",
            ...settings
        };
        this.bounds = {
            minX: 0,
            minY: 0,
            maxX: 0,
            maxY: 0
        };
    }

    // ------------------------------------------------------------------
    // Metadata
    // ------------------------------------------------------------------

    public getMetadata(): FloorPlanMetadata {
        return this.metadata;
    }

    public updateMetadata(metadata: Partial<FloorPlanMetadata>): void {
        this.metadata = {
            ...this.metadata,
            ...metadata,
            modifiedAt: new Date()
        };
    }

    // ------------------------------------------------------------------
    // Settings
    // ------------------------------------------------------------------

    public getSettings(): FloorPlanSettings {
        return this.settings;
    }

    public updateSettings(settings: Partial<FloorPlanSettings>): void {
        this.settings = {
            ...this.settings,
            ...settings
        };
    }

    // ------------------------------------------------------------------
    // Bounds
    // ------------------------------------------------------------------

    public getBounds(): FloorPlanBounds {
        return this.bounds;
    }

    public setBounds(bounds: FloorPlanBounds): void {
        this.bounds = bounds;
    }

    // ------------------------------------------------------------------
    // Layers
    // ------------------------------------------------------------------

    public getLayers(): readonly DrawingLayer[] {
        return this.layers;
    }

    public addLayer(layer: DrawingLayer): void {
        this.layers.push(layer);
    }

    public removeLayer(layerId: string): void {
        this.layers = this.layers.filter(layer => layer.id !== layerId);
    }

    public findLayer(layerId: string): DrawingLayer | undefined {
        return this.layers.find(layer => layer.id === layerId);
    }

    // ------------------------------------------------------------------
    // Helpers
    // ------------------------------------------------------------------

    public rename(name: string): void {
        this.metadata.name = name;
        this.metadata.modifiedAt = new Date();
    }

    public touch(): void {
        this.metadata.modifiedAt = new Date();
        this.metadata.version++;
    }
}
