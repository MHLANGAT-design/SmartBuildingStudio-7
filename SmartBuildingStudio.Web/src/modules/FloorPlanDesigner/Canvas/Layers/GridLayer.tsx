import { IRenderLayer } from "@/modules/FloorPlanDesigner/Canvas/Layers/IRenderLayer";
import { RenderContext } from "@/modules/FloorPlanDesigner/Canvas/RenderContext";

/**
 * 🚀 HIGH-PERFORMANCE INFINITY WORKSPACE GRID LAYER
 * Uses screen-space pixel remainder operations to render infinity layout squares,
 * aligned cleanly with explicit string routing identifiers.
 */
export class GridLayer implements IRenderLayer {
  private visible = true;

  // 🚀 FIXED: ID explicitly matches "grid-layer" expected by LayerManager!
  public getId(): string {
    return "grid-layer";
  }

  public getName(): string {
    return "Workspace Alignment Grid";
  }

  public isVisible(): boolean {
    return this.visible;
  }

  public setVisible(visible: boolean): void {
    this.visible = visible;
  }

  // 🚀 NEW: Required by IRenderLayer. Renders below everything else.
  public getZIndex(): number {
    return 0;
  }

  public render(context: CanvasRenderingContext2D, renderContext: RenderContext): void {
    if (!this.visible) return;

    const viewport = renderContext?.viewport;
    if (!viewport) return;

    const canvas = context.canvas;
    const width = canvas?.width || window.innerWidth;
    const height = canvas?.height || window.innerHeight;

    // ViewportLike exposes zoom/offsetX/offsetY as properties, not methods.
    const activeZoom = viewport.zoom || 1.0;
    const offsetX = viewport.offsetX || 0;
    const offsetY = viewport.offsetY || 0;

    const baseSpacing = 100;
    const step = baseSpacing * activeZoom;

    if (step < 6) return;

    context.save();
    context.strokeStyle = "#1E293B"; // High-visibility slate engineering grid lines
    context.lineWidth = 0.5;

    const startX = offsetX % step;
    const startY = offsetY % step;

    for (let x = startX; x < width; x += step) {
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x, height);
      context.stroke();
    }

    for (let y = startY; y < height; y += step) {
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(width, y);
      context.stroke();
    }

    // Soft sky blue center tracker guide lines
    context.strokeStyle = "rgba(56, 189, 248, 0.2)";
    context.lineWidth = 1.0;

    context.beginPath();
    context.moveTo(offsetX, 0); context.lineTo(offsetX, height);
    context.moveTo(0, offsetY); context.lineTo(width, offsetY);
    context.stroke();

    context.restore();
  }
}

export default GridLayer;