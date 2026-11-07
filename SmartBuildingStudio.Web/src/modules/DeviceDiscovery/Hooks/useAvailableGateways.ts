// src/modules/DeviceDiscovery/Hooks/useAvailableGateways.ts

import { useMemo } from 'react';
import { useAppSelector } from '@/Application/ConfigureStore';
import {
  selectGateways,
  type Gateway,
  type ConnectionStatus,
} from '@/modules/GatewayManagement';

export interface AvailableGatewayOption {
  gatewayId: string;
  name: string;
  identifier: string;
  connectionStatus: ConnectionStatus;
  isConnected: boolean;
  hasAssignments: boolean;
}

const toOption = (gateway: Gateway, hasAssignments: boolean): AvailableGatewayOption => ({
  gatewayId: gateway.id,
  name: gateway.name || '(unnamed)',
  identifier: gateway.identifier || gateway.id,
  connectionStatus: gateway.connectionStatus,
  isConnected: gateway.connectionStatus === 'Connected',
  hasAssignments,
});

export const useAvailableGateways = () => {
  const gateways = useAppSelector(selectGateways);
  const assignmentsByGatewayId = useAppSelector(
    s => s.gatewayManagement.assignmentsByGatewayId
  );

  return useMemo(() => {
    const options = gateways.map(g =>
      toOption(g, (assignmentsByGatewayId[g.id] ?? []).length > 0)
    );

    const connected = options.filter(o => o.isConnected);

    /**
     * The gateway assigned to `projectId`, if any. Returns null when no
     * assignment exists for the project (the normal case until the user
     * explicitly assigns a gateway to a project).
     */
    const assignedForProject = (projectId: string | null): string | null => {
      if (!projectId) return null;
      for (const g of options) {
        const list = assignmentsByGatewayId[g.gatewayId] ?? [];
        if (list.some(a => a.projectId === projectId)) {
          return g.gatewayId;
        }
      }
      return null;
    };

    return {
      gateways: options,
      connectedOnly: connected,
      firstConnectedId: connected[0]?.gatewayId ?? null,
      firstAvailableId: options[0]?.gatewayId ?? null,
      isEmpty: options.length === 0,
      hasAnyConnected: connected.length > 0,
      assignedForProject,
    };
  }, [gateways, assignmentsByGatewayId]);
};

export type UseAvailableGatewaysReturn = ReturnType<typeof useAvailableGateways>;