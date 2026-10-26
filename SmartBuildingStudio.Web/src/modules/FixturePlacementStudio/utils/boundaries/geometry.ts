// src/modules/FixturePlacementStudio/utils/boundaries/geometry.ts
import type { Point, RawElement } from '../mergeElements';

export function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function pointToSegmentDistance(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return distance(p, a);
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

export function distanceToPerimeter(p: Point, poly: Point[]): number {
  if (poly.length < 2) return Infinity;
  let min = Infinity;
  for (let i = 0; i < poly.length; i++) {
    const j = (i + 1) % poly.length;
    const d = pointToSegmentDistance(p, poly[i], poly[j]);
    if (d < min) min = d;
  }
  return min;
}

export function pointInPolygon(p: Point, poly: Point[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x, yi = poly[i].y;
    const xj = poly[j].x, yj = poly[j].y;
    const intersects =
      yi > p.y !== yj > p.y &&
      p.x < ((xj - xi) * (p.y - yi)) / (yj - yi) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

export function segmentMidpoint(el: RawElement): Point {
  let sx = 0, sy = 0;
  for (const p of el.points) { sx += p.x; sy += p.y; }
  return { x: sx / el.points.length, y: sy / el.points.length };
}

export function segmentsIntersect(
  ax: number, ay: number,
  bx: number, by: number,
  cx: number, cy: number,
  dx: number, dy: number
): boolean {
  const cross = (ox: number, oy: number, px: number, py: number, qx: number, qy: number) =>
    (px - ox) * (qy - oy) - (py - oy) * (qx - ox);
  const d1 = cross(cx, cy, dx, dy, ax, ay);
  const d2 = cross(cx, cy, dx, dy, bx, by);
  const d3 = cross(ax, ay, bx, by, cx, cy);
  const d4 = cross(ax, ay, bx, by, dx, dy);
  return (
    ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
    ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))
  );
}

export function fragmentIntersectsPolygon(el: RawElement, poly: Point[], tolerance: number = 100): boolean {
  if (el.points.length === 0) return false;

  for (const p of el.points) {
    if (pointInPolygon(p, poly)) return true;
  }

  for (let i = 0; i < el.points.length - 1; i++) {
    const a = el.points[i];
    const b = el.points[i + 1];
    for (let j = 0; j < poly.length; j++) {
      const k = (j + 1) % poly.length;
      if (segmentsIntersect(a.x, a.y, b.x, b.y, poly[j].x, poly[j].y, poly[k].x, poly[k].y)) {
        return true;
      }
    }
  }

  const mid = segmentMidpoint(el);
  return distanceToPerimeter(mid, poly) <= tolerance;
}