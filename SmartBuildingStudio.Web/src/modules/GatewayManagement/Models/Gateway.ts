// src/modules/GatewayManagement/Models/Gateway.ts

/**
 * Frontend domain model for a gateway.
 *
 * Distinct from the API's GatewayDto — this shape has:
 *   - normalized enum values (TransportProtocol, DaliProtocol, ConnectionStatus)
 *   - a helper to format the endpoint as a string
 *   - defaults for every field so a partial DTO maps cleanly
 *   - a .toRegisterRequest() / .toUpdateRequest() helper for mutations
 */

export type TransportProtocol = 'Http' | 'Tcp' | 'WebSocket';

export type DaliProtocol = 'Dali2' | 'Dali1Legacy' | 'DaliWireless';

export type ConnectionStatus =
  | 'Disconnected'
  | 'Connecting'
  | 'Connected'
  | 'Reconnecting'
  | 'Error';

export interface Gateway {
  id: string;
  name: string;
  identifier: string;
  transport: TransportProtocol;
  daliProtocol: DaliProtocol;
  endpointHost: string;
  endpointPort: number;
  endpointPath: string | null;
  connectionStatus: ConnectionStatus;
  lastConnectedAt: string | null;
  lastSeenAt: string | null;
  lastErrorMessage: string | null;
  daliLineCount: number;
  pollingIntervalSeconds: number;
  commandTimeoutSeconds: number;
}

const DEFAULT_TRANSPORT: TransportProtocol = 'Http';
const DEFAULT_DALI_PROTOCOL: DaliProtocol = 'Dali2';
const DEFAULT_CONNECTION_STATUS: ConnectionStatus = 'Disconnected';

const TRANSPORTS: TransportProtocol[] = ['Http', 'Tcp', 'WebSocket'];
const DALI_PROTOCOLS: DaliProtocol[] = ['Dali2', 'Dali1Legacy', 'DaliWireless'];
const CONNECTION_STATUSES: ConnectionStatus[] = [
  'Disconnected', 'Connecting', 'Connected', 'Reconnecting', 'Error',
];

const asTransport = (v: string | null | undefined): TransportProtocol =>
  TRANSPORTS.includes(v as TransportProtocol) ? (v as TransportProtocol) : DEFAULT_TRANSPORT;

const asDaliProtocol = (v: string | null | undefined): DaliProtocol =>
  DALI_PROTOCOLS.includes(v as DaliProtocol) ? (v as DaliProtocol) : DEFAULT_DALI_PROTOCOL;

const asConnectionStatus = (v: string | null | undefined): ConnectionStatus =>
  CONNECTION_STATUSES.includes(v as ConnectionStatus)
    ? (v as ConnectionStatus)
    : DEFAULT_CONNECTION_STATUS;

export const createEmptyGateway = (
  partial: Partial<Gateway> & { id: string }
): Gateway => ({
  id: partial.id,
  name: partial.name ?? '',
  identifier: partial.identifier ?? '',
  transport: partial.transport ?? DEFAULT_TRANSPORT,
  daliProtocol: partial.daliProtocol ?? DEFAULT_DALI_PROTOCOL,
  endpointHost: partial.endpointHost ?? '',
  endpointPort: partial.endpointPort ?? 0,
  endpointPath: partial.endpointPath ?? null,
  connectionStatus: partial.connectionStatus ?? DEFAULT_CONNECTION_STATUS,
  lastConnectedAt: partial.lastConnectedAt ?? null,
  lastSeenAt: partial.lastSeenAt ?? null,
  lastErrorMessage: partial.lastErrorMessage ?? null,
  daliLineCount: partial.daliLineCount ?? 1,
  pollingIntervalSeconds: partial.pollingIntervalSeconds ?? 15,
  commandTimeoutSeconds: partial.commandTimeoutSeconds ?? 30,
});

export const formatGatewayEndpoint = (gateway: Gateway): string => {
  const base = `${gateway.endpointHost}:${gateway.endpointPort}`;
  if (!gateway.endpointPath) return base;
  return `${base}/${gateway.endpointPath.replace(/^\/+/, '')}`;
};

export const isGatewayConnected = (gateway: Gateway): boolean =>
  gateway.connectionStatus === 'Connected';

export const isGatewayTransitioning = (gateway: Gateway): boolean =>
  gateway.connectionStatus === 'Connecting' || gateway.connectionStatus === 'Reconnecting';

export const isGatewayErrored = (gateway: Gateway): boolean =>
  gateway.connectionStatus === 'Error';

export const canConnect = (gateway: Gateway): boolean =>
  gateway.connectionStatus === 'Disconnected' ||
  gateway.connectionStatus === 'Error';

export const canDisconnect = (gateway: Gateway): boolean =>
  gateway.connectionStatus === 'Connected' ||
  gateway.connectionStatus === 'Connecting' ||
  gateway.connectionStatus === 'Reconnecting';

export const canReconnect = (gateway: Gateway): boolean =>
  gateway.connectionStatus !== 'Connecting' && gateway.connectionStatus !== 'Reconnecting';

export { asTransport, asDaliProtocol, asConnectionStatus };