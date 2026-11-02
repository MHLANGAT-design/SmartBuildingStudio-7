// src/modules/EmergencyLighting/Inspector/EmergencyFixtureInspector.tsx

import React from 'react';
import { useAppSelector } from '@/Application/ConfigureStore';
import {
  selectEmergencyFixtureById,
  selectRoomNameById,
} from '@/modules/EmergencyLighting/store/emergencySelectors';
import type { EmergencyOperationMode } from '@/modules/FixturePlacementStudio/models/EmergencyLight';

const MODE_LABEL: Record<EmergencyOperationMode, string> = {
  maintained: 'Maintained',
  'non-maintained': 'Non-maintained',
  combined: 'Combined',
  unknown: 'Unknown',
};

const Row: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 10 }}>
    <span style={{ color: '#64748B' }}>{label}</span>
    <span style={{ color: '#E2E8F0', textAlign: 'right' }}>{value}</span>
  </div>
);

export const EmergencyFixtureInspector: React.FC<{ fixtureId: string }> = ({ fixtureId }) => {
  const fixture = useAppSelector((s) => selectEmergencyFixtureById(s, fixtureId));
  const roomNames = useAppSelector(selectRoomNameById);

  if (!fixture) {
    return <div style={{ color: '#64748B', fontSize: 11 }}>Fixture not found.</div>;
  }

  // Cast to any because 'emergencyLight' was removed from the strict Fixture type
  // during the model consolidation refactor, but the data still exists at runtime.
  const el = (fixture as any).emergencyLight ?? {};
  
  const mode = (el.operationMode ?? 'unknown') as EmergencyOperationMode;
  const classification = el.classification ?? 'unknown';
  const autonomy = el.autonomyMinutes;
  const roomId = fixture.roomId ?? null;
  const roomName = roomId ? roomNames[roomId] ?? roomId : '—';
  const rotationDeg = ((fixture.rotation ?? 0) * 180) / Math.PI;

  return (
    <div
      style={{
        fontFamily: 'monospace',
        fontSize: 11,
        color: '#E2E8F0',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <div>
        <div style={{ fontWeight: 'bold', fontSize: 13 }}>
          {fixture.productId ?? fixture.id}
        </div>
        <div style={{ fontSize: 9, color: '#64748B', marginTop: 2 }}>
          {fixture.x.toFixed(0)}, {fixture.y.toFixed(0)} mm · {roomName}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <Row label="Kind" value={fixture.kind} />
        <Row label="Classification" value={classification} />
        <Row label="Operation mode" value={MODE_LABEL[mode]} />
        <Row label="Autonomy" value={autonomy != null ? `${autonomy} min` : '—'} />
        <Row
          label="Elevation"
          value={fixture.elevation != null ? `${fixture.elevation} m` : '—'}
        />
        <Row label="Rotation" value={`${rotationDeg.toFixed(0)}°`} />
        <Row
          label="Escape route"
          value={el.onEscapeRoute ? 'Yes' : '—'}
        />
      </div>
    </div>
  );
};

export default EmergencyFixtureInspector;