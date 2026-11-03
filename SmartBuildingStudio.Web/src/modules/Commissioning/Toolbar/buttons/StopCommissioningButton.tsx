// src/modules/Commissioning/Toolbar/buttons/StopCommissioningButton.tsx

import React from 'react';
import { useCommissioning } from '@/modules/Commissioning/hooks/useCommissioning';

interface Props {
  onClick: () => void;
}

export const StopCommissioningButton: React.FC<Props> = ({ onClick }) => {
  const { isActive } = useCommissioning();
  const disabled = !isActive;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '4px 10px',
        background: disabled ? '#1F2937' : '#991B1B',
        color: disabled ? '#64748B' : '#FFF',
        border: '1px solid #334155',
        borderRadius: 3,
        fontSize: 10,
        fontWeight: 'bold',
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      Stop
    </button>
  );
};