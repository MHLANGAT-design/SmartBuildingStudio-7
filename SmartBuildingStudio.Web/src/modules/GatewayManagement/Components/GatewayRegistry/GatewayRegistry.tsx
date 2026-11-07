// src/modules/GatewayManagement/Components/GatewayRegistry/GatewayRegistry.tsx

import React, { useEffect } from 'react';
import { useGateways } from '@/modules/GatewayManagement/Hooks/useGateways';
import { GatewayList } from '@/modules/GatewayManagement/Components/GatewayRegistry/GatewayList';
import { GatewayDetails } from '@/modules/GatewayManagement/Components/GatewayRegistry/GatewayDetails';

interface Props {
  /** Load the gateway list on mount. Default true. */
  loadOnMount?: boolean;
}

export const GatewayRegistry: React.FC<Props> = ({ loadOnMount = true }) => {
  const {
    gateways,
    selectedGatewayId,
    selectedGateway,
    isLoading,
    error,
    select,
    refresh,
  } = useGateways();

  useEffect(() => {
    if (loadOnMount) {
      void refresh().catch(() => { /* error slot populated */ });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadOnMount]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 12px',
        borderBottom: '1px solid #1F2937',
      }}>
        <div style={{ fontSize: 12, fontWeight: 'bold', color: '#38BDF8', textTransform: 'uppercase' }}>
          Gateway Registry
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

      {error && (
        <div style={{
          padding: '6px 12px',
          background: '#3F1D1D',
          borderBottom: '1px solid #F87171',
          color: '#F87171',
          fontSize: 11,
        }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <div style={{ width: 340, flexShrink: 0, borderRight: '1px solid #1F2937', padding: 12, overflowY: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <GatewayList
            gateways={gateways}
            selectedGatewayId={selectedGatewayId}
            onSelect={select}
          />
        </div>
        <div style={{ flex: 1, padding: 16, overflowY: 'auto' }}>
          <GatewayDetails gateway={selectedGateway} />
        </div>
      </div>
    </div>
  );
};