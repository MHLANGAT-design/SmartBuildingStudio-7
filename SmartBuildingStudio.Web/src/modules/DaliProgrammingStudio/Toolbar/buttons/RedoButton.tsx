// src/modules/DaliProgrammingStudio/Toolbar/buttons/RedoButton.tsx

import React from 'react';
import { useAppDispatch, useAppSelector } from '@/Application/ConfigureStore';
import { redo } from '@/modules/DaliProgrammingStudio/store/programmingSlice';

export const RedoButton: React.FC = () => {
  const dispatch = useAppDispatch();
  const canRedo = useAppSelector((s: any) => s.daliProgramming.futurePlans.length > 0);

  return (
    <button
      onClick={() => dispatch(redo())}
      disabled={!canRedo}
      style={{
        padding: '4px 10px',
        background: !canRedo ? '#1F2937' : '#1E293B',
        color: !canRedo ? '#64748B' : '#E5E7EB',
        border: '1px solid #334155',
        borderRadius: 3,
        fontSize: 10,
        cursor: !canRedo ? 'not-allowed' : 'pointer',
      }}
    >
      Redo
    </button>
  );
};