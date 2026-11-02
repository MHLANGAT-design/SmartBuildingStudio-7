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

  /**
   * Build the frame geometry for a window.
   * Option D: the click face is the inner edge; the frame extends into the
   * wall toward the opposite face.
   *
   *   wallSide = sign of the signed perpendicular distance from the wall
   *              centerline to the click point. Negative or positive tells
   *              us which face the user clicked on.
   *   atOffset(from, t) = from + wallSide * t * wallNormal
   *              t = 0            → click face
   *              t = thickness    → opposite face
   */
  private buildFrameGeometry(startPt: Point2D, endPt: Point2D): {
    c1: Point2D; c2: Point2D; c3: Point2D; c4: Point2D;
    p1a: Point2D; p1b: Point2D;
    p2a: Point2D; p2b: Point2D;
    p3a: Point2D; p3b: Point2D;
    jambA1: Point2D; jambA2: Point2D;
    jambB1: Point2D; jambB2: Point2D;
  } {
    const PLAN_WALL_THICKNESS = 200;

    // Wall axis — prefer snapped wall geometry; fall back to click pair direction.
    let axisX = 1, axisY = 0;
    if (this.activeWallStart && this.activeWallEnd) {
      const wx = this.activeWallEnd.x - this.activeWallStart.x;
      const wy = this.activeWallEnd.y - this.activeWallStart.y;
      const wlen = Math.hypot(wx, wy);
      if (wlen > 1e-9) { axisX = wx / wlen; axisY = wy / wlen; }
    } else {
      const a = Math.atan2(endPt.y - startPt.y, endPt.x - startPt.x);
      axisX = Math.cos(a); axisY = Math.sin(a);
    }

    // Wall normal (unit perpendicular, CCW from axis).
    const normalX = -axisY;
    const normalY = axisX;

    // Which side did the user click on?
    let wallSide = 1;
    if (this.activeWallStart && this.activeWallEnd) {
      const signedPerp =
        (startPt.x - this.activeWallStart.x) * normalX +
        (startPt.y - this.activeWallStart.y) * normalY;
      wallSide = signedPerp >= 0 ? 1 : -1;
    }

    const atOffset = (from: Point2D, t: number): Point2D => ({
      x: from.x + wallSide * normalX * t,
      y: from.y + wallSide * normalY * t,
    });

    const c1 = atOffset(startPt, 0);
    const c2 = atOffset(endPt, 0);
    const c3 = atOffset(endPt, PLAN_WALL_THICKNESS);
    const c4 = atOffset(startPt, PLAN_WALL_THICKNESS);

    const p1a = atOffset(startPt, PLAN_WALL_THICKNESS * 0.25);
    const p1b = atOffset(endPt, PLAN_WALL_THICKNESS * 0.25);
    const p2a = atOffset(startPt, PLAN_WALL_THICKNESS * 0.50);
    const p2b = atOffset(endPt, PLAN_WALL_THICKNESS * 0.50);
    const p3a = atOffset(startPt, PLAN_WALL_THICKNESS * 0.75);
    const p3b = atOffset(endPt, PLAN_WALL_THICKNESS * 0.75);

    const jambA1 = atOffset(startPt, 0);
    const jambA2 = atOffset(startPt, PLAN_WALL_THICKNESS);
    const jambB1 = atOffset(endPt, 0);
    const jambB2 = atOffset(endPt, PLAN_WALL_THICKNESS);

    return { c1, c2, c3, c4, p1a, p1b, p2a, p2b, p3a, p3b, jambA1, jambA2, jambB1, jambB2 };
  }

  private commitWindowPlacement(finalPoint: Point2D, activeHostId: string): void {
    if (!this.startPoint || this.isProcessingCompletion) return;
    this.isProcessingCompletion = true;

    const sx = this.startPoint.x;
    const sy = this.startPoint.y;
    const ex = finalPoint.x;
    const ey = finalPoint.y;

    const windowModel = WindowFactory.create({ position: this.startPoint, endPosition: finalPoint, wallId: activeHostId });

    const { c1, c2, c3, c4, p1a, p1b, p2a, p2b, p3a, p3b, jambA1, jambA2, jambB1, jambB2 } =
      this.buildFrameGeometry(this.startPoint, finalPoint);

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

      // Composite element — points[0] and points[1] are on the click face.
      const compositeWindowElement = {
        id: assignedWindowId,
        type: "window",
        composite: true,
        points: [c1, c2],
        geometry: {
          startX: sx, startY: sy, endX: ex, endY: ey,
          width: Math.hypot(ex - sx, ey - sy),
          wallThickness: 200,
          // Inner face (click face)
          innerStart: c1,
          innerEnd: c2,
          // Outer face (opposite)
          outerStart: c4,
          outerEnd: c3,
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
      // Mirror the commit geometry for the preview: build the same frame
      // using currentPoint as the prospective end point, then convert to
      // screen coordinates.
      const { c1, c2, c3, c4, p2a, p2b } = this.buildFrameGeometry(this.startPoint, this.currentPoint);

      const sC1 = activeViewport.worldToScreen(c1);
      const sC2 = activeViewport.worldToScreen(c2);
      const sC3 = activeViewport.worldToScreen(c3);
      const sC4 = activeViewport.worldToScreen(c4);
      const sM1 = activeViewport.worldToScreen(p2a);
      const sM2 = activeViewport.worldToScreen(p2b);

      context.save();
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.lineWidth = 1.5;
      context.strokeStyle = "#38BDF8";

      // Frame rectangle
      context.beginPath();
      context.moveTo(sC1.x, sC1.y);
      context.lineTo(sC2.x, sC2.y);
      context.lineTo(sC3.x, sC3.y);
      context.lineTo(sC4.x, sC4.y);
      context.closePath();
      context.stroke();

      // Midline
      context.beginPath();
      context.moveTo(sM1.x, sM1.y);
      context.lineTo(sM2.x, sM2.y);
      context.stroke();

      // Emphasize inner face (click face) with thicker line
      context.lineWidth = 2.5;
      context.beginPath();
      context.moveTo(sC1.x, sC1.y);
      context.lineTo(sC2.x, sC2.y);
      context.stroke();

      context.restore();
    }
  }
}

export default WindowTool;