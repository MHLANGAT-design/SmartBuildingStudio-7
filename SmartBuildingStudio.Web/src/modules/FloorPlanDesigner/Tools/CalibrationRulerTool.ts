// src/modules/FloorPlanDesigner/Tools/CalibrationRulerTool.ts
//
// Two-click calibration flow that mirrors MeasurementRulerTool.
//
// Snap policy on BOTH clicks and on every pointer-move during calibration:
//   1. If a document endpoint is within SNAP_RADIUS_PIXELS (screen space)
//      of the cursor, lock to that endpoint.
//   2. Otherwise, lock to the raw world position under the cursor.
//
// Endpoint source: the live document injected by FloorPlanCanvas via
// `__document` each frame. Falls back to the legacy
// `__persistentDwgVectorBackupCache` only if no live document is present.

import { BaseTool } from "@/modules/FloorPlanDesigner/Tools/Base/BaseTool";
import { ToolPointerEvent, MouseButton } from "@/modules/FloorPlanDesigner/Tools/Base/ITool";
import { Point2D } from "@/modules/FloorPlanDesigner/Utils/CoordinateTransforms";

export class CalibrationRulerTool extends BaseTool {
  public static readonly ID = "calibration-ruler";

  private startPoint: Point2D | null = null;
  private currentPoint: Point2D | null = null;
  private isCalibrating = false;

  private readonly SNAP_RADIUS_PIXELS = 20;
  private activeSnapPoint: Point2D | null = null;

  public getId(): string {
    return CalibrationRulerTool.ID;
  }

  public getName(): string {
    return "Calibration Ruler";
  }

  protected override onActivate(): void {
    this.setCursor("crosshair");
    this.setStatus(
      "Click the first calibration point. Endpoints within 20px will snap automatically."
    );
    this.clearState();

    this.safeDispatch({
      type: "floorPlan/setCalibrationPoint",
      payload: { which: "p1", point: null },
    });
    this.safeDispatch({
      type: "floorPlan/setCalibrationPoint",
      payload: { which: "p2", point: null },
    });
    this.safeDispatch({
      type: "floorPlan/setCalibrationDistance",
      payload: { knownDistance: null },
    });

    this.requestRender();
  }

  protected override onDeactivate(): void {
    this.clearState();
    this.requestRender();
  }

  private clearState(): void {
    this.startPoint = null;
    this.currentPoint = null;
    this.isCalibrating = false;
    this.activeSnapPoint = null;
  }

  /**
   * Resolve a pointer position to a world coordinate, preferring document
   * endpoints over raw cursor when one is close enough.
   *
   *   snap present  → return the endpoint, remember it for the overlay
   *   no snap       → return the raw cursor world position, clear the
   *                   remembered snap
   *
   * Single source of truth for "lock to snap if available, else lock to
   * click" — used by both onPointerDown and onPointerMove.
   */
  private resolveAnchor(
    screenX: number,
    screenY: number,
    viewport: any
  ): Point2D {
    const snap = this.findNearestVertex(screenX, screenY, viewport);
    this.activeSnapPoint = snap;
    if (snap) return snap;
    return viewport.screenToWorld({ x: screenX, y: screenY });
  }

  /**
   * Enumerate endpoints from the live document and return the closest
   * one within SNAP_RADIUS_PIXELS (screen space), or null.
   */
  private findNearestVertex(screenX: number, screenY: number, viewport: any): Point2D | null {
    if (!viewport || typeof viewport.worldToScreen !== "function") return null;

    const doc = (this as any).__document;
    const candidates: Point2D[] = [];

    const pushPt = (p: any) => {
      if (p && typeof p.x === "number" && typeof p.y === "number") {
        candidates.push({ x: p.x, y: p.y });
      }
    };

    if (doc) {
      const elements = Array.isArray(doc.elements) ? doc.elements : [];
      for (const el of elements) {
        if (!el) continue;
        if (Array.isArray(el.points)) for (const p of el.points) pushPt(p);
        if (Array.isArray(el.vertices)) for (const p of el.vertices) pushPt(p);
        if (el.start) pushPt(el.start);
        if (el.end) pushPt(el.end);
        if (typeof el.hingeX === "number" && typeof el.hingeY === "number") {
          pushPt({ x: el.hingeX, y: el.hingeY });
        }
      }

      const semanticArrays = [doc.walls, doc.doors, doc.windows];
      for (const arr of semanticArrays) {
        if (!Array.isArray(arr)) continue;
        for (const w of arr) {
          if (!w) continue;
          if (typeof w.startX === "number" && typeof w.startY === "number") {
            pushPt({ x: w.startX, y: w.startY });
          }
          if (typeof w.endX === "number" && typeof w.endY === "number") {
            pushPt({ x: w.endX, y: w.endY });
          }
          if (w.start) pushPt(w.start);
          if (w.end) pushPt(w.end);
          if (typeof w.hingeX === "number" && typeof w.hingeY === "number") {
            pushPt({ x: w.hingeX, y: w.hingeY });
          }
        }
      }
    } else {
      const blueprintVectors = (window as any).__persistentDwgVectorBackupCache || [];
      for (const line of blueprintVectors) {
        if (!line) continue;
        pushPt(line.start || line.Start);
        pushPt(line.end || line.End);
      }
    }

    if (candidates.length === 0) return null;

    let closest: Point2D | null = null;
    let shortest = this.SNAP_RADIUS_PIXELS;

    for (const c of candidates) {
      const screenC = viewport.worldToScreen(c);
      const d = Math.hypot(screenX - screenC.x, screenY - screenC.y);
      if (d < shortest) {
        shortest = d;
        closest = c;
      }
    }

    return closest;
  }

  public override onPointerDown(event: ToolPointerEvent): void {
    const nativeEvent = event.originalEvent as MouseEvent;
    if (nativeEvent.button !== MouseButton.Left) return;

    const activeViewport =
      (this as any).viewport ||
      (this as any).context?.viewport ||
      (this as any).context?.getViewport?.();
    if (!activeViewport) return;

    const resolvedWorldPos = this.resolveAnchor(
      event.screenX,
      event.screenY,
      activeViewport
    );
    const wasSnapped = this.activeSnapPoint !== null;

    if (!this.isCalibrating) {
      // First click — anchor.
      this.isCalibrating = true;
      this.startPoint = resolvedWorldPos;
      this.currentPoint = resolvedWorldPos;

      this.safeDispatch({
        type: "floorPlan/setCalibrationPoint",
        payload: { which: "p1", point: resolvedWorldPos },
      });
      this.safeDispatch({
        type: "floorPlan/setCalibrationPoint",
        payload: { which: "p2", point: null },
      });
      this.safeDispatch({
        type: "floorPlan/setCalibrationDistance",
        payload: { knownDistance: null },
      });

      this.setStatus(
        wasSnapped
          ? "First point SNAPPED to document endpoint. Click the second point."
          : "First point locked to cursor (no endpoint nearby). Click the second point."
      );
    } else {
      // Second click — finalize.
      this.isCalibrating = false;
      this.currentPoint = resolvedWorldPos;

      this.safeDispatch({
        type: "floorPlan/setCalibrationPoint",
        payload: { which: "p2", point: resolvedWorldPos },
      });

      const worldDistance = Math.hypot(
        resolvedWorldPos.x - (this.startPoint as Point2D).x,
        resolvedWorldPos.y - (this.startPoint as Point2D).y
      );

      let pixelDistance = worldDistance;
      try {
        const a = activeViewport.worldToScreen(this.startPoint);
        const b = activeViewport.worldToScreen(resolvedWorldPos);
        if (a && b) pixelDistance = Math.hypot(b.x - a.x, b.y - a.y);
      } catch {
        /* fall back to worldDistance */
      }

      window.dispatchEvent(
        new CustomEvent("sbs:calibration-complete", {
          detail: {
            worldDistance,
            pixelDistance,
            p1: this.startPoint,
            p2: resolvedWorldPos,
          },
        })
      );

      this.setStatus(
        `Calibration vector locked${wasSnapped ? " (snapped)" : ""}. Enter real-world length to finalize.`
      );

      this.startPoint = null;
      this.currentPoint = null;
    }

    this.requestRender();
  }

  public override onPointerMove(event: ToolPointerEvent): void {
    const activeViewport =
      (this as any).viewport ||
      (this as any).context?.viewport ||
      (this as any).context?.getViewport?.();
    if (!activeViewport) return;

    if (this.isCalibrating && this.startPoint) {
      this.currentPoint = this.resolveAnchor(event.screenX, event.screenY, activeViewport);

      this.safeDispatch({
        type: "floorPlan/setCalibrationPoint",
        payload: { which: "p2", point: this.currentPoint },
      });
    } else {
      this.activeSnapPoint = this.findNearestVertex(
        event.screenX,
        event.screenY,
        activeViewport
      );
    }

    this.requestRender();
  }

  public override onKeyDown(event: KeyboardEvent): boolean {
    if (event.key === "Escape") {
      const wasCalibrating = this.isCalibrating;
      this.clearState();

      if (wasCalibrating) {
        this.safeDispatch({
          type: "floorPlan/setCalibrationPoint",
          payload: { which: "p1", point: null },
        });
        this.safeDispatch({
          type: "floorPlan/setCalibrationPoint",
          payload: { which: "p2", point: null },
        });
        this.setStatus("Calibration canceled. Click two new points to calibrate.");
        this.requestRender();
        return true;
      }
    }
    return false;
  }

  public renderOverlay(context: CanvasRenderingContext2D): void {
    const activeViewport =
      (this as any).viewport ||
      (this as any).context?.viewport ||
      (this as any).context?.getViewport?.();
    if (!activeViewport) return;

    if (this.activeSnapPoint) {
      const snapScreen = activeViewport.worldToScreen(this.activeSnapPoint);
      context.save();
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.strokeStyle = "#F59E0B";
      context.lineWidth = 2;
      context.strokeRect(snapScreen.x - 6, snapScreen.y - 6, 12, 12);
      context.restore();
    }

    if (!this.startPoint || !this.currentPoint) return;

    const p1 = activeViewport.worldToScreen(this.startPoint);
    const p2 = activeViewport.worldToScreen(this.currentPoint);

    context.save();
    context.setTransform(1, 0, 0, 1, 0, 0);

    context.strokeStyle = "#F59E0B";
    context.lineWidth = 1.5;
    context.setLineDash([6, 4]);
    context.beginPath();
    context.moveTo(p1.x, p1.y);
    context.lineTo(p2.x, p2.y);
    context.stroke();
    context.setLineDash([]);

    context.fillStyle = "#F59E0B";
    context.beginPath();
    context.arc(p1.x, p1.y, 4, 0, Math.PI * 2);
    context.arc(p2.x, p2.y, 4, 0, Math.PI * 2);
    context.fill();

    const pixelDistance = Math.hypot(p2.x - p1.x, p2.y - p1.y);
    const textString = `${pixelDistance.toFixed(1)} px`;

    const midX = (p1.x + p2.x) / 2;
    const midY = (p1.y + p2.y) / 2;

    context.font = "bold 11px monospace";
    const textWidth = context.measureText(textString).width;
    const boxW = textWidth + 16;
    const boxH = 22;

    context.fillStyle = "rgba(3, 7, 18, 0.9)";
    context.strokeStyle = "#F59E0B";
    context.lineWidth = 1;
    context.fillRect(midX - boxW / 2, midY - boxH / 2, boxW, boxH);
    context.strokeRect(midX - boxW / 2, midY - boxH / 2, boxW, boxH);

    context.fillStyle = "#ffffff";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(textString, midX, midY + 1);

    context.restore();
  }

  private safeDispatch(action: any): void {
    const win = window as any;
    const dispatchFn = win.__floorPlanDispatch;
    if (typeof dispatchFn === "function") {
      try {
        dispatchFn(action);
      } catch {
        /* swallow */
      }
    }
  }
}

export default CalibrationRulerTool;