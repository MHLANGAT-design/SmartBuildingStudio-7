// src/modules/GatewayManagement/Components/GatewayDashboard/GatewaySummaryCards.tsx

import React from 'react';
import { useGateways } from '@/modules/GatewayManagement/Hooks/useGateways';

export const GatewaySummaryCards: React.FC = () => {
  const { gateways, connected, errored, byStatus } = useGateways();

  const card = (label: string, value: number, color: string) => (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
      padding: '12px 16px',
      background: '#0F1424',
      border: '1px solid #1F2937',
      borderRadius: 6,
    }}>
      <div style={{ fontSize: 10, color: '#64748B', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 'bold', color, fontFamily: 'monospace' }}>{value}</div>
    </div>
  );

  return (
    <div style={{ display: 'flex', gap: 12 }}>
      {card('Total', gateways.length, '#38BDF8')}
      {card('Connected', connected.length, '#4ADE80')}
      {card('Disconnected', byStatus.Disconnected.length, '#64748B')}
      {card('Errored', errored.length, '#F87171')}
    </div>
  );
};