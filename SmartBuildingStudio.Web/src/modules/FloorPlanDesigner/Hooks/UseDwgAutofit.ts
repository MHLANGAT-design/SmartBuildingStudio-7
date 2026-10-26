// src/modules/FloorPlanDesigner/Hooks/UseDwgAutofit.ts
// ✅ REFACTORED – Uses Redux instead of Viewport/DrawingDocument

import { useCallback, useEffect, useRef } from "react";
import { useAppSelector, useAppDispatch } from "@/Application/ConfigureStore";
import { setZoom, setOffset } from "@/modules/FloorPlanDesigner/Store/FloorPlanSlice";
import { spatialReferenceServiceInstance } from "@/modules/FloorPlanDesigner/Spatial/SpatialReferenceService";

export interface UseDwgAutofitReturn {
  autoFitViewport: (forceOverride?: boolean) => void;
}

export function UseDwgAutofit(): UseDwgAutofitReturn {
  const dispatch = useAppDispatch();
  const document = useAppSelector((state) => state.floorPlan.document);
  const viewport = useAppSelector((state) => state.floorPlan.viewport);

  const isInitialFramingComplete = useRef<boolean>(false);
  const coreHistoricalMaxCount = useRef<number>(0);

  const autoFitViewport = useCallback(
    (forceOverride?: boolean) => {
      // Gather vectors from Redux document (walls) and global fallback
      let vectors: any[] = (window as any).__persistentDwgVectorBackupCache || [];

      // Also try global instance as fallback
      const globalInstance = (window as any).__floorPlanActiveDocumentInstance;
      if (globalInstance && typeof globalInstance.getWalls === "function") {
        const instanceWalls = globalInstance.getWalls() || [];
        if (instanceWalls.length > vectors.length) vectors = instanceWalls;
      }

      // If we have no vectors in the fallback, try from Redux document
      if (vectors.length === 0 && document?.walls) {
        vectors = document.walls;
      }

      // Update max count for tracking
      if (vectors.length > coreHistoricalMaxCount.current) {
        coreHistoricalMaxCount.current = vectors.length;
      } else if (isInitialFramingComplete.current && vectors.length > 0 && !forceOverride) {
        // Already framed and not forced – skip
        return;
      }

      // Need at least a few vectors to compute bounds
      if (!vectors || vectors.length <= 2) {
        return;
      }

      console.log("[UseDwgAutofit Engine]: Computing absolute viewport constraints for:", vectors.length, "vectors.");
      isInitialFramingComplete.current = true;

      // Compute bounds from vectors
      let minX = Infinity,
        maxX = -Infinity,
        minY = Infinity,
        maxY = -Infinity;
      vectors.forEach((w: any) => {
        // Support both wall objects and raw line segments
        const pts = [
          { x: w.startX, y: w.startY },
          { x: w.endX, y: w.endY },
        ];
        pts.forEach((p) => {
          if (p.x !== undefined && p.y !== undefined) {
            if (p.x < minX) minX = p.x;
            if (p.x > maxX) maxX = p.x;
            if (p.y < minY) minY = p.y;
            if (p.y > maxY) maxY = p.y;
          }
        });
      });

      if (!isFinite(minX)) {
        // No valid points found – abort
        return;
      }

      // Store bounds in spatial reference service (for compatibility)
      const spatialReference = {
        bounds: { minX, maxX, minY, maxY, width: () => maxX - minX, height: () => maxY - minY },
      };
      spatialReferenceServiceInstance.setSpatialReference(spatialReference);

      // Determine viewport dimensions
      const canvasElement = document.querySelector("canvas");
      const viewportWidth = canvasElement ? canvasElement.width : window.innerWidth;
      const viewportHeight = canvasElement ? canvasElement.height : window.innerHeight;

      const drawingWidth = maxX - minX || 1;
      const drawingHeight = maxY - minY || 1;
      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;

      // Calculate ideal zoom with padding
      const padding = 0.82; // 82% of the viewport to leave margin
      const zoomWidth = (viewportWidth * padding) / drawingWidth;
      const zoomHeight = (viewportHeight * padding) / drawingHeight;
      let newZoom = Math.min(zoomWidth, zoomHeight);

      // Clamp zoom to reasonable bounds (same as Viewport.MIN_ZOOM / MAX_ZOOM)
      const MIN_ZOOM = 0.000000001;
      const MAX_ZOOM = 100.0;
      newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newZoom));

      // Dispatch Redux actions to update viewport
      dispatch(setZoom(newZoom));
      dispatch(setOffset({ x: centerX, y: centerY }));

      // Store in global for backward compatibility
      (window as any).__viewportState = { zoom: newZoom, offsetX: centerX, offsetY: centerY, bounds: spatialReference.bounds };
      (window as any).__viewportInstance = { zoom: newZoom, offsetX: centerX, offsetY: centerY };
      (window as any).__floorPlanActiveViewportInstance = { zoom: newZoom, offsetX: centerX, offsetY: centerY };

      // Trigger canvas updates
      window.dispatchEvent(new CustomEvent("sbs:canvas-update"));
      window.dispatchEvent(new CustomEvent("canvas-invalidate"));
    },
    [dispatch, document]
  );

  // Auto-fit on first load when document becomes available
  useEffect(() => {
    const handleLatePayloadArrival = () => {
      const activeDoc = (window as any).__floorPlanActiveDocumentInstance;
      if (activeDoc) {
        autoFitViewport();
      }
    };
    window.addEventListener("sbs:canvas-update", handleLatePayloadArrival);
    window.addEventListener("canvas-invalidate", handleLatePayloadArrival);
    return () => {
      window.removeEventListener("sbs:canvas-update", handleLatePayloadArrival);
      window.removeEventListener("canvas-invalidate", handleLatePayloadArrival);
    };
  }, [autoFitViewport]);

  return { autoFitViewport };
}

export default UseDwgAutofit;