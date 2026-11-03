// src/modules/Commissioning/Sidebar/NetworkStatusPanel.tsx

import React from 'react';
import { useAppDispatch, useAppSelector } from '@/Application/ConfigureStore';
import { 
  selectActiveSession,
  selectInspectorSelection 
} from '@/modules/Commissioning/store/commissioningSelectors';
import { setInspectorSelection } from '@/modules/Commissioning/store/commissioningSlice';

export const NetworkStatusPanel: React.FC = () => {
  const dispatch = useAppDispatch();
  const session = useAppSelector(selectActiveSession);
  const selection = useAppSelector(selectInspectorSelection);
  
  const networks = Object.values(session?.networkStates ?? {});

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ color: '#38BDF8', fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 8 }}>
        Network Health
      </div>
      {networks.length === 0 && <div style={{ color: '#64748B', fontSize: 11 }}>No network data.</div>}

      {networks.map(net => {
        const isSelected = selection?.kind === 'network' && selection.id === net.lineId;
        return (
          <div 
            key={net.lineId} 
            onClick={() => dispatch(setInspectorSelection({ kind: 'network', id: net.lineId }))}
            style={{ 
              padding: 8, 
              background: isSelected ? '#1D4ED8' : '#0F1424', 
              border: isSelected ? '1px solid #38BDF8' : '1px solid #1F2937', 
              borderRadius: 4, 
              marginBottom: 4, 
              fontSize: 11,
              cursor: 'pointer',
            }}
          >
            <div style={{ color: isSelected ? '#FFF' : '#E5E7EB', fontWeight: 'bold', marginBottom: 4 }}>
              Line: {net.lineId}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: isSelected ? '#BAE6FD' : '#64748B' }}>
              <span>Online:</span>
              <span style={{ color: '#4ADE80' }}>{net.onlineDevices} / {net.totalDevices}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: isSelected ? '#BAE6FD' : '#64748B' }}>
              <span>Errors:</span>
              <span style={{ color: net.errorCount > 0 ? '#F87171' : '#4ADE80' }}>{net.errorCount}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};