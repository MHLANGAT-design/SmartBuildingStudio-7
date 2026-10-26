// src/modules/FloorPlanDesigner/Tools/RoomTool.ts
//
// RoomTool — draws a polygon room, commits it atomically to Redux.

import { BaseTool } from "@/modules/FloorPlanDesigner/Tools/Base/BaseTool";
import { ToolPointerEvent } from "@/modules/FloorPlanDesigner/Tools/Base/ITool";
import { RoomFactory } from "@/modules/FloorPlanDesigner/Factories/RoomFactory";
import { AddRoomCommand } from "@/modules/FloorPlanDesigner/Commands/AddRoomCommand";
import { Point2D } from "@/modules/FloorPlanDesigner/Models/Base/Geometry";
import { store } from "@/Application/ConfigureStore";
import { SnapService } from "@/modules/FloorPlanDesigner/Utils/SnapService";
import {
  setDocument,
  markDirty,
  setSelection,
} from "@/modules/FloorPlanDesigner/Store/FloorPlanSlice";

type SnapType = "endpoint" | "midpoint" | "intersection" | "perpendicular" | "grid" | null;

export class RoomTool extends BaseTool {
  public static readonly ID = "room";

  private readonly vertices: Point2D[] = [];
  private currentPoint?: Point2D;
  private mouseHoverPoint?: Point2D;
  private currentSnapType: SnapType = null;
  private isProcessingCompletion = false;

  /** rAF-throttled render scheduling */
  private renderScheduled = false;

  public getId(): string {
    return RoomTool.ID;
  }

  public getName(): string {
    return "Room";
  }

  protected override onActivate(): void {
    this.setCursor("crosshair");
    this.setStatus(
      "Click corners. Double-click to complete room. Esc to cancel."
    );
    this.clearLocalState();
    this.isProcessingCompletion = false;
  }

  protected override onDeactivate(): void {
    this.clearLocalState();
    this.isProcessingCompletion = false;
    if (this.renderScheduled) {
      cancelAnimationFrame((this as any).__renderRaf);
      this.renderScheduled = false;
    }
  }

  private clearLocalState(): void {
    this.vertices.length = 0;
    this.currentPoint = undefined;
    this.mouseHoverPoint = undefined;
    this.currentSnapType = null;
  }

  private getActiveViewport(): any {
    return (
      this.viewport ||
      this.context?.viewport ||
      this.context?.getViewport?.() ||
      null
    );
  }

  /**
   * rAF-coalesced render request — collapses multiple pointer-move renders
   * into a single overlay repaint per animation frame.
   */
  private scheduleRender(): void {
    if (this.renderScheduled) return;
    this.renderScheduled = true;
    (this as any).__renderRaf = requestAnimationFrame(() => {
      this.renderScheduled = false;
      this.requestRender();
    });
  }

  public override onPointerDown(event: ToolPointerEvent): void {
    if (this.isProcessingCompletion) return;

    if (event.button === 2 || (event.originalEvent as MouseEvent)?.button === 2) {
      this.cancel();
      window.dispatchEvent(
        new CustomEvent("sbs:tool-change", { detail: { id: "select" } })
      );
      return;
    }

    // The canvas already ran SnapService and passed us the snapped point.
    const point: Point2D = { x: event.worldX, y: event.worldY };

    this.vertices.push(point);
    this.currentPoint = point;

    // Consume the snap type the canvas stashed on us.
    this.currentSnapType = (this as any).__snapType ?? null;
    this.mouseHoverPoint = this.currentSnapType ? point : undefined;

    this.scheduleRender();
  }

  public override onPointerMove(event: ToolPointerEvent): void {
    if (this.isProcessingCompletion) return;

    // Use the caller's already-snapped coordinates.
    const point: Point2D = { x: event.worldX, y: event.worldY };
    this.mouseHoverPoint = point;
    this.currentPoint = point;
    this.currentSnapType = (this as any).__snapType ?? null;

    this.scheduleRender();
  }

  public override onDoubleClick(_event: ToolPointerEvent): void {
    if (this.isProcessingCompletion) return;
    this.isProcessingCompletion = true;

    const filteredVertices = this.vertices.filter(
      (v, i, arr) => i === 0 || v.x !== arr[i - 1].x || v.y !== arr[i - 1].y
    );

    if (filteredVertices.length < 3) {
      console.warn("[RoomTool] Not enough vertices. Need at least 3.");
      this.isProcessingCompletion = false;
      this.cancel();
      return;
    }

    try {
      // ── 1. Build the room payload ──────────────────────────────────────
      const capturedPoints = filteredVertices.map((v) => ({ x: v.x, y: v.y }));

      const currentState = store.getState();
      const floorPlan = currentState.floorPlan || {};
      const currentDocument = floorPlan.document || {};
      const existingRooms = currentDocument.rooms || [];

      const maxNumber = existingRooms.reduce((max: number, room: any) => {
        const num = parseInt(room.name?.match(/\d+/)?.[0] || "0");
        return Math.max(max, num);
      }, 0);
      const nextRoomNum = maxNumber + 1;
      const defaultName = `Control Zone ${String(nextRoomNum).padStart(2, "0")}`;

      const lastRoom = existingRooms[existingRooms.length - 1];
      const defaultLux = lastRoom?.targetLux || 500;
      const defaultGroup = lastRoom?.primaryGroup || 1;

      const roomModelInstance = RoomFactory.create({ vertices: capturedPoints });
      const generatedRoomId =
        roomModelInstance.id ||
        roomModelInstance.Id ||
        `room-hash-${Date.now()}`;

      const roomTracePayload = {
        id: generatedRoomId,
        type: "room",
        name: defaultName,
        points: capturedPoints,
        vertices: capturedPoints,
        targetLux: defaultLux,
        primaryGroup: defaultGroup,
        isRoom: true,
        fillStyle: "rgba(74, 222, 128, 0.15)",
        strokeStyle: "#4ADE80",
        layer: "rooms",
      };

      // ── 2. Build border walls ──────────────────────────────────────────
      const newWalls: any[] = [];
      for (let i = 0; i < capturedPoints.length; i++) {
        const cur = capturedPoints[i];
        const nxt = capturedPoints[(i + 1) % capturedPoints.length];
        newWalls.push({
          id: `room-edge-trace-${Math.random()}-${Date.now()}`,
          type: "wall",
          startX: cur.x,
          startY: cur.y,
          endX: nxt.x,
          endY: nxt.y,
          isRoomBorder: true,
          thickness: 200,
          height: 2800,
          material: "Concrete",
          strokeStyle: "#4ADE80",
          points: [
            { x: cur.x, y: cur.y },
            { x: nxt.x, y: nxt.y },
          ],
        });
      }

      // ── 3. Command manager (optional) ──────────────────────────────────
      const activeContextContainer =
        (this as any).context || (this as any).contextContainer || this;
      const command = new AddRoomCommand(
        generatedRoomId,
        roomTracePayload,
        activeContextContainer
      );
      const cmdMgr = this.getCommandManager();
      if (cmdMgr && typeof (cmdMgr as any).execute === "function") {
        (cmdMgr as any).execute(command);
      }

      // ── 4. ATOMIC setDocument dispatch ─────────────────────────────────
      const freshState = store.getState();
      const freshDoc = freshState.floorPlan?.document || {};

      const currentElements = Array.isArray(freshDoc.elements)
        ? freshDoc.elements
        : [];
      const currentRooms = Array.isArray(freshDoc.rooms)
        ? freshDoc.rooms
        : [];
      const currentWalls = Array.isArray(freshDoc.walls)
        ? freshDoc.walls
        : [];

      const targetIdStr = String(generatedRoomId);

      const roomInElementsAlready = currentElements.some(
        (e: any) => String(e?.id ?? e?.Id ?? "") === targetIdStr
      );
      const roomInRoomsAlready = currentRooms.some(
        (r: any) => String(r?.id ?? r?.Id ?? "") === targetIdStr
      );

      const nextElements = roomInElementsAlready
        ? currentElements
        : [...currentElements, { ...roomTracePayload }, ...newWalls];

      const nextRooms = roomInRoomsAlready
        ? currentRooms
        : [...currentRooms, roomTracePayload];

      const existingWallIds = new Set(
        currentWalls.map((w: any) => String(w?.id ?? w?.Id ?? ""))
      );
      const wallsToAppend = newWalls.filter(
        (w: any) => !existingWallIds.has(String(w.id))
      );
      const nextWalls = [...currentWalls, ...wallsToAppend];

      store.dispatch(
        setDocument({
          ...freshDoc,
          elements: nextElements,
          rooms: nextRooms,
          walls: nextWalls,
        })
      );

      // ── 5. Update global mirror + snap cache ───────────────────────────
      const win = window as any;
      const existingGlobalDoc = win.__floorPlanActiveDocumentInstance || {};
      win.__floorPlanActiveDocumentInstance = {
        ...existingGlobalDoc,
        ...freshDoc,
        elements: nextElements,
        rooms: nextRooms,
        walls: nextWalls,
      };

      win.__persistentDwgVectorBackupCache = nextWalls;
      SnapService.invalidateCache();

      // ── 6. Selection, dirty flag, redraw ───────────────────────────────
      store.dispatch(setSelection(roomTracePayload));
      store.dispatch(markDirty());

      // Single canvas-update dispatch. The canvas coalesces bursts via its
      // own rAF scheduler, so one dispatch per logical change is sufficient.
      window.dispatchEvent(new CustomEvent("sbs:canvas-update"));

      setTimeout(() => {
        window.dispatchEvent(
          new CustomEvent("sbs:open-inspector", {
            detail: {
              type: "room",
              id: generatedRoomId,
              payload: roomTracePayload,
            },
          })
        );
      }, 100);
    } catch (error) {
      console.error("[RoomTool] Error during room commit:", error);
    } finally {
      this.clearLocalState();
      this.isProcessingCompletion = false;
      this.scheduleRender();
    }
  }

  public override cancel(): void {
    if (this.isProcessingCompletion) return;
    this.clearLocalState();
    this.scheduleRender();
  }

  public override renderOverlay(context: CanvasRenderingContext2D): void {
    const activeViewport = this.getActiveViewport();
    if (!activeViewport || typeof activeViewport.worldToScreen !== "function")
      return;

    context.save();
    context.setTransform(1, 0, 0, 1, 0, 0);

    if (this.mouseHoverPoint && this.currentSnapType) {
      SnapService.renderSnapIndicator(
        context,
        this.mouseHoverPoint,
        this.currentSnapType,
        activeViewport
      );
    }

    if (this.vertices.length > 0 && !this.isProcessingCompletion) {
      context.beginPath();
      context.strokeStyle = "#05FFC4";
      context.lineWidth = 2;
      context.fillStyle = "rgba(5, 255, 196, 0.05)";

      const screenStart = activeViewport.worldToScreen(this.vertices[0]);
      context.moveTo(screenStart.x, screenStart.y);

      for (let i = 1; i < this.vertices.length; i++) {
        const sp = activeViewport.worldToScreen(this.vertices[i]);
        context.lineTo(sp.x, sp.y);
      }

      if (this.currentPoint) {
        const spCur = activeViewport.worldToScreen(this.currentPoint);
        context.lineTo(spCur.x, spCur.y);
      }

      context.stroke();
      context.fill();
    }

    context.restore();
  }
}

export default RoomTool;