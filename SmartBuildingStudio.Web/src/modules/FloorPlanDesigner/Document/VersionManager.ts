import { DrawingDocument } from "@/modules/FloorPlanDesigner/Document/DrawingDocument";
import {
    DocumentSerializer,
    SerializedDocument
} from "@/modules/FloorPlanDesigner/Document/DocumentSerializer";

export interface DocumentVersion {
    /**
     * Sequential version number.
     */
    version: number;

    /**
     * User-friendly description.
     */
    description: string;

    /**
     * Version creation time.
     */
    timestamp: Date;

    /**
     * Serialized snapshot.
     */
    snapshot: SerializedDocument;
}

export class VersionManager {
    private versions: DocumentVersion[] = [];
    private currentVersion = 0;

    // --------------------------------------------------------
    // Version Creation
    // --------------------------------------------------------

    public createVersion(
        document: DrawingDocument,
        description: string
    ): DocumentVersion {
        const version: DocumentVersion = {
            version: ++this.currentVersion,
            description,
            timestamp: new Date(),
            snapshot: DocumentSerializer.serialize(document)
        };

        this.versions.push(version);
        return version;
    }

    // --------------------------------------------------------
    // Queries
    // --------------------------------------------------------

    public getCurrentVersion(): number {
        return this.currentVersion;
    }

    public getLatestVersion(): DocumentVersion | undefined {
        return this.versions[this.versions.length - 1];
    }

    public getVersion(version: number): DocumentVersion | undefined {
        return this.versions.find(v => v.version === version);
    }

    public getVersions(): readonly DocumentVersion[] {
        return this.versions;
    }

    public count(): number {
        return this.versions.length;
    }

    public hasVersions(): boolean {
        return this.versions.length > 0;
    }

    // --------------------------------------------------------
    // Restore
    // --------------------------------------------------------

    public restoreVersion(version: number): DrawingDocument | undefined {
        const entry = this.getVersion(version);
        if (!entry) {
            return undefined;
        }

        return DocumentSerializer.deserialize(entry.snapshot);
    }

    // --------------------------------------------------------
    // Maintenance
    // --------------------------------------------------------

    public deleteVersion(version: number): boolean {
        const index = this.versions.findIndex(v => v.version === version);
        if (index === -1) {
            return false;
        }

        this.versions.splice(index, 1);
        return true;
    }

    public clear(): void {
        this.versions = [];
        this.currentVersion = 0;
    }
}
