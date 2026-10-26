// src/modules/FixturePlacementStudio/utils/findRoomAtPoint.ts
//
// Point-in-room lookup for the fixture placement pipeline.
//
// Given a DrawingDocument (or the raw element array) and a world-space
// coordinate, returns the id of the room polygon that contains the
// point. Uses a standard ray-casting test against each room polygon.
//
// Room polygons are cheap to check: typical documents have under a
// hundred rooms, and a fixture placement is a single user click. If
// this ever needs to scale, the polygon set can be pre-indexed by
// bounding box.
//
// Returns undefined when the point is outside every room. A fixture
// placed in a corridor or exterior space legitimately has no room.

import type { DrawingDocument } from '@/modules/FloorPlanDesigner/Document/DrawingDocument';

interface Point {
  x: number;
  y: number;
}

interface RoomElement {
  id: string;
  points: Point[];
}

/**
 * Extract every room polygon from a DrawingDocument's element array.
 * Filters out rooms with fewer than 3 points (degenerate).
 */
function extractRoomPolygons(doc: DrawingDocument): RoomElement[] {
  const elements = doc.getElements();
  const out: RoomElement[] = [];

  for (const el of elements as any[]) {
    if (!el) continue;
    const t = String(el.type ?? '').toLowerCase();
    const isRoom = t === 'room' || t === 'rooms' || el.isRoom === true;
    if (!isRoom) continue;

    const rawPts = el.points || el.vertices || [];
    if (!Array.isArray(rawPts) || rawPts.length < 3) continue;

    const pts: Point[] = [];
    for (const p of rawPts) {
      if (!p) continue;
      const x = typeof p.x === 'number' ? p.x : NaN;
      const y = typeof p.y === 'number' ? p.y : NaN;
      if (!isFinite(x) || !isFinite(y)) continue;
      pts.push({ x, y });
    }
    if (pts.length < 3) continue;

    const id = String(el.id ?? el.Id ?? '');
    if (!id) continue;

    out.push({ id, points: pts });
  }

  return out;
}

/**
 * Ray-casting point-in-polygon test.
 *
 * Casts a horizontal ray from the test point to +infinity and counts
 * crossings with polygon edges. Odd crossings = inside.
 *
 * Standard implementation; robust against horizontal edges and
 * vertices lying exactly on the ray, which are the two cases that
 * break naive versions.
 */
function pointInPolygon(point: Point, polygon: Point[]): boolean {
  const { x, y } = point;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;

    // Edge crosses the horizontal ray at y.
    const intersects =
      yi > y !== yj > y &&
      x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;

    if (intersects) inside = !inside;
  }

  return inside;
}

/**
 * Find the room whose polygon contains the given world point.
 *
 * Returns the room's id, or undefined if the point is outside every
 * room or the document has no rooms.
 */
export function findRoomAtPoint(
  doc: DrawingDocument | null | undefined,
  worldX: number,
  worldY: number
): string | undefined {
  if (!doc) return undefined;
  if (!isFinite(worldX) || !isFinite(worldY)) return undefined;

  const rooms = extractRoomPolygons(doc);
  if (rooms.length === 0) return undefined;

  const point = { x: worldX, y: worldY };

  // Iterate in reverse so the topmost room wins if polygons overlap.
  for (let i = rooms.length - 1; i >= 0; i--) {
    if (pointInPolygon(point, rooms[i].points)) {
      return rooms[i].id;
    }
  }

  return undefined;
}

export default findRoomAtPoint;