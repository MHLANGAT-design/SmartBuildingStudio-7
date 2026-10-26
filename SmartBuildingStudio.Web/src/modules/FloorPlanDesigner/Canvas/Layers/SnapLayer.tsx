import { IRenderLayer } from "@/modules/FloorPlanDesigner/Canvas/Layers/IRenderLayer";
import { Viewport } from "@/modules/FloorPlanDesigner/Canvas/Viewport";
import { Point2D } from "@/modules/FloorPlanDesigner/Models/Base/Geometry";

export enum SnapType {
  None = "none",
  Endpoint = "endpoint",
  Midpoint = "midpoint",
  Intersection = "intersection",
  Perpendicular = "perpendicular",
  Center = "center",
  Grid = "grid",
}

export interface SnapResult {
  type: SnapType;
  position: Point2D;
}

export class SnapLayer implements IRenderLayer {
  private visible = true;
  private snap?: SnapResult;
  private readonly size = 8;

  public getId(): string {
    return "snap";
  }

  public getName(): string {
    return "Snap";
  }

  public isVisible(): boolean {
    return this.visible;
  }

  public setVisible(visible: boolean): void {
    this.visible = visible;
  }

  public setSnap(snap?: SnapResult): void {
    this.snap = snap;
  }

  public render(context: CanvasRenderingContext2D, viewport: Viewport): void {
    if (!this.visible || !this.snap || this.snap.type === SnapType.None) return;

    // Fast bounds culling before running coordinate transforms
    const bounds = viewport.getVisibleBounds();
    const pos = this.snap.position;
    if (pos.x < bounds.left || pos.x > bounds.right || pos.y < bounds.top || pos.y > bounds.bottom) {
      return;
    }

    const point = viewport.worldToScreen(pos);
    const halfSize = this.size / 2;

    context.save();
    context.strokeStyle = "#FF9800";
    context.lineWidth = 2;

    switch (this.snap.type) {
      case SnapType.Endpoint:
        context.beginPath();
        context.arc(point.x, point.y, halfSize, 0, Math.PI * 2);
        context.stroke();
        break;

      case SnapType.Midpoint:
        context.strokeRect(point.x - halfSize, point.y - halfSize, this.size, this.size);
        break;

      case SnapType.Intersection:
        this.drawCross(context, point.x, point.y, this.size);
        break;

      case SnapType.Center:
        context.beginPath();
        context.arc(point.x, point.y, halfSize, 0, Math.PI * 2);
        context.stroke();
        this.drawCross(context, point.x, point.y, this.size);
        break;

      case SnapType.Grid:
      case SnapType.Perpendicular:
      default:
        this.drawCross(context, point.x, point.y, this.size);
        break;
    }

    context.restore();
  }

  /**
   * Draws a simple alignment indicator crosshair at the specified screen coordinates.
   */
  private drawCross(context: CanvasRenderingContext2D, cx: number, cy: number, extent: number): void {
    context.beginPath();
    context.moveTo(cx - extent, cy);
    context.lineTo(cx + extent, cy);
    context.moveTo(cx, cy - extent);
    context.lineTo(cx, cy - extent);
    context.stroke();
  }
}
