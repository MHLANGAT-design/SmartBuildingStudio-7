// src/modules/Commissioning/Sidebar/ProgressTrackerPanel.tsx

import React, { useState } from 'react';
import { useAppSelector } from '@/Application/ConfigureStore';
import { 
  selectSessionStatus, 
  selectIsDiscovering, 
  selectIsAddressing, 
  selectIsTesting 
} from '@/modules/Commissioning/store/commissioningSelectors';

export const ProgressTrackerPanel: React.FC = () => {
  const status = useAppSelector(selectSessionStatus);
  const isDiscovering = useAppSelector(selectIsDiscovering);
  const isAddressing = useAppSelector(selectIsAddressing);
  const isTesting = useAppSelector(selectIsTesting);
  
  const [isOpen, setIsOpen] = useState(true);

  const steps = [
    { id: 'IDLE', label: 'IDLE', active: status === 'IDLE' && !isDiscovering },
    { id: 'DISCOVERING', label: 'DISCOVERING', active: status === 'DISCOVERING' || isDiscovering },
    { id: 'ADDRESSING', label: 'ADDRESSING', active: status === 'ADDRESSING' || isAddressing },
    { id: 'TESTING', label: 'TESTING', active: status === 'TESTING' || isTesting },
    { id: 'COMPLETED', label: 'COMPLETED', active: status === 'COMPLETED' || status === 'READY_FOR_HANDOVER' },
  ];

  return (
    <div>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{ 
          color: '#38BDF8', 
          fontSize: 11, 
          fontWeight: 'bold', 
          textTransform: 'uppercase', 
          marginBottom: 8,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          cursor: 'pointer',
          userSelect: 'none'
        }}
      >
        <span style={{ fontSize: 10, width: 12, display: 'inline-block' }}>
          {isOpen ? '▼' : '▶'}
        </span>
        Workflow Progress
      </div>

      {isOpen && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginLeft: 18 }}>
          {steps.map((step, idx) => (
            <div key={step.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11 }}>
              <div style={{ 
                width: 6, 
                height: 6, 
                borderRadius: '50%', 
                background: step.active ? '#38BDF8' : '#1F2937',
                boxShadow: step.active ? '0 0 8px #38BDF8' : 'none'
              }} />
              <span style={{ color: step.active ? '#E5E7EB' : '#64748B' }}>
                {step.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};