// src/modules/FloorPlanDesigner/Document/DrawingDocument.ts

import { DrawingMetadata } from "@/modules/FloorPlanDesigner/Models/Base/Metadata";
import { GeometryModel } from "@/modules/FloorPlanDesigner/Document/Geometry/GeometryModel";
import { DrawingDocumentEvents } from "@/modules/FloorPlanDesigner/Document/Events/DrawingDocumentEvents";
import { DoorData } from "@/modules/FloorPlanDesigner/core/types/Door.types";

export class DrawingDocument {
  private readonly _metadata: DrawingMetadata;
  private readonly _geometry: GeometryModel;
  private readonly _events: DrawingDocumentEvents;

  /**
   * The raw element array from the loaded payload.
   *
   * This is the array CanvasRenderer.clearAndDraw iterates to draw
   * walls, doors, windows, and rooms. It carries the original `type`,
   * `layer` / `originalLayer`, and `points` that the renderer's
   * classifier needs.
   *
   * The `_geometry.walls / _geometry.doors / ...` collections are
   * normalized versions used by editor logic and by tools that need
   * method-based access. `_elements` is what the renderer consumes.
   *
   * FixturePlacementStudio and FloorPlanDesigner both pass
   * `getElements()` to CanvasRenderer.
   */
  private _elements: any[] = [];

  constructor(options?: any) {
    this._metadata = options?.metadata ?? {
      id: `doc-${Date.now()}`,
      name: "Unsaved Layout",
      version: 1,
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString()
    };
    this._events = new DrawingDocumentEvents();
    this._geometry = new GeometryModel(this._events);
  }

  getId(): string { return this._metadata.id; }
  getMetadata(): DrawingMetadata { return this._metadata; }

  // ─── Elements (raw DXF array for the renderer) ──────────────────────

  /** Returns the raw element array. Read-only; do not mutate. */
  getElements(): readonly any[] {
    return this._elements;
  }

  /** Replace the raw element array. Used by loadFromState. */
  setElements(elements: any[]): void {
    this._elements = Array.isArray(elements) ? elements : [];
  }

  // ─── Walls ──────────────────────────────────────────────────────────

  addWall(wall: any): void {
    if (wall && typeof wall.getId !== 'function') {
      const id = wall.id || `wall-${Math.random()}`;
      const sx = wall.startX ?? wall.start?.x ?? 0;
      const sy = wall.startY ?? wall.start?.y ?? 0;
      const ex = wall.endX ?? wall.end?.x ?? 0;
      const ey = wall.endY ?? wall.end?.y ?? 0;
      wall = {
        ...wall,
        id,
        startX: sx,
        startY: sy,
        endX: ex,
        endY: ey,
        getId: () => id,
        getStartPoint: () => ({ x: sx, y: sy }),
        getEndPoint: () => ({ x: ex, y: ey }),
        points: [{ x: sx, y: sy }, { x: ex, y: ey }]
      };
    }
    this._geometry.walls.add(wall);
  }
  getWalls(): readonly any[] { return this._geometry.walls.getAll(); }

  // ─── Doors ──────────────────────────────────────────────────────────

  addDoor(door: any): void {
    if (door && typeof door.getId !== 'function') {
      const id = String(door.id || door.Id || `door-${Math.random()}`);

      const hingeX = Number(door.hingeX ?? door.x ?? door.startX ?? (door.start?.x || 0));
      const hingeY = Number(door.hingeY ?? door.y ?? door.startY ?? (door.start?.y || 0));

      const wallAngle = Number(door.wallAngle ?? door.angle ?? door.rotation ?? 0);
      const width = Number(door.width ?? door.scaleX ?? 900);
      const height = Number(door.height ?? 2100);

      const isOutward = Boolean(
        door.isOutward === true || door.isOutward === 'true' || door.isOutward === 1
      );

      const isLeftHand = Boolean(
        door.isLeftHand === true || door.isLeftHand === 'true' || door.isLeftHand === 1
      );

      const normalizedDoor: DoorData = {
        ...door,
        id,
        type: 'Door',
        wallId: String(door.wallId || door.WallId || 'dwg-wall-root'),
        hingeX,
        hingeY,
        wallAngle,
        width,
        height,
        isOutward,
        isLeftHand,
        name: door.name || door.Name,
        properties: door.properties || {},
        style: door.style || { strokeColor: "#EAB308", strokeWidth: 1.5, opacity: 1 },
      };

      door = {
        ...normalizedDoor,
        getId: () => id,
        getPosition: () => ({ x: hingeX, y: hingeY }),
        getStartPoint: () => ({ x: hingeX, y: hingeY }),
        getEndPoint: () => ({
          x: hingeX + width * Math.cos(wallAngle),
          y: hingeY + width * Math.sin(wallAngle)
        }),
        getDoorType: () => door.doorType || 'Single Swing',
        getStyle: () => normalizedDoor.style
      };
    }
    this._geometry.doors.add(door);
  }
  getDoors(): readonly any[] { return this._geometry.doors.getAll(); }

  // ─── Windows ────────────────────────────────────────────────────────

  addWindow(win: any): void {
    if (win && typeof win.getId !== 'function') {
      const id = win.id || `window-${Math.random()}`;
      const sx = win.startX ?? win.x ?? 0;
      const sy = win.startY ?? win.y ?? 0;
      const ex = win.endX ?? win.end?.x ?? sx;
      const ey = win.endY ?? win.end?.y ?? sy;
      win = {
        ...win,
        id,
        startX: sx,
        startY: sy,
        endX: ex,
        endY: ey,
        getId: () => id,
        getPosition: () => ({ x: sx, y: sy }),
        getStartPoint: () => ({ x: sx, y: sy }),
        getEndPoint: () => ({ x: ex, y: ey }),
        getStyle: () => win.style || { strokeColor: "#38BDF8", strokeWidth: 2 }
      };
    }
    this._geometry.windows.add(win);
  }
  getWindows(): readonly any[] { return this._geometry.windows.getAll(); }

  // ─── Rooms ──────────────────────────────────────────────────────────

  addRoom(room: any): void {
    if (room && typeof room.getId !== 'function') {
      const id = room.id || `room-${Math.random()}`;
      const points = room.points || room.vertices || [];
      room = {
        ...room,
        id,
        getId: () => id,
        type: room.type || 'room',
        isRoom: true,
        points: points,
        vertices: points,
        targetLux: room.targetLux || 500,
        primaryGroup: room.primaryGroup || 1,
        fillStyle: room.fillStyle || 'rgba(74, 222, 128, 0.15)',
        strokeStyle: room.strokeStyle || '#4ADE80',
        layer: 'rooms'
      };
    }
    this._geometry.rooms.add(room);
  }
  getRooms(): readonly any[] { return this._geometry.rooms.getAll(); }
  getImportedDrawings(): readonly any[] { return []; }

  // ─── Lookup helpers ─────────────────────────────────────────────────

  /**
   * Find a wall by id. Matches either a string `id` field or the
   * `getId()` method on class-based wall instances.
   */
  findWall(id: string): any | undefined {
    return this._geometry.walls
      .getAll()
      .find(
        (w: any) =>
          String(w?.id ?? w?.Id ?? w?.getId?.() ?? "") === String(id)
      );
  }

  /**
   * Find a door by id. Same matching strategy as findWall.
   */
  findDoor(id: string): any | undefined {
    return this._geometry.doors
      .getAll()
      .find(
        (d: any) =>
          String(d?.id ?? d?.Id ?? d?.getId?.() ?? "") === String(id)
      );
  }

  /**
   * Find a window by id.
   */
  findWindow(id: string): any | undefined {
    return this._geometry.windows
      .getAll()
      .find(
        (w: any) =>
          String(w?.id ?? w?.Id ?? w?.getId?.() ?? "") === String(id)
      );
  }

  /**
   * Find a room by id.
   */
  findRoom(id: string): any | undefined {
    return this._geometry.rooms
      .getAll()
      .find(
        (r: any) =>
          String(r?.id ?? r?.Id ?? r?.getId?.() ?? "") === String(id)
      );
  }

  /**
   * Find any geometry object by id, searching walls, doors, windows,
   * and rooms in that order.
   */
  findObject(id: string): any | undefined {
    return (
      this.findWall(id) ??
      this.findDoor(id) ??
      this.findWindow(id) ??
      this.findRoom(id)
    );
  }

  // ─── Removal helpers ────────────────────────────────────────────────

  removeWall(id: string): void {
    const wall = this.findWall(id);
    if (wall) this._geometry.walls.remove?.(wall);
  }

  removeDoor(id: string): void {
    const door = this.findDoor(id);
    if (door) this._geometry.doors.remove?.(door);
  }

  removeWindow(id: string): void {
    const window = this.findWindow(id);
    if (window) this._geometry.windows.remove?.(window);
  }

  removeRoom(id: string): void {
    const room = this.findRoom(id);
    if (room) this._geometry.rooms.remove?.(room);
  }

  // ─── Bulk load ──────────────────────────────────────────────────────

  /**
   * Populate the document from a state object.
   *
   * RESETS the geometry model before repopulating. Without this reset,
   * every call to loadFromState appends the new document's walls/doors/
   * windows/rooms to whatever was already there. Loading document B on
   * top of document A produced the union of both — walls/doors/windows
   * from B plus rooms and fixtures from both — which then rendered as
   * two overlapping floor plans on the canvas.
   *
   * `state.elements` — if present and non-empty — is stored verbatim as
   * the raw element array that CanvasRenderer consumes. Otherwise we
   * synthesize one from the individual collections so the renderer
   * always has something to draw.
   *
   * The individual collections (walls / doors / windows / rooms) are
   * populated regardless, for editor-side logic.
   */
  public loadFromState(state: any): void {
    if (!state) return;

    // ── Reset geometry before reloading ──────────────────────────────
    // This is the key line. Without it, each load accumulates.
    this._geometry.clear();

    // ── Elements ─────────────────────────────────────────────────────
    if (Array.isArray(state.elements) && state.elements.length > 0) {
      this._elements = state.elements;
    } else {
      // Synthesize from the individual collections.
      const synthesized: any[] = [];

      if (Array.isArray(state.walls)) {
        for (const w of state.walls) {
          const sx = w.startX ?? w.start?.x ?? 0;
          const sy = w.startY ?? w.start?.y ?? 0;
          const ex = w.endX ?? w.end?.x ?? 0;
          const ey = w.endY ?? w.end?.y ?? 0;
          synthesized.push({
            id: w.id ?? `wall-${Math.random()}`,
            type: 'wall',
            layer: w.layer ?? 'WALLS',
            points: [{ x: sx, y: sy }, { x: ex, y: ey }],
            thickness: w.thickness,
          });
        }
      }

      if (Array.isArray(state.doors)) {
        for (const d of state.doors) {
          const pts = d.points || d.Points || [];
          if (Array.isArray(pts) && pts.length >= 2) {
            synthesized.push({
              id: d.id ?? `door-${Math.random()}`,
              type: 'door',
              layer: d.layer ?? 'DOORS',
              points: pts,
            });
          } else {
            const hingeX = d.hingeX ?? 0;
            const hingeY = d.hingeY ?? 0;
            const wa = d.wallAngle ?? 0;
            const w = d.width ?? 900;
            const ex = hingeX + w * Math.cos(wa);
            const ey = hingeY + w * Math.sin(wa);
            synthesized.push({
              id: d.id ?? `door-${Math.random()}`,
              type: 'door',
              layer: d.layer ?? 'DOORS',
              points: [{ x: hingeX, y: hingeY }, { x: ex, y: ey }],
            });
          }
        }
      }

      if (Array.isArray(state.windows)) {
        for (const w of state.windows) {
          const pts = w.points || w.Points || [];
          if (Array.isArray(pts) && pts.length >= 2) {
            synthesized.push({
              id: w.id ?? `window-${Math.random()}`,
              type: 'window',
              layer: w.layer ?? 'WINDOWS',
              points: pts,
            });
          } else {
            const sx = w.startX ?? w.x ?? 0;
            const sy = w.startY ?? w.y ?? 0;
            const ex = w.endX ?? sx + (w.width ?? 1200);
            const ey = w.endY ?? sy;
            synthesized.push({
              id: w.id ?? `window-${Math.random()}`,
              type: 'window',
              layer: w.layer ?? 'WINDOWS',
              points: [{ x: sx, y: sy }, { x: ex, y: ey }],
            });
          }
        }
      }

      if (Array.isArray(state.rooms)) {
        for (const r of state.rooms) {
          const pts = r.points || r.vertices || [];
          if (Array.isArray(pts) && pts.length >= 3) {
            synthesized.push({
              id: r.id ?? `room-${Math.random()}`,
              type: 'room',
              layer: r.layer ?? 'ROOMS',
              isRoom: true,
              points: pts,
            });
          }
        }
      }

      this._elements = synthesized;
    }

    // ── Geometry collections ────────────────────────────────────────
    if (Array.isArray(state.walls))   state.walls.forEach((w: any) => this.addWall(w));
    if (Array.isArray(state.doors))   state.doors.forEach((d: any) => this.addDoor(d));
    if (Array.isArray(state.windows)) state.windows.forEach((w: any) => this.addWindow(w));
    if (Array.isArray(state.rooms))   state.rooms.forEach((r: any) => this.addRoom(r));
  }
}

export default DrawingDocument;