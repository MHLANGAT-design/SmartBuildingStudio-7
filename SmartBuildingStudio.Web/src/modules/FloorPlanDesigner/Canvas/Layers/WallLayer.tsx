// src/modules/FloorPlanDesigner/Canvas/Layers/WallLayer.tsx
import { IRenderLayer } from "@/modules/FloorPlanDesigner/Canvas/Layers/IRenderLayer";
import { RenderContext } from "@/modules/FloorPlanDesigner/Canvas/RenderContext";
import { store } from "@/Application/ConfigureStore";

export class WallLayer implements IRenderLayer {
  private static instance: WallLayer | null = null;
  private visible = true;

  private constructor() {}

  public static getInstance(): WallLayer {
    if (!WallLayer.instance) {
      WallLayer.instance = new WallLayer();
    }
    return WallLayer.instance;
  }

  public getId(): string { return "walls"; }
  public getName(): string { return "Walls"; }

  public isVisible(): boolean {
    const globalHiddenMap = (window as any).__hiddenLayersMap || {};
    const isHiddenByMap = globalHiddenMap["walls"] === true || globalHiddenMap["structural-layer"] === true;
    return this.visible && !isHiddenByMap;
  }

  public setVisible(visible: boolean): void {
    console.log(`[WallLayer] setVisible called with ${visible}`);
    this.visible = visible;
    const hiddenLayers = (window as any).__hiddenLayersMap || {};
    hiddenLayers["walls"] = !visible;
    hiddenLayers["structural-layer"] = !visible;
    (window as any).__hiddenLayersMap = hiddenLayers;

    window.dispatchEvent(new CustomEvent("sbs:canvas-update"));
    window.dispatchEvent(new CustomEvent("canvas-invalidate"));
  }

  // 🚀 Required by IRenderLayer. Renders above imported drawing (5), below doors (20).
  public getZIndex(): number {
    return 10;
  }

  public render(context: CanvasRenderingContext2D, renderContext: RenderContext): void {
    if (!this.isVisible()) return;

    const viewport = renderContext?.viewport || (renderContext as any);
    if (!viewport || typeof viewport.worldToScreen !== "function") return;

    const activeState = store.getState().floorPlan;
    // The Redux document is plain JSON, not class instances. Type as `any[]`
    // so plain-object property accesses (startX, thickness, wallId, etc.)
    // compile even though the class-based type declares methods instead.
    const innerSlice: any = activeState || {};
    let walls: any[] = innerSlice.document?.walls || [];
    let doors: any[] = innerSlice.document?.doors || [];
    let windows: any[] = innerSlice.document?.windows || [];

    const globalDoc: any = (window as any).__floorPlanActiveDocumentInstance;
    if (!walls || walls.length === 0) walls = globalDoc?.walls || globalDoc?.customDrawnWalls || [];
    if (!doors || doors.length === 0) doors = globalDoc?.doors || globalDoc?.customDrawnDoors || [];
    if (!windows || windows.length === 0) windows = globalDoc?.windows || globalDoc?.customDrawnWindows || [];

    if (!walls || walls.length === 0) return;

    // ViewportLike exposes zoom as a property, not a method.
    const zoom = viewport.zoom || 1.0;

    context.save();
    context.lineCap = "square";

    const segmentDistance = (p: any, s: any, e: any) => {
      const l2 = Math.pow(e.x - s.x, 2) + Math.pow(e.y - s.y, 2);
      if (l2 === 0) return Math.hypot(p.x - s.x, p.y - s.y);
      let t = ((p.x - s.x) * (e.x - s.x) + (p.y - s.y) * (e.y - s.y)) / l2;
      t = Math.max(0, Math.min(1, t));
      return Math.hypot(p.x - (s.x + t * (e.x - s.x)), p.y - (s.y + t * (e.y - s.y)));
    };

    for (const wall of walls) {
      if (!wall) continue;
      const startPt = wall.start || wall.Start || { x: wall.startX, y: wall.startY };
      const endPt = wall.end || wall.End || { x: wall.endX, y: wall.endY };
      if (startPt.x === undefined || endPt.x === undefined) continue;

      const wallThickness = wall.thickness || 0.15;
      context.lineWidth = Math.max(1.5, wallThickness * zoom);
      context.strokeStyle = "#475569";

      const wallIdToken = String(wall.id || wall.name || "").toUpperCase();
      const hostedApertures: any[] = [];
      const allApertures = [...doors, ...windows];

      for (const ap of allApertures) {
        if (!ap) continue;
        const targetHostId = String(ap.wallId || ap.WallId || "").toUpperCase();
        const apStart = ap.start || ap.position || { x: ap.x, y: ap.y };
        if ((wallIdToken !== "" && targetHostId === wallIdToken) || segmentDistance({ x: apStart.x, y: apStart.y }, startPt, endPt) < 0.25) {
          hostedApertures.push(ap);
        }
      }

      const screenS = viewport.worldToScreen(startPt);
      const screenE = viewport.worldToScreen(endPt);

      if (hostedApertures.length === 0) {
        context.beginPath(); context.moveTo(screenS.x, screenS.y); context.lineTo(screenE.x, screenE.y); context.stroke();
      } else {
        const segments: { tStart: number; tEnd: number }[] = [];
        const length = Math.hypot(endPt.x - startPt.x, endPt.y - startPt.y);

        for (const ap of hostedApertures) {
          const apStart = ap.start || ap.position || { x: ap.x, y: ap.y };

          // 🛠️ FIX: If width is specified in millimeters (e.g. 900), convert to meters (0.9)
          let apWidth = ap.width || 0.9;
          if (apWidth > 10) {
            apWidth = apWidth / 1000;
          }

          const distS = Math.hypot(apStart.x - startPt.x, apStart.y - startPt.y);
          const distE = distS + apWidth;
          const tS = length > 0 ? Math.min(1, Math.max(0, distS / length)) : 0;
          const tE = length > 0 ? Math.min(1, Math.max(0, distE / length)) : 1;
          segments.push({ tStart: Math.min(tS, tE), tEnd: Math.max(tS, tE) });
        }

        segments.sort((a, b) => a.tStart - b.tStart);
        let currentT = 0;
        for (const seg of segments) {
          if (seg.tStart > currentT) {
            const pt1 = { x: screenS.x + (screenE.x - screenS.x) * currentT, y: screenS.y + (screenE.y - screenS.y) * currentT };
            const pt2 = { x: screenS.x + (screenE.x - screenS.x) * seg.tStart, y: screenS.y + (screenE.y - screenS.y) * seg.tStart };
            context.beginPath(); context.moveTo(pt1.x, pt1.y); context.lineTo(pt2.x, pt2.y); context.stroke();
          }
          currentT = Math.max(currentT, seg.tEnd);
        }
        if (currentT < 1.0) {
          const ptFinal = { x: screenS.x + (screenE.x - screenS.x) * currentT, y: screenS.y + (screenE.y - screenS.y) * currentT };
          context.beginPath(); context.moveTo(ptFinal.x, ptFinal.y); context.lineTo(screenE.x, screenE.y); context.stroke();
        }
      }
    }
    context.restore();
  }
}

export function toggleWallLayer(visible?: boolean) {
  const layer = WallLayer.getInstance();
  const newVisibility = visible !== undefined ? visible : !layer.isVisible();
  layer.setVisible(newVisibility);
}