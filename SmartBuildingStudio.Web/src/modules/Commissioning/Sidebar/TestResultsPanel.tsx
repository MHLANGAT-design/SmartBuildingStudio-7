// src/modules/Commissioning/Sidebar/TestResultsPanel.tsx

import React from 'react';
import { useAppSelector } from '@/Application/ConfigureStore';
import { selectRecentTestResults } from '@/modules/Commissioning/store/commissioningSelectors';

export const TestResultsPanel: React.FC = () => {
  const results = useAppSelector(selectRecentTestResults);

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ color: '#38BDF8', fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 8 }}>
        Recent Test Results
      </div>
      {results.length === 0 && <div style={{ color: '#64748B', fontSize: 11 }}>No tests run yet.</div>}
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {results.slice(0, 5).map(res => (
          <div key={res.testId} style={{ padding: 6, background: '#0F1424', borderLeft: `3px solid ${res.status === 'PASS' ? '#4ADE80' : '#F87171'}`, fontSize: 10 }}>
            <div style={{ color: '#E5E7EB' }}>{res.testType} test on {res.targetId}</div>
            <div style={{ color: '#64748B', marginTop: 2 }}>{res.status} · {res.durationMs}ms</div>
          </div>
        ))}
      </div>
    </div>
  );
};