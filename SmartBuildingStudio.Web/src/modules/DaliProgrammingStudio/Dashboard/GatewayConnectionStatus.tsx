// src/modules/DaliProgrammingStudio/Dashboard/GatewayConnectionStatus.tsx

import React from 'react';
import { useAppSelector } from '@/Application/ConfigureStore';
import { selectApprovedDesign } from '@/modules/DaliProgrammingStudio/store/programmingSelectors';

export const GatewayConnectionStatus: React.FC = () => {
  const design = useAppSelector(selectApprovedDesign);
  
  return (
    <div style={cardStyle}>
      <div style={cardTitleStyle}>Gateway</div>
      {design ? (
        <>
          {design.topology.gateways.map(gw => (
            <div key={gw.gatewayId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 'bold' }}>{gw.name}</div>
                <div style={{ fontSize: 10, color: '#64748B' }}>{gw.manufacturer} · {gw.protocol}</div>
              </div>
              <span
                style={{
                  padding: '2px 8px',
                  borderRadius: 10,
                  background: gw.status === 'ONLINE' ? '#10B981' : gw.status === 'CONNECTING' ? '#FBBF24' : '#6B7280',
                  color: '#0F1424',
                  fontSize: 9,
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                }}
              >
                {gw.status}
              </span>
            </div>
          ))}
        </>
      ) : (
        <div style={{ color: '#64748B', fontSize: 11 }}>No gateway loaded</div>
      )}
    </div>
  );
};

const cardStyle: React.CSSProperties = {
  background: '#0F1424',
  border: '1px solid #1F2937',
  borderRadius: 6,
  padding: 16,
  marginBottom: 12,
};

const cardTitleStyle: React.CSSProperties = {
  color: '#38BDF8',
  fontSize: 11,
  fontWeight: 'bold',
  textTransform: 'uppercase',
  letterSpacing: 0.5,
  marginBottom: 12,
};