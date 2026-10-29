// src/modules/EmergencyLighting/Inspector/ComplianceInspector.tsx

import React from 'react';
import { useAppDispatch, useAppSelector } from '@/Application/ConfigureStore';
import {
  selectIssuesByRule,
  selectIssueCounts,
  selectSimStatus,
  selectSelectedRouteId,
} from '@/modules/EmergencyLighting/store/emergencySelectors';
import { setSelectedRouteId } from '@/modules/EmergencyLighting/store/emergencySlice';
import { runEmergencySimulation } from '@/modules/EmergencyLighting/store/emergencyThunks';
import type { ComplianceIssue } from '@/modules/EmergencyLighting/store/emergencyTypes';

// Rule IDs currently produced by ComplianceEngine. This map exists so the
// inspector can show a human-readable title. When a ComplianceRule catalog
// is added, this becomes `COMPLIANCE_RULES[ruleId]?.title ?? ruleId`.
const RULE_LABELS: Record<string, { label: string; standard: string }> = {
  'EN1838-4.1':    { label: 'Emergency lighting in every room', standard: 'EN 1838' },
  'BS5266-8':      { label: 'Escape route distance and clearance', standard: 'BS 5266-8' },
  'BS5266-6.3.2':  { label: 'Minimum egress illuminance', standard: 'BS 5266-6.3.2' },
  'EN12464-1':     { label: 'Task illuminance', standard: 'EN 12464-1' },
};

const severityColor = (s: ComplianceIssue['severity']) =>
  s === 'error' ? '#EF4444' : s === 'warning' ? '#F59E0B' : '#38BDF8';

function routeIdFromIssue(issue: ComplianceIssue): string | null {
  const m = issue.id.match(/^issue-route(?:-segment-wall|-len|-block)?-(route-[A-Za-z0-9_]+)/);
  return m ? m[1] : null;
}

export const ComplianceInspector: React.FC = () => {
  const dispatch = useAppDispatch();
  const simStatus = useAppSelector(selectSimStatus);
  const grouped = useAppSelector(selectIssuesByRule);
  const counts = useAppSelector(selectIssueCounts);
  const selectedRouteId = useAppSelector(selectSelectedRouteId);

  const total = counts.error + counts.warning + counts.info;

  if (simStatus === 'idle') {
    return (
      <div style={{ padding: 12, fontFamily: 'monospace', fontSize: 11, color: '#64748B' }}>
        Compliance has not been evaluated yet.
        <div style={{ marginTop: 8 }}>
          <button
            onClick={() => dispatch(runEmergencySimulation() as any)}
            style={{
              background: 'transparent',
              border: '1px solid #38BDF8',
              color: '#38BDF8',
              padding: '3px 10px',
              borderRadius: 3,
              fontSize: 10,
              cursor: 'pointer',
              fontFamily: 'monospace',
            }}
          >
            Run simulation
          </button>
        </div>
      </div>
    );
  }

  if (total === 0) {
    return (
      <div style={{ padding: 12, fontFamily: 'monospace', fontSize: 11, color: '#10B981' }}>
        No compliance issues.
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#E2E8F0' }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8, fontSize: 10 }}>
        {counts.error > 0 && (
          <span style={{ color: '#EF4444' }}>
            {counts.error} error{counts.error !== 1 ? 's' : ''}
          </span>
        )}
        {counts.warning > 0 && (
          <span style={{ color: '#F59E0B' }}>
            {counts.warning} warning{counts.warning !== 1 ? 's' : ''}
          </span>
        )}
        {counts.info > 0 && (
          <span style={{ color: '#38BDF8' }}>{counts.info} info</span>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {Object.entries(grouped).map(([ruleId, issues]) => {
          const meta = RULE_LABELS[ruleId];
          return (
            <div key={ruleId}>
              <div
                style={{
                  fontSize: 9,
                  color: '#94A3B8',
                  textTransform: 'uppercase',
                  marginBottom: 4,
                }}
              >
                {meta ? `${meta.standard} — ${meta.label}` : ruleId}
                <span style={{ color: '#64748B', marginLeft: 6 }}>({issues.length})</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {issues.map((issue) => {
                  const routeId = routeIdFromIssue(issue);
                  const isSelected = routeId && routeId === selectedRouteId;
                  return (
                    <div
                      key={issue.id}
                      onClick={() => {
                        if (routeId) {
                          dispatch(setSelectedRouteId(isSelected ? null : routeId));
                        }
                      }}
                      style={{
                        padding: 6,
                        borderRadius: 3,
                        background: isSelected
                          ? 'rgba(56,189,248,0.15)'
                          : 'rgba(15,20,36,0.6)',
                        border: `1px solid ${isSelected ? '#38BDF8' : 'transparent'}`,
                        borderLeft: `3px solid ${severityColor(issue.severity)}`,
                        cursor: routeId ? 'pointer' : 'default',
                      }}
                      title={routeId ? 'Click to select the referenced route' : undefined}
                    >
                      <div style={{ fontSize: 10, color: '#E2E8F0', lineHeight: 1.4 }}>
                        {issue.message}
                      </div>
                      <div style={{ fontSize: 8, color: '#64748B', marginTop: 2 }}>
                        ({Math.round(issue.location.x)}, {Math.round(issue.location.y)})
                        {routeId && (
                          <span style={{ color: '#38BDF8', marginLeft: 6 }}>
                            → {routeId}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ComplianceInspector;