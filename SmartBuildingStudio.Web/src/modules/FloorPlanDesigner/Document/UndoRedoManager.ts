import { DocumentHistory, HistoryEntry } from "@/modules/FloorPlanDesigner/Document/DocumentHistory";

export class UndoRedoManager {
    private readonly history: DocumentHistory;

    constructor(history: DocumentHistory) {
        this.history = history;
    }

    // --------------------------------------------------------
    // Undo / Redo
    // --------------------------------------------------------

    /**
     * Moves one step backward in history.
     * Returns the history entry to restore.
     */
    public undo(): HistoryEntry | undefined {
        return this.history.previous();
    }

    /**
     * Moves one step forward in history.
     * Returns the history entry to restore.
     */
    public redo(): HistoryEntry | undefined {
        return this.history.next();
    }

    // --------------------------------------------------------
    // State
    // --------------------------------------------------------

    public canUndo(): boolean {
        return this.history.canUndo();
    }

    public canRedo(): boolean {
        return this.history.canRedo();
    }

    public current(): HistoryEntry | undefined {
        return this.history.current();
    }

    public getCurrentVersion(): number {
        return this.history.getCurrentVersion();
    }

    public getHistoryCount(): number {
        return this.history.count();
    }

    // --------------------------------------------------------
    // Maintenance
    // --------------------------------------------------------

    public clear(): void {
        this.history.clear();
    }
}
