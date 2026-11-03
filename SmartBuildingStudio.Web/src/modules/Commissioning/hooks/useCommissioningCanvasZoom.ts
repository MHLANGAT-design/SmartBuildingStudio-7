// src/modules/Commissioning/hooks/useCommissioningCanvasZoom.ts

import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/Application/ConfigureStore';
import { setViewport } from '@/modules/Commissioning/store/commissioningSlice';

const WHEEL_STEP = 0.15;
const BUTTON_STEP = 0.3;
const MIN_ZOOM = 0.1;
const MAX_ZOOM = 20;

export function useCommissioningCanvasZoom() {
  const dispatch = useAppDispatch();
  const scale = useAppSelector((s: any) => s.commissioning.viewport.zoom);

  const setZoom = useCallback((z: number) => {
    dispatch(setViewport({ zoom: Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, z)) }));
  }, [dispatch]);

  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const direction = e.deltaY < 0 ? 1 : -1;
    setZoom(scale + WHEEL_STEP * direction);
  }, [scale, setZoom]);

  return { scale, setZoom, handleWheel };
}

export default useCommissioningCanvasZoom;