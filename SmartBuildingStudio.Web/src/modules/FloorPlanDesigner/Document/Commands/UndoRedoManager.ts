import { CompositeCommand } from "@/modules/FloorPlanDesigner/Document/Commands/CompositeCommand";
import { CommandHistory } from "@/modules/FloorPlanDesigner/Document/Commands/CommandHistory";
import type { IDocumentCommand } from "@/modules/FloorPlanDesigner/Document/Commands/IDocumentCommand";
import { DrawingDocumentEvents } from "@/modules/FloorPlanDesigner/Document/Events/DrawingDocumentEvents";
import {
    DocumentLifecycleEvent,
    DocumentLifecycleOperation
} from "@/modules/FloorPlanDesigner/Document/Events/DocumentLifecycleEvent";

export class UndoRedoManager {
    private readonly undoStack = new CommandHistory();
    private readonly redoStack = new CommandHistory();
    private activeTransaction?: CompositeCommand;

    constructor(private readonly events: DrawingDocumentEvents) {}

    // -------------------------------------------------------------
    // Properties
    // -------------------------------------------------------------
    public get canUndo(): boolean {
        return !this.undoStack.isEmpty;
    }

    public get canRedo(): boolean {
        return !this.redoStack.isEmpty;
    }

    public get isInTransaction(): boolean {
        return this.activeTransaction !== undefined;
    }

    public get undoHistory(): readonly IDocumentCommand[] {
        return this.undoStack.toArray();
    }

    public get redoHistory(): readonly IDocumentCommand[] {
        return this.redoStack.toArray();
    }

    // -------------------------------------------------------------
    // Execute
    // -------------------------------------------------------------
    public execute(command: IDocumentCommand): void {
        command.execute();

        if (this.activeTransaction) {
            this.activeTransaction.add(command);
            return;
        }

        this.undoStack.push(command);
        this.redoStack.clear();
        this.markDirty();
    }

    // -------------------------------------------------------------
    // Undo
    // -------------------------------------------------------------
    public undo(): void {
        const command = this.undoStack.pop();

        if (!command) {
            return;
        }

        command.undo();
        this.redoStack.push(command);
        this.markDirty();
    }

    // -------------------------------------------------------------
    // Redo
    // -------------------------------------------------------------
    public redo(): void {
        const command = this.redoStack.pop();

        if (!command) {
            return;
        }

        command.redo();
        this.undoStack.push(command);
        this.markDirty();
    }

    // -------------------------------------------------------------
    // Transactions
    // -------------------------------------------------------------
    public beginTransaction(name: string): void {
        if (this.activeTransaction) {
            throw new Error("Nested transactions are not supported.");
        }

        this.activeTransaction = new CompositeCommand(name);
    }

    public commitTransaction(): void {
        if (!this.activeTransaction) {
            return;
        }

        if (!this.activeTransaction.isEmpty) {
            this.undoStack.push(this.activeTransaction);
            this.redoStack.clear();
            this.markDirty();
        }

        this.activeTransaction = undefined;
    }

    public rollbackTransaction(): void {
        if (!this.activeTransaction) {
            return;
        }

        this.activeTransaction.undo();
        this.activeTransaction = undefined;
    }

    /**
     * Preferred transaction API.
     */
    public runInTransaction(name: string, action: () => void): void {
        this.beginTransaction(name);

        try {
            action();
            this.commitTransaction();
        } catch (error) {
            this.rollbackTransaction();
            throw error;
        }
    }

    // -------------------------------------------------------------
    // Maintenance
    // -------------------------------------------------------------
    public clear(): void {
        this.undoStack.clear();
        this.redoStack.clear();
        this.activeTransaction = undefined;
    }

    public dispose(): void {
        this.clear();
    }

    // -------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------
    private markDirty(): void {
        this.events.bus.publish(new DocumentLifecycleEvent(DocumentLifecycleOperation.Dirty));
    }
}
