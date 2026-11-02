// src/modules/FloorPlanDesigner/Tools/DoorTool.ts

import { BaseTool } from "@/modules/FloorPlanDesigner/Tools/Base/BaseTool";
import { ToolPointerEvent } from "@/modules/FloorPlanDesigner/Tools/Base/ITool";
import { Point2D } from "@/modules/FloorPlanDesigner/Models/Base/Geometry";
import { SnapService } from "@/modules/FloorPlanDesigner/Utils/SnapService";
import { store } from "@/Application/ConfigureStore";
import { markDirty, setDocument, setSelection } from "@/modules/FloorPlanDesigner/Store/FloorPlanSlice";
import { DoorData, DoorDbPayload } from "@/modules/FloorPlanDesigner/core/types/Door.types";

export type DoorToolState = "IDLE" | "SET_HINGE_A" | "SET_HINGE_B" | "SET_LOCK" | "SET_LOCK_A";

export class DoorTool extends BaseTool {
  public static readonly ID = "door";

  private toolState: DoorToolState = "IDLE";

  private hingeA?: Point2D;   // P1 — back face, hinge end
  private hingeB?: Point2D;   // P2 — front face, hinge end
  private lockB?: Point2D;    // P3 — front face, lock end

  private cursorPoint?: Point2D;
  private hoveredWallId?: string;
  private currentSnapType: "endpoint" | "midpoint" | null = null;

  private isProcessingCompletion = false;

  public getId(): string { return DoorTool.ID; }
  public getName(): string { return "Door"; }
  public getToolState(): DoorToolState { return this.toolState; }

  protected override onActivate(): void {
    this.setCursor("cell");
    this.toolState = "SET_HINGE_A";
    this.setStatus(
      "Click 1: hinge point on back wall face. Click 2: same point on front face. Click 3: lock point (arc end). Click 4: lock point on back face."
    );
    this.clearLocalToolState();
    window.addEventListener("keydown", this.handleModifierKeys);
  }

  protected override onDeactivate(): void {
    this.clearLocalToolState();
    this.toolState = "IDLE";
    window.removeEventListener("keydown", this.handleModifierKeys);
  }

  private handleModifierKeys = (e: KeyboardEvent): void => {
    if (e.key === "Escape") this.cancel();
  };

  private clearLocalToolState(): void {
    this.hingeA = undefined;
    this.hingeB = undefined;
    this.lockB = undefined;
    this.cursorPoint = undefined;
    this.hoveredWallId = undefined;
    this.currentSnapType = null;
    this.isProcessingCompletion = false;
  }

  // ── Derived directions ────────────────────────────────────────────────

  /** Wall normal (across the wall thickness). Unit vector P1 → P2. */
  private wallNormal(): Point2D | null {
    if (this.hingeA && this.hingeB) {
      const dx = this.hingeB.x - this.hingeA.x;
      const dy = this.hingeB.y - this.hingeA.y;
      const len = Math.hypot(dx, dy);
      if (len > 1e-9) return { x: dx / len, y: dy / len };
    }
    return null;
  }

  private projectOnto(target: Point2D, origin: Point2D, dir: Point2D): Point2D {
    const dx = target.x - origin.x;
    const dy = target.y - origin.y;
    const t = dx * dir.x + dy * dir.y;
    return { x: origin.x + t * dir.x, y: origin.y + t * dir.y };
  }

  private snapTo(p: ToolPointerEvent): { point: Point2D; snapResult: any; viewport: any } | null {
    const viewport = (this as any).viewport || (this as any).context?.viewport;
    if (!viewport) return null;
    const snapResult = SnapService.getSnappedPoint(
      p.screenX, p.screenY, p.worldX, p.worldY, viewport
    );
    return { point: snapResult.point, snapResult, viewport };
  }

  /** Leaf direction = unit(P2 − P1). Points from back face toward front face. */
  private computeLeafPoint(hingeA: Point2D, hingeB: Point2D, width: number): Point2D {
    const dx = hingeB.x - hingeA.x;
    const dy = hingeB.y - hingeA.y;
    const len = Math.hypot(dx, dy);
    if (len < 1e-9) return { x: hingeB.x + width, y: hingeB.y };
    return { x: hingeB.x + (dx / len) * width, y: hingeB.y + (dy / len) * width };
  }

  // ── Cursor constraints ────────────────────────────────────────────────
  // P1 and P2 are free (P2's position defines the wall normal).
  // P3 is constrained to the wall axis through P2.
  // P4 is constrained to the wall normal through P3.

  private constrainCursor(raw: Point2D): Point2D {
    switch (this.toolState) {
      case "SET_HINGE_A":
      case "SET_HINGE_B":
        return raw;

      case "SET_LOCK": {
        if (!this.hingeB) return raw;
        const normal = this.wallNormal();
        if (!normal) return raw;
        const axis = { x: -normal.y, y: normal.x };
        return this.projectOnto(raw, this.hingeB, axis);
      }

      case "SET_LOCK_A": {
        if (!this.lockB) return raw;
        const normal = this.wallNormal();
        if (!normal) return raw;
        return this.projectOnto(raw, this.lockB, normal);
      }

      default:
        return raw;
    }
  }

  // ── Pointer handlers ──────────────────────────────────────────────────

  public override onPointerMove(event: ToolPointerEvent): void {
    if (this.isProcessingCompletion) return;
    const activeViewport = (this as any).viewport || (this as any).context?.viewport;
    if (!activeViewport) return;

    const snapResult = SnapService.getSnappedPoint(
      event.screenX, event.screenY, event.worldX, event.worldY, activeViewport
    );

    this.currentSnapType = snapResult.type;
    this.hoveredWallId = snapResult.wallId;

    this.cursorPoint = this.constrainCursor(snapResult.point);
    this.requestRender();
  }

  public override onPointerDown(event: ToolPointerEvent): void {
    if (this.isProcessingCompletion) return;

    if (event.button === 2 || (event.originalEvent as MouseEvent)?.button === 2) {
      this.cancel();
      window.dispatchEvent(new CustomEvent("sbs:tool-change", { detail: { id: "select" } }));
      return;
    }

    const snap = this.snapTo(event);
    if (!snap) return;

    if (snap.snapResult.wallId) this.hoveredWallId = snap.snapResult.wallId;

    const point = this.constrainCursor(snap.point);

    switch (this.toolState) {
      case "SET_HINGE_A":
        this.hingeA = point;
        this.toolState = "SET_HINGE_B";
        this.setStatus("Click 2: front-face hinge point.");
        break;

      case "SET_HINGE_B":
        if (this.hingeA) {
          const d = Math.hypot(point.x - this.hingeA.x, point.y - this.hingeA.y);
          if (d < 5) {
            this.setStatus("Wall thickness too thin — click again further away.");
            break;
          }
        }
        this.hingeB = point;
        this.toolState = "SET_LOCK";
        this.setStatus("Click 3: lock point (arc end).");
        break;

      case "SET_LOCK": {
        if (!this.hingeB) break;
        const w = Math.hypot(point.x - this.hingeB.x, point.y - this.hingeB.y);
        if (w < 100) {
          this.setStatus("Door leaf too short — click again further away.");
          break;
        }
        this.lockB = point;
        this.toolState = "SET_LOCK_A";
        this.setStatus("Click 4: lock point on back face.");
        break;
      }

      case "SET_LOCK_A":
        if (!this.hingeA || !this.hingeB || !this.lockB) {
          console.warn("[DoorTool] SET_LOCK_A with missing points, resetting");
          this.cancel();
          break;
        }
        this.commitDoorPlacement(point);
        break;

      default:
        break;
    }

    this.requestRender();
  }

  public override onDoubleClick(_event: ToolPointerEvent): void {}

  public override cancel(): void {
    this.clearLocalToolState();
    this.toolState = "SET_HINGE_A";
    this.setStatus(
      "Click 1: hinge point on back wall face. Click 2: front-face hinge. Click 3: lock. Click 4: lock back."
    );
    this.requestRender();
  }

  private commitDoorPlacement(lockA: Point2D): void {
    if (this.isProcessingCompletion) return;
    if (!this.hingeA || !this.hingeB || !this.lockB) return;
    this.isProcessingCompletion = true;

    const { hingeA, hingeB, lockB } = this;

    // Reset state immediately so any lingering click can't double-fire.
    this.clearLocalToolState();
    this.toolState = "SET_HINGE_A";
    this.setStatus(
      "Click 1: hinge point on back wall face. Click 2: front-face hinge. Click 3: lock. Click 4: lock back."
    );

    const normal = (() => {
      const dx = hingeB.x - hingeA.x;
      const dy = hingeB.y - hingeA.y;
      const len = Math.hypot(dx, dy);
      return len > 1e-9 ? { x: dx / len, y: dy / len } : { x: 0, y: 1 };
    })();
    const axis = { x: -normal.y, y: normal.x };

    const wallThickness = Math.hypot(hingeB.x - hingeA.x, hingeB.y - hingeA.y);
    const width = Math.hypot(lockB.x - hingeB.x, lockB.y - hingeB.y);

    const hingeX = hingeA.x;
    const hingeY = hingeA.y;
    const wallAngle = Math.atan2(axis.y, axis.x);

    const lockDirFromHingeB = { x: lockB.x - hingeB.x, y: lockB.y - hingeB.y };
    const cross = lockDirFromHingeB.x * axis.y - lockDirFromHingeB.y * axis.x;
    const isLeftHand = cross < 0;

    const normalDot = normal.x * (hingeB.x - hingeA.x) + normal.y * (hingeB.y - hingeA.y);
    const isOutward = normalDot > 0;

    const height = 2100;
    const leafPoint = this.computeLeafPoint(hingeA, hingeB, width);

    const SAMPLES = 16;
    const arcPoints: Point2D[] = [];
    const startAngle = Math.atan2(leafPoint.y - hingeB.y, leafPoint.x - hingeB.x);
    const endAngle = Math.atan2(lockB.y - hingeB.y, lockB.x - hingeB.x);
    let delta = endAngle - startAngle;
    while (delta > Math.PI) delta -= 2 * Math.PI;
    while (delta < -Math.PI) delta += 2 * Math.PI;
    for (let i = 0; i <= SAMPLES; i++) {
      const t = i / SAMPLES;
      const a = startAngle + delta * t;
      arcPoints.push({
        x: hingeB.x + width * Math.cos(a),
        y: hingeB.y + width * Math.sin(a),
      });
    }

    try {
      const currentDocument = store.getState().floorPlan?.document || {};
      const existingDoors = currentDocument.doors || [];
      const existingElements = Array.isArray(currentDocument.elements) ? currentDocument.elements : [];

      const nextDoorNum = this.getNextDoorNumber(existingDoors);
      const assignedDoorId = `DOOR_${String(nextDoorNum).padStart(2, "0")}`;
      const activeHostId = this.hoveredWallId || "dwg-wall-root";

      const doorPayload: DoorDbPayload = {
        id: assignedDoorId,
        type: "Door",
        name: assignedDoorId,
        wallId: activeHostId,
        hingeX,
        hingeY,
        wallAngle,
        width,
        height,
        isOutward,
        isLeftHand,
        properties: { createdAt: Date.now() },
      };

      const newDoorData: DoorData = {
        ...doorPayload,
        style: { strokeColor: "#EAB308", strokeWidth: 1.5, opacity: 1, fillColor: "rgba(0,0,0,0)" },
      };

      const compositeDoorElement = {
        id: assignedDoorId,
        type: "door",
        composite: true,
        points: [hingeA, hingeB, lockB, lockA],
        geometry: {
          hingeX, hingeY, wallAngle, width,
          isOutward, isLeftHand, isDouble: false,
          variant: "single", blockName: "Door",
          wallThickness,
          jambBackA: { x: hingeA.x, y: hingeA.y },
          jambFrontA: { x: hingeB.x, y: hingeB.y },
          jambFrontB: { x: lockB.x, y: lockB.y },
          jambBackB: { x: lockA.x, y: lockA.y },
          leafPoint: { x: leafPoint.x, y: leafPoint.y },
        },
        primitives: [
          { kind: "line", points: [hingeA, hingeB] },
          { kind: "line", points: [lockB, lockA] },
          { kind: "line", points: [hingeB, lockB] },
          { kind: "line", points: [hingeB, leafPoint] },
          { kind: "polyline", points: arcPoints },
        ],
        layer: "DOORS",
        originalLayer: "DOORS",
      };

      const doorElements = [
        { id: `${assignedDoorId}_jambA`, groupId: assignedDoorId, type: "door", subType: "jamb", points: [hingeA, hingeB], layer: "DOORS", isOutward, isLeftHand },
        { id: `${assignedDoorId}_jambB`, groupId: assignedDoorId, type: "door", subType: "jamb", points: [lockB, lockA], layer: "DOORS", isOutward, isLeftHand },
        { id: `${assignedDoorId}_leaf`, groupId: assignedDoorId, type: "door", subType: "leaf", points: [hingeB, leafPoint], layer: "DOORS", isOutward, isLeftHand },
        { id: `${assignedDoorId}_edge`, groupId: assignedDoorId, type: "door", subType: "leaf", points: [hingeB, lockB], layer: "DOORS", isOutward, isLeftHand },
        { id: `${assignedDoorId}_arc`, groupId: assignedDoorId, type: "door", subType: "arc", points: arcPoints, layer: "DOORS", isOutward, isLeftHand },
        { id: `${assignedDoorId}_frame`, groupId: assignedDoorId, type: "door", subType: "frame", points: [hingeA, lockA], layer: "DOORS", isOutward, isLeftHand },
      ];

      const updatedDoors = [...existingDoors, newDoorData];
      const elementIds = new Set(existingElements.map((e: any) => String(e?.id ?? "")));
      const elementsToAdd = [compositeDoorElement, ...doorElements].filter(el => !elementIds.has(el.id));
      const updatedElements = [...existingElements, ...elementsToAdd];

      store.dispatch(setDocument({
        ...currentDocument,
        doors: updatedDoors,
        elements: updatedElements,
      }));
      store.dispatch(markDirty());
      store.dispatch(setSelection(newDoorData));

      const globalDoc = (window as any).__floorPlanActiveDocumentInstance;
      if (globalDoc) {
        globalDoc.doors = updatedDoors;
        globalDoc.elements = updatedElements;
      }
    } catch (e) {
      console.warn("Failed to synchronize door placement with floorPlan store:", e);
    }

    // Clear the double-click swallow after the dispatch settles
    setTimeout(() => { this.isProcessingCompletion = false; }, 300);
  }

  private getNextDoorNumber(existingDoors: any[]): number {
    const maxNum = existingDoors.reduce((max: number, d: any) => {
      const m = String(d?.id ?? "").match(/^DOOR_(\d+)$/);
      return m ? Math.max(max, parseInt(m[1], 10)) : max;
    }, 0);
    return maxNum + 1;
  }

  public override renderOverlay(context: CanvasRenderingContext2D): void {
    const viewport = (this as any).viewport || (this as any).context?.viewport;
    if (!viewport || typeof viewport.worldToScreen !== "function") return;
    if (this.isProcessingCompletion) return;

    const { hingeA, hingeB, lockB, cursorPoint } = this;
    if (!hingeA) return;

    const toScreen = (p: Point2D) => viewport.worldToScreen(p);

    context.save();
    context.lineWidth = 1.5;
    context.strokeStyle = "rgba(234, 179, 8, 0.85)";
    context.fillStyle = "rgba(234, 179, 8, 0.9)";
    context.setLineDash([]);

    const sA = toScreen(hingeA);
    context.beginPath();
    context.arc(sA.x, sA.y, 4, 0, Math.PI * 2);
    context.fill();

    if (this.toolState === "SET_HINGE_B" && cursorPoint) {
      const sCur = toScreen(cursorPoint);
      context.beginPath();
      context.setLineDash([4, 3]);
      context.moveTo(sA.x, sA.y);
      context.lineTo(sCur.x, sCur.y);
      context.stroke();
      context.setLineDash([]);
    }

    if (hingeB && (this.toolState === "SET_LOCK" || this.toolState === "SET_LOCK_A")) {
      const sB = toScreen(hingeB);
      context.beginPath();
      context.moveTo(sA.x, sA.y);
      context.lineTo(sB.x, sB.y);
      context.stroke();

      if (this.toolState === "SET_LOCK" && cursorPoint) {
        const sCur = toScreen(cursorPoint);
        context.beginPath();
        context.setLineDash([4, 3]);
        context.moveTo(sB.x, sB.y);
        context.lineTo(sCur.x, sCur.y);
        context.stroke();
        context.setLineDash([]);
      }
    }

    if (lockB && this.toolState === "SET_LOCK_A") {
      const sB = toScreen(hingeB!);
      const sC = toScreen(lockB);

      context.beginPath();
      context.moveTo(sB.x, sB.y);
      context.lineTo(sC.x, sC.y);
      context.stroke();

      const width = Math.hypot(lockB.x - hingeB!.x, lockB.y - hingeB!.y);
      const leafPoint = this.computeLeafPoint(hingeA, hingeB!, width);

      const sLeaf = toScreen(leafPoint);
      context.beginPath();
      context.moveTo(sB.x, sB.y);
      context.lineTo(sLeaf.x, sLeaf.y);
      context.stroke();

      const startAngle = Math.atan2(leafPoint.y - hingeB!.y, leafPoint.x - hingeB!.x);
      const endAngle = Math.atan2(lockB.y - hingeB!.y, lockB.x - hingeB!.x);
      let delta = endAngle - startAngle;
      while (delta > Math.PI) delta -= 2 * Math.PI;
      while (delta < -Math.PI) delta += 2 * Math.PI;

      const SAMPLES = 16;
      context.beginPath();
      for (let i = 0; i <= SAMPLES; i++) {
        const t = i / SAMPLES;
        const a = startAngle + delta * t;
        const worldP = { x: hingeB!.x + width * Math.cos(a), y: hingeB!.y + width * Math.sin(a) };
        const sp = toScreen(worldP);
        if (i === 0) context.moveTo(sp.x, sp.y);
        else context.lineTo(sp.x, sp.y);
      }
      context.stroke();

      if (cursorPoint) {
        const sCur = toScreen(cursorPoint);
        context.beginPath();
        context.setLineDash([4, 3]);
        context.moveTo(sC.x, sC.y);
        context.lineTo(sCur.x, sCur.y);
        context.stroke();
        context.setLineDash([]);
      }
    }

    if (this.cursorPoint && this.currentSnapType) {
      SnapService.renderSnapIndicator(context, this.cursorPoint, this.currentSnapType, viewport);
    }

    context.restore();
  }
}

export default DoorTool;