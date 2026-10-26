// src/modules/FloorPlanDesigner/Canvas/Layers/ImportedDrawingLayer.tsx
import { IRenderLayer } from "@/modules/FloorPlanDesigner/Canvas/Layers/IRenderLayer";
import { store } from "@/Application/ConfigureStore";

/**
 * Renders the `importedDrawings` collection of the current document.
 *
 * NOTE: this layer intentionally does NOT fall back to any global cache.
 * The `__persistentDwgVectorBackupCache` global is written by DWG import
 * and by the reducer, and is never cleared between document switches.
 * Reading from it here meant the previous document's vectors were painted
 * on top of the current one whenever the current document had no imports
 * of its own — a ghost overlay. The fix is to render only what the
 * current document actually carries.
 */
export class ImportedDrawingLayer implements IRenderLayer {
  private visible = true;

  public getId(): string { return "importedDrawing"; }
  public getName(): string { return "Background CAD Blueprint"; }
  public isVisible(): boolean { return this.visible; }
  public setVisible(visible: boolean): void { this.visible = visible; }
  public getZIndex(): number { return 5; }

  public render(context: any, renderContext?: any): void {
    if (!this.visible) return;

    const canvasContext = context?.canvas ? context : (renderContext?.canvas ? renderContext : null);
    const contextWrapper = context?.viewport ? context : (renderContext?.viewport ? renderContext : null);

    if (!canvasContext || !contextWrapper) return;
    const viewport = contextWrapper.viewport;
    if (!viewport || typeof viewport.worldToScreen !== "function") return;

    let blueprintVectors: any[] = [];

    // ── Source of truth #1: the current document instance ─────────────
    if (contextWrapper.document) {
      const doc = contextWrapper.document;
      if (typeof doc.getImportedDrawings === "function") {
        const drawings = doc.getImportedDrawings();
        if (Array.isArray(drawings) && drawings.length > 0) {
          blueprintVectors = [...drawings];
        }
      } else if (doc.importedDrawings instanceof Map) {
        blueprintVectors = Array.from(doc.importedDrawings.values());
      }
    }

    // ── Source of truth #2: the Redux document ────────────────────────
    if (blueprintVectors.length === 0) {
      const activeState = store.getState().floorPlan;
      const innerSlice: any = activeState?.document || activeState || {};
      const stateDrawings = innerSlice.importedDrawings;

      if (stateDrawings) {
        blueprintVectors = typeof stateDrawings.values === "function"
          ? Array.from(stateDrawings.values())
          : Array.isArray(stateDrawings) ? stateDrawings : Object.values(stateDrawings);
      }
    }

    // ── No global fallback ────────────────────────────────────────────
    // If neither source has drawings, render nothing. The previous
    // document's vectors must not appear here.

    if (!blueprintVectors || blueprintVectors.length === 0) return;

    canvasContext.save();
    canvasContext.strokeStyle = "rgba(148, 163, 184, 0.85)";
    canvasContext.lineWidth = 2.0;
    canvasContext.lineCap = "round";
    canvasContext.lineJoin = "round";

    for (const line of blueprintVectors) {
      if (!line) continue;

      const sX = typeof line.startX === "number" ? line.startX : (line.start?.x ?? line.Start?.x ?? 0);
      const sY = typeof line.startY === "number" ? line.startY : (line.start?.y ?? line.Start?.y ?? 0);
      const eX = typeof line.endX === "number" ? line.endX : (line.end?.x ?? line.End?.x ?? 0);
      const eY = typeof line.endY === "number" ? line.endY : (line.end?.y ?? line.End?.y ?? 0);

      const screenStart = viewport.worldToScreen({ x: sX, y: sY });
      const screenEnd = viewport.worldToScreen({ x: eX, y: eY });

      canvasContext.beginPath();
      canvasContext.moveTo(screenStart.x, screenStart.y);
      canvasContext.lineTo(screenEnd.x, screenEnd.y);
      canvasContext.stroke();
    }

    canvasContext.restore();
  }
}

export default ImportedDrawingLayer;