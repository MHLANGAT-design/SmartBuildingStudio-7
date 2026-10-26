// src/modules/FloorPlanDesigner/Store/reclassifyHelpers.ts
//
// Conversions between the three semantic shapes (Wall / Door / Window)
// and the composite element's `type` field. Called by the
// reclassifyElement reducer in FloorPlanSlice. Kept in a separate file
// because the two builders are non-trivial and the reducer stays clean.
//
// All three shapes derive from the same underlying data: an axis from
// (startX, startY) to (endX, endY). Door is a special case — it takes
// the axis's start point as the hinge. Window takes both endpoints.
// Wall takes both endpoints plus thickness/material defaults.

import type { Wall, Door, Window, Point2D } from "./FloorPlanSlice";

/** Wall / Door / Window / raw composite type token. */
export type ReclassifyTarget = "wall" | "door" | "window" | "raw";

/** Extract the longest axis from a raw element's points. Same rule
 *  buildWall / buildDoor / buildWindow use: farthest pair. */
function axisFromPoints(
  points: Point2D[] | undefined
): { start: Point2D; end: Point2D } | null {
  if (!points || points.length < 2) return null;
  let best = { a: points[0], b: points[1], d: -1 };
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      const d = Math.hypot(points[i].x - points[j].x, points[i].y - points[j].y);
      if (d > best.d) best = { a: points[i], b: points[j], d };
    }
  }
  return { start: best.a, end: best.b };
}

/** True if the element currently lives in `document.walls`. */
export function wallShapeFrom(el: any): Wall | null {
  if (!el) return null;
  const axis =
    el.startX !== undefined && el.endX !== undefined
      ? { start: { x: el.startX, y: el.startY }, end: { x: el.endX, y: el.endY } }
      : axisFromPoints(el.points);
  if (!axis) return null;
  return {
    id: String(el.id ?? el.Id),
    startX: axis.start.x,
    startY: axis.start.y,
    endX: axis.end.x,
    endY: axis.end.y,
    thickness: Number(el.thickness ?? 120),
    height: Number(el.height ?? 2800),
    material: String(el.material ?? "Concrete"),
  };
}

/** True if the element currently lives in `document.doors`. */
export function doorShapeFrom(el: any): any | null {
  if (!el) return null;
  const axis =
    el.hingeX !== undefined && el.width !== undefined
      ? {
          start: { x: el.hingeX, y: el.hingeY },
          end: {
            x: el.hingeX + el.width * Math.cos(el.wallAngle ?? 0),
            y: el.hingeY + el.width * Math.sin(el.wallAngle ?? 0),
          },
        }
      : axisFromPoints(el.points);
  if (!axis) return null;
  const dx = axis.end.x - axis.start.x;
  const dy = axis.end.y - axis.start.y;
  const width = Math.hypot(dx, dy) || 900;
  let angle = Math.atan2(dy, dx);
  if (angle < 0) angle += 2 * Math.PI;
  return {
    id: String(el.id ?? el.Id),
    type: "Door",
    wallId: String(el.wallId ?? "dwg-wall-root"),
    hingeX: axis.start.x,
    hingeY: axis.start.y,
    wallAngle: Number(el.wallAngle ?? angle),
    width: Number(el.width ?? width),
    height: Number(el.height ?? 2100),
    isOutward: Boolean(el.isOutward),
    isLeftHand: Boolean(el.isLeftHand),
    properties: { ...(el.properties ?? {}), reclassified: true },
  };
}

/** True if the element currently lives in `document.windows`. */
export function windowShapeFrom(el: any): Window | null {
  if (!el) return null;
  const axis =
    el.startX !== undefined && el.endX !== undefined
      ? { start: { x: el.startX, y: el.startY }, end: { x: el.endX, y: el.endY } }
      : axisFromPoints(el.points);
  if (!axis) return null;
  return {
    id: String(el.id ?? el.Id),
    x: axis.start.x,
    y: axis.start.y,
    width: Math.hypot(axis.end.x - axis.start.x, axis.end.y - axis.start.y) || 1200,
    height: Number(el.height ?? 1200),
    type: "Window",
  } as any;
}