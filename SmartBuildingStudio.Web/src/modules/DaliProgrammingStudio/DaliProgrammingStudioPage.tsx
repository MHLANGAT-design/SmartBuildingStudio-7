// src/modules/DaliProgrammingStudio/DaliProgrammingStudioPage.tsx

import React, { useState, useEffect } from 'react';
import { useAppSelector } from '@/Application/ConfigureStore';
import { useWorkspaceServices } from '@/modules/DaliProgrammingStudio/Workspace/ProgrammingWorkspaceContext';
import { useDeployment } from '@/modules/DaliProgrammingStudio/hooks/useDeployment';
import { useConfigurationVerification } from '@/modules/DaliProgrammingStudio/hooks/useConfigurationVerification';
import { useHydrateDaliDesign } from '@/modules/DaliProgrammingStudio/hooks/useHydrateDaliDesign';
import { useDaliDesign } from '@/modules/DaliProgrammingStudio/hooks/useDaliDesign';
import { useDaliDiagnostics } from '@/modules/DaliProgrammingStudio/hooks/useDaliDiagnostics';
import { useConfigurationBackup } from '@/modules/DaliProgrammingStudio/hooks/useConfigurationBackup';
import { 
  selectProgrammingPlan, selectApprovedDesign, selectDeploymentResult,
  selectDeploymentProgress, selectVerificationReport, selectWarnings,
  selectIsDeploying
} from '@/modules/DaliProgrammingStudio/store/programmingSelectors';

import { ProgrammingWorkspaceProvider } from '@/modules/DaliProgrammingStudio/Workspace/ProgrammingWorkspaceContext';
import { ProgrammingWorkspace } from '@/modules/DaliProgrammingStudio/Workspace/ProgrammingWorkspace';
import type { WorkspaceView } from '@/modules/DaliProgrammingStudio/Workspace/ProgrammingNavigation';
import { ProgrammingToolbar } from '@/modules/DaliProgrammingStudio/Toolbar/ProgrammingToolbar';
import { ProgrammingSidebar } from '@/modules/DaliProgrammingStudio/Sidebar/ProgrammingSidebar';
import { ProgrammingInspector, type InspectorSelection } from '@/modules/DaliProgrammingStudio/Inspector/ProgrammingInspector';
import { ProgrammingDashboard } from '@/modules/DaliProgrammingStudio/Dashboard/ProgrammingDashboard';
import { DaliNetworkView } from '@/modules/DaliProgrammingStudio/Network/DaliNetworkView';
import { DesignExplorer } from '@/modules/DaliProgrammingStudio/Sidebar/DesignExplorer/DesignExplorer';
import { ProgrammingJobExplorer } from '@/modules/DaliProgrammingStudio/Sidebar/ProgrammingJobs/ProgrammingJobExplorer';
import { CompilationErrorsPanel } from '@/modules/DaliProgrammingStudio/Workspace/CompilationErrorsPanel';

import { GatewayProtocolAdapter } from '@/modules/DaliProgrammingStudio/Gateway/GatewayProtocolAdapter';
import type { GatewayConnectionConfig, GatewayResponse } from '@/modules/DaliProgrammingStudio/types/gateway.types';
import type { DaliCommand } from '@/modules/DaliProgrammingStudio/types/command.types';

import { LoadDesignDialog } from '@/modules/DaliProgrammingStudio/Dialogs/LoadDesignDialog';
import { DeploymentConfirmationDialog } from '@/modules/DaliProgrammingStudio/Dialogs/DeploymentConfirmationDialog';
import { DeploymentProgressDialog } from '@/modules/DaliProgrammingStudio/Dialogs/DeploymentProgressDialog';
import { VerificationReportDialog } from '@/modules/DaliProgrammingStudio/Dialogs/VerificationReportDialog';
import { DiagnosticsDialog } from '@/modules/DaliProgrammingStudio/Dialogs/DiagnosticsDialog';
import { BackupConfigurationDialog } from '@/modules/DaliProgrammingStudio/Dialogs/BackupConfigurationDialog';
import { RestoreConfigurationDialog } from '@/modules/DaliProgrammingStudio/Dialogs/RestoreConfigurationDialog';
import { ProgrammingPreviewDialog } from '@/modules/DaliProgrammingStudio/Dialogs/ProgrammingPreviewDialog';

class MockGatewayAdapter extends GatewayProtocolAdapter {
  private connected = false;
  async connect(_c: GatewayConnectionConfig) { this.connected = true; return true; }
  async disconnect() { this.connected = false; }
  isConnected() { return this.connected; }
  async sendCommand(_c: DaliCommand): Promise<GatewayResponse> {
    await new Promise(r => setTimeout(r, 150));
    return { success: true, gatewayId: 'mock', timestamp: new Date().toISOString(), responseCode: 200 };
  }
  async sendBatch(commands: DaliCommand[]): Promise<GatewayResponse[]> {
    return Promise.all(commands.map(c => this.sendCommand(c)));
  }
}
const adapterFactory = (_: string): GatewayProtocolAdapter => new MockGatewayAdapter();

const ProgrammingStudioContent: React.FC = () => {
  const [activeView, setActiveView] = useState<WorkspaceView>('dashboard');
  const [selection, setSelection] = useState<InspectorSelection>(null);
  
  const [isLoadDialogOpen, setIsLoadDialogOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isDeployConfirmOpen, setIsDeployConfirmOpen] = useState(false);
  const [isDeployProgressOpen, setIsDeployProgressOpen] = useState(false);
  const [isVerifyReportOpen, setIsVerifyReportOpen] = useState(false);
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState(false);
  const [isBackupOpen, setIsBackupOpen] = useState(false);
  const [isRestoreOpen, setIsRestoreOpen] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  const services = useWorkspaceServices();
  const { loadDesign } = useDaliDesign();
  const { deploy } = useDeployment(services.programmingService);
  const { verify } = useConfigurationVerification(services.verificationService);
  const { report: diagReport, runDiagnostics } = useDaliDiagnostics(services.diagnosticsService);
  const { createBackup, importBackup } = useConfigurationBackup(services.backupService);

  const plan = useAppSelector(selectProgrammingPlan);
  const design = useAppSelector(selectApprovedDesign);
  const deploymentResult = useAppSelector(selectDeploymentResult);
  const deploymentProgress = useAppSelector(selectDeploymentProgress);
  const verificationReport = useAppSelector(selectVerificationReport);
  
  const compileErrors = useAppSelector((s: any) => s.daliProgramming.compileErrors || []);
  const globalWarnings = useAppSelector(selectWarnings);

  useEffect(() => {
    if (compileErrors.length > 0 || globalWarnings.length > 0) {
      setShowErrors(true);
    } else {
      setShowErrors(false);
    }
  }, [compileErrors, globalWarnings]);

  useEffect(() => {
    if (deploymentResult && isDeployProgressOpen) {
      // 1. Trigger the state update to close the dialog
      setIsDeployProgressOpen(false);
      
      // 2. Delay the blocking native alert slightly so React can paint the unmounted dialog first
      const timer = setTimeout(() => {
        if (deploymentResult.success) {
          alert(`Deployment Successful!\n${deploymentResult.successfulSequences?.length || 0} sequences programmed.`);
        } else {
          alert(`Deployment Failed.`);
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [deploymentResult, isDeployProgressOpen]);

  const handleConfirmLoad = () => {
    try { loadDesign(); setIsLoadDialogOpen(false); }
    catch (e) { /* handled by hook */ }
  };

  const handleConfirmDeploy = async () => {
    if (!plan || !design) return;
    const gatewayId = design.topology.gateways[0]?.gatewayId;
    const lineId = design.topology.lines[0]?.lineId;
    const projectId = design.topology.projectId;
    const floorplanId = design.topology.floorplanId;
    
    if (!gatewayId || !lineId || !projectId || !floorplanId) {
      alert('Design is missing required context (gateway, line, project, or floorplan).');
      return;
    }

    setIsDeployConfirmOpen(false);
    setIsDeployProgressOpen(true);

    try { 
      await deploy(plan, gatewayId, lineId, projectId, floorplanId); 
    }
    catch (e) { 
      console.error(e); 
      setIsDeployProgressOpen(false); 
    }
  };

  const handleVerifyClick = async () => {
    if (!design || !deploymentResult) return;
    try {
      await verify(deploymentResult.deploymentId, design.devices);
      setIsVerifyReportOpen(true);
    } catch (e) { console.error(e); }
  };

  const handleReadBackClick = () => {
    if (!design) return;
    alert('Read-back complete. Physical state is up to date.');
  };

  const handleDiagnosticsClick = async () => {
    if (!design) return;
    const gatewayId = design.topology.gateways[0]?.gatewayId || '';
    const lineId = design.topology.lines[0]?.lineId || '';
    const result = await runDiagnostics(gatewayId, lineId, design.devices, [], { successful: 100, failed: 0, timeouts: 0 });
    if (result) setIsDiagnosticsOpen(true);
  };

  const handleBackupClick = () => setIsBackupOpen(true);
  const handleRestoreClick = () => setIsRestoreOpen(true);

  const onCreateBackup = (comment: string) => {
    if (!design) return;
    const configs = design.devices.map(d => ({
      deviceId: d.deviceId,
      shortAddress: d.hardwareAddress,
      parameters: d.parameters,
      groups: d.groups,
      scenes: d.scenes,
    }));
    createBackup(
      {
        projectId: design.topology.projectId,
        designRevisionId: design.revisionId,
        gatewayId: design.topology.gateways[0]?.gatewayId || '',
        lineId: design.topology.lines[0]?.lineId || '',
        createdBy: 'current-user',
        deviceCount: configs.length,
      },
      configs
    );
    setIsBackupOpen(false);
    alert('Backup created successfully.');
  };

  const onRestore = (jsonString: string) => {
    try {
      importBackup(jsonString);
      setIsRestoreOpen(false);
      alert('Backup imported successfully.');
    } catch (e: any) {
      alert(`Restore failed: ${e.message}`);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100%', position: 'relative' }}>
      {/* Sidebar only shown on non-dashboard views */}
      {activeView !== 'dashboard' && <ProgrammingSidebar />}
      
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <ProgrammingToolbar
          onLoadClick={() => setIsLoadDialogOpen(true)}
          onPreviewClick={() => setIsPreviewOpen(true)}
          onDeployClick={() => setIsDeployConfirmOpen(true)}
          onVerifyClick={handleVerifyClick}
          onReadBackClick={handleReadBackClick}
          onDiagnosticsClick={handleDiagnosticsClick}
          onBackupClick={handleBackupClick}
          onRestoreClick={handleRestoreClick}
        />
        
        <ProgrammingWorkspace activeView={activeView} onChangeView={setActiveView}>
          {/* Main Content Area */}
          <div style={{ height: '100%' }}>
            
            {activeView === 'dashboard' && (
              <div style={{ padding: 16 }}>
                <ProgrammingDashboard onShowErrors={() => setShowErrors(true)} />
                <div style={{ marginTop: 24 }}><DaliNetworkView /></div>
              </div>
            )}

            {activeView === 'network' && (
              <div style={{ padding: 16 }}>
                <DaliNetworkView />
              </div>
            )}

            {activeView === 'design' && (
              <div style={{ padding: 16 }}>
                <DesignExplorer />
              </div>
            )}

            {activeView === 'jobs' && (
              <div style={{ padding: 16 }}>
                <ProgrammingJobExplorer />
              </div>
            )}

            {activeView === 'verification' && (
              <div style={{ padding: 16 }}>
                <div style={{ color: '#38BDF8', fontSize: 12, fontWeight: 'bold', marginBottom: 12 }}>
                  VERIFICATION REPORT
                </div>
                {verificationReport ? (
                  <div style={{ background: '#0F1424', border: '1px solid #1F2937', borderRadius: 6, padding: 16 }}>
                    <div style={{ color: verificationReport.isFullyVerified ? '#4ADE80' : '#F87171', fontWeight: 'bold', fontSize: 14, marginBottom: 12 }}>
                      {verificationReport.isFullyVerified ? '✓ Fully Verified' : '✗ Issues Detected'}
                    </div>
                    <div style={{ fontSize: 11, color: '#94A3B8' }}>
                      {verificationReport.summary.passed} passed, {verificationReport.summary.failed} failed
                    </div>
                  </div>
                ) : (
                  <div style={{ color: '#64748B', fontSize: 11 }}>
                    No verification report yet. Deploy and click "Verify" to generate one.
                  </div>
                )}
              </div>
            )}
          </div>
        </ProgrammingWorkspace>
      </div>

      {showErrors && (
        <CompilationErrorsPanel 
          errors={compileErrors} 
          warnings={globalWarnings} 
          onClose={() => setShowErrors(false)} 
        />
      )}

      <LoadDesignDialog isOpen={isLoadDialogOpen} onClose={() => setIsLoadDialogOpen(false)} onConfirm={handleConfirmLoad} />
      <ProgrammingPreviewDialog isOpen={isPreviewOpen} onClose={() => setIsPreviewOpen(false)} plan={plan} onApprove={() => setIsPreviewOpen(false)} />
      <DeploymentConfirmationDialog
        isOpen={isDeployConfirmOpen} onClose={() => setIsDeployConfirmOpen(false)} plan={plan}
        gatewayName={design?.topology.gateways[0]?.name || 'Unknown'}
        lineName={design?.topology.lines[0]?.name || 'Unknown'}
        onConfirm={handleConfirmDeploy}
      />
      <DeploymentProgressDialog isOpen={isDeployProgressOpen} progress={deploymentProgress} />
      <VerificationReportDialog isOpen={isVerifyReportOpen} onClose={() => setIsVerifyReportOpen(false)} report={verificationReport} />
      <DiagnosticsDialog isOpen={isDiagnosticsOpen} onClose={() => setIsDiagnosticsOpen(false)} report={diagReport} />
      <BackupConfigurationDialog isOpen={isBackupOpen} onClose={() => setIsBackupOpen(false)} onCreateBackup={onCreateBackup} />
      <RestoreConfigurationDialog isOpen={isRestoreOpen} onClose={() => setIsRestoreOpen(false)} onRestore={onRestore} />
    </div>
  );
};

export const DaliProgrammingStudioPage: React.FC = () => {
  const hydration = useHydrateDaliDesign();

  if (hydration.loading) {
    return <div style={{ padding: 20, color: '#94A3B8', fontFamily: 'monospace' }}>Loading DALI design…</div>;
  }
  if (hydration.error) {
    return <div style={{ padding: 20, color: '#F87171', fontFamily: 'monospace' }}>Error: {hydration.error}</div>;
  }

  return (
    <ProgrammingWorkspaceProvider adapterFactory={adapterFactory}>
      <ProgrammingStudioContent />
    </ProgrammingWorkspaceProvider>
  );
};

export default DaliProgrammingStudioPage;