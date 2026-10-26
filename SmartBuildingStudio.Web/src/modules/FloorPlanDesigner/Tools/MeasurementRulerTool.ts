import { BaseTool } from "@/modules/FloorPlanDesigner/Tools/Base/BaseTool";
import { ToolPointerEvent, MouseButton } from "@/modules/FloorPlanDesigner/Tools/Base/ITool";
import { Point2D } from "@/modules/FloorPlanDesigner/Utils/CoordinateTransforms";

export class MeasurementRulerTool extends BaseTool {
  public static readonly ID = "measurement-ruler";

  private startPoint: Point2D | null = null;
  private currentPoint: Point2D | null = null;
  private isMeasuring = false;

  private readonly SNAP_RADIUS_PIXELS = 20;
  private activeSnapPoint: Point2D | null = null;

  public getId(): string { 
    return MeasurementRulerTool.ID; 
  }

  public getName(): string { 
    return "Measurement Ruler"; 
  }

  protected override onActivate(): void {
    this.setCursor("crosshair");
    this.setStatus("Move near a vertex to snap. Click to lock starting point. Click again to complete measurement.");
    this.clearState();
    this.requestRender();
  }

  protected override onDeactivate(): void {
    this.clearState();
    this.requestRender();
  }

  private clearState(): void {
    this.startPoint = null;
    this.currentPoint = null;
    this.isMeasuring = false;
    this.activeSnapPoint = null;
  }

  private findNearestVertex(screenX: number, screenY: number, viewport: any): Point2D | null {
    const blueprintVectors = (window as any).__persistentDwgVectorBackupCache || [];
    if (blueprintVectors.length === 0 || !viewport || typeof viewport.worldToScreen !== "function") return null;

    let closestVertex: Point2D | null = null;
    let shortestDistance = this.SNAP_RADIUS_PIXELS;

    for (const line of blueprintVectors) {
      if (!line) continue;

      const pStart = line.start || line.Start;
      const pEnd = line.end || line.End;
      if (!pStart || !pEnd) continue;

      const screenStart = viewport.worldToScreen(pStart);
      const screenEnd = viewport.worldToScreen(pEnd);

      const distToStart = Math.hypot(screenX - screenStart.x, screenY - screenStart.y);
      if (distToStart < shortestDistance) {
        shortestDistance = distToStart;
        closestVertex = { x: pStart.x, y: pStart.y };
      }

      const distToEnd = Math.hypot(screenX - screenEnd.x, screenY - screenEnd.y);
      if (distToEnd < shortestDistance) {
        shortestDistance = distToEnd;
        closestVertex = { x: pEnd.x, y: pEnd.y };
      }
    }

    return closestVertex;
  }

  public override onPointerDown(event: ToolPointerEvent): void {
    const nativeEvent = event.originalEvent as MouseEvent;
    if (nativeEvent.button !== 0) return; 

    const activeViewport = (this as any).viewport || (this as any).context?.viewport || (this as any).context?.getViewport?.();
    if (!activeViewport) return;

    const snappedPoint = this.findNearestVertex(event.screenX, event.screenY, activeViewport);
    const resolvedWorldPos = snappedPoint || activeViewport.screenToWorld({ x: event.screenX, y: event.screenY });

    if (!this.isMeasuring) {
      this.isMeasuring = true;
      this.startPoint = resolvedWorldPos;
      this.currentPoint = resolvedWorldPos;
      this.setStatus("Starting point locked. Move near an endpoint to snap the secondary anchor.");
    } else {
      this.isMeasuring = false;
      this.currentPoint = resolvedWorldPos;
      this.setStatus(`Locked Distance: ${this.calculateDistanceInMeters().toFixed(3)} m. Click to start a new measurement.`);
    }

    this.requestRender();
  }

  public override onPointerMove(event: ToolPointerEvent): void {
    const activeViewport = (this as any).viewport || (this as any).context?.viewport || (this as any).context?.getViewport?.();
    if (!activeViewport) return;

    const snapped = this.findNearestVertex(event.screenX, event.screenY, activeViewport);
    this.activeSnapPoint = snapped;

    if (this.isMeasuring && this.startPoint) {
      this.currentPoint = snapped || activeViewport.screenToWorld({ x: event.screenX, y: event.screenY });
    }

    this.requestRender();
  }

  public override onKeyDown(event: KeyboardEvent): boolean {
    if (event.key === "Escape") {
      this.clearState();
      this.setStatus("Measurement canceled. Move near an endpoint to measure.");
      this.requestRender();
      return true;
    }
    return false;
  }

  /**
   * 🚀 FIXED SCALE FACTOR FORMULA
   * Computes Euclidean distance in raw CAD world units (mm) and divides by 1000
   * to output the result in meters (m).
   */
  private calculateDistanceInMeters(): number {
    if (!this.startPoint || !this.currentPoint) return 0;
    const dx = this.currentPoint.x - this.startPoint.x;
    const dy = this.currentPoint.y - this.startPoint.y;
    const distanceInMillimeters = Math.sqrt(dx * dx + dy * dy);
    
    return distanceInMillimeters / 1000.0;
  }

  public renderOverlay(context: CanvasRenderingContext2D): void {
    const activeViewport = (this as any).viewport || (this as any).context?.viewport || (this as any).context?.getViewport?.();
    if (!activeViewport) return;

    if (this.activeSnapPoint) {
      const snapScreen = activeViewport.worldToScreen(this.activeSnapPoint);
      context.save();
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.strokeStyle = "#F59E0B"; 
      context.lineWidth = 2;
      context.strokeRect(snapScreen.x - 6, snapScreen.y - 6, 12, 12);
      context.restore();
    }

    if (!this.startPoint || !this.currentPoint) return;

    const p1 = activeViewport.worldToScreen(this.startPoint);
    const p2 = activeViewport.worldToScreen(this.currentPoint);

    context.save();
    context.setTransform(1, 0, 0, 1, 0, 0);

    context.strokeStyle = "#05FFC4"; 
    context.lineWidth = 1.5;
    context.beginPath();
    context.moveTo(p1.x, p1.y);
    context.lineTo(p2.x, p2.y);
    context.stroke();

    context.fillStyle = "#05FFC4";
    context.beginPath();
    context.arc(p1.x, p1.y, 4, 0, Math.PI * 2);
    context.arc(p2.x, p2.y, 4, 0, Math.PI * 2);
    context.fill();

    // Pull the corrected metrics
    const distanceMeters = this.calculateDistanceInMeters();
    const textString = `${distanceMeters.toFixed(2)} m`;

    const midX = (p1.x + p2.x) / 2;
    const midY = (p1.y + p2.y) / 2;

    context.font = "bold 11px monospace";
    const textWidth = context.measureText(textString).width;
    const boxW = textWidth + 16;
    const boxH = 22;

    context.fillStyle = "rgba(3, 7, 18, 0.9)";
    context.strokeStyle = "#05FFC4";
    context.lineWidth = 1;
    context.fillRect(midX - boxW / 2, midY - boxH / 2, boxW, boxH);
    context.strokeRect(midX - boxW / 2, midY - boxH / 2, boxW, boxH);

    context.fillStyle = "#ffffff";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(textString, midX, midY + 1);

    context.restore();
  }
}

export default MeasurementRulerTool;
