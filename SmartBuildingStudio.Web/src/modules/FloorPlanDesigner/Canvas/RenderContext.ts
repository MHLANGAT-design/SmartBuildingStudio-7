// src/modules/FloorPlanDesigner/Canvas/RenderContext.ts
import { DrawingDocument } from "@/modules/FloorPlanDesigner/Document/DrawingDocument";
import { Point2D } from "@/modules/FloorPlanDesigner/Models/Base/Geometry";

/**
 * A lightweight viewport interface that provides coordinate conversion.
 * This replaces the old Viewport class dependency.
 */
export interface ViewportLike {
  zoom: number;
  offsetX: number;
  offsetY: number;
  worldToScreen(point: Point2D): Point2D;
  screenToWorld(point: Point2D): Point2D;
}

/**
 * Shared rendering context passed to every render layer.
 * Provides read-only access to the current document and viewport.
 */
export class RenderContext {
  constructor(
    public readonly document: DrawingDocument,
    public readonly viewport: ViewportLike
  ) {}

  // Convenience accessors
  public getWalls = () => this.document.getWalls();
  public getRooms = () => this.document.getRooms();
  public getDoors = () => this.document.getDoors();
  public getWindows = () => this.document.getWindows();
  public getImportedDrawings = () => this.document.getImportedDrawings();
}