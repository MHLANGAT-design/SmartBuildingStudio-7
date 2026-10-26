// src/modules/FixturePlacementStudio/utils/boundaries/windowBoundary.ts
import type { Point, RawElement } from '../mergeElements';
import { fragmentIntersectsPolygon, distanceToPerimeter } from './geometry';

const WINDOW_TOLERANCE_MM = 120;

export function windowIntersectsPolygon(el: RawElement, poly: Point[]): boolean {
  if (fragmentIntersectsPolygon(el, poly, 100)) return true;

  const g = el.compositeGeometry;
  if (g && g.startX !== undefined && g.startY !== undefined && g.endX !== undefined && g.endY !== undefined) {
    const mid = { x: (g.startX + g.endX) / 2, y: (g.startY + g.endY) / 2 };
    if (distanceToPerimeter(mid, poly) <= WINDOW_TOLERANCE_MM) return true;
    
    const start = { x: g.startX, y: g.startY };
    const end = { x: g.endX, y: g.endY };
    if (distanceToPerimeter(start, poly) <= WINDOW_TOLERANCE_MM) return true;
    if (distanceToPerimeter(end, poly) <= WINDOW_TOLERANCE_MM) return true;
  }

  return false;
}