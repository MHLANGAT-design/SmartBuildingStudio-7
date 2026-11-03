// src/modules/Commissioning/Toolbar/buttons/SaveCommissioningStateButton.tsx

import React, { useState } from 'react';
import { useAppSelector } from '@/Application/ConfigureStore';
import { selectActiveSession } from '@/modules/Commissioning/store/commissioningSelectors';
import { CommissioningApi } from '@/modules/Commissioning/services/CommissioningApi';

interface Props {
  onClick?: () => void;
}

export const SaveCommissioningStateButton: React.FC<Props> = ({ onClick }) => {
  const session = useAppSelector(selectActiveSession);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!session) return;
    setIsSaving(true);
    try {
      await CommissioningApi.saveSessionState(session);
      if (onClick) onClick(); // Optional callback for success toast
    } catch (e) {
      alert('Failed to save session state');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <button
      onClick={handleSave}
      disabled={!session || isSaving}
      style={{
        padding: '4px 10px',
        background: (!session || isSaving) ? '#1F2937' : '#1E293B',
        color: (!session || isSaving) ? '#64748B' : '#E5E7EB',
        border: '1px solid #334155',
        borderRadius: 3,
        fontSize: 10,
        cursor: (!session || isSaving) ? 'not-allowed' : 'pointer',
      }}
    >
      {isSaving ? 'Saving...' : 'Save State'}
    </button>
  );
};