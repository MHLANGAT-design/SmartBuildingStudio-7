// src/modules/EmergencyLighting/Sidebar/RoutesListPanel.tsx

import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/Application/ConfigureStore';
import {
  setSelectedRouteId,
  clearSelectedRouteId,
  removeEvacuationRouteAction,
  renameEvacuationRouteAction,
} from '@/modules/EmergencyLighting/store/emergencySlice';
import { runEmergencySimulation } from '@/modules/EmergencyLighting/store/emergencyThunks';

export const RoutesListPanel: React.FC = () => {
  const dispatch = useAppDispatch();
  const routes = useAppSelector((s: any) => s.emergency.routes || []);
  const selectedRouteId = useAppSelector((s: any) => s.emergency.ui.selectedRouteId);
  const issues = useAppSelector((s: any) => s.emergency.simulation.issues || []);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

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
    dispatch(removeEvacuationRouteAction(id));
    dispatch(runEmergencySimulation() as any);
  };

  if (routes.length === 0) {
    return (
      <div style={{ padding: 12, fontFamily: 'monospace', fontSize: 11, color: '#64748B' }}>
        No routes drawn yet.
        <div style={{ marginTop: 8, color: '#94A3B8', lineHeight: 1.5 }}>
          Switch to the <b style={{ color: '#38BDF8' }}>Compliance</b> tab and
          click <b style={{ color: '#10B981' }}>+ Add Route</b> to draw one.
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 12, fontFamily: 'monospace', fontSize: 11, color: '#E2E8F0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ color: '#94A3B8', textTransform: 'uppercase', fontSize: 10 }}>
          Routes ({routes.length})
        </span>
        {selectedRouteId && (
          <button
            onClick={() => dispatch(clearSelectedRouteId())}
            style={{
              background: 'transparent', border: '1px solid #334155', color: '#64748B',
              padding: '2px 8px', borderRadius: 3, fontSize: 9, cursor: 'pointer',
            }}
          >
            Clear selection
          </button>
        )}
      </div>

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
          const compliant = route.isCompliant && errorCount === 0;
          const hasIssues = routeIssues.length > 0;

          return (
            <div
              key={route.id}
              style={{
                borderRadius: 3,
                background: isSelected ? 'rgba(56,189,248,0.15)' : 'rgba(30,41,59,0.5)',
                border: `1px solid ${isSelected ? '#38BDF8' : 'transparent'}`,
                borderLeft: `3px solid ${compliant ? '#10B981' : errorCount > 0 ? '#EF4444' : '#F59E0B'}`,
              }}
            >
              {/* Main row */}
              <div
                onClick={() => {
                  if (!isEditing) dispatch(setSelectedRouteId(isSelected ? null : route.id));
                }}
                style={{
                  padding: 6,
                  cursor: isEditing ? 'default' : 'pointer',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8,
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
                        width: '100%', background: '#090D16', border: '1px solid #38BDF8',
                        color: '#E2E8F0', padding: '2px 4px', fontSize: 11,
                        fontFamily: 'monospace', borderRadius: 2,
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
                        {errorCount > 0 && (
                          <span style={{ color: '#EF4444' }}> · {errorCount} error{errorCount !== 1 ? 's' : ''}</span>
                        )}
                        {warningCount > 0 && (
                          <span style={{ color: '#F59E0B' }}> · {warningCount} warning{warningCount !== 1 ? 's' : ''}</span>
                        )}
                        {errorCount === 0 && warningCount === 0 && compliant && (
                          <span style={{ color: '#10B981' }}> · ✓ compliant</span>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {/* Expand toggle */}
                {hasIssues && !isEditing && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedId(isExpanded ? null : route.id);
                    }}
                    title={isExpanded ? 'Hide issues' : 'Show issues'}
                    style={{
                      background: 'transparent', border: '1px solid #334155', color: '#94A3B8',
                      padding: '2px 6px', borderRadius: 3, fontSize: 10,
                      cursor: 'pointer', fontFamily: 'monospace',
                    }}
                  >
                    {isExpanded ? '▾' : '▸'} {routeIssues.length}
                  </button>
                )}

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(route.id);
                  }}
                  title="Delete route"
                  style={{
                    background: 'transparent', border: '1px solid #334155', color: '#94A3B8',
                    padding: '2px 6px', borderRadius: 3, fontSize: 10,
                    cursor: 'pointer', fontFamily: 'monospace',
                  }}
                >
                  ✕
                </button>
              </div>

              {/* Expanded issue list */}
              {isExpanded && hasIssues && (
                <div
                  style={{
                    padding: '4px 6px 6px 6px',
                    borderTop: '1px solid #1E293B',
                    display: 'flex', flexDirection: 'column', gap: 3,
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
                          issue.severity === 'error' ? '#EF4444'
                          : issue.severity === 'warning' ? '#F59E0B'
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
    </div>
  );
};

export default RoutesListPanel;