import { DrawingDocument } from "@/modules/FloorPlanDesigner/Document/DrawingDocument";

export interface HistoryEntry {
    /**
     * Sequential version number.
     */
    version: number;

    /**
     * Human-readable description.
     * Example:
     * "Add Wall"
     * "Move Door"
     * "Delete Room"
     */
    description: string;

    /**
     * Snapshot of the document at this point in time.
     */
    document: DrawingDocument;

    /**
     * Timestamp when the history entry was created.
     */
    timestamp: Date;
}

export class DocumentHistory {
    private entries: HistoryEntry[] = [];

    /**
     * Current history position.
     *
     * -1 means no history.
     */
    private currentIndex = -1;

    /**
     * Maximum history size.
     */
    private maxEntries = 100;

    constructor(maxEntries = 100) {
        this.maxEntries = maxEntries;
    }

    // --------------------------------------------------------
    // Recording
    // --------------------------------------------------------

    public record(description: string, document: DrawingDocument): void {
        // Remove redo history if recording after an undo.
        if (this.currentIndex < this.entries.length - 1) {
            this.entries = this.entries.slice(0, this.currentIndex + 1);
        }

        const entry: HistoryEntry = {
            version: this.entries.length === 0
                ? 1
                : this.entries[this.entries.length - 1].version + 1,
            description,
            // Assuming clone() is available or handled by custom logic on DrawingDocument
            document: (document as any).clone ? (document as any).clone() : document,
            timestamp: new Date()
        };

        this.entries.push(entry);

        // Trim oldest entries.
        if (this.entries.length > this.maxEntries) {
            this.entries.shift();
        }

        this.currentIndex = this.entries.length - 1;
    }

    // --------------------------------------------------------
    // Navigation
    // --------------------------------------------------------

    public canUndo(): boolean {
        return this.currentIndex > 0;
    }

    public canRedo(): boolean {
        return this.currentIndex < this.entries.length - 1;
    }

    public previous(): HistoryEntry | undefined {
        if (!this.canUndo()) {
            return undefined;
        }

        this.currentIndex--;
        return this.entries[this.currentIndex];
    }

    public next(): HistoryEntry | undefined {
        if (!this.canRedo()) {
            return undefined;
        }

        this.currentIndex++;
        return this.entries[this.currentIndex];
    }

    public current(): HistoryEntry | undefined {
        if (this.currentIndex < 0) {
            return undefined;
        }

        return this.entries[this.currentIndex];
    }

    // --------------------------------------------------------
    // Queries
    // --------------------------------------------------------

    public count(): number {
        return this.entries.length;
    }

    public getCurrentVersion(): number {
        const current = this.current();
        return current ? current.version : 0;
    }

    public getEntries(): readonly HistoryEntry[] {
        return this.entries;
    }

    // --------------------------------------------------------
    // Maintenance
    // --------------------------------------------------------

    public clear(): void {
        this.entries = [];
        this.currentIndex = -1;
    }

    public setMaximumEntries(max: number): void {
        this.maxEntries = Math.max(1, max);

        while (this.entries.length > this.maxEntries) {
            this.entries.shift();
        }

        if (this.currentIndex >= this.entries.length) {
            this.currentIndex = this.entries.length - 1;
        }
    }
}
