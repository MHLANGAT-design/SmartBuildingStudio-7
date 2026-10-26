import { Point2D } from "@/modules/FloorPlanDesigner/Models/Base/Geometry";
import { GeometryService } from "@/modules/FloorPlanDesigner/Services/Geometry/GeometryService";

export interface ProjectionResult {
  /** Closest point on the line or segment. */
  point: Point2D;
  /** Parametric position (0 = start, 1 = end). */
  t: number;
  /** Distance from the input point to the projection. */
  distance: number;
  /** True if the projected point lies within the segment bounds. */
  onSegment: boolean;
}

export class ProjectionService {
  /**
   * Projects a point onto an infinite line.
   */
  public static projectOntoLine(
    point: Point2D,
    lineStart: Point2D,
    lineEnd: Point2D
  ): ProjectionResult {
    const ab = GeometryService.subtract(lineEnd, lineStart);
    const ap = GeometryService.subtract(point, lineStart);
    const lengthSquared = GeometryService.dot(ab, ab);

    if (lengthSquared < GeometryService.EPSILON) {
      return {
        point: lineStart,
        t: 0,
        distance: GeometryService.distance(point, lineStart),
        onSegment: true,
      };
    }

    const t = GeometryService.dot(ap, ab) / lengthSquared;
    const projected = GeometryService.lerp(lineStart, lineEnd, t);

    return {
      point: projected,
      t,
      distance: GeometryService.distance(point, projected),
      onSegment: t >= 0 && t <= 1,
    };
  }

  /**
   * Projects a point onto a finite line segment.
   */
  public static projectOntoSegment(
    point: Point2D,
    segmentStart: Point2D,
    segmentEnd: Point2D
  ): ProjectionResult {
    const projection = this.projectOntoLine(point, segmentStart, segmentEnd);
    
    // Avoid re-calculating everything if the line projection is already on the segment
    if (projection.onSegment) {
      return projection;
    }

    const clampedT = GeometryService.clamp(projection.t, 0, 1);
    const projected = GeometryService.lerp(segmentStart, segmentEnd, clampedT);

    return {
      point: projected,
      t: clampedT,
      distance: GeometryService.distance(point, projected),
      onSegment: true,
    };
  }
}
