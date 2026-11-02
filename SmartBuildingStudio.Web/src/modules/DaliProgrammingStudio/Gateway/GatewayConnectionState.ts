// src/modules/DaliProgrammingStudio/Gateway/GatewayConnectionState.ts

export const GATEWAY_STATES = {
  DISCONNECTED: 'DISCONNECTED',
  CONNECTING: 'CONNECTING',
  CONNECTED: 'CONNECTED',
  SESSION_ACTIVE: 'SESSION_ACTIVE',
  ERROR: 'ERROR',
} as const;

export type GatewayState = typeof GATEWAY_STATES[keyof typeof GATEWAY_STATES];