// src/modules/GatewayManagement/Components/GatewayEvents/EventLog.tsx

import React from 'react';
import { useAppSelector } from '@/Application/ConfigureStore';
import { selectSelectedGatewayId } from '@/modules/GatewayManagement/Store/gatewayManagementSelectors';

/**
 * The backend does not (yet) expose a per-gateway events endpoint. This
 * component renders the connection history as the primary event source,
 * plus any operation event that succeeded/failed. When the backend adds a
 * dedicated /events endpoint, replace the derived list below with a
 * fetchGatewayEvents thunk.
 */

interface EventEntry {
  id: string;
  type: string;
  message: string;
  occurredAt: string;
  severity: 'info' | 'warn' | 'error';
}

export const EventLog: React.FC = () => {
  const selectedGatewayId = useAppSelector(selectSelectedGatewayId);
  const connections = useAppSelector(s =>
    selectedGatewayId
      ? s.gatewayManagement.connectionsByGatewayId[selectedGatewayId] ?? []
      : []
  );
  const operations = useAppSelector(s =>
    selectedGatewayId
      ? s.gatewayManagement.operationsByGatewayId[selectedGatewayId] ?? []
      : []
  );

  const events: EventEntry[] = [];

  for (const c of connections) {
    events.push({
      id: `conn-open-${c.id}`,
      type: 'Connected',
      message: `Connection opened${c.remoteEndpoint ? ` to ${c.remoteEndpoint}` : ''}`,
      occurredAt: c.connectedAt,
      severity: 'info',
    });
    if (c.disconnectedAt) {
      events.push({
        id: `conn-close-${c.id}`,
        type: 'Disconnected',
        message: c.disconnectReason ?? 'Connection closed',
        occurredAt: c.disconnectedAt,
        severity: c.disconnectReason ? 'warn' : 'info',
      });
    }
  }

  for (const op of operations) {
    if (!op.completedAt) continue;
    events.push({
      id: `op-${op.id}`,
      type: String(op.operationType),
      message: op.succeeded
        ? `${op.operationType} succeeded`
        : op.errorMessage ?? `${op.operationType} failed`,
      occurredAt: op.completedAt,
      severity: op.succeeded ? 'info' : 'error',
    });
  }

  events.sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));

  if (events.length === 0) {
    return (
      <div style={{ padding: 16, fontSize: 11, color: '#64748B', textAlign: 'center' }}>
        No events recorded yet.
      </div>
    );
  }

  const SEVERITY_COLOR: Record<EventEntry['severity'], string> = {
    info: '#38BDF8',
    warn: '#FBBF24',
    error: '#F87171',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 400, overflowY: 'auto' }}>
      {events.map(ev => (
        <div
          key={ev.id}
          style={{
            padding: '6px 10px',
            background: '#0F1424',
            border: '1px solid #1F2937',
            borderLeft: `3px solid ${SEVERITY_COLOR[ev.severity]}`,
            borderRadius: 4,
            fontSize: 11,
            display: 'flex',
            justifyContent: 'space-between',
            gap: 8,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
            <span style={{ color: SEVERITY_COLOR[ev.severity], fontWeight: 'bold' }}>
              {ev.type}
            </span>
            <span style={{ color: '#94A3B8', fontSize: 10 }}>{ev.message}</span>
          </div>
          <span style={{ color: '#64748B', fontSize: 10, fontFamily: 'monospace', flexShrink: 0 }}>
            {new Date(ev.occurredAt).toLocaleTimeString()}
          </span>
        </div>
      ))}
    </div>
  );
};