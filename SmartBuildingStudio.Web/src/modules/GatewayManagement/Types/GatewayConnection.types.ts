// src/modules/GatewayManagement/Types/GatewayConnection.types.ts

/**
 * Raw DTO shapes for connection status and history. Inlined into
 * Gateway.types.ts on the wire — these names exist so consumers can
 * import them without pulling the whole Gateway.types.ts barrel.
 */

export type { GatewayStatusDto } from '@/modules/GatewayManagement/Types/Gateway.types';
export type { GatewayConnectionDto } from '@/modules/GatewayManagement/Types/Gateway.types';