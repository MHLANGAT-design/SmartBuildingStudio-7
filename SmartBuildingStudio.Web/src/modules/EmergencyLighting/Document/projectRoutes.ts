// src/modules/EmergencyLighting/Document/projectRoutes.ts

import type { EvacuationRoute } from '@/modules/EmergencyLighting/models/EvacuationRoute';

export function projectRoutesToElements(
  routes: EvacuationRoute[],
  existingElements: any[]
): any[] {
  const withoutExitRoutes = existingElements.filter(
    (el: any) => String(el?.type ?? '').toLowerCase() !== 'exitroute'
  );

  const projected = routes.map((r) => ({
    id: r.id,
    type: 'exitRoute',
    isExitRoute: true,
    name: r.name,
    points: r.points.map((p) => ({ x: p.x, y: p.y })),
    lengthMeters: r.lengthMeters,
    isCompliant: r.isCompliant,
    originalLayer: 'EXITROUTES',
    layer: 'EXITROUTES',
  }));

  return [...withoutExitRoutes, ...projected];
}

export function extractRoutesFromElements(elements: any[]): EvacuationRoute[] {
  return elements
    .filter((el: any) => String(el?.type ?? '').toLowerCase() === 'exitroute')
    .map((el: any) => {
      const pts: Array<{ x: number; y: number }> =
        Array.isArray(el.points) && el.points.length >= 2
          ? el.points.map((p: any) => ({ x: Number(p.x), y: Number(p.y) }))
          : [];
      return {
        id: String(el.id ?? ''),
        name: String(el.name ?? 'Route'),
        points: pts,
        startNode: pts[0] ?? { x: 0, y: 0 },
        endNode: pts[pts.length - 1] ?? { x: 0, y: 0 },
        lengthMeters: Number(el.lengthMeters ?? 0),
        isCompliant: Boolean(el.isCompliant),
      };
    });
}