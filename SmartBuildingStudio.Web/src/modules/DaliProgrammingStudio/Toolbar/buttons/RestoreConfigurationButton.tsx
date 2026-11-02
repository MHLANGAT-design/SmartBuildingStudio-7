// src/modules/DaliProgrammingStudio/Toolbar/buttons/RestoreConfigurationButton.tsx

import React from 'react';

export const RestoreConfigurationButton: React.FC<{ onClick: () => void }> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '4px 10px',
        background: '#1E293B',
        color: '#E5E7EB',
        border: '1px solid #334155',
        borderRadius: 3,
        fontSize: 10,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
      }}
    >
      Restore
    </button>
  );
};