// src/modules/FloorPlanDesigner/Utils/SnapService.ts

import { Point2D } from "@/modules/FloorPlanDesigner/Models/Base/Geometry";
import { store } from "@/Application/ConfigureStore";
import { extractWallCenterlines } from "@/modules/FloorPlanDesigner/Utils/WallCenterlineExtractor";

// ─────────────────────────────────────────────────────────────────────────────
// Public types
// ─────────────────────────────────────────────────────────────────────────────

export interface SnapResult {
  point: Point2D;
  wallId?: string;
  wallStart?: Point2D;
  wallEnd?: Point2D;
  type: "endpoint" | "midpoint" | "intersection" | "perpendicular" | "grid" | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal types
// ─────────────────────────────────────────────────────────────────────────────

interface CandidateWall {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

interface CachedWalls {
  walls: CandidateWall[];
  timestamp: number;
}

interface RankedCandidate {
  point: Point2D;
  type: NonNullable<SnapResult["type"]>;
  wall?: CandidateWall;
  screenDist: number;
  /** Lower number = higher priority. See SNAP_PRIORITY. */
  priority: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Priority order for snap types. Lower number wins.
 *
 * With centerline normalization in place, a corner has exactly ONE crossing
 * between two logical walls, so priority mainly decides between a crossing
 * and a nearby endpoint/midpoint — not between multiple face crossings.
 */
const SNAP_PRIORITY: Record<NonNullable<SnapResult["type"]>, number> = {
  intersection: 0,
  endpoint: 1,
  midpoint: 2,
  perpendicular: 3,
  grid: 4,
};

/** Outer snap radius in screen pixels. */
const SNAP_RADIUS_PX = 20;

/** Intent radius in screen pixels. Candidates inside this radius compete on priority first, distance second. */
const INTENT_RADIUS_PX = 12;

/** Grid size in world units. */
const GRID_SIZE = 10;

/** Wall-list cache TTL in ms. */
const CACHE_TTL_MS = 500;

/** Multiplier on snap radius used for the bounding-box pre-filter. */
const BBOX_MULTIPLIER = 2.5;

/** Degenerate-segment guard: segments shorter than this contribute no geometry. */
const MIN_SEGMENT_LEN = 1e-6;

/** Floating-point tolerance for endpoint-coincidence checks. */
const EPS = 1e-3;

// ─────────────────────────────────────────────────────────────────────────────
// Geometry helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Intersection point of segments AB and CD, or null if they don't cross
 * within the segment bounds. Collinear / parallel → null.
 */
function segmentIntersection(
  a: Point2D,
  b: Point2D,
  c: Point2D,
  d: Point2D
): Point2D | null {
  const r_x = b.x - a.x;
  const r_y = b.y - a.y;
  const s_x = d.x - c.x;
  const s_y = d.y - c.y;

  const denom = r_x * s_y - r_y * s_x;
  if (Math.abs(denom) < 1e-9) return null;

  const t = ((c.x - a.x) * s_y - (c.y - a.y) * s_x) / denom;
  const u = ((c.x - a.x) * r_y - (c.y - a.y) * r_x) / denom;

  if (t < 0 || t > 1 || u < 0 || u > 1) return null;

  return { x: a.x + t * r_x, y: a.y + t * r_y };
}

/** True when two points coincide within EPS. */
function pointsEqual(a: Point2D, b: Point2D): boolean {
  return Math.abs(a.x - b.x) < EPS && Math.abs(a.y - b.y) < EPS;
}

/** Project point P onto segment AB, clamped to the segment. Null if AB is degenerate. */
function projectOntoSegment(
  p: Point2D,
  a: Point2D,
  b: Point2D
): Point2D | null {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq < MIN_SEGMENT_LEN) return null;

  const t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq;
  if (t < 0 || t > 1) return null;
  return { x: a.x + t * dx, y: a.y + t * dy };
}

// ─────────────────────────────────────────────────────────────────────────────
// SnapService
// ─────────────────────────────────────────────────────────────────────────────

export class SnapService {
  private static wallCache: CachedWalls | null = null;
  private static listenerAttached = false;

  // ───────────────────────────────────────────────────────────────────────
  // Cache
  // ───────────────────────────────────────────────────────────────────────

  private static ensureCacheInvalidationListener(): void {
    if (this.listenerAttached) return;
    if (typeof window === "undefined") return;

    const invalidate = () => {
      SnapService.wallCache = null;
    };

    // Any of these events means geometry changed; drop the cache.
    window.addEventListener("sbs:canvas-update", invalidate);
    window.addEventListener("canvas-invalidate", invalidate);
    window.addEventListener("floorPlan:document:changed", invalidate);

    this.listenerAttached = true;
  }

  static invalidateCache(): void {
    this.wallCache = null;
  }

  // ───────────────────────────────────────────────────────────────────────
  // Wall list
  // ───────────────────────────────────────────────────────────────────────

  /**
   * Returns the wall list used by snapping.
   *
   * Pipeline:
   *   1. Merge raw walls from Redux and the global doc mirror, deduped by id.
   *   2. Drop room border walls (`isRoomBorder`) — RoomTool rendering artifact.
   *   3. Run `extractWallCenterlines` to normalize each raw segment into a
   *      logical wall (validates coords, drops degenerate segments, preserves
   *      thickness). The extractor does NOT pair or merge walls in this
   *      codebase — the source data already carries per-wall thickness.
   */
  private static getAllWalls(): CandidateWall[] {
    const now =
      typeof performance !== "undefined" ? performance.now() : Date.now();

    if (this.wallCache && now - this.wallCache.timestamp < CACHE_TTL_MS) {
      return this.wallCache.walls;
    }

    const raw = SnapService.collectRawWalls();
    const logical = extractWallCenterlines(raw);

    const out: CandidateWall[] = logical.map((w) => ({
      id: w.id,
      startX: w.startX,
      startY: w.startY,
      endX: w.endX,
      endY: w.endY,
    }));

    this.wallCache = { walls: out, timestamp: now };
    return out;
  }

  /** Merge raw walls from Redux + the global mirror, deduped by id. */
  private static collectRawWalls(): any[] {
    const state = store.getState();
    const floorPlan = state.floorPlan || {};
    const document = floorPlan.document || {};
    const walls = document.walls || [];

    const globalDoc = (window as any).__floorPlanActiveDocumentInstance;
    const globalWalls = globalDoc?.walls || [];

    const seen = new Set<string>();
    const raw: any[] = [];

    const push = (w: any) => {
      if (!w) return;
      if (w.isRoomBorder) return;
      const id = String(w.id ?? w.Id ?? "");
      if (!id || seen.has(id)) return;
      seen.add(id);
      raw.push(w);
    };

    for (const w of walls) push(w);
    for (const w of globalWalls) push(w);
    return raw;
  }

  // ───────────────────────────────────────────────────────────────────────
  // Room vertices
  // ───────────────────────────────────────────────────────────────────────

  private static getAllRoomVertices(): Point2D[] {
    const state = store.getState();
    const floorPlan = state.floorPlan || {};
    const document = floorPlan.document || {};
    const rooms = document.rooms || [];

    const globalDoc = (window as any).__floorPlanActiveDocumentInstance;
    const globalRooms = globalDoc?.rooms || [];

    const out: Point2D[] = [];
    const seen = new Set<string>();

    const push = (r: any) => {
      if (!r) return;
      const id = String(r.id ?? r.Id ?? "");
      if (id && seen.has(id)) return;
      if (id) seen.add(id);

      const pts = r.points || r.vertices || [];
      for (const p of pts) {
        const x = Number(p?.x ?? p?.X ?? NaN);
        const y = Number(p?.y ?? p?.Y ?? NaN);
        if (!isNaN(x) && !isNaN(y)) out.push({ x, y });
      }
    };

    for (const r of rooms) push(r);
    for (const r of globalRooms) push(r);
    return out;
  }

  // ───────────────────────────────────────────────────────────────────────
  // Main entry point
  // ───────────────────────────────────────────────────────────────────────

  static getSnappedPoint(
    screenX: number,
    screenY: number,
    worldX: number,
    worldY: number,
    viewport: any
  ): SnapResult {
    this.ensureCacheInvalidationListener();

    const fallback: SnapResult = {
      point: { x: worldX, y: worldY },
      type: null,
    };

    if (!viewport || typeof viewport.worldToScreen !== "function") {
      return fallback;
    }

    try {
      const result = SnapService.computeSnap(
        screenX,
        screenY,
        worldX,
        worldY,
        viewport
      );
      return result ?? fallback;
    } catch (error) {
      console.warn("[SnapService] Error during snapping:", error);
      return fallback;
    }
  }

  private static computeSnap(
    screenX: number,
    screenY: number,
    worldX: number,
    worldY: number,
    viewport: any
  ): SnapResult | null {
    // ── Screen↔world scale + bbox pre-filter ───────────────────────────
    const originScreen = viewport.worldToScreen({ x: 0, y: 0 });
    const probeScreen = viewport.worldToScreen({ x: 1000, y: 0 });
    const pixelsPerWorldUnit =
      Math.hypot(probeScreen.x - originScreen.x, probeScreen.y - originScreen.y) /
        1000 || 1;

    const radiusWorld =
      (SNAP_RADIUS_PX * BBOX_MULTIPLIER) / Math.max(pixelsPerWorldUnit, 1e-6);

    const bboxMinX = worldX - radiusWorld;
    const bboxMaxX = worldX + radiusWorld;
    const bboxMinY = worldY - radiusWorld;
    const bboxMaxY = worldY + radiusWorld;

    const allWalls = SnapService.getAllWalls();
    const nearbyWalls: CandidateWall[] = [];
    for (const w of allWalls) {
      const minX = Math.min(w.startX, w.endX);
      const maxX = Math.max(w.startX, w.endX);
      const minY = Math.min(w.startY, w.endY);
      const maxY = Math.max(w.startY, w.endY);
      if (
        maxX >= bboxMinX &&
        minX <= bboxMaxX &&
        maxY >= bboxMinY &&
        minY <= bboxMaxY
      ) {
        nearbyWalls.push(w);
      }
    }

    // ── Collect candidates ─────────────────────────────────────────────
    const candidates: RankedCandidate[] = [];

    const pushCandidate = (
      worldPoint: Point2D,
      type: NonNullable<SnapResult["type"]>,
      wall?: CandidateWall
    ) => {
      const screen = viewport.worldToScreen(worldPoint);
      const screenDist = Math.hypot(screen.x - screenX, screen.y - screenY);
      if (screenDist > SNAP_RADIUS_PX) return;

      candidates.push({
        point: worldPoint,
        type,
        wall,
        screenDist,
        priority: SNAP_PRIORITY[type],
      });
    };

    // (1) Room vertices → endpoint-quality snap
    for (const v of SnapService.getAllRoomVertices()) {
      if (v.x < bboxMinX || v.x > bboxMaxX || v.y < bboxMinY || v.y > bboxMaxY) {
        continue;
      }
      pushCandidate(v, "endpoint");
    }

    // (2) Wall endpoints, midpoints, perpendicular projections
    for (const wall of nearbyWalls) {
      const start = { x: wall.startX, y: wall.startY };
      const end = { x: wall.endX, y: wall.endY };

      pushCandidate(start, "endpoint", wall);
      pushCandidate(end, "endpoint", wall);

      pushCandidate(
        { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 },
        "midpoint",
        wall
      );

      const projected = projectOntoSegment(
        { x: worldX, y: worldY },
        start,
        end
      );
      if (projected) pushCandidate(projected, "perpendicular", wall);
    }

    // (3) Wall-wall crossings.
    //     With centerline normalization there is only one crossing per
    //     logical corner, but we still walk all pairs in the nearby set.
    for (let i = 0; i < nearbyWalls.length; i++) {
      const wa = nearbyWalls[i];
      const a1 = { x: wa.startX, y: wa.startY };
      const a2 = { x: wa.endX, y: wa.endY };

      for (let j = i + 1; j < nearbyWalls.length; j++) {
        const wb = nearbyWalls[j];
        const b1 = { x: wb.startX, y: wb.startY };
        const b2 = { x: wb.endX, y: wb.endY };

        const cross = segmentIntersection(a1, a2, b1, b2);
        if (!cross) continue;

        // Skip crossings that land on an endpoint — the endpoint
        // candidate already covers that with a clearer indicator.
        if (
          pointsEqual(cross, a1) ||
          pointsEqual(cross, a2) ||
          pointsEqual(cross, b1) ||
          pointsEqual(cross, b2)
        ) {
          continue;
        }

        pushCandidate(cross, "intersection", wa);
      }
    }

    // (4) Grid fallback
    const gridX = Math.round(worldX / GRID_SIZE) * GRID_SIZE;
    const gridY = Math.round(worldY / GRID_SIZE) * GRID_SIZE;
    pushCandidate({ x: gridX, y: gridY }, "grid");

    if (candidates.length === 0) return null;

    // ── Ranking ────────────────────────────────────────────────────────
    // 1. Candidates inside INTENT_RADIUS compete on priority first,
    //    distance second.
    // 2. If none are inside INTENT_RADIUS, the full pool ranks the same
    //    way across SNAP_RADIUS.
    const intentCandidates = candidates.filter(
      (c) => c.screenDist <= INTENT_RADIUS_PX
    );
    const pool = intentCandidates.length > 0 ? intentCandidates : candidates;

    let winner = pool[0];
    for (let i = 1; i < pool.length; i++) {
      const cand = pool[i];
      const candBetter =
        cand.priority < winner.priority ||
        (cand.priority === winner.priority &&
          cand.screenDist < winner.screenDist);
      if (candBetter) winner = cand;
    }

    return {
      point: winner.point,
      type: winner.type,
      wallId: winner.wall?.id,
      wallStart: winner.wall
        ? { x: winner.wall.startX, y: winner.wall.startY }
        : undefined,
      wallEnd: winner.wall
        ? { x: winner.wall.endX, y: winner.wall.endY }
        : undefined,
    };
  }

  // ───────────────────────────────────────────────────────────────────────
  // Indicator rendering
  // ───────────────────────────────────────────────────────────────────────

  static renderSnapIndicator(
    context: CanvasRenderingContext2D,
    point: Point2D,
    type: SnapResult["type"],
    viewport: any
  ): void {
    if (!point) return;
    if (!viewport || typeof viewport.worldToScreen !== "function") return;

    try {
      const screenPos = viewport.worldToScreen(point);
      context.save();
      context.setTransform(1, 0, 0, 1, 0, 0);

      let color = "#00D2FF";
      let size = 6;
      switch (type) {
        case "intersection":  color = "#6BCB77"; size = 8; break;
        case "endpoint":      color = "#FF6B6B"; size = 8; break;
        case "midpoint":      color = "#FFD93D"; size = 7; break;
        case "perpendicular": color = "#A78BFA"; size = 6; break;
        case "grid":          color = "#4D96FF"; size = 4; break;
        default:              color = "#00D2FF"; size = 6;
      }

      context.beginPath();
      context.arc(screenPos.x, screenPos.y, size, 0, Math.PI * 2);
      context.fillStyle = color;
      context.fill();
      context.strokeStyle = "rgba(255,255,255,0.5)";
      context.lineWidth = 1.5;
      context.stroke();

      context.beginPath();
      context.moveTo(screenPos.x - size - 4, screenPos.y);
      context.lineTo(screenPos.x + size + 4, screenPos.y);
      context.moveTo(screenPos.x, screenPos.y - size - 4);
      context.lineTo(screenPos.x, screenPos.y + size + 4);
      context.strokeStyle = "rgba(255,255,255,0.3)";
      context.lineWidth = 1;
      context.setLineDash([2, 4]);
      context.stroke();
      context.setLineDash([]);

      const label = type ? type.toUpperCase() : "";
      context.fillStyle = "rgba(0,0,0,0.7)";
      context.fillRect(screenPos.x - 24, screenPos.y - 25, 48, 16);
      context.fillStyle = color;
      context.font = "8px monospace";
      context.textAlign = "center";
      context.fillText(label, screenPos.x, screenPos.y - 13);
      context.restore();
    } catch (error) {
      console.warn("[SnapService] Error rendering snap indicator:", error);
    }
  }

  // ───────────────────────────────────────────────────────────────────────
  // Sidebar bridge
  // ───────────────────────────────────────────────────────────────────────

  static pickElementFromList(type: string, id: string): any {
    const win = window as any;
    const bridge = win.__floorPlanSidebarElementsBridge || {};
    const elementsList =
      bridge[type.toLowerCase() + "s"] || bridge[type.toLowerCase()] || [];

    if (Array.isArray(elementsList)) {
      const match = elementsList.find(
        (el: any) =>
          String(el.id || el.Id || "").trim() === String(id).trim()
      );
      if (match) {
        return match.properties || match;
      }
    }
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Debug hooks
// ─────────────────────────────────────────────────────────────────────────────

// Exposes the centerline extractor on window so it can be called from the
// browser console during development. No runtime cost, no behavior change.
if (typeof window !== "undefined") {
  (window as any).__extractWallCenterlines = extractWallCenterlines;
}

export default SnapService;