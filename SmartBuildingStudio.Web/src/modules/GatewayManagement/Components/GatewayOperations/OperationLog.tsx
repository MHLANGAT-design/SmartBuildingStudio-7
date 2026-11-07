// src/modules/GatewayManagement/Components/GatewayOperations/OperationLog.tsx

import React from 'react';
import type { GatewayOperation } from '@/modules/GatewayManagement/Models/GatewayOperation';
import { formatOperationDuration, isOperationComplete } from '@/modules/GatewayManagement/Models/GatewayOperation';

interface Props {
  operations: GatewayOperation[];
  selectedOperationId: string | null;
  onSelect: (operationId: string) => void;
}

export const OperationLog: React.FC<Props> = ({ operations, selectedOperationId, onSelect }) => {
  if (operations.length === 0) {
    return (
      <div style={{ padding: 16, fontSize: 11, color: '#64748B', textAlign: 'center' }}>
        No operations recorded yet.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 320, overflowY: 'auto' }}>
      {operations.map(op => {
        const selected = op.id === selectedOperationId;
        const color = op.succeeded ? '#4ADE80' : isOperationComplete(op) ? '#F87171' : '#FBBF24';
        return (
          <div
            key={op.id}
            onClick={() => onSelect(op.id)}
            style={{
              padding: '6px 10px',
              background: selected ? '#0EA5E915' : 'transparent',
              border: '1px solid',
              borderColor: selected ? '#38BDF8' : '#1F2937',
              borderRadius: 4,
              fontSize: 11,
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              gap: 8,
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
              <span style={{ color: '#E5E7EB', fontWeight: 'bold' }}>
                {String(op.operationType)}
              </span>
              <span style={{ color: '#64748B', fontSize: 10, fontFamily: 'monospace' }}>
                {new Date(op.startedAt).toLocaleString()}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
              <span style={{ color, fontWeight: 'bold', fontSize: 10 }}>
                {op.succeeded ? 'SUCCESS' : isOperationComplete(op) ? 'FAILED' : 'PENDING'}
              </span>
              <span style={{ color: '#64748B', fontSize: 10, fontFamily: 'monospace' }}>
                {formatOperationDuration(op)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};