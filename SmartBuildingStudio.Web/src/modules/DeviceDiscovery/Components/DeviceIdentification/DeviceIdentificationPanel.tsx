// src/modules/DeviceDiscovery/Components/DeviceIdentification/DeviceIdentificationPanel.tsx

import React from 'react';
import { useAppSelector } from '@/Application/ConfigureStore';
import { selectSelectedDeviceId } from '@/modules/DeviceDiscovery/Store/deviceDiscoverySelectors';
import { useDeviceIdentification } from '@/modules/DeviceDiscovery/Hooks/useDeviceIdentification';
import { DeviceIdentificationResult } from '@/modules/DeviceDiscovery/Components/DeviceIdentification/DeviceIdentificationResult';
import { DeviceAddressInformation } from '@/modules/DeviceDiscovery/Components/DeviceIdentification/DeviceAddressInformation';

export const DeviceIdentificationPanel: React.FC = () => {
  const selectedId = useAppSelector(selectSelectedDeviceId);
  const { result, isIdentifying, identify } = useDeviceIdentification();

  return (
    <div style={{ padding: 16 }}>
      <div style={{
        fontSize: 11,
        fontWeight: 'bold',
        color: '#38BDF8',
        marginBottom: 12,
        textTransform: 'uppercase',
      }}>
        Device Identification
      </div>

      {!selectedId ? (
        <div style={{ color: '#64748B', fontSize: 12 }}>
          Select a discovered device to identify it.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 12, color: '#E5E7EB' }}>
            Target: <span style={{ fontFamily: 'monospace', color: '#94A3B8' }}>{selectedId}</span>
          </div>

          <button
            onClick={() => identify(selectedId)}
            disabled={isIdentifying}
            style={{
              padding: '6px 12px',
              background: isIdentifying ? '#1F2937' : '#1D4ED8',
              color: isIdentifying ? '#64748B' : '#FFF',
              border: 'none',
              borderRadius: 4,
              fontSize: 11,
              fontWeight: 'bold',
              cursor: isIdentifying ? 'not-allowed' : 'pointer',
            }}
          >
            {isIdentifying ? 'Identifying…' : 'Identify Device'}
          </button>

          {result && (
            <>
              <DeviceIdentificationResult identification={result} />
              <DeviceAddressInformation identification={result} />
            </>
          )}
        </div>
      )}
    </div>
  );
};