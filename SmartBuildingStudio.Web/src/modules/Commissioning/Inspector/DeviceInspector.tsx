// src/modules/Commissioning/Inspector/DeviceInspector.tsx

import React from 'react';
import { useAppSelector } from '@/Application/ConfigureStore';
import { selectActiveSession } from '@/modules/Commissioning/store/commissioningSelectors';
import { useFloorplanDaliLines } from '@/modules/Commissioning/hooks/useFloorplanDaliLines';

interface Props {
  deviceId: string;
}

export const DeviceInspector: React.FC<Props> = ({ deviceId }) => {
  const session = useAppSelector(selectActiveSession);
  const device = session?.deviceStates[deviceId];

  // The loader already fetches the DALI lines; reuse it here so the
  // inspector can show the line's display name alongside its id.
  const { lines } = useFloorplanDaliLines();

  if (!device) {
    return <div style={{ color: '#64748B', fontSize: 11 }}>Device not found.</div>;
  }

  // The line the device was discovered on. Set by useDeviceDiscovery when
  // the device was merged into the session.
  const meta = (device as any).metadata ?? {};
  const lineId: string | null =
    meta.lineId ?? (device as any).lineId ?? null;

  // Human-readable line name (falls back to the id when the loader hasn't
  // resolved a name yet — e.g. before the floorplan finishes loading).
  const lineLabel = lineId
    ? lines.find((l) => l.lineId === lineId)?.name ?? lineId
    : null;

  // Optional niceties from the fixture record.
  const productName: string | null =
    meta.productName ?? meta.productId ?? null;
  const roomId: string | null = meta.roomId ?? null;

  return (
    <div style={{ fontSize: 11 }}>
      <div style={{ color: '#38BDF8', fontWeight: 'bold', marginBottom: 8 }}>
        {device.deviceId}
      </div>

      <Row label="Status" value={device.connectionStatus} />
      <Row label="Address" value={String(device.shortAddress ?? 'Unassigned')} />
      <Row
        label="DALI Line"
        value={
          lineId
            ? lineLabel && lineLabel !== lineId
              ? `${lineLabel} — ${lineId}`
              : lineId
            : 'Not discovered on a line'
        }
      />
      {productName && <Row label="Product" value={productName} />}
      {roomId && <Row label="Room" value={roomId} />}
      <Row label="Firmware" value={device.firmwareVersion ?? '—'} />
      <Row
        label="Last Response"
        value={
          device.lastResponseAt
            ? new Date(device.lastResponseAt).toLocaleTimeString()
            : '—'
        }
      />
    </div>
  );
};

const Row: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
    <span style={{ color: '#64748B' }}>{label}</span>
    <span
      style={{
        color: '#E5E7EB',
        fontFamily: 'monospace',
        textAlign: 'right',
        maxWidth: 180,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}
      title={value}
    >
      {value}
    </span>
  </div>
);