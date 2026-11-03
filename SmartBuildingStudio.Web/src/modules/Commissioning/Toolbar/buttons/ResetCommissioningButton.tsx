// src/modules/Commissioning/Toolbar/buttons/ResetCommissioningButton.tsx

import React from 'react';
import { useCommissioning } from '@/modules/Commissioning/hooks/useCommissioning';

interface Props {
  onClick: () => void;
}

export const ResetCommissioningButton: React.FC<Props> = ({ onClick }) => {
  const { isActive } = useCommissioning();

  return (
    <button
      onClick={() => {
        if (confirm('Are you sure you want to reset the session? All progress will be lost.')) {
          onClick();
        }
      }}
      disabled={!isActive}
      style={{
        padding: '4px 10px',
        background: !isActive ? '#1F2937' : 'transparent',
        color: !isActive ? '#64748B' : '#94A3B8',
        border: `1px solid ${!isActive ? '#334155' : '#64748B'}`,
        borderRadius: 3,
        fontSize: 10,
        cursor: !isActive ? 'not-allowed' : 'pointer',
      }}
    >
      Reset
    </button>
  );
};