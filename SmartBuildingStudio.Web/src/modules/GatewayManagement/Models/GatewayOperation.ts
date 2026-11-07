// src/modules/GatewayManagement/Models/GatewayOperation.ts

export type GatewayOperationType =
  | 'Register'
  | 'Update'
  | 'Configure'
  | 'Connect'
  | 'Disconnect'
  | 'Reconnect'
  | 'ExecuteOperation'
  | 'RunDiagnostics';

export interface GatewayOperation {
  id: string;
  gatewayId: string;
  operationType: GatewayOperationType | string;
  payload: string | null;
  result: string | null;
  succeeded: boolean;
  startedAt: string;
  completedAt: string | null;
  errorMessage: string | null;
}

export const createEmptyGatewayOperation = (
  partial: Partial<GatewayOperation> & { id: string; gatewayId: string }
): GatewayOperation => ({
  id: partial.id,
  gatewayId: partial.gatewayId,
  operationType: partial.operationType ?? 'ExecuteOperation',
  payload: partial.payload ?? null,
  result: partial.result ?? null,
  succeeded: partial.succeeded ?? false,
  startedAt: partial.startedAt ?? new Date().toISOString(),
  completedAt: partial.completedAt ?? null,
  errorMessage: partial.errorMessage ?? null,
});

export const isOperationComplete = (op: GatewayOperation): boolean =>
  op.completedAt != null;

export const formatOperationDuration = (op: GatewayOperation): string => {
  if (!op.completedAt) return '—';
  const start = new Date(op.startedAt).getTime();
  const end = new Date(op.completedAt).getTime();
  const ms = Math.max(0, end - start);
  if (ms < 1000) return `${ms} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
};

export interface GatewayDiagnostics {
  gatewayId: string;
  isHealthy: boolean;
  latencyMs: number;
  errorMessage: string | null;
  checkedAt: string;
  checks: GatewayDiagnosticCheck[];
}

export interface GatewayDiagnosticCheck {
  name: string;
  passed: boolean;
  latencyMs: number;
  detail: string | null;
}

export const createEmptyGatewayDiagnostics = (
  partial: Partial<GatewayDiagnostics> & { gatewayId: string }
): GatewayDiagnostics => ({
  gatewayId: partial.gatewayId,
  isHealthy: partial.isHealthy ?? false,
  latencyMs: partial.latencyMs ?? 0,
  errorMessage: partial.errorMessage ?? null,
  checkedAt: partial.checkedAt ?? new Date().toISOString(),
  checks: partial.checks ?? [],
});