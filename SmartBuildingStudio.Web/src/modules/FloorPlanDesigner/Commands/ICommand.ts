/**
 * Base interface implemented by every executable command.
 *
 * A command represents a single user action that can be:
 *  - executed
 *  - undone
 *  - redone
 *
 * Examples:
 *  - AddWallCommand
 *  - MoveWallCommand
 *  - DeleteRoomCommand
 *  - RotateFixtureCommand
 *  - AddEmergencyLightCommand
 */
export interface ICommand {
    /**
     * Unique command identifier.
     */
    getId(): string;

    /**
     * Human-readable description.
     *
     * Examples:
     *  "Add Wall"
     *  "Move Door"
     *  "Delete Room"
     */
    getDescription(): string;

    /**
     * Executes the command.
     */
    execute(): void;

    /**
     * Reverses the command.
     */
    undo(): void;

    /**
     * Reapplies the command after an undo.
     */
    redo(): void;

    /**
     * Indicates whether the command has already been executed.
     */
    isExecuted(): boolean;
}
