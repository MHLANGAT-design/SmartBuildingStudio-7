// src/modules/FloorPlanDesigner/Factories/WindowFactory.ts
import { Point2D } from "@/modules/FloorPlanDesigner/Models/Base/Geometry";

export class WindowFactory {
  /**
   * Creates a standardized architectural Window domain model.
   * Prioritizes explicit custom dimensions and spatial anchors over hardcoded fallbacks.
   */
  public static create(config: any = {}): any {
    // 🚀 FIX: Prioritize incoming calculated dimensions (checking both casing styles)
    let resolvedWidth = Number(config.width || config.Width || config.metadata?.width || 1200);
    const resolvedHeight = Number(config.height || config.Height || config.metadata?.height || 1200);

    // Resolve spatial origin points
    const sX = config.startX ?? config.x ?? (config.position?.x ?? 0);
    const sY = config.startY ?? config.y ?? (config.position?.y ?? 0);

    // If explicit end coordinates were imported, recalculate the width from the spatial span
    if (config.endX !== undefined && config.endY !== undefined && !config.width && !config.Width) {
      const dx = config.endX - sX;
      const dy = config.endY - sY;
      const linearSpan = Math.hypot(dx, dy);
      if (linearSpan > 100) {
        resolvedWidth = linearSpan;
      }
    }

    const eX = config.endX ?? (sX + resolvedWidth);
    const eY = config.endY ?? sY;

    return {
      id: config.id || config.Id || `window-${Date.now()}-${Math.random()}`,
      type: "Window",
      name: config.name || config.Name || `WINDOW_${Date.now().toString().slice(-4)}`,
      x: sX,
      y: sY,
      startX: sX,
      startY: sY,
      endX: eX,
      endY: eY,
      start: { x: sX, y: sY },
      end: { x: eX, y: eY },
      width: resolvedWidth,
      Width: resolvedWidth, // Dual casing guard support
      height: resolvedHeight,
      Height: resolvedHeight, // Dual casing guard support
      vlt: config.vlt || config.Vlt || config.transmittance || 0.70,
      wallId: config.wallId || config.WallId || "dwg-wall-root",
      points: config.points || config.Points || [{ x: sX, y: sY }, { x: eX, y: eY }]
    };
  }
}

export default WindowFactory;
