/**
 * ============================================================================
 * SmartBuildingStudio
 * Drawing Engine V2
 * ----------------------------------------------------------------------------
 * CompositeCommand
 *
 * Groups multiple engineering commands into a single undo/redo operation.
 *
 * Examples
 * --------
 * • Import DWG
 * • Paste Selection
 * • Delete Room (walls, doors, windows)
 * • Auto Address Fixtures
 * • Move Multiple Fixtures
 * * ============================================================================
 */

import type { IDocumentCommand } from "@/Modules/FloorPlanDesigner/Document/Commands/IDocumentCommand";

export class CompositeCommand implements IDocumentCommand {
    private readonly commands: IDocumentCommand[] = [];

    constructor(
        public readonly name: string,
        commands: IDocumentCommand[] = []
    ) {
        this.commands.push(...commands);
    }

    /**
     * Adds another command to the composite.
     */
    public add(command: IDocumentCommand): void {
        this.commands.push(command);
    }

    /**
     * Adds multiple commands.
     */
    public addRange(commands: Iterable<IDocumentCommand>): void {
        for (const command of commands) {
            this.commands.push(command);
        }
    }

    /**
     * Number of child commands.
     */
    public get count(): number {
        return this.commands.length;
    }

    /**
     * True if the composite contains no commands.
     */
    public get isEmpty(): boolean {
        return this.commands.length === 0;
    }

    /**
     * Executes commands in forward order.
     */
    public execute(): void {
        for (const command of this.commands) {
            command.execute();
        }
    }

    /**
     * Undo must execute in reverse order.
     */
    public undo(): void {
        for (let i = this.commands.length - 1; i >= 0; i--) {
            this.commands[i].undo();
        }
    }

    /**
     * Redo executes in original order.
     */
    public redo(): void {
        for (const command of this.commands) {
            command.redo();
        }
    }

    /**
     * Removes all child commands.
     */
    public clear(): void {
        this.commands.length = 0;
    }

    /**
     * Read-only snapshot.
     */
    public toArray(): readonly IDocumentCommand[] {
        return [...this.commands];
    }
}
