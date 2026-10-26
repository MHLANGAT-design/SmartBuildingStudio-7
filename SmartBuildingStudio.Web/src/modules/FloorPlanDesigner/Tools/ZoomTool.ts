// ZoomTool.ts
// COMPLETE FILE - Replace everything

import { BaseTool } from "@/modules/FloorPlanDesigner/Tools/Base/BaseTool";
import { ToolPointerEvent } from "@/modules/FloorPlanDesigner/Tools/Base/ITool";
import { Point2D } from "@/modules/FloorPlanDesigner/Utils/CoordinateTransforms";

export class ZoomTool extends BaseTool {
  public static readonly ID = "zoom";
  private readonly scaleFactor = 1.25;

  private isPanning = false;
  private isDraggingWindow = false;
  
  private panStartScreen = { x: 0, y: 0 };
  private panStartWorldOffset = { x: 0, y: 0 };

  private zoomBoxStart: Point2D | null = null;
  private zoomBoxCurrent: Point2D | null = null;

  public getId(): string { return ZoomTool.ID; }
  public getName(): string { return "Zoom Control"; }

  protected override onActivate(): void {
    this.setCursor("zoom-in");
    this.setStatus("Drag a marquee box to Zoom Window. Middle-click or drag to Pan.");
  }

  protected override onDeactivate(): void { 
    this.clearDragState(); 
  }

  private clearDragState(): void {
    this.isPanning = false;
    this.isDraggingWindow = false;
    this.zoomBoxStart = null;
    this.zoomBoxCurrent = null;
  }

  private getViewport() {
    return (this as any).viewport || (this as any).context?.viewport || (this as any).context?.getViewport?.();
  }

  private applyZoomAtPoint(targetZoom: number, centerScreenX?: number, centerScreenY?: number): void {
    const activeViewport = this.getViewport();
    if (!activeViewport) return;

    const canvasElement = document.querySelector("canvas");
    const rect = canvasElement?.getBoundingClientRect();
    
    const cx = centerScreenX ?? (rect ? rect.width / 2 : window.innerWidth / 2);
    const cy = centerScreenY ?? (rect ? rect.height / 2 : window.innerHeight / 2);

    const worldPoint = activeViewport.screenToWorld({ x: cx, y: cy });
    activeViewport.setZoom(targetZoom);

    let nextOffsetX = worldPoint.x;
    let nextOffsetY = worldPoint.y;

    if (centerScreenX !== undefined && centerScreenY !== undefined) {
      const screenCenterX = activeViewport.width / 2;
      const screenCenterY = activeViewport.height / 2;
      
      nextOffsetX = worldPoint.x - (cx - screenCenterX) / activeViewport.getZoom();
      nextOffsetY = worldPoint.y - (cy - screenCenterY) / activeViewport.getZoom();
    }

    activeViewport.setOffset(nextOffsetX, nextOffsetY);

    // Store viewport state globally for other components
    (window as any).__viewportState = {
      zoom: activeViewport.getZoom(),
      offsetX: nextOffsetX,
      offsetY: nextOffsetY
    };

    this.requestRender();
    window.dispatchEvent(new CustomEvent("sbs:canvas-update"));
    window.dispatchEvent(new CustomEvent("canvas-invalidate"));
  }

  public zoomIn(centerScreenX?: number, centerScreenY?: number): void {
    const activeViewport = this.getViewport();
    const currentZoom = activeViewport ? (activeViewport.getZoom() || 1.0) : 1.0;
    this.applyZoomAtPoint(currentZoom * this.scaleFactor, centerScreenX, centerScreenY);
  }

  public zoomOut(centerScreenX?: number, centerScreenY?: number): void {
    const activeViewport = this.getViewport();
    const currentZoom = activeViewport ? (activeViewport.getZoom() || 1.0) : 1.0;
    this.applyZoomAtPoint(currentZoom / this.scaleFactor, centerScreenX, centerScreenY);
  }

  /**
   * SELF-CONTAINED ZOOM WINDOW MARQUEE
   * Recalculates zoom extents and synchronizes the Viewport properly.
   */
  public executeZoomWindowUpPass(bounds: DOMRect, originalEvent: MouseEvent): void {
    const activeViewport = this.getViewport();
    if (!activeViewport || !this.zoomBoxStart || !this.zoomBoxCurrent) return;

    const dx = Math.abs(this.zoomBoxCurrent.x - this.zoomBoxStart.x);
    const dy = Math.abs(this.zoomBoxCurrent.y - this.zoomBoxStart.y);

    if (dx > 15 && dy > 15) {
      // Sort the pixel locations first
      const leftScreen = Math.min(this.zoomBoxStart.x, this.zoomBoxCurrent.x);
      const rightScreen = Math.max(this.zoomBoxStart.x, this.zoomBoxCurrent.x);
      const topScreen = Math.min(this.zoomBoxStart.y, this.zoomBoxCurrent.y);
      const bottomScreen = Math.max(this.zoomBoxStart.y, this.zoomBoxCurrent.y);

      // Unproject sorted pixel footprint corners to world space coordinates
      const topLeftWorld = activeViewport.screenToWorld({ x: leftScreen, y: topScreen });
      const bottomRightWorld = activeViewport.screenToWorld({ x: rightScreen, y: bottomScreen });

      const selectionWidth = Math.abs(bottomRightWorld.x - topLeftWorld.x);
      const selectionHeight = Math.abs(bottomRightWorld.y - topLeftWorld.y);

      if (selectionWidth > 0 && selectionHeight > 0) {
        // 1. Calculate the raw target center point of the window box
        const targetCentreX = Math.min(topLeftWorld.x, bottomRightWorld.x) + selectionWidth / 2;
        const targetCentreY = Math.min(topLeftWorld.y, bottomRightWorld.y) + selectionHeight / 2;

        // 2. Compute the exact zoom factor required to fit the box on screen
        const zoomWidthScale = activeViewport.width / selectionWidth;
        const zoomHeightScale = activeViewport.height / selectionHeight;
        const targetZoom = Math.min(zoomWidthScale, zoomHeightScale) * 0.85;

        // 3. Directly update the Viewport reference memory properties
        activeViewport.setZoom(targetZoom);
        activeViewport.setOffset(targetCentreX, targetCentreY);

        // 4. Store viewport state globally
        (window as any).__viewportState = {
          zoom: targetZoom,
          offsetX: targetCentreX,
          offsetY: targetCentreY
        };
      }
    } else {
      if (originalEvent.altKey) this.zoomOut(this.zoomBoxStart.x, this.zoomBoxStart.y);
      else this.zoomIn(this.zoomBoxStart.x, this.zoomBoxStart.y);
    }
    
    this.clearDragState();
    this.requestRender();
    window.dispatchEvent(new CustomEvent("sbs:canvas-update"));
    window.dispatchEvent(new CustomEvent("canvas-invalidate"));
  }

  public override onPointerDown(event: ToolPointerEvent): void {
    const nativeEvent = event.originalEvent as MouseEvent;
    const x = event.screenX;
    const y = event.screenY;

    const activeViewport = this.getViewport();
    if (!activeViewport) return;
    
    const currentOffset = activeViewport.getOffset();
    const isMiddleButton = nativeEvent.button === 1;

    if (isMiddleButton) {
      this.isPanning = true;
      this.setCursor("grabbing");
      this.panStartScreen = { x: nativeEvent.clientX, y: nativeEvent.clientY };
      this.panStartWorldOffset = { x: currentOffset.x, y: currentOffset.y };
    } else {
      this.isDraggingWindow = true;
      this.zoomBoxStart = { x, y };
      this.zoomBoxCurrent = { x, y };
    }
  }

  public override onPointerMove(event: ToolPointerEvent): void {
    const nativeEvent = event.originalEvent as MouseEvent;
    const activeViewport = this.getViewport();
    if (!activeViewport) return;

    if (this.isPanning) {
      const deltaScreenX = nativeEvent.clientX - this.panStartScreen.x;
      const deltaScreenY = nativeEvent.clientY - this.panStartScreen.y;
      
      const worldDeltaX = deltaScreenX / activeViewport.getZoom();
      const worldDeltaY = deltaScreenY / activeViewport.getZoom();

      const targetPanX = this.panStartWorldOffset.x - worldDeltaX;
      const targetPanY = this.panStartWorldOffset.y - worldDeltaY;
      
      activeViewport.setOffset(targetPanX, targetPanY);
      
      // Store viewport state globally
      (window as any).__viewportState = {
        zoom: activeViewport.getZoom(),
        offsetX: targetPanX,
        offsetY: targetPanY
      };
      
      this.requestRender();
      window.dispatchEvent(new CustomEvent("sbs:canvas-update"));
      window.dispatchEvent(new CustomEvent("canvas-invalidate"));
    } else if (this.isDraggingWindow && this.zoomBoxStart) {
      this.zoomBoxCurrent = { x: event.screenX, y: event.screenY };
      this.setCursor("crosshair");
      this.requestRender();
    }
  }

  public override onPointerUp(event: ToolPointerEvent): void {
    const canvasElement = event.originalEvent.currentTarget as HTMLCanvasElement;
    if (!canvasElement) return;

    const bounds = canvasElement.getBoundingClientRect();
    const nativeEvent = event.originalEvent as MouseEvent;

    if (this.isPanning) {
      this.setCursor("zoom-in");
      this.clearDragState();
      this.requestRender();
    } else if (this.isDraggingWindow) {
      this.executeZoomWindowUpPass(bounds, nativeEvent);
    } else {
      this.clearDragState();
    }
  }

  public override renderOverlay(context: CanvasRenderingContext2D): void {
    if (this.isDraggingWindow && this.zoomBoxStart && this.zoomBoxCurrent) {
      context.save();
      context.setTransform(1, 0, 0, 1, 0, 0); 
      context.strokeStyle = "#F59E0B";
      context.lineWidth = 1.5;
      context.fillStyle = "rgba(245, 158, 11, 0.08)";
      
      const bx = this.zoomBoxStart.x;
      const by = this.zoomBoxStart.y;
      const bw = this.zoomBoxCurrent.x - bx;
      const bh = this.zoomBoxCurrent.y - by;
      
      context.fillRect(bx, by, bw, bh);
      context.strokeRect(bx, by, bw, bh);
      context.restore();
    }
  }
}

export default ZoomTool;