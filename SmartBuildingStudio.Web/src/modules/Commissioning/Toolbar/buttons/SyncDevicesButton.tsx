// src/modules/Commissioning/Toolbar/buttons/SyncDevicesButton.tsx

import React from 'react';
import { useAppSelector } from '@/Application/ConfigureStore';
import { selectDeviceCount } from '@/modules/Commissioning/store/commissioningSelectors';

interface Props {
  onClick: () => void;
}

export const SyncDevicesButton: React.FC<Props> = ({ onClick }) => {
  const deviceCount = useAppSelector(selectDeviceCount);
  const disabled = deviceCount === 0;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '4px 10px',
        background: disabled ? '#1F2937' : '#1E293B',
        color: disabled ? '#64748B' : '#E5E7EB',
        border: '1px solid #334155',
        borderRadius: 3,
        fontSize: 10,
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      Sync State
    </button>
  );
};