// src/modules/DeviceDiscovery/Components/DeviceIdentification/DeviceIdentificationResult.tsx

import React from 'react';
import type { DeviceIdentification } from '@/modules/DeviceDiscovery/Models/DeviceIdentification';

interface Props {
  identification: DeviceIdentification;
}

export const DeviceIdentificationResult: React.FC<Props> = ({ identification }) => {
  return (
    <div style={{
      background: '#0F1424',
      border: '1px solid #1F2937',
      borderRadius: 4,
      padding: 12,
    }}>
      <div style={{ fontSize: 10, color: '#64748B', marginBottom: 4 }}>Identification Result</div>
      <div style={{ fontSize: 12, color: '#E5E7EB', fontFamily: 'monospace', marginBottom: 8 }}>
        {identification.rawResponse}
      </div>
      <div style={{ fontSize: 11, color: '#64748B' }}>
        Confidence: <span style={{ color: '#4ADE80', fontWeight: 'bold' }}>
          {(identification.confidence * 100).toFixed(0)}%
        </span>
      </div>
      <div style={{ fontSize: 11, color: '#64748B', marginTop: 4 }}>
        Identified at: {new Date(identification.identifiedAt).toLocaleTimeString()}
      </div>
    </div>
  );
};