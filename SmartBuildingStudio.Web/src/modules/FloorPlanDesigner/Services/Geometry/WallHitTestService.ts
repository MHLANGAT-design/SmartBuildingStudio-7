import { Wall } from "@/modules/FloorPlanDesigner/Models/Wall";
import { Point2D } from "@/modules/FloorPlanDesigner/Models/Base/Geometry";
import { BoundingBoxService } from "@/modules/FloorPlanDesigner/Services/Geometry/BoundingBoxService";
import { ProjectionService } from "@/modules/FloorPlanDesigner/Services/Geometry/ProjectionService";

export interface WallHitResult {
  /** True if the wall was hit. */
  hit: boolean;
  /** Wall that was hit. */
  wall?: Wall;
  /** Closest point on the wall. */
  point?: Point2D;
  /** Distance from cursor to wall. */
  distance?: number;
  /** Parametric position along the wall (0 = start, 1 = end). */
  t?: number;
}

export class WallHitTestService {
  /**
   * Tests whether a point hits a wall.
   */
  public static hitTestWall(
    point: Point2D,
    wall: Wall,
    tolerance: number
  ): WallHitResult {
    // Fast bounding-box rejection
    const expandedBounds = BoundingBoxService.expand(wall.getBounds(), tolerance);
    if (!BoundingBoxService.containsPoint(expandedBounds, point)) {
      return { hit: false };
    }

    // Accurate projection onto the wall segment
    const projection = ProjectionService.projectOntoSegment(point, wall.start, wall.end);
    if (projection.distance > tolerance) {
      return { hit: false };
    }

    return {
      hit: true,
      wall,
      point: projection.point,
      distance: projection.distance,
      t: projection.t,
    };
  }

  /**
   * Returns the closest wall under the cursor.
   */
  public static hitTestWalls(
    point: Point2D,
    walls: readonly Wall[],
    tolerance: number
  ): WallHitResult {
    let closest: WallHitResult = { hit: false };
    let closestDistance = Number.POSITIVE_INFINITY;

    for (const wall of walls) {
      const result = this.hitTestWall(point, wall, tolerance);

      // Avoid structural type assertion bang operators by checking result properties cleanly
      if (result.hit && result.distance !== undefined && result.distance < closestDistance) {
        closestDistance = result.distance;
        closest = result;
      }
    }

    return closest;
  }
}
