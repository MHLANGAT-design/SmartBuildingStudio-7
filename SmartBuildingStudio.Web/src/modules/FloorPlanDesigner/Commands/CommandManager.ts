import { ICommand } from "@/modules/FloorPlanDesigner/Commands/ICommand";

export class CommandManager {

    private undoStack: ICommand[] = [];

    private redoStack: ICommand[] = [];

    // --------------------------------------------------------
    // Execution
    // --------------------------------------------------------

    public execute(command: ICommand): void {

        command.execute();

        this.undoStack.push(command);

        // Once a new command is executed,
        // redo history is invalidated.
        this.redoStack = [];
    }

    // --------------------------------------------------------
    // Undo
    // --------------------------------------------------------

    public canUndo(): boolean {
        return this.undoStack.length > 0;
    }

    public undo(): void {

        if (!this.canUndo()) return;

        const command = this.undoStack.pop()!;

        command.undo();

        this.redoStack.push(command);
    }

    // --------------------------------------------------------
    // Redo
    // --------------------------------------------------------

    public canRedo(): boolean {
        return this.redoStack.length > 0;
    }

    public redo(): void {

        if (!this.canRedo()) return;

        const command = this.redoStack.pop()!;

        command.redo();

        this.undoStack.push(command);
    }

    // --------------------------------------------------------
    // State
    // --------------------------------------------------------

    public clear(): void {

        this.undoStack = [];

        this.redoStack = [];
    }

    public getUndoCount(): number {
        return this.undoStack.length;
    }

    public getRedoCount(): number {
        return this.redoStack.length;
    }

    public getLastCommand(): ICommand | undefined {
        return this.undoStack[this.undoStack.length - 1];
    }
}