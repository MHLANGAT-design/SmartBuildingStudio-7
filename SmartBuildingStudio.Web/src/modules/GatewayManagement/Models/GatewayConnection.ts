// src/modules/GatewayManagement/Models/GatewayConnection.ts

import type { ConnectionStatus } from '@/modules/GatewayManagement/Models/Gateway';
import { asConnectionStatus } from '@/modules/GatewayManagement/Models/Gateway';

export interface GatewayConnection {
  id: string;
  connectedAt: string;
  disconnectedAt: string | null;
  disconnectReason: string | null;
  remoteEndpoint: string | null;
  isOpen: boolean;
}

export const createEmptyGatewayConnection = (
  partial: Partial<GatewayConnection> & { id: string }
): GatewayConnection => ({
  id: partial.id,
  connectedAt: partial.connectedAt ?? new Date().toISOString(),
  disconnectedAt: partial.disconnectedAt ?? null,
  disconnectReason: partial.disconnectReason ?? null,
  remoteEndpoint: partial.remoteEndpoint ?? null,
  isOpen: partial.isOpen ?? false,
});

export interface GatewayStatus {
  gatewayId: string;
  connectionStatus: ConnectionStatus;
  lastConnectedAt: string | null;
  lastSeenAt: string | null;
  lastErrorMessage: string | null;
  isReachable: boolean;
}

export const createEmptyGatewayStatus = (
  partial: Partial<GatewayStatus> & { gatewayId: string }
): GatewayStatus => ({
  gatewayId: partial.gatewayId,
  connectionStatus: asConnectionStatus(partial.connectionStatus),
  lastConnectedAt: partial.lastConnectedAt ?? null,
  lastSeenAt: partial.lastSeenAt ?? null,
  lastErrorMessage: partial.lastErrorMessage ?? null,
  isReachable: partial.isReachable ?? false,
});