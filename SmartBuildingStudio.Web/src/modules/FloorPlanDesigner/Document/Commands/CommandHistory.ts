/**
 * ============================================================================
 * SmartBuildingStudio
 * Drawing Engine V2
 * ----------------------------------------------------------------------------
 * CommandHistory
 *
 * Encapsulates a stack of undoable commands.
 * The underlying collection is never exposed for modification.
 * ============================================================================
 */

import type { IDocumentCommand } from "@/modules/FloorPlanDesigner/Document/Commands/IDocumentCommand";

export class CommandHistory {
    private readonly commands: IDocumentCommand[] = [];

    /**
     * Number of commands currently in the history.
     */
    public get count(): number {
        return this.commands.length;
    }

    /**
     * Returns true when the history contains no commands.
     */
    public get isEmpty(): boolean {
        return this.commands.length === 0;
    }

    /**
     * Pushes a command onto the history stack.
     */
    public push(command: IDocumentCommand): void {
        this.commands.push(command);
    }

    /**
     * Removes and returns the most recent command.
     */
    public pop(): IDocumentCommand | undefined {
        return this.commands.pop();
    }

    /**
     * Returns the most recent command without removing it.
     */
    public peek(): IDocumentCommand | undefined {
        if (this.commands.length === 0) {
            return undefined;
        }

        return this.commands[this.commands.length - 1];
    }

    /**
     * Removes every command.
     */
    public clear(): void {
        this.commands.length = 0;
    }

    /**
     * Returns an immutable snapshot of the history.
     */
    public toArray(): readonly IDocumentCommand[] {
        return [...this.commands];
    }
}
