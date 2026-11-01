// src/modules/EmergencyLighting/Toolbar/buttons/ResetSimulationButton.tsx
//
// Toolbar button that opens the ResetSimulationDialog via local state.
// Self-contained — no Redux flag, no slice changes. The dialog itself
// dispatches the three clear actions (clearSimulation, clearHeatmap,
// clearRoutes) on confirm.
//
// Follows the same toolbar conventions as SimulationGroup.tsx:
//   • no props, inline styles, monospace 11px bold, radius 4
//   • disabled reflects whether anything exists to reset
//   • title attribute explains the disabled state
//
// Red accent (#EF4444) to signal the destructive nature, distinct from
// the primary green used for Run Simulation.

import React, { useState } from 'react';
import { useAppSelector } from '@/Application/ConfigureStore';
import { ResetSimulationDialog } from '@/modules/EmergencyLighting/Dialogs/ResetSimulationDialog';

export const ResetSimulationButton: React.FC = () => {
  const [open, setOpen] = useState(false);

  const issueCount = useAppSelector(
    (s: any) => s.emergency.simulation.issues?.length ?? 0
  );
  const routeCount = useAppSelector(
    (s: any) => s.emergency.routes?.length ?? 0
  );
  const hasHeatmap = useAppSelector((s: any) => !!s.emergency.heatmap.data);
  const simStatus = useAppSelector(
    (s: any) => s.emergency.simulation.status as string
  );
  const hasModel = useAppSelector(
    (s: any) => !!s.emergency.floorplan.model
  );

  const isRunning = simStatus === 'running';
  const hasAnything = issueCount > 0 || routeCount > 0 || hasHeatmap;
  const isDisabled = !hasModel || isRunning || !hasAnything;

  const title = !hasModel
    ? 'Floorplan not loaded'
    : isRunning
    ? 'Simulation is running — wait for completion'
    : !hasAnything
    ? 'Nothing to reset'
    : `Clear ${issueCount} issue${issueCount === 1 ? '' : 's'}, ${routeCount} route${routeCount === 1 ? '' : 's'}${hasHeatmap ? ', heatmap' : ''}`;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={isDisabled}
        title={title}
        style={{
          background: 'rgba(239, 68, 68, 0.08)',
          border: '1px solid #EF4444',
          color: '#EF4444',
          padding: '4px 10px',
          borderRadius: 4,
          fontFamily: 'monospace',
          fontSize: 11,
          fontWeight: 'bold',
          cursor: isDisabled ? 'not-allowed' : 'pointer',
          opacity: isDisabled ? 0.4 : 1,
        }}
      >
        ⟲ Reset
      </button>

      <ResetSimulationDialog isOpen={open} onClose={() => setOpen(false)} />
    </>
  );
};

export default ResetSimulationButton;