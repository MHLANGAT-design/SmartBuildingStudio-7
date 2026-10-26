// src/modules/FixturePlacementStudio/Inspector/RoomInspector.tsx
//
// Inspector panel shown when a room is selected. Displays name, area,
// perimeter, logical wall/door/window/column counts, and per-room lux
// statistics if a calculation has completed.

import React, { useMemo } from 'react';
import { useAppSelector } from '@/Application/ConfigureStore';
import {
  selectLayout,
  selectSelectedRoomId,
  selectLatestPhotometricCalculation,
} from '@/modules/FixturePlacementStudio/store/fixtureSelectors';
import { buildRoomTopology } from '@/modules/FixturePlacementStudio/utils/roomTopology';
import type { DrawingDocument } from '@/modules/FloorPlanDesigner/Document/DrawingDocument';

export const RoomInspector: React.FC = () => {
  const layout = useAppSelector(selectLayout);
  const selectedRoomId = useAppSelector(selectSelectedRoomId);
  const calculation = useAppSelector(selectLatestPhotometricCalculation);

  const drawingDocument = useMemo<DrawingDocument | null>(() => {
    if (!layout) return null;
    const reg = (window as any).__fixtureSessionRegistry;
    if (!reg) return null;
    const session = reg.get?.(layout.documentId);
    return session?.fixtureDocument?.getDrawingDocument?.() ?? null;
  }, [layout]);

  const topology = useMemo(() => {
    if (!drawingDocument) return { rooms: [], byId: {} as any };
    return buildRoomTopology(drawingDocument);
  }, [drawingDocument]);

  const room = selectedRoomId ? topology.byId[selectedRoomId] : null;

  const stats = useMemo(() => {
    if (!room || !calculation?.result) return null;
    const result: any = calculation.result;
    const samples: Array<{ x: number; y: number; lux: number }> =
      Array.isArray(result.samples) ? result.samples : [];
    if (samples.length === 0 || room.polygon.length < 3) return null;

    let sum = 0, min = Infinity, max = -Infinity, count = 0;
    for (const s of samples) {
      if (!pointInPolygon({ x: s.x, y: s.y }, room.polygon)) continue;
      sum += s.lux;
      if (s.lux < min) min = s.lux;
      if (s.lux > max) max = s.lux;
      count++;
    }
    if (count === 0) return null;
    const average = sum / count;
    return {
      count,
      average,
      min,
      max,
      uniformity: average > 0 ? min / average : undefined,
    };
  }, [room, calculation]);

  if (!room) return null;

  return (
    <div style={root}>
      <div style={header}>
        <span style={icon}>▭</span>
        <span style={title}>Room</span>
      </div>

      <Section title="IDENTITY">
        <Row label="Name" value={room.name} />
        <Row label="ID" value={room.roomId} mono truncate />
      </Section>

      <Section title="GEOMETRY">
        <Row label="Area" value={`${room.areaM2.toFixed(2)} m²`} mono />
        <Row label="Perimeter" value={`${room.perimeterMeters.toFixed(2)} m`} mono />
        <Row label="Vertices" value={String(room.polygon.length)} mono />
      </Section>

      <Section title="BOUNDARY">
        <Row label="Walls" value={String(room.logicalWallCount)} mono />
        <Row label="Doors" value={String(room.logicalDoorCount)} mono />
        <Row label="Windows" value={String(room.logicalWindowCount)} mono />
        {room.logicalStairCount > 0 && (
          <Row label="Stairs" value={String(room.logicalStairCount)} mono />
        )}
        {room.logicalHandrailCount > 0 && (
          <Row label="Handrails" value={String(room.logicalHandrailCount)} mono />
        )}
        <div style={fragLine}>
          Fragments: {room.wallFragmentIds.length}w ·{' '}
          {room.doorFragmentIds.length}d · {room.windowFragmentIds.length}win
          {room.unknownFragmentIds.length > 0
            ? ` · ${room.unknownFragmentIds.length}u`
            : ''}
        </div>
      </Section>

      {stats ? (
        <Section title="ILLUMINANCE">
          <Row label="Average" value={`${Math.round(stats.average)} lx`} mono />
          <Row label="Min" value={`${stats.min.toFixed(1)} lx`} mono />
          <Row label="Max" value={`${stats.max.toFixed(1)} lx`} mono />
          <Row
            label="Uniformity"
            value={
              stats.uniformity != null
                ? `${(stats.uniformity * 100).toFixed(0)}%`
                : '—'
            }
            mono
          />
          <Row label="Samples" value={String(stats.count)} mono muted />
        </Section>
      ) : (
        <Section title="ILLUMINANCE">
          <div style={hint}>Run Calculate Lux to see per-room stats.</div>
        </Section>
      )}
    </div>
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

function pointInPolygon(
  p: { x: number; y: number },
  poly: { x: number; y: number }[]
): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x, yi = poly[i].y;
    const xj = poly[j].x, yj = poly[j].y;
    const intersect =
      yi > p.y !== yj > p.y &&
      p.x < ((xj - xi) * (p.y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const root: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  width: '100%',
};

const header: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  paddingBottom: 8,
  borderBottom: '1px solid #1E293B',
};

const icon: React.CSSProperties = {
  width: 22,
  height: 22,
  borderRadius: 3,
  background: 'rgba(74, 222, 128, 0.15)',
  border: '1px solid rgba(74, 222, 128, 0.4)',
  color: '#4ADE80',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 12,
  flexShrink: 0,
};

const title: React.CSSProperties = {
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

const fragLine: React.CSSProperties = {
  fontSize: 9,
  color: '#475569',
  fontFamily: 'monospace',
  marginTop: 4,
  paddingTop: 4,
  borderTop: '1px dashed rgba(71, 85, 105, 0.4)',
};

const hint: React.CSSProperties = {
  fontSize: 10,
  color: '#475569',
  lineHeight: 1.4,
};

export default RoomInspector;