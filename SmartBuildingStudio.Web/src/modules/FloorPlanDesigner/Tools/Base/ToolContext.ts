import { DrawingDocument } from "@/modules/FloorPlanDesigner/Document/DrawingDocument";
import { DocumentManager } from "@/modules/FloorPlanDesigner/Document/DocumentManager";
import { CommandManager } from "@/modules/FloorPlanDesigner/Commands/CommandManager";

/**
 * Services available to every tool.
 *
 * A ToolContext is created by the FloorPlanDesigner and passed to
 * every active tool. It provides controlled access to the editor
 * without coupling tools directly to the UI.
 */
export class ToolContext {
    constructor(
        /**
         * Active drawing document.
         */
        public readonly document: DrawingDocument,

        /**
         * Document management services.
         */
        public readonly documentManager: DocumentManager,

        /**
         * Executes undoable commands.
         */
        public readonly commandManager: CommandManager
    ) {}

    /**
     * Requests a canvas redraw.
     * Implemented later by the canvas host.
     */
    public requestRender(): void {
        // Implemented by DrawingCanvas
    }

    /**
     * Displays a status message.
     * Implemented later by the application shell.
     */
    public setStatus(message: string): void {
        // Implemented by Dashboard / Status Bar
    }

    /**
     * Changes the mouse cursor.
     * Implemented later by DrawingCanvas.
     */
    public setCursor(cursor: string): void {
        // Implemented later
    }

    /**
     * Cancels the current operation.
     */
    public cancelCurrentOperation(): void {
        // Reserved for ToolManager integration
    }
}
