// src/modules/EmergencyLighting/Canvas/ComplianceOverlay.tsx
//
// Renders compliance issues produced by ComplianceEngine as coloured
// SVG markers on the canvas. Mirrors the compliance panel: any issue
// the panel lists is drawn here at the same location with the same
// severity colour.
//
// Four kinds of issue geometry are supported:
//
//   1. Explicit polygon — issue.points is a closed ring (3+ points).
//   2. Room reference — derived from issue.roomId if present, or
//      parsed out of issue.id (the engine embeds the room id as
//      `issue-<kind>-<roomId>`). Resolves against room polygons from
//      state.emergency.floorplan.model.rooms (with a model.elements
//      fallback). This is the branch used by task-illuminance
//      failures (e.g. "Room A2 average 299 lx is below target
//      300 lx") and by the room-scoped fixture-coverage and
//      dark-spot rules.
//   3. Segment — issue.startPoint and issue.endPoint are set.
//   4. Point — issue.x / issue.y or issue.position are set.
//
// Issues with no resolvable geometry are skipped (return null) — they
// will still appear in the sidebar panel.

import React from 'react';
import { useAppSelector } from '@/Application/ConfigureStore';

interface ComplianceOverlayProps {
  worldToScreen: (p: { x: number; y: number }) => { x: number; y: number };
}

const SEVERITY_COLOR: Record<'error' | 'warning' | 'info', string> = {
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#38BDF8',
};

const SEVERITY_FILL: Record<'error' | 'warning' | 'info', string> = {
  error: 'rgba(239, 68, 68, 0.18)',
  warning: 'rgba(245, 158, 11, 0.15)',
  info: 'rgba(56, 189, 248, 0.12)',
};

function normalizeSeverity(raw: unknown): 'error' | 'warning' | 'info' {
  if (raw === 'error' || raw === 'warning' || raw === 'info') return raw;
  return 'info';
}

/**
 * Extract the room id an issue refers to.
 *
 * The compliance engine embeds the room id in the issue's `id` for
 * room-scoped rules:
 *
 *   issue-cov-<roomId>             (checkFixtureCoverage)
 *   issue-visibility-dark-<roomId> (checkEmergencyLightingCoverage — dark spots)
 *   issue-visibility-avg-<roomId>  (checkEmergencyLightingCoverage — average lx)
 *
 * If a future engine change adds a first-class `roomId` field, that
 * is preferred. Route-scoped issues (issue-route-*) and the global
 * issue-visibility-no-heatmap are deliberately not matched.
 */
function extractRoomId(issue: any): string | null {
  // Direct field first, in case the engine ever sets it.
  const direct = issue?.roomId ?? issue?.roomID;
  if (direct != null && String(direct) !== '') return String(direct);

  // Parse the trailing room id out of the issue id.
  const m = /^issue-(?:cov|visibility-(?:dark|avg))-(.+)$/.exec(
    String(issue?.id ?? '')
  );
  return m ? m[1] : null;
}

export const ComplianceOverlay: React.FC<ComplianceOverlayProps> = ({
  worldToScreen,
}) => {
  const issues = useAppSelector((s: any) => s.emergency.simulation.issues || []);
  const simulationStatus = useAppSelector((s: any) => s.emergency.simulation.status);

  // Room polygons for the room-tint branch. Prefer the dedicated
  // model.rooms array; fall back to filtering model.elements (which
  // is how EmergencyCanvas and FPS room utilities also find rooms).
  const rooms = useAppSelector((s: any) => {
    const model = s.emergency.floorplan.model;
    if (!model) return [];
    if (Array.isArray(model.rooms) && model.rooms.length > 0) return model.rooms;
    const elements = Array.isArray(model.elements) ? model.elements : [];
    return elements.filter((el: any) => {
      const t = String(el?.type ?? '').toLowerCase();
      return t === 'room' || t === 'rooms' || el?.isRoom === true;
    });
  });

  if (simulationStatus !== 'complete') return null;
  if (!Array.isArray(issues) || issues.length === 0) return null;

  // Build a roomId → polygon lookup once per render.
  const roomPolygonById = new Map<string, Array<{ x: number; y: number }>>();
  for (const r of rooms) {
    const id = String(r?.id ?? r?.Id ?? '');
    if (!id) continue;
    const pts = r.points || r.vertices || [];
    if (Array.isArray(pts) && pts.length >= 3) {
      roomPolygonById.set(id, pts);
    }
  }

  return (
    <g style={{ pointerEvents: 'none' }} className="compliance-overlay">
      {issues.map((issue: any, idx: number) => {
        const severity = normalizeSeverity(issue.severity);
        const color = SEVERITY_COLOR[severity];
        const fill = SEVERITY_FILL[severity];

        // ── 1. Explicit polygon ─────────────────────────────────────
        if (Array.isArray(issue.points) && issue.points.length >= 3) {
          const screenPts = issue.points.map(worldToScreen);
          const polyline = screenPts
            .map((p: { x: number; y: number }) => `${p.x},${p.y}`)
            .join(' ');
          return (
            <polygon
              key={`issue-poly-${idx}`}
              points={polyline}
              fill={fill}
              stroke={color}
              strokeWidth={2}
              strokeDasharray="6 4"
              opacity={0.7}
            />
          );
        }

        // ── 2. Room reference (matches the panel's room-level rows) ─
        const roomId = extractRoomId(issue);
        if (roomId) {
          const poly = roomPolygonById.get(roomId);
          if (poly) {
            const screenPts = poly.map(worldToScreen);
            const polyline = screenPts
              .map((p: { x: number; y: number }) => `${p.x},${p.y}`)
              .join(' ');
            return (
              <polygon
                key={`issue-room-${idx}`}
                points={polyline}
                fill={fill}
                stroke={color}
                strokeWidth={2}
                strokeDasharray="6 4"
                opacity={0.7}
              />
            );
          }
        }

        // ── 3. Segment ──────────────────────────────────────────────
        if (
          issue.startPoint &&
          issue.endPoint &&
          typeof issue.startPoint.x === 'number' &&
          typeof issue.endPoint.x === 'number'
        ) {
          const a = worldToScreen(issue.startPoint);
          const b = worldToScreen(issue.endPoint);
          return (
            <line
              key={`issue-seg-${idx}`}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke={color}
              strokeWidth={10}
              strokeLinecap="round"
              opacity={0.4}
            />
          );
        }

        // ── 4. Point marker ─────────────────────────────────────────
        const px =
          typeof issue.x === 'number' ? issue.x : issue.position?.x ?? null;
        const py =
          typeof issue.y === 'number' ? issue.y : issue.position?.y ?? null;
        if (px == null || py == null) return null;

        const screen = worldToScreen({ x: px, y: py });
        return (
          <g
            key={`issue-pt-${idx}`}
            transform={`translate(${screen.x}, ${screen.y})`}
          >
            <circle r={14} fill={fill} />
            <circle r={7} fill={color} stroke="#0B0F19" strokeWidth={2} />
            <text
              x={0}
              y={0}
              fill="#0B0F19"
              fontSize={10}
              fontFamily="monospace"
              fontWeight="bold"
              textAnchor="middle"
              dominantBaseline="middle"
            >
              !
            </text>
          </g>
        );
      })}
    </g>
  );
};

export default ComplianceOverlay;