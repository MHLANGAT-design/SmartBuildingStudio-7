import { Point2D } from "@/modules/FloorPlanDesigner/Utils/CoordinateTransforms";

export interface DiscoveredRoomBoundary {
  vertices: Point2D[];
  associatedWallIds: string[];
}

/**
 * Audits whether an arbitrary point, such as a DALI sensor node, falls within an isolated room enclosure.
 */
export function isPointInRoomPolygon(point: Point2D, vertices: Point2D[]): boolean {
  let isInside = false;
  const vertexCount = vertices.length;
  if (vertexCount < 3) return false;

  // Standard Ray-Casting algorithm to compute geometric boundary interceptions
  for (let currentIdx = 0, previousIdx = vertexCount - 1; currentIdx < vertexCount; previousIdx = currentIdx++) {
    const currentVertex = vertices[currentIdx];
    const previousVertex = vertices[previousIdx];

    const triggersYBound = (currentVertex.y > point.y) !== (previousVertex.y > point.y);
    const intersectsXVector = point.x < (previousVertex.x - currentVertex.x) * (point.y - currentVertex.y) / 
      ((previousVertex.y - currentVertex.y) || 1) + currentVertex.x;

    if (triggersYBound && intersectsXVector) {
      isInside = !isInside;
    }
  }

  return isInside;
}
