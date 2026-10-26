// src/modules/FixturePlacementStudio/hooks/useFixtureCanvasZoom.ts
//
// Zoom hook for the FixturePlacementStudio canvas.
//
// Forked from FloorPlanDesigner's useCanvasZoom, pointing at
// state.fixture.viewport instead of state.floorPlan.viewport.
//
// Design note — ADDITIVE steps, not multiplicative:
//
//   Multiplicative zoom (scale * 1.1 per wheel event) compounds: a
//   trackpad flick fires dozens of events in a second, so zoom races
//   to 5x, 10x, 20x before the user can react. That collapses the
//   plan into a tiny slice of empty space and looks like the canvas
//   has gone blank.
//
//   Additive steps (scale + 0.15 per event) are bounded: 30 events
//   moves zoom by at most 4.5 units regardless of framerate or device.
//   The felt behaviour is smoother and the view never flies off.
//
// Tuning:
//   ZOOM_STEP       — units added per wheel notch. 0.15 = subtle, 0.25 = responsive.
//   MIN_ZOOM        — smallest scale the user can reach.
//   MAX_ZOOM        — largest scale the user can reach.

import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/Application/ConfigureStore';
import { setZoom } from '@/modules/FixturePlacementStudio/store/fixtureSlice';

const ZOOM_STEP = 0.15;
const MIN_ZOOM = 0.1;
const MAX_ZOOM = 20;

export interface UseCanvasZoomResult {
  scale: number;
  setZoom: (z: number) => void;
  handleWheel: (e: React.WheelEvent<HTMLCanvasElement>) => void;
}

export function useFixtureCanvasZoom(): UseCanvasZoomResult {
  const dispatch = useAppDispatch();
  const scale = useAppSelector(
    (state: any) => state.fixture?.viewport?.zoom ?? 1
  );

  const setZoomClamped = useCallback(
    (z: number) => {
      const next = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, z));
      dispatch(setZoom(next));
    },
    [dispatch]
  );

  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLCanvasElement>) => {
      e.preventDefault();

      // Positive deltaY = scroll down = zoom out (decrease scale).
      // Negative deltaY = scroll up   = zoom in  (increase scale).
      const direction = e.deltaY < 0 ? 1 : -1;
      const step = ZOOM_STEP * direction;

      setZoomClamped(scale + step);
    },
    [scale, setZoomClamped]
  );

  return { scale, setZoom: setZoomClamped, handleWheel };
}

export default useFixtureCanvasZoom;