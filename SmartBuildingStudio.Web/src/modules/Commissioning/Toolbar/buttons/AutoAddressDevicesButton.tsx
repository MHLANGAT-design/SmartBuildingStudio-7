// src/modules/Commissioning/Toolbar/buttons/AutoAddressDevicesButton.tsx

import React from 'react';
import { useAppSelector } from '@/Application/ConfigureStore';
import { selectActiveSession } from '@/modules/Commissioning/store/commissioningSelectors';

interface Props {
  onClick: () => void;
}

export const AutoAddressDevicesButton: React.FC<Props> = ({ onClick }) => {
  const session = useAppSelector(selectActiveSession);
  const hasUnaddressed = session ? Object.values(session.deviceStates).some(d => !d.isAddressed) : false;

  return (
    <button
      onClick={onClick}
      disabled={!hasUnaddressed}
      style={{
        padding: '4px 10px',
        background: !hasUnaddressed ? '#1F2937' : '#1E293B',
        color: !hasUnaddressed ? '#64748B' : '#E5E7EB',
        border: '1px solid #334155',
        borderRadius: 3,
        fontSize: 10,
        cursor: !hasUnaddressed ? 'not-allowed' : 'pointer',
        whiteSpace: 'nowrap',
      }}
    >
      Auto-Address
    </button>
  );
};