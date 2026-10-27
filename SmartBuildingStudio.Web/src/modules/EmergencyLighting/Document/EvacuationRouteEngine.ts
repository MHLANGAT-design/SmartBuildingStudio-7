// src/modules/EmergencyLighting/Document/EvacuationRouteEngine.ts

import { EvacuationRoute } from '@/modules/EmergencyLighting/models/EvacuationRoute';

export class EvacuationRouteEngine {
  /**
   * Sum of segment lengths in metres. Assumes world coordinates are
   * in millimetres (standard for DXF/CAD).
   */
  static calculateLength(points: Array<{ x: number; y: number }>): number {
    if (!Array.isArray(points) || points.length < 2) return 0;
    let totalRaw = 0;
    for (let i = 1; i < points.length; i++) {
      const dx = points[i].x - points[i - 1].x;
      const dy = points[i].y - points[i - 1].y;
      totalRaw += Math.hypot(dx, dy);
    }
    return totalRaw / 1000;
  }

  static evaluateRoute(route: EvacuationRoute): EvacuationRoute {
    const pts = route.points && route.points.length >= 2
      ? route.points
      : [route.startNode, route.endNode];

    const lengthMeters = this.calculateLength(pts);
    const isCompliant = lengthMeters <= 30;

    return {
      ...route,
      points: pts,
      startNode: pts[0],
      endNode: pts[pts.length - 1],
      lengthMeters,
      isCompliant,
    };
  }
}