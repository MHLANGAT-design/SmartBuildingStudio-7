// src/modules/GatewayManagement/Components/GatewayDashboard/GatewayDashboard.tsx

import React, { useEffect } from 'react';
import { useGateways } from '@/modules/GatewayManagement/Hooks/useGateways';
import { GatewaySummaryCards } from '@/modules/GatewayManagement/Components/GatewayDashboard/GatewaySummaryCards';
import { GatewayHealthOverview } from '@/modules/GatewayManagement/Components/GatewayDashboard/GatewayHealthOverview';

interface Props {
  loadOnMount?: boolean;
}

export const GatewayDashboard: React.FC<Props> = ({ loadOnMount = true }) => {
  const { refresh, isLoading } = useGateways();

  useEffect(() => {
    if (loadOnMount) {
      void refresh().catch(() => { /* error slot populated */ });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadOnMount]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 14, fontWeight: 'bold', color: '#38BDF8' }}>
          Gateway Dashboard
        </div>
        <button
          onClick={() => { void refresh().catch(() => {}); }}
          disabled={isLoading}
          style={{
            padding: '4px 10px',
            background: isLoading ? '#1F2937' : '#1D4ED8',
            color: isLoading ? '#64748B' : '#FFF',
            border: 'none',
            borderRadius: 4,
            fontSize: 11,
            fontWeight: 'bold',
            cursor: isLoading ? 'not-allowed' : 'pointer',
          }}
        >
          {isLoading ? 'Loading…' : 'Refresh'}
        </button>
      </div>

      <GatewaySummaryCards />
      <GatewayHealthOverview />
    </div>
  );
};