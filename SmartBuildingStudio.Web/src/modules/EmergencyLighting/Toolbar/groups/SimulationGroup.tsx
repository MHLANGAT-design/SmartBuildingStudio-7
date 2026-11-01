// src/modules/EmergencyLighting/Toolbar/groups/SimulationGroup.tsx
import React from 'react';
import { useAppDispatch, useAppSelector } from '@/Application/ConfigureStore';
import { setSimulationDialogOpen } from '@/modules/EmergencyLighting/store/emergencySlice';
import { ResetSimulationButton } from '@/modules/EmergencyLighting/Toolbar/buttons/ResetSimulationButton';

export const SimulationGroup: React.FC = () => {
  const dispatch = useAppDispatch();
  const simStatus = useAppSelector((s: any) => s.emergency.simulation.status);
  const hasModel = useAppSelector((s: any) => !!s.emergency.floorplan.model);

  const isRunning = simStatus === 'running';
  const isDisabled = isRunning || !hasModel;

  return (
    <>
      <button
        type="button"
        onClick={() => dispatch(setSimulationDialogOpen(true))}
        disabled={isDisabled}
        style={{
          background: isRunning ? 'rgba(56,189,248,0.1)' : 'rgba(5,255,196,0.1)',
          border: `1px solid ${isRunning ? '#38BDF8' : '#05FFC4'}`,
          color: isRunning ? '#38BDF8' : '#05FFC4',
          padding: '4px 10px',
          borderRadius: 4,
          fontFamily: 'monospace',
          fontSize: 11,
          fontWeight: 'bold',
          cursor: isDisabled ? 'not-allowed' : 'pointer',
          opacity: isDisabled ? 0.5 : 1,
        }}
        title={!hasModel ? 'Floorplan not loaded' : 'Run emergency lighting simulation'}
      >
        {isRunning ? '⏳ Running…' : '▶ Run Simulation'}
      </button>

      <ResetSimulationButton />
    </>
  );
};

export default SimulationGroup;