// src/modules/FloorPlanDesigner/Hooks/UseFloorPlanDesignerManagers.ts
// ✅ SAFE VERSION – never returns null for critical objects

import { useMemo, useEffect, useRef } from "react";
import { useAppDispatch } from "@/Application/ConfigureStore";
import { store } from "@/Application/ConfigureStore";
import { setZoom, setOffset } from "@/modules/FloorPlanDesigner/Store/FloorPlanSlice";
import { DocumentManager } from "@/modules/FloorPlanDesigner/Document/DocumentManager";
import { CommandManager } from "@/modules/FloorPlanDesigner/Commands/CommandManager";
import { ToolContext } from "@/modules/FloorPlanDesigner/Tools/Base/ToolContext";
import { ToolManager } from "@/modules/FloorPlanDesigner/Tools/ToolManager";
import { FloorPlanApi } from "@/modules/FloorPlanDesigner/Services/FloorPlanApi";
import { SelectTool } from "@/modules/FloorPlanDesigner/Tools/SelectTool";
import { WallTool } from "@/modules/FloorPlanDesigner/Tools/WallTool";
import { DoorTool } from "@/modules/FloorPlanDesigner/Tools/DoorTool";
import { WindowTool } from "@/modules/FloorPlanDesigner/Tools/WindowTool";
import { RoomTool } from "@/modules/FloorPlanDesigner/Tools/RoomTool";
import { PanTool } from "@/modules/FloorPlanDesigner/Tools/PanTool";
import { ZoomTool } from "@/modules/FloorPlanDesigner/Tools/ZoomTool";
import { MeasurementRulerTool } from "@/modules/FloorPlanDesigner/Tools/MeasurementRulerTool";

export const UseFloorPlanDesignerManagers = (drawingDocInstance: any) => {
  const dispatch = useAppDispatch();
  const viewportRef = useRef<any>(null);

  // === 1. Command Manager (always succeeds) ===
  const sharedCommandManager = useMemo(() => {
    try {
      return new CommandManager();
    } catch (e) {
      console.error('[Managers] Failed to create CommandManager:', e);
      return null;
    }
  }, []);

  // === 2. Viewport (Redux-driven, no `this`) ===
  //
  // The canvas reads zoom from state.floorPlan.viewport.zoom (via
  // useCanvasZoom). This viewport object is the imperative facade that
  // tools and UI call to drive zoom. Every method dispatches to Redux,
  // which the canvas picks up automatically on the next render.
  //
  // fitToContent was already dispatching to Redux — it just didn't work
  // before because nothing read from Redux. Now that the canvas reads
  // scale from Redux, all of these work.
  const sharedViewport = useMemo(() => {
    try {
      const requestRender = () => {
        window.dispatchEvent(new CustomEvent("sbs:canvas-update"));
        window.dispatchEvent(new CustomEvent("canvas-invalidate"));
      };

      const clampZoom = (z: number) => Math.min(Math.max(z, 0.05), 20);

      return {
        getZoom: (): number => {
          const state = (store as any).getState() as any;
          return state?.floorPlan?.viewport?.zoom ?? 1;
        },

        setZoom: (z: number) => {
          dispatch(setZoom(clampZoom(z)));
          requestRender();
        },

        zoomIn: (step = 1.15) => {
          const state = (store as any).getState() as any;
          const current = state?.floorPlan?.viewport?.zoom ?? 1;
          dispatch(setZoom(clampZoom(current * step)));
          requestRender();
        },

        zoomOut: (step = 1.15) => {
          const state = (store as any).getState() as any;
          const current = state?.floorPlan?.viewport?.zoom ?? 1;
          dispatch(setZoom(clampZoom(current / step)));
          requestRender();
        },

        fitToContent: () => {
          try {
            const doc = (window as any).__floorPlanActiveDocumentInstance || drawingDocInstance;
            if (!doc) return;
            const walls = doc.getWalls ? doc.getWalls() : (doc.walls || []);
            if (!walls || walls.length === 0) return;

            let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
            walls.forEach((w: any) => {
              const startX = w.startX ?? w.x1 ?? 0;
              const startY = w.startY ?? w.y1 ?? 0;
              const endX = w.endX ?? w.x2 ?? 0;
              const endY = w.endY ?? w.y2 ?? 0;
              if (startX < minX) minX = startX;
              if (startX > maxX) maxX = startX;
              if (startY < minY) minY = startY;
              if (startY > maxY) maxY = startY;
              if (endX < minX) minX = endX;
              if (endX > maxX) maxX = endX;
              if (endY < minY) minY = endY;
              if (endY > maxY) maxY = endY;
            });

            if (!isFinite(minX)) return;

            const canvas = document.querySelector("canvas");
            const width = canvas ? canvas.width : window.innerWidth;
            const height = canvas ? canvas.height : window.innerHeight;
            const dx = maxX - minX || 1;
            const dy = maxY - minY || 1;
            const padding = 0.82;
            const zoomX = (width * padding) / dx;
            const zoomY = (height * padding) / dy;
            const newZoom = Math.min(zoomX, zoomY);
            const centerX = (minX + maxX) / 2;
            const centerY = (minY + maxY) / 2;

            dispatch(setZoom(clampZoom(newZoom)));
            dispatch(setOffset({ x: centerX, y: centerY }));
            requestRender();
          } catch (e) {
            console.warn('[Viewport] fitToContent error:', e);
          }
        },

        requestRender,
      };
    } catch (e) {
      console.error('[Managers] Failed to create viewport:', e);
      return {
        getZoom: () => 1,
        setZoom: () => {},
        zoomIn: () => {},
        zoomOut: () => {},
        fitToContent: () => {},
        requestRender: () => {},
      };
    }
  }, [dispatch, drawingDocInstance]);

  // === 3. Document Manager ===
  const sharedDocumentManager = useMemo(() => {
    try {
      const manager = new DocumentManager();
      (window as any).__sbsDocumentManager = manager;
      return manager;
    } catch (e) {
      console.error('[Managers] Failed to create DocumentManager:', e);
      return null;
    }
  }, []);

  // === 4. Tool Context (depends on drawingDocInstance) ===
  const sharedToolContext = useMemo(() => {
    try {
      if (!drawingDocInstance) {
        console.warn('[Managers] No drawingDocInstance – ToolContext is null');
        return null;
      }
      if (!sharedDocumentManager || !sharedCommandManager) {
        console.warn('[Managers] Missing managers – ToolContext is null');
        return null;
      }
      return new ToolContext(drawingDocInstance, sharedDocumentManager, sharedCommandManager);
    } catch (e) {
      console.error('[Managers] Failed to create ToolContext:', e);
      return null;
    }
  }, [drawingDocInstance, sharedDocumentManager, sharedCommandManager]);

  // === 5. Tool Manager (depends on ToolContext) ===
  const sharedToolManager = useMemo(() => {
    try {
      if (!sharedToolContext) {
        console.warn('[Managers] No ToolContext – ToolManager is null');
        return null;
      }
      const manager = new ToolManager(sharedToolContext);
      manager.setDispatcher(dispatch);
      manager.register(new SelectTool());
      manager.register(new WallTool());
      manager.register(new DoorTool());
      manager.register(new WindowTool());
      manager.register(new RoomTool());
      manager.register(new PanTool());
      manager.register(new ZoomTool());
      manager.register(new MeasurementRulerTool());
      try {
        manager.activate((SelectTool as any).ID || "select");
      } catch (err) {
        console.warn('[Managers] Tool activation failed:', err);
      }
      return manager;
    } catch (e) {
      console.error('[Managers] Failed to create ToolManager:', e);
      return null;
    }
  }, [sharedToolContext, dispatch]);

  // === 6. API Instance ===
  const apiInstance = useMemo(() => {
    try {
      if (!sharedDocumentManager || !sharedCommandManager) {
        console.warn('[Managers] Missing managers – API is null');
        return null;
      }
      const api = new FloorPlanApi(
        sharedDocumentManager,
        sharedCommandManager,
        sharedDocumentManager.getUndoRedo?.() || null
      );
      if (api && typeof (api as any).registerImportCallback === "function") {
        (api as any).registerImportCallback((incomingParsedData: any) => {
          const guid = (window as any).__activeDocumentId || 'unknown';
          console.log(`[Identity Shield] Locking blueprint to: ${guid}`);
          if (incomingParsedData) {
            incomingParsedData.id = guid;
            incomingParsedData.documentId = guid;
            if (incomingParsedData.metadata) {
              incomingParsedData.metadata.id = guid;
            }
          }
          if ((window as any).__floorPlanActiveDocumentInstance) {
            (window as any).__floorPlanActiveDocumentInstance.id = guid;
          }
        });
      }
      return api;
    } catch (e) {
      console.error('[Managers] Failed to create FloorPlanApi:', e);
      return null;
    }
  }, [sharedDocumentManager, sharedCommandManager]);

  // === 7. Auto‑center (safe) ===
  useEffect(() => {
    try {
      const global = (window as any).__floorPlanActiveDocumentInstance;
      if (global && typeof global.getWalls === "function") {
        const walls = global.getWalls();
        if (walls && walls.length > 0) {
          const timer = setTimeout(() => {
            if (sharedViewport && typeof sharedViewport.fitToContent === "function") {
              sharedViewport.fitToContent();
            }
          }, 200);
          return () => clearTimeout(timer);
        }
      }
    } catch (e) {
      console.warn('[Managers] Auto‑center error:', e);
    }
  }, [drawingDocInstance, sharedViewport]);

  return {
    sharedViewport,
    sharedDocumentManager,
    sharedToolContext,
    sharedToolManager,
    apiInstance,
  };
};

export default UseFloorPlanDesignerManagers;