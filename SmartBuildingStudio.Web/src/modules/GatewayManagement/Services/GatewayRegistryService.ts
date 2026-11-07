// src/modules/GatewayManagement/Services/GatewayRegistryService.ts

/**
 * Registry service.
 *
 * Thin wrapper over GatewayManagementApi for registry operations —
 * register, update, configure, query. Kept as a separate seam so the
 * thunks in Store/ don't have to know about the API shape.
 */

import { GatewayManagementApi } from '@/modules/GatewayManagement/Services/GatewayManagementApi';
import type {
  RegisterGatewayRequest,
  UpdateGatewayRequest,
  ConfigureGatewayRequest,
} from '@/modules/GatewayManagement/Types';
import type { Gateway } from '@/modules/GatewayManagement/Models/Gateway';

export const GatewayRegistryService = {
  async list(): Promise<Gateway[]> {
    return GatewayManagementApi.listGateways();
  },

  async get(id: string): Promise<Gateway> {
    if (!id) throw new Error('A gateway id is required.');
    return GatewayManagementApi.getGateway(id);
  },

  async register(req: RegisterGatewayRequest): Promise<Gateway> {
    if (!req.name?.trim()) {
      throw new Error('Gateway name is required.');
    }
    if (!req.identifier?.trim()) {
      throw new Error('Gateway identifier is required.');
    }
    return GatewayManagementApi.registerGateway(req);
  },

  async update(id: string, req: UpdateGatewayRequest): Promise<Gateway> {
    if (!id) throw new Error('A gateway id is required.');
    if (!req.name?.trim()) throw new Error('Gateway name is required.');
    return GatewayManagementApi.updateGateway(id, req);
  },

  async configure(id: string, req: ConfigureGatewayRequest): Promise<Gateway> {
    if (!id) throw new Error('A gateway id is required.');
    if (req.daliLineCount < 1 || req.daliLineCount > 64) {
      throw new Error('DALI line count must be between 1 and 64.');
    }
    return GatewayManagementApi.configureGateway(id, req);
  },
};