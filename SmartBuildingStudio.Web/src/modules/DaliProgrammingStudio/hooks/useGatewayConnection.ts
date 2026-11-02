// src/modules/DaliProgrammingStudio/hooks/useGatewayConnection.ts

import { useCallback, useState } from 'react';
import { GatewayIntegrationService } from '@/modules/DaliProgrammingStudio/Services/GatewayIntegrationService';

export type GatewayConnectionStatus = 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'ERROR';

export function useGatewayConnection(service: GatewayIntegrationService) {
  const [status, setStatus] = useState<GatewayConnectionStatus>('DISCONNECTED');
  const [error, setError] = useState<string | null>(null);

  const connect = useCallback(async (gatewayId: string, host: string, port: number) => {
    setStatus('CONNECTING');
    setError(null);
    try {
      const success = await service.connect(gatewayId, host, port);
      setStatus(success ? 'CONNECTED' : 'ERROR');
      return success;
    } catch (e: any) {
      setError(e.message);
      setStatus('ERROR');
      return false;
    }
  }, [service]);

  const disconnect = useCallback(async () => {
    try {
      await service.disconnect();
      setStatus('DISCONNECTED');
    } catch (e: any) {
      setError(e.message);
    }
  }, [service]);

  return {
    status,
    error,
    connect,
    disconnect,
    isConnected: status === 'CONNECTED',
    isConnecting: status === 'CONNECTING',
  };
}