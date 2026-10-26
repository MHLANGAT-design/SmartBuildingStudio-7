import { ITool, ToolPointerEvent } from "@/modules/FloorPlanDesigner/Tools/Base/ITool";
import { ToolContext } from "@/modules/FloorPlanDesigner/Tools/Base/ToolContext";

/**
 * Manages the editor's tools infrastructure.
 *
 * Responsibilities:
 *  - Register layout workspace design tools
 *  - Activate/deactivate tools safely
 *  - Route pointer gesture/keyboard events straight to the active tool
 */
export class ToolManager {
    private readonly tools = new Map<string, ITool>();
    private activeTool?: ITool;
    private readonly context: ToolContext;
    
    private dispatchReference?: any;

    constructor(context: ToolContext) {
        this.context = context;
        console.log('[ToolManager] Created with context:', context);
    }

    public setDispatcher(dispatch: any): void {
        this.dispatchReference = dispatch;
    }

    // --------------------------------------------------------
    // Registration
    // --------------------------------------------------------

    public register(tool: ITool): void {
        console.log(`[ToolManager] Registering tool: ${tool.getId()}`);
        this.tools.set(tool.getId(), tool);
    }

    public unregister(toolId: string): void {
        if (this.activeTool?.getId() === toolId) {
            this.activeTool.deactivate();
            this.activeTool = undefined;
        }
        this.tools.delete(toolId);
    }

    // --------------------------------------------------------
    // Activation
    // --------------------------------------------------------

    public activate(toolId: string): void {
        console.log(`[ToolManager] 🔄 Activating tool: ${toolId}`);
        const tool = this.tools.get(toolId);
        if (!tool) {
            console.error(`[ToolManager] ❌ Tool '${toolId}' not registered. Available:`, this.getRegisteredToolIds());
            throw new Error(`Tool '${toolId}' is not registered inside the workspace collection.`);
        }

        if (this.activeTool?.getId() === toolId) {
            console.log(`[ToolManager] ⏭️ Tool '${toolId}' already active.`);
            return;
        }

        this.activeTool?.deactivate();
        this.activeTool = tool;
        this.activeTool.activate(this.context);
        console.log(`[ToolManager] ✅ Tool '${toolId}' activated.`);
    }

    public deactivateCurrent(): void {
        this.activeTool?.deactivate();
        this.activeTool = undefined;
    }

    // --------------------------------------------------------
    // Queries
    // --------------------------------------------------------

    public getTool(toolId: string): ITool | undefined {
        return this.tools.get(toolId);
    }

    public getActiveTool(): ITool | undefined {
        return this.activeTool;
    }

    public getRegisteredTools(): ITool[] {
        return Array.from(this.tools.values());
    }

    public getRegisteredToolIds(): string[] {
        return Array.from(this.tools.keys());
    }

    public isActive(toolId: string): boolean {
        return this.activeTool?.getId() === toolId;
    }

    // --------------------------------------------------------
    // Pointer Events (with debug logs)
    // --------------------------------------------------------

    public onPointerDown(event: ToolPointerEvent): void {
        console.log(`[ToolManager] ⬇️ onPointerDown, active tool: ${this.activeTool?.getId() || 'none'}`);
        this.activeTool?.onPointerDown(event);
    }

    public onPointerMove(event: ToolPointerEvent): void {
        console.log(`[ToolManager] ➡️ onPointerMove, active tool: ${this.activeTool?.getId() || 'none'}`);
        this.activeTool?.onPointerMove(event);
    }

    public onPointerUp(event: ToolPointerEvent): void {
        console.log(`[ToolManager] ⬆️ onPointerUp, active tool: ${this.activeTool?.getId() || 'none'}`);
        this.activeTool?.onPointerUp(event);

        // Auto‑selection logic (unchanged)
        if (this.dispatchReference && this.context) {
            try {
                const doc = this.context.getDocument?.() || (this.context as any).drawingDocument;
                if (doc) {
                    let activeSelection: any = null;
                    const toolId = this.activeTool?.getId();

                    if (toolId === "window") {
                        const windows = doc.getWindows?.() || doc.windows || [];
                        if (windows.length > 0) activeSelection = windows[windows.length - 1];
                    } else if (toolId === "door") {
                        const doors = doc.getDoors?.() || doc.doors || [];
                        if (doors.length > 0) activeSelection = doors[doors.length - 1];
                    } else if (toolId === "wall") {
                        const walls = doc.getWalls?.() || doc.walls || [];
                        if (walls.length > 0) activeSelection = walls[walls.length - 1];
                    } else if (toolId === "room") {
                        const rooms = doc.getRooms?.() || doc.rooms || [];
                        if (rooms.length > 0) activeSelection = rooms[rooms.length - 1];
                    }

                    if (activeSelection) {
                        this.dispatchReference({
                            type: "floorPlan/setSelection",
                            payload: activeSelection
                        });
                        window.dispatchEvent(new CustomEvent("sbs:canvas-update"));
                        window.dispatchEvent(new CustomEvent("canvas-invalidate"));
                    }
                }
            } catch (err) {
                console.warn("[ToolManager Intercept Error]:", err);
            }
        }
    }

    public onDoubleClick(event: ToolPointerEvent): void {
        console.log(`[ToolManager] 👆 onDoubleClick, active tool: ${this.activeTool?.getId() || 'none'}`);
        this.activeTool?.onDoubleClick(event);
    }

    // --------------------------------------------------------
    // Keyboard Events
    // --------------------------------------------------------

    public onKeyDown(event: KeyboardEvent): void {
        this.activeTool?.onKeyDown(event);
    }

    public onKeyUp(event: KeyboardEvent): void {
        this.activeTool?.onKeyUp(event);
    }

    // --------------------------------------------------------
    // Tool Control
    // --------------------------------------------------------

    public cancelCurrentTool(): void {
        this.activeTool?.cancel();
    }

    public renderOverlay(context: CanvasRenderingContext2D): void {
        this.activeTool?.renderOverlay(context);
    }
}

export default ToolManager;