// src/modules/EmergencyLighting/Dialogs/ResetSimulationDialog.tsx
//
// Confirmation dialog for clearing simulation state: compliance issues,
// evacuation routes, heatmap data. Keeps the floorplan model loaded —
// this is "reset simulation", not "reset module". For the latter, use
// the resetEmergency action from emergencySlice, which returns the
// whole slice to initialState.
//
// Composed from three existing actions in emergencySlice.ts:
//   clearSimulation()  — issues → [], status → 'idle'
//   clearHeatmap()     — heatmap data → null, status → 'idle'
//   clearRoutes()      — routes → [], selectedRouteId → null
//
// Follows the same conventions as AddExitRouteDialog.

import React from 'react';
import { useAppDispatch, useAppSelector } from '@/Application/ConfigureStore';
import {
  clearSimulation,
  clearHeatmap,
  clearRoutes,
} from '@/modules/EmergencyLighting/store/emergencySlice';

interface ResetSimulationDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ResetSimulationDialog: React.FC<ResetSimulationDialogProps> = ({
  isOpen,
  onClose,
}) => {
  const dispatch = useAppDispatch();

  const issueCount = useAppSelector(
    (s: any) => s.emergency.simulation.issues?.length ?? 0
  );
  const routeCount = useAppSelector(
    (s: any) => s.emergency.routes?.length ?? 0
  );
  const hasHeatmap = useAppSelector(
    (s: any) => !!s.emergency.heatmap.data
  );
  const simStatus = useAppSelector(
    (s: any) => s.emergency.simulation.status as string
  );

  if (!isOpen) return null;

  const hasAnything = issueCount > 0 || routeCount > 0 || hasHeatmap;
  const isRunning = simStatus === 'running';

  const onConfirm = () => {
    dispatch(clearSimulation());
    dispatch(clearHeatmap());
    dispatch(clearRoutes());
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#0F1424',
          border: '1px solid #1E293B',
          borderRadius: 8,
          padding: 24,
          width: 400,
          fontFamily: 'monospace',
          color: '#E2E8F0',
          boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ color: '#EF4444', fontSize: 14, margin: '0 0 12px' }}>
          ⚠ Reset Simulation
        </h2>

        <p style={{ fontSize: 11, color: '#94A3B8', marginBottom: 12, lineHeight: 1.5 }}>
          This will clear all simulation results for the current project.
          The floorplan model stays loaded. This action cannot be undone.
        </p>

        <ul
          style={{
            fontSize: 11,
            color: '#94A3B8',
            margin: '0 0 16px',
            paddingLeft: 20,
            lineHeight: 1.7,
          }}
        >
          <li>
            {issueCount} compliance issue{issueCount === 1 ? '' : 's'}
          </li>
          <li>
            {routeCount} evacuation route{routeCount === 1 ? '' : 's'}
          </li>
          <li>Heatmap data {hasHeatmap ? '(present)' : '(none)'}</li>
        </ul>

        {isRunning && (
          <p style={{ fontSize: 11, color: '#F59E0B', marginBottom: 12 }}>
            ⚠ A simulation is currently running. Resetting will not cancel it —
            wait for completion first.
          </p>
        )}

        {!hasAnything && !isRunning && (
          <p style={{ fontSize: 11, color: '#F59E0B', marginBottom: 12 }}>
            Nothing to reset — the simulation is already empty.
          </p>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: '1px solid #334155',
              color: '#94A3B8',
              padding: '6px 12px',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: 11,
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={!hasAnything || isRunning}
            style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid #EF4444',
              color: '#EF4444',
              padding: '6px 12px',
              borderRadius: 4,
              cursor:
                hasAnything && !isRunning ? 'pointer' : 'not-allowed',
              fontSize: 11,
              fontWeight: 'bold',
              opacity: hasAnything && !isRunning ? 1 : 0.5,
            }}
          >
            Reset Simulation
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResetSimulationDialog;