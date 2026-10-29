// src/modules/EmergencyLighting/Sidebar/ZoneListPanel.tsx

import React from 'react';
import { useAppDispatch, useAppSelector } from '@/Application/ConfigureStore';
import { setSelectedZoneId } from '@/modules/EmergencyLighting/store/emergencySlice';
import {
  selectAllZones,
  selectSelectedZoneId,
} from '@/modules/EmergencyLighting/store/emergencySelectors';
import { CollapsibleSection } from '@/modules/EmergencyLighting/Sidebar/CollapsibleSection';

export const ZoneListPanel: React.FC = () => {
  const dispatch = useAppDispatch();
  const zones = useAppSelector(selectAllZones);
  const selectedId = useAppSelector(selectSelectedZoneId);

  return (
    <CollapsibleSection
      sectionKey="zones"
      title="Lighting zones"
      count={zones.length}
      hint="Authored in FixturePlacementStudio. Grouped fixtures for control and analysis."
      defaultOpen={false}
    >
      {zones.length === 0 ? (
        <em style={{ opacity: 0.5, fontSize: 11, color: '#64748B' }}>
          No lighting zones in this document.
        </em>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {zones.map((z) => {
            const isSelected = z.id === selectedId;
            const borderColor =
              z.kind === 'emergency'
                ? '#EF4444'
                : z.kind === 'corridor'
                ? '#F59E0B'
                : '#10B981';
            return (
              <button
                key={z.id}
                onClick={() => dispatch(setSelectedZoneId(isSelected ? null : z.id))}
                style={{
                  textAlign: 'left',
                  padding: '4px 6px',
                  background: isSelected ? 'rgba(56,189,248,0.12)' : 'transparent',
                  border: 'none',
                  borderLeft: `2px solid ${borderColor}`,
                  color: isSelected ? '#7DD3FC' : '#94a3b8',
                  fontWeight: isSelected ? 600 : 400,
                  fontSize: 11,
                  fontFamily: 'monospace',
                  borderRadius: 2,
                  cursor: 'pointer',
                }}
              >
                {z.name}{' '}
                <small style={{ color: '#64748b' }}>
                  ({z.memberFixtureIds.length})
                </small>
              </button>
            );
          })}
        </div>
      )}
    </CollapsibleSection>
  );
};

export default ZoneListPanel;