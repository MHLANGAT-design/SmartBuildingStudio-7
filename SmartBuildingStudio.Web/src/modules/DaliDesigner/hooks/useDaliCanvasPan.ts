// src/modules/DaliDesigner/hooks/useDaliCanvasPan.ts
//
// Pan hook for the DALI Designer canvas.
// Mirrors useFixtureCanvasPan, backed by state.dali.viewport.

import { useState, useCallback, useRef } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setViewportOffset } from "@/modules/DaliDesigner/store/daliSlice";

export interface UseDaliCanvasPanResult {
  offset: { x: number; y: number };
  setOffset: (p: { x: number; y: number }) => void;
  isPanning: boolean;
  handleMouseDown: (e: React.MouseEvent) => void;
  handleMouseMove: (e: React.MouseEvent) => void;
  handleMouseUpOrLeave: (e?: React.MouseEvent) => void;
}

export function useDaliCanvasPan(): UseDaliCanvasPanResult {
  const dispatch = useAppDispatch();
  const offsetX = useAppSelector((s: any) => s.dali?.viewport?.offsetX ?? 0);
  const offsetY = useAppSelector((s: any) => s.dali?.viewport?.offsetY ?? 0);

  const [isPanning, setIsPanning] = useState(false);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);
  const startOffsetRef = useRef<{ x: number; y: number } | null>(null);

  const setOffset = useCallback(
    (p: { x: number; y: number }) => {
      dispatch(setViewportOffset({ x: p.x, y: p.y }));
    },
    [dispatch]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      setIsPanning(true);
      lastPosRef.current = { x: e.clientX, y: e.clientY };
      startOffsetRef.current = { x: offsetX, y: offsetY };
    },
    [offsetX, offsetY]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isPanning || !lastPosRef.current || !startOffsetRef.current) return;
      const dx = e.clientX - lastPosRef.current.x;
      const dy = e.clientY - lastPosRef.current.y;
      dispatch(
        setViewportOffset({
          x: startOffsetRef.current.x + dx,
          y: startOffsetRef.current.y + dy,
        })
      );
    },
    [isPanning, dispatch]
  );

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

export default useDaliCanvasPan;