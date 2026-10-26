import { useState, useRef, useCallback } from 'react';

export function useCanvasPan() {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const startPoint = useRef({ x: 0, y: 0 });

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsPanning(true);
    startPoint.current = { x: e.clientX - offset.x, y: e.clientY - offset.y };
  }, [offset]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning) return;
    setOffset({
      x: e.clientX - startPoint.current.x,
      y: e.clientY - startPoint.current.y
    });
  }, [isPanning]);

  const handleMouseUpOrLeave = useCallback(() => {
    setIsPanning(false);
  }, []);

  const resetPan = useCallback(() => setOffset({ x: 0, y: 0 }), []);

  return {
    offset,
    setOffset,
    isPanning,
    handleMouseDown,
    handleMouseMove,
    handleMouseUpOrLeave,
    resetPan,
  };
}