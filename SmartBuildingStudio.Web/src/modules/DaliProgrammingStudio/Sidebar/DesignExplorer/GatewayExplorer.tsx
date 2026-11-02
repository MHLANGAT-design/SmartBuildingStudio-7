// src/modules/DaliProgrammingStudio/Sidebar/DesignExplorer/GatewayExplorer.tsx

import React from 'react';
import { useAppSelector } from '@/Application/ConfigureStore';
import { selectApprovedDesign } from '@/modules/DaliProgrammingStudio/store/programmingSelectors';

export const GatewayExplorer: React.FC = () => {
  const design = useAppSelector(selectApprovedDesign);

  if (!design) return <div style={{ color: '#64748B', fontSize: 11, padding: 8 }}>No design loaded</div>;

  return (
    <div>
      {design.topology.gateways.map(gw => (
        <div
          key={gw.gatewayId}
          style={{
            padding: '6px 8px',
            background: '#0F1424',
            border: '1px solid #1F2937',
            borderRadius: 4,
            marginBottom: 4,
            fontSize: 11,
          }}
        >
          <div style={{ color: '#E5E7EB', fontWeight: 'bold' }}>{gw.name}</div>
          <div style={{ color: '#64748B', fontSize: 10, marginTop: 2, fontFamily: 'monospace' }}>
            {gw.manufacturer} · {gw.protocol} · {gw.status}
          </div>
        </div>
      ))}
    </div>
  );
};