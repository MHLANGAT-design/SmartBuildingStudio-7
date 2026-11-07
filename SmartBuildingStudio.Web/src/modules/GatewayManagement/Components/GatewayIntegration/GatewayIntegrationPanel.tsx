// src/modules/GatewayManagement/Components/GatewayIntegration/GatewayIntegrationPanel.tsx

import React, { useCallback, useState } from 'react';
import { useAppSelector } from '@/Application/ConfigureStore';
import { selectSelectedGateway } from '@/modules/GatewayManagement/Store/gatewayManagementSelectors';
import { useGatewayIntegration } from '@/modules/GatewayManagement/Hooks/useGatewayIntegration';
import { IntegrationStatus } from '@/modules/GatewayManagement/Components/GatewayIntegration/IntegrationStatus';
import { IntegrationConfig } from '@/modules/GatewayManagement/Components/GatewayIntegration/IntegrationConfig';

interface Props {
  gatewayId?: string | null;
}

export const GatewayIntegrationPanel: React.FC<Props> = ({ gatewayId }) => {
  const gateway = useAppSelector(selectSelectedGateway);
  const { state, isMockMode, ping } = useGatewayIntegration();

  const [lastPingResult, setLastPingResult] = useState<boolean | null>(null);
  const [lastPingAt, setLastPingAt] = useState<string | null>(null);
  const [isPinging, setIsPinging] = useState(false);

  const handlePing = useCallback(async () => {
    const id = gatewayId ?? gateway?.id;
    if (!id) return;
    setIsPinging(true);
    try {
      const result = await ping(id);
      setLastPingResult(result.reachable);
      setLastPingAt(new Date().toISOString());
    } catch {
      setLastPingResult(false);
      setLastPingAt(new Date().toISOString());
    } finally {
      setIsPinging(false);
    }
  }, [ping, gatewayId, gateway?.id]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 16 }}>
      <IntegrationStatus
        useMock={isMockMode}
        healthCheckIntervalSeconds={state?.healthCheckIntervalSeconds ?? 0}
        maxReconnectAttempts={state?.maxReconnectAttempts ?? 0}
        lastPingResult={lastPingResult}
        lastPingAt={lastPingAt}
      />

      <IntegrationConfig gateway={gateway} />

      <div>
        <button
          onClick={() => { void handlePing(); }}
          disabled={isPinging || !gateway}
          style={{
            padding: '6px 16px',
            background: isPinging || !gateway ? '#1F2937' : '#1D4ED8',
            color: isPinging || !gateway ? '#64748B' : '#FFF',
            border: 'none',
            borderRadius: 4,
            fontSize: 12,
            fontWeight: 'bold',
            cursor: isPinging || !gateway ? 'not-allowed' : 'pointer',
          }}
        >
          {isPinging ? 'Pinging…' : 'Ping Gateway'}
        </button>
      </div>
    </div>
  );
};