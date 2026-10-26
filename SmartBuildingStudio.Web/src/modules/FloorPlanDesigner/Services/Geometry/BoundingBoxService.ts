import { Point2D, BoundingBox } from "@/modules/FloorPlanDesigner/Models/Base/Geometry";

export class BoundingBoxService {
  /**
   * Creates a bounding box from two points.
   */
  public static fromPoints(a: Point2D, b: Point2D): BoundingBox {
    return {
      left: Math.min(a.x, b.x),
      top: Math.min(a.y, b.y),
      right: Math.max(a.x, b.x),
      bottom: Math.max(a.y, b.y),
    };
  }

  /**
   * Expands a bounding box uniformly by a fixed amount.
   */
  public static expand(bounds: BoundingBox, amount: number): BoundingBox {
    return {
      left: bounds.left - amount,
      top: bounds.top - amount,
      right: bounds.right + amount,
      bottom: bounds.bottom + amount,
    };
  }

  /**
   * Returns true if the box contains the point.
   */
  public static containsPoint(bounds: BoundingBox, point: Point2D): boolean {
    return (
      point.x >= bounds.left &&
      point.x <= bounds.right &&
      point.y >= bounds.top &&
      point.y <= bounds.bottom
    );
  }

  /**
   * Returns true if the two bounding boxes overlap.
   */
  public static intersects(a: BoundingBox, b: BoundingBox): boolean {
    return (
      a.left <= b.right &&
      a.right >= b.left &&
      a.top <= b.bottom &&
      a.bottom >= b.top
    );
  }

  /**
   * Returns the union box enveloping both bounding boxes.
   */
  public static union(a: BoundingBox, b: BoundingBox): BoundingBox {
    return {
      left: Math.min(a.left, b.left),
      top: Math.min(a.top, b.top),
      right: Math.max(a.right, b.right),
      bottom: Math.max(a.bottom, b.bottom),
    };
  }

  /**
   * Calculates the width of a bounding box.
   */
  public static width(bounds: BoundingBox): number {
    return bounds.right - bounds.left;
  }

  /**
   * Calculates the height of a bounding box.
   */
  public static height(bounds: BoundingBox): number {
    return bounds.bottom - bounds.top;
  }

  /**
   * Calculates the exact centre point of a bounding box.
   */
  public static center(bounds: BoundingBox): Point2D {
    return {
      x: (bounds.left + bounds.right) / 2,
      y: (bounds.top + bounds.bottom) / 2,
    };
  }
}
