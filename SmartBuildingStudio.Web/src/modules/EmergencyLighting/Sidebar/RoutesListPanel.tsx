// src/modules/EmergencyLighting/Sidebar/RoutesListPanel.tsx

import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/Application/ConfigureStore';
import {
  setSelectedRouteId,
  removeEvacuationRouteAction,
  removeRouteElementAction,
  renameEvacuationRouteAction,
} from '@/modules/EmergencyLighting/store/emergencySlice';
import { runEmergencySimulation } from '@/modules/EmergencyLighting/store/emergencyThunks';
import {
  selectSelectedRouteId,
  selectIssues,
  selectSimStatus,
} from '@/modules/EmergencyLighting/store/emergencySelectors';
import { CollapsibleSection } from '@/modules/EmergencyLighting/Sidebar/CollapsibleSection';

type SimStatus = 'idle' | 'running' | 'complete' | 'error';

function deriveRouteBadge(
  simStatus: SimStatus,
  errorCount: number,
  warningCount: number,
): { label: string; color: string } {
  if (simStatus !== 'complete') {
    return { label: 'not evaluated', color: '#64748B' };
  }
  if (errorCount > 0) {
    return {
      label: `${errorCount} error${errorCount !== 1 ? 's' : ''}`,
      color: '#EF4444',
    };
  }
  if (warningCount > 0) {
    return {
      label: `${warningCount} warning${warningCount !== 1 ? 's' : ''}`,
      color: '#F59E0B',
    };
  }
  return { label: '✓ compliant', color: '#10B981' };
}

export const RoutesListPanel: React.FC = () => {
  const dispatch = useAppDispatch();
  const routes = useAppSelector((s: any) => s.emergency.routes || []);
  const selectedRouteId = useAppSelector(selectSelectedRouteId);
  const issues = useAppSelector(selectIssues);
  const simStatus = useAppSelector(selectSimStatus);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);

  const startRename = (id: string, currentName: string) => {
    setEditingId(id);
    setDraftName(currentName);
  };
  const commitRename = () => {
    if (!editingId) return;
    const trimmed = draftName.trim();
    if (trimmed.length > 0) {
      dispatch(renameEvacuationRouteAction({ id: editingId, name: trimmed }));
    }
    setEditingId(null);
    setDraftName('');
  };
  const cancelRename = () => {
    setEditingId(null);
    setDraftName('');
  };

  const handleDelete = (id: string) => {
    // Order matters: remove from routes first so the subsequent simulation
    // doesn't see the deleted route.
    dispatch(removeEvacuationRouteAction(id));
    dispatch(removeRouteElementAction(id));
    dispatch(runEmergencySimulation() as any);
    setConfirmingDeleteId(null);
  };

  return (
    <CollapsibleSection
      sectionKey="routes"
      title="Evacuation routes"
      count={routes.length}
      hint="Drawn on the canvas. Checked against walls, doorways and the 30 m travel limit."
      defaultOpen
    >
      {routes.length === 0 ? (
        <em style={{ opacity: 0.5, fontSize: 11, color: '#64748B' }}>
          No routes drawn yet. Use + Add Route on the canvas.
        </em>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {routes.map((route: any) => {
            const isSelected = route.id === selectedRouteId;
            const routeIssues = issues.filter(
              (i: any) => i.id.includes(`-${route.id}`) || i.id.endsWith(route.id)
            );
            const errorCount = routeIssues.filter((i: any) => i.severity === 'error').length;
            const warningCount = routeIssues.filter((i: any) => i.severity === 'warning').length;
            const isEditing = route.id === editingId;
            const isExpanded = route.id === expandedId;
            const isConfirming = route.id === confirmingDeleteId;
            const hasIssues = routeIssues.length > 0;
            const badge = deriveRouteBadge(simStatus, errorCount, warningCount);

            return (
              <div
                key={route.id}
                style={{
                  borderRadius: 3,
                  background: isSelected ? 'rgba(56,189,248,0.15)' : 'rgba(30,41,59,0.5)',
                  border: `1px solid ${isSelected ? '#38BDF8' : 'transparent'}`,
                  borderLeft: `3px solid ${badge.color}`,
                }}
              >
                <div
                  onClick={() => {
                    if (isEditing) return;
                    if (confirmingDeleteId && confirmingDeleteId !== route.id) {
                      setConfirmingDeleteId(null);
                    }
                    dispatch(setSelectedRouteId(isSelected ? null : route.id));
                  }}
                  style={{
                    padding: 6,
                    cursor: isEditing ? 'default' : 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {isEditing ? (
                      <input
                        autoFocus
                        value={draftName}
                        onChange={(e) => setDraftName(e.target.value)}
                        onBlur={commitRename}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') commitRename();
                          if (e.key === 'Escape') cancelRename();
                        }}
                        style={{
                          width: '100%',
                          background: '#090D16',
                          border: '1px solid #38BDF8',
                          color: '#E2E8F0',
                          padding: '2px 4px',
                          fontSize: 11,
                          fontFamily: 'monospace',
                          borderRadius: 2,
                        }}
                      />
                    ) : (
                      <>
                        <div
                          style={{ fontSize: 11, color: '#E2E8F0', fontWeight: 'bold' }}
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            startRename(route.id, route.name);
                          }}
                          title="Double-click to rename"
                        >
                          {route.name}
                        </div>
                        <div style={{ fontSize: 9, color: '#64748B', marginTop: 2 }}>
                          {route.lengthMeters.toFixed(1)} m
                          <span style={{ color: badge.color }}>
                            {' · '}
                            {badge.label}
                          </span>
                        </div>
                      </>
                    )}
                  </div>

                  {hasIssues && !isEditing && !isConfirming && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedId(isExpanded ? null : route.id);
                      }}
                      title={isExpanded ? 'Hide issues' : 'Show issues'}
                      style={{
                        background: 'transparent',
                        border: '1px solid #334155',
                        color: '#94A3B8',
                        padding: '2px 6px',
                        borderRadius: 3,
                        fontSize: 10,
                        cursor: 'pointer',
                        fontFamily: 'monospace',
                      }}
                    >
                      {isExpanded ? '▾' : '▸'} {routeIssues.length}
                    </button>
                  )}

                  {isConfirming ? (
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                      <span style={{ fontSize: 9, color: '#F59E0B' }}>Delete?</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(route.id);
                        }}
                        title="Confirm delete"
                        style={{
                          background: 'rgba(127,29,29,0.4)',
                          border: '1px solid #7F1D1D',
                          color: '#FCA5A5',
                          padding: '2px 6px',
                          borderRadius: 3,
                          fontSize: 9,
                          cursor: 'pointer',
                          fontFamily: 'monospace',
                          fontWeight: 'bold',
                        }}
                      >
                        Yes
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmingDeleteId(null);
                        }}
                        style={{
                          background: 'transparent',
                          border: '1px solid #334155',
                          color: '#94A3B8',
                          padding: '2px 6px',
                          borderRadius: 3,
                          fontSize: 9,
                          cursor: 'pointer',
                          fontFamily: 'monospace',
                        }}
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmingDeleteId(route.id);
                      }}
                      title="Delete route"
                      style={{
                        background: 'transparent',
                        border: '1px solid #334155',
                        color: '#94A3B8',
                        padding: '2px 6px',
                        borderRadius: 3,
                        fontSize: 10,
                        cursor: 'pointer',
                        fontFamily: 'monospace',
                      }}
                    >
                      ✕
                    </button>
                  )}
                </div>

                {isExpanded && hasIssues && (
                  <div
                    style={{
                      padding: '4px 6px 6px 6px',
                      borderTop: '1px solid #1E293B',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 3,
                    }}
                  >
                    {routeIssues.map((issue: any) => (
                      <div
                        key={issue.id}
                        style={{
                          padding: 4,
                          borderRadius: 2,
                          background: 'rgba(15,20,36,0.6)',
                          borderLeft: `2px solid ${
                            issue.severity === 'error'
                              ? '#EF4444'
                              : issue.severity === 'warning'
                              ? '#F59E0B'
                              : '#38BDF8'
                          }`,
                        }}
                      >
                        <div style={{ fontSize: 8, color: '#64748B' }}>{issue.ruleId}</div>
                        <div style={{ fontSize: 10, color: '#E2E8F0', lineHeight: 1.4 }}>
                          {issue.message}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </CollapsibleSection>
  );
};

export default RoutesListPanel;