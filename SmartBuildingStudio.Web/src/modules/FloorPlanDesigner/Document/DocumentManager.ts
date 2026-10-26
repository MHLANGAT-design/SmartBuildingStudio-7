import { DrawingDocument } from "@/modules/FloorPlanDesigner/Document/DrawingDocument";
import { DocumentHistory } from "@/modules/FloorPlanDesigner/Document/DocumentHistory";
import { UndoRedoManager } from "@/modules/FloorPlanDesigner/Document/UndoRedoManager";
import { VersionManager } from "@/modules/FloorPlanDesigner/Document/VersionManager";
import { AutoSaveManager } from "@/modules/FloorPlanDesigner/Document/AutoSaveManager";

export class DocumentManager {
    private document?: DrawingDocument;
    private readonly history: DocumentHistory;
    private readonly undoRedo: UndoRedoManager;
    private readonly versionManager: VersionManager;
    private readonly autoSaveManager: AutoSaveManager;

    constructor() {
        this.history = new DocumentHistory();
        this.undoRedo = new UndoRedoManager(this.history);
        this.versionManager = new VersionManager();
        this.autoSaveManager = new AutoSaveManager();
    }

    // --------------------------------------------------------
    // Active Document
    // --------------------------------------------------------

    public open(document: DrawingDocument): void {
        this.document = document;
        this.history.clear();
    }

    public close(): void {
        this.autoSaveManager.stop();
        this.history.clear();
        this.document = undefined;
    }

    public hasDocument(): boolean {
        return this.document !== undefined;
    }

    public getDocument(): DrawingDocument | undefined {
        return this.document;
    }

    // --------------------------------------------------------
    // Managers
    // --------------------------------------------------------

    public getHistory(): DocumentHistory {
        return this.history;
    }

    public getUndoRedo(): UndoRedoManager {
        return this.undoRedo;
    }

    public getVersionManager(): VersionManager {
        return this.versionManager;
    }

    public getAutoSaveManager(): AutoSaveManager {
        return this.autoSaveManager;
    }

    // --------------------------------------------------------
    // Document State
    // --------------------------------------------------------

    public clearHistory(): void {
        this.history.clear();
    }

    public clearVersions(): void {
        this.versionManager.clear();
    }

    // --------------------------------------------------------
    // Queries
    // --------------------------------------------------------

    public canUndo(): boolean {
        return this.undoRedo.canUndo();
    }

    public canRedo(): boolean {
        return this.undoRedo.canRedo();
    }

    // --------------------------------------------------------
    // Undo / Redo
    // --------------------------------------------------------

    public undo(): void {
        this.undoRedo.undo();
    }

    public redo(): void {
        this.undoRedo.redo();
    }
}
