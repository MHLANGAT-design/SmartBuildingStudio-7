// src/modules/FixturePlacementStudio/utils/mergeElements.ts
//
// Merge DXF fragments into logical elements.
//
// `parseElements` expands composite elements into their individual
// primitives, tagging each with `compositeId` (the composite's id) and
// `compositeGeometry` (the composite's `geometry` object). The
// compositeGeometry carries the door's hinge, window's axis, etc.,
// which downstream code uses as an anchor to decide which room an
// element belongs to. Shared-wall doors have frame lines that straddle
// the wall and touch both rooms' polygons — the hinge disambiguates.

import {
  classifyLayer,
  type LayerCategory,
} from '@/modules/FixturePlacementStudio/utils/layerClassifier';

// ─── Public types ─────────────────────────────────────────────────────────────

export interface Point {
  x: number;
  y: number;
}

export interface CompositeGeometry {
  // Doors
  hingeX?: number;
  hingeY?: number;
  wallAngle?: number;
  width?: number;
  isOutward?: boolean;
  isLeftHand?: boolean;
  isDouble?: boolean;
  variant?: string;
  blockName?: string;
  // Windows
  startX?: number;
  startY?: number;
  endX?: number;
  endY?: number;
  // Walls
  thickness?: number;
  material?: string;
}

export interface RawElement {
  id: string;
  /** Present when the fragment came from a composite element. */
  compositeId?: string;
  /** Present when the fragment came from a composite element.
   *  Carries the composite's semantic geometry (hinge, axis, etc.). */
  compositeGeometry?: CompositeGeometry;
  kind: 'wall' | 'door' | 'window' | 'room';
  category: LayerCategory;
  points: Point[];
  name?: string;
  targetLux?: number;
  primaryGroup?: number;
  wallId?: string;
}

export interface ElementCluster {
  fragmentIds: string[];
  angle: number;
  perpOffset: number;
  startProjection: number;
  endProjection: number;
  length: number;
  bounds: { minX: number; minY: number; maxX: number; maxY: number };
}

export interface FragmentAnalysis {
  summary: {
    rawWalls: number;
    logicalWalls: number;
    rawDoors: number;
    logicalDoors: number;
    rawWindows: number;
    logicalWindows: number;
  };
  wallClusters: ElementCluster[];
  doorClusters: ElementCluster[];
  windowClusters: ElementCluster[];
}

export interface MergeOptions {
  perpToleranceMm?: number;
  angleToleranceRad?: number;
  gapToleranceMm?: number;
  doorCellSizeMm?: number;
  windowCellSizeMm?: number;
}

const DEFAULTS = {
  perpToleranceMm: 300,
  angleToleranceRad: (2 * Math.PI) / 180,
  gapToleranceMm: 200,
  doorCellSizeMm: 1200,
  windowCellSizeMm: 1500,
};

// ─── Parsing ─────────────────────────────────────────────────────────────────

export function parseElements(elements: any[]): RawElement[] {
  const out: RawElement[] = [];
  
  // 1. Identify all composite IDs so we can skip their raw fragments
  const compositeIds = new Set<string>();
  for (const el of elements) {
    if (el?.composite === true && el?.id) {
      compositeIds.add(String(el.id));
    }
  }

  for (const el of elements) {
    if (!el) continue;
    const id = String(el.id ?? el.Id ?? '');
    if (!id) continue;

    // 2. Skip raw fragments that belong to a composite we will expand
    const groupId = el.groupId ?? el.GroupId;
    if (groupId && compositeIds.has(String(groupId))) {
      continue; 
    }

    const t = String(el.type ?? el.Type ?? '').toLowerCase();

    let kind: RawElement['kind'];
    if (t === 'door' || t === 'doors') kind = 'door';
    else if (t === 'window' || t === 'windows') kind = 'window';
    else if (t === 'room' || t === 'rooms' || el.isRoom === true) kind = 'room';
    else kind = 'wall';

    const layer = String(el.originalLayer ?? el.layer ?? el.Layer ?? '');
    const category = classifyLayer(layer, t);

    const isRoom = kind === 'room';
    const rawName = isRoom ? String(el.name ?? el.Name ?? '').trim() : '';
    const targetLux = isRoom ? Number(el.targetLux ?? el.lux ?? 500) : undefined;
    const primaryGroup = isRoom ? Number(el.primaryGroup ?? el.group ?? 1) : undefined;
    const wallId = el.wallId;

    const compositeGeometry: CompositeGeometry | undefined =
      el.composite === true && el.geometry && typeof el.geometry === 'object'
        ? {
            hingeX: el.geometry.hingeX,
            hingeY: el.geometry.hingeY,
            wallAngle: el.geometry.wallAngle,
            width: el.geometry.width,
            isOutward: el.geometry.isOutward,
            isLeftHand: el.geometry.isLeftHand,
            isDouble: el.geometry.isDouble,
            variant: el.geometry.variant,
            blockName: el.geometry.blockName,
            startX: el.geometry.startX,
            startY: el.geometry.startY,
            endX: el.geometry.endX,
            endY: el.geometry.endY,
            thickness: el.geometry.thickness,
            material: el.geometry.material,
          }
        : undefined;

    // Composite element — expand into one RawElement per primitive
    if (el.composite === true && Array.isArray(el.primitives) && el.primitives.length > 0) {
      for (let i = 0; i < el.primitives.length; i++) {
        const prim = el.primitives[i];
        const pts = prim?.points;
        if (!Array.isArray(pts) || pts.length < 2) continue;

        const parsed: Point[] = [];
        for (const p of pts) {
          if (!p) continue;
          const x = Number(p.x);
          const y = Number(p.y);
          if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
          parsed.push({ x, y });
        }
        if (parsed.length < 2) continue;

        out.push({
          id: `${id}::${i}`,
          compositeId: id,
          compositeGeometry,
          kind,
          category,
          points: parsed,
          name: undefined,
          targetLux: undefined,
          primaryGroup: undefined,
          wallId,
        });
      }
      continue;
    }

    // Non-composite — one RawElement per element
    const pts = el.points || el.vertices || [];
    if (!Array.isArray(pts) || pts.length < 2) continue;

    const parsed: Point[] = [];
    for (const p of pts) {
      if (!p) continue;
      const x = Number(p.x);
      const y = Number(p.y);
      if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
      parsed.push({ x, y });
    }
    if (parsed.length < 2) continue;

    out.push({
      id,
      kind,
      category,
      points: parsed,
      name: rawName || undefined,
      targetLux,
      primaryGroup,
      wallId,
    });
  }

  return out;
}

// ─── Wall merging (unchanged) ─────────────────────────────────────────────────

export function mergeWalls(
  fragments: RawElement[],
  options: MergeOptions = {}
): ElementCluster[] {
  const { perpToleranceMm, angleToleranceRad, gapToleranceMm } = {
    ...DEFAULTS,
    ...options,
  };

  interface Pre {
    frag: RawElement;
    angle: number;
    perpOffset: number;
    dirX: number;
    dirY: number;
    tStart: number;
    tEnd: number;
  }

  const pres: Pre[] = [];
  for (const frag of fragments) {
    const a = frag.points[0];
    const b = frag.points[frag.points.length - 1];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy);
    if (len < 1e-3) continue;

    let angle = Math.atan2(dy, dx);
    if (angle < 0) angle += Math.PI;
    if (angle >= Math.PI) angle -= Math.PI;

    const dirX = Math.cos(angle);
    const dirY = Math.sin(angle);
    const nx = -dirY;
    const ny = dirX;
    const perpOffset = a.x * nx + a.y * ny;
    const t1 = a.x * dirX + a.y * dirY;
    const t2 = b.x * dirX + b.y * dirY;

    pres.push({
      frag,
      angle,
      perpOffset,
      dirX,
      dirY,
      tStart: Math.min(t1, t2),
      tEnd: Math.max(t1, t2),
    });
  }

  const n = pres.length;
  if (n === 0) return [];

  const parent = new Array<number>(n);
  for (let i = 0; i < n; i++) parent[i] = i;

  const find = (i: number): number => {
    while (parent[i] !== i) { parent[i] = parent[parent[i]]; i = parent[i]; }
    return i;
  };
  const union = (a: number, b: number) => {
    const ra = find(a); const rb = find(b);
    if (ra !== rb) parent[ra] = rb;
  };

  const angularDiff = (a1: number, a2: number): number => {
    let d = Math.abs(a1 - a2);
    if (d > Math.PI / 2) d = Math.PI - d;
    return d;
  };

  for (let i = 0; i < n; i++) {
    const a = pres[i];
    for (let j = i + 1; j < n; j++) {
      const b = pres[j];

      // Do NOT merge across composites. Each wall composite is already
      // one physical wall — merging its primitives with adjacent
      // composites' primitives would collapse two rooms' walls into one.
      if (a.frag.compositeId || b.frag.compositeId) {
        if (a.frag.compositeId && b.frag.compositeId &&
            a.frag.compositeId === b.frag.compositeId) {
          union(i, j);
        }
        continue;
      }

      if (angularDiff(a.angle, b.angle) > angleToleranceRad) continue;
      const offsetDiff = Math.abs(a.perpOffset - b.perpOffset);
      if (offsetDiff > perpToleranceMm) continue;
      const gap = Math.max(a.tStart - b.tEnd, b.tStart - a.tEnd);
      if (gap > gapToleranceMm) continue;
      union(i, j);
    }
  }

  const rootToIndices = new Map<number, number[]>();
  for (let i = 0; i < n; i++) {
    const r = find(i);
    let arr = rootToIndices.get(r);
    if (!arr) { arr = []; rootToIndices.set(r, arr); }
    arr.push(i);
  }

  const clusters: ElementCluster[] = [];

  for (const indices of rootToIndices.values()) {
    indices.sort((ia, ib) => pres[ia].tStart - pres[ib].tStart);

    let runStart = pres[indices[0]].tStart;
    let runEnd = pres[indices[0]].tEnd;
    let runFrags: RawElement[] = [pres[indices[0]].frag];
    let angleSum = pres[indices[0]].angle;
    let offsetSum = pres[indices[0]].perpOffset;

    const flush = () => {
      const count = runFrags.length;
      const angle = angleSum / count;
      const perpOffset = offsetSum / count;
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (const f of runFrags) {
        for (const p of f.points) {
          if (p.x < minX) minX = p.x;
          if (p.x > maxX) maxX = p.x;
          if (p.y < minY) minY = p.y;
          if (p.y > maxY) maxY = p.y;
        }
      }
      clusters.push({
        fragmentIds: runFrags.map((f) => f.id),
        angle, perpOffset,
        startProjection: runStart,
        endProjection: runEnd,
        length: runEnd - runStart,
        bounds: { minX, minY, maxX, maxY },
      });
    };

    for (let k = 1; k < indices.length; k++) {
      const next = pres[indices[k]];
      if (next.tStart <= runEnd + gapToleranceMm) {
        if (next.tEnd > runEnd) runEnd = next.tEnd;
        runFrags.push(next.frag);
        angleSum += next.angle;
        offsetSum += next.perpOffset;
      } else {
        flush();
        runStart = next.tStart;
        runEnd = next.tEnd;
        runFrags = [next.frag];
        angleSum = next.angle;
        offsetSum = next.perpOffset;
      }
    }
    flush();
  }

  return clusters;
}

// ─── Door/window clustering (UPDATED) ────────────────────────────────────────

export function clusterByGrid(
  fragments: RawElement[],
  cellSizeMm: number
): ElementCluster[] {
  if (fragments.length === 0) return [];

  const clusters: ElementCluster[] = [];
  const compositeGroups = new Map<string, RawElement[]>();
  const looseFragments: RawElement[] = [];

  // 1. Separate composites from loose fragments
  for (const frag of fragments) {
    if (frag.compositeId) {
      const key = frag.compositeId;
      if (!compositeGroups.has(key)) compositeGroups.set(key, []);
      compositeGroups.get(key)!.push(frag);
    } else {
      looseFragments.push(frag);
    }
  }

  // 2. Build one cluster per composite
  for (const group of compositeGroups.values()) {
    clusters.push(buildClusterFromFragments(group));
  }

  // 3. Grid-cluster the loose fragments (e.g., raw _frame, _pane lines)
  if (looseFragments.length > 0) {
    const n = looseFragments.length;
    const boxes = looseFragments.map((frag) => {
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (const p of frag.points) {
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.y > maxY) maxY = p.y;
      }
      return { minX, minY, maxX, maxY };
    });

    const parent = new Array<number>(n);
    for (let i = 0; i < n; i++) parent[i] = i;
    const find = (i: number): number => {
      while (parent[i] !== i) { parent[i] = parent[parent[i]]; i = parent[i]; }
      return i;
    };
    const union = (a: number, b: number) => {
      const ra = find(a); const rb = find(b);
      if (ra !== rb) parent[ra] = rb;
    };
    for (let i = 0; i < n; i++) {
      const a = boxes[i];
      for (let j = i + 1; j < n; j++) {
        const b = boxes[j];
        const dx = Math.max(0, Math.max(a.minX - b.maxX, b.minX - a.maxX));
        if (dx > cellSizeMm) continue;
        const dy = Math.max(0, Math.max(a.minY - b.maxY, b.minY - a.maxY));
        if (dy > cellSizeMm) continue;
        union(i, j);
      }
    }

    const groupsMap = new Map<number, RawElement[]>();
    for (let i = 0; i < n; i++) {
      const root = find(i);
      let g = groupsMap.get(root);
      if (!g) { g = []; groupsMap.set(root, g); }
      g.push(looseFragments[i]);
    }
    for (const g of groupsMap.values()) {
      clusters.push(buildClusterFromFragments(g));
    }
  }

  return clusters;
}

function buildClusterFromFragments(frags: RawElement[]): ElementCluster {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const f of frags) {
    for (const p of f.points) {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    }
  }
  const w = maxX - minX;
  const h = maxY - minY;
  return {
    fragmentIds: frags.map((f) => f.id),
    angle: w >= h ? 0 : Math.PI / 2,
    perpOffset: 0,
    startProjection: 0,
    endProjection: Math.max(w, h),
    length: Math.max(w, h),
    bounds: { minX, minY, maxX, maxY },
  };
}

// ─── Top-level analysis (unchanged) ──────────────────────────────────────────

export function analyzeFragments(
  elements: any[],
  options: MergeOptions = {}
): FragmentAnalysis {
  const { doorCellSizeMm, windowCellSizeMm } = { ...DEFAULTS, ...options };
  const parsed = parseElements(elements);
  const walls = parsed.filter((e) => e.kind === 'wall');
  const doors = parsed.filter((e) => e.kind === 'door');
  const windows = parsed.filter((e) => e.kind === 'window');
  const wallClusters = mergeWalls(walls, options);
  const doorClusters = clusterByGrid(doors, doorCellSizeMm);
  const windowClusters = clusterByGrid(windows, windowCellSizeMm);
  return {
    summary: {
      rawWalls: walls.length,
      logicalWalls: wallClusters.length,
      rawDoors: doors.length,
      logicalDoors: doorClusters.length,
      rawWindows: windows.length,
      logicalWindows: windowClusters.length,
    },
    wallClusters,
    doorClusters,
    windowClusters,
  };
}

export default analyzeFragments;

if (typeof window !== 'undefined') {
  (window as any).__analyzeFragments = analyzeFragments;
}