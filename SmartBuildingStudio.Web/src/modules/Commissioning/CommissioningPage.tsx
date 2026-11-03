// src/modules/Commissioning/CommissioningPage.tsx

import React, { useState } from 'react';
import { useCommissioning } from '@/modules/Commissioning/hooks/useCommissioning';
import { CommissioningCanvas } from '@/modules/Commissioning/Canvas/CommissioningCanvas';
import { CommissioningSidebar } from '@/modules/Commissioning/Sidebar/CommissioningSidebar';
import { CommissioningToolbar } from '@/modules/Commissioning/Toolbar/CommissioningToolbar';
import { CommissioningInspector, type InspectorSelection } from '@/modules/Commissioning/Inspector/CommissioningInspector';

// Dialogs
import { StartCommissioningDialog } from '@/modules/Commissioning/Dialogs/StartCommissioningDialog';
import { DeviceDiscoveryDialog } from '@/modules/Commissioning/Dialogs/DeviceDiscoveryDialog';
import { AutoAddressingDialog } from '@/modules/Commissioning/Dialogs/AutoAddressingDialog';
import { NetworkTestDialog } from '@/modules/Commissioning/Dialogs/NetworkTestDialog';
import { SceneTestingDialog } from '@/modules/Commissioning/Dialogs/SceneTestingDialog';
import { CommissioningReportDialog } from '@/modules/Commissioning/Dialogs/CommissioningReportDialog';
import { FaultResolutionDialog } from '@/modules/Commissioning/Dialogs/FaultResolutionDialog';

import type { Fault } from '@/modules/Commissioning/models/Fault';

export const CommissioningPage: React.FC = () => {
  const { session, status } = useCommissioning();
  const [selection, setSelection] = useState<InspectorSelection>(null);

  // Dialog State
  const [isStartDialogOpen, setIsStartDialogOpen] = useState(false);
  const [isDiscoverDialogOpen, setIsDiscoverDialogOpen] = useState(false);
  const [isAddressDialogOpen, setIsAddressDialogOpen] = useState(false);
  const [isNetworkTestDialogOpen, setIsNetworkTestDialogOpen] = useState(false);
  const [isSceneTestDialogOpen, setIsSceneTestDialogOpen] = useState(false);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  
  const [faultToResolve, setFaultToResolve] = useState<Fault | null>(null);

  // For the sake of the scaffold, we mock the project/floor IDs.
  // In a real app, these come from URL params or ProjectExplorer context.
  const MOCK_PROJECT_ID = 'proj-123';
  const MOCK_FLOOR_ID = 'floor-01';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', background: '#0a0a0a', color: '#E5E7EB' }}>
      
      {/* Header / Toolbar */}
      <CommissioningToolbar
        onOpenDiscoverDialog={() => setIsDiscoverDialogOpen(true)}
        onOpenAddressDialog={() => setIsAddressDialogOpen(true)}
        onOpenNetworkTestDialog={() => setIsNetworkTestDialogOpen(true)}
        onOpenSceneTestDialog={() => setIsSceneTestDialogOpen(true)}
        onOpenReportDialog={() => setIsReportDialogOpen(true)}
      />

      {/* Main Content Area */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        
        {/* Left Sidebar */}
        <CommissioningSidebar />

        {/* Center Canvas */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          <CommissioningCanvas />
          
          {/* Overlay for the initial "Start" state */}
          {!session && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(10, 10, 10, 0.8)' }}>
              <button
                onClick={() => setIsStartDialogOpen(true)}
                style={{
                  padding: '12px 24px',
                  background: '#1D4ED8',
                  color: '#FFF',
                  border: 'none',
                  borderRadius: 6,
                  fontSize: 14,
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(29, 78, 216, 0.4)',
                }}
              >
                Initialize Commissioning Session
              </button>
            </div>
          )}
        </div>

        {/* Right Inspector */}
        <CommissioningInspector selection={selection} />
      </div>

      {/* Dialogs */}
      <StartCommissioningDialog
        isOpen={isStartDialogOpen}
        onClose={() => setIsStartDialogOpen(false)}
        projectId={MOCK_PROJECT_ID}
        floorId={MOCK_FLOOR_ID}
      />

      <DeviceDiscoveryDialog
        isOpen={isDiscoverDialogOpen}
        onClose={() => setIsDiscoverDialogOpen(false)}
      />

      <AutoAddressingDialog
        isOpen={isAddressDialogOpen}
        onClose={() => setIsAddressDialogOpen(false)}
        onConfirm={() => {
          // In a full implementation, this would trigger the addressing workflow
          alert('Addressing sequence triggered (Mock).');
          setIsAddressDialogOpen(false);
        }}
      />

      <NetworkTestDialog
        isOpen={isNetworkTestDialogOpen}
        onClose={() => setIsNetworkTestDialogOpen(false)}
      />

      <SceneTestingDialog
        isOpen={isSceneTestDialogOpen}
        onClose={() => setIsSceneTestDialogOpen(false)}
      />

      <CommissioningReportDialog
        isOpen={isReportDialogOpen}
        onClose={() => setIsReportDialogOpen(false)}
      />

      {faultToResolve && (
        <FaultResolutionDialog
          isOpen={!!faultToResolve}
          onClose={() => setFaultToResolve(null)}
          fault={faultToResolve}
        />
      )}
    </div>
  );
};

export default CommissioningPage;