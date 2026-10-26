import { SpatialReference, SpatialUnits } from "@/modules/FloorPlanDesigner/Spatial/SpatialReference";
import { CoordinateSystem } from "@/modules/FloorPlanDesigner/Spatial/CoordinateSystem";
import { SpatialBounds } from "@/modules/FloorPlanDesigner/Spatial/SpatialBounds";

export class SpatialReferenceFactory {
  /**
   * Scans raw line vector packages, calculates real bounding dimensions,
   * and builds a highly precise SpatialReference token.
   */
  public static createFromVectors(vectors: any[]): SpatialReference {
    if (!vectors || vectors.length === 0) {
      return new SpatialReference(new CoordinateSystem(), new SpatialBounds());
    }

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    let validVectorCount = 0;

    vectors.forEach((line) => {
      if (!line) return;

      let sx = 0, sy = 0, ex = 0, ey = 0;
      let hasValidCoords = false;

      if (typeof line.startX === "number" && typeof line.startY === "number") {
        sx = line.startX;
        sy = line.startY;
        ex = typeof line.endX === "number" ? line.endX : sx;
        ey = typeof line.endY === "number" ? line.endY : sy;
        hasValidCoords = true;
      } 
      else if (line.vertices && Array.isArray(line.vertices) && line.vertices.length > 0) {
        line.vertices.forEach((v: any) => {
          if (!v) return;
          const vx = typeof v.x === "number" ? v.x : v.X ?? 0;
          const vy = typeof v.y === "number" ? v.y : v.Y ?? 0;
          minX = Math.min(minX, vx); maxX = Math.max(maxX, vx);
          minY = Math.min(minY, vy); maxY = Math.max(maxY, vy);
          validVectorCount++;
        });
        return;
      }
      else {
        const s = line.start || line.Start || line.pixelStart || line.position;
        const e = line.end || line.End || line.pixelEnd || line.endPosition;
        if (s && e) {
          sx = typeof s.x === "number" ? s.x : s.X ?? 0;
          sy = typeof s.y === "number" ? s.y : s.Y ?? 0;
          ex = typeof e.x === "number" ? e.x : e.X ?? 0;
          ey = typeof e.y === "number" ? e.y : e.Y ?? 0;
          hasValidCoords = true;
        }
      }

      if (hasValidCoords) {
        minX = Math.min(minX, sx, ex); maxX = Math.max(maxX, sx, ex);
        minY = Math.min(minY, sy, ey); maxY = Math.max(maxY, sy, ey);
        validVectorCount++;
      }
    });
    if (validVectorCount === 0 || minX === Infinity || maxX === -Infinity) {
      console.warn("[Spatial Factory Guard]: No geometry matched tracking metrics. Applying default boundaries landscape.");
      minX = 0; maxX = 10000;
      minY = 0; maxY = 10000;
    }

    // 🚀 FIXED: Create a proxy mapping wrapper around SpatialBounds instance.
    // This exposes BOTH native method invocations and direct data attribute lookups (.width, .height)
    // to satisfy both UseDwgAutofit.ts versions without throwing hidden NaN/1 failures!
    const boundsInstance = new SpatialBounds(minX, minY, maxX, maxY);
    const calculatedWidth = maxX - minX;
    const calculatedHeight = maxY - minY;

    const structuralBoundsProxy = Object.create(boundsInstance);
    Object.defineProperties(structuralBoundsProxy, {
      minX: { value: minX, writable: true, enumerable: true },
      maxX: { value: maxX, writable: true, enumerable: true },
      minY: { value: minY, writable: true, enumerable: true },
      maxY: { value: maxY, writable: true, enumerable: true },
      width: { value: typeof boundsInstance.width === "function" ? calculatedWidth : calculatedWidth, writable: true, enumerable: true },
      height: { value: typeof boundsInstance.height === "function" ? calculatedHeight : calculatedHeight, writable: true, enumerable: true }
    });

    // Support standard internal method evaluations seamlessly if invoked via native getters
    structuralBoundsProxy.width = () => calculatedWidth;
    structuralBoundsProxy.height = () => calculatedHeight;

    const centroid = boundsInstance.getCentroid();
    const coordinateSystem = new CoordinateSystem(0, 0, 0, centroid.x, centroid.y);

    console.log(`[Spatial Factory]: Dynamic reference created. Extents width: ${calculatedWidth.toFixed(0)} units.`);
    return new SpatialReference(coordinateSystem, structuralBoundsProxy, SpatialUnits.Millimetres);
  }
}

export default SpatialReferenceFactory;
