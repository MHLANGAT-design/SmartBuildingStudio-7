/**
 * ============================================================================
 * Smart Building Studio
 * Drawing Engine V2
 * ----------------------------------------------------------------------------
 * DocumentMetadata
 *
 * Stores metadata describing an engineering document.
 *
 * NOTE:
 * This class deliberately contains NO geometry.
 * Geometry belongs to GeometryModel.
 * ============================================================================
 */

export enum EngineeringUnits {
    Millimetres = "mm",
    Centimetres = "cm",
    Metres = "m",
    Inches = "in",
    Feet = "ft"
}

export enum DocumentState {
    New = "New",
    Clean = "Clean",
    Dirty = "Dirty",
    Saving = "Saving",
    Loading = "Loading",
    ReadOnly = "ReadOnly"
}

export class DocumentMetadata {
    // ------------------------------------------------------------------------
    // Identity
    // ------------------------------------------------------------------------
    public documentId: string = crypto.randomUUID();
    public name: string = "Untitled Drawing";
    public description: string = "";

    // ------------------------------------------------------------------------
    // Project Explorer hierarchy
    // ------------------------------------------------------------------------
    public projectId?: string;
    public buildingId?: string;
    public floorId?: string;
    public folderId?: string;

    // ------------------------------------------------------------------------
    // Ownership
    // ------------------------------------------------------------------------
    public createdBy?: string;
    public modifiedBy?: string;

    // ------------------------------------------------------------------------
    // Dates
    // ------------------------------------------------------------------------
    public createdUtc: Date = new Date();
    public modifiedUtc: Date = new Date();
    public lastSavedUtc?: Date;

    // ------------------------------------------------------------------------
    // Versioning
    // ------------------------------------------------------------------------
    public version: number = 1;

    // ------------------------------------------------------------------------
    // Drawing Settings
    // ------------------------------------------------------------------------
    /**
     * Pixels represented by one metre.
     *
     * Example:
     * 100 = 100 pixels per metre.
     */
    public pixelsToMetresScale: number = 100;
    public units: EngineeringUnits = EngineeringUnits.Millimetres;

    // ------------------------------------------------------------------------
    // Status
    // ------------------------------------------------------------------------
    public state: DocumentState = DocumentState.New;
    public isLocked: boolean = false;
    public isArchived: boolean = false;

    // ------------------------------------------------------------------------
    // Module Integration
    // ------------------------------------------------------------------------
    /**
     * Links this floor plan to its fixture placement document.
     */
    public fixturePlacementDocumentId?: string;

    /**
     * Links this floor plan to its DALI network document.
     */
    public daliNetworkDocumentId?: string;

    /**
     * Links this floor plan to its commissioning document.
     */
    public commissioningDocumentId?: string;

    // ------------------------------------------------------------------------
    // Behaviour
    // ------------------------------------------------------------------------
    public markDirty(): void {
        if (
            this.state !== DocumentState.Loading &&
            this.state !== DocumentState.Saving &&
            this.state !== DocumentState.ReadOnly
        ) {
            this.state = DocumentState.Dirty;
            this.modifiedUtc = new Date();
        }
    }

    public markClean(): void {
        this.state = DocumentState.Clean;
        this.lastSavedUtc = new Date();
        this.modifiedUtc = this.lastSavedUtc;
    }

    public beginLoading(): void {
        this.state = DocumentState.Loading;
    }

    public endLoading(): void {
        this.state = DocumentState.Clean;
    }

    public beginSaving(): void {
        this.state = DocumentState.Saving;
    }

    public endSaving(): void {
        this.markClean();
    }

    public incrementVersion(): void {
        this.version++;
        this.modifiedUtc = new Date();
    }

    public lock(): void {
        this.isLocked = true;
    }

    public unlock(): void {
        this.isLocked = false;
    }

    public archive(): void {
        this.isArchived = true;
    }

    public clone(): DocumentMetadata {
        const clone = new DocumentMetadata();

        Object.assign(clone, this);

        clone.createdUtc = new Date(this.createdUtc);
        clone.modifiedUtc = new Date(this.modifiedUtc);
        clone.lastSavedUtc = this.lastSavedUtc ? new Date(this.lastSavedUtc) : undefined;

        return clone;
    }
}
