// src/modules/FixturePlacementStudio/models/Gateway.ts
//
// Kind-specific payload for a gateway instance.
//
// A gateway bridges two networks — typically a low-level lighting bus
// (DALI, DMX) and a higher-level building network (IP, BACnet). Unlike a
// controller, it does not run lighting logic; it routes messages. Per-instance
// data only.

export type GatewayProtocol = 'DALI' | 'DMX' | 'KNX' | 'BACnet' | 'Modbus' | 'Zigbee' | 'unknown';

export type GatewayUplinkType = 'ethernet' | 'wifi' | 'cellular' | 'serial' | 'unknown';

export interface Gateway {
  /** Downstream (device-side) protocol. */
  downstreamProtocol?: GatewayProtocol;

  /** Uplink (network-side) connection type. */
  uplinkType?: GatewayUplinkType;

  /** Static IP if configured; may be omitted when DHCP is used. */
  ipAddress?: string;

  /** Number of downstream channels / buses the gateway exposes. */
  channelCount?: number;

  /** Free-form per-instance override of catalog defaults. */
  overrides?: Record<string, unknown>;
}

export default Gateway;