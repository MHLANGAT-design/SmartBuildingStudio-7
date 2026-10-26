export type LayerType =
    | "walls"
    | "rooms"
    | "doors"
    | "windows"
    | "dimensions"
    | "annotations"
    | "electrical"
    | "plumbing"
    | "hvac"
    | "custom";

export interface LayerStyle {
    color: string;
    opacity: number;
    lineWeight: number;
}

export interface LayerMetadata {
    id: string;
    name: string;
    description?: string;
    createdAt: Date;
    modifiedAt: Date;
}

export class DrawingLayer {
    private metadata: LayerMetadata;
    private type: LayerType;
    private visible = true;
    private locked = false;

    /**
     * Lower values render first.
     */
    private zIndex = 0;

    /**
     * Drawing objects assigned to this layer.
     *
     * References only.
     */
    private objectIds: string[] = [];
    private style: LayerStyle;

    constructor(
        metadata: LayerMetadata,
        type: LayerType = "custom"
    ) {
        this.metadata = metadata;
        this.type = type;
        this.style = {
            color: "#374151",
            opacity: 1,
            lineWeight: 1
        };
    }

    // --------------------------------------------------------
    // Metadata
    // --------------------------------------------------------

    public getMetadata(): LayerMetadata {
        return this.metadata;
    }

    public get id(): string {
        return this.metadata.id;
    }

    public getName(): string {
        return this.metadata.name;
    }

    public rename(name: string): void {
        this.metadata.name = name;
        this.touch();
    }

    // --------------------------------------------------------
    // Layer Type
    // --------------------------------------------------------

    public getType(): LayerType {
        return this.type;
    }

    public setType(type: LayerType): void {
        this.type = type;
        this.touch();
    }

    // --------------------------------------------------------
    // Objects
    // --------------------------------------------------------

    public getObjectIds(): readonly string[] {
        return this.objectIds;
    }

    public addObject(objectId: string): void {
        if (!this.objectIds.includes(objectId)) {
            this.objectIds.push(objectId);
            this.touch();
        }
    }

    public removeObject(objectId: string): void {
        this.objectIds = this.objectIds.filter(id => id !== objectId);
        this.touch();
    }

    public containsObject(objectId: string): boolean {
        return this.objectIds.includes(objectId);
    }

    public clearObjects(): void {
        this.objectIds = [];
        this.touch();
    }

    // --------------------------------------------------------
    // Visibility
    // --------------------------------------------------------

    public isVisible(): boolean {
        return this.visible;
    }

    public setVisible(visible: boolean): void {
        this.visible = visible;
        this.touch();
    }

    public toggleVisibility(): void {
        this.visible = !this.visible;
        this.touch();
    }

    // --------------------------------------------------------
    // Locking
    // --------------------------------------------------------

    public isLocked(): boolean {
        return this.locked;
    }

    public setLocked(locked: boolean): void {
        this.locked = locked;
        this.touch();
    }

    public toggleLocked(): void {
        this.locked = !this.locked;
        this.touch();
    }

    // --------------------------------------------------------
    // Draw Order
    // --------------------------------------------------------

    public getZIndex(): number {
        return this.zIndex;
    }

    public setZIndex(index: number): void {
        this.zIndex = index;
        this.touch();
    }

    // --------------------------------------------------------
    // Style
    // --------------------------------------------------------

    public getStyle(): LayerStyle {
        return this.style;
    }

    public updateStyle(style: Partial<LayerStyle>): void {
        this.style = {
            ...this.style,
            ...style
        };
        this.touch();
    }

    // --------------------------------------------------------
    // Statistics
    // --------------------------------------------------------

    public getObjectCount(): number {
        return this.objectIds.length;
    }

    public isEmpty(): boolean {
        return this.objectIds.length === 0;
    }

    // --------------------------------------------------------
    // Utilities
    // --------------------------------------------------------

    public clone(): DrawingLayer {
        const layer = new DrawingLayer(
            {
                ...this.metadata,
                modifiedAt: new Date()
            },
            this.type
        );

        layer.visible = this.visible;
        layer.locked = this.locked;
        layer.zIndex = this.zIndex;
        layer.objectIds = [...this.objectIds];
        layer.style = { ...this.style };

        return layer;
    }

    private touch(): void {
        this.metadata.modifiedAt = new Date();
    }
}
