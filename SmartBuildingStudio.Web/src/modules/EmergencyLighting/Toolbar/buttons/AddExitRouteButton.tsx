// src/modules/EmergencyLighting/Toolbar/buttons/AddExitRouteButton.tsx

import React, { useState } from 'react';
import { useEvacuationRoutes } from '@/modules/EmergencyLighting/hooks/useEvacuationRoutes';
import { AddExitRouteDialog } from '@/modules/EmergencyLighting/Dialogs/AddExitRouteDialog';

export const AddExitRouteButton: React.FC = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const routeTool = useEvacuationRoutes();

  const handleBegin = () => {
    console.log('🔵 [Button] handleBegin fired — calling beginRoute');
    routeTool.beginRoute();
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          console.log('🔵 [Button] + Add Route clicked — opening dialog');
          setDialogOpen(true);
        }}
        style={{
          background: 'rgba(16,185,129,0.1)',
          border: '1px solid #10B981',
          color: '#10B981',
          padding: '4px 10px',
          borderRadius: 4,
          fontFamily: 'monospace',
          fontSize: 11,
          fontWeight: 'bold',
          cursor: 'pointer',
        }}
        title="Draw a new evacuation route"
      >
        + Add Route
      </button>
      <AddExitRouteDialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onBeginDraw={handleBegin}
      />
    </>
  );
};

export default AddExitRouteButton;