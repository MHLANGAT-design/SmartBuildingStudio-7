// src/modules/EmergencyLighting/Canvas/EmergencyCanvas/useCanvasSize.ts

import { useEffect, useState } from 'react';

export interface CanvasSize {
  width: number;
  height: number;
}

export function useCanvasSize(
  ref: React.RefObject<HTMLCanvasElement | null>,
): CanvasSize {
  const [size, setSize] = useState<CanvasSize>({ width: 0, height: 0 });

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || !canvas.parentElement) return;

    const parent = canvas.parentElement;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setSize({ width, height });
      }
    });

    observer.observe(parent);
    return () => observer.disconnect();
  }, [ref]);

  return size;
}