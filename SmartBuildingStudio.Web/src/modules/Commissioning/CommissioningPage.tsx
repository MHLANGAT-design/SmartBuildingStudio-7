// src/modules/Commissioning/CommissioningPage.tsx

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useCommissioning } from '@/modules/Commissioning/hooks/useCommissioning';
import { useAppDispatch, useAppSelector } from '@/Application/ConfigureStore';
import { CommissioningCanvas } from '@/modules/Commissioning/Canvas/CommissioningCanvas';
import { CommissioningSidebar } from '@/modules/Commissioning/Sidebar/CommissioningSidebar';
import { CommissioningToolbar } from '@/modules/Commissioning/Toolbar/CommissioningToolbar';
import { CommissioningInspector } from '@/modules/Commissioning/Inspector/CommissioningInspector';
import { runFullCommissioningWorkflow } from '@/modules/Commissioning/store/commissioningThunks';
import { 
  selectActiveSession,
  selectCommissioningFloorplan,
  selectCommissioningFloorplanLoading,
  selectInspectorSelection
} from '@/modules/Commissioning/store/commissioningSelectors';
import { clearCommissioningContext } from '@/modules/Commissioning/store/commissioningSlice';
import { USE_AUTO_FIRE } from '@/modules/Commissioning/services/apiConfig';

import { StartCommissioningDialog } from '@/modules/Commissioning/Dialogs/StartCommissioningDialog';
import { DeviceDiscoveryDialog } from '@/modules/Commissioning/Dialogs/DeviceDiscoveryDialog';
import { AutoAddressingDialog } from '@/modules/Commissioning/Dialogs/AutoAddressingDialog';
import { NetworkTestDialog } from '@/modules/Commissioning/Dialogs/NetworkTestDialog';
import { SceneTestingDialog } from '@/modules/Commissioning/Dialogs/SceneTestingDialog';
import { CommissioningReportDialog } from '@/modules/Commissioning/Dialogs/CommissioningReportDialog';
import { FaultResolutionDialog } from '@/modules/Commissioning/Dialogs/FaultResolutionDialog';

import type { Fault } from '@/modules/Commissioning/models/Fault';

export const CommissioningPage: React.FC = () => {
  const { projectId, floorplanId } = useParams<{ projectId?: string; floorplanId?: string }>();

  const dispatch = useAppDispatch();
  const { session, startSession } = useCommissioning();
  
  const activeSession = useAppSelector(selectActiveSession);
  const floorplan = useAppSelector(selectCommissioningFloorplan);
  const floorplanLoading = useAppSelector(selectCommissioningFloorplanLoading);
  const inspectorSelection = useAppSelector(selectInspectorSelection);

  const startedContextRef = useRef<string | null>(null);
  const firedForSession = useRef<string | null>(null);

  // Dialog State
  const [isStartDialogOpen, setIsStartDialogOpen] = useState(false);
  const [isDiscoverDialogOpen, setIsDiscoverDialogOpen] = useState(false);
  const [isAddressDialogOpen, setIsAddressDialogOpen] = useState(false);
  const [isNetworkTestDialogOpen, setIsNetworkTestDialogOpen] = useState(false);
  const [isSceneTestDialogOpen, setIsSceneTestDialogOpen] = useState(false);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [faultToResolve, setFaultToResolve] = useState<Fault | null>(null);

  useEffect(() => {
    if (!projectId || !floorplanId) return;
    const contextKey = `${projectId}-${floorplanId}`;
    if (startedContextRef.current === contextKey) return;
    if (startedContextRef.current !== null && startedContextRef.current !== contextKey) {
      dispatch(clearCommissioningContext());
    }
    startedContextRef.current = contextKey;
    startSession(projectId, floorplanId).catch(err =>
      console.error('[CommissioningPage] Auto-start failed:', err)
    );
  }, [projectId, floorplanId, startSession, dispatch]);

  useEffect(() => {
    if (!USE_AUTO_FIRE) return;
    if (!activeSession) return;
    if (floorplanLoading || !floorplan) return; 
    if (firedForSession.current === activeSession.sessionId) return;

    const networkEntries = Object.values(activeSession.networkStates ?? {});
    const firstLine = networkEntries[0];
    if (!firstLine) return;

    const sceneIds: string[] = [];
    firedForSession.current = activeSession.sessionId;

    dispatch(runFullCommissioningWorkflow({
      gatewayId: firstLine.gatewayId,
      lineId: firstLine.lineId,
      sceneIds,
    })).unwrap().catch(err => {
      console.error('[CommissioningPage] Auto-fire workflow failed:', err);
    });
  }, [activeSession, floorplan, floorplanLoading, dispatch]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', background: '#0a0a0a', color: '#E5E7EB' }}>
      <CommissioningToolbar
        onOpenDiscoverDialog={() => setIsDiscoverDialogOpen(true)}
        onOpenAddressDialog={() => setIsAddressDialogOpen(true)}
        onOpenNetworkTestDialog={() => setIsNetworkTestDialogOpen(true)}
        onOpenSceneTestDialog={() => setIsSceneTestDialogOpen(true)}
        onOpenReportDialog={() => setIsReportDialogOpen(true)}
      />

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <CommissioningSidebar />

        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          <CommissioningCanvas floorplanId={floorplanId} />

          {!session && !projectId && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(10, 10, 10, 0.8)' }}>
              <div style={{ color: '#64748B', marginBottom: 12, fontFamily: 'monospace' }}>No context provided.</div>
              <button
                onClick={() => setIsStartDialogOpen(true)}
                style={{ padding: '12px 24px', background: '#1D4ED8', color: '#FFF', border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 12px rgba(29, 78, 216, 0.4)' }}
              >
                Initialize Manually
              </button>
            </div>
          )}

          {(!session || floorplanLoading) && projectId && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(10, 10, 10, 0.8)' }}>
              <div style={{ color: '#38BDF8', fontFamily: 'monospace' }}>
                {floorplanLoading ? 'Loading Floorplan Data...' : 'Initializing Commissioning Session...'}
              </div>
            </div>
          )}
        </div>

        <CommissioningInspector selection={inspectorSelection} />
      </div>

      <StartCommissioningDialog
        isOpen={isStartDialogOpen}
        onClose={() => setIsStartDialogOpen(false)}
        projectId={projectId || 'proj-manual'}
        floorId={floorplanId || 'floor-manual'}
      />

      <DeviceDiscoveryDialog isOpen={isDiscoverDialogOpen} onClose={() => setIsDiscoverDialogOpen(false)} />
      <AutoAddressingDialog isOpen={isAddressDialogOpen} onClose={() => setIsAddressDialogOpen(false)} onConfirm={() => { alert('Addressing triggered (Mock)'); setIsAddressDialogOpen(false); }} />
      <NetworkTestDialog isOpen={isNetworkTestDialogOpen} onClose={() => setIsNetworkTestDialogOpen(false)} />
      <SceneTestingDialog isOpen={isSceneTestDialogOpen} onClose={() => setIsSceneTestDialogOpen(false)} />
      <CommissioningReportDialog isOpen={isReportDialogOpen} onClose={() => setIsReportDialogOpen(false)} />

      {faultToResolve && (
        <FaultResolutionDialog isOpen={!!faultToResolve} onClose={() => setFaultToResolve(null)} fault={faultToResolve} />
      )}
    </div>
  );
};

export default CommissioningPage;