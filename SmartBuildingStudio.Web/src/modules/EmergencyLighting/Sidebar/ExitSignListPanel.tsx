// src/modules/EmergencyLighting/Sidebar/ExitSignListPanel.tsx

import React from 'react';
import { useAppDispatch, useAppSelector } from '@/Application/ConfigureStore';
import { setSelectedEmergencyFixtureId } from '@/modules/EmergencyLighting/store/emergencySlice';
import {
  selectExitSignFixtures,
  selectSelectedEmergencyFixtureId,
  selectRoomNameById,
} from '@/modules/EmergencyLighting/store/emergencySelectors';
import { CollapsibleSection } from '@/modules/EmergencyLighting/Sidebar/CollapsibleSection';

export const ExitSignListPanel: React.FC = () => {
  const dispatch = useAppDispatch();
  const signs = useAppSelector(selectExitSignFixtures);
  const selectedId = useAppSelector(selectSelectedEmergencyFixtureId);
  const roomNames = useAppSelector(selectRoomNameById);

  return (
    <CollapsibleSection
      sectionKey="exitSigns"
      title="Exit signs"
      count={signs.length}
      hint="Emergency lights classified as exit signage."
      defaultOpen={false}
    >
      {signs.length === 0 ? (
        <em style={{ opacity: 0.5, fontSize: 11, color: '#64748B' }}>
          No exit-sign fixtures in this document.
        </em>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {signs.map((f) => {
            const isSelected = f.id === selectedId;
            const room = f.roomId ? roomNames[f.roomId] ?? f.roomId : '—';
            return (
              <button
                key={f.id}
                onClick={() =>
                  dispatch(setSelectedEmergencyFixtureId(isSelected ? null : f.id))
                }
                style={{
                  textAlign: 'left',
                  padding: '4px 6px',
                  background: isSelected ? 'rgba(56,189,248,0.12)' : 'transparent',
                  border: 'none',
                  borderLeft: '2px solid #38BDF8',
                  color: isSelected ? '#7DD3FC' : '#94a3b8',
                  fontWeight: isSelected ? 600 : 400,
                  fontSize: 11,
                  fontFamily: 'monospace',
                  borderRadius: 2,
                  cursor: 'pointer',
                }}
              >
                {f.productId?.slice(0, 8) ?? f.id.slice(0, 10)}{' '}
                <small style={{ color: '#64748b' }}>· {room}</small>
              </button>
            );
          })}
        </div>
      )}
    </CollapsibleSection>
  );
};

export default ExitSignListPanel;