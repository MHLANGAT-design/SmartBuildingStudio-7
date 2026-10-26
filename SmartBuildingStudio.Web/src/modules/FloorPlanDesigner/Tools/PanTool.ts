import { BaseTool } from "@/modules/FloorPlanDesigner/Tools/Base/BaseTool";
import { ToolPointerEvent, MouseButton } from "@/modules/FloorPlanDesigner/Tools/Base/ITool";
import { store } from "@/Application/ConfigureStore";
import { SetViewportOffset } from "@/modules/FloorPlanDesigner/Store/FloorPlanSlice";

export class PanTool extends BaseTool {
  public static readonly ID = "pan";
  private isPanning = false;
  private startScreenX = 0;
  private startScreenY = 0;
  private startOffsetX = 0;
  private startOffsetY = 0;

  public getId(): string { return PanTool.ID; }
  public getName(): string { return "Pan Viewport"; }

  protected onActivate(): void {
    this.setCursor("grab");
    this.setStatus("Click and drag the drawing canvas to pan across layout planes.");
  }

  protected onDeactivate(): void {
    this.isPanning = false;
    this.setCursor("default");
  }

  public onPointerDown(event: ToolPointerEvent): void {
    if (event.button === MouseButton.Left || event.button === MouseButton.Middle || (event.originalEvent as MouseEvent)?.button === 1) {
      const activeViewport = (this as any).viewport || (this as any).context?.viewport || (this as any).context?.getViewport?.();
      
      this.isPanning = true;
      this.startScreenX = event.screenX;
      this.startScreenY = event.screenY;

      if (activeViewport) {
        // Read current lens center coordinates cleanly
        const currentOffset = typeof activeViewport.getOffset === "function" ? activeViewport.getOffset() : activeViewport;
        this.startOffsetX = currentOffset.x ?? activeViewport.offsetX ?? 0;
        this.startOffsetY = currentOffset.y ?? activeViewport.offsetY ?? 0;
      } else {
        const state = store.getState().floorPlan || (store.getState() as any).FloorPlan;
        const currentOffset = state?.viewport || state || { offsetX: 0, offsetY: 0 };
        this.startOffsetX = typeof currentOffset.offsetX === "number" ? currentOffset.offsetX : currentOffset.x || 0;
        this.startOffsetY = typeof currentOffset.offsetY === "number" ? currentOffset.offsetY : currentOffset.y || 0;
      }
      
      this.setCursor("grabbing");
    }
  }

  public onPointerMove(event: ToolPointerEvent): void {
    if (!this.isPanning) return;

    const activeViewport = (this as any).viewport || (this as any).context?.viewport || (this as any).context?.getViewport?.();
    if (!activeViewport) return;

    // Calculate mouse screen movement
    const deltaX = event.screenX - this.startScreenX;
    const deltaY = event.screenY - this.startScreenY;

    // Extract current magnification properties safely
    const activeZoom = typeof activeViewport.getZoom === "function" ? activeViewport.getZoom() : activeViewport.zoom || 1.0;

    // 🚀 CRITICAL FIXED WORLD TRANSFORMATION MODEL
    // Screen movement pixels must be divided by the active zoom factor 
    // to update your world-space camera center locations precisely.
    const targetX = this.startOffsetX - (deltaX / activeZoom);
    const targetY = this.startOffsetY - (deltaY / activeZoom);

    if (typeof activeViewport.setOffset === "function") {
      activeViewport.setOffset(targetX, targetY);
    } else {
      activeViewport.offsetX = targetX;
      activeViewport.offsetY = targetY;
    }

    if (store && typeof store.dispatch === "function" && typeof setViewportOffset === "function") {
      store.dispatch(setViewportOffset({ x: targetX, y: targetY }));
    }

    this.requestRender();
  }

  public onPointerUp(event: ToolPointerEvent): void {
    if (!this.isPanning) return;
    this.isPanning = false;
    this.setCursor("grab");
  }

  public cancel(): void {
    if (this.isPanning) {
      const activeViewport = (this as any).viewport || (this as any).context?.viewport || (this as any).context?.getViewport?.();
      if (activeViewport) {
        if (typeof activeViewport.setOffset === "function") activeViewport.setOffset(this.startOffsetX, this.startOffsetY);
        else { activeViewport.offsetX = this.startOffsetX; activeViewport.offsetY = this.startOffsetY; }
      }
      this.isPanning = false;
      this.setCursor("grab");
      this.requestRender();
    }
  }
}

export default PanTool;
