import { SpatialReference } from "@/modules/FloorPlanDesigner/Spatial/SpatialReference";
import { CoordinateSystem } from "@/modules/FloorPlanDesigner/Spatial/CoordinateSystem";
import { SpatialBounds } from "@/modules/FloorPlanDesigner/Spatial/SpatialBounds";

export class SpatialReferenceService {
  private currentReference: SpatialReference;

  constructor() {
    this.currentReference = new SpatialReference(new CoordinateSystem(), new SpatialBounds());
  }

  public getSpatialReference(): SpatialReference {
    return this.currentReference;
  }

  public setSpatialReference(reference: SpatialReference): void {
    if (!reference) return;

    const oldBaseX = this.currentReference.coordinateSystem.insertionBaseX;
    const oldBaseY = this.currentReference.coordinateSystem.insertionBaseY;
    const oldMinX = this.currentReference.bounds.minX;
    const oldMaxX = this.currentReference.bounds.maxX;
    const oldMinY = this.currentReference.bounds.minY;
    const oldMaxY = this.currentReference.bounds.maxY;

    const newBaseX = reference.coordinateSystem.insertionBaseX;
    const newBaseY = reference.coordinateSystem.insertionBaseY;
    const newMinX = reference.bounds.minX;
    const newMaxX = reference.bounds.maxX;
    const newMinY = reference.bounds.minY;
    const newMaxY = reference.bounds.maxY;

    // Strict Guard: Terminate infinite update dispatch loops
    if (
      Math.abs(oldBaseX - newBaseX) < 0.001 &&
      Math.abs(oldBaseY - newBaseY) < 0.001 &&
      Math.abs(oldMinX - newMinX) < 0.001 &&
      Math.abs(oldMaxX - newMaxX) < 0.001 &&
      Math.abs(oldMinY - newMinY) < 0.001 &&
      Math.abs(oldMaxY - newMaxY) < 0.001
    ) {
      return;
    }

    this.currentReference = reference;

    window.dispatchEvent(new CustomEvent("sbs:spatial-reference-changed", { detail: reference }));
    window.dispatchEvent(new CustomEvent("sbs:canvas-update"));
    window.dispatchEvent(new CustomEvent("canvas-invalidate"));
  }

  public reset(): void {
    this.currentReference = new SpatialReference(new CoordinateSystem(), new SpatialBounds());
  }
}

export const spatialReferenceServiceInstance = new SpatialReferenceService();
export default SpatialReferenceService;
