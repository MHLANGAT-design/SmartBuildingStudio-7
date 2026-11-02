// src/modules/EmergencyLighting/hooks/useEvacuationRoutes.ts

import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/Application/ConfigureStore';
import { commitEvacuationRoute } from '@/modules/EmergencyLighting/store/emergencyThunks';
import {
  beginRouteDrawing,
  cancelRouteDrawing,
  setRouteStartPoint,
  setRouteCursorPoint,
  appendRoutePoint,
} from '@/modules/EmergencyLighting/store/emergencySlice';

export function useEvacuationRoutes() {
  const dispatch = useAppDispatch();
  const routes = useAppSelector((s: any) => s.emergency.routes || []);
  const { isDrawing, startPoint, cursorPoint, pendingPoints } = useAppSelector(
    (s: any) => s.emergency.routeDrawing
  );

  const beginRoute = useCallback(() => {
    dispatch(beginRouteDrawing());
  }, [dispatch]);

  const cancelRoute = useCallback(() => {
    dispatch(cancelRouteDrawing());
  }, [dispatch]);

  /**
   * Every click appends a point. The first click seeds the polyline;
   * subsequent clicks add vertices. Commit is a separate action so the
   * user can draw any number of segments.
   */
  const clickCanvas = useCallback((worldPoint: { x: number; y: number }) => {
    if (!isDrawing) return;

    if (!startPoint) {
      dispatch(setRouteStartPoint(worldPoint));
    } else {
      dispatch(appendRoutePoint(worldPoint));
    }
  }, [dispatch, isDrawing, startPoint]);

  const moveCanvas = useCallback((worldPoint: { x: number; y: number }) => {
    if (isDrawing && startPoint) {
      dispatch(setRouteCursorPoint(worldPoint));
    }
  }, [dispatch, isDrawing, startPoint]);

  /**
   * Commit the in-progress polyline. Called from Enter, double-click,
   * or right-click handlers in EmergencyCanvas. Requires >= 2 points.
   */
  const commitPendingRoute = useCallback(() => {
    if (!isDrawing || pendingPoints.length < 2) {
      dispatch(cancelRouteDrawing());
      return;
    }

    const nextNum =
      routes.reduce((max: number, r: any) => {
        const m = /^Route (\d+)$/.exec(r.name ?? '');
        return m ? Math.max(max, Number(m[1])) : max;
      }, 0) + 1;

    dispatch(
      commitEvacuationRoute({
        name: `Route ${nextNum}`,
        points: pendingPoints,
      })
    );
    dispatch(cancelRouteDrawing());
  }, [dispatch, isDrawing, pendingPoints, routes]);

  return {
    routes,
    isDrawing,
    startPoint,
    cursorPoint,
    pendingPoints,
    beginRoute,
    cancelRoute,
    clickCanvas,
    moveCanvas,
    commitPendingRoute,
  };
}