// src/modules/FloorPlanDesigner/Utils/HitTest.ts
//
// Hit-testing for point-click and rectangle selection.
//
// Grouping: elements that share a `groupId` (set by the DXF import for
// doors and windows drawn as multi-segment blocks) are treated as one
// logical object. hitTestElements returns both the top element and the
// full group, so callers can select / delete / move the whole object.
//
// Fixtures are point elements: hit-testing measures point-to-point
// distance rather than point-to-polyline, and both point-click and
// rectangle selection treat a fixture as inside the rect when its
// single point is inside.
//
// Elements without a groupId — walls, fixtures, raw geometry, ungrouped
// doors — return a singleton group of [themselves]. Callers can treat
// every result uniformly without special-casing.

export interface HitTestResult {
  element: any | null;
  distance: number;
  group: any[];
}

export interface Rect {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

/**
 * Return the group key for an element, or null if it has none.
 * Handles both `groupId` (frontend) and `GroupId` (raw C# camelCase
 * leaking through in some paths).
 */
function getGroupKey(el: any): string | null {
  const g = el?.groupId ?? el?.GroupId ?? null;
  if (g === null || g === undefined || g === '') return null;
  return String(g);
}

/**
 * Distance from a point P to a line segment AB, in world units.
 */
function pointToSegmentDistance(
  px: number, py: number,
  ax: number, ay: number,
  bx: number, by: number
): number {
  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;

  if (lenSq === 0) return Math.hypot(px - ax, py - ay);

  let t = ((px - ax) * dx + (py - ay) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));

  const cx = ax + t * dx;
  const cy = ay + t * dy;
  return Math.hypot(px - cx, py - cy);
}

/**
 * Distance from a point to a polyline (list of vertices).
 */
function pointToPolylineDistance(
  px: number, py: number,
  pts: { x: number; y: number }[]
): number {
  if (!pts || pts.length === 0) return Infinity;
  if (pts.length === 1) return Math.hypot(px - pts[0].x, py - pts[0].y);

  let min = Infinity;
  for (let i = 0; i < pts.length - 1; i++) {
    const d = pointToSegmentDistance(px, py, pts[i].x, pts[i].y, pts[i + 1].x, pts[i + 1].y);
    if (d < min) min = d;
  }
  return min;
}

/**
 * Read a fixture's world-space position. Fixtures may carry the point
 * at the top level (`x`, `y`) or as a single-element `points` array,
 * depending on which importer produced them.
 */
function getFixturePoint(el: any): { x: number; y: number } | null {
  const pts = el?.points || el?.vertices;
  const fx = Number(el?.x ?? (Array.isArray(pts) ? pts[0]?.x : NaN) ?? NaN);
  const fy = Number(el?.y ?? (Array.isArray(pts) ? pts[0]?.y : NaN) ?? NaN);
  if (!Number.isFinite(fx) || !Number.isFinite(fy)) return null;
  return { x: fx, y: fy };
}

/**
 * Classify an element as door / window / wall / room / fixture /
 * rawgeometry using the same rules as CanvasRenderer Phase 5.
 *
 * IMPORTANT: `rawgeometry` must be checked BEFORE the wall fallback,
 * otherwise it matches `t === ''` or falls through to `'wall'` and either
 * gets bucketed as a wall or excluded entirely — which is why clicks on
 * raw geometry never resolved before.
 *
 * IMPORTANT: `fixture` must be checked BEFORE the wall fallback too —
 * fixtures have `type: 'fixture'` and would otherwise fall through to
 * `null` and be excluded from every hit-test.
 */
function classifyElement(
  el: any
): 'door' | 'window' | 'wall' | 'room' | 'fixture' | 'rawgeometry' | null {
  if (!el) return null;

  const t = String(el.type ?? el.Type ?? '').toLowerCase();
  const l = String(el.originalLayer ?? el.layer ?? el.Layer ?? '').toLowerCase();
  const n = t.replace(/[_\s-]/g, '');

  // Raw geometry — must precede the wall fallback.
  if (n === 'rawgeometry' || n === 'raw' || t === 'raw_geometry') {
    return 'rawgeometry';
  }

  if (
    t === 'door' || t === 'doors' ||
    l.includes('door') ||
    l === 'dr' || l.startsWith('dr-') || l.endsWith('-dr')
  ) return 'door';

  if (
    t === 'window' || t === 'windows' ||
    l.includes('window') || l.includes('glaz') || l.includes('sash') ||
    l === 'wd' || l.startsWith('wd-') || l.endsWith('-wd')
  ) return 'window';

  if (t === 'room' || t === 'rooms' || el.isRoom) return 'room';

  // Fixtures — DXF-derived point elements (luminaire, emergencyLight, etc.).
  if (t === 'fixture' || t === 'fixtures' || el.isFixture === true) return 'fixture';

  if (t === 'wall' || t === 'walls' || t === 'polyline' || t === '') return 'wall';

  return null;
}

function priorityWeight(
  kind: 'door' | 'window' | 'wall' | 'room' | 'fixture' | 'rawgeometry' | null
): number {
  switch (kind) {
    case 'door':        return 0;
    case 'window':      return 1;
    case 'fixture':     return 2;
    case 'room':        return 3;
    case 'wall':        return 4;
    case 'rawgeometry': return 5;
    default:            return 6;
  }
}

/**
 * Return every element sharing the given group key. Falls back to
 * `[el]` when the element has no group, or when no sibling is found.
 */
function siblingsOf(elements: any[], el: any): any[] {
  const key = getGroupKey(el);
  if (!key) return [el];
  const siblings = elements.filter((e: any) => getGroupKey(e) === key);
  return siblings.length > 0 ? siblings : [el];
}

/**
 * Find the closest element to a world-space point, within `tolerance` units.
 *
 * The returned `group` array contains every element that shares the hit
 * element's groupId — for grouped doors and windows this is the whole
 * door / window. For ungrouped elements (walls, fixtures, raw geometry)
 * it is a singleton array with just the hit element, so callers can
 * treat all cases uniformly.
 */
export function hitTestElements(
  worldX: number,
  worldY: number,
  plan: any,
  tolerance: number,
  layers: Record<string, boolean | string>
): HitTestResult {
  const elements = plan?.elements || [];
  if (!elements.length) return { element: null, distance: Infinity, group: [] };

  const isVisible = (key: string): boolean => {
    const v = layers?.[key];
    if (v !== undefined && v !== null) {
      if (typeof v === 'boolean') return v;
      if (typeof v === 'string') return v.toLowerCase() !== 'false';
    }
    return true;
  };

  const doorsVisible = isVisible('doors');
  const windowsVisible = isVisible('windows');
  const wallsVisible = isVisible('walls');
  const roomsVisible = isVisible('rooms');
  const fixturesVisible = isVisible('fixtures');
  const rawVisible = isVisible('rawgeometry');

  let best: { element: any; distance: number; kind: string } | null = null;

  for (const el of elements) {
    const kind = classifyElement(el);
    if (kind === 'door' && !doorsVisible) continue;
    if (kind === 'window' && !windowsVisible) continue;
    if (kind === 'wall' && !wallsVisible) continue;
    if (kind === 'room' && !roomsVisible) continue;
    if (kind === 'fixture' && !fixturesVisible) continue;
    if (kind === 'rawgeometry' && !rawVisible) continue;
    if (kind === null) continue;

    let dist: number;

    if (kind === 'fixture') {
      const fp = getFixturePoint(el);
      if (!fp) continue;
      dist = Math.hypot(worldX - fp.x, worldY - fp.y);
    } else {
      const pts = el.points || el.vertices || (el.start && el.end ? [el.start, el.end] : []);
      if (!Array.isArray(pts) || pts.length < 2) continue;
      dist = pointToPolylineDistance(worldX, worldY, pts);
    }

    if (dist > tolerance) continue;

    if (
      !best ||
      dist < best.distance * 0.7 ||
      (Math.abs(dist - best.distance) <= best.distance * 0.3 &&
        priorityWeight(kind as any) < priorityWeight(best.kind as any))
    ) {
      best = { element: el, distance: dist, kind };
    }
  }

  if (!best) return { element: null, distance: Infinity, group: [] };

  return {
    element: best.element,
    distance: best.distance,
    group: siblingsOf(elements, best.element),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Rectangle selection helpers
// ─────────────────────────────────────────────────────────────────────────────

/** True when P is inside the axis-aligned rectangle (inclusive). */
function pointInRect(px: number, py: number, r: Rect): boolean {
  return px >= r.minX && px <= r.maxX && py >= r.minY && py <= r.maxY;
}

/**
 * Do the axis-aligned segment AB and the axis-aligned rectangle intersect?
 * Uses the standard "segment vs AABB" test.
 */
function segmentIntersectsRect(
  ax: number, ay: number,
  bx: number, by: number,
  r: Rect
): boolean {
  if (pointInRect(ax, ay, r) || pointInRect(bx, by, r)) return true;

  const dx = bx - ax;
  const dy = by - ay;

  let tMin = 0;
  let tMax = 1;

  if (Math.abs(dx) < 1e-12) {
    if (ax < r.minX || ax > r.maxX) return false;
  } else {
    const t1 = (r.minX - ax) / dx;
    const t2 = (r.maxX - ax) / dx;
    const tLo = Math.min(t1, t2);
    const tHi = Math.max(t1, t2);
    tMin = Math.max(tMin, tLo);
    tMax = Math.min(tMax, tHi);
    if (tMin > tMax) return false;
  }

  if (Math.abs(dy) < 1e-12) {
    if (ay < r.minY || ay > r.maxY) return false;
  } else {
    const t1 = (r.minY - ay) / dy;
    const t2 = (r.maxY - ay) / dy;
    const tLo = Math.min(t1, t2);
    const tHi = Math.max(t1, t2);
    tMin = Math.max(tMin, tLo);
    tMax = Math.min(tMax, tHi);
    if (tMin > tMax) return false;
  }

  return true;
}

function polylineFullyInside(pts: { x: number; y: number }[], r: Rect): boolean {
  if (!pts || pts.length === 0) return false;
  for (const p of pts) {
    if (!pointInRect(p.x, p.y, r)) return false;
  }
  return true;
}

function polylineIntersectsRect(pts: { x: number; y: number }[], r: Rect): boolean {
  if (!pts || pts.length === 0) return false;
  if (pts.length === 1) return pointInRect(pts[0].x, pts[0].y, r);
  for (let i = 0; i < pts.length - 1; i++) {
    if (segmentIntersectsRect(pts[i].x, pts[i].y, pts[i + 1].x, pts[i + 1].y, r)) {
      return true;
    }
  }
  return false;
}

/**
 * Return the ids of every visible element fully inside the rectangle,
 * with siblings of any grouped element included.
 *
 * AutoCAD "window" semantics: only elements fully inside the rectangle.
 * When a grouped element (door, window) qualifies, all of its siblings
 * are added — selection is object-level. Fixtures are points: a fixture
 * qualifies when its single point lies inside the rectangle.
 */
export function hitTestRectWindow(
  rect: Rect,
  plan: any,
  layers: Record<string, boolean | string>
): string[] {
  const elements = plan?.elements || [];
  if (!elements.length) return [];

  const isVisible = (key: string): boolean => {
    const v = layers?.[key];
    if (v !== undefined && v !== null) {
      if (typeof v === 'boolean') return v;
      if (typeof v === 'string') return v.toLowerCase() !== 'false';
    }
    return true;
  };
  const doorsVisible = isVisible('doors');
  const windowsVisible = isVisible('windows');
  const wallsVisible = isVisible('walls');
  const roomsVisible = isVisible('rooms');
  const fixturesVisible = isVisible('fixtures');
  const rawVisible = isVisible('rawgeometry');

  const out = new Set<string>();
  const groupKeysToAdd = new Set<string>();

  for (const el of elements) {
    const kind = classifyElement(el);
    if (kind === 'door' && !doorsVisible) continue;
    if (kind === 'window' && !windowsVisible) continue;
    if (kind === 'wall' && !wallsVisible) continue;
    if (kind === 'room' && !roomsVisible) continue;
    if (kind === 'fixture' && !fixturesVisible) continue;
    if (kind === 'rawgeometry' && !rawVisible) continue;
    if (kind === null) continue;

    if (kind === 'fixture') {
      const fp = getFixturePoint(el);
      if (!fp || !pointInRect(fp.x, fp.y, rect)) continue;
    } else {
      const pts = el.points || el.vertices || (el.start && el.end ? [el.start, el.end] : []);
      if (!Array.isArray(pts) || pts.length < 2) continue;
      if (!polylineFullyInside(pts, rect)) continue;
    }

    const id = String(el.id ?? el.Id ?? '');
    if (id) out.add(id);

    const gk = getGroupKey(el);
    if (gk) groupKeysToAdd.add(gk);
  }

  if (groupKeysToAdd.size > 0) {
    for (const el of elements) {
      const gk = getGroupKey(el);
      if (!gk || !groupKeysToAdd.has(gk)) continue;
      const id = String(el.id ?? el.Id ?? '');
      if (id) out.add(id);
    }
  }

  return Array.from(out);
}

/**
 * Return the ids of every visible element that touches the rectangle,
 * with siblings of any grouped element included.
 *
 * AutoCAD "crossing" semantics: any element the rectangle intersects
 * qualifies, and its group comes along. Fixtures are points: a fixture
 * crosses the rectangle when its single point lies inside it.
 */
export function hitTestRectCrossing(
  rect: Rect,
  plan: any,
  layers: Record<string, boolean | string>
): string[] {
  const elements = plan?.elements || [];
  if (!elements.length) return [];

  const isVisible = (key: string): boolean => {
    const v = layers?.[key];
    if (v !== undefined && v !== null) {
      if (typeof v === 'boolean') return v;
      if (typeof v === 'string') return v.toLowerCase() !== 'false';
    }
    return true;
  };
  const doorsVisible = isVisible('doors');
  const windowsVisible = isVisible('windows');
  const wallsVisible = isVisible('walls');
  const roomsVisible = isVisible('rooms');
  const fixturesVisible = isVisible('fixtures');
  const rawVisible = isVisible('rawgeometry');

  const out = new Set<string>();
  const groupKeysToAdd = new Set<string>();

  for (const el of elements) {
    const kind = classifyElement(el);
    if (kind === 'door' && !doorsVisible) continue;
    if (kind === 'window' && !windowsVisible) continue;
    if (kind === 'wall' && !wallsVisible) continue;
    if (kind === 'room' && !roomsVisible) continue;
    if (kind === 'fixture' && !fixturesVisible) continue;
    if (kind === 'rawgeometry' && !rawVisible) continue;
    if (kind === null) continue;

    if (kind === 'fixture') {
      const fp = getFixturePoint(el);
      if (!fp || !pointInRect(fp.x, fp.y, rect)) continue;
    } else {
      const pts = el.points || el.vertices || (el.start && el.end ? [el.start, el.end] : []);
      if (!Array.isArray(pts) || pts.length < 2) continue;
      if (!polylineIntersectsRect(pts, rect)) continue;
    }

    const id = String(el.id ?? el.Id ?? '');
    if (id) out.add(id);

    const gk = getGroupKey(el);
    if (gk) groupKeysToAdd.add(gk);
  }

  if (groupKeysToAdd.size > 0) {
    for (const el of elements) {
      const gk = getGroupKey(el);
      if (!gk || !groupKeysToAdd.has(gk)) continue;
      const id = String(el.id ?? el.Id ?? '');
      if (id) out.add(id);
    }
  }

  return Array.from(out);
}