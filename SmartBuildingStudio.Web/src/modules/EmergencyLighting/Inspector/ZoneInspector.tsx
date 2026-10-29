// src/modules/EmergencyLighting/Inspector/ZoneInspector.tsx

import React from 'react';
import { useAppSelector } from '@/Application/ConfigureStore';
import {
  selectAllFixtures,
  selectAllZones,
  selectRoomNameById,
} from '@/modules/EmergencyLighting/store/emergencySelectors';

export const ZoneInspector: React.FC = () => {
  const zones = useAppSelector(selectAllZones);
  const fixtures = useAppSelector(selectAllFixtures);
  const roomNames = useAppSelector(selectRoomNameById);

  if (zones.length === 0) {
    return (
      <div style={{ padding: 12, fontFamily: 'monospace', fontSize: 11, color: '#64748B' }}>
        No lighting zones in this document.
        <div style={{ marginTop: 8, color: '#94A3B8', lineHeight: 1.5 }}>
          Zone authoring is not yet available in FixturePlacementStudio. When
          zones are saved to{' '}
          <b style={{ color: '#38BDF8' }}>PlacedFixturesJson.lightingZones</b>,
          they'll appear here.
        </div>
      </div>
    );
  }

  // Fixture membership lookup: zone.memberFixtureIds is authoritative.
  const fixtureById = new Map(fixtures.map((f) => [f.id, f]));

  return (
    <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#E2E8F0' }}>
      <div style={{ fontSize: 9, color: '#94A3B8', textTransform: 'uppercase', marginBottom: 8 }}>
        Zones ({zones.length})
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {zones.map((z) => {
          const memberFixtures = z.memberFixtureIds
            .map((id) => fixtureById.get(id))
            .filter((f): f is NonNullable<typeof f> => f !== undefined);
          const resolvedRoomNames = (z.roomIds ?? [])
            .map((id) => roomNames[id] ?? id)
            .join(', ');

          const borderColor =
            z.kind === 'emergency'
              ? '#EF4444'
              : z.kind === 'corridor'
              ? '#F59E0B'
              : '#10B981';

          return (
            <div
              key={z.id}
              style={{
                padding: 8,
                borderRadius: 3,
                background: 'rgba(30,41,59,0.5)',
                borderLeft: `3px solid ${borderColor}`,
              }}
            >
              <div style={{ fontWeight: 'bold', color: '#E2E8F0' }}>
                {z.name}
              </div>
              <div style={{ fontSize: 9, color: '#64748B', marginTop: 2 }}>
                {z.kind} · {z.mode}
              </div>
              <div style={{ fontSize: 10, marginTop: 4, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                <span style={{ color: '#94A3B8' }}>
                  Fixtures: <span style={{ color: '#E2E8F0' }}>{memberFixtures.length}</span>
                </span>
                {z.targetLux != null && (
                  <span style={{ color: '#94A3B8' }}>
                    Target: <span style={{ color: '#E2E8F0' }}>{z.targetLux} lx</span>
                  </span>
                )}
                {z.controlGroupId != null && (
                  <span style={{ color: '#94A3B8' }}>
                    Group: <span style={{ color: '#E2E8F0' }}>{z.controlGroupId}</span>
                  </span>
                )}
                {resolvedRoomNames && (
                  <span style={{ color: '#94A3B8' }}>
                    Rooms: <span style={{ color: '#E2E8F0' }}>{resolvedRoomNames}</span>
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ZoneInspector;