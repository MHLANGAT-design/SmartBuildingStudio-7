// src/modules/FixturePlacementStudio/Toolbar/buttons/SaveButton.tsx

import React from 'react';
import { useAppDispatch, useAppSelector } from '@/Application/ConfigureStore';
import { saveDocumentThunk } from '@/modules/FixturePlacementStudio/store/fixtureThunks';
import {
  selectSaveStatus,
  selectIsDirty,
} from '@/modules/FixturePlacementStudio/store/fixtureSelectors';

export const SaveButton: React.FC = () => {
  const dispatch = useAppDispatch();
  const saveStatus = useAppSelector(selectSaveStatus);
  const isDirty = useAppSelector(selectIsDirty);

  const saving = saveStatus === 'saving';
  const disabled = saving;

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => dispatch(saveDocumentThunk() as any)}
      title="Save fixture layout (Ctrl+S)"
      style={{
        ...button,
        background: isDirty
          ? 'rgba(16, 185, 129, 0.15)'
          : 'rgba(30, 41, 59, 0.4)',
        borderColor: isDirty ? '#10B981' : '#1E293B',
        color: isDirty ? '#6EE7B7' : '#94A3B8',
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      {saving ? '💾 Saving…' : isDirty ? '💾 Save' : '💾 Saved'}
    </button>
  );
};

const button: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '4px 10px',
  borderRadius: 4,
  border: '1px solid #1E293B',
  fontSize: 11,
  fontFamily: 'monospace',
  transition: 'background 0.1s, border-color 0.1s, color 0.1s',
};

export default SaveButton;