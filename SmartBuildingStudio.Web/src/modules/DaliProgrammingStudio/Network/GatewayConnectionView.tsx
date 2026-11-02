// src/modules/DaliProgrammingStudio/Network/GatewayConnectionView.tsx

import React from 'react';
import type { GatewayReference } from '@/modules/DaliProgrammingStudio/types/dali.types';

interface Props {
  gateway: GatewayReference;
  isSelected?: boolean;
  onClick?: () => void;
}

export const GatewayConnectionView: React.FC<Props> = ({ gateway, isSelected, onClick }) => {
  return (
    <div
      onClick={onClick}
      style={{
        padding: 12,
        background: isSelected ? '#0F2B4C' : '#0F1424',
        border: `1px solid ${isSelected ? '#38BDF8' : '#1F2937'}`,
        borderRadius: 6,
        cursor: 'pointer',
        marginBottom: 8,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 'bold', color: '#E5E7EB' }}>{gateway.name}</div>
          <div style={{ fontSize: 10, color: '#64748B', marginTop: 2 }}>
            {gateway.manufacturer} · {gateway.protocol}
          </div>
        </div>
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            background: gateway.status === 'ONLINE' ? '#4ADE80' : gateway.status === 'CONNECTING' ? '#FBBF24' : '#6B7280',
          }}
        />
      </div>
    </div>
  );
};