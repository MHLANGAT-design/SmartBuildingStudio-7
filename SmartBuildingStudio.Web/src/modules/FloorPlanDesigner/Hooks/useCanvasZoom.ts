import { useState, useCallback } from 'react';

export function useCanvasZoom() {
  const [scale, setScale] = useState(1.0);

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const zoomFactor = 1.1;
    if (e.deltaY < 0) {
      setScale((prev) => Math.min(prev * zoomFactor, 20.0));
    } else {
      setScale((prev) => Math.max(prev / zoomFactor, 0.05));
    }
  }, []);

  const resetZoom = useCallback(() => setScale(1.0), []);

  return { scale, setScale, handleWheel, resetZoom };
}