// src/modules/FloorPlanDesigner/Tools/DoorTool.ts

import { BaseTool } from "@/modules/FloorPlanDesigner/Tools/Base/BaseTool";
import { ToolPointerEvent } from "@/modules/FloorPlanDesigner/Tools/Base/ITool";
import { Point2D } from "@/modules/FloorPlanDesigner/Models/Base/Geometry";
import { SnapService } from "@/modules/FloorPlanDesigner/Utils/SnapService";
import { store } from "@/Application/ConfigureStore";
import { markDirty, setDocument, setSelection } from "@/modules/FloorPlanDesigner/Store/FloorPlanSlice";
import { DoorData, DoorDbPayload } from "@/modules/FloorPlanDesigner/core/types/Door.types";

export type DoorToolState = "IDLE" | "SET_HINGE" | "SET_ORIENTATION";

export class DoorTool extends BaseTool {
  public static readonly ID = "door";

  private toolState: DoorToolState = "IDLE";
  private startPoint?: Point2D;
  private currentPoint?: Point2D;
  private hoveredWallId?: string;
  private mouseHoverPoint?: Point2D;
  private currentSnapType: "endpoint" | "midpoint" | null = null;
  private activeWallStart?: Point2D;
  private activeWallEnd?: Point2D;
  private isProcessingCompletion = false;
  private isShiftPressed = false;

  public getId(): string { return DoorTool.ID; }
  public getName(): string { return "Door"; }
  public getToolState(): DoorToolState { return this.toolState; }

  protected override onActivate(): void {
    this.setCursor("cell");
    this.toolState = "SET_HINGE";
    this.setStatus("Click 1: Set hinge point. Click 2: Set width & swing orientation.");
    this.clearLocalToolState();
    window.addEventListener("keydown", this.handleModifierKeys);
    window.addEventListener("keyup", this.handleModifierKeys);
  }

  protected override onDeactivate(): void {
    this.clearLocalToolState();
    this.toolState = "IDLE";
    window.removeEventListener("keydown", this.handleModifierKeys);
    window.removeEventListener("keyup", this.handleModifierKeys);
  }

  private handleModifierKeys = (e: KeyboardEvent): void => {
    if (e.key === "Escape") {
      this.cancel();
      return;
    }
    const wasPressed = this.isShiftPressed;
    this.isShiftPressed = e.shiftKey;
    if (wasPressed !== this.isShiftPressed) this.requestRender();
  };

  private clearLocalToolState(): void {
    this.startPoint = undefined;
    this.currentPoint = undefined;
    this.hoveredWallId = undefined;
    this.mouseHoverPoint = undefined;
    this.currentSnapType = null;
    this.activeWallStart = undefined;
    this.activeWallEnd = undefined;
    this.isProcessingCompletion = false;
    this.isShiftPressed = false;
  }

  private applyOrthogonalFilter(origin: Point2D, target: Point2D): Point2D {
    if (!this.isShiftPressed) return target;
    const dx = target.x - origin.x;
    const dy = target.y - origin.y;
    return Math.abs(dx) >= Math.abs(dy)
      ? { x: target.x, y: origin.y }
      : { x: origin.x, y: target.y };
  }

  private deriveDoorPlacementGeometry(
    start: Point2D,
    current: Point2D
  ): { wallAngle: number; width: number; isOutward: boolean; isLeftHand: boolean } {
    const dx = current.x - start.x;
    const dy = current.y - start.y;
    const width = Math.round(Math.hypot(dx, dy)) || 900;

    const cursorAngle = Math.atan2(dy, dx);
    let wallAngle = cursorAngle;

    if (this.activeWallStart && this.activeWallEnd) {
      const wallDx = this.activeWallEnd.x - this.activeWallStart.x;
      const wallDy = this.activeWallEnd.y - this.activeWallStart.y;
      let rawWallAngle = Math.atan2(wallDy, wallDx);

      const dotProduct = Math.cos(cursorAngle - rawWallAngle);
      if (dotProduct < 0) {
        rawWallAngle += Math.PI;
      }
      wallAngle = rawWallAngle;
    } else {
      wallAngle = Math.round(cursorAngle / (Math.PI / 2)) * (Math.PI / 2);
    }

    const angleDiff = cursorAngle - wallAngle;
    const crossProduct = Math.sin(angleDiff);

    const isOutward = crossProduct >= 0;
    const isLeftHand = false;

    return { wallAngle, width, isOutward, isLeftHand };
  }

  private getNextDoorNumber(existingDoors: any[]): number {
    const maxNum = existingDoors.reduce((max: number, d: any) => {
      const m = String(d?.id ?? "").match(/^DOOR_(\d+)$/);
      return m ? Math.max(max, parseInt(m[1], 10)) : max;
    }, 0);
    return maxNum + 1;
  }

  public override onPointerMove(event: ToolPointerEvent): void {
    if (this.isProcessingCompletion) return;
    const activeViewport = (this as any).viewport || (this as any).context?.viewport;
    if (!activeViewport) return;

    const snapResult = SnapService.getSnappedPoint(
      event.screenX, event.screenY, event.worldX, event.worldY, activeViewport
    );

    this.mouseHoverPoint = snapResult.point;
    this.hoveredWallId = snapResult.wallId;
    this.currentSnapType = snapResult.type;
    this.activeWallStart = snapResult.wallStart || (snapResult as any).WallStart;
    this.activeWallEnd = snapResult.wallEnd || (snapResult as any).WallEnd;

    this.currentPoint = this.startPoint
      ? this.applyOrthogonalFilter(this.startPoint, snapResult.point)
      : snapResult.point;

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

    const snapResult = SnapService.getSnappedPoint(
      event.screenX, event.screenY, event.worldX, event.worldY, activeViewport
    );
    const activeHostId = snapResult.wallId || this.hoveredWallId || "dwg-wall-root";

    if (this.toolState === "SET_HINGE" || !this.startPoint) {
      this.startPoint = { x: snapResult.point.x, y: snapResult.point.y };
      this.currentPoint = { x: snapResult.point.x, y: snapResult.point.y };
      this.toolState = "SET_ORIENTATION";
      this.setStatus("Click 2: Drag to specify leaf width and swing direction.");
      this.requestRender();
      return;
    }

    if (this.toolState === "SET_ORIENTATION") {
      this.commitDoorPlacement(
        this.applyOrthogonalFilter(this.startPoint, snapResult.point),
        activeHostId
      );
    }
  }

  public override onDoubleClick(event: ToolPointerEvent): void {
    if (this.isProcessingCompletion || !this.startPoint) return;
    const activeViewport = (this as any).viewport || (this as any).context?.viewport;
    if (!activeViewport) return;

    const snapResult = SnapService.getSnappedPoint(
      event.screenX, event.screenY, event.worldX, event.worldY, activeViewport
    );

    this.commitDoorPlacement(
      this.applyOrthogonalFilter(this.startPoint, snapResult.point),
      snapResult.wallId || "dwg-wall-root"
    );
  }

  private commitDoorPlacement(finalPoint: Point2D, activeHostId: string): void {
    if (!this.startPoint || this.isProcessingCompletion) return;
    this.isProcessingCompletion = true;

    const { wallAngle, width, isOutward, isLeftHand } = this.deriveDoorPlacementGeometry(
      this.startPoint, finalPoint
    );

    try {
      const currentDocument = store.getState().floorPlan?.document || {};
      const existingDoors = currentDocument.doors || [];
      const existingElements = Array.isArray(currentDocument.elements) ? currentDocument.elements : [];

      const nextDoorNum = this.getNextDoorNumber(existingDoors);
      const assignedDoorId = `DOOR_${String(nextDoorNum).padStart(2, "0")}`;

      const doorPayload: DoorDbPayload = {
        id: assignedDoorId,
        type: "Door",
        name: assignedDoorId,
        wallId: activeHostId,
        hingeX: this.startPoint.x,
        hingeY: this.startPoint.y,
        wallAngle,
        width,
        height: 2100,
        isOutward,
        isLeftHand,
        properties: { createdAt: Date.now() },
      };

      const newDoorData: DoorData = {
        ...doorPayload,
        style: { strokeColor: "#EAB308", strokeWidth: 1.5, opacity: 1, fillColor: "rgba(0,0,0,0)" },
      };

      const hingeX = this.startPoint.x;
      const hingeY = this.startPoint.y;

      const closedLock = {
        x: hingeX + width * Math.cos(wallAngle),
        y: hingeY + width * Math.sin(wallAngle),
      };

      const openAngle = wallAngle + (isOutward ? Math.PI / 2 : -Math.PI / 2);
      const openLock = {
        x: hingeX + width * Math.cos(openAngle),
        y: hingeY + width * Math.sin(openAngle),
      };

      const SAMPLES = 16;
      const arcPoints: { x: number; y: number }[] = [];
      for (let i = 0; i <= SAMPLES; i++) {
        const t = i / SAMPLES;
        const a = wallAngle + (openAngle - wallAngle) * t;
        arcPoints.push({
          x: hingeX + width * Math.cos(a),
          y: hingeY + width * Math.sin(a),
        });
      }

      // ─── COMPOSITE ELEMENT (For Topology) ───
      const compositeDoorElement = {
        id: assignedDoorId,
        type: "door",
        composite: true,
        points: [{ x: hingeX, y: hingeY }, closedLock],
        geometry: {
          hingeX, hingeY, wallAngle, width,
          isOutward, isLeftHand, isDouble: false,
          variant: "single", blockName: "Door"
        },
        primitives: [
          { kind: "polyline", points: arcPoints },
          { kind: "line", points: [{ x: hingeX, y: hingeY }, closedLock] },
          { kind: "line", points: [{ x: hingeX, y: hingeY }, openLock] }
        ],
        layer: "DOORS",
        originalLayer: "DOORS"
      };

      // ─── RAW FRAGMENTS (For Renderer) ───
      const doorElements = [
        { id: `${assignedDoorId}_frame`, groupId: assignedDoorId, type: "door", subType: "frame", points: [{ x: hingeX, y: hingeY }, closedLock], layer: "DOORS", isOutward, isLeftHand },
        { id: `${assignedDoorId}_leaf`, groupId: assignedDoorId, type: "door", subType: "leaf", points: [{ x: hingeX, y: hingeY }, openLock], layer: "DOORS", isOutward, isLeftHand },
        { id: `${assignedDoorId}_arc`, groupId: assignedDoorId, type: "door", subType: "arc", points: arcPoints, layer: "DOORS", isOutward, isLeftHand },
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

    setTimeout(() => {
      this.clearLocalToolState();
      this.toolState = "SET_HINGE";
      this.setStatus("Click 1: Set hinge point. Click 2: Set width & swing orientation.");
      this.requestRender();
    }, 50);
  }

  public override cancel(): void {
    this.clearLocalToolState();
    this.toolState = "SET_HINGE";
    this.setStatus("Click 1: Set hinge point. Click 2: Set width & swing orientation.");
    this.requestRender();
  }

  public override renderOverlay(context: CanvasRenderingContext2D): void {
    const activeViewport = (this as any).viewport || (this as any).context?.viewport;
    if (!activeViewport || !this.startPoint || !this.currentPoint || this.isProcessingCompletion) return;

    const { wallAngle, width, isOutward, isLeftHand } = this.deriveDoorPlacementGeometry(
      this.startPoint, this.currentPoint
    );

    if (width <= 2) return;

    const openAngle = wallAngle + (isOutward ? Math.PI / 2 : -Math.PI / 2);
    const openLock = {
      x: this.startPoint.x + width * Math.cos(openAngle),
      y: this.startPoint.y + width * Math.sin(openAngle),
    };

    const screenHinge = activeViewport.worldToScreen({ x: this.startPoint.x, y: this.startPoint.y });
    const screenLock = activeViewport.worldToScreen(openLock);

    context.save();
    context.lineWidth = 1.5;
    context.strokeStyle = "rgba(234,179,8,0.75)";

    context.beginPath();
    context.moveTo(screenHinge.x, screenHinge.y);
    context.lineTo(screenLock.x, screenLock.y);
    context.stroke();

    const screenRadius = width * (activeViewport.finalScale || 1);
    context.beginPath();
    
    // simple arc drawing for preview
    let startAngle = wallAngle;
    let endAngle = openAngle;
    const counterclockwise = isOutward; 
    
    context.arc(screenHinge.x, screenHinge.y, screenRadius, startAngle, endAngle, counterclockwise);
    context.stroke();

    context.restore();
  }
}

export default DoorTool;