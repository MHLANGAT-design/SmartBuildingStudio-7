// src/modules/FixturePlacementStudio/hooks/useFixtureCanvasPan.ts
//
// Pan hook for the FixturePlacementStudio canvas.
//
// Forked from FloorPlanDesigner's useCanvasPan. Points at
// state.fixture.viewport instead of state.floorPlan.viewport. Kept as a
// copy (rather than a shared hook) so each workspace can evolve its pan
// behaviour independently if needed.

import { useState, useCallback, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@/Application/ConfigureStore';
import { setViewport } from '@/modules/FixturePlacementStudio/store/fixtureSlice';

export interface UseCanvasPanResult {
  offset: { x: number; y: number };
  setOffset: (p: { x: number; y: number }) => void;
  isPanning: boolean;
  handleMouseDown: (e: React.MouseEvent) => void;
  handleMouseMove: (e: React.MouseEvent) => void;
  handleMouseUpOrLeave: (e?: React.MouseEvent) => void;
}

export function useFixtureCanvasPan(): UseCanvasPanResult {
  const dispatch = useAppDispatch();
  const offsetX = useAppSelector((state: any) => state.fixture?.viewport?.offsetX ?? 0);
  const offsetY = useAppSelector((state: any) => state.fixture?.viewport?.offsetY ?? 0);

  const [isPanning, setIsPanning] = useState(false);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);
  const startOffsetRef = useRef<{ x: number; y: number } | null>(null);

  const setOffset = useCallback(
    (p: { x: number; y: number }) => {
      dispatch(setViewport({ offsetX: p.x, offsetY: p.y }));
    },
    [dispatch]
  );

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsPanning(true);
    lastPosRef.current = { x: e.clientX, y: e.clientY };
    startOffsetRef.current = { x: offsetX, y: offsetY };
  }, [offsetX, offsetY]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning || !lastPosRef.current || !startOffsetRef.current) return;
    const dx = e.clientX - lastPosRef.current.x;
    const dy = e.clientY - lastPosRef.current.y;
    dispatch(
      setViewport({
        offsetX: startOffsetRef.current.x + dx,
        offsetY: startOffsetRef.current.y + dy,
      })
    );
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

export default useFixtureCanvasPan;