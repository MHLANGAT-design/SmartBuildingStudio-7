// src/modules/Commissioning/Sidebar/TestResultsPanel.tsx

import React from 'react';
import { useAppDispatch, useAppSelector } from '@/Application/ConfigureStore';
import { selectRecentTestResults, selectInspectorSelection } from '@/modules/Commissioning/store/commissioningSelectors';
import { setInspectorSelection } from '@/modules/Commissioning/store/commissioningSlice';

export const TestResultsPanel: React.FC = () => {
  const dispatch = useAppDispatch();
  const results = useAppSelector(selectRecentTestResults);
  const selection = useAppSelector(selectInspectorSelection);

  if (results.length === 0) return null;

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ color: '#38BDF8', fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 8 }}>
        Test Results
      </div>
      {results.slice(0, 5).map((result, i) => {
        const isSelected = selection?.kind === 'testResult' && selection.data === result;
        return (
          <div 
            key={i} 
            onClick={() => dispatch(setInspectorSelection({ kind: 'testResult', data: result }))}
            style={{ 
              padding: 8, 
              background: isSelected ? '#1D4ED8' : '#0F1424', 
              border: isSelected ? '1px solid #38BDF8' : '1px solid #1F2937', 
              borderRadius: 4, 
              marginBottom: 4, 
              fontSize: 11,
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between'
            }}
          >
            <span style={{ color: isSelected ? '#FFF' : '#E5E7EB' }}>{result.testType}</span>
            <span style={{ color: result.status === 'PASS' ? '#4ADE80' : '#F87171', fontWeight: 'bold' }}>
              {result.status}
            </span>
          </div>
        );
      })}
    </div>
  );
};