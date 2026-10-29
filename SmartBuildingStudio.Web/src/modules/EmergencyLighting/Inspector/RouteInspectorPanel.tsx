// src/modules/EmergencyLighting/Inspector/RouteInspectorPanel.tsx

import React, { useMemo, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/Application/ConfigureStore';
import {
  requestFocusSegment,
  removeEvacuationRouteAction,
  removeRouteElementAction,
} from '@/modules/EmergencyLighting/store/emergencySlice';
import { runEmergencySimulation } from '@/modules/EmergencyLighting/store/emergencyThunks';
import type { ComplianceIssue } from '@/modules/EmergencyLighting/store/emergencyTypes';

function isRouteLevelIssue(issue: ComplianceIssue, routeId: string): boolean {
  return (
    issue.id === `issue-route-len-${routeId}` ||
    issue.id === `issue-route-block-${routeId}`
  );
}

interface SegmentRow {
  index: number;
  from: { x: number; y: number };
  to: { x: number; y: number };
  lengthMeters: number;
  issues: ComplianceIssue[];
}

const severityColor = (s: ComplianceIssue['severity']) =>
  s === 'error' ? '#EF4444' : s === 'warning' ? '#F59E0B' : '#38BDF8';

type BadgeState =
  | { kind: 'compliant'; label: 'COMPLIANT'; color: '#10B981' }
  | { kind: 'errors'; label: string; color: '#EF4444' }
  | { kind: 'warnings'; label: string; color: '#F59E0B' }
  | { kind: 'unevaluated'; label: 'NOT EVALUATED'; color: '#64748B' };

function deriveBadge(
  simStatus: 'idle' | 'running' | 'complete' | 'error',
  errorCount: number,
  warningCount: number,
): BadgeState {
  if (simStatus !== 'complete') {
    return { kind: 'unevaluated', label: 'NOT EVALUATED', color: '#64748B' };
  }
  if (errorCount > 0) {
    return {
      kind: 'errors',
      label: `${errorCount} ERROR${errorCount !== 1 ? 'S' : ''}`,
      color: '#EF4444',
    };
  }
  if (warningCount > 0) {
    return {
      kind: 'warnings',
      label: `${warningCount} WARNING${warningCount !== 1 ? 'S' : ''}`,
      color: '#F59E0B',
    };
  }
  return { kind: 'compliant', label: 'COMPLIANT', color: '#10B981' };
}

export const RouteInspectorPanel: React.FC<{ routeId: string }> = ({ routeId }) => {
  const dispatch = useAppDispatch();
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const route = useAppSelector((s: any) =>
    (s.emergency.routes || []).find((r: any) => r.id === routeId)
  );
  const allIssues: ComplianceIssue[] = useAppSelector(
    (s: any) => s.emergency.simulation.issues || []
  );
  const simStatus: 'idle' | 'running' | 'complete' | 'error' = useAppSelector(
    (s: any) => s.emergency.simulation.status ?? 'idle'
  );

  const { segments, routeLevelIssues } = useMemo(() => {
    if (!route) {
      return {
        segments: [] as SegmentRow[],
        routeLevelIssues: [] as ComplianceIssue[],
      };
    }

    const routeIssues = allIssues.filter(
      (i) => i.id.includes(`-${routeId}`) || i.id.endsWith(routeId)
    );
    const segmentIssues = routeIssues.filter((i) => typeof i.segmentIndex === 'number');
    const routeLevel = routeIssues.filter((i) => isRouteLevelIssue(i, routeId));

    const pts: Array<{ x: number; y: number }> =
      Array.isArray(route.points) && route.points.length >= 2
        ? route.points
        : [route.startNode, route.endNode];

    const rows: SegmentRow[] = [];
    for (let i = 1; i < pts.length; i++) {
      const from = pts[i - 1];
      const to = pts[i];
      rows.push({
        index: i - 1,
        from,
        to,
        lengthMeters: Math.hypot(to.x - from.x, to.y - from.y) / 1000,
        issues: segmentIssues.filter((iss) => iss.segmentIndex === i - 1),
      });
    }
    return { segments: rows, routeLevelIssues: routeLevel };
  }, [route, allIssues, routeId]);

  if (!route) {
    return (
      <div style={{ padding: 16, color: '#64748B', fontSize: 11 }}>
        Route not found.
      </div>
    );
  }

  const errorCount = allIssues.filter(
    (i) => i.id.includes(`-${routeId}`) && i.severity === 'error'
  ).length;
  const warningCount = allIssues.filter(
    (i) => i.id.includes(`-${routeId}`) && i.severity === 'warning'
  ).length;
  const badge = deriveBadge(simStatus, errorCount, warningCount);

  const handleFocus = (segmentIndex: number) => {
    dispatch(requestFocusSegment({ routeId, segmentIndex }));
  };

  const handleDelete = () => {
    // Order matters: remove from routes first so the subsequent simulation
    // doesn't see the deleted route.
    dispatch(removeEvacuationRouteAction(routeId));
    dispatch(removeRouteElementAction(routeId));
    dispatch(runEmergencySimulation() as any);
    setConfirmingDelete(false);
  };

  const handleRerun = () => {
    dispatch(runEmergencySimulation() as any);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 'bold', color: '#E2E8F0' }}>
          {route.name}
        </div>
        <div style={{ fontSize: 10, color: '#64748B', marginTop: 2 }}>
          {route.lengthMeters.toFixed(1)} m · {segments.length} segment
          {segments.length === 1 ? '' : 's'}
        </div>
        <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              display: 'inline-block',
              padding: '2px 8px',
              borderRadius: 3,
              fontSize: 9,
              fontWeight: 'bold',
              letterSpacing: 0.4,
              color: badge.color,
              border: `1px solid ${badge.color}`,
              background: 'transparent',
            }}
          >
            {badge.label}
          </span>
          {badge.kind === 'unevaluated' && (
            <button
              onClick={handleRerun}
              style={{
                background: 'transparent',
                border: '1px solid #334155',
                color: '#38BDF8',
                padding: '1px 8px',
                borderRadius: 3,
                fontSize: 9,
                cursor: 'pointer',
                fontFamily: 'monospace',
              }}
              title="Run the simulation to evaluate this route"
            >
              run simulation
            </button>
          )}
        </div>
      </div>

      {routeLevelIssues.length > 0 && (
        <div>
          <div
            style={{
              fontSize: 9,
              color: '#94A3B8',
              textTransform: 'uppercase',
              marginBottom: 4,
            }}
          >
            Route issues
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {routeLevelIssues.map((issue) => (
              <div
                key={issue.id}
                style={{
                  padding: 6,
                  borderRadius: 3,
                  background: 'rgba(15,20,36,0.6)',
                  borderLeft: `3px solid ${severityColor(issue.severity)}`,
                }}
              >
                <div style={{ fontSize: 8, color: '#64748B' }}>{issue.ruleId}</div>
                <div style={{ fontSize: 10, color: '#E2E8F0', lineHeight: 1.4 }}>
                  {issue.message}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <div
          style={{
            fontSize: 9,
            color: '#94A3B8',
            textTransform: 'uppercase',
            marginBottom: 4,
          }}
        >
          Segments ({segments.length})
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {segments.map((seg) => {
            const hasError = seg.issues.some((i) => i.severity === 'error');
            const hasWarning = seg.issues.some((i) => i.severity === 'warning');
            const borderColor = hasError
              ? '#EF4444'
              : hasWarning
              ? '#F59E0B'
              : '#334155';
            return (
              <div
                key={seg.index}
                style={{
                  padding: 6,
                  borderRadius: 3,
                  background: 'rgba(30,41,59,0.5)',
                  borderLeft: `3px solid ${borderColor}`,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div
                    style={{ fontSize: 10, color: '#E2E8F0', fontWeight: 'bold' }}
                  >
                    Segment {seg.index + 1}
                  </div>
                  <button
                    onClick={() => handleFocus(seg.index)}
                    style={{
                      background: 'transparent',
                      border: '1px solid #334155',
                      color: '#38BDF8',
                      padding: '1px 6px',
                      borderRadius: 3,
                      fontSize: 9,
                      cursor: 'pointer',
                      fontFamily: 'monospace',
                    }}
                    title="Zoom canvas to this segment"
                  >
                    focus
                  </button>
                </div>
                <div style={{ fontSize: 9, color: '#64748B', marginTop: 2 }}>
                  {seg.lengthMeters.toFixed(2)} m · from ({Math.round(seg.from.x)},{' '}
                  {Math.round(seg.from.y)}) to ({Math.round(seg.to.x)},{' '}
                  {Math.round(seg.to.y)})
                </div>

                {seg.issues.length > 0 && (
                  <div
                    style={{
                      marginTop: 4,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 3,
                    }}
                  >
                    {seg.issues.map((issue) => (
                      <div
                        key={issue.id}
                        style={{
                          padding: 4,
                          borderRadius: 2,
                          background: 'rgba(15,20,36,0.6)',
                          borderLeft: `2px solid ${severityColor(issue.severity)}`,
                        }}
                      >
                        <div
                          style={{ fontSize: 10, color: '#E2E8F0', lineHeight: 1.4 }}
                        >
                          {issue.barrierKind === 'window'
                            ? 'Crosses window'
                            : 'Crosses wall'}{' '}
                          at ({Math.round(issue.location.x)},{' '}
                          {Math.round(issue.location.y)})
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          gap: 6,
          paddingTop: 4,
          borderTop: '1px solid #1E293B',
        }}
      >
        <button
          onClick={handleRerun}
          style={{
            flex: 1,
            background: 'transparent',
            border: '1px solid #334155',
            color: '#38BDF8',
            padding: '4px 8px',
            borderRadius: 3,
            fontSize: 10,
            cursor: 'pointer',
            fontFamily: 'monospace',
          }}
        >
          Re-run simulation
        </button>

        {confirmingDelete ? (
          <>
            <button
              onClick={handleDelete}
              style={{
                flex: 1,
                background: 'rgba(127,29,29,0.4)',
                border: '1px solid #7F1D1D',
                color: '#FCA5A5',
                padding: '4px 8px',
                borderRadius: 3,
                fontSize: 10,
                cursor: 'pointer',
                fontFamily: 'monospace',
                fontWeight: 'bold',
              }}
              title={`Delete "${route.name}"`}
            >
              Confirm delete
            </button>
            <button
              onClick={() => setConfirmingDelete(false)}
              style={{
                flex: 1,
                background: 'transparent',
                border: '1px solid #334155',
                color: '#94A3B8',
                padding: '4px 8px',
                borderRadius: 3,
                fontSize: 10,
                cursor: 'pointer',
                fontFamily: 'monospace',
              }}
              title="Cancel"
            >
              Cancel
            </button>
          </>
        ) : (
          <button
            onClick={() => setConfirmingDelete(true)}
            style={{
              flex: 1,
              background: 'transparent',
              border: '1px solid #7F1D1D',
              color: '#EF4444',
              padding: '4px 8px',
              borderRadius: 3,
              fontSize: 10,
              cursor: 'pointer',
              fontFamily: 'monospace',
            }}
          >
            Delete route
          </button>
        )}
      </div>
    </div>
  );
};

export default RouteInspectorPanel;