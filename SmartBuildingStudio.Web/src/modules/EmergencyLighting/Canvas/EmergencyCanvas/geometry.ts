// src/modules/EmergencyLighting/Canvas/EmergencyCanvas/geometry.ts

export type Pt = { x: number; y: number };
export type WorldToScreen = (p: Pt) => Pt;

export const OUTLIER_RADIUS = 500_000;
export const MIN_CANVAS_DIM = 200;
export const ROUTE_HIT_TOLERANCE_PX = 10;
export const FIXTURE_HIT_RADIUS_PX = 12;

// Off-canvas sentinel. Any layer receiving this will draw a degenerate
// (0-length) element that lands outside the clip rect and is discarded.
export const SENTINEL_X = -100_000;
export const SENTINEL_Y = -100_000;

export function makeSafeWorldToScreen(w2s: WorldToScreen): WorldToScreen {
  return (p: Pt) => {
    const s = w2s(p);
    if (!Number.isFinite(s.x) || !Number.isFinite(s.y)) {
      return { x: SENTINEL_X, y: SENTINEL_Y };
    }
    return s;
  };
}

export function isSentinel(p: Pt): boolean {
  return p.x === SENTINEL_X && p.y === SENTINEL_Y;
}

export function getPoints(el: any): Pt[] {
  const raw =
    (Array.isArray(el?.points) && el.points) ||
    (Array.isArray(el?.vertices) && el.vertices) ||
    (el?.start && el?.end ? [el.start, el.end] : []) ||
    (Array.isArray(el?.primitives)
      ? el.primitives.flatMap((p: any) => p?.points ?? [])
      : []) ||
    [];
  return raw.filter((p: any) => p && Number.isFinite(p.x) && Number.isFinite(p.y));
}

export function dropOutliers(elements: any[], semanticCenter: Pt): any[] {
  return elements.filter((el) => {
    const pts = getPoints(el);
    if (pts.length === 0) return true;
    return pts.every(
      (p) =>
        Math.abs(p.x - semanticCenter.x) <= OUTLIER_RADIUS &&
        Math.abs(p.y - semanticCenter.y) <= OUTLIER_RADIUS,
    );
  });
}

export function computeArea(pts: Pt[]): number {
  if (pts.length < 3) return 0;
  let area = 0;
  for (let i = 0; i < pts.length; i++) {
    const j = (i + 1) % pts.length;
    area += pts[i].x * pts[j].y;
    area -= pts[j].x * pts[i].y;
  }
  return Math.abs(area) / 2 / 1_000_000;
}

export function pointToSegmentPx(p: Pt, a: Pt, b: Pt): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len2 = dx * dx + dy * dy;
  if (len2 < 1e-9) return Math.hypot(p.x - a.x, p.y - a.y);
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

/**
 * Return the fixture whose glyph contains the given screen point, or null.
 * Uses worldToScreenRaw (not the sanitized version) so sentinel-coordinate
 * fixtures can't false-hit. Picks the closest match within radius.
 */
export function hitTestFixtureScreen(
  fixtures: any[],
  clickScreen: Pt,
  worldToScreenRaw: WorldToScreen,
  hitRadiusPx: number = FIXTURE_HIT_RADIUS_PX,
): any | null {
  let best: any = null;
  let bestDist = Infinity;
  for (const f of fixtures) {
    if (!f || typeof f.x !== 'number' || typeof f.y !== 'number') continue;
    const s = worldToScreenRaw({ x: f.x, y: f.y });
    if (!Number.isFinite(s.x) || !Number.isFinite(s.y)) continue;
    const d = Math.hypot(s.x - clickScreen.x, s.y - clickScreen.y);
    if (d <= hitRadiusPx && d < bestDist) {
      bestDist = d;
      best = f;
    }
  }
  return best;
}