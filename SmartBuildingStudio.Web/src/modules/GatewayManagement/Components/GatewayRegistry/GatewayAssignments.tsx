// src/modules/GatewayManagement/Components/GatewayRegistry/GatewayAssignments.tsx

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/Application/ConfigureStore';
import {
  selectAsyncFlags,
  selectErrors,
  selectSelectedGatewayId,
} from '@/modules/GatewayManagement/Store/gatewayManagementSelectors';
import {
  fetchGatewayAssignments,
  assignGatewayToProject,
  unassignGatewayFromProject,
} from '@/modules/GatewayManagement/Store/gatewayManagementThunks';
import type { GatewayAssignmentDto } from '@/modules/GatewayManagement/Types';
import type { RootState } from '@/Application/ConfigureStore';

interface Props {
  gatewayId?: string | null;
}

const selectAssignmentsByGatewayId = (s: RootState) =>
  s.gatewayManagement.assignmentsByGatewayId;

export const GatewayAssignments: React.FC<Props> = ({ gatewayId }) => {
  const dispatch = useAppDispatch();
  const routeParams = useParams<{ projectId?: string }>();
  const [searchParams] = useSearchParams();

  const currentProjectId =
    routeParams.projectId ?? searchParams.get('projectId') ?? null;
  const currentFloorId = searchParams.get('floorId') ?? null;
  const currentDocumentId = searchParams.get('documentId') ?? null;

  const selectedGatewayId = useAppSelector(selectSelectedGatewayId);
  const targetId = gatewayId ?? selectedGatewayId;

  const assignmentsByGatewayId = useAppSelector(selectAssignmentsByGatewayId);
  const assignments = useMemo<GatewayAssignmentDto[]>(
    () => (targetId ? assignmentsByGatewayId[targetId] ?? [] : []),
    [assignmentsByGatewayId, targetId]
  );

  const asyncFlags = useAppSelector(selectAsyncFlags);
  const errors = useAppSelector(selectErrors);

  const [assignError, setAssignError] = useState<string | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);
  const [unassigningId, setUnassigningId] = useState<string | null>(null);

  useEffect(() => {
    if (targetId) {
      void dispatch(fetchGatewayAssignments({ gatewayId: targetId })).catch(() => {});
    }
  }, [dispatch, targetId]);

  const alreadyAssignedToCurrentProject = useMemo(
    () =>
      !!currentProjectId &&
      assignments.some(a => a.projectId === currentProjectId),
    [assignments, currentProjectId]
  );

  const handleAssign = useCallback(async () => {
    if (!targetId || !currentProjectId) return;
    setAssignError(null);
    setIsAssigning(true);
    try {
      await dispatch(
        assignGatewayToProject({
          gatewayId: targetId,
          request: {
            projectId: currentProjectId,
            floorId: currentFloorId,
            daliNetworkId: null,
          },
        })
      ).unwrap();
    } catch (err) {
      setAssignError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsAssigning(false);
    }
  }, [dispatch, targetId, currentProjectId, currentFloorId]);

  const handleUnassign = useCallback(
    async (assignmentId: string) => {
      if (!targetId) return;
      setUnassigningId(assignmentId);
      try {
        await dispatch(
          unassignGatewayFromProject({ gatewayId: targetId, assignmentId })
        ).unwrap();
      } catch {
        /* error slot populated */
      } finally {
        setUnassigningId(null);
      }
    },
    [dispatch, targetId]
  );

  if (!targetId) {
    return (
      <div style={{ padding: 16, fontSize: 11, color: '#64748B', textAlign: 'center' }}>
        Select a gateway to see its assignments.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
      }}>
        <div style={{
          fontSize: 11,
          fontWeight: 'bold',
          color: '#38BDF8',
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        }}>
          Assignments ({assignments.length})
        </div>
        {currentProjectId && !alreadyAssignedToCurrentProject && (
          <button
            onClick={() => { void handleAssign(); }}
            disabled={isAssigning}
            style={{
              padding: '4px 10px',
              background: isAssigning ? '#1F2937' : '#1D4ED8',
              color: isAssigning ? '#64748B' : '#FFF',
              border: 'none',
              borderRadius: 4,
              fontSize: 11,
              fontWeight: 'bold',
              cursor: isAssigning ? 'not-allowed' : 'pointer',
            }}
          >
            {isAssigning ? 'Assigning…' : 'Assign to current project'}
          </button>
        )}
      </div>

      {(assignError || errors.assignments) && (
        <div style={{
          padding: 8,
          background: '#3F1D1D',
          border: '1px solid #F87171',
          borderRadius: 4,
          color: '#F87171',
          fontSize: 11,
        }}>
          {assignError ?? errors.assignments}
        </div>
      )}

      {asyncFlags.fetchAssignments ? (
        <div style={{ fontSize: 11, color: '#64748B' }}>Loading assignments…</div>
      ) : assignments.length === 0 ? (
        <div style={{ fontSize: 11, color: '#64748B' }}>
          This gateway is not assigned to any project yet.
          {currentProjectId && ' Use the button above to assign it to the current project.'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {assignments.map(a => (
            <AssignmentRow
              key={a.id}
              assignment={a}
              isCurrentProject={!!currentProjectId && a.projectId === currentProjectId}
              isUnassigning={unassigningId === a.id}
              onUnassign={handleUnassign}
              documentId={currentDocumentId}
            />
          ))}
        </div>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Assignment row with feeder links                                    */
/* ------------------------------------------------------------------ */

const AssignmentRow: React.FC<{
  assignment: GatewayAssignmentDto;
  isCurrentProject: boolean;
  isUnassigning: boolean;
  onUnassign: (assignmentId: string) => void;
  documentId: string | null;
}> = ({ assignment, isCurrentProject, isUnassigning, onUnassign, documentId }) => {
  // Build query params once.
  const buildParams = (extra?: Record<string, string>): string => {
    const params = new URLSearchParams();
    if (assignment.floorId) params.set('floorId', assignment.floorId);
    if (documentId) params.set('documentId', documentId);
    if (extra) {
      for (const [k, v] of Object.entries(extra)) params.set(k, v);
    }
    return params.toString();
  };

  const discoveryHref =
    documentId && assignment.floorId != null
      ? `/projects/${assignment.projectId}/floorplans/${documentId}/discovery?${buildParams()}`
      : documentId
      ? `/projects/${assignment.projectId}/floorplans/${documentId}/discovery`
      : null;

  const commissioningHref = documentId
    ? `/projects/${assignment.projectId}/floorplans/${documentId}/commissioning${
        buildParams() ? `?${buildParams()}` : ''
      }`
    : null;

  const programmingHref = documentId
    ? `/projects/${assignment.projectId}/floorplans/${documentId}/programming${
        buildParams() ? `?${buildParams()}` : ''
      }`
    : null;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
      padding: '8px 10px',
      background: isCurrentProject ? '#0EA5E915' : '#0F1424',
      border: '1px solid',
      borderColor: isCurrentProject ? '#38BDF8' : '#1F2937',
      borderRadius: 4,
      fontSize: 11,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0 }}>
          <span style={{
            color: '#E5E7EB',
            fontFamily: 'monospace',
            fontSize: 11,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }} title={assignment.projectId}>
            Project: {assignment.projectId}
          </span>
          {isCurrentProject && (
            <span style={{ fontSize: 9, color: '#38BDF8', fontWeight: 'bold' }}>
              CURRENT PROJECT
            </span>
          )}
        </div>
        <button
          onClick={() => onUnassign(assignment.id)}
          disabled={isUnassigning}
          style={{
            padding: '2px 6px',
            background: 'transparent',
            border: '1px solid #F8717166',
            borderRadius: 3,
            color: isUnassigning ? '#64748B' : '#F87171',
            fontSize: 10,
            cursor: isUnassigning ? 'not-allowed' : 'pointer',
            flexShrink: 0,
          }}
          title="Remove assignment"
        >
          {isUnassigning ? '…' : 'Remove'}
        </button>
      </div>

      {assignment.floorId && (
        <div style={{ fontSize: 10, color: '#64748B', fontFamily: 'monospace' }}>
          Floor: {assignment.floorId.slice(0, 8)}…
        </div>
      )}

      {/* ── Feeder module links ─────────────────────────────────── */}
      {(discoveryHref || commissioningHref || programmingHref) && (
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 6,
          marginTop: 4,
          paddingTop: 6,
          borderTop: '1px solid #1F2937',
        }}>
          <span style={{ fontSize: 9, color: '#64748B', textTransform: 'uppercase', marginRight: 4, alignSelf: 'center' }}>
            Use in:
          </span>
          {discoveryHref && (
            <Link
              to={discoveryHref}
              style={{
                padding: '2px 8px',
                background: '#0EA5E922',
                border: '1px solid #0EA5E966',
                borderRadius: 10,
                color: '#0EA5E9',
                fontSize: 10,
                fontWeight: 'bold',
                textDecoration: 'none',
              }}
            >
              Device Discovery
            </Link>
          )}
          {commissioningHref && (
            <Link
              to={commissioningHref}
              style={{
                padding: '2px 8px',
                background: '#14B8A622',
                border: '1px solid #14B8A666',
                borderRadius: 10,
                color: '#14B8A6',
                fontSize: 10,
                fontWeight: 'bold',
                textDecoration: 'none',
              }}
            >
              Commissioning
            </Link>
          )}
          {programmingHref && (
            <Link
              to={programmingHref}
              style={{
                padding: '2px 8px',
                background: '#22C55E22',
                border: '1px solid #22C55E66',
                borderRadius: 10,
                color: '#22C55E',
                fontSize: 10,
                fontWeight: 'bold',
                textDecoration: 'none',
              }}
            >
              DALI Programming
            </Link>
          )}
        </div>
      )}

      {!documentId && (
        <div style={{ fontSize: 9, color: '#475569', marginTop: 2 }}>
          Open this gateway from a document in Project Explorer to enable feeder links.
        </div>
      )}

      <div style={{ fontSize: 9, color: '#475569' }}>
        Assigned {new Date(assignment.assignedAt).toLocaleString()}
      </div>
    </div>
  );
};

export default GatewayAssignments;