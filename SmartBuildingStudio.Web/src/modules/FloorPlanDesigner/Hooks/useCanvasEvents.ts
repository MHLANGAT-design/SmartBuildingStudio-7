// src/modules/FloorPlanDesigner/Hooks/useCanvasEvents.ts
import { useRef } from 'react';
import { store } from "@/Application/ConfigureStore";

export function useCanvasEvents(
  viewportRef: React.MutableRefObject<any>, 
  canvasRef: React.RefObject<HTMLCanvasElement | null>, 
  triggerRedraw: () => void
) {
  const isPanningRef = useRef(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });

  const getActiveTool = () => {
    const mgr = (window as any).__toolManager || (window as any).__viewport?._toolManager;
    return mgr?.getActiveTool?.() || (window as any).__activeToolInstance;
  };

  const syncContext = (tool: any) => {
    const vp = viewportRef.current;
    
    // Explicitly update canvas size boundaries right before the tool queries them [INDEX]
    const canvas = canvasRef.current;
    if (canvas && canvas.parentElement) {
      vp.resize(canvas.parentElement.clientWidth, canvas.parentElement.clientHeight);
    }

    (window as any).__viewport = vp;
    (window as any).__viewportInstance = vp;
    (window as any).__floorPlanActiveViewportInstance = vp;
    (window as any).__viewportState = { 
      zoom: vp.getZoom(), 
      offsetX: vp.getOffset().x, 
      offsetY: vp.getOffset().y 
    };

    if (tool) {
      tool.viewport = vp;
      if (!tool.context) tool.context = {};
      tool.context.viewport = vp;
      tool.requestRender = triggerRedraw;
    }
  };

  // 🚀 MATHEMATICALLY ACCURATE POINTER GENERATOR
  const buildEvent = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas || !canvas.parentElement) return null;
    const rect = canvas.getBoundingClientRect();
    
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

    // 🧠 Force-sync viewport dimension constraints before mapping coordinates [INDEX]
    viewportRef.current.resize(canvas.parentElement.clientWidth, canvas.parentElement.clientHeight);
    
    // Call your native class converter with accurate dimensions [INDEX]
    const world = viewportRef.current.screenToWorld({ x: screenX, y: screenY });

    return { 
      screenX, 
      screenY, 
      worldX: world.x, 
      worldY: world.y, 
      button: e.button, 
      originalEvent: e.nativeEvent 
    };
  };

  return {
    isPanning: () => isPanningRef.current,
    getActiveTool,
    syncContext,
    onMouseDown: (e: React.MouseEvent<HTMLCanvasElement>) => {
      const tool = getActiveTool();
      if (tool && tool.getId() !== 'select' && typeof tool.onPointerDown === 'function') {
        syncContext(tool);
        const ev = buildEvent(e); 
        if (ev) tool.onPointerDown(ev);
      } else {
        isPanningRef.current = true;
        lastMousePosRef.current = { x: e.clientX, y: e.clientY };
      }
    },
    onMouseMove: (e: React.MouseEvent<HTMLCanvasElement>) => {
      const tool = getActiveTool(); 
      syncContext(tool);
      if (tool && tool.getId() !== 'select' && typeof tool.onPointerMove === 'function') {
        const ev = buildEvent(e); 
        if (ev) tool.onPointerMove(ev);
      } else if (isPanningRef.current) {
        // Map pan drag variations back through your native class algorithms [INDEX]
        viewportRef.current.panBy(e.clientX - lastMousePosRef.current.x, e.clientY - lastMousePosRef.current.y);
        lastMousePosRef.current = { x: e.clientX, y: e.clientY };
        triggerRedraw();
      }
    },
    onMouseUpOrLeave: (e: React.MouseEvent<HTMLCanvasElement>) => {
      isPanningRef.current = false;
      const tool = getActiveTool();
      if (tool && typeof tool.onPointerUp === 'function') {
        const ev = buildEvent(e); 
        if (ev) tool.onPointerUp(ev);
      }
    },
    onDoubleClick: (e: React.MouseEvent<HTMLCanvasElement>) => {
      const tool = getActiveTool();
      if (tool && typeof tool.onDoubleClick === 'function') {
        syncContext(tool);
        const ev = buildEvent(e); 
        if (ev) tool.onDoubleClick(ev);
      }
    }
  };
}
