// src/modules/FixturePlacementStudio/utils/roomTopology.ts

import type { DrawingDocument } from '@/modules/FloorPlanDesigner/Document/DrawingDocument';
import {
  parseElements,
  mergeWalls,
  clusterByGrid,
  type RawElement,
} from '@/modules/FixturePlacementStudio/utils/mergeElements';
import type { LayerCategory } from '@/modules/FixturePlacementStudio/utils/layerClassifier';
import { windowIntersectsPolygon } from './boundaries/windowBoundary';
import { doorBelongsToRoom } from './boundaries/doorBoundary';
import {
  pointInPolygon,
  fragmentIntersectsPolygon,
  distance,
} from './boundaries/geometry';

export interface Point { x: number; y: number; }
export interface WallSegment { ax: number; ay: number; bx: number; by: number; }

export interface RoomEntry {
  roomId: string;
  name: string;
  polygon: Point[];
  areaM2: number;
  centroid: Point;
  perimeterMeters: number;

  wallFragmentIds: string[];
  doorFragmentIds: string[];
  windowFragmentIds: string[];
  stairFragmentIds: string[];
  handrailFragmentIds: string[];
  unknownFragmentIds: string[];

  logicalWallCount: number;
  logicalDoorCount: number;
  logicalWindowCount: number;
  logicalStairCount: number;
  logicalHandrailCount: number;

  boundarySegments: WallSegment[];
}

export interface RoomTopology {
  rooms: RoomEntry[];
  byId: Record<string, RoomEntry>;
}

const DOOR_CELL_MM = 1200;
const WINDOW_CELL_MM = 1500;
const STAIR_CELL_MM = 800;
const MM2_PER_M2 = 1_000_000;
const MM_PER_M = 1000;

function polygonAreaM2(poly: Point[]): number {
  if (poly.length < 3) return 0;
  let area = 0;
  for (let i = 0; i < poly.length; i++) {
    const j = (i + 1) % poly.length;
    area += poly[i].x * poly[j].y;
    area -= poly[j].x * poly[i].y;
  }
  return Math.abs(area) / 2 / MM2_PER_M2;
}

function polygonCentroid(poly: Point[]): Point {
  if (poly.length === 0) return { x: 0, y: 0 };
  let cx = 0, cy = 0;
  for (const p of poly) { cx += p.x; cy += p.y; }
  return { x: cx / poly.length, y: cy / poly.length };
}

export function buildRoomTopology(
  doc: DrawingDocument | null | undefined
): RoomTopology {
  const empty: RoomTopology = { rooms: [], byId: {} };
  if (!doc) return empty;

  const elements = doc.getElements();
  if (!elements || elements.length === 0) return empty;

  const parsed = parseElements(elements as any[]);
  const rooms = parsed.filter((e) => e.category === 'room');

  const byCategory = new Map<LayerCategory, RawElement[]>();
  for (const el of parsed) {
    if (el.category === 'room') continue;
    let list = byCategory.get(el.category);
    if (!list) { list = []; byCategory.set(el.category, list); }
    list.push(el);
  }

  const wallElements = byCategory.get('wall') ?? [];
  const doorElements = byCategory.get('door') ?? [];
  const windowElements = byCategory.get('window') ?? [];
  const stairElements = byCategory.get('stair') ?? [];
  const handrailElements = byCategory.get('handrail') ?? [];
  const unknownElements = byCategory.get('unknown') ?? [];

  const doorsByComposite = new Map<string, RawElement[]>();
  for (const d of doorElements) {
    const cid = d.compositeId ?? d.id;
    if (!doorsByComposite.has(cid)) doorsByComposite.set(cid, []);
    doorsByComposite.get(cid)!.push(d);
  }

  const roomEntries: RoomEntry[] = [];

  for (const room of rooms) {
    const poly = room.points;

    // ── Walls ──
    const wallFragmentIds: string[] = [];
    const boundaryWallElements: RawElement[] = [];
    const boundarySegments: WallSegment[] = [];

    for (const wall of wallElements) {
      if (!fragmentIntersectsPolygon(wall, poly, 100)) continue;
      wallFragmentIds.push(wall.id);
      boundaryWallElements.push(wall);
      for (let i = 0; i < wall.points.length - 1; i++) {
        boundarySegments.push({
          ax: wall.points[i].x, ay: wall.points[i].y,
          bx: wall.points[i + 1].x, by: wall.points[i + 1].y,
        });
      }
    }

    // ── Doors ──
    const doorFragmentIds: string[] = [];
    const boundaryDoorElements: RawElement[] = [];

    for (const [, frags] of doorsByComposite) {
      if (!doorBelongsToRoom(frags, poly)) continue;
      for (const f of frags) {
        doorFragmentIds.push(f.id);
        boundaryDoorElements.push(f);
      }
    }

    // ── Windows ──
    const windowFragmentIds: string[] = [];
    const boundaryWindowElements: RawElement[] = [];
    for (const w of windowElements) {
      if (!windowIntersectsPolygon(w, poly)) continue;
      windowFragmentIds.push(w.id);
      boundaryWindowElements.push(w);
    }

    // ── Stairs ──
    const stairFragmentIds: string[] = [];
    const boundaryStairElements: RawElement[] = [];
    for (const s of stairElements) {
      if (!fragmentIntersectsPolygon(s, poly, 100)) continue;
      stairFragmentIds.push(s.id);
      boundaryStairElements.push(s);
    }

    // ── Handrails ──
    const handrailFragmentIds: string[] = [];
    const boundaryHandrailElements: RawElement[] = [];
    for (const h of handrailElements) {
      if (!fragmentIntersectsPolygon(h, poly, 100)) continue;
      handrailFragmentIds.push(h.id);
      boundaryHandrailElements.push(h);
    }

    // ── Unknown ──
    const unknownFragmentIds: string[] = [];
    for (const u of unknownElements) {
      if (fragmentIntersectsPolygon(u, poly, 100)) unknownFragmentIds.push(u.id);
    }

    const logicalWallCount = mergeWalls(boundaryWallElements).length;
    const logicalDoorCount = clusterByGrid(boundaryDoorElements, DOOR_CELL_MM).length;
    const logicalWindowCount = clusterByGrid(boundaryWindowElements, WINDOW_CELL_MM).length;
    const logicalStairCount = clusterByGrid(boundaryStairElements, STAIR_CELL_MM).length;
    const logicalHandrailCount = mergeWalls(boundaryHandrailElements).length;

    let perimeterMm = 0;
    for (let i = 0; i < poly.length; i++) {
      const j = (i + 1) % poly.length;
      perimeterMm += distance(poly[i], poly[j]);
    }

    roomEntries.push({
      roomId: room.id,
      name: room.name || 'Unnamed Room',
      polygon: poly,
      areaM2: polygonAreaM2(poly),
      centroid: polygonCentroid(poly),
      perimeterMeters: perimeterMm / MM_PER_M,
      wallFragmentIds,
      doorFragmentIds,
      windowFragmentIds,
      stairFragmentIds,
      handrailFragmentIds,
      unknownFragmentIds,
      logicalWallCount,
      logicalDoorCount,
      logicalWindowCount,
      logicalStairCount,
      logicalHandrailCount,
      boundarySegments,
    });
  }

  const byId: Record<string, RoomEntry> = {};
  for (const r of roomEntries) byId[r.roomId] = r;
  return { rooms: roomEntries, byId };
}

export function findRoomContaining(
  topology: RoomTopology,
  x: number,
  y: number
): RoomEntry | null {
  const p = { x, y };
  for (let i = topology.rooms.length - 1; i >= 0; i--) {
    if (pointInPolygon(p, topology.rooms[i].polygon)) return topology.rooms[i];
  }
  return null;
}

export function getWallsForRoom(topology: RoomTopology, roomId: string): string[] {
  return topology.byId[roomId]?.wallFragmentIds ?? [];
}
export function getDoorsForRoom(topology: RoomTopology, roomId: string): string[] {
  return topology.byId[roomId]?.doorFragmentIds ?? [];
}
export function getWindowsForRoom(topology: RoomTopology, roomId: string): string[] {
  return topology.byId[roomId]?.windowFragmentIds ?? [];
}

export default buildRoomTopology;