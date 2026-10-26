// src/modules/DaliDesigner/hooks/useDaliCanvasZoom.ts
//
// Zoom hook for the DALI Designer canvas.
// Additive steps (not multiplicative) so trackpad flicks don't race
// the scale away. Mirrors useFixtureCanvasZoom.

import { useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setViewportZoom } from "@/modules/DaliDesigner/store/daliSlice";

const ZOOM_STEP = 0.15;
const MIN_ZOOM = 0.1;
const MAX_ZOOM = 20;

export interface UseDaliCanvasZoomResult {
  scale: number;
  setZoom: (z: number) => void;
  handleWheel: (e: React.WheelEvent<HTMLCanvasElement>) => void;
}

export function useDaliCanvasZoom(): UseDaliCanvasZoomResult {
  const dispatch = useAppDispatch();
  const scale = useAppSelector((s: any) => s.dali?.viewport?.zoom ?? 1);

  const setZoomClamped = useCallback(
    (z: number) => {
      const next = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, z));
      dispatch(setViewportZoom(next));
    },
    [dispatch]
  );

  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      const direction = e.deltaY < 0 ? 1 : -1;
      const step = ZOOM_STEP * direction;
      setZoomClamped(scale + step);
    },
    [scale, setZoomClamped]
  );

  return { scale, setZoom: setZoomClamped, handleWheel };
}

export default useDaliCanvasZoom;