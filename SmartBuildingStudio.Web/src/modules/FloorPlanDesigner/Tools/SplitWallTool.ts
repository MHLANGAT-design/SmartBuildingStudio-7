// src/modules/FloorPlanDesigner/Tools/SplitWallTool.ts

import { BaseTool } from "@/modules/FloorPlanDesigner/Tools/Base/BaseTool";
import { ToolPointerEvent } from "@/modules/FloorPlanDesigner/Tools/Base/ITool";
import { store } from "@/Application/ConfigureStore";
import {
  setDocument,
  markDirty,
} from "@/modules/FloorPlanDesigner/Store/FloorPlanSlice";

interface Point2D { x: number; y: number; }

export class SplitWallTool extends BaseTool {
  private hoveredWallId: string | null = null;
  private hoverWorldPoint: Point2D | null = null;
  private readonly HIT_THRESHOLD_MM = 500;

  public getId(): string {
    return "split-wall";
  }

  public getName(): string {
    return "Split Wall";
  }

  protected override onActivate(): void {
    this.hoveredWallId = null;
    this.hoverWorldPoint = null;
    this.setCursor("crosshair");
    this.setStatus("Hover a wall to highlight it, click to split.");
  }

  protected override onDeactivate(): void {
    this.hoveredWallId = null;
    this.hoverWorldPoint = null;
  }

  public override onPointerMove(event: ToolPointerEvent): void {
    const worldPoint: Point2D = { x: event.worldX, y: event.worldY };
    const walls = this.getWalls();

    const hit = this.findNearestWall(walls, worldPoint);
    const newId = hit?.wall?.id ?? null;

    this.hoverWorldPoint = worldPoint;

    if (newId !== this.hoveredWallId) {
      this.hoveredWallId = newId;
      this.requestRender();
      window.dispatchEvent(new CustomEvent("canvas-invalidate"));
    } else {
      this.requestRender();
    }
  }

  public override onPointerDown(event: ToolPointerEvent): void {
    const worldPoint: Point2D = { x: event.worldX, y: event.worldY };
    const walls = this.getWalls();

    const hit = this.findNearestWall(walls, worldPoint);
    if (!hit) return;

    try {
      this.performSplit(hit.wall, worldPoint);
      window.dispatchEvent(new CustomEvent("sbs:canvas-update"));
      window.dispatchEvent(new CustomEvent("canvas-invalidate"));
    } catch (err) {
      console.error("[SplitWallTool] Split failed:", err);
    }
  }

  public override onPointerUp(_event: ToolPointerEvent): void {
    // no-op
  }

  public override cancel(): void {
    this.hoveredWallId = null;
    this.hoverWorldPoint = null;
    this.requestRender();
    window.dispatchEvent(new CustomEvent("canvas-invalidate"));
  }

  public override renderOverlay(context: CanvasRenderingContext2D): void {
    const viewport = (this as any).viewport || (this as any).context?.viewport;
    if (!viewport || typeof viewport.worldToScreen !== "function") return;
    if (!this.hoveredWallId) return;

    const walls = this.getWalls();
    const wall = walls.find((w: any) => String(w?.id ?? w?.Id ?? "") === this.hoveredWallId);
    if (!wall) return;

    const start = this.wallStart(wall);
    const end = this.wallEnd(wall);
    if (!start || !end) return;

    const s = viewport.worldToScreen(start);
    const e = viewport.worldToScreen(end);

    context.save();
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.strokeStyle = "#FFB800";
    context.lineWidth = 4;
    context.lineCap = "round";
    context.setLineDash([]);
    context.beginPath();
    context.moveTo(s.x, s.y);
    context.lineTo(e.x, e.y);
    context.stroke();

    if (this.hoverWorldPoint) {
      const cursor = viewport.worldToScreen(this.hoverWorldPoint);
      context.fillStyle = "#FFB800";
      context.beginPath();
      context.arc(cursor.x, cursor.y, 5, 0, Math.PI * 2);
      context.fill();
    }
    context.restore();
  }

  // ── Split logic (direct Redux) ────────────────────────────────────────

  private performSplit(wall: any, splitPoint: Point2D): void {
    const doc = this.getDocument();
    if (!doc) return;

    const start = this.wallStart(wall);
    const end = this.wallEnd(wall);
    if (!start || !end) return;

    // Snap the split point exactly onto the wall segment.
    const proj = this.projectOnSegment(splitPoint, start, end);

    const wallId = String(wall.id ?? wall.Id ?? "");
    const baseId = wallId || "wall";

    const leftWall: any = {
      ...wall,
      id: `${baseId}-a-${Date.now()}`,
      startX: start.x,
      startY: start.y,
      endX: proj.x,
      endY: proj.y,
      start: { x: start.x, y: start.y },
      end: { x: proj.x, y: proj.y },
      points: [{ x: start.x, y: start.y }, { x: proj.x, y: proj.y }],
    };
    const rightWall: any = {
      ...wall,
      id: `${baseId}-b-${Date.now()}`,
      startX: proj.x,
      startY: proj.y,
      endX: end.x,
      endY: end.y,
      start: { x: proj.x, y: proj.y },
      end: { x: end.x, y: end.y },
      points: [{ x: proj.x, y: proj.y }, { x: end.x, y: end.y }],
    };

    const replaceInArray = (arr: any[]) => {
      if (!Array.isArray(arr)) return arr;
      const idx = arr.findIndex((w: any) => String(w?.id ?? w?.Id ?? "") === wallId);
      if (idx < 0) return arr;
      return [...arr.slice(0, idx), leftWall, rightWall, ...arr.slice(idx + 1)];
    };

    const nextDoc: any = {
      ...doc,
      walls: replaceInArray(doc.walls || []),
      elements: Array.isArray(doc.elements)
        ? doc.elements.flatMap((e: any) => {
            const id = String(e?.id ?? e?.Id ?? "");
            if (id !== wallId) return [e];
            const leftEl = { ...e, ...leftWall, id: leftWall.id };
            const rightEl = { ...e, ...rightWall, id: rightWall.id };
            return [leftEl, rightEl];
          })
        : doc.elements,
    };

    store.dispatch(setDocument(nextDoc));
    store.dispatch(markDirty());

    this.hoveredWallId = null;
    this.hoverWorldPoint = null;
    this.requestRender();
  }

  private projectOnSegment(p: Point2D, a: Point2D, b: Point2D): Point2D {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len2 = dx * dx + dy * dy;
    if (len2 < 1e-9) return { x: a.x, y: a.y };
    let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2;
    t = Math.max(0, Math.min(1, t));
    return { x: a.x + t * dx, y: a.y + t * dy };
  }

  // ── Helpers ──────────────────────────────────────────────────────────

  private getDocument(): any {
    try {
      const state = store.getState() as any;
      return state?.floorPlan?.document ?? null;
    } catch {
      return null;
    }
  }

  private getWalls(): any[] {
    const doc = this.getDocument();
    if (!doc) return [];
    if (Array.isArray(doc.walls) && doc.walls.length > 0) return doc.walls;
    if (Array.isArray(doc.elements)) {
      return doc.elements.filter(
        (e: any) => String(e?.type ?? "").toLowerCase() === "wall"
      );
    }
    return [];
  }

  private findNearestWall(
    walls: any[],
    p: Point2D,
  ): { wall: any; distance: number } | null {
    let best: { wall: any; distance: number } | null = null;

    for (const w of walls) {
      if (!w) continue;
      const a = this.wallStart(w);
      const b = this.wallEnd(w);
      if (!a || !b) continue;

      const d = this.distanceToSegment(p, a, b);
      if (d <= this.HIT_THRESHOLD_MM && (!best || d < best.distance)) {
        best = { wall: w, distance: d };
      }
    }
    return best;
  }

  private wallStart(w: any): Point2D | null {
    if (typeof w.getStart === "function") return w.getStart();
    if (typeof w.startX === "number" && typeof w.startY === "number") {
      return { x: w.startX, y: w.startY };
    }
    if (w.start) return { x: w.start.x, y: w.start.y };
    const pts = w.points || w.vertices;
    if (Array.isArray(pts) && pts.length > 0) {
      return { x: pts[0].x, y: pts[0].y };
    }
    if (w.geometry && typeof w.geometry.startX === "number") {
      return { x: w.geometry.startX, y: w.geometry.startY };
    }
    return null;
  }

  private wallEnd(w: any): Point2D | null {
    if (typeof w.getEnd === "function") return w.getEnd();
    if (typeof w.endX === "number" && typeof w.endY === "number") {
      return { x: w.endX, y: w.endY };
    }
    if (w.end) return { x: w.end.x, y: w.end.y };
    const pts = w.points || w.vertices;
    if (Array.isArray(pts) && pts.length > 1) {
      return { x: pts[pts.length - 1].x, y: pts[pts.length - 1].y };
    }
    if (w.geometry && typeof w.geometry.endX === "number") {
      return { x: w.geometry.endX, y: w.geometry.endY };
    }
    return null;
  }

  private distanceToSegment(p: Point2D, a: Point2D, b: Point2D): number {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len2 = dx * dx + dy * dy;
    if (len2 < 1e-9) return Math.hypot(p.x - a.x, p.y - a.y);
    let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
  }
}

export default SplitWallTool;