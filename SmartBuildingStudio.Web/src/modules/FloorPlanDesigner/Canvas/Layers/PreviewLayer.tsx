// src/modules/FloorPlanDesigner/Canvas/Layers/PreviewLayer.ts
import { IRenderLayer } from "@/modules/FloorPlanDesigner/Canvas/Layers/IRenderLayer";
import { RenderContext } from "@/modules/FloorPlanDesigner/Canvas/RenderContext";
import type { Point2D } from "@/modules/FloorPlanDesigner/Store/FloorPlanSlice";

export interface PreviewLayerSnapshot {
  hoveredId: string | null;
  selectionId: string | null;
  multiSelection: string[];
}

export class PreviewLayer implements IRenderLayer {
  private visible = true;
  private snapshot: PreviewLayerSnapshot = {
    hoveredId: null, selectionId: null, multiSelection: [],
  };

  public getId() { return "preview"; }
  public getName() { return "Preview"; }
  public isVisible() { return this.visible; }
  public setVisible(v: boolean) { this.visible = v; }
  public getZIndex() { return 970; }

  public update(snapshot: PreviewLayerSnapshot): void {
    this.snapshot = snapshot;
  }

  public render(ctx: CanvasRenderingContext2D, rc: RenderContext): void {
    if (!this.visible) return;
    const { hoveredId, selectionId, multiSelection } = this.snapshot;
    if (!hoveredId && !selectionId && multiSelection.length === 0) return;

    const doc: any = rc.document as any;
    const elements: any[] = Array.isArray(doc?.getElements?.())
      ? doc.getElements()
      : Array.isArray(doc?.elements)
      ? doc.elements
      : [];

    const zoom = rc.viewport.zoom;
    const px = (n: number) => n / Math.max(zoom, 1e-6);

    const multiSet = new Set(multiSelection);
    const hoveredEl = hoveredId
      ? elements.find((e) => String(e.id ?? e.Id) === hoveredId)
      : null;
    const selectedEl = selectionId
      ? elements.find((e) => String(e.id ?? e.Id) === selectionId)
      : null;
    const multiEls = elements.filter((e) =>
      multiSet.has(String(e.id ?? e.Id))
    );

    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // Hover — thin cyan outline
    if (hoveredEl && !selectedEl) {
      this.strokeElement(ctx, hoveredEl, "#38BDF8", px(2.5));
    }

    // Single selection — thicker cyan (matches existing multiSelection color)
    if (selectedEl) {
      this.strokeElement(ctx, selectedEl, "#38BDF8", px(3.5));
    }

    // Multi-selection — same cyan
    for (const el of multiEls) {
      this.strokeElement(ctx, el, "#38BDF8", px(3));
    }

    ctx.restore();
  }

  private strokeElement(
    ctx: CanvasRenderingContext2D,
    el: any,
    color: string,
    lineWidth: number
  ) {
    const pts: Point2D[] =
      (Array.isArray(el.points) && el.points) ||
      (Array.isArray(el.vertices) && el.vertices) ||
      (el.start && el.end ? [el.start, el.end] : []);

    if (!Array.isArray(pts) || pts.length < 2) return;

    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.setLineDash([]);
    ctx.stroke();
  }
}

export default PreviewLayer;