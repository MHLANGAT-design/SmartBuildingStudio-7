import { BaseTool } from "@/modules/FloorPlanDesigner/Tools/Base/BaseTool";
import { ToolPointerEvent } from "@/modules/FloorPlanDesigner/Tools/Base/ITool";
import { Selection } from "@/modules/FloorPlanDesigner/Models/Selection";
import { Point2D } from "@/modules/FloorPlanDesigner/Models/Base/Geometry";
import { store } from "@/Application/ConfigureStore";
import { SnapService } from "@/modules/FloorPlanDesigner/Utils/SnapService";

export class SelectTool extends BaseTool {
    public static readonly ID = "select";
    private readonly selection: Selection;
    private dragging = false;

    // Marquee box point coordinates tracking states
    private dragStartPoint?: Point2D;
    private dragCurrentPoint?: Point2D;

    // 🚀 VISUAL FEEDBACK HOVER STATE: Real-time cursor snapping and crosshair tracks
    private mouseHoverPoint?: Point2D;
    private currentSnapType: "endpoint" | "midpoint" | null = null;

    constructor(selection: Selection) {
        super();
        this.selection = selection || { clear: () => {}, items: [] };
    }

    public getId(): string { return SelectTool.ID; }
    public getName(): string { return "Select"; }

    protected override onActivate(): void {
        this.setCursor("default");
        this.setStatus("Click element (Point Snap) or drag bounding box (Window Marquee) to inspect parameter metrics.");
        this.clearDragLocalState();
    }

    private clearDragLocalState(): void {
        this.dragging = false;
        this.dragStartPoint = undefined;
        this.dragCurrentPoint = undefined;
        this.mouseHoverPoint = undefined;
        this.currentSnapType = null;
    }

    public override onPointerDown(event: ToolPointerEvent): void {
        if (event.button === 2 || (event.originalEvent as MouseEvent)?.button === 2) return;

        this.dragging = true;
        this.dragStartPoint = { x: event.worldX, y: event.worldY };
        this.dragCurrentPoint = { x: event.worldX, y: event.worldY };

        if (this.selection && typeof this.selection.clear === "function") {
            this.selection.clear();
        }
        this.requestRender();
    }

    public override onPointerMove(event: ToolPointerEvent): void {
        const activeViewport = (this as any).viewport || (this as any).context?.viewport || (this as any).context?.getViewport?.();
        if (!activeViewport) return;

        // 🚀 LIVE COORDINATE CAPTURE: Continuously calculates snapping lookup frames while moving
        const snapResult = SnapService.getSnappedPoint(
            event.screenX, event.screenY, event.worldX, event.worldY, activeViewport
        );

        this.mouseHoverPoint = snapResult.point;
        this.currentSnapType = snapResult.type;

        if (this.dragging) {
            this.dragCurrentPoint = { x: event.worldX, y: event.worldY };
        }
        this.requestRender();
    }

    public override onPointerUp(event: ToolPointerEvent): void {
        if (!this.dragging || !this.dragStartPoint) return;

        const activeViewport = (this as any).viewport || (this as any).context?.viewport || (this as any).context?.getViewport?.();
        if (!activeViewport) {
            this.clearDragLocalState();
            return;
        }

        const dx = event.worldX - this.dragStartPoint.x;
        const dy = event.worldY - this.dragStartPoint.y;
        const totalDeltaDistance = Math.hypot(dx, dy);

        const activeState = store.getState().floorPlan || (store.getState() as any).FloorPlan;
        const innerSlice = activeState?.activeFloorPlan || activeState || {};
        let targetPayloadElement: any = null;

        // 🎯 1. POINT SELECTION INTERCEPT ENGINE (Click Action)
        if (totalDeltaDistance < 5) {
            const snapResult = SnapService.getSnappedPoint(
                event.screenX, event.screenY, event.worldX, event.worldY, activeViewport
            );

            const windows = innerSlice.windows || (window as any).__floorPlanActiveDocumentInstance?.customDrawnWindows || [];
            targetPayloadElement = windows.find((w: any) => snapResult.wallId && w.wallId === snapResult.wallId);

            if (!targetPayloadElement) {
                const doors = innerSlice.doors || (window as any).__floorPlanActiveDocumentInstance?.customDrawnDoors || [];
                targetPayloadElement = doors.find((d: any) => snapResult.wallId && d.wallId === snapResult.wallId);
            }

            if (!targetPayloadElement && snapResult.wallId) {
                const walls = innerSlice.walls || (window as any).__floorPlanActiveDocumentInstance?.customDrawnWalls || [];
                targetPayloadElement = walls.find((w: any) => w.id === snapResult.wallId);
            }

            if (!targetPayloadElement) {
                const rooms = innerSlice.rooms || (window as any).__floorPlanActiveDocumentInstance?.rooms || [];
                targetPayloadElement = rooms[rooms.length - 1] || null;
            }
        } 
        // 🔲 2. WINDOW SELECTION INTERCEPT ENGINE (Drag Frame Marquee Box)
        else {
            const minX = Math.min(this.dragStartPoint.x, event.worldX);
            const maxX = Math.max(this.dragStartPoint.x, event.worldX);
            const minY = Math.min(this.dragStartPoint.y, event.worldY);
            const maxY = Math.max(this.dragStartPoint.y, event.worldY);

            const rooms = innerSlice.rooms || (window as any).__floorPlanActiveDocumentInstance?.rooms || [];
            targetPayloadElement = rooms.find((room: any) => {
                if (!room.vertices || room.vertices.length === 0) return false;
                const rootVertex = room.vertices[0]; 
                return rootVertex.x >= minX && rootVertex.x <= maxX && rootVertex.y >= minY && rootVertex.y <= maxY;
            });
        }

        if (targetPayloadElement) {
            store.dispatch({
                type: "floorPlan/setSelection",
                payload: targetPayloadElement
            });
        } else {
            store.dispatch({ type: "floorPlan/clearSelection" });
        }

        this.clearDragLocalState();
        this.requestRender();

        window.dispatchEvent(new CustomEvent("sbs:canvas-update"));
        window.dispatchEvent(new CustomEvent("canvas-invalidate"));
    }

    public override onKeyDown(event: KeyboardEvent): void {
        if (event.key === "Escape") {
            this.cancel();
        }
    }

    public override cancel(): void {
        this.clearDragLocalState();
        if (this.selection && typeof this.selection.clear === "function") {
            this.selection.clear();
        }
        this.requestRender();
    }

    // 🚀 ENGINE CANVAS GRAPHICS LAYER RE-RENDER PASS
    public override renderOverlay(context: CanvasRenderingContext2D): void {
        const activeViewport = (this as any).viewport || (this as any).context?.viewport || (this as any).context?.getViewport?.();
        if (!activeViewport || typeof activeViewport.worldToScreen !== "function") return;

        context.save();
        context.setTransform(1, 0, 0, 1, 0, 0);

        // 1. 🔲 WINDOW DRAG SELECTION MARQUEE RENDER LOOP
        if (this.dragging && this.dragStartPoint && this.dragCurrentPoint) {
            const screenStart = activeViewport.worldToScreen(this.dragStartPoint);
            const screenCurrent = activeViewport.worldToScreen(this.dragCurrentPoint);

            const width = screenCurrent.x - screenStart.x;
            const height = screenCurrent.y - screenStart.y;

            context.lineWidth = 1;
            context.strokeStyle = "rgba(5, 255, 196, 0.8)"; // Neon Cyan boundary wireframe
            context.fillStyle = "rgba(5, 255, 196, 0.05)";  // Translucent window core fill
            context.fillRect(screenStart.x, screenStart.y, width, height);
            context.strokeRect(screenStart.x, screenStart.y, width, height);
        }

        // 2. 🎯 LIVE POINT SNAP INDICATOR & CROSSHAIRS HOVER TRACK
        if (!this.dragging && this.mouseHoverPoint) {
            const screenHover = activeViewport.worldToScreen(this.mouseHoverPoint);

            // Paint standard CAD crosshairs alignment guide lines trailing the cursor point
            context.lineWidth = 0.5;
            context.strokeStyle = "rgba(255, 255, 255, 0.15)";
            
            // Horizontal line
            context.beginPath(); context.moveTo(0, screenHover.y); context.lineTo(context.canvas.width, screenHover.y); context.stroke();
            // Vertical line
            context.beginPath(); context.moveTo(screenHover.x, 0); context.lineTo(screenHover.x, context.canvas.height); context.stroke();

            // If hovering close enough to an object vertex anchor point, trigger SnapService graphics rendering
            if (this.currentSnapType) {
                SnapService.renderSnapIndicator(context, this.mouseHoverPoint, this.currentSnapType, activeViewport);
            } else {
                // Default floating point pointer tracking reticle target circle
                context.lineWidth = 1;
                context.strokeStyle = "rgba(5, 255, 196, 0.4)";
                context.beginPath();
                context.arc(screenHover.x, screenHover.y, 4, 0, Math.PI * 2);
                context.stroke();
            }
        }

        context.restore();
    }
}

export default SelectTool;
