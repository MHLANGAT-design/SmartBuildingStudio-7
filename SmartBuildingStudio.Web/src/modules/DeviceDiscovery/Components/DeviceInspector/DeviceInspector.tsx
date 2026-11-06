// src/modules/DeviceDiscovery/Components/DeviceInspector/DeviceInspector.tsx

import React from 'react';
import { useAppSelector } from '@/Application/ConfigureStore';
import {
  selectDiscoveredDevices,
  selectSelectedDeviceId,
} from '@/modules/DeviceDiscovery/Store/deviceDiscoverySelectors';
import { DeviceProperties } from '@/modules/DeviceDiscovery/Components/DeviceInspector/DeviceProperties';
import { DeviceCapabilities } from '@/modules/DeviceDiscovery/Components/DeviceInspector/DeviceCapabilities';
import { DeviceCommunicationStatus } from '@/modules/DeviceDiscovery/Components/DeviceInspector/DeviceCommunicationStatus';

export const DeviceInspector: React.FC = () => {
  const devices = useAppSelector(selectDiscoveredDevices);
  const selectedId = useAppSelector(selectSelectedDeviceId);
  const device = devices.find(d => d.deviceId === selectedId);

  return (
    <div style={{ padding: 16 }}>
      <div style={{ fontSize: 11, fontWeight: 'bold', color: '#38BDF8', marginBottom: 12, textTransform: 'uppercase' }}>
        Device Inspector
      </div>
      {!device ? (
        <div style={{ color: '#64748B', fontSize: 12, textAlign: 'center', marginTop: 24 }}>
          Select a device from the list to inspect its properties.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <DeviceProperties device={device} />
          <DeviceCommunicationStatus status={device.status} isOnline={device.isOnline} />
          <DeviceCapabilities capabilities={device.capabilities} />
        </div>
      )}
    </div>
  );
};