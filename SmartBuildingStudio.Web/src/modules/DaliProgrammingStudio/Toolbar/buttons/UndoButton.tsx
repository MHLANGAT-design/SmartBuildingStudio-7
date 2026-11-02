// src/modules/DaliProgrammingStudio/Toolbar/buttons/UndoButton.tsx

import React from 'react';
import { useAppDispatch, useAppSelector } from '@/Application/ConfigureStore';
import { undo } from '@/modules/DaliProgrammingStudio/store/programmingSlice';

export const UndoButton: React.FC = () => {
  const dispatch = useAppDispatch();
  const canUndo = useAppSelector((s: any) => s.daliProgramming.pastPlans.length > 0);

  return (
    <button
      onClick={() => dispatch(undo())}
      disabled={!canUndo}
      style={{
        padding: '4px 10px',
        background: !canUndo ? '#1F2937' : '#1E293B',
        color: !canUndo ? '#64748B' : '#E5E7EB',
        border: '1px solid #334155',
        borderRadius: 3,
        fontSize: 10,
        cursor: !canUndo ? 'not-allowed' : 'pointer',
      }}
    >
      Undo
    </button>
  );
};