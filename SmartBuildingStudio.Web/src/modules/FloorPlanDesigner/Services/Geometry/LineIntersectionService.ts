import { Point2D } from "@/modules/FloorPlanDesigner/Models/Base/Geometry";
import { GeometryService } from "@/modules/FloorPlanDesigner/Services/Geometry/GeometryService";

export interface LineIntersectionResult {
  /** True if an intersection exists. */
  intersects: boolean;
  /** Intersection point. */
  point?: Point2D;
  /** Parameter on line/segment A (0 = start, 1 = end). */
  t1?: number;
  /** Parameter on line/segment B (0 = start, 1 = end). */
  t2?: number;
}

export class LineIntersectionService {
  /**
   * Computes the intersection of two infinite lines.
   */
  public static intersectLines(
    a1: Point2D,
    a2: Point2D,
    b1: Point2D,
    b2: Point2D
  ): LineIntersectionResult {
    const r = GeometryService.subtract(a2, a1);
    const s = GeometryService.subtract(b2, b1);
    const denominator = GeometryService.cross(r, s);

    if (Math.abs(denominator) < GeometryService.EPSILON) {
      return { intersects: false };
    }

    const qp = GeometryService.subtract(b1, a1);
    const t = GeometryService.cross(qp, s) / denominator;
    const u = GeometryService.cross(qp, r) / denominator;

    return {
      intersects: true,
      point: GeometryService.lerp(a1, a2, t),
      t1: t,
      t2: u,
    };
  }

  /**
   * Computes the intersection of two finite line segments.
   */
  public static intersectSegments(
    a1: Point2D,
    a2: Point2D,
    b1: Point2D,
    b2: Point2D
  ): LineIntersectionResult {
    const result = this.intersectLines(a1, a2, b1, b2);

    if (!result.intersects) return result;

    const { t1, t2 } = result;
    if (t1! < 0 || t1! > 1 || t2! < 0 || t2! > 1) {
      return { intersects: false };
    }

    return result;
  }

  /**
   * Returns true if two line segments intersect.
   */
  public static segmentsIntersect(
    a1: Point2D,
    a2: Point2D,
    b1: Point2D,
    b2: Point2D
  ): boolean {
    // Fast-path optimization for a purely boolean check using standard bounding box intersection (AABB)
    const minA_x = Math.min(a1.x, a2.x), maxA_x = Math.max(a1.x, a2.x);
    const minA_y = Math.min(a1.y, a2.y), maxA_y = Math.max(a1.y, a2.y);
    const minB_x = Math.min(b1.x, b2.x), maxB_x = Math.max(b1.x, b2.x);
    const minB_y = Math.min(b1.y, b2.y), maxB_y = Math.max(b1.y, b2.y);

    if (maxA_x < minB_x || minA_x > maxB_x || maxA_y < minB_y || minA_y > maxB_y) {
      return false;
    }

    return this.intersectSegments(a1, a2, b1, b2).intersects;
  }
}
