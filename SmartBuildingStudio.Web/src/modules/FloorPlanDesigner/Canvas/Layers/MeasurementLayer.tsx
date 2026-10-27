// src/modules/FloorPlanDesigner/Canvas/Layers/MeasurementLayer.ts
import { IRenderLayer } from "@/modules/FloorPlanDesigner/Canvas/Layers/IRenderLayer";
import { RenderContext } from "@/modules/FloorPlanDesigner/Canvas/RenderContext";
import type {
  Point2D,
  Measurement,
  MeasurementState,
} from "@/modules/FloorPlanDesigner/Store/FloorPlanSlice";

export interface MeasurementLayerSnapshot {
  measurements: MeasurementState;
  /** From calibration, to format committed lengths in real units. */
  pxPerUnit: number | null;
  unit: string;
}

export class MeasurementLayer implements IRenderLayer {
  private visible = true;
  private snapshot: MeasurementLayerSnapshot = {
    measurements: { committed: [], draftFrom: null, cursor: null },
    pxPerUnit: null,
    unit: "mm",
  };

  public getId() { return "measurements"; }
  public getName() { return "Measurements"; }
  public isVisible() { return this.visible; }
  public setVisible(v: boolean) { this.visible = v; }
  public getZIndex() { return 960; }

  public update(snapshot: MeasurementLayerSnapshot): void {
    this.snapshot = snapshot;
  }

  public render(ctx: CanvasRenderingContext2D, rc: RenderContext): void {
    if (!this.visible) return;
    const { measurements, pxPerUnit, unit } = this.snapshot;
    const { committed, draftFrom, cursor } = measurements;
    if (committed.length === 0 && !(draftFrom && cursor)) return;

    const zoom = rc.viewport.zoom;
    const px = (n: number) => n / Math.max(zoom, 1e-6);

    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    for (const m of committed) {
      this.drawOne(ctx, m.from, m.to, px(3), false, px(6), "#22D3EE", px, pxPerUnit, unit, m.label);
    }
    if (draftFrom && cursor) {
      this.drawOne(ctx, draftFrom, cursor, px(2.5), true, px(5), "#67E8F9", px, pxPerUnit, unit);
    }

    ctx.restore();
  }

  private drawOne(
    ctx: CanvasRenderingContext2D,
    a: Point2D,
    b: Point2D,
    lineWidth: number,
    dashed: boolean,
    dotRadius: number,
    color: string,
    px: (n: number) => number,
    pxPerUnit: number | null,
    unit: string,
    overrideLabel?: string
  ) {
    // Segment
    ctx.beginPath();
    if (dashed) ctx.setLineDash([px(10), px(6)]);
    else ctx.setLineDash([]);
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
    ctx.setLineDash([]);

    // Endpoints
    for (const p of [a, b]) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, dotRadius, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();
    }

    // Label
    const mx = (a.x + b.x) / 2;
    const my = (a.y + b.y) / 2;
    const worldDist = Math.hypot(b.x - a.x, b.y - a.y);
    const label = overrideLabel ?? (
      pxPerUnit
        ? `${(worldDist / pxPerUnit).toFixed(2)} ${unit}`
        : `${worldDist.toFixed(1)} u`
    );

    ctx.save();
    ctx.translate(mx, my);
    ctx.scale(1, -1);
    ctx.font = `600 ${px(13)}px monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineWidth = px(4);
    ctx.strokeStyle = "#0A0A0A";
    ctx.strokeText(label, 0, -px(10));
    ctx.fillStyle = color;
    ctx.fillText(label, 0, -px(10));
    ctx.restore();
  }
}

export default MeasurementLayer;