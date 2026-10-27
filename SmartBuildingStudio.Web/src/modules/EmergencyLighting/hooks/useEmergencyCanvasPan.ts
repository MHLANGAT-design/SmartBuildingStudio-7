// src/modules/EmergencyLighting/hooks/useEmergencyCanvasPan.ts

import { useState, useCallback, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@/Application/ConfigureStore';
import { setViewport } from '@/modules/EmergencyLighting/store/emergencySlice';

export function useEmergencyCanvasPan() {
  const dispatch = useAppDispatch();
  const offsetX = useAppSelector((s: any) => s.emergency.viewport.offsetX);
  const offsetY = useAppSelector((s: any) => s.emergency.viewport.offsetY);

  const [isPanning, setIsPanning] = useState(false);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);
  const startOffsetRef = useRef<{ x: number; y: number } | null>(null);

  const setOffset = useCallback((p: { x: number; y: number }) => {
    dispatch(setViewport({ offsetX: p.x, offsetY: p.y }));
  }, [dispatch]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsPanning(true);
    lastPosRef.current = { x: e.clientX, y: e.clientY };
    startOffsetRef.current = { x: offsetX, y: offsetY };
  }, [offsetX, offsetY]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning || !lastPosRef.current || !startOffsetRef.current) return;
    const dx = e.clientX - lastPosRef.current.x;
    const dy = e.clientY - lastPosRef.current.y;
    dispatch(setViewport({
      offsetX: startOffsetRef.current.x + dx,
      offsetY: startOffsetRef.current.y + dy,
    }));
  }, [isPanning, dispatch]);

  const handleMouseUpOrLeave = useCallback(() => {
    setIsPanning(false);
    lastPosRef.current = null;
    startOffsetRef.current = null;
  }, []);

  return {
    offset: { x: offsetX, y: offsetY },
    setOffset,
    isPanning,
    handleMouseDown,
    handleMouseMove,
    handleMouseUpOrLeave,
  };
}

export default useEmergencyCanvasPan;