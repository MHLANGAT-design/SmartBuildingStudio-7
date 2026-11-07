// src/modules/GatewayManagement/Models/GatewayManagementContext.ts

/**
 * The project context a GatewayManagementPage is operating within.
 *
 * Sourced from the ProjectExplorer document payload — same endpoint
 * DeviceDiscovery uses. Every field is present because ProjectExplorer
 * always returns project/building/floor/document names together in the
 * document DTO (even if some ancestors are missing in the tree, the
 * backend serializes the "active" names onto every document record).
 *
 * The IDs are opaque strings — this module never joins across databases.
 */

export interface GatewayManagementContext {
  projectId: string | null;
  projectName: string;
  buildingId: string | null;
  buildingName: string;
  floorId: string | null;
  floorName: string;
  documentId: string;
  documentName: string;
}

export const EMPTY_CONTEXT: GatewayManagementContext = {
  projectId: null,
  projectName: 'Unknown Project',
  buildingId: null,
  buildingName: 'Unknown Building',
  floorId: null,
  floorName: 'Unknown Floor',
  documentId: '',
  documentName: 'Untitled',
};

/** Human label for the context, e.g. "Demo Project · Ground Floor". */
export const formatGatewayContextLabel = (
  context: GatewayManagementContext | null
): string => {
  if (!context) return 'No project selected';
  const parts = [context.projectName, context.buildingName, context.floorName];
  return parts.filter(p => p && p !== 'Unknown Project' && p !== 'Unknown Building' && p !== 'Unknown Floor').join(' · ')
    || context.projectName;
};