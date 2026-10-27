// src/modules/FloorPlanDesigner/Canvas/Layers/CalibrationLayer.ts
import { IRenderLayer } from "@/modules/FloorPlanDesigner/Canvas/Layers/IRenderLayer";
import { RenderContext } from "@/modules/FloorPlanDesigner/Canvas/RenderContext";
import type { Point2D, CalibrationState } from "@/modules/FloorPlanDesigner/Store/FloorPlanSlice";

export interface CalibrationLayerSnapshot extends CalibrationState {
  /** Cursor world position while calibrating. */
  cursor?: Point2D | null;
}

export class CalibrationLayer implements IRenderLayer {
  private visible = true;
  private snapshot: CalibrationLayerSnapshot = {
    p1: null, p2: null, knownDistance: null, unit: "mm", pxPerUnit: null,
  };

  public getId() { return "calibration"; }
  public getName() { return "Calibration"; }
  public isVisible() { return this.visible; }
  public setVisible(v: boolean) { this.visible = v; }
  public getZIndex() { return 950; }

  /** Called from FloorPlanCanvas each frame before render(). */
  public update(snapshot: CalibrationLayerSnapshot): void {
    this.snapshot = snapshot;
  }

  public render(ctx: CanvasRenderingContext2D, renderContext: RenderContext): void {
    if (!this.visible) return;
    const { p1, p2, cursor, knownDistance, unit, pxPerUnit } = this.snapshot;
    if (!p1) return;

    const end = p2 ?? cursor ?? null;
    const finalScale = renderContext.viewport.zoom;
    // Screen-constant pixel sizes (matching CanvasRenderer.drawWallDimensions).
    const px = (n: number) => n / Math.max(finalScale, 1e-6);

    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // Anchor dot at p1
    this.drawDot(ctx, p1, px(6), "#F59E0B", "#78350F", px(2));

    if (end) {
      // Calibration line
      ctx.beginPath();
      ctx.setLineDash([px(14), px(8)]);
      ctx.strokeStyle = "#F59E0B";
      ctx.lineWidth = px(3);
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
      ctx.setLineDash([]);

      // End dot
      this.drawDot(ctx, end, px(6), "#F59E0B", "#78350F", px(2));

      // Midpoint label
      const mx = (p1.x + end.x) / 2;
      const my = (p1.y + end.y) / 2;
      const worldDist = Math.hypot(end.x - p1.x, end.y - p1.y);
      const label = knownDistance != null
        ? `${knownDistance.toFixed(2)} ${unit}`
        : `${worldDist.toFixed(1)} u`;

      this.drawScreenText(ctx, mx, my, label, "#F59E0B", px(14), px(4), "#0A0A0A");
    }

    // Corner readout — scale bar / px-per-unit
    if (pxPerUnit && knownDistance) {
      const readout = `1 ${unit} = ${pxPerUnit.toFixed(2)} u`;
      this.drawCornerReadout(ctx, readout, renderContext);
    }

    ctx.restore();
  }

  // ── Helpers ────────────────────────────────────────────────────
  private drawDot(
    ctx: CanvasRenderingContext2D,
    p: Point2D,
    r: number,
    fill: string,
    stroke: string,
    sw: number
  ) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, 2 * Math.PI);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = stroke;
    ctx.lineWidth = sw;
    ctx.stroke();
  }

  /**
   * Draw text at a world position, upright regardless of the Y-flip.
   * Mirrors CanvasRenderer.drawWallDimensions.
   */
  private drawScreenText(
    ctx: CanvasRenderingContext2D,
    wx: number, wy: number,
    text: string, color: string,
    fontSize: number, haloWidth: number, haloColor: string
  ) {
    ctx.save();
    ctx.translate(wx, wy);
    ctx.scale(1, -1); // undo the drawing flip so text reads correctly
    ctx.font = `bold ${fontSize}px monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    // Halo for legibility over dark + bright geometry
    ctx.lineWidth = haloWidth;
    ctx.strokeStyle = haloColor;
    ctx.strokeText(text, 0, 0);
    ctx.fillStyle = color;
    ctx.fillText(text, 0, 0);
    ctx.restore();
  }

  private drawCornerReadout(
    ctx: CanvasRenderingContext2D,
    text: string,
    rc: RenderContext
  ) {
    // We're inside world coords here; convert the screen corner to world.
    const { zoom, offsetX, offsetY } = rc.viewport as any;
    if (!Number.isFinite(zoom) || zoom <= 0) return;
    const screenPadX = 12;
    const screenPadY = 12;
    // Put it at top-left of the canvas in screen space, then invert.
    // Since we don't have canvas w/h in ViewportLike, use a heuristic:
    // draw it anchored to the world origin at a fixed screen offset.
    // Simpler: draw text with a fixed world offset from the viewport
    // origin (which the parent sets). Falls back gracefully if viewport
    // lacks extra fields.
    const sx = screenPadX;
    const sy = screenPadY;
    const wx = (sx - offsetX) / zoom;
    const wy = (sy - offsetY) / zoom;
    this.drawScreenText(ctx, wx, wy, text, "#F59E0B", 12 / zoom, 3 / zoom, "#0A0A0A");
  }
}

export default CalibrationLayer;