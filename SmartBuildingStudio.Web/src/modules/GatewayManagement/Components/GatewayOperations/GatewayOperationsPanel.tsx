// src/modules/GatewayManagement/Components/GatewayOperations/GatewayOperationsPanel.tsx

import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/Application/ConfigureStore';
import {
  selectOperationsForGateway,
  selectSelectedOperation,
  selectSelectedOperationId,
  selectSelectedGatewayId,
  selectAsyncFlags,
  selectErrors,
} from '@/modules/GatewayManagement/Store/gatewayManagementSelectors';
import {
  selectOperation as selectOperationAction,
} from '@/modules/GatewayManagement/Store/gatewayManagementSlice';
import { fetchGatewayOperations } from '@/modules/GatewayManagement/Store/gatewayManagementThunks';
import { OperationLog } from '@/modules/GatewayManagement/Components/GatewayOperations/OperationLog';
import { OperationDetails } from '@/modules/GatewayManagement/Components/GatewayOperations/OperationDetails';

interface Props {
  gatewayId?: string | null;
}

export const GatewayOperationsPanel: React.FC<Props> = ({ gatewayId }) => {
  const dispatch = useAppDispatch();
  const selectedGatewayId = useAppSelector(selectSelectedGatewayId);
  const targetId = gatewayId ?? selectedGatewayId;

  const operations = useAppSelector(selectOperationsForGateway(targetId));
  const selectedOperation = useAppSelector(selectSelectedOperation);
  const selectedOperationId = useAppSelector(selectSelectedOperationId);
  const asyncFlags = useAppSelector(selectAsyncFlags);
  const errors = useAppSelector(selectErrors);

  useEffect(() => {
    if (targetId) {
      void dispatch(fetchGatewayOperations({ gatewayId: targetId }));
    }
  }, [dispatch, targetId]);

  const handleSelect = (operationId: string) => {
    dispatch(selectOperationAction(operationId));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 16, height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 11, color: '#64748B', textTransform: 'uppercase' }}>
          Operations Log
        </div>
        <button
          onClick={() => {
            if (targetId) void dispatch(fetchGatewayOperations({ gatewayId: targetId }));
          }}
          disabled={asyncFlags.fetchOperations}
          style={{
            padding: '4px 10px',
            background: asyncFlags.fetchOperations ? '#1F2937' : '#1D4ED8',
            color: asyncFlags.fetchOperations ? '#64748B' : '#FFF',
            border: 'none',
            borderRadius: 4,
            fontSize: 11,
            cursor: asyncFlags.fetchOperations ? 'not-allowed' : 'pointer',
          }}
        >
          {asyncFlags.fetchOperations ? 'Loading…' : 'Refresh'}
        </button>
      </div>

      {errors.operations && (
        <div style={{
          padding: 8,
          background: '#3F1D1D',
          border: '1px solid #F87171',
          borderRadius: 4,
          color: '#F87171',
          fontSize: 11,
        }}>
          {errors.operations}
        </div>
      )}

      <div style={{ display: 'flex', flex: 1, minHeight: 0, gap: 12 }}>
        <div style={{ width: 320, flexShrink: 0, overflowY: 'auto' }}>
          <OperationLog
            operations={operations}
            selectedOperationId={selectedOperationId}
            onSelect={handleSelect}
          />
        </div>
        <div style={{ flex: 1, overflowY: 'auto', borderLeft: '1px solid #1F2937', paddingLeft: 12 }}>
          <OperationDetails operation={selectedOperation} />
        </div>
      </div>
    </div>
  );
};