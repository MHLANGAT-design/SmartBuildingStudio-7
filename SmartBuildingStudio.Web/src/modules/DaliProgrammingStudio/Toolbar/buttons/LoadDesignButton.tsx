// src/modules/DaliProgrammingStudio/Toolbar/buttons/LoadDesignButton.tsx

import React from 'react';

interface Props {
  onClick: () => void;
}

export const LoadDesignButton: React.FC<Props> = ({ onClick }) => {
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
      Load Design
    </button>
  );
};