// src/modules/GatewayManagement/Components/GatewayOperations/OperationDetails.tsx

import React from 'react';
import type { GatewayOperation } from '@/modules/GatewayManagement/Models/GatewayOperation';
import { formatOperationDuration } from '@/modules/GatewayManagement/Models/GatewayOperation';

interface Props {
  operation: GatewayOperation | null;
}

export const OperationDetails: React.FC<Props> = ({ operation }) => {
  if (!operation) {
    return (
      <div style={{ padding: 16, fontSize: 11, color: '#64748B', textAlign: 'center' }}>
        Select an operation to see its details.
      </div>
    );
  }

  const row = (label: string, value: React.ReactNode, mono = true) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, gap: 8 }}>
      <span style={{ color: '#64748B' }}>{label}</span>
      <span style={{
        color: '#E5E7EB',
        fontFamily: mono ? 'monospace' : undefined,
        textAlign: 'right',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        maxWidth: 240,
      }}>
        {value ?? '—'}
      </span>
    </div>
  );

  const color = operation.succeeded ? '#4ADE80' : operation.completedAt ? '#F87171' : '#FBBF24';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 'bold', color: '#38BDF8' }}>
          {String(operation.operationType)}
        </div>
        <div style={{ fontSize: 10, color, fontWeight: 'bold', marginTop: 2 }}>
          {operation.succeeded ? 'SUCCESS' : operation.completedAt ? 'FAILED' : 'PENDING'}
          {' · '}
          {formatOperationDuration(operation)}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {row('Operation ID', operation.id)}
        {row('Started', new Date(operation.startedAt).toLocaleString())}
        {row(
          'Completed',
          operation.completedAt ? new Date(operation.completedAt).toLocaleString() : null
        )}
      </div>

      {operation.payload && (
        <div>
          <div style={{ fontSize: 10, color: '#64748B', textTransform: 'uppercase', marginBottom: 4 }}>
            Payload
          </div>
          <pre style={{
            margin: 0,
            padding: 8,
            background: '#0A0F1E',
            border: '1px solid #1F2937',
            borderRadius: 4,
            color: '#E5E7EB',
            fontSize: 10,
            fontFamily: 'monospace',
            overflow: 'auto',
            maxHeight: 160,
          }}>
            {operation.payload}
          </pre>
        </div>
      )}

      {operation.result && (
        <div>
          <div style={{ fontSize: 10, color: '#64748B', textTransform: 'uppercase', marginBottom: 4 }}>
            Result
          </div>
          <pre style={{
            margin: 0,
            padding: 8,
            background: '#0A0F1E',
            border: '1px solid #1F2937',
            borderRadius: 4,
            color: '#4ADE80',
            fontSize: 10,
            fontFamily: 'monospace',
            overflow: 'auto',
            maxHeight: 160,
          }}>
            {operation.result}
          </pre>
        </div>
      )}

      {operation.errorMessage && (
        <div style={{
          padding: 8,
          background: '#3F1D1D',
          border: '1px solid #F87171',
          borderRadius: 4,
          color: '#F87171',
          fontSize: 11,
        }}>
          {operation.errorMessage}
        </div>
      )}
    </div>
  );
};