// RoomLayer.tsx
// COMPLETE FILE - Fixed selection highlighting

import { IRenderLayer } from "@/modules/FloorPlanDesigner/Canvas/Layers/IRenderLayer";
import { RenderContext } from "@/modules/FloorPlanDesigner/Canvas/RenderContext";
import { store } from "@/Application/ConfigureStore";

export class RoomLayer implements IRenderLayer {
  private visible = true;

  public getId(): string { return "rooms"; }
  public getName(): string { return "Rooms"; }

  public isVisible(): boolean {
    const hiddenLayers = (window as any)._hiddenLayersMap || {};
    const isHiddenByMap = hiddenLayers["rooms"] === true || hiddenLayers["rooms-layer"] === true;
    return this.visible && !isHiddenByMap;
  }

  public setVisible(visible: boolean): void {
    this.visible = visible;
    const hiddenLayers = (window as any)._hiddenLayersMap || {};
    hiddenLayers["rooms"] = !visible;
    hiddenLayers["rooms-layer"] = !visible;
    (window as any)._hiddenLayersMap = hiddenLayers;

    window.dispatchEvent(new CustomEvent("sbs:canvas-update"));
    window.dispatchEvent(new CustomEvent("canvas-invalidate"));

    console.log(`[RoomLayer] ${visible ? 'Showing' : 'Hiding'} rooms on canvas`);
  }

  // 🚀 NEW: Required by IRenderLayer. Rooms draw above walls, doors, windows.
  public getZIndex(): number {
    return 40;
  }

  public render(context: CanvasRenderingContext2D, renderContext: RenderContext): void {
    if (!this.isVisible()) {
      return;
    }

    const viewport = renderContext?.viewport || (renderContext as any);
    if (!viewport || typeof viewport.worldToScreen !== "function") return;

    const activeState = store.getState().floorPlan;
    const innerSlice = activeState || {};
    const rooms = innerSlice.document?.rooms || [];

    if (!rooms || rooms.length === 0) return;

    // ✅ Get selection from Redux and global
    const activeSelection = store.getState().floorPlan?.selection;
    const globalSelection = (window as any).__currentSelection;

    // ✅ Determine if a room is selected
    const selectedRoomId = activeSelection?.id || globalSelection?.id || null;

    context.save();

    for (const room of rooms) {
      const vertices = room.points || [];
      if (!vertices || vertices.length < 3) continue;

      // ✅ Check if this room is selected
      const isItemSelected = selectedRoomId && String(selectedRoomId) === String(room.id);

      // Calculate area for display
      let area = 0;
      for (let i = 0; i < vertices.length; i++) {
        const j = (i + 1) % vertices.length;
        const vi = vertices[i];
        const vj = vertices[j];
        if (!vi || !vj) continue;
        area += vi.x * vj.y;
        area -= vj.x * vi.y;
      }
      area = Math.abs(area) / 2;
      const areaM2 = area / 1000000;

      // ✅ Draw room polygon with selection highlighting
      context.beginPath();
      const firstV = vertices[0];
      if (!firstV) continue;
      const first = viewport.worldToScreen({ x: firstV.x, y: firstV.y });
      context.moveTo(first.x, first.y);

      for (let i = 1; i < vertices.length; i++) {
        const currentV = vertices[i];
        if (!currentV) continue;
        const point = viewport.worldToScreen({ x: currentV.x, y: currentV.y });
        context.lineTo(point.x, point.y);
      }
      context.closePath();

      // ✅ Fill and stroke with selection highlighting
      if (isItemSelected) {
        context.fillStyle = "rgba(56, 189, 248, 0.2)";
        context.strokeStyle = "#38BDF8";
        context.lineWidth = 3;
      } else {
        context.fillStyle = "rgba(5, 255, 196, 0.05)";
        context.strokeStyle = "rgba(5, 255, 196, 0.45)";
        context.lineWidth = 1.5;
      }
      context.fill();
      context.stroke();

      // ✅ If selected, draw a glow effect
      if (isItemSelected) {
        context.shadowColor = "#38BDF8";
        context.shadowBlur = 20;
        context.strokeStyle = "rgba(56, 189, 248, 0.3)";
        context.lineWidth = 1;
        context.stroke();
        context.shadowBlur = 0;
      }

      // Calculate center for label
      let sx = 0, sy = 0, count = 0;
      for (const vertex of vertices) {
        if (!vertex) continue;
        sx += vertex.x;
        sy += vertex.y;
        count++;
      }
      const screenCentre = viewport.worldToScreen({ x: sx / (count || 1), y: sy / (count || 1) });

      // Draw room label
      context.save();
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.shadowColor = "rgba(0, 0, 0, 0.8)";
      context.shadowBlur = 4;

      // Room name
      const labelText = room.name || "Room";
      context.fillStyle = isItemSelected ? "#38BDF8" : "#05FFC4";
      context.font = isItemSelected ? "bold 11px monospace" : "10px monospace";
      context.fillText(labelText.toUpperCase(), screenCentre.x, screenCentre.y - 10);

      // Area
      context.fillStyle = isItemSelected ? "#94A3B8" : "#64748B";
      context.font = "9px monospace";
      context.shadowBlur = 2;
      context.fillText(`${areaM2.toFixed(2)} m²`, screenCentre.x, screenCentre.y + 8);

      // Lux and Group
      context.fillStyle = "#475569";
      context.font = "8px monospace";
      context.fillText(
        `${room.targetLux || 500}lx | G${room.primaryGroup || 1}`,
        screenCentre.x,
        screenCentre.y + 20
      );

      context.restore();
    }

    context.restore();
  }
}

export default RoomLayer;