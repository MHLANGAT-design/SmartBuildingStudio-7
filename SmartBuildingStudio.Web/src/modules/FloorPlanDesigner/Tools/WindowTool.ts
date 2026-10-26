// src/modules/FloorPlanDesigner/Tools/WindowTool.ts
import { BaseTool } from "@/modules/FloorPlanDesigner/Tools/Base/BaseTool";
import { ToolPointerEvent } from "@/modules/FloorPlanDesigner/Tools/Base/ITool";
import { Point2D } from "@/modules/FloorPlanDesigner/Models/Base/Geometry";
import { SnapService } from "@/modules/FloorPlanDesigner/Utils/SnapService";
import { AddWindowCommand } from "@/modules/FloorPlanDesigner/Commands/AddWindowCommand";
import { WindowFactory } from "@/modules/FloorPlanDesigner/Factories/WindowFactory";
import { store } from "@/Application/ConfigureStore";
import { markDirty, setDocument, setSelection } from "@/modules/FloorPlanDesigner/Store/FloorPlanSlice";

export class WindowTool extends BaseTool {
  public static readonly ID = "window";
  private startPoint?: Point2D;
  private currentPoint?: Point2D;
  private hoveredWallId?: string;
  private mouseHoverPoint?: Point2D;
  private currentSnapType: "endpoint" | "midpoint" | null = null;
  private activeWallStart?: Point2D;
  private activeWallEnd?: Point2D;
  private isProcessingCompletion = false;

  public getId(): string { return WindowTool.ID; }
  public getName(): string { return "Window"; }

  protected override onActivate(): void {
    this.setCursor("cell");
    this.setStatus("Click 1: Set window start. Click 2: Place.");
    this.clearLocalToolState();
  }

  protected override onDeactivate(): void {
    this.clearLocalToolState();
  }

  private clearLocalToolState(): void {
    this.startPoint = undefined;
    this.currentPoint = undefined;
    this.hoveredWallId = undefined;
    this.mouseHoverPoint = undefined;
    this.currentSnapType = null;
    this.activeWallStart = undefined;
    this.activeWallEnd = undefined;
    this.isProcessingCompletion = false;
  }

  private getNextWindowNumber(existingWindows: any[]): number {
    const maxNum = existingWindows.reduce((max: number, w: any) => {
      const m = String(w?.id ?? "").match(/^WINDOW_(\d+)$/);
      return m ? Math.max(max, parseInt(m[1], 10)) : max;
    }, 0);
    return maxNum + 1;
  }

  public override onPointerMove(event: ToolPointerEvent): void {
    if (this.isProcessingCompletion) return;
    const activeViewport = (this as any).viewport || (this as any).context?.viewport;
    if (!activeViewport) return;

    const snapResult = SnapService.getSnappedPoint(event.screenX, event.screenY, event.worldX, event.worldY, activeViewport);
    this.mouseHoverPoint = snapResult.point;
    this.hoveredWallId = snapResult.wallId;
    this.currentSnapType = snapResult.type;
    this.activeWallStart = snapResult.wallStart;
    this.activeWallEnd = snapResult.wallEnd;
    this.currentPoint = snapResult.point;
    this.requestRender();
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
    const activeHostId = snapResult.wallId || this.hoveredWallId || "dwg-wall-root";

    if (!this.startPoint) {
      this.startPoint = { x: snapResult.point.x, y: snapResult.point.y };
      this.currentPoint = { x: snapResult.point.x, y: snapResult.point.y };
      this.requestRender();
      return;
    }
    this.commitWindowPlacement(snapResult.point, activeHostId);
  }

  public override onDoubleClick(event: ToolPointerEvent): void {
    if (this.isProcessingCompletion) return;
    if (event.originalEvent) {
      try {
        event.originalEvent.preventDefault();
        event.originalEvent.stopPropagation();
      } catch (e) {}
    }
    if (!this.startPoint) return;
    const activeViewport = (this as any).viewport || (this as any).context?.viewport;
    if (!activeViewport) return;

    const snapResult = SnapService.getSnappedPoint(event.screenX, event.screenY, event.worldX, event.worldY, activeViewport);
    const activeHostId = snapResult.wallId || this.hoveredWallId || "dwg-wall-root";
    this.commitWindowPlacement(snapResult.point, activeHostId);
  }

  private commitWindowPlacement(finalPoint: Point2D, activeHostId: string): void {
    if (!this.startPoint || this.isProcessingCompletion) return;
    this.isProcessingCompletion = true;

    const sx = this.startPoint.x;
    const sy = this.startPoint.y;
    const ex = finalPoint.x;
    const ey = finalPoint.y;

    const windowModel = WindowFactory.create({ position: this.startPoint, endPosition: finalPoint, wallId: activeHostId });

    const PLAN_WALL_THICKNESS = 200;
    const halfT = PLAN_WALL_THICKNESS / 2;

    const axisAngle = Math.atan2(ey - sy, ex - sx);
    const perpX = -Math.sin(axisAngle);
    const perpY = Math.cos(axisAngle);

    const atOffset = (from: Point2D, offset: number) => ({
      x: from.x + perpX * offset,
      y: from.y + perpY * offset,
    });

    const startPt: Point2D = { x: sx, y: sy };
    const endPt: Point2D = { x: ex, y: ey };

    const c1 = atOffset(startPt, +halfT);
    const c2 = atOffset(endPt, +halfT);
    const c3 = atOffset(endPt, -halfT);
    const c4 = atOffset(startPt, -halfT);

    const p1a = atOffset(startPt, +halfT / 2);
    const p1b = atOffset(endPt, +halfT / 2);
    const p2a = startPt;
    const p2b = endPt;
    const p3a = atOffset(startPt, -halfT / 2);
    const p3b = atOffset(endPt, -halfT / 2);

    const jambA1 = atOffset(startPt, -halfT);
    const jambA2 = atOffset(startPt, +halfT);
    const jambB1 = atOffset(endPt, -halfT);
    const jambB2 = atOffset(endPt, +halfT);

    try {
      const currentState = store.getState();
      const currentDocument = currentState.floorPlan?.document || {};
      const existingWindows = currentDocument.windows || [];
      const existingElements = Array.isArray(currentDocument.elements) ? currentDocument.elements : [];

      const nextWindowNum = this.getNextWindowNumber(existingWindows);
      const assignedWindowId = `WINDOW_${String(nextWindowNum).padStart(2, "0")}`;
      (windowModel as any).id = assignedWindowId;

      const windowTraceItem = {
        id: assignedWindowId,
        Id: assignedWindowId,
        type: "Window",
        name: assignedWindowId,
        width: 1200,
        vlt: 0.70,
        startX: sx, startY: sy, endX: ex, endY: ey,
        start: { x: sx, y: sy }, end: { x: ex, y: ey },
        wallId: activeHostId,
        wallStart: this.activeWallStart ? { ...this.activeWallStart } : undefined,
        wallEnd: this.activeWallEnd ? { ...this.activeWallEnd } : undefined
      };

      // ─── COMPOSITE ELEMENT (For Topology) ───
      const compositeWindowElement = {
        id: assignedWindowId,
        type: "window",
        composite: true,
        points: [{ x: sx, y: sy }, { x: ex, y: ey }],
        geometry: {
          startX: sx, startY: sy, endX: ex, endY: ey,
          width: Math.hypot(ex - sx, ey - sy)
        },
        primitives: [
          { kind: "polyline", points: [c1, c2, c3, c4, c1] },
          { kind: "line", points: [p1a, p1b] },
          { kind: "line", points: [p2a, p2b] },
          { kind: "line", points: [p3a, p3b] },
          { kind: "line", points: [jambA1, jambA2] },
          { kind: "line", points: [jambB1, jambB2] }
        ],
        layer: "WINDOWS",
        originalLayer: "WINDOWS"
      };

      // ─── RAW FRAGMENTS (For Renderer) ───
      const windowElements = [
        { id: `${assignedWindowId}_frame`, groupId: assignedWindowId, type: "window", subType: "frame", points: [c1, c2, c3, c4, c1], layer: "WINDOWS", isClosed: true },
        { id: `${assignedWindowId}_pane1`, groupId: assignedWindowId, type: "window", subType: "pane", points: [p1a, p1b], layer: "WINDOWS" },
        { id: `${assignedWindowId}_pane2`, groupId: assignedWindowId, type: "window", subType: "pane", points: [p2a, p2b], layer: "WINDOWS" },
        { id: `${assignedWindowId}_pane3`, groupId: assignedWindowId, type: "window", subType: "pane", points: [p3a, p3b], layer: "WINDOWS" },
        { id: `${assignedWindowId}_jambA`, groupId: assignedWindowId, type: "window", subType: "jamb", points: [jambA1, jambA2], layer: "WINDOWS" },
        { id: `${assignedWindowId}_jambB`, groupId: assignedWindowId, type: "window", subType: "jamb", points: [jambB1, jambB2], layer: "WINDOWS" },
      ];

      const updatedWindows = [...existingWindows, windowTraceItem];

      const elementIds = new Set(existingElements.map((e: any) => String(e?.id ?? "")));
      const elementsToAdd = [compositeWindowElement, ...windowElements].filter(el => !elementIds.has(el.id));
      const updatedElements = [...existingElements, ...elementsToAdd];

      const freshDocumentPayload = JSON.parse(JSON.stringify(currentDocument));
      freshDocumentPayload.windows = updatedWindows;
      freshDocumentPayload.elements = updatedElements;

      store.dispatch(setDocument(freshDocumentPayload));
      store.dispatch(markDirty());
      store.dispatch(setSelection(windowTraceItem));

      const globalDoc = (window as any).__floorPlanActiveDocumentInstance;
      if (globalDoc) {
        globalDoc.windows = updatedWindows;
        globalDoc._windows = updatedWindows;
        globalDoc.elements = updatedElements;
      }

      const command = new AddWindowCommand({ document: this.getDocument(), window: windowModel });
      (this.getCommandManager() as any).execute(command);

      window.dispatchEvent(new CustomEvent("sbs:canvas-update"));
      window.dispatchEvent(new CustomEvent("canvas-invalidate"));
    } catch (e) {
      console.warn("[WindowTool] Failed to commit window entity:", e);
    }

    setTimeout(() => {
      this.clearLocalToolState();
      this.requestRender();
    }, 50);
  }

  public override cancel(): void {
    if (this.isProcessingCompletion) return;
    this.clearLocalToolState();
    this.requestRender();
  }

  public override renderOverlay(context: CanvasRenderingContext2D): void {
    const activeViewport = (this as any).viewport || (this as any).context?.viewport;
    if (!activeViewport || typeof activeViewport.worldToScreen !== "function") return;

    context.save();
    context.setTransform(1, 0, 0, 1, 0, 0);
    if (this.mouseHoverPoint && this.currentSnapType) {
      SnapService.renderSnapIndicator(context, this.mouseHoverPoint, this.currentSnapType, activeViewport);
    }
    context.restore();

    if (this.startPoint && this.currentPoint && !this.isProcessingCompletion) {
      context.save();
      context.setTransform(1, 0, 0, 1, 0, 0);

      const screenS = activeViewport.worldToScreen(this.startPoint);
      const screenE = activeViewport.worldToScreen(this.currentPoint);
      const dx = screenE.x - screenS.x;
      const dy = screenE.y - screenS.y;
      const length = Math.hypot(dx, dy);

      if (length > 2) {
        let angle = Math.atan2(dy, dx);
        if (this.activeWallStart && this.activeWallEnd) {
          const ws = activeViewport.worldToScreen({ x: this.activeWallStart.x, y: this.activeWallStart.y });
          const we = activeViewport.worldToScreen({ x: this.activeWallEnd.x, y: this.activeWallEnd.y });
          angle = Math.atan2(we.y - ws.y, we.x - ws.x);
        }

        context.translate(screenS.x, screenS.y);
        context.rotate(angle);

        const wallThickness = 14;
        context.lineWidth = 1.5;
        context.strokeStyle = "#38BDF8";

        context.strokeRect(0, -wallThickness / 2, length, wallThickness);

        const paneOffset = wallThickness / 4;
        context.beginPath();
        context.moveTo(0, -paneOffset);
        context.lineTo(length, -paneOffset);
        context.moveTo(0, 0);
        context.lineTo(length, 0);
        context.moveTo(0, paneOffset);
        context.lineTo(length, paneOffset);
        context.stroke();

        context.fillStyle = "#38BDF8";
        context.fillRect(0, -wallThickness / 2, 2, wallThickness);
        context.fillRect(length - 2, -wallThickness / 2, 2, wallThickness);
      }
      context.restore();
    }
  }
}

export default WindowTool;