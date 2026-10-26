// src/modules/FloorPlanDesigner/Tools/WindowZoomTool.ts
import { ITool, ToolPointerEvent } from "@/modules/FloorPlanDesigner/Tools/Base/ITool";
import { ToolContext } from "@/modules/FloorPlanDesigner/Tools/Base/ToolContext";

export class WindowZoomTool implements ITool {
    private context?: ToolContext;
    private startX = 0;
    private startY = 0;
    private isDragging = false;

    getId(): string {
        return "window";
    }

    activate(context: ToolContext): void {
        this.context = context;
        // Optionally change cursor
        document.body.style.cursor = "crosshair";
        console.log("[WindowZoomTool] Activated");
    }

    deactivate(): void {
        document.body.style.cursor = "default";
        this.isDragging = false;
        console.log("[WindowZoomTool] Deactivated");
    }

    onPointerDown(event: ToolPointerEvent): void {
        const viewport = this.context?.getViewport?.();
        if (!viewport) return;
        const world = viewport.screenToWorld({ x: event.x, y: event.y });
        this.startX = world.x;
        this.startY = world.y;
        this.isDragging = true;
    }

    onPointerMove(event: ToolPointerEvent): void {
        // Optional: draw a rubber-band rectangle overlay
        // You can implement a temporary overlay via the context's canvas
        // For simplicity, we'll skip drawing.
    }

    onPointerUp(event: ToolPointerEvent): void {
        if (!this.isDragging) return;
        this.isDragging = false;
        const viewport = this.context?.getViewport?.();
        if (!viewport) return;
        const endWorld = viewport.screenToWorld({ x: event.x, y: event.y });
        const minX = Math.min(this.startX, endWorld.x);
        const maxX = Math.max(this.startX, endWorld.x);
        const minY = Math.min(this.startY, endWorld.y);
        const maxY = Math.max(this.startY, endWorld.y);

        // Only zoom if the rectangle has some area
        if (maxX - minX > 1e-6 && maxY - minY > 1e-6) {
            viewport.zoomExtents({ minX, maxX, minY, maxY });
        }
        // Optionally deactivate the tool after zooming
        // this.context?.getToolManager()?.deactivateCurrent();
    }

    // Other required methods – we can leave empty
    onDoubleClick(_event: ToolPointerEvent): void {}
    onKeyDown(_event: KeyboardEvent): void {}
    onKeyUp(_event: KeyboardEvent): void {}
    cancel(): void { this.isDragging = false; }
    renderOverlay(_ctx: CanvasRenderingContext2D): void {}
}