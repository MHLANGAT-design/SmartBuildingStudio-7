// src/modules/EmergencyLighting/EmergencyLightingPage.tsx

import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/Application/ConfigureStore';
import { EmergencySidebar } from '@/modules/EmergencyLighting/Sidebar/EmergencySidebar';
import { EmergencyInspector } from '@/modules/EmergencyLighting/Inspector/EmergencyInspector';
import { EmergencyCanvas } from '@/modules/EmergencyLighting/Canvas/EmergencyCanvas';
import { loadEmergencyFloorplan } from '@/modules/EmergencyLighting/store/emergencyThunks';

export const EmergencyLightingPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const floorplanStatus = useAppSelector((s: any) => s.emergency.floorplan.status);
  const floorplanError = useAppSelector((s: any) => s.emergency.floorplan.error);
  const floorplanModel = useAppSelector((s: any) => s.emergency.floorplan.model);

  const floorplanId = new URLSearchParams(window.location.search).get('documentId') || '';

  useEffect(() => {
    if (!floorplanId) return;
    if (floorplanModel?.documentId === floorplanId) return;
    dispatch(loadEmergencyFloorplan(floorplanId));
  }, [dispatch, floorplanId, floorplanModel]);

  if (!floorplanId) {
    return <div style={{ padding: 20, color: '#EF4444', height: '100%', background: '#090D16' }}>Missing documentId</div>;
  }

  if (floorplanStatus === 'error') {
    return <div style={{ padding: 20, color: '#EF4444', height: '100%', background: '#090D16' }}>Error: {floorplanError}</div>;
  }

  if (floorplanStatus === 'loading' || floorplanStatus === 'idle') {
    return <div style={{ padding: 20, color: '#05FFC4', height: '100%', background: '#090D16' }}>Loading Emergency Module...</div>;
  }

  return (
    <div 
      style={{ 
        display: 'flex', 
        flexDirection: 'column',
        width: '100%',
        height: '100%', 
        overflow: 'hidden',
        background: '#090D16' 
      }}
    >
      <div 
        style={{ 
          display: 'flex', 
          flex: 1, 
          minHeight: 0,
          overflow: 'hidden' 
        }}
      >
        <EmergencySidebar />
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, position: 'relative' }}>
          <EmergencyCanvas />
        </div>
        <EmergencyInspector />
      </div>
    </div>
  );
};

export default EmergencyLightingPage;