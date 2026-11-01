// src/modules/EmergencyLighting/Dialogs/RunSimulationDialog.tsx
//
// Confirmation dialog for running the emergency-lighting simulation.
// Shows what will be computed (fixture count, room count, route count)
// so the user knows the scope before the run starts. Confirm dispatches
// runEmergencySimulation.
//
// Controlled by Redux: reads state.emergency.ui.isSimulationDialogOpen
// and dispatches setSimulationDialogOpen(false) to close. The toolbar's
// Run Simulation button dispatches setSimulationDialogOpen(true).
//
// Follows the same conventions as AddExitRouteDialog.

import React from 'react';
import { useAppDispatch, useAppSelector } from '@/Application/ConfigureStore';
import {
  setSimulationDialogOpen,
} from '@/modules/EmergencyLighting/store/emergencySlice';
import { runEmergencySimulation } from '@/modules/EmergencyLighting/store/emergencyThunks';
import {
  selectAllRooms,
  selectEmergencyLightFixtures,
} from '@/modules/EmergencyLighting/store/emergencySelectors';

export const RunSimulationDialog: React.FC = () => {
  const dispatch = useAppDispatch();

  const isOpen = useAppSelector(
    (s: any) => s.emergency.ui.isSimulationDialogOpen
  );
  const hasModel = useAppSelector(
    (s: any) => !!s.emergency.floorplan.model
  );
  const simStatus = useAppSelector(
    (s: any) => s.emergency.simulation.status as string
  );
  const rooms    = useAppSelector(selectAllRooms);
  const fixtures = useAppSelector(selectEmergencyLightFixtures);
  const routeCount = useAppSelector(
    (s: any) => s.emergency.routes?.length ?? 0
  );
  const lastRunAt = useAppSelector(
    (s: any) => s.emergency.simulation.lastRunAt as string | null
  );

  if (!isOpen) return null;

  const isRunning = simStatus === 'running';
  const onClose = () => dispatch(setSimulationDialogOpen(false));
  const onRun = () => {
    dispatch(setSimulationDialogOpen(false));
    dispatch(runEmergencySimulation() as any);
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
          width: 420,
          fontFamily: 'monospace',
          color: '#E2E8F0',
          boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ color: '#05FFC4', fontSize: 14, margin: '0 0 12px' }}>
          ▶ Run Simulation
        </h2>

        <p style={{ fontSize: 11, color: '#94A3B8', marginBottom: 12, lineHeight: 1.5 }}>
          This will compute emergency-lighting compliance for the current
          floorplan. It may take a few seconds on large layouts.
        </p>

        <div
          style={{
            background: 'rgba(5,255,196,0.05)',
            border: '1px solid #334155',
            borderRadius: 4,
            padding: 12,
            marginBottom: 16,
            fontSize: 11,
            color: '#94A3B8',
            lineHeight: 1.6,
          }}
        >
          <div style={{ color: '#E2E8F0', fontWeight: 'bold', marginBottom: 4 }}>
            Scope
          </div>
          <div>{fixtures.length} emergency fixture{fixtures.length === 1 ? '' : 's'}</div>
          <div>{rooms.length} room{rooms.length === 1 ? '' : 's'}</div>
          <div>{routeCount} evacuation route{routeCount === 1 ? '' : 's'}</div>
          {lastRunAt && (
            <div style={{ marginTop: 6, color: '#64748B', fontSize: 10 }}>
              Last run: {new Date(lastRunAt).toLocaleString()}
            </div>
          )}
        </div>

        {!hasModel && (
          <p style={{ fontSize: 11, color: '#F59E0B', marginBottom: 12 }}>
            ⚠ No floorplan loaded — cannot run the simulation.
          </p>
        )}

        {isRunning && (
          <p style={{ fontSize: 11, color: '#38BDF8', marginBottom: 12 }}>
            ⏳ A simulation is already running.
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
            onClick={onRun}
            disabled={!hasModel || isRunning}
            style={{
              background: 'rgba(5,255,196,0.1)',
              border: '1px solid #05FFC4',
              color: '#05FFC4',
              padding: '6px 12px',
              borderRadius: 4,
              cursor: !hasModel || isRunning ? 'not-allowed' : 'pointer',
              fontSize: 11,
              fontWeight: 'bold',
              opacity: !hasModel || isRunning ? 0.5 : 1,
            }}
          >
            Run Simulation
          </button>
        </div>
      </div>
    </div>
  );
};

export default RunSimulationDialog;