// src/modules/FloorPlanDesigner/Tools/ToolManager.ts

import { ITool, ToolPointerEvent } from "@/modules/FloorPlanDesigner/Tools/Base/ITool";
import { ToolContext } from "@/modules/FloorPlanDesigner/Tools/Base/ToolContext";
import { SplitWallTool } from "./SplitWallTool";

export class ToolManager {
    private readonly tools = new Map<string, ITool>();
    private activeTool?: ITool;
    private readonly context: ToolContext;

    private dispatchReference?: any;

    constructor(context: ToolContext) {
        this.context = context;
        this.registerDefaultTools();
    }

    private registerDefaultTools(): void {
        this.register(new SplitWallTool());
    }

    public setDispatcher(dispatch: any): void {
        this.dispatchReference = dispatch;
    }

    public register(tool: ITool): void {
        this.tools.set(tool.getId(), tool);
    }

    public unregister(toolId: string): void {
        if (this.activeTool?.getId() === toolId) {
            this.activeTool.deactivate();
            this.activeTool = undefined;
        }
        this.tools.delete(toolId);
    }

    public activate(toolId: string): void {
        const tool = this.tools.get(toolId);
        if (!tool) {
            console.error(
                `[ToolManager] ❌ Tool '${toolId}' not registered. Available:`,
                this.getRegisteredToolIds()
            );
            return;
        }

        if (this.activeTool?.getId() === toolId) {
            return;
        }

        this.activeTool?.deactivate();
        this.activeTool = tool;
        this.activeTool.activate(this.context);
    }

    public deactivateCurrent(): void {
        this.activeTool?.deactivate();
        this.activeTool = undefined;
    }

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

    public onPointerDown(event: ToolPointerEvent): void {
        this.activeTool?.onPointerDown(event);
    }

    public onPointerMove(event: ToolPointerEvent): void {
        this.activeTool?.onPointerMove(event);
    }

    public onPointerUp(event: ToolPointerEvent): void {
        this.activeTool?.onPointerUp(event);

        if (this.dispatchReference && this.context) {
            try {
                const toolId = this.activeTool?.getId();
                if (toolId === "split-wall") {
                    return;
                }

                const doc = this.context.getDocument?.() || (this.context as any).drawingDocument;
                if (doc) {
                    let activeSelection: any = null;

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
        this.activeTool?.onDoubleClick(event);
    }

    public onKeyDown(event: KeyboardEvent): void {
        this.activeTool?.onKeyDown(event);
    }

    public onKeyUp(event: KeyboardEvent): void {
        this.activeTool?.onKeyUp(event);
    }

    public cancelCurrentTool(): void {
        this.activeTool?.cancel();
    }

    public renderOverlay(
        context: CanvasRenderingContext2D,
        opts?: { viewport?: any; document?: any }
    ): void {
        // Forward viewport/document to the active tool so its renderOverlay
        // can project world → screen. Without this, tools that guard on
        // `if (!viewport) return` will silently bail.
        if (this.activeTool) {
            if (opts?.viewport) (this.activeTool as any).viewport = opts.viewport;
            if (opts?.document) (this.activeTool as any).__document = opts.document;
        }
        this.activeTool?.renderOverlay(context);
    }
}

export default ToolManager;