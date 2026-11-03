// src/modules/Commissioning/models/SignalLog.ts

export interface SignalLog {
  logId: string;
  deviceId: string;
  commandSent: string; // e.g., "QUERY_STATUS"
  responseReceived: string | null;
  sentAt: string;
  responseTimeMs: number;
  success: boolean;
}