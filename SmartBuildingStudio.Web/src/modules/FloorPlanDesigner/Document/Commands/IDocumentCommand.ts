/**
 * ============================================================================
 * SmartBuildingStudio
 * Drawing Engine V2
 * ----------------------------------------------------------------------------
 * IDocumentCommand
 *
 * Base interface for every undoable engineering command.
 * ============================================================================
 */

export interface IDocumentCommand {
    /**
     * Friendly name shown in the Undo History.
     */
    readonly name: string;

    /**
     * Executes the command.
     */
    execute(): void;

    /**
     * Reverts the command.
     */
    undo(): void;

    /**
     * Reapplies the command.
     */
    redo(): void;
}
