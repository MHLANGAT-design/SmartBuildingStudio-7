import { Point2D } from "@/modules/FloorPlanDesigner/Utils/CoordinateTransforms";
import { getClosestPointOnSegment, getDistance } from "@/modules/FloorPlanDesigner/Utils/Geometry";

export interface StructuralWall {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  thickness: number;
}

/**
 * Searches for a structural wall matching current crosshair mouse targets within a precise radius limit.
 */
export function findWallAtPosition(point: Point2D, walls: StructuralWall[], searchRadius: number = 250): StructuralWall | null {
  let matchedWall: StructuralWall | null = null;
  let minimumDistance = Infinity;

  for (const wall of walls) {
    const segmentStart = { x: wall.startX, y: wall.startY };
    const segmentEnd = { x: wall.endX, y: wall.endY };
    
    const projectedPoint = getClosestPointOnSegment(point, segmentStart, segmentEnd);
    const calculatedDistance = getDistance(point, projectedPoint);

    // Establish tolerance parameters accounting for physical structural mass thickness variations
    const hitTolerance = Math.max(searchRadius, wall.thickness / 2);

    if (calculatedDistance <= hitTolerance && calculatedDistance < minimumDistance) {
      minimumDistance = calculatedDistance;
      matchedWall = wall;
    }
  }

  return matchedWall;
}
