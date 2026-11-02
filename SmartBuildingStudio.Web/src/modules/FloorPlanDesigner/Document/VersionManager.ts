// src/modules/FloorPlanDesigner/Document/VersionManager.ts

import { BackendPayloadMapper } from "@/modules/FloorPlanDesigner/Store/BackendPayloadMapper";

/**
 * A serialized floor plan snapshot, in the legacy backend payload format
 * produced by BackendPayloadMapper.toLegacyBackend and consumed by
 * BackendPayloadMapper.fromLegacyBackend.
 */
export type SerializedDocument = any;

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
     * Serialized snapshot (legacy backend payload format).
     */
    snapshot: SerializedDocument;
}

/**
 * VersionManager — in-memory snapshots of the floor plan document.
 *
 * IMPORTANT: `createVersion()` is not called anywhere yet. Snapshots must
 * be triggered explicitly at meaningful checkpoints — plans under active
 * development should not be snapshotted on every change.
 *
 * Snapshots live in memory only; they vanish on page reload. Persistent
 * versioning across sessions requires wiring to a backend versioning API.
 *
 * Uses the same payload format as saveDrawing (BackendPayloadMapper.
 * toLegacyBackend) so snapshots are structurally identical to what the
 * backend already stores.
 */
export class VersionManager {
    private versions: DocumentVersion[] = [];
    private currentVersion = 0;

    // --------------------------------------------------------
    // Version Creation
    // --------------------------------------------------------

    public createVersion(
        document: any,
        description: string
    ): DocumentVersion {
        const payload = BackendPayloadMapper.toLegacyBackend(document);

        const version: DocumentVersion = {
            version: ++this.currentVersion,
            description,
            timestamp: new Date(),
            snapshot: payload,
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

    public restoreVersion(version: number): any | undefined {
        const entry = this.getVersion(version);
        if (!entry) {
            return undefined;
        }

        try {
            return BackendPayloadMapper.fromLegacyBackend(entry.snapshot);
        } catch (e: any) {
            console.warn("[VersionManager] Restore failed:", e?.message || e);
            return undefined;
        }
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

export default VersionManager;