// src/modules/DaliProgrammingStudio/Workspace/ProgrammingWorkspaceContext.tsx

import React, { createContext, useContext, useMemo } from 'react';
import { ProgrammingService } from '@/modules/DaliProgrammingStudio/Services/ProgrammingService';
import { GatewayIntegrationService } from '@/modules/DaliProgrammingStudio/Services/GatewayIntegrationService';
import { AddressingService } from '@/modules/DaliProgrammingStudio/Services/AddressingService';
import { ConfigurationService } from '@/modules/DaliProgrammingStudio/Services/ConfigurationService';
import { VerificationService } from '@/modules/DaliProgrammingStudio/Services/VerificationService';
import { DiagnosticsService } from '@/modules/DaliProgrammingStudio/Services/DiagnosticsService';
import { BackupService } from '@/modules/DaliProgrammingStudio/Services/BackupService';
import { GatewayManager } from '@/modules/DaliProgrammingStudio/Gateway/GatewayManager';
import { DaliCommandAudit } from '@/modules/DaliProgrammingStudio/Commands/DaliCommandAudit';

// Placeholder for the mock adapter; the actual factory would be provided by the app
import { GatewayProtocolAdapter } from '@/modules/DaliProgrammingStudio/Gateway/GatewayProtocolAdapter';

interface WorkspaceServices {
  programmingService: ProgrammingService;
  gatewayIntegrationService: GatewayIntegrationService;
  addressingService: AddressingService;
  configurationService: ConfigurationService;
  verificationService: VerificationService;
  diagnosticsService: DiagnosticsService;
  backupService: BackupService;
}

const WorkspaceContext = createContext<WorkspaceServices | null>(null);

interface ProgrammingWorkspaceProviderProps {
  children: React.ReactNode;
  adapterFactory: (protocol: string) => GatewayProtocolAdapter;
}

export const ProgrammingWorkspaceProvider: React.FC<ProgrammingWorkspaceProviderProps> = ({ 
  children, 
  adapterFactory 
}) => {
  const services = useMemo<WorkspaceServices>(() => {
    const audit = new DaliCommandAudit();
    const gatewayManager = new GatewayManager(adapterFactory);
    
    // Extract adapter from gateway manager (in production, the manager should expose it)
    const gatewayAdapter = (gatewayManager as any).connectionManager?.activeAdapter || null;

    // For now, we provide a stub adapter; in production this would come from the manager
    const stubAdapter = {
      connect: async () => true,
      disconnect: async () => {},
      isConnected: () => true,
      sendCommand: async () => ({ success: true, gatewayId: 'stub', timestamp: new Date().toISOString(), responseCode: 200 }),
      sendBatch: async () => [],
    };

    return {
      programmingService: new ProgrammingService(stubAdapter, audit),
      gatewayIntegrationService: new GatewayIntegrationService(gatewayManager),
      addressingService: new AddressingService(),
      configurationService: new ConfigurationService(),
      verificationService: new VerificationService(stubAdapter),
      diagnosticsService: new DiagnosticsService(stubAdapter),
      backupService: new BackupService(),
    };
  }, [adapterFactory]);

  return (
    <WorkspaceContext.Provider value={services}>
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspaceServices = (): WorkspaceServices => {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) {
    throw new Error('useWorkspaceServices must be used within ProgrammingWorkspaceProvider');
  }
  return ctx;
};