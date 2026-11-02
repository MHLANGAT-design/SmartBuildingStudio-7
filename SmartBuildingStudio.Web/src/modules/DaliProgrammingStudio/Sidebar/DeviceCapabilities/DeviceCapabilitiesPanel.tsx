// src/modules/DaliProgrammingStudio/Sidebar/DeviceCapabilities/DeviceCapabilitiesPanel.tsx

import React, { useState } from 'react';
import { useAppSelector } from '@/Application/ConfigureStore';
import { selectApprovedDesign } from '@/modules/DaliProgrammingStudio/store/programmingSelectors';
import { ControlGearCapabilities } from '@/modules/DaliProgrammingStudio/Sidebar/DeviceCapabilities/ControlGearCapabilities';
import { ControlDeviceCapabilities } from '@/modules/DaliProgrammingStudio/Sidebar/DeviceCapabilities/ControlDeviceCapabilities';
import { DeviceTypeProfile } from '@/modules/DaliProgrammingStudio/Sidebar/DeviceCapabilities/DeviceTypeProfile';

export const DeviceCapabilitiesPanel: React.FC = () => {
  const design = useAppSelector(selectApprovedDesign);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | undefined>(undefined);

  if (!design) {
    return <div style={{ color: '#64748B', fontSize: 11, padding: 8 }}>No design loaded</div>;
  }

  const selected = design.devices.find(d => d.deviceId === selectedDeviceId) || design.devices[0];

  return (
    <div>
      <select
        value={selected?.deviceId ?? ''}
        onChange={e => setSelectedDeviceId(e.target.value)}
        style={{
          width: '100%',
          padding: '4px 8px',
          background: '#0F1424',
          color: '#E5E7EB',
          border: '1px solid #1F2937',
          borderRadius: 4,
          fontSize: 11,
          marginBottom: 8,
        }}
      >
        {design.devices.map(d => (
          <option key={d.deviceId} value={d.deviceId}>
            {d.logicalName}
          </option>
        ))}
      </select>

      {selected && (
        <>
          <DeviceTypeProfile device={selected} />
          {selected.role === 'CONTROL_GEAR' && <ControlGearCapabilities device={selected} />}
          {selected.role === 'CONTROL_DEVICE' && <ControlDeviceCapabilities device={selected} />}
        </>
      )}
    </div>
  );
};