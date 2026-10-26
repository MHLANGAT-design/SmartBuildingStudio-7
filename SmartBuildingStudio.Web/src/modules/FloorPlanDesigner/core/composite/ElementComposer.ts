// src/modules/FloorPlanDesigner/core/composite/ElementComposer.ts

import {
  deriveDoorGeometry,
  deriveWindowGeometry,
  deriveWallAxis,
  type RawDxfEntity,
} from "@/modules/FloorPlanDesigner/core/parsers/DxfResponseBuilders";

// ─── Types ──────────────────────────────────────────────────────────────

export interface CompositePrimitive {
  kind: "line" | "polyline";
  points: { x: number; y: number }[];
}

export interface CompositeDoorGeometry {
  hingeX: number;
  hingeY: number;
  wallAngle: number;
  width: number;
  isOutward: boolean;
  isLeftHand: boolean;
  isDouble: boolean;
  variant?: string;
  blockName?: string;
}

export interface CompositeWindowGeometry {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  width: number;
  blockName?: string;
}

export interface CompositeWallGeometry {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  thickness: number;
  material: string;
}

export interface CompositeElement {
  id: string;
  type: "door" | "window" | "wall";
  composite: true;
  geometry:
    | CompositeDoorGeometry
    | CompositeWindowGeometry
    | CompositeWallGeometry;
  primitives: CompositePrimitive[];
  points: { x: number; y: number }[];
  layer?: string;
  originalLayer?: string;
}

export function isComposite(el: any): el is CompositeElement {
  return !!el && el.composite === true;
}

// ─── Helper: raw group → primitives ────────────────────────────────────

function rawGroupToPrimitives(group: RawDxfEntity[]): CompositePrimitive[] {
  const primitives: CompositePrimitive[] = [];

  for (const el of group) {
    const pts = el.points;
    if (!pts || pts.length < 2) continue;

    if (pts.length === 2) {
      primitives.push({
        kind: "line",
        points: [
          { x: pts[0].x, y: pts[0].y },
          { x: pts[1].x, y: pts[1].y },
        ],
      });
    } else {
      primitives.push({
        kind: "polyline",
        points: pts.map((p) => ({ x: p.x, y: p.y })),
      });
    }
  }

  return primitives;
}

// ─── Group → Composite ─────────────────────────────────────────────────

export function composeDoorFromGroup(
  group: RawDxfEntity[]
): CompositeElement | null {
  if (!group || group.length === 0) return null;
  const geom = deriveDoorGeometry(group);

  const first = group[0];
  const id = String(first.groupId ?? first.id ?? `door-${Date.now()}`);

  const geometry: CompositeDoorGeometry = geom
    ? {
        hingeX: geom.hingeX,
        hingeY: geom.hingeY,
        wallAngle: geom.wallAngle,
        width: geom.width,
        isOutward: geom.isOutward,
        isLeftHand: geom.isLeftHand,
        isDouble: geom.isDouble,
        variant: geom.variant,
        blockName: geom.blockName,
      }
    : {
        hingeX: 0,
        hingeY: 0,
        wallAngle: 0,
        width: 900,
        isOutward: false,
        isLeftHand: false,
        isDouble: false,
      };

  const primitives = rawGroupToPrimitives(group);

  const frameFar = {
    x: geometry.hingeX + geometry.width * Math.cos(geometry.wallAngle),
    y: geometry.hingeY + geometry.width * Math.sin(geometry.wallAngle),
  };

  return {
    id,
    type: "door",
    composite: true,
    geometry,
    primitives,
    points: [{ x: geometry.hingeX, y: geometry.hingeY }, frameFar],
    layer: "DOORS",
    originalLayer: first.layer ?? "DOORS",
  };
}

export function composeWindowFromGroup(
  group: RawDxfEntity[]
): CompositeElement | null {
  if (!group || group.length === 0) return null;
  const geom = deriveWindowGeometry(group);

  const first = group[0];
  const id = String(first.groupId ?? first.id ?? `window-${Date.now()}`);

  const geometry: CompositeWindowGeometry = geom
    ? {
        startX: geom.startX,
        startY: geom.startY,
        endX: geom.endX,
        endY: geom.endY,
        width: geom.width,
        blockName: geom.blockName,
      }
    : {
        startX: 0,
        startY: 0,
        endX: 0,
        endY: 0,
        width: 1200,
      };

  const primitives = rawGroupToPrimitives(group);

  return {
    id,
    type: "window",
    composite: true,
    geometry,
    primitives,
    points: [
      { x: geometry.startX, y: geometry.startY },
      { x: geometry.endX, y: geometry.endY },
    ],
    layer: "WINDOWS",
    originalLayer: first.layer ?? "WINDOWS",
  };
}

export function composeWallFromGroup(
  group: RawDxfEntity[]
): CompositeElement | null {
  if (!group || group.length === 0) return null;

  const axis = deriveWallAxis(group);
  if (!axis) return null;

  const primitives = rawGroupToPrimitives(group);
  if (primitives.length === 0) return null;

  const first = group[0] as any;
  const id =
    (first.groupId as string | undefined) ??
    String(first.id ?? `wall-${Date.now()}`);

  return {
    id,
    type: "wall",
    composite: true,
    geometry: {
      startX: axis.start.x,
      startY: axis.start.y,
      endX: axis.end.x,
      endY: axis.end.y,
      thickness: first.thickness ?? 120,
      material: first.material ?? "Concrete",
    },
    primitives,
    points: [axis.start, axis.end],
    layer: "WALLS",
    originalLayer: first.layer ?? "WALLS",
  };
}

// ─── Draw ──────────────────────────────────────────────────────────────

/**
 * Draw every primitive in the composite, in order. No branching on
 * el.type — a door, window, or wall all render the same way: stroke
 * the primitives the DXF drew. The semantic type is only used by
 * hit-test and by the inspector.
 */
export function drawComposite(
  ctx: CanvasRenderingContext2D,
  el: CompositeElement
): void {
  const prims = el.primitives;
  if (!prims || prims.length === 0) return;

  for (const prim of prims) {
    const pts = prim.points;
    if (!pts || pts.length < 2) continue;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) {
      ctx.lineTo(pts[i].x, pts[i].y);
    }
    ctx.stroke();
  }
}

// ─── Hit-test ──────────────────────────────────────────────────────────

export function hitTestComposite(
  el: CompositeElement,
  px: number,
  py: number,
  toleranceWorld: number
): boolean {
  const prims = el.primitives;
  if (!prims || prims.length === 0) return false;

  for (const prim of prims) {
    const pts = prim.points;
    if (!pts || pts.length < 2) continue;
    for (let i = 0; i < pts.length - 1; i++) {
      const d = distanceToSegment(
        px, py,
        pts[i].x, pts[i].y,
        pts[i + 1].x, pts[i + 1].y
      );
      if (d <= toleranceWorld) return true;
    }
  }

  return false;
}

function distanceToSegment(
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