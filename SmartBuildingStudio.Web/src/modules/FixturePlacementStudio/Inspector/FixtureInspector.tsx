// src/modules/FixturePlacementStudio/Inspector/FixtureInspector.tsx
//
// Right-sidebar inspector for the currently selected fixture.
//
// Reads the first id from state.fixture.selectedFixtureIds, looks the
// fixture up in the layout, and renders its properties grouped by
// category. Read-only in v1.0 — editing fields will come after the
// module has been used enough to know which fields matter.
//
// Room association is displayed by NAME (looked up from the loaded
// DrawingDocument) rather than by the internal room id. The id is
// preserved on the fixture for save/reload; only the display is
// human-friendly.

import React, { useMemo } from 'react';
import { useAppSelector } from '@/Application/ConfigureStore';
import {
  selectLayout,
  selectSelectedFixtureIds,
} from '@/modules/FixturePlacementStudio/store/fixtureSelectors';
import type { Fixture } from '@/modules/FixturePlacementStudio/models/Fixture';
import type { DrawingDocument } from '@/modules/FloorPlanDesigner/Document/DrawingDocument';
import {
  KIND_COLORS,
  KIND_LABELS,
} from '@/modules/FixturePlacementStudio/constants/fixtureKindVisuals';

// ─── Component ───────────────────────────────────────────────────────────────

export const FixtureInspector: React.FC = () => {
  const layout = useAppSelector(selectLayout);
  const selectedIds = useAppSelector(selectSelectedFixtureIds);

  const fixture: Fixture | undefined =
    layout && selectedIds.length > 0
      ? layout.fixtures.find((f) => f.id === selectedIds[0])
      : undefined;

  // ── Reach into the SessionRegistry for the loaded DrawingDocument.
  //    Needed to resolve roomId → room name. Non-serializable, so it
  //    lives outside Redux.
  const drawingDocument: DrawingDocument | null = useMemo(() => {
    if (!layout) return null;
    const reg = (window as any).__fixtureSessionRegistry;
    if (!reg) return null;
    const session = reg.get?.(layout.documentId);
    return session?.fixtureDocument?.getDrawingDocument?.() ?? null;
  }, [layout]);

  // ── Resolve the room name for the selected fixture, if it has a roomId.
  const roomName = useMemo(() => {
    if (!fixture?.roomId || !drawingDocument) return null;
    const elements = drawingDocument.getElements();
    for (const el of elements as any[]) {
      if (!el) continue;
      const t = String(el.type ?? '').toLowerCase();
      const isRoom = t === 'room' || t === 'rooms' || el.isRoom === true;
      if (!isRoom) continue;
      const id = String(el.id ?? el.Id ?? '');
      if (id === fixture.roomId) {
        return String(el.name ?? 'Unnamed Room');
      }
    }
    return null;
  }, [fixture?.roomId, drawingDocument]);

  // ── Empty states ─────────────────────────────────────────────────
  if (!layout) {
    return (
      <div style={emptyState}>
        <div style={emptyTitle}>Inspector</div>
        <div style={emptyHint}>No document loaded.</div>
      </div>
    );
  }

  if (!fixture) {
    return (
      <div style={emptyState}>
        <div style={emptyTitle}>Inspector</div>
        <div style={emptyHint}>
          {selectedIds.length > 0
            ? 'Selected fixture not found in layout.'
            : 'Select a fixture on the canvas to see its properties.'}
        </div>
      </div>
    );
  }

  // ── Fixture header ───────────────────────────────────────────────
  const kindColor = KIND_COLORS[fixture.kind];

  // Room display: name when resolvable, "— unassigned" when absent,
  // raw id as a fallback if the room was deleted from the plan.
  const roomDisplay = fixture.roomId
    ? roomName ?? fixture.roomId
    : '— unassigned';

  return (
    <div style={root}>
      {/* Header */}
      <div style={headerRow}>
        <span
          style={{
            ...kindDot,
            background: kindColor,
          }}
        >
          {KIND_LABELS[fixture.kind].charAt(0)}
        </span>
        <span style={kindLabel}>{KIND_LABELS[fixture.kind]}</span>
      </div>

      {/* Identity */}
      <Section title="IDENTITY">
        <Row label="ID" value={fixture.id} mono truncate />
        <Row label="Product" value={fixture.productId} mono truncate />
      </Section>

      {/* Position */}
      <Section title="POSITION">
        <Row label="X" value={`${fixture.x.toFixed(2)} mm`} mono />
        <Row label="Y" value={`${fixture.y.toFixed(2)} mm`} mono />
        <Row
          label="Rotation"
          value={`${fixture.rotation.toFixed(4)} rad (${radiansToDegrees(fixture.rotation).toFixed(1)}°)`}
          mono
        />
        <Row
          label="Elevation"
          value={`${(fixture.elevation ?? 0).toFixed(2)} m`}
          mono
        />
      </Section>

      {/* Association */}
      <Section title="ASSOCIATION">
        <Row label="Layer" value={fixture.layerId ?? 'fixtures'} mono />
        <Row
          label="Room"
          value={roomDisplay}
          mono
          muted={!fixture.roomId}
        />
      </Section>

      {/* Kind-specific — only render when there's data to show */}
      {fixture.kind === 'luminaire' && fixture.luminaire && (
        <LuminaireSection fixture={fixture} />
      )}
      {fixture.kind === 'sensor' && fixture.sensor && (
        <SensorSection fixture={fixture} />
      )}
      {fixture.kind === 'emergencyLight' && fixture.emergencyLight && (
        <EmergencySection fixture={fixture} />
      )}
      {fixture.kind === 'driver' && fixture.driver && (
        <DriverSection fixture={fixture} />
      )}
      {fixture.kind === 'powerSupply' && fixture.powerSupply && (
        <PowerSupplySection fixture={fixture} />
      )}
      {fixture.kind === 'controller' && fixture.controller && (
        <ControllerSection fixture={fixture} />
      )}
      {fixture.kind === 'gateway' && fixture.gateway && (
        <GatewaySection fixture={fixture} />
      )}
      {fixture.kind === 'switch' && fixture.switch && (
        <SwitchSection fixture={fixture} />
      )}

      {/* Free-form properties — only if any */}
      {fixture.properties && Object.keys(fixture.properties).length > 0 && (
        <Section title="PROPERTIES">
          {Object.entries(fixture.properties).map(([k, v]) => (
            <Row key={k} label={k} value={formatValue(v)} mono />
          ))}
        </Section>
      )}
    </div>
  );
};

// ─── Kind-specific sections ──────────────────────────────────────────────────

const LuminaireSection: React.FC<{ fixture: Fixture }> = ({ fixture }) => {
  const l = fixture.kind === 'luminaire' ? fixture.luminaire : null;
  if (!l) return null;

  const entries = compactEntries([
    ['Mounting', l.mounting],
    ['Protocol', l.dimmingProtocol],
    ['Lighting Group', l.lightingGroup],
    ['Aim Angle', l.aimAngle != null ? `${l.aimAngle.toFixed(4)} rad` : undefined],
    ['Tilt Angle', l.tiltAngle != null ? `${l.tiltAngle.toFixed(4)} rad` : undefined],
  ]);

  if (entries.length === 0) return null;

  return (
    <Section title="LUMINAIRE">
      {entries.map(([label, value]) => (
        <Row key={label} label={label} value={value} mono />
      ))}
    </Section>
  );
};

const SensorSection: React.FC<{ fixture: Fixture }> = ({ fixture }) => {
  const s = fixture.kind === 'sensor' ? fixture.sensor : null;
  if (!s) return null;

  const entries = compactEntries([
    ['Sensor Type', s.sensorType],
    ['Mounting', s.mounting],
    ['Coverage', s.coverageRadius != null ? `${s.coverageRadius.toFixed(2)} m` : undefined],
    ['Sensitivity', s.sensitivity != null ? `${(s.sensitivity * 100).toFixed(0)}%` : undefined],
  ]);

  if (entries.length === 0) return null;

  return (
    <Section title="SENSOR">
      {entries.map(([label, value]) => (
        <Row key={label} label={label} value={value} mono />
      ))}
    </Section>
  );
};

const EmergencySection: React.FC<{ fixture: Fixture }> = ({ fixture }) => {
  const e = fixture.kind === 'emergencyLight' ? fixture.emergencyLight : null;
  if (!e) return null;

  const entries = compactEntries([
    ['Mode', e.operationMode],
    ['Autonomy', e.autonomyMinutes != null ? `${e.autonomyMinutes} min` : undefined],
    ['Classification', e.classification],
    ['On Escape Route', e.onEscapeRoute != null ? (e.onEscapeRoute ? 'Yes' : 'No') : undefined],
  ]);

  if (entries.length === 0) return null;

  return (
    <Section title="EMERGENCY">
      {entries.map(([label, value]) => (
        <Row key={label} label={label} value={value} mono />
      ))}
    </Section>
  );
};

const DriverSection: React.FC<{ fixture: Fixture }> = ({ fixture }) => {
  const d = fixture.kind === 'driver' ? fixture.driver : null;
  if (!d) return null;

  const entries = compactEntries([
    ['Protocol', d.protocol],
    ['Mounting', d.mounting],
    ['Channels', d.channelCount],
    ['Dimmable', d.dimmable != null ? (d.dimmable ? 'Yes' : 'No') : undefined],
    ['Output Current', d.outputCurrentMa != null ? `${d.outputCurrentMa} mA` : undefined],
    [
      'Assignments',
      d.channelAssignments
        ? `${Object.keys(d.channelAssignments).length} channels mapped`
        : undefined,
    ],
  ]);

  if (entries.length === 0) return null;

  return (
    <Section title="DRIVER">
      {entries.map(([label, value]) => (
        <Row key={label} label={label} value={value} mono />
      ))}
    </Section>
  );
};

const PowerSupplySection: React.FC<{ fixture: Fixture }> = ({ fixture }) => {
  const p = fixture.kind === 'powerSupply' ? fixture.powerSupply : null;
  if (!p) return null;

  const entries = compactEntries([
    ['Type', p.supplyType],
    ['Output Voltage', p.outputVoltage != null ? `${p.outputVoltage} V` : undefined],
    ['Output Current', p.outputCurrentA != null ? `${p.outputCurrentA} A` : undefined],
    ['Power Rating', p.powerRatingW != null ? `${p.powerRatingW} W` : undefined],
    ['IP Rating', p.ipRating],
  ]);

  if (entries.length === 0) return null;

  return (
    <Section title="POWER SUPPLY">
      {entries.map(([label, value]) => (
        <Row key={label} label={label} value={value} mono />
      ))}
    </Section>
  );
};

const ControllerSection: React.FC<{ fixture: Fixture }> = ({ fixture }) => {
  const c = fixture.kind === 'controller' ? fixture.controller : null;
  if (!c) return null;

  const entries = compactEntries([
    ['Protocol', c.protocol],
    ['Application', c.applicationType],
    ['Max Devices', c.maxDevices],
    ['Address', c.address],
  ]);

  if (entries.length === 0) return null;

  return (
    <Section title="CONTROLLER">
      {entries.map(([label, value]) => (
        <Row key={label} label={label} value={value} mono />
      ))}
    </Section>
  );
};

const GatewaySection: React.FC<{ fixture: Fixture }> = ({ fixture }) => {
  const g = fixture.kind === 'gateway' ? fixture.gateway : null;
  if (!g) return null;

  const entries = compactEntries([
    ['Downstream', g.downstreamProtocol],
    ['Uplink', g.uplinkType],
    ['IP Address', g.ipAddress],
    ['Channels', g.channelCount],
  ]);

  if (entries.length === 0) return null;

  return (
    <Section title="GATEWAY">
      {entries.map(([label, value]) => (
        <Row key={label} label={label} value={value} mono />
      ))}
    </Section>
  );
};

const SwitchSection: React.FC<{ fixture: Fixture }> = ({ fixture }) => {
  const s = fixture.kind === 'switch' ? fixture.switch : null;
  if (!s) return null;

  const entries = compactEntries([
    ['Type', s.switchType],
    ['Mounting', s.mounting],
    ['Gangs', s.gangCount],
    ['Rated Current', s.ratedCurrentA != null ? `${s.ratedCurrentA} A` : undefined],
    ['Illuminated', s.illuminated != null ? (s.illuminated ? 'Yes' : 'No') : undefined],
  ]);

  if (entries.length === 0) return null;

  return (
    <Section title="SWITCH">
      {entries.map(([label, value]) => (
        <Row key={label} label={label} value={value} mono />
      ))}
    </Section>
  );
};

// ─── Primitives ──────────────────────────────────────────────────────────────

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => (
  <div style={section}>
    <div style={sectionTitle}>{title}</div>
    <div style={sectionBody}>{children}</div>
  </div>
);

const Row: React.FC<{
  label: string;
  value: string;
  mono?: boolean;
  muted?: boolean;
  truncate?: boolean;
}> = ({ label, value, mono, muted, truncate }) => (
  <div style={row}>
    <span style={rowLabel}>{label}</span>
    <span
      style={{
        ...rowValue,
        fontFamily: mono ? 'monospace' : 'inherit',
        color: muted ? '#475569' : '#E2E8F0',
        overflow: truncate ? 'hidden' : 'visible',
        textOverflow: truncate ? 'ellipsis' : 'clip',
        whiteSpace: truncate ? 'nowrap' : 'normal',
      }}
      title={truncate ? value : undefined}
    >
      {value}
    </span>
  </div>
);

// ─── Helpers ─────────────────────────────────────────────────────────────────

function radiansToDegrees(rad: number): number {
  return (rad * 180) / Math.PI;
}

function compactEntries(
  entries: Array<[string, string | number | undefined | null]>
): Array<[string, string]> {
  const out: Array<[string, string]> = [];
  for (const [label, value] of entries) {
    if (value === undefined || value === null || value === '') continue;
    out.push([label, String(value)]);
  }
  return out;
}

function formatValue(v: unknown): string {
  if (v === null || v === undefined) return '—';
  if (typeof v === 'string') return v;
  if (typeof v === 'number') return String(v);
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const root: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  width: '100%',
};

const headerRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  paddingBottom: 8,
  borderBottom: '1px solid #1E293B',
};

const kindDot: React.CSSProperties = {
  width: 22,
  height: 22,
  borderRadius: '50%',
  color: '#0A0A0A',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 'bold',
  fontSize: 11,
  flexShrink: 0,
};

const kindLabel: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 'bold',
  color: '#E2E8F0',
  fontFamily: 'monospace',
  letterSpacing: 0.5,
};

const section: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
};

const sectionTitle: React.CSSProperties = {
  fontSize: 9,
  fontWeight: 'bold',
  color: '#64748B',
  letterSpacing: 1,
  textTransform: 'uppercase',
  marginBottom: 2,
};

const sectionBody: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 3,
};

const row: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'baseline',
  gap: 8,
  fontSize: 10,
  minHeight: 14,
};

const rowLabel: React.CSSProperties = {
  color: '#64748B',
  flexShrink: 0,
};

const rowValue: React.CSSProperties = {
  color: '#E2E8F0',
  fontSize: 10,
  textAlign: 'right',
  minWidth: 0,
  flex: 1,
};

const emptyState: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  width: '100%',
};

const emptyTitle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 'bold',
  color: '#94A3B8',
};

const emptyHint: React.CSSProperties = {
  fontSize: 10,
  color: '#475569',
  lineHeight: 1.4,
};

export default FixtureInspector;