import { Point2D } from "@/modules/FloorPlanDesigner/Models/Base/Geometry";

export class GeometryService {
  /**
   * Numerical tolerance used for floating-point comparisons.
   */
  public static readonly EPSILON = 1e-6;

  public static distance(a: Point2D, b: Point2D): number {
    return Math.sqrt(this.distanceSquared(a, b));
  }

  public static distanceSquared(a: Point2D, b: Point2D): number {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    return dx * dx + dy * dy;
  }

  public static length(vector: Point2D): number {
    return Math.sqrt(vector.x * vector.x + vector.y * vector.y);
  }

  public static midpoint(a: Point2D, b: Point2D): Point2D {
    return {
      x: (a.x + b.x) / 2,
      y: (a.y + b.y) / 2,
    };
  }

  public static angle(a: Point2D, b: Point2D): number {
    return Math.atan2(b.y - a.y, b.x - a.x);
  }

  public static add(a: Point2D, b: Point2D): Point2D {
    return { x: a.x + b.x, y: a.y + b.y };
  }

  public static subtract(a: Point2D, b: Point2D): Point2D {
    return { x: a.x - b.x, y: a.y - b.y };
  }

  public static scale(vector: Point2D, scalar: number): Point2D {
    return { x: vector.x * scalar, y: vector.y * scalar };
  }

  public static normalize(vector: Point2D): Point2D {
    const len = this.length(vector);
    if (len < this.EPSILON) {
      return { x: 0, y: 0 };
    }
    return { x: vector.x / len, y: vector.y / len };
  }

  public static dot(a: Point2D, b: Point2D): number {
    return a.x * b.x + a.y * b.y;
  }

  public static cross(a: Point2D, b: Point2D): number {
    return a.x * b.y - a.y * b.x;
  }

  public static lerp(a: Point2D, b: Point2D, t: number): Point2D {
    return {
      x: a.x + (b.x - a.x) * t,
      y: a.y + (b.y - a.y) * t,
    };
  }

  public static equals(a: Point2D, b: Point2D, epsilon = GeometryService.EPSILON): boolean {
    return Math.abs(a.x - b.x) <= epsilon && Math.abs(a.y - b.y) <= epsilon;
  }

  public static clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }
}
