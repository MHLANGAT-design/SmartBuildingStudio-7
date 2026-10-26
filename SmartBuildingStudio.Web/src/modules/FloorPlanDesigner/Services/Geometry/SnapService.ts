import { Point2D } from "@/modules/FloorPlanDesigner/Models/Base/Geometry";
import { Wall } from "@/modules/FloorPlanDesigner/Models/Wall";
import { WallHitTestService } from "@/modules/FloorPlanDesigner/Services/Geometry/WallHitTestService";

export enum SnapType {
  None = "none",
  Endpoint = "endpoint",
  Midpoint = "midpoint",
  Wall = "wall",
}

export interface SnapResult {
  snapped: boolean;
  type: SnapType;
  position: Point2D;
  wall?: Wall;
}

export class SnapService {
  /**
   * Finds the best snap position for the cursor based on structural priority.
   */
  public static snap(
    cursor: Point2D,
    walls: readonly Wall[],
    tolerance: number
  ): SnapResult {
    const toleranceSq = tolerance * tolerance;
    let closestEndpoint: SnapResult | undefined;
    let minEndDistSq = Number.POSITIVE_INFINITY;

    // 1. Endpoint snapping (Highest Priority)
    for (const wall of walls) {
      const endpoints = [wall.start, wall.end];
      for (const endpoint of endpoints) {
        const dx = endpoint.x - cursor.x;
        const dy = endpoint.y - cursor.y;
        const distSq = dx * dx + dy * dy;

        if (distSq <= toleranceSq && distSq < minEndDistSq) {
          minEndDistSq = distSq;
          closestEndpoint = {
            snapped: true,
            type: SnapType.Endpoint,
            position: endpoint,
            wall,
          };
        }
      }
    }

    if (closestEndpoint) return closestEndpoint;

    // 2. Midpoint snapping (Medium Priority)
    let midpointSnap: SnapResult | undefined;
    let minMidDistSq = Number.POSITIVE_INFINITY;

    for (const wall of walls) {
      const midpoint = {
        x: (wall.start.x + wall.end.x) / 2,
        y: (wall.start.y + wall.end.y) / 2,
      };

      const dx = midpoint.x - cursor.x;
      const dy = midpoint.y - cursor.y;
      const distSq = dx * dx + dy * dy;

      if (distSq <= toleranceSq && distSq < minMidDistSq) {
        minMidDistSq = distSq;
        midpointSnap = {
          snapped: true,
          type: SnapType.Midpoint,
          position: midpoint,
          wall,
        };
      }
    }

    if (midpointSnap) return midpointSnap;

    // 3. Wall edge snapping (Lowest Proximity Priority)
    const wallHit = WallHitTestService.hitTestWalls(cursor, walls, tolerance);
    if (wallHit.hit && wallHit.point) {
      return {
        snapped: true,
        type: SnapType.Wall,
        position: wallHit.point,
        wall: wallHit.wall,
      };
    }

    // 4. No snap detected
    return {
      snapped: false,
      type: SnapType.None,
      position: cursor,
    };
  }
}
