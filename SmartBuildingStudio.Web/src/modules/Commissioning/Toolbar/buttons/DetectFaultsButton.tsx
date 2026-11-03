// src/modules/Commissioning/Toolbar/buttons/DetectFaultsButton.tsx

import React from 'react';
import { useFaultDetection } from '@/modules/Commissioning/hooks/useFaultDetection';

interface Props {
  onClick: () => void;
}

export const DetectFaultsButton: React.FC<Props> = ({ onClick }) => {
  const { faults } = useFaultDetection();

  return (
    <button
      onClick={onClick}
      style={{
        padding: '4px 10px',
        background: faults.length > 0 ? '#3F1D1D' : '#1E293B',
        color: faults.length > 0 ? '#F87171' : '#E5E7EB',
        border: `1px solid ${faults.length > 0 ? '#F87171' : '#334155'}`,
        borderRadius: 3,
        fontSize: 10,
        cursor: 'pointer',
      }}
    >
      {faults.length > 0 ? `View Faults (${faults.length})` : 'Detect Faults'}
    </button>
  );
};