// src/modules/Commissioning/Toolbar/buttons/StartCommissioningButton.tsx

import React from 'react';
import { useCommissioning } from '@/modules/Commissioning/hooks/useCommissioning';

interface Props {
  onClick: () => void;
}

export const StartCommissioningButton: React.FC<Props> = ({ onClick }) => {
  const { isActive, status } = useCommissioning();
  const disabled = isActive && status !== 'FAILED';

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '4px 10px',
        background: disabled ? '#1F2937' : '#1D4ED8',
        color: disabled ? '#64748B' : '#FFF',
        border: '1px solid #334155',
        borderRadius: 3,
        fontSize: 10,
        fontWeight: 'bold',
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      Start Session
    </button>
  );
};