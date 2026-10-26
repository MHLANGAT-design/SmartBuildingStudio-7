import { useMemo, useCallback } from "react";

export interface UtmBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  width?: () => number;
  height?: () => number;
}

export function UseUtmCoordinateBridge(bounds: UtmBounds | null) {
  // Establish a permanent session anchor at the midpoint of your high-value map data limits.
  // Includes an automatic threshold barrier to leave normal room scale coordinates completely untouched.
  const localOrigin = useMemo(() => {
    if (!bounds) return { x: 0, y: 0 };
    
    // Auto-detect threshold: If data coordinates sit below 50,000, bypass the local shifting engine.
    const absoluteMaxX = typeof bounds.maxX === "function" ? (bounds as any).maxX() : bounds.maxX;
    const absoluteMaxY = typeof bounds.maxY === "function" ? (bounds as any).maxY() : bounds.maxY;

    if (Math.abs(absoluteMaxX) < 50000 && Math.abs(absoluteMaxY) < 50000) {
      return { x: 0, y: 0 }; 
    }
    
    const minXVal = typeof bounds.minX === "function" ? (bounds as any).minX() : bounds.minX;
    const maxXVal = typeof bounds.maxX === "function" ? (bounds as any).maxX() : bounds.maxX;
    const minYVal = typeof bounds.minY === "function" ? (bounds as any).minY() : bounds.minY;
    const maxYVal = typeof bounds.maxY === "function" ? (bounds as any).maxY() : bounds.maxY;

    return {
      x: (minXVal + maxXVal) / 2,
      y: (minYVal + maxYVal) / 2
    };
  }, [bounds]);

  /**
   * LAYER 1: DATA-TO-RENDER TRANSFORMATION
   * Converts massive georeferenced coordinates down to tiny local floats.
   * Use this inside continuous looping arrays (e.g., ctx.moveTo, ctx.lineTo).
   */
  const toLocalSpace = useCallback((utmX: number, utmY: number) => {
    return {
      x: utmX - localOrigin.x,
      y: utmY - localOrigin.y
    };
  }, [localOrigin]);

  /**
   * LAYER 2: RENDER-TO-DATA TRANSFORMATION
   * Reconstructs localized coordinates back into raw real-world absolute geodetic parameters.
   * Use this to expose absolute UTM tracking to tooltips and properties panels.
   */
  const toAbsoluteUtm = useCallback((localX: number, localY: number) => {
    return {
      x: localX + localOrigin.x,
      y: localY + localOrigin.y
    };
  }, [localOrigin]);

  return {
    localOrigin,
    toLocalSpace,
    toAbsoluteUtm,
    hasOriginShift: localOrigin.x !== 0 || localOrigin.y !== 0
  };
}
