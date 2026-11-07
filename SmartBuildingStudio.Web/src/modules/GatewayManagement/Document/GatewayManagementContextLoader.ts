// src/modules/GatewayManagement/Document/GatewayManagementContextLoader.ts

/**
 * Loads the gateway-management context from ProjectExplorer's document
 * endpoint.
 *
 * This is the SAME endpoint DeviceDiscovery uses — PROJECT_EXPLORER_SERVICE
 * .DOCUMENTS.GET(id) — and the SAME transform: parse the raw payload,
 * extract the "active" names that ProjectExplorer serializes onto every
 * document record. The only difference is that we don't need the geometry,
 * the elements, or the DALI networks, so we don't call
 * transformDbSchemaToCanvasSchema at all — we just take the four names.
 */

import { API_ROUTES } from '@/Application/ApiRoutes';
import type { GatewayManagementContext } from '@/modules/GatewayManagement/Models/GatewayManagementContext';
import { EMPTY_CONTEXT } from '@/modules/GatewayManagement/Models/GatewayManagementContext';

export type LoadGatewayContextOutcome =
  | { ok: true; context: GatewayManagementContext }
  | { ok: false; error: string };

const pickName = (value: unknown, fallback: string): string =>
  typeof value === 'string' && value.trim().length > 0 ? value : fallback;

export const GatewayManagementContextLoader = {
  async load(documentId: string): Promise<LoadGatewayContextOutcome> {
    if (!documentId) {
      return { ok: false, error: 'A document id is required to load gateway context.' };
    }

    try {
      const url = API_ROUTES.PROJECT_EXPLORER_SERVICE.DOCUMENTS.GET(documentId);
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        return {
          ok: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      const data: any = await response.json();

      const context: GatewayManagementContext = {
        projectId: data.projectId ?? data.ProjectId ?? null,
        projectName: pickName(
          data.projectName ?? data.ProjectName ?? data.activeProjectName,
          EMPTY_CONTEXT.projectName
        ),
        buildingId: data.buildingId ?? data.BuildingId ?? null,
        buildingName: pickName(
          data.buildingName ?? data.BuildingName ?? data.activeBuildingName,
          EMPTY_CONTEXT.buildingName
        ),
        floorId: data.floorId ?? data.FloorId ?? null,
        floorName: pickName(
          data.floorName ?? data.FloorName ?? data.activeFloorName,
          EMPTY_CONTEXT.floorName
        ),
        documentId: data.id ?? data.documentId ?? documentId,
        documentName: pickName(
          data.name ?? data.Name ?? data.activeDocumentName,
          EMPTY_CONTEXT.documentName
        ),
      };

      return { ok: true, context };
    } catch (error: any) {
      console.error('[GatewayManagementContextLoader] load failed:', error);
      return { ok: false, error: error?.message ?? 'Unknown error' };
    }
  },
};

export default GatewayManagementContextLoader;