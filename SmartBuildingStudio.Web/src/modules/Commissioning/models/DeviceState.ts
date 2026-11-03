// src/modules/Commissioning/models/DeviceState.ts

export type DeviceConnectionStatus = 'ONLINE' | 'OFFLINE' | 'UNKNOWN' | 'FAULTY';

export interface DevicePosition {
  x: number;
  y: number;
}

export interface DeviceMetadata {
  /** World-space coordinates of the fixture this device represents. */
  position?: DevicePosition;
  /** Fixture kind from the source document (luminaire, sensor, switch, …). */
  kind?: string;
  /** Product id from the source document, if present. */
  productId?: string;
  /** Room id from the source document, if the fixture was placed in a room. */
  roomId?: string;
}

export interface DeviceState {
  deviceId: string;
  shortAddress: number | null;
  connectionStatus: DeviceConnectionStatus;
  lastResponseAt: string | null;
  firmwareVersion?: string;
  errorCode?: number;
  isAddressed: boolean;

  /** Fixture id this device represents in the fetched floorplan document. */
  sourceFixtureId?: string;

  /** Fixture-derived metadata — position, kind, room — used by canvas layers. */
  metadata?: DeviceMetadata;
}