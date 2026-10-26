// WallTool.ts
// COMPLETE INTEGRATED FILE — Replace everything

import { BaseTool } from "@/modules/FloorPlanDesigner/Tools/Base/BaseTool";
import { ToolPointerEvent } from "@/modules/FloorPlanDesigner/Tools/Base/ITool";
import { Point2D } from "@/modules/FloorPlanDesigner/Models/Base/Geometry";
import { SnapService } from "@/modules/FloorPlanDesigner/Utils/SnapService";
import { AddWallCommand } from "@/modules/FloorPlanDesigner/Commands/AddWallCommand";
import { store } from "@/Application/ConfigureStore";
import { markDirty, setDocument, setSelection } from "@/modules/FloorPlanDesigner/Store/FloorPlanSlice";
import React from "react";

export class WallTool extends BaseTool {
    public static readonly ID = "wall";
    private readonly vertices: Point2D[] = [];
    private currentPoint?: Point2D;
    private mouseHoverPoint?: Point2D;
    private currentSnapType: "endpoint" | "midpoint" | null = null;
    private isProcessingCompletion = false;

    public getId(): string { return WallTool.ID; }
    public getName(): string { return "Wall"; }

    protected override onActivate(): void {
        this.setCursor("crosshair");
        this.setStatus("Click corners. Double-click to instantly complete shape and auto-open Wall Inspector. Esc to cancel.");
        this.clearLocalState();
        this.applyInitialSnap(this);
    }

    protected override onDeactivate(): void {
        this.clearLocalState();
    }

    private clearLocalState(): void {
        this.vertices.length = 0;
        this.currentPoint = undefined;
        this.mouseHoverPoint = undefined;
        this.currentSnapType = null;
        this.isProcessingCompletion = false;
    }

    /**
     * Find the next WALL_SEG_<N> number by scanning the actual pool
     * the new wall will be written into. Imported walls have ids like
     * "py_ent_0" and their `name` is not set by buildWall, so the
     * regex only matches labels written by this tool. Room border
     * walls also lack a WALL_SEG name and are ignored.
     *
     * This is immune to: imports shifting the pool size, deleted walls
     * leaving gaps, and multiple drawings in one session. The highest
     * live number is found and the next one is used.
     */
    private getNextWallNumber(existingWalls: any[]): number {
        const maxNum = existingWalls.reduce((max: number, w: any) => {
            const m = String(w?.name ?? "").match(/WALL_SEG_(\d+)/);
            return m ? Math.max(max, parseInt(m[1], 10)) : max;
        }, 0);
        return maxNum + 1;
    }

    public override onPointerDown(event: ToolPointerEvent): void {
        if (this.isProcessingCompletion) return;
        if (event.button === 2 || (event.originalEvent as MouseEvent)?.button === 2) {
            this.cancel();
            window.dispatchEvent(new CustomEvent("sbs:tool-change", { detail: { id: "select" } }));
            return;
        }

        const activeViewport = (this as any).viewport || (this as any).context?.viewport;
        if (!activeViewport) return;

        const snapResult = SnapService.getSnappedPoint(event.screenX, event.screenY, event.worldX, event.worldY, activeViewport);
        this.vertices.push({ x: snapResult.point.x, y: snapResult.point.y });
        this.currentPoint = { x: snapResult.point.x, y: snapResult.point.y };
        this.requestRender();
    }

    public override onPointerMove(event: ToolPointerEvent): void {
        if (this.isProcessingCompletion) return;
        const activeViewport = (this as any).viewport || (this as any).context?.viewport;
        if (!activeViewport) return;

        const snapResult = SnapService.getSnappedPoint(event.screenX, event.screenY, event.worldX, event.worldY, activeViewport);
        this.mouseHoverPoint = snapResult.point;
        this.currentSnapType = snapResult.type;
        this.currentPoint = snapResult.point;
        this.requestRender();
    }

    public override onDoubleClick(event: ToolPointerEvent): void {
        if (this.isProcessingCompletion) return;
        this.isProcessingCompletion = true;

        if (event.originalEvent) {
            try {
                event.originalEvent.preventDefault();
                event.originalEvent.stopPropagation();
            } catch (e) {}
        }

        const filteredVertices = this.vertices.filter((v, i, arr) =>
            i === 0 || v.x !== arr[i-1].x || v.y !== arr[i-1].y
        );

        if (filteredVertices.length < 2) {
            this.isProcessingCompletion = false;
            this.cancel();
            return;
        }

        const startX = filteredVertices[0]?.x ?? 0;
        const startY = filteredVertices[0]?.y ?? 0;
        const endX = filteredVertices[filteredVertices.length - 1]?.x ?? 0;
        const endY = filteredVertices[filteredVertices.length - 1]?.y ?? 0;

        try {
            const currentState = store.getState();
            const currentDocument = currentState.floorPlan?.document || {};
            const existingWalls = currentDocument.walls || [];
            const existingElements = Array.isArray(currentDocument.elements)
                ? currentDocument.elements
                : [];

            // Read the numbering pool from the pool we actually write
            // into. document.walls is the source of truth for user-drawn
            // walls; the label scan filters out imported walls and room
            // borders by regex.
            const nextWallNum = this.getNextWallNumber(existingWalls);

            // Random id — guaranteed unique, no scan needed.
            const generatedWallId = `wall-hash-${Date.now()}-${Math.random()}`;
            const wallLabel = `WALL_SEG_${String(nextWallNum).padStart(2, "0")}`;

            const wallTracePayload = {
                id: generatedWallId,
                Id: generatedWallId,
                type: "Wall",
                name: wallLabel,
                thickness: 300,
                height: 2800,
                material: "Concrete",
                startX, startY, endX, endY,
                start: { x: startX, y: startY },
                end: { x: endX, y: endY },
                vertices: [...filteredVertices]
            };

            // Element emission — one straight segment per wall so the
            // render path draws it through document.elements alongside
            // imported geometry. The element id matches the semantic id.
            const wallElement = {
                id: generatedWallId,
                type: "wall",
                points: [
                    { x: startX, y: startY },
                    { x: endX, y: endY },
                ],
                layer: "WALLS",
                thickness: 300,
                height: 2800,
                material: "Concrete",
            };

            const updatedWalls = [...existingWalls, wallTracePayload];

            const elementAlreadyPresent = existingElements.some(
                (e: any) => String(e?.id ?? e?.Id ?? "") === generatedWallId
            );
            const updatedElements = elementAlreadyPresent
                ? existingElements
                : [...existingElements, wallElement];

            store.dispatch(setDocument({
                ...currentDocument,
                walls: updatedWalls,
                elements: updatedElements,
            }));
            store.dispatch(markDirty());
            store.dispatch(setSelection(wallTracePayload));

            const globalDocInstance = (window as any).__floorPlanActiveDocumentInstance;
            if (globalDocInstance) {
                globalDocInstance.customDrawnWalls = updatedWalls.filter((w: any) => !w.isRoomBorder);
                globalDocInstance.walls = updatedWalls;
                globalDocInstance._walls = updatedWalls;
                globalDocInstance.elements = updatedElements;
            }

            const activeContextContainer = (this as any).context || this;
            const command = new AddWallCommand(generatedWallId, wallTracePayload, activeContextContainer);
            (this.getCommandManager() as any).execute(command);

            window.dispatchEvent(new CustomEvent("sbs:canvas-update"));
            window.dispatchEvent(new CustomEvent("canvas-invalidate"));
        } catch (e) {
            console.warn("[WallTool Exception Handler]:", e);
        }

        setTimeout(() => {
            this.clearLocalState();
            this.requestRender();
        }, 50);
    }

    public override cancel(): void {
        this.clearLocalState();
        this.requestRender();
    }

    public override renderOverlay(context: CanvasRenderingContext2D): void {
        const activeViewport = (this as any).viewport || (this as any).context?.viewport;
        if (!activeViewport || typeof activeViewport.worldToScreen !== "function") return;

        context.save();
        context.setTransform(1, 0, 0, 1, 0, 0);

        const globalDoc = (window as any).__floorPlanActiveDocumentInstance;
        const persistentWalls = globalDoc?.walls || [];
        const activeSelection = store.getState().floorPlan?.selection;

        for (const item of persistentWalls) {
            if (!item) continue;
            const itemStart = item.start || { x: item.startX, y: item.startY };
            const itemEnd = item.end || { x: item.endX, y: item.endY };

            const isItemSelected = activeSelection && String(activeSelection.id) === String(item.id);
            context.beginPath();
            context.lineWidth = isItemSelected ? 5 : 2;
            context.strokeStyle = isItemSelected ? "#38BDF8" : "rgba(226, 232, 240, 0.4)";

            const screenStart = activeViewport.worldToScreen(itemStart);
            const screenEnd = activeViewport.worldToScreen(itemEnd);
            context.moveTo(screenStart.x, screenStart.y);
            context.lineTo(screenEnd.x, screenEnd.y);
            context.stroke();
        }

        if (this.mouseHoverPoint && this.currentSnapType) {
            SnapService.renderSnapIndicator(context, this.mouseHoverPoint, this.currentSnapType, activeViewport);
        }

        if (this.vertices.length > 0) {
            context.beginPath();
            context.strokeStyle = "#FFB800";
            context.lineWidth = 2;
            const screenStart = activeViewport.worldToScreen(this.vertices[0]);
            context.moveTo(screenStart.x, screenStart.y);
            for (let i = 1; i < this.vertices.length; i++) {
                const screenPt = activeViewport.worldToScreen(this.vertices[i]);
                context.lineTo(screenPt.x, screenPt.y);
            }
            if (this.currentPoint && !this.isProcessingCompletion) {
                const screenCurrent = activeViewport.worldToScreen(this.currentPoint);
                context.lineTo(screenCurrent.x, screenCurrent.y);
            }
            context.stroke();
        }
        context.restore();
    }
}
export default WallTool;