// src/modules/Commissioning/Sidebar/FaultsPanel.tsx

import React from 'react';
import { useAppSelector } from '@/Application/ConfigureStore';
import { selectActiveFaults } from '@/modules/Commissioning/store/commissioningSelectors';

export const FaultsPanel: React.FC = () => {
  const faults = useAppSelector(selectActiveFaults);

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ color: '#38BDF8', fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 8 }}>
        Active Faults ({faults.length})
      </div>
      {faults.length === 0 && <div style={{ color: '#4ADE80', fontSize: 11 }}>✓ No active faults</div>}
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {faults.map(fault => (
          <div key={fault.faultId} style={{ padding: 8, background: '#3F1D1D', border: '1px solid #F87171', borderRadius: 4, fontSize: 10 }}>
            <div style={{ color: '#F87171', fontWeight: 'bold', marginBottom: 2 }}>{fault.category}</div>
            <div style={{ color: '#E5E7EB' }}>{fault.description}</div>
          </div>
        ))}
      </div>
    </div>
  );
};