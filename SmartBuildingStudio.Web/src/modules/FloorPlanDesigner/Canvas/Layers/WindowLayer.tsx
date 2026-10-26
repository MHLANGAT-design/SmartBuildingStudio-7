// src/modules/FloorPlanDesigner/Canvas/Layers/WindowLayer.ts
import { IRenderLayer } from "@/modules/FloorPlanDesigner/Canvas/Layers/IRenderLayer";
import { RenderContext } from "@/modules/FloorPlanDesigner/Canvas/RenderContext";
import { store } from "@/Application/ConfigureStore";

export class WindowLayer implements IRenderLayer {
  private visible = true;

  public getId(): string { return "windows"; }
  public getName(): string { return "Windows"; }
  public isVisible(): boolean { return this.visible; }
  public setVisible(visible: boolean): void { this.visible = visible; }

  // 🚀 NEW: Required by IRenderLayer. Renders above doors (20), below rooms (40).
  public getZIndex(): number {
    return 30;
  }

  public render(context: CanvasRenderingContext2D, renderContext: RenderContext): void {
    if (!this.visible || (window as any).__hiddenLayersMap?.["windows"]) return;

    const viewport = renderContext?.viewport || (renderContext as any);
    if (!viewport || typeof viewport.worldToScreen !== "function") return;

    const activeState = store.getState().floorPlan;
    let windows: any[] = activeState?.document?.windows || [];
    let walls: any[] = activeState?.document?.walls || [];

    const globalDoc = (window as any).__floorPlanActiveDocumentInstance;
    if (!windows || windows.length === 0) windows = globalDoc?.windows || [];
    if (!walls || walls.length === 0) walls = globalDoc?.walls || [];
    if (!windows || windows.length === 0) return;

    const activeSelection = activeState?.selection;
    // ViewportLike exposes zoom as a property, not a method.
    const zoom = viewport.zoom || 1.0;

    for (const item of windows) {
      if (!item) continue;

      const basePt = {
        x: item.startX ?? item.x ?? item.position?.x ?? 0,
        y: item.startY ?? item.y ?? item.position?.y ?? 0
      };

      const widthValue = item.width || 1200;
      const thicknessValue = item.thickness || 200; // Structural frame thickness

      context.save();
      const screenS = viewport.worldToScreen(basePt);

      // Calculate drawing metrics
      const screenE = viewport.worldToScreen({ x: basePt.x + widthValue, y: basePt.y });
      const w = Math.hypot(screenE.x - screenS.x, screenE.y - screenS.y) || 40;
      const h = (thicknessValue / 2) * zoom;

      if (w > 1) {
        context.translate(screenS.x, screenS.y);

        // 🚀 DYNAMIC WALL ALIGNMENT COGNITION ENGINE
        // Scans the wall database pool to match host orientation rotation angles
        let wallRotationAngle = 0;
        const hostWall = walls.find(w => String(w.id || w.Id) === String(item.wallId));
        if (hostWall) {
          const ws = viewport.worldToScreen({ x: hostWall.startX, y: hostWall.startY });
          const we = viewport.worldToScreen({ x: hostWall.endX, y: hostWall.endY });
          wallRotationAngle = Math.atan2(we.y - ws.y, we.x - ws.x);
        }
        context.rotate(wallRotationAngle);

        const isItemSelected = activeSelection && String(activeSelection.id || activeSelection.Id) === String(item.id || item.Id);
        context.lineWidth = isItemSelected ? 3.0 : 1.5;
        context.strokeStyle = isItemSelected ? "#60A5FA" : "#38BDF8";

        // 🖼️ DRAW STANDARD CAD DOUBLE-LINE SUB-GLAZING GLASS RAILS (NO FILL)
        // Step 1: Draw the outer structural enclosing window frame
        context.beginPath();
        context.rect(-w / 2, -h / 2, w, h);
        context.stroke();

        // Step 2: Draw inner parallel glass track line A (33% frame thickness offset)
        const glassOffset = h * 0.33;
        context.lineWidth = 1.0;
        context.beginPath();
        context.moveTo(-w / 2, -glassOffset);
        context.lineTo(w / 2, -glassOffset);
        context.stroke();

        // Step 3: Draw inner parallel glass track line B (66% frame thickness offset)
        context.beginPath();
        context.moveTo(-w / 2, glassOffset);
        context.lineTo(w / 2, glassOffset);
        context.stroke();
      }
      context.restore();
    }
  }
}
export default WindowLayer;