// src/modules/GatewayManagement/Components/GatewayDashboard/GatewayHealthOverview.tsx

import React from 'react';
import { useGateways } from '@/modules/GatewayManagement/Hooks/useGateways';
import { useGatewayIntegration } from '@/modules/GatewayManagement/Hooks/useGatewayIntegration';

export const GatewayHealthOverview: React.FC = () => {
  const { byStatus } = useGateways();
  const { isMockMode } = useGatewayIntegration();

  const statuses: Array<{ key: keyof typeof byStatus; color: string; label: string }> = [
    { key: 'Connected', color: '#4ADE80', label: 'Connected' },
    { key: 'Connecting', color: '#FBBF24', label: 'Connecting' },
    { key: 'Reconnecting', color: '#FBBF24', label: 'Reconnecting' },
    { key: 'Disconnected', color: '#64748B', label: 'Disconnected' },
    { key: 'Error', color: '#F87171', label: 'Error' },
  ];

  const total = statuses.reduce((sum, s) => sum + byStatus[s.key].length, 0) || 1;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      padding: 16,
      background: '#0F1424',
      border: '1px solid #1F2937',
      borderRadius: 6,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 11, color: '#64748B', textTransform: 'uppercase' }}>
          Health Overview
        </div>
        {isMockMode && (
          <span style={{
            padding: '2px 8px',
            borderRadius: 10,
            background: '#FBBF2422',
            border: '1px solid #FBBF2466',
            color: '#FBBF24',
            fontSize: 10,
            fontWeight: 'bold',
          }}>
            MOCK MODE
          </span>
        )}
      </div>

      <div style={{
        display: 'flex',
        height: 8,
        background: '#1F2937',
        borderRadius: 4,
        overflow: 'hidden',
      }}>
        {statuses.map(s => {
          const pct = (byStatus[s.key].length / total) * 100;
          if (pct === 0) return null;
          return (
            <div
              key={s.key}
              style={{
                width: `${pct}%`,
                background: s.color,
                transition: 'width 200ms ease',
              }}
              title={`${s.label}: ${byStatus[s.key].length}`}
            />
          );
        })}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, fontSize: 11 }}>
        {statuses.map(s => (
          <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: s.color,
            }} />
            <span style={{ color: '#94A3B8' }}>
              {s.label}: <span style={{ color: s.color, fontFamily: 'monospace', fontWeight: 'bold' }}>{byStatus[s.key].length}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};