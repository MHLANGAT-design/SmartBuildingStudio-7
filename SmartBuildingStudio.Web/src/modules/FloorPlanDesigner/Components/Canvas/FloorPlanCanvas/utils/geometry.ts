// src/modules/FloorPlanDesigner/Components/Canvas/FloorPlanCanvas/utils/geometry.ts
//
// Pure geometry helpers owned by FloorPlanCanvas. No React, no Redux,
// no imports from hooks/. Safe to unit-test in isolation.

import type { CanvasTransform, Viewport } from '../types';

/**
 * Shoelace area in m². Input points are in world units, where 1 world
 * unit = 1 mm, so we divide by 1e6 to convert mm² → m².
 */
export function calculateAreaFromPoints(
  points: { x: number; y: number }[],
): number {
  if (!points || points.length < 3) return 0;
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
  }
  return Math.abs(area) / 2 / 1_000_000;
}

/**
 * Cheap "how big is this document?" count used only for logging and
 * source-agreement checks — never for correctness.
 */
export function docSize(doc: any): number {
  if (!doc) return 0;
  return (
    (Array.isArray(doc.elements) ? doc.elements.length : 0) +
    (Array.isArray(doc.walls) ? doc.walls.length : 0) +
    (Array.isArray(doc.doors) ? doc.doors.length : 0) +
    (Array.isArray(doc.windows) ? doc.windows.length : 0) +
    (Array.isArray(doc.rooms) ? doc.rooms.length : 0)
  );
}

/**
 * Returns the group key for a semantic element, or null. Group keys
 * are used to fan out selection/deletion from a child (e.g. a door)
 * to its parent wall group.
 */
export function getGroupKey(el: any): string | null {
  const g = el?.groupId ?? el?.GroupId ?? null;
  if (g === null || g === undefined || g === '') return null;
  return String(g);
}

/**
 * Builds a { worldToScreen, screenToWorld } pair from a transform
 * snapshot. Both directions are exact inverses of one another.
 */
export function makeViewport(tf: CanvasTransform): Viewport {
  const { finalScale, yScale, centerX, centerY, width, height, offsetX, offsetY } = tf;
  return {
    worldToScreen: (wp) => ({
      x: width / 2 + offsetX + (wp.x - centerX) * finalScale,
      y: height / 2 + offsetY + (wp.y - centerY) * yScale,
    }),
    screenToWorld: (sp) => ({
      x: (sp.x - width / 2 - offsetX) / finalScale + centerX,
      y: (sp.y - height / 2 - offsetY) / yScale + centerY,
    }),
  };
}