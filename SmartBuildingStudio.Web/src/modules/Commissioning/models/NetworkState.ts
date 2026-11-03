// src/modules/Commissioning/models/NetworkState.ts

export interface NetworkState {
  gatewayId: string;
  lineId: string;
  isConnected: boolean;
  totalDevices: number;
  onlineDevices: number;
  errorCount: number;
  lastScanAt: string | null;
  busVoltage?: number;
}