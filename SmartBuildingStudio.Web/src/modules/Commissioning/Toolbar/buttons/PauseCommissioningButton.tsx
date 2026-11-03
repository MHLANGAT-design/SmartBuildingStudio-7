// src/modules/Commissioning/Toolbar/buttons/PauseCommissioningButton.tsx

import React from 'react';
import { useCommissioning } from '@/modules/Commissioning/hooks/useCommissioning';

interface Props {
  onClick: () => void;
}

export const PauseCommissioningButton: React.FC<Props> = ({ onClick }) => {
  const { status } = useCommissioning();
  const disabled = status !== 'TESTING' && status !== 'DISCOVERING';

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '4px 10px',
        background: disabled ? '#1F2937' : '#1E293B',
        color: disabled ? '#64748B' : '#FBBF24',
        border: `1px solid ${disabled ? '#334155' : '#FBBF24'}`,
        borderRadius: 3,
        fontSize: 10,
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      Pause
    </button>
  );
};