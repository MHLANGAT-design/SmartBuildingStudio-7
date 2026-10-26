import { Point2D } from "@/modules/FloorPlanDesigner/Utils/CoordinateTransforms";

/**
 * Calculates the exact Euclidean distance separating two canvas positions.
 */
export function getDistance(p1: Point2D, p2: Point2D): number {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

/**
 * Obtains the closest structural coordinate point located along a finite line segment bounding path.
 */
export function getClosestPointOnSegment(point: Point2D, lineStart: Point2D, lineEnd: Point2D): Point2D {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  const segmentLengthSq = dx * dx + dy * dy;

  if (segmentLengthSq === 0) return lineStart;

  // Project point onto the infinite vector, calculating the scalar parameter t
  let t = ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / segmentLengthSq;
  t = Math.max(0, Math.min(1, t)); // Constrain to finite segment boundaries

  return {
    x: lineStart.x + t * dx,
    y: lineStart.y + t * dy,
  };
}

/**
 * Computes whether two structural line segments cross, returning the explicit intersection vertex point if true.
 */
export function getLineIntersection(p1: Point2D, p2: Point2D, p3: Point2D, p4: Point2D): Point2D | null {
  const denominator = (p4.y - p3.y) * (p2.x - p1.x) - (p4.x - p3.x) * (p2.y - p1.y);
  if (denominator === 0) return null; // Parallel configurations

  const ua = ((p4.x - p3.x) * (p1.y - p3.y) - (p4.y - p3.y) * (p1.x - p3.x)) / denominator;
  const ub = ((p2.x - p1.x) * (p1.y - p3.y) - (p2.y - p1.y) * (p1.x - p3.x)) / denominator;

  // Ensure intersection occurs comfortably within the finite boundary range of both lines
  if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) {
    return {
      x: p1.x + ua * (p2.x - p1.x),
      y: p1.y + ua * (p2.y - p1.y),
    };
  }

  return null;
}
