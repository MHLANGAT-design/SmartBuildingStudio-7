import { BoundingBox } from "@/modules/FloorPlanDesigner/Models/Base/Geometry";

export class Selection {
    private objectIds: Set<string> = new Set();

    /**
     * Primary (active) object.
     * Usually the object shown in the Inspector.
     */
    private primaryObjectId?: string;

    /**
     * Cached selection bounds.
     * Updated by the SelectionService.
     */
    private bounds?: BoundingBox;

    // --------------------------------------------------------
    // Selection
    // --------------------------------------------------------

    public select(id: string): void {
        this.objectIds.clear();
        this.objectIds.add(id);
        this.primaryObjectId = id;
    }

    public selectMany(ids: string[]): void {
        this.objectIds = new Set(ids);
        this.primaryObjectId = ids.length > 0 ? ids[0] : undefined;
    }

    public add(id: string): void {
        this.objectIds.add(id);
        if (!this.primaryObjectId) {
            this.primaryObjectId = id;
        }
    }

    public remove(id: string): void {
        this.objectIds.delete(id);
        if (this.primaryObjectId === id) {
            this.primaryObjectId = this.objectIds.values().next().value;
        }
    }

    public toggle(id: string): void {
        if (this.objectIds.has(id)) {
            this.remove(id);
        } else {
            this.add(id);
        }
    }

    public clear(): void {
        this.objectIds.clear();
        this.primaryObjectId = undefined;
        this.bounds = undefined;
    }

    // --------------------------------------------------------
    // Queries
    // --------------------------------------------------------

    public has(id: string): boolean {
        return this.objectIds.has(id);
    }

    public isEmpty(): boolean {
        return this.objectIds.size === 0;
    }

    public count(): number {
        return this.objectIds.size;
    }

    public isSingleSelection(): boolean {
        return this.objectIds.size === 1;
    }

    public isMultiSelection(): boolean {
        return this.objectIds.size > 1;
    }

    public getPrimaryObjectId(): string | undefined {
        return this.primaryObjectId;
    }

    public getObjectIds(): readonly string[] {
        return Array.from(this.objectIds);
    }

    // --------------------------------------------------------
    // Bounds
    // --------------------------------------------------------

    public getBounds(): BoundingBox | undefined {
        return this.bounds;
    }

    public setBounds(bounds: BoundingBox): void {
        this.bounds = bounds;
    }
}
