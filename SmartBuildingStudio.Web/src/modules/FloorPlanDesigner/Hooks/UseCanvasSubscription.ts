// UseCanvasSubscription.ts in C:\Users\Tif\Documents\Smart Building Studio\SmartBuildingStudio.Web\src\modules\FloorPlanDesigner\Hooks;
import { useSyncExternalStore, useState, useEffect } from "react";

/**
 * 📡 BULLETPROOF SUBSCRIPTION TUNNEL
 * Listens for system updates and bypasses structural length caching restrictions
 * to force instant HTML5 canvas repaints.
 */
export function UseCanvasSubscription(drawingDocument: any) {
  const [, forceUpdate] = useState({});

  useEffect(() => {
    const handleRepaint = () => forceUpdate({});
    
    // Listen directly for window invalidation events
    window.addEventListener("sbs:canvas-update", handleRepaint);
    window.addEventListener("canvas-invalidate", handleRepaint);
    
    return () => {
      window.removeEventListener("sbs:canvas-update", handleRepaint);
      window.removeEventListener("canvas-invalidate", handleRepaint);
    };
  }, []);

  return useSyncExternalStore(
    (onStoreChange) => {
      if (!drawingDocument) return () => {};
      
      window.addEventListener("sbs:canvas-update", onStoreChange);
      window.addEventListener("canvas-invalidate", onStoreChange);
      
      return () => {
        window.removeEventListener("sbs:canvas-update", onStoreChange);
        window.removeEventListener("canvas-invalidate", onStoreChange);
      };
    },
    // 🚀 FIXED: Dynamic date string updates force an immediate redraw cycle
    () => `${Date.now()}-${Math.random()}`
  );
}

export default UseCanvasSubscription;
