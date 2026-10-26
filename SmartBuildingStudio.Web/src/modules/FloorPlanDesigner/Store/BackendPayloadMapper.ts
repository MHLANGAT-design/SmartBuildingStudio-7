// src/modules/FloorPlanDesigner/Store/BackendPayloadMapper.ts
import {
  FloorPlanDocument,
  Room,
  Wall,
  Window,
  ImportedDrawing,
  ElectricalFixture,
} from "./FloorPlanSlice";
import { DoorData, DoorDbPayload } from "@/modules/FloorPlanDesigner/core/types/Door.types";

export interface BaseStyleDto {
  strokeColor: string;
  fillColor: string;
  strokeWidth: number;
  opacity: number;
}

export interface DrawingLayerDto {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  order: number;
}

export interface ImportedDrawingDto {
  id: string;
  fileName: string;
  fileSizeNumber: number;
  scaleFactor: number;
  offsetX: number;
  offsetY: number;
  rotationDegrees: number;
  opacity: number;
}

export interface BackendWallDto {
  id: string;
  floorId: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  thickness: number;
  material: string;
  style: BaseStyleDto;
}

export interface BackendWindowDto {
  id: string;
  wallId: string;
  floorId: string;
  width: number;
  height: number;
  x: number;
  y: number;
  startX?: number;
  startY?: number;
  transmittance: number;
  style: BaseStyleDto;
}

export interface BackendElectricalFixtureDto {
  id: string;
  floorId: string;
  x: number;
  y: number;
  type: string;
  daliGroup: number;
  style: BaseStyleDto;
}

export interface BackendRoomDto {
  id: string;
  floorId: string;
  name: string;
  targetLux: number;
  primaryGroup: number;
  vertexPoints: { x: number; y: number }[];
  style: BaseStyleDto;
}

export interface FloorLevelDto {
  id: string;
  name: string;
  levelIndex: number;
  elevationHeightMeters: number;
  walls: BackendWallDto[];
  rooms: BackendRoomDto[];
  doors: DoorDbPayload[];
  windows: BackendWindowDto[];
  electricalFixtures?: BackendElectricalFixtureDto[];
}

export interface ComprehensiveUpdateFloorPlanPayloadDto {
  name: string;
  pixelsToMetresScale: number;
  activeFloorId: string;
  layers: DrawingLayerDto[];
  importedDrawings: ImportedDrawingDto[];
  floors: FloorLevelDto[];
}

/**
 * Normalized DXF element shape.
 *
 * NOTE: this shape is used for fixtures and for the individual
 * properties read by fixtures. It is NO LONGER applied to the whole
 * `elements` array on save or load. Composite elements (doors,
 * windows, walls) must round-trip verbatim with their `composite`,
 * `primitives`, and `geometry` fields intact. See toLegacyBackend
 * and fromLegacyBackend for the verbatim element pass-through.
 */
interface PersistedElement {
  id: string;
  groupId?: string;
  blockName?: string;
  type: string;
  originalLayer: string;
  points: { x: number; y: number }[];
  rotation: number;
  kind?: string;
}

function normalizeElement(el: any): PersistedElement {
  const normalized: PersistedElement = {
    id: String(el.id ?? ''),
    type: String(el.type ?? el.Type ?? '').toLowerCase(),
    originalLayer: String(
      el.originalLayer ?? el.layer ?? el.Layer ?? el.OriginalLayer ?? ''
    ),
    points: (el.points || el.Points || el.vertices || []).map((p: any) => ({
      x: Number(p.x ?? p.X ?? 0),
      y: Number(p.y ?? p.Y ?? 0),
    })),
    rotation: Number(el.rotation ?? 0),
  };

  const gk =
    el.groupId ??
    el.GroupId ??
    el.group_id ??
    el.Group_id;
  if (gk !== undefined && gk !== null && gk !== '') {
    normalized.groupId = String(gk);
  }

  const bk =
    el.blockName ??
    el.BlockName ??
    el.block_name ??
    el.Block_name;
  if (bk !== undefined && bk !== null && bk !== '') {
    normalized.blockName = String(bk);
  }

  const kind = el.kind ?? el.Kind ?? el.fixtureType ?? el.FixtureType;
  if (kind !== undefined && kind !== null && kind !== '') {
    normalized.kind = String(kind);
  }

  return normalized;
}

function isRoomPrimitive(el: any): boolean {
  const t = String(el?.type ?? '').toLowerCase();
  return t === 'room' || t === 'rooms' || el?.isRoom === true;
}

function isFixturePrimitive(el: any): boolean {
  const t = String(el?.type ?? '').toLowerCase();
  return t === 'fixture' || el?.isFixture === true;
}

function normalizeFixture(f: any) {
  const kind = String(
    f.kind ??
    f.Kind ??
    f.fixtureType ??
    f.FixtureType ??
    f.productType ??
    f.ProductType ??
    f.type ??
    'luminaire'
  );
  return {
    id: String(f.id ?? f.Id ?? `fixture-${Math.random()}`),
    x: Number(f.x ?? f.X ?? 0),
    y: Number(f.y ?? f.Y ?? 0),
    kind,
    type: kind, // legacy alias
    productId: f.productId ?? f.ProductId,
    rotation: Number(f.rotation ?? f.Rotation ?? 0),
    roomId: f.roomId ?? f.RoomId,
    elevation: f.elevation ?? f.Elevation,
    layerId: f.layerId ?? f.LayerId,
    daliGroup: Number(f.daliGroup ?? f.DaliGroup ?? 1),
  };
}

function fixtureToElement(f: any) {
  const n = normalizeFixture(f);
  return {
    id: n.id,
    type: 'fixture',
    kind: n.kind,
    fixtureType: n.kind,
    isFixture: true,
    x: n.x,
    y: n.y,
    points: [{ x: n.x, y: n.y }],
    vertices: [{ x: n.x, y: n.y }],
    rotation: n.rotation,
    productId: n.productId,
    roomId: n.roomId,
    elevation: n.elevation,
    layerId: n.layerId,
    daliGroup: n.daliGroup,
    layer: 'fixtures',
    originalLayer: 'fixtures',
  };
}

function persistedFixtureToElement(el: PersistedElement & { kind?: string }): any {
  const pts = Array.isArray(el.points) ? el.points : [];
  const first = pts[0] ?? { x: 0, y: 0 };
  const kind = String(el.kind ?? 'luminaire');
  return {
    id: String(el.id ?? `fixture-dxf-${Math.random()}`),
    type: 'fixture',
    kind,
    fixtureType: kind,
    isFixture: true,
    x: Number(first.x ?? 0),
    y: Number(first.y ?? 0),
    points: [{ x: Number(first.x ?? 0), y: Number(first.y ?? 0) }],
    vertices: [{ x: Number(first.x ?? 0), y: Number(first.y ?? 0) }],
    rotation: Number(el.rotation ?? 0),
    layer: 'fixtures',
    originalLayer: String(el.originalLayer ?? ''),
    ...(el.groupId ? { groupId: el.groupId } : {}),
    ...(el.blockName ? { blockName: el.blockName } : {}),
  };
}

function dedupeById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of items) {
    const id = String(item?.id ?? '');
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push(item);
  }
  return out;
}

export class BackendPayloadMapper {
  private static readonly DEFAULT_STYLE: BaseStyleDto = {
    strokeColor: "#000000",
    fillColor: "#FFFFFF",
    strokeWidth: 1,
    opacity: 1.0,
  };

  static toBackend(document: FloorPlanDocument): ComprehensiveUpdateFloorPlanPayloadDto {
    const midId = document.floorId || document.id || `floor-${Date.now()}`;
    const floors: FloorLevelDto[] = [{
      id: midId,
      name: document.activeFloorName || document.name || "Ground Floor",
      levelIndex: 0,
      elevationHeightMeters: 0,

      walls: (document.walls || []).map((wall: Wall) => ({
        id: wall.id,
        floorId: midId,
        startX: wall.startX,
        startY: wall.startY,
        endX: wall.endX,
        endY: wall.endY,
        thickness: wall.thickness,
        material: wall.material,
        style: { ...BackendPayloadMapper.DEFAULT_STYLE },
      })),

      rooms: (document.rooms || []).map((room: Room) => ({
        id: room.id,
        floorId: midId,
        name: room.name,
        targetLux: room.targetLux || 500,
        primaryGroup: room.primaryGroup || 1,
        vertexPoints: room.points || [],
        style: { ...BackendPayloadMapper.DEFAULT_STYLE },
      })),

      doors: (document.doors || []).map((door: DoorData | any) => ({
        id: door.id,
        wallId: door.wallId || "dwg-wall-root",
        hingeX: door.hingeX ?? door.x ?? door.startX ?? 0,
        hingeY: door.hingeY ?? door.y ?? door.startY ?? 0,
        wallAngle: door.wallAngle ?? 0,
        width: door.width ?? 900,
        height: door.height || 2100,
        isOutward: door.isOutward ?? false,
        isLeftHand: door.isLeftHand ?? false,
        name: door.name,
        properties: door.properties ?? {},
      })),

      windows: (document.windows || []).map((window: Window) => ({
        id: window.id,
        wallId: window.wallId || "dwg-wall-root",
        floorId: midId,
        width: window.width,
        height: window.height || 1200,
        x: window.x ?? window.startX ?? 0,
        y: window.y ?? window.startY ?? 0,
        startX: window.startX ?? window.x ?? 0,
        startY: window.startY ?? window.y ?? 0,
        endX: window.endX ?? (window.end?.x ?? (window.startX ?? 0) + (window.width ?? 1200)),
        endY: window.endY ?? (window.end?.y ?? (window.startY ?? 0)),
        transmittance: 0.7,
        style: { ...BackendPayloadMapper.DEFAULT_STYLE },
      })),

      electricalFixtures: (document.electricalFixtures || []).map((fixture: ElectricalFixture | any) => {
        const n = normalizeFixture(fixture);
        return {
          id: n.id,
          floorId: midId,
          x: n.x,
          y: n.y,
          type: n.type,
          daliGroup: n.daliGroup,
          style: { ...BackendPayloadMapper.DEFAULT_STYLE },
        };
      }),
    }];

    const importedDrawings: ImportedDrawingDto[] = (document.importedDrawings || []).map((d: ImportedDrawing) => ({
      id: d.id,
      fileName: d.fileName,
      fileSizeNumber: 0,
      scaleFactor: 1,
      offsetX: d.x || 0,
      offsetY: d.y || 0,
      rotationDegrees: 0,
      opacity: d.opacity || 0.5,
    }));

    const layers: DrawingLayerDto[] = [
      { id: "walls-layer", name: "Walls", visible: true, locked: false, order: 0 },
      { id: "doors-layer", name: "Doors", visible: true, locked: false, order: 1 },
      { id: "windows-layer", name: "Windows", visible: true, locked: false, order: 2 },
      { id: "rooms-layer", name: "Rooms", visible: true, locked: false, order: 3 },
      { id: "fixtures-layer", name: "Fixtures", visible: true, locked: false, order: 4 },
      { id: "imports-layer", name: "Imports", visible: true, locked: false, order: 5 },
    ];

    return {
      name: document.name || "Untitled",
      pixelsToMetresScale: 1,
      activeFloorId: midId,
      layers,
      importedDrawings,
      floors,
    };
  }

  static fromBackend(payload: ComprehensiveUpdateFloorPlanPayloadDto): FloorPlanDocument {
    const floor = payload.floors?.[0] || {
      id: `floor-${Date.now()}`,
      name: "Ground Floor",
      levelIndex: 0,
      elevationHeightMeters: 0,
      rooms: [], walls: [], doors: [], windows: [], electricalFixtures: [],
    };

    const rooms: Room[] = (floor.rooms || []).map((r: BackendRoomDto) => ({
      id: r.id || `room-${Date.now()}-${Math.random()}`,
      name: r.name || "Unnamed Room",
      points: (r.vertexPoints || []).map((p) => ({ x: p.x, y: p.y })),
      targetLux: r.targetLux || 500,
      primaryGroup: r.primaryGroup || 1,
    }));

    const walls: Wall[] = (floor.walls || []).map((w: BackendWallDto) => ({
      id: w.id || `wall-${Date.now()}-${Math.random()}`,
      startX: w.startX || 0,
      startY: w.startY || 0,
      endX: w.endX || 0,
      endY: w.endY || 0,
      thickness: w.thickness || 250,
      height: 2800,
      material: w.material || "Concrete",
    }));

    const doors: DoorData[] = (floor.doors || []).map((d: DoorDbPayload | any) => ({
      id: d.id || `door-${Date.now()}-${Math.random()}`,
      type: "Door",
      wallId: d.wallId || "dwg-wall-root",
      hingeX: d.hingeX ?? d.x ?? 0,
      hingeY: d.hingeY ?? d.y ?? 0,
      wallAngle: d.wallAngle ?? 0,
      width: d.width || 900,
      height: d.height || 2100,
      isOutward: Boolean(d.isOutward),
      isLeftHand: Boolean(d.isLeftHand),
      name: d.name,
      properties: d.properties || {},
    }));

    const windows: Window[] = (floor.windows || []).map((w: BackendWindowDto) => {
      const sx = w.startX ?? w.x ?? 0;
      const sy = w.startY ?? w.y ?? 0;
      const rad = w.width || 1200;

      let wallAngle = 0;
      let minDistance = Infinity;
      (floor.walls || []).forEach((wall: BackendWallDto) => {
        const x1 = wall.startX || 0; const y1 = wall.startY || 0;
        const x2 = wall.endX || 0; const y2 = wall.endY || 0;
        const l2 = Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2);
        let t = ((sx - x1) * (x2 - x1) + (sy - y1) * (y2 - y1)) / (l2 || 1);
        t = Math.max(0, Math.min(1, t));
        const dist = Math.hypot(sx - (x1 + t * (x2 - x1)), sy - (y1 + t * (y2 - y1)));
        if (dist < minDistance) { minDistance = dist; wallAngle = Math.atan2(y2 - y1, x2 - x1); }
      });

      const ex = sx + rad * Math.cos(wallAngle);
      const ey = sy + rad * Math.sin(wallAngle);

      return {
        id: w.id || `window-${Date.now()}-${Math.random()}`,
        x: sx, y: sy, startX: sx, startY: sy, endX: ex, endY: ey,
        start: { x: sx, y: sy }, end: { x: ex, y: ey },
        width: rad, height: w.height || 1200, type: "Window", wallId: w.wallId || "dwg-wall-root",
      } as any;
    });

    const electricalFixtures: ElectricalFixture[] = dedupeById(
      (floor.electricalFixtures || []).map(
        (f: BackendElectricalFixtureDto | any) => normalizeFixture(f) as any
      )
    );

    const importedDrawings: ImportedDrawing[] = (payload.importedDrawings || []).map((d: ImportedDrawingDto) => ({
      id: d.id || `import-${Date.now()}-${Math.random()}`,
      name: d.fileName || "Imported Drawing",
      fileName: d.fileName || "unknown.dwg",
      sourceFile: d.fileName || "unknown.dwg",
      importedAt: new Date().toISOString(),
      wallsCount: 0,
      x: d.offsetX || 0,
      y: d.offsetY || 0,
      width: 0,
      height: 0,
      opacity: d.opacity || 0.5,
      visible: true,
    }));

    const fixtureElements = electricalFixtures.map((f: any) => fixtureToElement(f));

    return {
      id: payload.name || `doc-${Date.now()}`,
      name: payload.name || "Untitled",
      walls, doors, windows, rooms, importedDrawings, electricalFixtures,
      elements: fixtureElements,
      floorId: payload.activeFloorId || floor.id,
      activeFloorName: floor.name,
      activeBuildingName: "Building A",
      activeProjectName: "Project",
    } as any;
  }

  static toLegacyBackend(document: FloorPlanDocument): any {
    const persistedElements = ((document as any).elements || []).filter(
      (el: any) => !isRoomPrimitive(el)
    );

    const drawnWalls = {
      walls: (document.walls || []).map((w) => ({
        id: w.id,
        startX: w.startX,
        startY: w.startY,
        endX: w.endX,
        endY: w.endY,
        thickness: w.thickness,
        height: w.height,
        material: w.material,
      })),

      doors: (document.doors || []).map((d: DoorData | any) => ({
        id: d.id,
        hingeX: d.hingeX ?? d.x ?? d.startX ?? 0,
        hingeY: d.hingeY ?? d.y ?? d.startY ?? 0,
        wallAngle: d.wallAngle ?? 0,
        width: d.width || 900,
        height: d.height || 2100,
        isOutward: d.isOutward ?? false,
        isLeftHand: d.isLeftHand ?? false,
        type: "Door",
        wallId: d.wallId || "dwg-wall-root",
        name: d.name,
        properties: d.properties ?? {},
      })),

      windows: (document.windows || []).map((w) => ({
        id: w.id,
        x: w.x || w.startX || 0,
        y: w.y || w.startY || 0,
        startX: w.startX || w.x || 0,
        startY: w.startY || w.y || 0,
        endX: w.endX ?? (w.end?.x ?? (w.startX ?? 0) + (w.width ?? 1200)),
        endY: w.endY ?? (w.end?.y ?? (w.startY ?? 0)),
        width: w.width,
        height: w.height,
        type: w.type || "Window",
        wallId: w.wallId || "dwg-wall-root",
      })),

      elements: persistedElements,
    };

    const definedRooms = (document.rooms || []).map((r) => ({
      id: r.id,
      name: r.name,
      points: r.points || [],
      targetLux: r.targetLux || 500,
      primaryGroup: r.primaryGroup || 1,
    }));

    const placedFixtures = {
      importedDrawings: (document.importedDrawings || []).map((d) => ({
        id: d.id, name: d.name, fileName: d.fileName, sourceFile: d.sourceFile,
        activeProjectName: d.activeProjectName, activeBuildingName: d.activeBuildingName,
        activeFloorName: d.activeFloorName, activeDocumentName: d.activeDocumentName,
        importedAt: d.importedAt, wallsCount: d.wallsCount, x: d.x, y: d.y,
        width: d.width, height: d.height, opacity: d.opacity, visible: d.visible,
      })),
      electricalFixtures: (document.electricalFixtures || []).map((f: any) =>
        normalizeFixture(f)
      ),
      lightingZones: (document as any).lightingZones || [],
    };

    return {
      Name: document.name || document.id,
      DrawnWallsJson: JSON.stringify(drawnWalls),
      DefinedRoomsJson: JSON.stringify(definedRooms),
      PlacedFixturesJson: JSON.stringify(placedFixtures),
      PixelsToMetresScale: 1,
    };
  }

  static fromLegacyBackend(payload: any): FloorPlanDocument {
    const parseField = (field: any) => {
      if (!field) return null;
      if (typeof field === "string") {
        try { return JSON.parse(field); } catch (e) { return null; }
      }
      return field;
    };

    const drawnWallsField = payload.DrawnWallsJson ?? payload.drawnWallsJson ?? null;
    const roomsField = payload.DefinedRoomsJson ?? payload.definedRoomsJson ?? null;
    const fixturesField = payload.PlacedFixturesJson ?? payload.placedFixturesJson ?? null;

    const documentName = payload.Name ?? payload.name ?? "Untitled";
    const documentId = payload.id ?? payload.Id ?? payload.documentId ?? null;

    const drawnWalls = parseField(drawnWallsField) || {};
    const definedRooms = parseField(roomsField) || [];
    const placedFixtures: any = parseField(fixturesField) || {
      importedDrawings: [],
      electricalFixtures: [],
      lightingZones: [],
    };

    const rawPersistedElements: any[] = Array.isArray(drawnWalls.elements)
      ? drawnWalls.elements
      : [];

    const dxfFixtureElements: any[] = [];
    const nonFixtureElements: any[] = [];

    for (const el of rawPersistedElements) {
      if (isFixturePrimitive(el)) {
        dxfFixtureElements.push(persistedFixtureToElement(el as PersistedElement));
      } else {
        nonFixtureElements.push(el);
      }
    }

    const persistedElements: any[] = nonFixtureElements.filter(
      (el) => !isRoomPrimitive(el)
    );

    const rawFixtures = Array.isArray(placedFixtures.electricalFixtures)
      ? placedFixtures.electricalFixtures
      : [];

    const allFixtureElements = dedupeById([
      ...rawFixtures.map(fixtureToElement),
      ...dxfFixtureElements,
    ]);

    const normalizedFixtures = dedupeById(
      rawFixtures.map((f: any) => normalizeFixture(f))
    );

    const elements = [...persistedElements, ...allFixtureElements];

    return {
      id: documentId || documentName || `doc-${Date.now()}`,
      name: documentName,

      // ── Metadata passthrough ─────────────────────────────────────
      // The backend returns breadcrumb + lock fields on the same
      // GET /documents/{id} request. Preserve them so Redux has them
      // and downstream consumers (breadcrumb widget, read-only
      // banner, save thunk) work correctly.
      projectName:
        payload.projectName ??
        payload.ProjectName ??
        payload.activeProjectName ??
        null,
      buildingName:
        payload.buildingName ??
        payload.BuildingName ??
        payload.activeBuildingName ??
        null,
      floorName:
        payload.floorName ??
        payload.FloorName ??
        payload.activeFloorName ??
        null,
      projectId: payload.projectId ?? payload.ProjectId ?? null,
      buildingId: payload.buildingId ?? payload.BuildingId ?? null,
      floorId: payload.floorId ?? payload.FloorId ?? null,
      isLocked: payload.isLocked === true || payload.IsLocked === true,
      lockedByUsername:
        payload.lockedByUsername ?? payload.LockedByUsername ?? null,
      lastModifiedBy:
        payload.lastModifiedBy ?? payload.LastModifiedBy ?? null,
      version:
        typeof payload.version === "number"
          ? payload.version
          : typeof payload.Version === "number"
          ? payload.Version
          : null,

      // Legacy field names that Redux reducers still read first
      activeProjectName:
        payload.projectName ??
        payload.ProjectName ??
        payload.activeProjectName ??
        null,
      activeBuildingName:
        payload.buildingName ??
        payload.BuildingName ??
        payload.activeBuildingName ??
        null,
      activeFloorName:
        payload.floorName ??
        payload.FloorName ??
        payload.activeFloorName ??
        null,
      activeDocumentName:
        payload.activeDocumentName ??
        payload.ActiveDocumentName ??
        documentName,

      elements,

      drawnWallsJson: typeof drawnWallsField === "string" ? drawnWallsField : null,
      definedRoomsJson: typeof roomsField === "string" ? roomsField : null,
      placedFixturesJson: typeof fixturesField === "string" ? fixturesField : null,

      walls: (drawnWalls.walls || []).map((w: any) => ({
        id: w.id,
        startX: w.startX || 0,
        startY: w.startY || 0,
        endX: w.endX || w.end?.x || 0,
        endY: w.endY || w.end?.y || 0,
        thickness: w.thickness || 250,
        height: w.height || 2800,
        material: w.material || "Concrete",
      })),

      doors: (drawnWalls.doors || []).map((d: any) => {
        const rawQuad = String(d.swingQuadrant || d.swingQuadrantAngle || "UR").toUpperCase();
        return {
          id: d.id,
          hingeX: d.hingeX ?? d.x ?? d.startX ?? 0,
          hingeY: d.hingeY ?? d.y ?? d.startY ?? 0,
          wallAngle: d.wallAngle ?? 0,
          width: d.width || 900,
          height: d.height || 2100,
          type: "Door",
          isOutward: d.isOutward !== undefined ? Boolean(d.isOutward) : ["UR", "DR"].includes(rawQuad),
          isLeftHand: d.isLeftHand !== undefined ? Boolean(d.isLeftHand) : ["UL", "DL"].includes(rawQuad),
          wallId: d.wallId || "dwg-wall-root",
          name: d.name,
          properties: d.properties ?? {},
        };
      }),

      windows: (drawnWalls.windows || []).map((w: any) => ({
        id: w.id,
        x: w.x || w.startX || 0,
        y: w.y || w.startY || 0,
        startX: w.startX || w.x || 0,
        startY: w.startY || w.y || 0,
        endX: w.endX || w.end?.x || 0,
        endY: w.endY || w.end?.y || 0,
        width: w.width || 1200,
        height: w.height || 1200,
        type: w.type || "Window",
        wallId: w.wallId || "dwg-wall-root",
      })),

      rooms: definedRooms.map((r: any) => ({
        id: r.id,
        name: r.name || "Unnamed Room",
        points: r.points || [],
        targetLux: r.targetLux || 500,
        primaryGroup: r.primaryGroup || 1,
      })),

      importedDrawings: (placedFixtures.importedDrawings || []).map((d: any) => ({
        id: d.id, name: d.name, fileName: d.fileName, sourceFile: d.sourceFile,
        activeProjectName: d.activeProjectName, activeBuildingName: d.activeBuildingName,
        activeFloorName: d.activeFloorName, activeDocumentName: d.activeDocumentName,
        importedAt: d.importedAt, wallsCount: d.wallsCount, x: d.x || 0, y: d.y || 0,
        width: d.width || 0, height: d.height || 0, opacity: d.opacity || 0.5,
        visible: d.visible !== false,
      })),

      electricalFixtures: normalizedFixtures,

      lightingZones: placedFixtures.lightingZones || [],
    } as any;
  }
}

export default BackendPayloadMapper;