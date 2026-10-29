// src/modules/EmergencyLighting/Document/ComplianceEngine.ts

import { EmergencyDocument, ComplianceIssue } from '@/modules/EmergencyLighting/store/emergencyTypes';
import type { PhotometricData } from '@/modules/FixturePlacementStudio/models/PhotometricData';

// ── Door tolerances ─────────────────────────────────────────────
const DOOR_TOLERANCE_MM = 500;
const GAP_CORNER_TOLERANCE_MM = 200;
const MIN_WALKABLE_GAP_MM = 600;
const MAX_GAP_CHECK_MM = 3000;
const COLLINEAR_ANGLE_TOL = 5 * Math.PI / 180;

// ── Visibility thresholds ───────────────────────────────────────
const EDGE_MARGIN_MM = 500;
const MIN_EGRESS_LUX = 1.0;

function isEmergencyFixture(f: any): boolean {
  if (!f) return false;
  const candidates = [
    f.kind, f.sourceKind, f.type, f.fixtureType, f.category, f.productType,
    f.name, f.metadata?.sourceKind, f.metadata?.kind,
    f.properties?.kind, f.properties?.sourceKind,
  ];
  for (const c of candidates) {
    if (typeof c !== 'string') continue;
    const s = c.toLowerCase().replace(/[_\s-]/g, '');
    if (s.includes('emergency')) return true;
  }
  return false;
}

function pointInPolygon(x: number, y: number, poly: { x: number; y: number }[]): boolean {
  if (!Array.isArray(poly) || poly.length < 3) return false;
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x, yi = poly[i].y;
    const xj = poly[j].x, yj = poly[j].y;
    const intersect =
      yi > y !== yj > y &&
      x < ((xj - xi) * (y - yi)) / (yj - yi + 1e-12) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function fixturePosition(f: any): { x: number; y: number } | null {
  if (!f) return null;
  if (Number.isFinite(f.x) && Number.isFinite(f.y)) return { x: f.x, y: f.y };
  if (f.position && Number.isFinite(f.position.x) && Number.isFinite(f.position.y)) {
    return { x: f.position.x, y: f.position.y };
  }
  if (Number.isFinite(f.metadata?.position?.x) && Number.isFinite(f.metadata?.position?.y)) {
    return { x: f.metadata.position.x, y: f.metadata.position.y };
  }
  if (Array.isArray(f.points) && f.points[0] && Number.isFinite(f.points[0].x) && Number.isFinite(f.points[0].y)) {
    return { x: f.points[0].x, y: f.points[0].y };
  }
  return null;
}

interface Seg { a: { x: number; y: number }; b: { x: number; y: number } }

interface TaggedSeg extends Seg {
  kind: 'wall' | 'window';
}

function extractSegments(el: any): Seg[] {
  if (!el) return [];
  const out: Seg[] = [];
  const pushConsecutive = (pts: any[]) => {
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1], b = pts[i];
      if (
        a && b &&
        Number.isFinite(a.x) && Number.isFinite(a.y) &&
        Number.isFinite(b.x) && Number.isFinite(b.y)
      ) {
        out.push({ a: { x: a.x, y: a.y }, b: { x: b.x, y: b.y } });
      }
    }
  };
  if (Array.isArray(el.primitives) && el.primitives.length > 0) {
    for (const prim of el.primitives) {
      if (Array.isArray(prim?.points)) pushConsecutive(prim.points);
    }
    if (out.length > 0) return out;
  }
  if (Array.isArray(el.points) && el.points.length >= 2) {
    pushConsecutive(el.points);
    return out;
  }
  if (Array.isArray(el.vertices) && el.vertices.length >= 2) {
    pushConsecutive(el.vertices);
    return out;
  }
  const g = el.geometry;
  if (g &&
      Number.isFinite(g.startX) && Number.isFinite(g.startY) &&
      Number.isFinite(g.endX) && Number.isFinite(g.endY)) {
    out.push({ a: { x: g.startX, y: g.startY }, b: { x: g.endX, y: g.endY } });
  }
  return out;
}

const CROSS_EPS = 1e-6;

function orientation(a: { x: number; y: number }, b: { x: number; y: number }, c: { x: number; y: number }): number {
  return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
}

function onSegment(p: { x: number; y: number }, a: { x: number; y: number }, b: { x: number; y: number }): boolean {
  return (
    Math.min(a.x, b.x) - CROSS_EPS <= p.x && p.x <= Math.max(a.x, b.x) + CROSS_EPS &&
    Math.min(a.y, b.y) - CROSS_EPS <= p.y && p.y <= Math.max(a.y, b.y) + CROSS_EPS
  );
}

function segmentIntersection(a: Seg, b: Seg): { x: number; y: number } | null {
  const o1 = orientation(a.a, a.b, b.a);
  const o2 = orientation(a.a, a.b, b.b);
  const o3 = orientation(b.a, b.b, a.a);
  const o4 = orientation(b.a, b.b, a.b);

  if (((o1 > 0 && o2 < 0) || (o1 < 0 && o2 > 0)) &&
      ((o3 > 0 && o4 < 0) || (o3 < 0 && o4 > 0))) {
    const denom = (a.a.x - a.b.x) * (b.a.y - b.b.y) - (a.a.y - a.b.y) * (b.a.x - b.b.x);
    if (Math.abs(denom) < CROSS_EPS) return null;
    const t = ((a.a.x - b.a.x) * (b.a.y - b.b.y) - (a.a.y - b.a.y) * (b.a.x - b.b.x)) / denom;
    return { x: a.a.x + t * (a.b.x - a.a.x), y: a.a.y + t * (a.b.y - a.a.y) };
  }

  if (Math.abs(o1) < CROSS_EPS && onSegment(b.a, a.a, a.b)) return { x: b.a.x, y: b.a.y };
  if (Math.abs(o2) < CROSS_EPS && onSegment(b.b, a.a, a.b)) return { x: b.b.x, y: b.b.y };
  if (Math.abs(o3) < CROSS_EPS && onSegment(a.a, b.a, b.b)) return { x: a.a.x, y: a.a.y };
  if (Math.abs(o4) < CROSS_EPS && onSegment(a.b, b.a, b.b)) return { x: a.b.x, y: a.b.y };
  return null;
}

function pointToSegmentDistance(p: { x: number; y: number }, seg: Seg): number {
  const dx = seg.b.x - seg.a.x;
  const dy = seg.b.y - seg.a.y;
  const len2 = dx * dx + dy * dy;
  if (len2 < 1e-12) return Math.hypot(p.x - seg.a.x, p.y - seg.a.y);
  let t = ((p.x - seg.a.x) * dx + (p.y - seg.a.y) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const cx = seg.a.x + t * dx;
  const cy = seg.a.y + t * dy;
  return Math.hypot(p.x - cx, p.y - cy);
}

function doorOpeningSegment(el: any): Seg | null {
  if (!el) return null;
  const g = el.geometry;
  if (g &&
      Number.isFinite(g.hingeX) && Number.isFinite(g.hingeY) &&
      Number.isFinite(g.wallAngle) && Number.isFinite(g.width)) {
    return {
      a: { x: g.hingeX, y: g.hingeY },
      b: { x: g.hingeX + g.width * Math.cos(g.wallAngle), y: g.hingeY + g.width * Math.sin(g.wallAngle) },
    };
  }
  if (Array.isArray(el.points) && el.points.length >= 2) {
    const [a, b] = el.points;
    if (Number.isFinite(a?.x) && Number.isFinite(a?.y) && Number.isFinite(b?.x) && Number.isFinite(b?.y)) {
      return { a: { x: a.x, y: a.y }, b: { x: b.x, y: b.y } };
    }
  }
  return null;
}

function gapNeighborDistance(P: { x: number; y: number }, seg: Seg, allWalls: Seg[]): number | null {
  const dirX = seg.b.x - seg.a.x;
  const dirY = seg.b.y - seg.a.y;
  const len = Math.hypot(dirX, dirY);
  if (len < 1e-6) return null;
  const ux = dirX / len;
  const uy = dirY / len;

  let bestDist: number | null = null;

  for (const other of allWalls) {
    if (other === seg) continue;

    const perpA = Math.abs((other.a.x - seg.a.x) * uy - (other.a.y - seg.a.y) * ux);
    const perpB = Math.abs((other.b.x - seg.a.x) * uy - (other.b.y - seg.a.y) * ux);
    if (perpA > 100 || perpB > 100) continue;

    const oDirX = other.b.x - other.a.x;
    const oDirY = other.b.y - other.a.y;
    const oLen = Math.hypot(oDirX, oDirY);
    if (oLen < 1e-6) continue;
    const dot = Math.abs((oDirX / oLen) * ux + (oDirY / oLen) * uy);
    if (dot < Math.cos(COLLINEAR_ANGLE_TOL)) continue;

    const d1 = Math.hypot(P.x - other.a.x, P.y - other.a.y);
    const d2 = Math.hypot(P.x - other.b.x, P.y - other.b.y);
    const d = Math.min(d1, d2);
    if (d > MAX_GAP_CHECK_MM) continue;
    if (bestDist === null || d < bestDist) bestDist = d;
  }

  return bestDist;
}

export class ComplianceEngine {
  static validate(
    doc: EmergencyDocument,
    floorplanModel: any,
    heatmapData?: PhotometricData | null,
  ): ComplianceIssue[] {
    const issues: ComplianceIssue[] = [];
    this.checkFixtureCoverage(floorplanModel, issues);
    this.checkEvacuationRoutes(doc, floorplanModel, issues);
    this.checkEmergencyLightingCoverage(floorplanModel, heatmapData ?? null, issues);
    return issues;
  }

  private static checkFixtureCoverage(
    floorplanModel: any,
    issues: ComplianceIssue[]
  ) {
    const rooms = floorplanModel.rooms || [];
    const fixtures = floorplanModel.electricalFixtures || [];
    const emergencyFixtures = fixtures.filter(isEmergencyFixture);

    for (const room of rooms) {
      const roomPoly = room.points || room.vertices || [];
      if (!Array.isArray(roomPoly) || roomPoly.length < 3) continue;

      const byId = emergencyFixtures.filter((f: any) => f.roomId === room.id);
      if (byId.length > 0) continue;

      const bySpatial = emergencyFixtures.filter((f: any) => {
        const pos = fixturePosition(f);
        if (!pos) return false;
        return pointInPolygon(pos.x, pos.y, roomPoly);
      });
      if (bySpatial.length > 0) continue;

      issues.push({
        id: `issue-cov-${room.id}`,
        ruleId: 'EN1838-4.1',
        severity: 'error',
        message: `No emergency luminaire found in room: ${room.name || 'Unnamed'}`,
        location: roomPoly[0] || { x: 0, y: 0 },
      });
    }
  }

  private static checkEvacuationRoutes(
    doc: EmergencyDocument,
    floorplanModel: any,
    issues: ComplianceIssue[]
  ) {
    const routes = doc.exitRoutes || [];
    if (routes.length === 0) {
      issues.push({
        id: `issue-route-none`,
        ruleId: 'BS5266-8',
        severity: 'warning',
        message: 'No evacuation routes defined for this floor.',
        location: { x: 0, y: 0 },
      });
      return;
    }

    const barrierKind = (el: any): 'wall' | 'window' | null => {
      if (!el) return null;
      if (el.isRoomBorder === true) return null;
      if (String(el.id ?? '').startsWith('room-edge-trace-')) return null;

      const type = String(el?.type ?? '').toLowerCase();
      const layer = String(el?.layer ?? el.originalLayer ?? '').toUpperCase();

      if (type === 'door' || layer === 'DOORS') return null;
      if (type === 'room' || type === 'fixture') return null;
      if (layer === 'ROOMS' || layer === 'FIXTURES') return null;

      if (type === 'wall' || layer === 'WALLS') return 'wall';
      if (type === 'window' || layer === 'WINDOWS') return 'window';

      return null;
    };

    const elements: any[] = Array.isArray(floorplanModel.elements) ? floorplanModel.elements : [];
    const wallSegments: TaggedSeg[] = [];
    const doorwaySegments: Seg[] = [];

    for (const el of elements) {
      const kind = barrierKind(el);
      if (kind) {
        for (const seg of extractSegments(el)) {
          wallSegments.push({ a: seg.a, b: seg.b, kind });
        }
      } else if (String(el?.type ?? '').toLowerCase() === 'door') {
        const seg = doorOpeningSegment(el);
        if (seg) doorwaySegments.push(seg);
      }
    }

    const rawSegments: Seg[] = wallSegments.map((s) => ({ a: s.a, b: s.b }));

    for (const route of routes) {
      const pts = Array.isArray(route.points) && route.points.length >= 2
        ? route.points
        : [route.startNode, route.endNode];

      // Per-segment wall/window hits (no break — collect all)
      for (let i = 1; i < pts.length; i++) {
        const routeSeg: Seg = { a: pts[i - 1], b: pts[i] };
        const segmentIndex = i - 1;

        for (const wallSeg of wallSegments) {
          const hit = segmentIntersection(routeSeg, wallSeg);
          if (!hit) continue;

          const onDoor = doorwaySegments.some(
            (d) => pointToSegmentDistance(hit, d) <= DOOR_TOLERANCE_MM
          );
          if (onDoor) continue;

          const distToA = Math.hypot(hit.x - wallSeg.a.x, hit.y - wallSeg.a.y);
          const distToB = Math.hypot(hit.x - wallSeg.b.x, hit.y - wallSeg.b.y);
          const atCorner = distToA < GAP_CORNER_TOLERANCE_MM || distToB < GAP_CORNER_TOLERANCE_MM;

          if (atCorner) {
            const neighborDist = gapNeighborDistance(hit, wallSeg, rawSegments);
            if (neighborDist === null) continue;
            if (neighborDist >= MIN_WALKABLE_GAP_MM) continue;
          }

          const label = wallSeg.kind === 'window' ? 'a window' : 'a wall';
          issues.push({
            id: `issue-route-segment-wall-${route.id}-${segmentIndex}`,
            ruleId: 'BS5266-8',
            severity: 'error',
            message:
              `Route "${route.name}" segment ${segmentIndex + 1} crosses ${label} at ` +
              `(${Math.round(hit.x)}, ${Math.round(hit.y)}). ` +
              `Draw the route through doorways and along corridors.`,
            location: hit,
            segmentIndex,
            segmentStart: { x: routeSeg.a.x, y: routeSeg.a.y },
            segmentEnd: { x: routeSeg.b.x, y: routeSeg.b.y },
            barrierKind: wallSeg.kind,
          });
        }
      }

      if (route.lengthMeters > 30) {
        issues.push({
          id: `issue-route-len-${route.id}`,
          ruleId: 'BS5266-8',
          severity: 'warning',
          message:
            `Route "${route.name}" exceeds 30m travel distance ` +
            `(${route.lengthMeters.toFixed(1)}m).`,
          location: route.startNode,
        });
      }

      if (!route.isCompliant) {
        issues.push({
          id: `issue-route-block-${route.id}`,
          ruleId: 'BS5266-8',
          severity: 'error',
          message: `Route "${route.name}" is blocked or unreachable.`,
          location: route.startNode,
        });
      }
    }
  }

  private static checkEmergencyLightingCoverage(
    floorplanModel: any,
    heatmapData: PhotometricData | null,
    issues: ComplianceIssue[]
  ) {
    if (!heatmapData || !Array.isArray(heatmapData.samples) || heatmapData.samples.length === 0) {
      issues.push({
        id: 'issue-visibility-no-heatmap',
        ruleId: 'BS5266-6.3.2',
        severity: 'info',
        message:
          'Visibility analysis skipped — no heatmap computed. ' +
          'Click 🔥 Heatmap in the toolbar to compute illuminance, then re-run the simulation.',
        location: { x: 0, y: 0 },
      });
      return;
    }

    const rooms = floorplanModel.rooms || [];
    const samples = heatmapData.samples;

    for (const room of rooms) {
      const poly: Array<{ x: number; y: number }> = room.points || room.vertices || [];
      if (!Array.isArray(poly) || poly.length < 3) continue;

      const inside = samples.filter((s) => pointInPolygon(s.x, s.y, poly));
      if (inside.length === 0) continue;

      const walkable = inside.filter((s) => {
        for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
          const d = pointToSegmentDistance(
            { x: s.x, y: s.y },
            { a: poly[j], b: poly[i] },
          );
          if (d < EDGE_MARGIN_MM) return false;
        }
        return true;
      });

      if (walkable.length === 0) continue;

      const dark = walkable.filter((s) => s.lux < MIN_EGRESS_LUX);
      if (dark.length > 0) {
        issues.push({
          id: `issue-visibility-dark-${room.id}`,
          ruleId: 'BS5266-6.3.2',
          severity: 'error',
          message:
            `Room "${room.name || 'Unnamed'}" has ${dark.length}/${walkable.length} ` +
            `walkable cells below ${MIN_EGRESS_LUX} lx (minimum egress illuminance).`,
          location: { x: dark[0].x, y: dark[0].y },
        });
      }

      const target = Number(room.targetLux ?? room.lux ?? 500);
      if (!Number.isFinite(target) || target <= 0) continue;

      const sum = walkable.reduce((acc, s) => acc + s.lux, 0);
      const avg = sum / walkable.length;

      if (avg < target) {
        issues.push({
          id: `issue-visibility-avg-${room.id}`,
          ruleId: 'EN12464-1',
          severity: 'info',
          message:
            `Room "${room.name || 'Unnamed'}" average ${avg.toFixed(0)} lx is below ` +
            `target ${target} lx.`,
          location: { x: poly[0].x, y: poly[0].y },
        });
      }
    }
  }
}