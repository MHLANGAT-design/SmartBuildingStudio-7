// src/modules/Commissioning/Sidebar/ProgressTrackerPanel.tsx

import React from 'react';
import { useAppSelector } from '@/Application/ConfigureStore';
import { selectSessionStatus } from '@/modules/Commissioning/store/commissioningSelectors';

export const ProgressTrackerPanel: React.FC = () => {
  const status = useAppSelector(selectSessionStatus);

  const steps = ['IDLE', 'DISCOVERING', 'ADDRESSING', 'TESTING', 'COMPLETED'];
  const currentIndex = steps.indexOf(status);

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ color: '#38BDF8', fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 8 }}>
        Workflow Progress
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {steps.map((step, idx) => {
          const isActive = idx === currentIndex;
          const isPast = idx < currentIndex;

          return (
            <div key={step} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11 }}>
              <div style={{ width: 8, height: 8, borderRadius: 4, background: isActive ? '#38BDF8' : isPast ? '#4ADE80' : '#334155' }} />
              <span style={{ color: isActive ? '#38BDF8' : isPast ? '#4ADE80' : '#64748B', fontWeight: isActive ? 'bold' : 'normal' }}>
                {step}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};