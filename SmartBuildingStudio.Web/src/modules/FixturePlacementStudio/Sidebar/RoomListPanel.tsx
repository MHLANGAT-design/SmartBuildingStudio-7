// src/modules/FixturePlacementStudio/Sidebar/RoomListPanel.tsx
//
// Room list — one row per room, with logical wall/door/window counts
// and average lux for that room.
//
// Logical counts come from roomTopology.ts, which in turn uses
// mergeElements.ts to collapse DXF fragments into symbols.

import React, { useMemo } from 'react';
import { useAppSelector, useAppDispatch } from '@/Application/ConfigureStore';
import {
  selectLayout,
  selectSelectedRoomId,
  selectLatestPhotometricCalculation,
} from '@/modules/FixturePlacementStudio/store/fixtureSelectors';
import { setSelectedRoomId } from '@/modules/FixturePlacementStudio/store/fixtureSlice';
import {
  buildRoomTopology,
  type RoomEntry,
} from '@/modules/FixturePlacementStudio/utils/roomTopology';
import type { DrawingDocument } from '@/modules/FloorPlanDesigner/Document/DrawingDocument';

interface RoomWithLux extends RoomEntry {
  averageLux: number | null;
}

// ─── Component ───────────────────────────────────────────────────────────────

export const RoomListPanel: React.FC = () => {
  const dispatch = useAppDispatch();
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
    if (!drawingDocument) return { rooms: [], byId: {} };
    return buildRoomTopology(drawingDocument);
  }, [drawingDocument]);

  const rooms: RoomWithLux[] = useMemo(() => {
    const samples =
      calculation?.result &&
      calculation.kind === 'illuminance-map' &&
      Array.isArray((calculation.result as any).samples)
        ? ((calculation.result as any).samples as Array<{
            x: number;
            y: number;
            lux: number;
          }>)
        : null;

    return topology.rooms.map((room) => {
      let averageLux: number | null = null;
      if (samples && samples.length > 0 && room.polygon.length >= 3) {
        let sum = 0;
        let count = 0;
        for (const s of samples) {
          if (pointInPolygon({ x: s.x, y: s.y }, room.polygon)) {
            sum += s.lux;
            count++;
          }
        }
        averageLux = count > 0 ? sum / count : 0;
      }
      return { ...room, averageLux };
    });
  }, [topology, calculation]);

  const handleSelect = (roomId: string) => {
    dispatch(setSelectedRoomId(roomId === selectedRoomId ? null : roomId));
  };

  if (!layout) return null;

  if (rooms.length === 0) {
    return (
      <div style={emptyState}>
        <div style={emptyTitle}>Rooms</div>
        <div style={emptyHint}>
          No room polygons in this document. Rooms are drawn in
          FloorPlanDesigner and appear here once the document is saved.
        </div>
      </div>
    );
  }

  return (
    <div style={root}>
      <div style={header}>
        <span style={title}>ROOMS ({rooms.length})</span>
      </div>
      <div style={list}>
        {rooms.map((room) => {
          const selected = room.roomId === selectedRoomId;

          // Compose the meta line: area, logical counts, optional
          // stair/handrail, optional lux.
          const parts: string[] = [];
          parts.push(`${room.areaM2.toFixed(1)} m²`);
          parts.push(`${room.logicalWallCount}w`);
          parts.push(`${room.logicalDoorCount}d`);
          parts.push(`${room.logicalWindowCount}win`);
          if (room.logicalStairCount > 0) parts.push(`${room.logicalStairCount}st`);
          if (room.logicalHandrailCount > 0) parts.push(`${room.logicalHandrailCount}hr`);
          if (room.averageLux != null) {
            parts.push(`${Math.round(room.averageLux)} lx`);
          }

          return (
            <button
              key={room.roomId}
              type="button"
              onClick={() => handleSelect(room.roomId)}
              style={{
                ...row,
                borderColor: selected ? '#38BDF8' : '#1E293B',
                background: selected
                  ? 'rgba(56, 189, 248, 0.10)'
                  : '#0B0F19',
              }}
            >
              <div style={rowName}>{room.name.toUpperCase()}</div>
              <div style={rowMeta}>{parts.join(' · ')}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ─── Local point-in-polygon ──────────────────────────────────────────────────

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
  gap: 6,
  width: '100%',
  marginTop: 12,
};

const header: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  paddingBottom: 4,
  borderBottom: '1px solid #1E293B',
};

const title: React.CSSProperties = {
  fontSize: 9,
  fontWeight: 'bold',
  color: '#64748B',
  letterSpacing: 1,
};

const list: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
};

const row: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'stretch',
  textAlign: 'left',
  gap: 2,
  padding: '6px 8px',
  border: '1px solid #1E293B',
  borderRadius: 4,
  cursor: 'pointer',
  color: '#E2E8F0',
  fontFamily: 'inherit',
  transition: 'background 0.1s, border-color 0.1s',
};

const rowName: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 600,
  color: '#E2E8F0',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const rowMeta: React.CSSProperties = {
  fontSize: 9,
  color: '#64748B',
  fontFamily: 'monospace',
};

const emptyState: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  padding: '8px 0',
};

const emptyTitle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 'bold',
  color: '#94A3B8',
};

const emptyHint: React.CSSProperties = {
  fontSize: 10,
  color: '#475569',
  lineHeight: 1.4,
};

export default RoomListPanel;