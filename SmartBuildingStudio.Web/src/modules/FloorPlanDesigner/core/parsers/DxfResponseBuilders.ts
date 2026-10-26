// src/modules/FloorPlanDesigner/core/parsers/DxfResponseBuilders.ts

import { DoorData } from "@/modules/FloorPlanDesigner/core/types/Door.types";

export interface RawDxfEntity {
  id: string;
  type: string;
  groupId?: string;
  blockName?: string;
  layer?: string;
  handle?: string;
  wallId?: string;
  hingeX?: number;
  hingeY?: number;
  wallAngle?: number;
  width?: number;
  height?: number;
  isOutward?: boolean;
  isLeftHand?: boolean;
  name?: string;
  properties?: Record<string, any>;
  points?: { x: number; y: number }[];
  [key: string]: any;
}

export function getElementType(el: any): string {
  if (el && typeof el.type === "string") return el.type.toLowerCase();
  if (el && typeof el.Type === "string") return el.Type.toLowerCase();
  const typeNum = el?.type ?? el?.Type;
  if (typeNum === 0) return "wall";
  if (typeNum === 1) return "door";
  if (typeNum === 2) return "window";
  return "unknown";
}

// ─── Grouping helpers (doors / windows) ─────────────────────────────────

export function getElementGroupKey(el: RawDxfEntity): string {
  if (el.groupId) return `g:${el.groupId}`;
  const id = String(el.id ?? "");
  if (id.includes("_sub_")) return `s:${id.split("_sub_")[0]}`;
  return `solo:${id}`;
}

export function groupElementsByKey(
  elements: RawDxfEntity[]
): RawDxfEntity[][] {
  const groups = new Map<string, RawDxfEntity[]>();
  const order: string[] = [];
  for (const el of elements) {
    const key = getElementGroupKey(el);
    if (!groups.has(key)) {
      groups.set(key, []);
      order.push(key);
    }
    groups.get(key)!.push(el);
  }
  return order.map((k) => groups.get(k)!);
}

// ─── Wall grouping (geometric) ──────────────────────────────────────────

/**
 * Group raw wall polylines into physical walls by collinear-chain walk.
 *
 * Unlike doors and windows, walls in `app.py` are emitted as direct
 * modelspace LINE entities with no `group_id`. Grouping must therefore
 * be geometric: two wall segments belong to the same wall if they are
 * (near-)collinear and share an endpoint within `tol`.
 *
 * Every returned group is a physical wall — one semantic record and one
 * composite element will be produced from it.
 *
 * Note: a closed-loop chain (a shaft outline, a column, a hollow wall
 * drawn as a rectangle) produces N groups because the segments are not
 * collinear. Those groups share the same source `id` (from the DXF
 * entity). The caller (`UseDxfImport`) is responsible for making the
 * resulting semantic ids unique — see `buildWall`'s `suffix` parameter.
 */
export function groupWallSegments(
  walls: RawDxfEntity[],
  opts: { tol?: number; angleTol?: number } = {}
): RawDxfEntity[][] {
  const tol = opts.tol ?? 50;
  const angleTol = opts.angleTol ?? 0.02; // ~1.15°

  type Seg = {
    el: RawDxfEntity;
    a: { x: number; y: number };
    b: { x: number; y: number };
    dir: number;
  };

  const segs: Seg[] = [];
  const degenerate: RawDxfEntity[] = [];

  for (const w of walls) {
    const pts = w.points;
    if (!pts || pts.length < 2) {
      degenerate.push(w);
      continue;
    }
    const a = pts[0];
    const b = pts[pts.length - 1];
    segs.push({
      el: w,
      a,
      b,
      dir: Math.atan2(b.y - a.y, b.x - a.x),
    });
  }

  const used = new Array(segs.length).fill(false);
  const groups: RawDxfEntity[][] = [];

  const near = (p: { x: number; y: number }, q: { x: number; y: number }) =>
    Math.hypot(p.x - q.x, p.y - q.y) <= tol;

  const parallel = (d1: number, d2: number) => {
    let d = d1 - d2;
    while (d > Math.PI) d -= 2 * Math.PI;
    while (d < -Math.PI) d += 2 * Math.PI;
    return (
      Math.abs(d) < angleTol ||
      Math.abs(Math.abs(d) - Math.PI) < angleTol
    );
  };

  for (let i = 0; i < segs.length; i++) {
    if (used[i]) continue;
    used[i] = true;
    const group: RawDxfEntity[] = [segs[i].el];
    const queue: Seg[] = [segs[i]];

    while (queue.length) {
      const cur = queue.pop()!;
      for (let j = 0; j < segs.length; j++) {
        if (used[j]) continue;
        const cand = segs[j];
        if (!parallel(cur.dir, cand.dir)) continue;
        if (
          near(cur.a, cand.a) ||
          near(cur.a, cand.b) ||
          near(cur.b, cand.a) ||
          near(cur.b, cand.b)
        ) {
          used[j] = true;
          group.push(cand.el);
          queue.push(cand);
        }
      }
    }
    groups.push(group);
  }

  // Preserve degenerate (single-point) walls as their own groups so they
  // aren't silently dropped.
  for (const w of degenerate) groups.push([w]);

  return groups;
}

// ─── Polyline helpers ───────────────────────────────────────────────────

function polylineLength(pts: { x: number; y: number }[] | undefined): number {
  if (!pts || pts.length < 2) return 0;
  let len = 0;
  for (let i = 1; i < pts.length; i++) {
    len += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
  }
  return len;
}

function segmentLength(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function pointsClose(
  a: { x: number; y: number },
  b: { x: number; y: number },
  tol = 5
): boolean {
  return Math.hypot(a.x - b.x, a.y - b.y) < tol;
}

// ─── Door variant classification ────────────────────────────────────────

export type DoorVariant =
  | "single"
  | "double"
  | "sliding"
  | "folding"
  | "opening"
  | "other";

const DOOR_ABBREVIATIONS: Record<string, DoorVariant> = {
  intsgl: "single",
  intsglpr: "single",
  extsgl: "single",
  single: "single",

  intdbl: "double",
  extdbl: "double",
  extd: "double",
  dbl: "double",

  bifold: "folding",
  fold: "folding",
  folding: "folding",

  pocket: "sliding",

  pivot: "single",
  rev: "single",
  revolving: "single",
};

export function classifyBlockName(
  blockName: string | undefined | null
): { isDouble: boolean; variant: DoorVariant | undefined } {
  if (!blockName || typeof blockName !== "string") {
    return { isDouble: false, variant: undefined };
  }

  const n = blockName.toLowerCase();

  if (n.includes("sliding") && n.includes("folding")) {
    return { isDouble: false, variant: "folding" };
  }
  if (n.includes("sliding")) {
    return { isDouble: false, variant: "sliding" };
  }
  if (n.includes("opening")) {
    return { isDouble: false, variant: "opening" };
  }

  for (const [token, variant] of Object.entries(DOOR_ABBREVIATIONS)) {
    const re = new RegExp(`(^|[-_\\s])${token}([-_\\s]|$)`);
    if (re.test(n)) {
      return { isDouble: variant === "double", variant };
    }
  }

  if (n.includes("double")) {
    return { isDouble: true, variant: "double" };
  }
  if (n.includes("door")) {
    return { isDouble: false, variant: "single" };
  }

  return { isDouble: false, variant: "other" };
}

// ─── Door geometry derivation ───────────────────────────────────────────

export interface DoorGeometry {
  width: number;
  height: number;
  wallAngle: number;
  hingeX: number;
  hingeY: number;
  isLeftHand: boolean;
  isOutward: boolean;
  isDouble: boolean;
  blockName?: string;
  variant?: DoorVariant;
}

export function deriveDoorGeometry(
  group: RawDxfEntity[],
  defaultHeight = 2100
): DoorGeometry | null {
  const straights = group.filter((m) => (m.points?.length ?? 0) === 2);
  const arcs = group.filter((m) => (m.points?.length ?? 0) > 2);

  if (straights.length === 0) {
    console.warn("[deriveDoorGeometry] no straights in group", {
      memberCount: group.length,
      pointCounts: group.map((m) => m.points?.length ?? 0),
      ids: group.map((m) => m.id),
    });
    return null;
  }

  const byLength = [...straights].sort(
    (a, b) => polylineLength(b.points) - polylineLength(a.points)
  );
  const frame = byLength[0];
  const framePts = frame.points!;
  const frameA = framePts[0];
  const frameB = framePts[1];
  const frameLen = segmentLength(frameA, frameB);
  let wallAngle = Math.atan2(frameB.y - frameA.y, frameB.x - frameA.x);
  if (wallAngle < 0) wallAngle += 2 * Math.PI;

  const NEAR = 5;

  let hinge: { x: number; y: number } | null = null;
  let hingeFar: { x: number; y: number } | null = null;
  let leaf: RawDxfEntity | null = null;

  const halfFrame = frameLen / 2;
  const halfLeaves: RawDxfEntity[] = [];

  for (const seg of byLength.slice(1)) {
    const pts = seg.points!;
    const [a, b] = pts;
    const len = segmentLength(a, b);

    const isFullLeaf = Math.abs(len - frameLen) <= frameLen * 0.3;
    const isHalfLeaf = Math.abs(len - halfFrame) <= halfFrame * 0.3;

    if (isHalfLeaf) halfLeaves.push(seg);

    if (!isFullLeaf) continue;

    if (pointsClose(a, frameA, NEAR)) {
      hinge = frameA; hingeFar = frameB; leaf = seg; break;
    }
    if (pointsClose(a, frameB, NEAR)) {
      hinge = frameB; hingeFar = frameA; leaf = seg; break;
    }
    if (pointsClose(b, frameA, NEAR)) {
      hinge = frameA; hingeFar = frameB; leaf = seg; break;
    }
    if (pointsClose(b, frameB, NEAR)) {
      hinge = frameB; hingeFar = frameA; leaf = seg; break;
    }
  }

  if (!hinge || !hingeFar) {
    hinge = frameA;
    hingeFar = frameB;
  }

  const wallVec = { x: hingeFar.x - hinge.x, y: hingeFar.y - hinge.y };

  let isLeftHand = false;
  if (leaf) {
    const pts = leaf.points!;
    const leafFar = pointsClose(pts[0], hinge, NEAR) ? pts[1] : pts[0];
    const leafVec = { x: leafFar.x - hinge.x, y: leafFar.y - hinge.y };
    const cross = wallVec.x * leafVec.y - wallVec.y * leafVec.x;
    isLeftHand = cross > 0;
  } else if (arcs.length > 0) {
    const arc = arcs[0];
    const arcPts = arc.points!;
    const arcMid = arcPts[Math.floor(arcPts.length / 2)];
    const arcVec = { x: arcMid.x - hinge.x, y: arcMid.y - hinge.y };
    const cross = wallVec.x * arcVec.y - wallVec.y * arcVec.x;
    isLeftHand = cross > 0;
  }

  let isOutward = false;
  if (leaf && arcs.length > 0) {
    const leafPts = leaf.points!;
    const leafFar = pointsClose(leafPts[0], hinge, NEAR)
      ? leafPts[1]
      : leafPts[0];
    const leafVec = { x: leafFar.x - hinge.x, y: leafFar.y - hinge.y };
    const leafCross = wallVec.x * leafVec.y - wallVec.y * leafVec.x;

    const arc = arcs[0];
    const arcPts = arc.points!;
    const arcMid = arcPts[Math.floor(arcPts.length / 2)];
    const arcVec = { x: arcMid.x - hinge.x, y: arcMid.y - hinge.y };
    const arcCross = wallVec.x * arcVec.y - wallVec.y * arcVec.x;

    isOutward = leafCross * arcCross < 0;
  }

  const blockName =
    (group[0]?.blockName as string | undefined) ??
    (group[0]?.block_name as string | undefined) ??
    undefined;
  const blockClass = classifyBlockName(blockName);

  const isDouble =
    blockClass.variant !== undefined ? blockClass.isDouble : halfLeaves.length >= 2;
  const variant: DoorVariant =
    blockClass.variant ?? (isDouble ? "double" : "single");

  return {
    width: frameLen,
    height: defaultHeight,
    wallAngle,
    hingeX: hinge.x,
    hingeY: hinge.y,
    isLeftHand,
    isOutward,
    isDouble,
    blockName,
    variant,
  };
}

// ─── Window geometry derivation ────────────────────────────────────────

export interface WindowGeometry {
  width: number;
  height: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  horizontal: boolean;
  blockName?: string;
}

export function deriveWindowGeometry(
  group: RawDxfEntity[],
  defaultHeight = 1200
): WindowGeometry | null {
  const allPts: { x: number; y: number }[] = [];
  group.forEach((m) => (m.points ?? []).forEach((p) => allPts.push(p)));

  if (allPts.length < 2) {
    console.warn("[deriveWindowGeometry] not enough points", {
      memberCount: group.length,
      pointCounts: group.map((m) => m.points?.length ?? 0),
      ids: group.map((m) => m.id),
    });
    return null;
  }

  let minX = Infinity, minY = Infinity;
  let maxX = -Infinity, maxY = -Infinity;
  for (const p of allPts) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }

  const horizontal = maxX - minX >= maxY - minY;
  const startX = horizontal ? minX : (minX + maxX) / 2;
  const startY = horizontal ? (minY + maxY) / 2 : minY;
  const endX = horizontal ? maxX : (minX + maxX) / 2;
  const endY = horizontal ? (minY + maxY) / 2 : maxY;

  const blockName =
    (group[0]?.blockName as string | undefined) ??
    (group[0]?.block_name as string | undefined) ??
    undefined;

  return {
    width: Math.hypot(endX - startX, endY - startY),
    height: defaultHeight,
    startX,
    startY,
    endX,
    endY,
    horizontal,
    blockName,
  };
}

// ─── Wall geometry derivation (shared by semantic + composite) ─────────

export interface WallGeometry {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  thickness: number;
  height: number;
  material: string;
  points: { x: number; y: number }[];
}

export function deriveWallAxis(
  group: RawDxfEntity[]
): { start: { x: number; y: number }; end: { x: number; y: number } } | null {
  if (!group || group.length === 0) return null;

  const all: { x: number; y: number }[] = [];
  for (const el of group) {
    const pts = (el.points ?? []) as { x: number; y: number }[];
    for (const p of pts) {
      if (Number.isFinite(p?.x) && Number.isFinite(p?.y)) {
        all.push({ x: p.x, y: p.y });
      }
    }
  }
  if (all.length < 2) return null;

  let best = { a: all[0], b: all[1], d: -1 };
  for (let i = 0; i < all.length; i++) {
    for (let j = i + 1; j < all.length; j++) {
      const d = Math.hypot(all[i].x - all[j].x, all[i].y - all[j].y);
      if (d > best.d) best = { a: all[i], b: all[j], d };
    }
  }
  return { start: best.a, end: best.b };
}

// ─── Builders ────────────────────────────────────────────────────────────

/**
 * Build a wall semantic record from a group of raw wall elements.
 *
 * Accepts either a group (preferred) or a single element (backwards
 * compatible). When given a group, derives the axis via
 * `deriveWallAxis` — the same helper `composeWallFromGroup` uses — so
 * the inspector's start/end match the canvas composite's geometry.
 *
 * The `suffix` parameter (new) is appended to the derived id when
 * present. The caller (`UseDxfImport`) passes a suffix when a base id
 * would collide with an id already used by another wall group. This
 * happens with closed-loop wall chains (shafts, columns): each edge
 * becomes its own wall group but they all share the same source DXF
 * entity id. Without suffixing, the semantic records collide and
 * `DrawingDocument.loadFromState` throws when the repository refuses
 * the duplicate.
 */
export function buildWall(
  input: RawDxfEntity[] | RawDxfEntity,
  index?: number,
  suffix?: string
) {
  const group: RawDxfEntity[] = Array.isArray(input) ? input : [input];

  if (group.length === 0) {
    return {
      id: `wall-empty-${Date.now()}-${Math.random()}`,
      startX: 0, startY: 0, endX: 0, endY: 0,
      thickness: 120, height: 2800, material: "Concrete",
      points: [], start: { x: 0, y: 0 }, end: { x: 0, y: 0 },
      layer: "WALLS",
    };
  }

  const first: any = group[0];
  const axis = deriveWallAxis(group);

  let startPt: { x: number; y: number };
  let endPt: { x: number; y: number };
  if (axis) {
    startPt = axis.start;
    endPt = axis.end;
  } else {
    const pts = (first.points ?? []) as { x: number; y: number }[];
    startPt =
      pts.length > 0 ? pts[0] : { x: first.startX ?? 0, y: first.startY ?? 0 };
    endPt =
      pts.length > 1
        ? pts[pts.length - 1]
        : { x: first.endX ?? 0, y: first.endY ?? 0 };
  }

  const allPts: { x: number; y: number }[] = [];
  for (const el of group) {
    for (const p of el.points ?? []) allPts.push({ x: p.x, y: p.y });
  }

  const baseId =
    (first.groupId as string | undefined) ??
    (first.id as string | undefined) ??
    `wall-${index ?? Date.now()}-${Math.random()}`;

  const id = suffix ? `${baseId}-${suffix}` : String(baseId);

  return {
    id: String(id),
    startX: startPt.x,
    startY: startPt.y,
    endX: endPt.x,
    endY: endPt.y,
    thickness: first.thickness ?? 120,
    height: first.height ?? 2800,
    material: first.material ?? "Concrete",
    points: allPts.length > 0 ? allPts : [startPt, endPt],
    start: startPt,
    end: endPt,
    layer: first.layer ?? first.originalLayer ?? "WALLS",
  };
}

export function buildDoor(group: RawDxfEntity[] | RawDxfEntity): DoorData {
  const members = Array.isArray(group) ? group : [group];
  if (members.length === 0) throw new Error("[buildDoor] empty group");

  if (members.length === 1) {
    const target: any = members[0];
    const pts = target.points || target.Points || [];
    const hingeX = Number(
      target.hingeX ?? target.startX ?? target.x ?? (pts.length > 0 ? pts[0].x : 0)
    );
    const hingeY = Number(
      target.hingeY ?? target.startY ?? target.y ?? (pts.length > 0 ? pts[0].y : 0)
    );
    const leafEndX = Number(
      target.endX ?? (pts.length > 1 ? pts[pts.length - 1].x : hingeX + (target.width || 900))
    );
    const leafEndY = Number(
      target.endY ?? (pts.length > 1 ? pts[pts.length - 1].y : hingeY)
    );
    const dx = leafEndX - hingeX;
    const dy = leafEndY - hingeY;
    const width = Number(target.width || Math.hypot(dx, dy) || 900);
    let wallAngle = target.wallAngle ?? Math.atan2(dy, dx);
    if (wallAngle < 0) wallAngle += 2 * Math.PI;
    const rawQuad = String(
      target.swingQuadrant || target.swingQuadrantAngle || "UR"
    ).toUpperCase();
    const isOutward =
      target.isOutward !== undefined
        ? Boolean(target.isOutward)
        : ["UR", "DR"].includes(rawQuad);
    const isLeftHand =
      target.isLeftHand !== undefined
        ? Boolean(target.isLeftHand)
        : ["UL", "DL"].includes(rawQuad);

    const blockName =
      target.blockName ?? target.block_name ?? target.BlockName ?? undefined;
    const blockClass = classifyBlockName(blockName);
    const isDouble = blockClass.isDouble;
    const variant = blockClass.variant ?? (isDouble ? "double" : "single");

    return {
      id: String(target.id || target.Id || `door-${Date.now()}-${Math.random()}`),
      type: "Door",
      wallId: String(target.wallId || target.WallId || "dwg-wall-root"),
      hingeX, hingeY, wallAngle, width,
      height: Number(target.height || target.Height || 2100),
      isOutward, isLeftHand,
      name: target.name || target.Name || `Door (${target.handle || "Block"})`,
      properties: {
        ...(target.properties || {}),
        openingWidth: width,
        doorType: isDouble ? "Double" : "Single",
        isDouble,
        blockName,
        variant,
      },
      style: target.style || {
        strokeColor: "#EAB308",
        strokeWidth: 2,
        opacity: 1,
      },
    };
  }

  const geometry = deriveDoorGeometry(members);
  const first = members[0];
  const groupId = String(first.groupId ?? first.id ?? `door-${Date.now()}`);

  if (!geometry) {
    console.warn(
      "[buildDoor] null geometry fallback for group", groupId,
      "— writing placeholder values (width 900)"
    );
    return {
      id: groupId,
      type: "Door",
      wallId: "dwg-wall-root",
      hingeX: 0, hingeY: 0,
      wallAngle: 0,
      width: 900, height: 2100,
      isOutward: false, isLeftHand: false,
      properties: {
        openingWidth: 900,
        doorType: "Single",
        isDouble: false,
        variant: "single",
        fallback: true,
      },
      style: { strokeColor: "#EAB308", strokeWidth: 2, opacity: 1 },
    };
  }

  return {
    id: groupId,
    type: "Door",
    wallId: "dwg-wall-root",
    hingeX: geometry.hingeX,
    hingeY: geometry.hingeY,
    wallAngle: geometry.wallAngle,
    width: geometry.width,
    height: geometry.height,
    isOutward: geometry.isOutward,
    isLeftHand: geometry.isLeftHand,
    name: undefined,
    properties: {
      isDouble: geometry.isDouble,
      openingWidth: geometry.width,
      doorType: geometry.isDouble ? "Double" : "Single",
      blockName: geometry.blockName,
      variant: geometry.variant,
    },
    style: { strokeColor: "#EAB308", strokeWidth: 2, opacity: 1 },
  };
}

export function buildWindow(group: RawDxfEntity[] | RawDxfEntity): any {
  const members = Array.isArray(group) ? group : [group];
  if (members.length === 0) {
    return { id: `window-${Date.now()}`, type: "Window" };
  }

  if (members.length === 1) {
    const target: any = members[0];
    const pts = target?.points || target?.Points || [];
    let sX: number, sY: number, eX: number, eY: number;
    if (pts.length >= 2) {
      sX = pts[0].x; sY = pts[0].y;
      eX = pts[pts.length - 1].x; eY = pts[pts.length - 1].y;
    } else {
      sX = target?.startX ?? target?.x ?? 0;
      sY = target?.startY ?? target?.y ?? 0;
      eX = target?.endX ?? sX + (target?.width || 1200);
      eY = target?.endY ?? sY;
    }
    const width = Math.hypot(eX - sX, eY - sY) || (target?.width || 1200);
    const blockName =
      target?.blockName ?? target?.block_name ?? target?.BlockName ?? undefined;

    return {
      id: target?.id || target?.Id || `window-${Date.now()}-${Math.random()}`,
      x: sX, y: sY,
      startX: sX, startY: sY, endX: eX, endY: eY,
      start: { x: sX, y: sY }, end: { x: eX, y: eY },
      width,
      height: target?.height || target?.Height || 1200,
      type: "Window",
      blockName,
      points: pts.length > 0 ? pts : [{ x: sX, y: sY }, { x: eX, y: eY }],
      layer: target?.layer || target?.Layer || "WINDOWS",
    };
  }

  const geometry = deriveWindowGeometry(members);
  const first = members[0];
  const groupId = String(first?.groupId ?? first?.id ?? `window-${Date.now()}`);

  if (!geometry) {
    console.warn(
      "[buildWindow] null geometry fallback for group", groupId,
      "— writing zeros"
    );
    return {
      id: groupId,
      x: 0, y: 0, startX: 0, startY: 0, endX: 0, endY: 0,
      start: { x: 0, y: 0 }, end: { x: 0, y: 0 },
      width: 0, height: 1200,
      type: "Window",
      blockName: first?.blockName ?? undefined,
      points: [],
      layer: first?.layer ?? "WINDOWS",
    };
  }

  return {
    id: groupId,
    x: geometry.startX,
    y: geometry.startY,
    startX: geometry.startX,
    startY: geometry.startY,
    endX: geometry.endX,
    endY: geometry.endY,
    start: { x: geometry.startX, y: geometry.startY },
    end: { x: geometry.endX, y: geometry.endY },
    width: geometry.width,
    height: geometry.height,
    type: "Window",
    blockName: geometry.blockName,
    points: members.flatMap((m) => m.points ?? []),
    layer: first?.layer ?? "WINDOWS",
  };
}

export function buildRoom(el: any) {
  const target = Array.isArray(el) && el.length > 0 ? el[0] : el;
  const pts =
    target?.points || target?.Points || target?.vertices || target?.Vertices || [];
  const points = pts.map((p: any) => ({
    x: p.x !== undefined ? p.x : p.X ?? 0,
    y: p.y !== undefined ? p.y : p.Y ?? 0,
  }));

  return {
    id: target?.id || target?.Id || `room-${Date.now()}-${Math.random()}`,
    name: target?.name || target?.Name || "Unnamed Room",
    type: "room",
    isRoom: true,
    points: points,
    vertices: points,
    targetLux: target?.targetLux || target?.TargetLux || 500,
    primaryGroup: target?.primaryGroup || target?.PrimaryGroup || 1,
    fillStyle: "rgba(74, 222, 128, 0.15)",
    strokeStyle: "#4ADE80",
    layer: target?.layer || target?.Layer || "ROOMS",
  };
}