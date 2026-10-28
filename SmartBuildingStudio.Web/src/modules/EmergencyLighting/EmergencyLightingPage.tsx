// EmergencyLightingPage.tsx

import React, { useEffect, useLayoutEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/Application/ConfigureStore';
import { EmergencySidebar } from '@/modules/EmergencyLighting/Sidebar/EmergencySidebar';
import { EmergencyInspector } from '@/modules/EmergencyLighting/Inspector/EmergencyInspector';
import { EmergencyCanvas } from '@/modules/EmergencyLighting/Canvas/EmergencyCanvas';
import { EmergencyToolbar } from '@/modules/EmergencyLighting/Toolbar/EmergencyToolbar';
import { loadEmergencyFloorplan } from '@/modules/EmergencyLighting/store/emergencyThunks';
import { resetEmergency } from '@/modules/EmergencyLighting/store/emergencySlice';
import { selectDocumentFresh } from '@/modules/Shared/DocumentVersion/selectDocumentFresh';

export const EmergencyLightingPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const floorplanStatus = useAppSelector((s: any) => s.emergency.floorplan.status);
  const floorplanError = useAppSelector((s: any) => s.emergency.floorplan.error);
  const loadedDocId = useAppSelector((s: any) => s.emergency.floorplan.model?.documentId);

  const floorplanId = new URLSearchParams(window.location.search).get('documentId') || '';

  const sliceMatchesUrl = !!loadedDocId && !!floorplanId && loadedDocId === floorplanId;

  // Ask the version counter: has anything saved since this doc was loaded?
  const isFresh = useAppSelector(selectDocumentFresh(floorplanId));

  // Reset stale state before loading a different document
  useLayoutEffect(() => {
    if (!floorplanId) return;
    if (sliceMatchesUrl) return;
    dispatch(resetEmergency());
  }, [dispatch, floorplanId, sliceMatchesUrl]);

  // Load when either:
  //   - the loaded document is different from the URL's document (transition), OR
  //   - the same document is loaded but the version has advanced (another module saved)
  useEffect(() => {
    if (!floorplanId) return;
    if (sliceMatchesUrl && isFresh) return;
    dispatch(loadEmergencyFloorplan(floorplanId));
  }, [dispatch, floorplanId, sliceMatchesUrl, isFresh]);

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
        background: '#090D16',
      }}
    >
      <EmergencyToolbar />

      <div
        style={{
          display: 'flex',
          flex: 1,
          minHeight: 0,
          overflow: 'hidden',
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