import React from 'react';
import { useAppDispatch, useAppSelector } from '@/Application/ConfigureStore';
import { selectActiveFaults, selectInspectorSelection } from '@/modules/Commissioning/store/commissioningSelectors';
import { setInspectorSelection } from '@/modules/Commissioning/store/commissioningSlice';

export const FaultsPanel: React.FC = () => {
  const dispatch = useAppDispatch();
  const faults = useAppSelector(selectActiveFaults);
  const selection = useAppSelector(selectInspectorSelection);

  if (faults.length === 0) return null;

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ color: '#F87171', fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 8 }}>
        Active Faults
      </div>
      {faults.map(fault => {
        const isSelected = selection?.kind === 'fault' && selection.data?.faultId === fault.faultId;
        return (
          <div 
            key={fault.faultId} 
            onClick={() => dispatch(setInspectorSelection({ kind: 'fault', data: fault }))}
            style={{ 
              padding: 8, 
              background: isSelected ? '#3F1D1D' : '#0F1424', 
              border: isSelected ? '1px solid #F87171' : '1px solid #1F2937', 
              borderRadius: 4, 
              marginBottom: 4, 
              fontSize: 11,
              cursor: 'pointer'
            }}
          >
            <div style={{ color: isSelected ? '#FCA5A5' : '#E5E7EB', fontWeight: 'bold' }}>{fault.category}</div>
            <div style={{ color: '#64748B', fontSize: 10, marginTop: 2 }}>{fault.description}</div>
          </div>
        );
      })}
    </div>
  );
};