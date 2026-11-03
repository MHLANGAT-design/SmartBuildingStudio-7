// src/modules/Commissioning/models/DeviceState.ts

export type DeviceConnectionStatus = 'ONLINE' | 'OFFLINE' | 'UNKNOWN' | 'FAULTY';

export interface DeviceState {
  deviceId: string;
  shortAddress: number | null;
  connectionStatus: DeviceConnectionStatus;
  lastResponseAt: string | null;
  firmwareVersion?: string;
  errorCode?: number;
  isAddressed: boolean;
}