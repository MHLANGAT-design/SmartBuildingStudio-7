// src/modules/EmergencyLighting/Document/EmergencyDocumentSerializer.ts

import { EmergencyDocument } from '@/modules/EmergencyLighting/store/emergencyTypes';

export const EmergencyDocumentSerializer = {
  toDTO(doc: EmergencyDocument): string {
    return JSON.stringify(doc);
  },
  
  fromDTO(dto: string | object | null | undefined): EmergencyDocument | null {
    if (!dto) return null;
    try {
      const parsed = typeof dto === 'string' ? JSON.parse(dto) : dto;
      return {
        id: parsed.id || '',
        projectId: parsed.projectId || '',
        floorplanId: parsed.floorplanId || '',
        name: parsed.name || 'Emergency Study',
        revision: parsed.revision || 0,
        updatedAt: parsed.updatedAt || new Date().toISOString(),
        exitRoutes: parsed.exitRoutes || [],
        complianceIssues: parsed.complianceIssues || [],
        lastRunAt: parsed.lastRunAt || null,
        simulationStatus: parsed.simulationStatus || 'idle',
      };
    } catch {
      return null;
    }
  }
};