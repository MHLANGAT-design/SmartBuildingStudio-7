// src/modules/FloorPlanDesigner/Utils/DatabaseToCanvasTransformer.ts
import type { ArchitecturalPlan } from '@/modules/FloorPlanDesigner/core/types';
import { store } from "@/Application/ConfigureStore";
import { DoorData } from "@/modules/FloorPlanDesigner/core/types/Door.types";

// Helper: Calculate area from points
function calculateAreaFromPoints(points: { x: number; y: number }[]): number {
  if (!points || points.length < 3) return 0;
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
  }
  return Math.abs(area) / 2 / 1000000;
}

function parseDatabaseRooms(rooms: any[], globalSelection: any, hiddenLayersMap: any): any[] {
  if (hiddenLayersMap['rooms'] || !Array.isArray(rooms)) return [];
  return rooms
    .map((room: any) => {
      if (!room) return null;
      const rawPointsList = room.points || room.vertices || room.Vertices || [];
      const selId = globalSelection
        ? String(globalSelection.id || globalSelection.data?.id || globalSelection.Id || '').trim()
        : '';
      const curId = String(room.id || room._id || '').trim();
      const isSelected = selId !== '' && curId !== '' && selId === curId;

      const parsedVertices = rawPointsList.map((v: any) => ({
        x: Number(v.x ?? v.X ?? 0),
        y: Number(v.y ?? v.Y ?? 0)
      }));
      const targetLux = room.targetLux ?? 500;
      const primaryGroup = room.primaryGroup ?? 1;
      const area = calculateAreaFromPoints(parsedVertices);

      const baseObj = {
        ...room,
        type: 'room',
        id: room.id || room._id,
        Id: room.id || room._id,
        isRoom: true,
        name: room.name || 'Control Zone',
        targetLux: targetLux,
        primaryGroup: primaryGroup,
        area: area,
        isSelected: isSelected,
        selected: isSelected,
        fillStyle: isSelected ? 'rgba(5, 255, 196, 0.25)' : room.fillStyle || 'rgba(74, 222, 128, 0.15)',
        strokeStyle: isSelected ? '#05FFC4' : room.strokeStyle || '#4ADE80',
        layer: 'rooms',
        points: parsedVertices,
        vertices: parsedVertices,
        selectionPoints: parsedVertices,
        style: {
          strokeColor: isSelected ? '#05FFC4' : room.strokeStyle || '#4ADE80',
          fillColor: isSelected ? 'rgba(5, 255, 196, 0.25)' : room.fillStyle || 'rgba(74, 222, 128, 0.15)',
          strokeWidth: isSelected ? 3.5 : 1.5
        }
      };

      return { ...baseObj, properties: { ...baseObj } };
    })
    .filter(Boolean);
}

function parseDatabaseWalls(walls: any[], globalSelection: any, hiddenLayersMap: any): any[] {
  if (hiddenLayersMap['walls'] || hiddenLayersMap['structural-layer'] || !Array.isArray(walls)) return [];
  return walls
    .map((wall: any) => {
      if (!wall) return null;
      const selId = globalSelection
        ? String(globalSelection.id || globalSelection.data?.id || globalSelection.Id || '').trim()
        : '';
      const curId = String(wall.id || wall._id || '').trim();
      const isSelected = selId !== '' && curId !== '' && selId === curId;

      const sx = Number(wall.startX ?? wall.X ?? wall.x ?? 0);
      const sy = Number(wall.startY ?? wall.Y ?? wall.y ?? 0);
      const ex = Number(wall.endX ?? wall.X2 ?? 0);
      const ey = Number(wall.endY ?? wall.Y2 ?? 0);
      const thick = Number(wall.thickness || 150);

      const wallAngle = Math.atan2(ey - sy, ex - sx);
      const perpAngle = wallAngle + Math.PI / 2;
      const offsetW = Math.max(thick / 2, 160);

      const boundingPolygon = [
        { x: sx + Math.cos(perpAngle) * offsetW, y: sy + Math.sin(perpAngle) * offsetW },
        { x: ex + Math.cos(perpAngle) * offsetW, y: ey + Math.sin(perpAngle) * offsetW },
        { x: ex - Math.cos(perpAngle) * offsetW, y: ey - Math.sin(perpAngle) * offsetW },
        { x: sx - Math.cos(perpAngle) * offsetW, y: sy - Math.sin(perpAngle) * offsetW }
      ];

      const baseObj = {
        ...wall,
        type: 'Wall',
        id: wall.id || wall._id,
        Id: wall.id || wall._id,
        isSelected,
        selected: isSelected,
        style: {
          strokeColor: isSelected ? '#38BDF8' : wall.style?.strokeColor || '#4B5563',
          strokeWidth: isSelected ? 4.5 : wall.style?.strokeWidth || 2.5,
          fillColor: 'transparent'
        },
        points: [
          { x: sx, y: sy },
          { x: ex, y: ey }
        ],
        selectionPoints: boundingPolygon,
        startX: sx,
        startY: sy,
        endX: ex,
        endY: ey
      };

      return { ...baseObj, properties: { ...baseObj } };
    })
    .filter(Boolean);
}

function parseDatabaseDoors(doors: any[], globalSelection: any, hiddenLayersMap: any, wallsList: any[] = []): DoorData[] {
  if (hiddenLayersMap['doors'] || !Array.isArray(doors)) return [];
  return doors
    .map((door: any) => {
      if (!door) return null;
      const isSelected =
        globalSelection &&
        String(globalSelection.id || globalSelection.Id || globalSelection.data?.id || '') ===
          String(door.id || door._id);

      const hingeX = Number(door.hingeX);
      const hingeY = Number(door.hingeY);
      const wallAngle = Number(door.wallAngle);
      const width = Number(door.width);
      const height = Number(door.height ?? 2100);

      const perpAngle = wallAngle + Math.PI / 2;
      const rex = hingeX + width * Math.cos(wallAngle);
      const rey = hingeY + width * Math.sin(wallAngle);
      const thicknessThreshold = 200;

      const selectionPoints = [
        { x: hingeX + Math.cos(perpAngle) * thicknessThreshold, y: hingeY + Math.sin(perpAngle) * thicknessThreshold },
        { x: rex + Math.cos(perpAngle) * thicknessThreshold, y: rey + Math.sin(perpAngle) * thicknessThreshold },
        { x: rex - Math.cos(perpAngle) * thicknessThreshold, y: rey - Math.sin(perpAngle) * thicknessThreshold },
        { x: hingeX - Math.cos(perpAngle) * thicknessThreshold, y: hingeY - Math.sin(perpAngle) * thicknessThreshold }
      ];

      const baseDoor: DoorData = {
        id: String(door.id || door._id),
        type: 'Door',
        wallId: String(door.wallId || ''),
        hingeX,
        hingeY,
        wallAngle,
        width,
        height,
        isOutward: Boolean(door.isOutward),
        isLeftHand: Boolean(door.isLeftHand),
        name: door.name,
        properties: door.properties || {},
        isSelected,
        selected: isSelected,
        selectionPoints,
        style: {
          strokeColor: isSelected ? '#00FFC4' : door.style?.strokeColor || '#EAB308',
          fillColor: door.style?.fillColor || 'transparent',
          strokeWidth: isSelected ? 3.0 : door.style?.strokeWidth || 1.5,
          opacity: door.style?.opacity ?? 1
        }
      };

      return { ...baseDoor, properties: { ...baseDoor } };
    })
    .filter(Boolean) as DoorData[];
}

function parseDatabaseWindows(windows: any[], globalSelection: any, hiddenLayersMap: any, wallsList: any[] = []): any[] {
  if (hiddenLayersMap['windows'] || !Array.isArray(windows)) return [];
  return windows
    .map((win: any) => {
      if (!win) return null;
      const isSelected =
        globalSelection &&
        String(globalSelection.id || globalSelection.Id || globalSelection.data?.id || '') ===
          String(win.id || win._id);
      const cx = Number(win.startX ?? win.x ?? 0);
      const cy = Number(win.startY ?? win.y ?? 0);
      const wWidth = Number(win.width || 1200);
      const rex = Number(win.endX ?? cx);
      const rey = Number(win.endY ?? cy);

      const winAngle = Math.atan2(rey - cy, rex - cx);
      const perpAngle = winAngle + Math.PI / 2;
      const thicknessThreshold = 200;

      const boundingPolygon = [
        { x: cx + Math.cos(perpAngle) * thicknessThreshold, y: cy + Math.sin(perpAngle) * thicknessThreshold },
        { x: rex + Math.cos(perpAngle) * thicknessThreshold, y: rey + Math.sin(perpAngle) * thicknessThreshold },
        { x: rex - Math.cos(perpAngle) * thicknessThreshold, y: rey - Math.sin(perpAngle) * thicknessThreshold },
        { x: cx - Math.cos(perpAngle) * thicknessThreshold, y: cy - Math.sin(perpAngle) * thicknessThreshold }
      ];

      const baseObj = {
        ...win,
        type: 'Window',
        id: win.id || win._id,
        Id: win.id || win._id,
        isSelected,
        selected: isSelected,
        start: { x: cx, y: cy },
        end: { x: rex, y: rey },
        startX: cx,
        startY: cy,
        endX: rex,
        endY: rey,
        width: wWidth,
        style: {
          strokeColor: isSelected ? '#60A5FA' : win.style?.strokeColor || '#38BDF8',
          fillColor: 'transparent',
          strokeWidth: isSelected ? 3.0 : 1.5
        },
        points: [
          { x: cx, y: cy },
          { x: rex, y: rey }
        ],
        selectionPoints: boundingPolygon
      };

      return { ...baseObj, properties: { ...baseObj } };
    })
    .filter(Boolean);
}

/**
 * Collect fixtures from every plausible source.
 */
function collectFixturesFromAnywhere(rawDoc: any, dbPayload: any): any[] {
  const candidates: Record<string, any> = {
    'rawDoc.electricalFixtures': rawDoc?.electricalFixtures,
    'dbPayload.electricalFixtures': dbPayload?.electricalFixtures,
    'dbPayload.document.electricalFixtures': dbPayload?.document?.electricalFixtures,
    'store.floorPlan.document.electricalFixtures': (() => {
      try { return store.getState()?.floorPlan?.document?.electricalFixtures; }
      catch { return undefined; }
    })(),
    'store.fixture.layout.fixtures': (() => {
      try { return (store.getState() as any)?.fixture?.layout?.fixtures; }
      catch { return undefined; }
    })(),
  };

  for (const v of Object.values(candidates)) {
    if (Array.isArray(v) && v.length > 0) return v;
  }
  return [];
}

/**
 * Project fixtures into the `elements` array as first-class point primitives.
 */
function buildFixtureElements(fixtures: any[], globalSelection: any, hiddenLayersMap: any): any[] {
  if (hiddenLayersMap['fixtures'] || hiddenLayersMap['fixture']) return [];
  if (!Array.isArray(fixtures)) return [];

  const selId = globalSelection
    ? String(globalSelection.id || globalSelection.data?.id || globalSelection.Id || '').trim()
    : '';

  return fixtures
    .map((f: any, i: number) => {
      if (!f) return null;
      const id = String(f.id ?? f.Id ?? `fixture-el-${i}`);
      const curId = id.trim();
      const isSelected = selId !== '' && curId !== '' && selId === curId;

      const x = Number(f.x ?? 0);
      const y = Number(f.y ?? 0);
      if (!Number.isFinite(x) || !Number.isFinite(y)) return null;

      const kind = String(f.kind ?? f.type ?? 'luminaire');

      const baseObj = {
        ...f,
        type: 'fixture',
        id,
        Id: id,
        kind,
        fixtureType: kind,
        points: [{ x, y }],
        vertices: [{ x, y }],
        selectionPoints: [{ x, y }],
        layer: 'fixtures',
        originalLayer: 'fixtures',
        rotation: Number(f.rotation ?? 0),
        productId: f.productId,
        roomId: f.roomId,
        elevation: f.elevation,
        layerId: f.layerId,
        daliGroup: Number(f.daliGroup ?? 1),
        isSelected,
        selected: isSelected,
        style: {
          strokeColor: isSelected ? '#FDE047' : '#0B0F19',
          fillColor: isSelected ? '#FDE047' : '#94A3B8',
          strokeWidth: isSelected ? 2.5 : 1.5,
        },
      };

      return { ...baseObj, properties: { ...baseObj } };
    })
    .filter(Boolean) as any[];
}

function reduxDocRef(): any {
  try {
    return store.getState().floorPlan?.document || {};
  } catch {
    return {};
  }
}

export function transformDbSchemaToCanvasSchema(dbPayload: any): ArchitecturalPlan {
  if (!dbPayload) return { elements: [] } as any;

  const rawDoc = dbPayload?.document || dbPayload?.Document || dbPayload || {};

  // ─── FAST PATH ──────────────────────────────────────────────────────
  let parsedBox: any = null;
  const rawBox = rawDoc.drawnWallsJson || dbPayload?.drawnWallsJson;
  if (typeof rawBox === 'string' && rawBox.trim() !== '') {
    try { parsedBox = JSON.parse(rawBox); } catch (e) { parsedBox = null; }
  } else if (rawBox && typeof rawBox === 'object') {
    parsedBox = rawBox;
  }

  const hiddenLayersMap = (window as any).__hiddenLayersMap || {};
  const floorPlanState = store.getState().floorPlan || {};
  const globalSelection =
    floorPlanState.selection || (window as any).__currentSelection || null;

  const persistedElements = parsedBox?.elements;
  if (Array.isArray(persistedElements) && persistedElements.length > 0) {
    const parsedRooms = parseDatabaseRooms(
      rawDoc.rooms || [],
      globalSelection,
      hiddenLayersMap
    ).map((r: any) => ({ ...r, properties: { ...r } }));

    const fixturesForPlan = collectFixturesFromAnywhere(rawDoc, dbPayload);

    const fixtureElements = buildFixtureElements(
      fixturesForPlan,
      globalSelection,
      hiddenLayersMap
    );

    // ── Drop ALL room primitives from the DXF-persisted element stream ──
    // drawnWallsJson.elements contains room polygons from the original
    // import. Those rooms are geometry-only (no name) and duplicate the
    // semantic rooms living in definedRoomsJson. Semantic rooms are the
    // single source of truth on the canvas, so drop every room
    // primitive from the DXF stream regardless of id.
    const filteredPersistedElements = persistedElements.filter((el: any) => {
      const t = String(el?.type ?? "").toLowerCase();
      const isRoomPrimitive =
        t === "room" || t === "rooms" || el?.isRoom === true;
      return !isRoomPrimitive;
    });

    const win = window as any;
    if (!win.__floorPlanSidebarElementsBridge) win.__floorPlanSidebarElementsBridge = {};
    win.__floorPlanSidebarElementsBridge.rooms = parsedRooms;

    const activeDoc = win.__floorPlanActiveDocumentInstance || {};
    if (activeDoc && !Object.isFrozen(activeDoc)) {
      try {
        activeDoc.elements = [
          ...filteredPersistedElements,
          ...parsedRooms,
          ...fixtureElements,
        ];
        activeDoc.rooms = parsedRooms;
      } catch (e) {}
    }

    return {
      elements: [
        ...filteredPersistedElements,
        ...parsedRooms,
        ...fixtureElements,
      ],
      walls: parsedBox?.walls || rawDoc.walls || [],
      doors: parsedBox?.doors || rawDoc.doors || [],
      windows: parsedBox?.windows || rawDoc.windows || [],
      rooms: parsedRooms,
      electricalFixtures: fixturesForPlan,
      lightingZones:
        rawDoc.lightingZones ||
        dbPayload?.lightingZones ||
        reduxDocRef().lightingZones ||
        [],
    } as any;
  }

  // ─── SLOW PATH ─────────────────────────────────────────────────────
  let roomsList: any[] = [];
  let wallsList: any[] = [];
  let doorsList: any[] = [];
  let windowsList: any[] = [];

  if (Array.isArray(dbPayload)) {
    roomsList = dbPayload;
  } else {
    roomsList = rawDoc.rooms || rawDoc.Rooms || [];
    if (parsedBox) {
      wallsList = parsedBox.walls || [];
      doorsList = parsedBox.doors || [];
      windowsList = parsedBox.windows || [];
    } else {
      wallsList = rawDoc.walls || [];
      doorsList = rawDoc.doors || [];
      windowsList = rawDoc.windows || [];
    }
  }

  const reduxDoc = floorPlanState.document || {};
  if (wallsList.length === 0 && reduxDoc.walls?.length) wallsList = reduxDoc.walls;
  if (doorsList.length === 0 && reduxDoc.doors?.length) doorsList = reduxDoc.doors;
  if (windowsList.length === 0 && reduxDoc.windows?.length) windowsList = reduxDoc.windows;
  if (roomsList.length === 0 && reduxDoc.rooms?.length) roomsList = reduxDoc.rooms;

  const fixturesList = collectFixturesFromAnywhere(rawDoc, dbPayload);

  const parsedWalls = parseDatabaseWalls(wallsList, globalSelection, hiddenLayersMap).map((w: any) => ({
    ...w,
    properties: { ...w }
  }));
  const parsedDoors = parseDatabaseDoors(doorsList, globalSelection, hiddenLayersMap, wallsList).map((d: any) => ({
    ...d,
    properties: { ...d }
  }));
  const parsedWindows = parseDatabaseWindows(windowsList, globalSelection, hiddenLayersMap, wallsList).map(
    (w: any) => ({ ...w, properties: { ...w } })
  );
  const parsedRooms = parseDatabaseRooms(roomsList, globalSelection, hiddenLayersMap).map((r: any) => ({
    ...r,
    properties: { ...r }
  }));
  const parsedFixtures = buildFixtureElements(fixturesList, globalSelection, hiddenLayersMap);

  const win = window as any;
  if (!win.__floorPlanSidebarElementsBridge) win.__floorPlanSidebarElementsBridge = {};
  win.__floorPlanSidebarElementsBridge.walls = parsedWalls;
  win.__floorPlanSidebarElementsBridge.doors = parsedDoors;
  win.__floorPlanSidebarElementsBridge.windows = parsedWindows;
  win.__floorPlanSidebarElementsBridge.rooms = parsedRooms;

  const activeDoc = win.__floorPlanActiveDocumentInstance || {};
  if (activeDoc && !Object.isFrozen(activeDoc)) {
    try {
      activeDoc.walls = parsedWalls;
      activeDoc.doors = parsedDoors;
      activeDoc.windows = parsedWindows;
      activeDoc.rooms = parsedRooms;
    } catch (e) {}
  }

  return {
    elements: [
      ...parsedWalls,
      ...parsedDoors,
      ...parsedWindows,
      ...parsedRooms,
      ...parsedFixtures,
    ],
    walls: parsedWalls,
    doors: parsedDoors,
    windows: parsedWindows,
    rooms: parsedRooms,
    electricalFixtures: fixturesList,
    lightingZones:
      rawDoc.lightingZones ||
      reduxDoc.lightingZones ||
      [],
  } as any;
}

export default transformDbSchemaToCanvasSchema;