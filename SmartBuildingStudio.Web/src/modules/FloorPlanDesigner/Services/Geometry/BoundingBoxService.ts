// src/modules/FloorPlanDesigner/Services/Geometry/BoundingBoxService.ts

import { Point2D, BoundingBox } from "@/modules/FloorPlanDesigner/Models/Base/Geometry";

export class BoundingBoxService {
  /**
   * Creates a bounding box from two points.
   */
  public static fromPoints(a: Point2D, b: Point2D): BoundingBox {
    return {
      minX: Math.min(a.x, b.x),
      minY: Math.min(a.y, b.y),
      maxX: Math.max(a.x, b.x),
      maxY: Math.max(a.y, b.y),
    };
  }

  /**
   * Expands a bounding box uniformly by a fixed amount.
   */
  public static expand(bounds: BoundingBox, amount: number): BoundingBox {
    return {
      minX: bounds.minX - amount,
      minY: bounds.minY - amount,
      maxX: bounds.maxX + amount,
      maxY: bounds.maxY + amount,
    };
  }

  /**
   * Returns true if the box contains the point.
   */
  public static containsPoint(bounds: BoundingBox, point: Point2D): boolean {
    return (
      point.x >= bounds.minX &&
      point.x <= bounds.maxX &&
      point.y >= bounds.minY &&
      point.y <= bounds.maxY
    );
  }

  /**
   * Returns true if the two bounding boxes overlap.
   */
  public static intersects(a: BoundingBox, b: BoundingBox): boolean {
    return (
      a.minX <= b.maxX &&
      a.maxX >= b.minX &&
      a.minY <= b.maxY &&
      a.maxY >= b.minY
    );
  }

  /**
   * Returns the union box enveloping both bounding boxes.
   */
  public static union(a: BoundingBox, b: BoundingBox): BoundingBox {
    return {
      minX: Math.min(a.minX, b.minX),
      minY: Math.min(a.minY, b.minY),
      maxX: Math.max(a.maxX, b.maxX),
      maxY: Math.max(a.maxY, b.maxY),
    };
  }

  /**
   * Calculates the width of a bounding box.
   */
  public static width(bounds: BoundingBox): number {
    return bounds.maxX - bounds.minX;
  }

  /**
   * Calculates the height of a bounding box.
   */
  public static height(bounds: BoundingBox): number {
    return bounds.maxY - bounds.minY;
  }

  /**
   * Calculates the exact centre point of a bounding box.
   */
  public static center(bounds: BoundingBox): Point2D {
    return {
      x: (bounds.minX + bounds.maxX) / 2,
      y: (bounds.minY + bounds.maxY) / 2,
    };
  }
}