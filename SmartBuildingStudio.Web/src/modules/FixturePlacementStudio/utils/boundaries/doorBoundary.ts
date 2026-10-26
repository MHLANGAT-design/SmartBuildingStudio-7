// src/modules/FixturePlacementStudio/utils/boundaries/doorBoundary.ts
import type { Point, RawElement } from '../mergeElements';
import { pointInPolygon, distanceToPerimeter, fragmentIntersectsPolygon } from './geometry';

const HINGE_TOL_MM = 110;
const HINGE_TOL_INTERSECTING_MM = 150;

export function doorBelongsToRoom(doorFragments: RawElement[], poly: Point[]): boolean {
  if (doorFragments.length === 0) return false;

  const g = doorFragments[0].compositeGeometry;

  let hingeDist = Infinity;
  if (g && g.hingeX !== undefined && g.hingeY !== undefined) {
    const hinge = { x: g.hingeX, y: g.hingeY };
    if (pointInPolygon(hinge, poly)) return true;
    hingeDist = distanceToPerimeter(hinge, poly);
    if (hingeDist <= HINGE_TOL_MM) return true;
  }

  const intersects = doorFragments.some(f => fragmentIntersectsPolygon(f, poly, 100));

  if (intersects && hingeDist <= HINGE_TOL_INTERSECTING_MM) return true;

  if (intersects && g) {
    const isSpecialBlock = g.isDouble === true || /double|opening/i.test(g.blockName || "");
    if (isSpecialBlock) return true;
  }

  return false;
}