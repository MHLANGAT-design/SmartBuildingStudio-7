// src/modules/EmergencyLighting/services/EmergencyApi.ts

import { API_ROUTES } from '@/Application/ApiRoutes';
import { EmergencyDocument } from '@/modules/EmergencyLighting/store/emergencyTypes';

export const EmergencyApi = {
  /**
   * Fetches the background floor plan and the emergency document.
   * Uses the standard ProjectExplorer document endpoint.
   */
  async getDocument(floorplanId: string): Promise<any> {
    const url = API_ROUTES.PROJECT_EXPLORER_SERVICE.DOCUMENTS.GET(floorplanId);
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    });
    if (!response.ok) {
      throw new Error(`Failed to load document: ${response.statusText}`);
    }
    return response.json();
  },

  /**
   * Saves the emergency study alongside the floor plan geometry.
   * Reuses the existing UPDATE endpoint, sending the geometry back unchanged.
   */
  async saveDocument(documentId: string, emergencyDoc: EmergencyDocument, currentFloorPlanData: any): Promise<any> {
    const url = API_ROUTES.PROJECT_EXPLORER_SERVICE.DOCUMENTS.UPDATE(documentId);
    
    // We pack the emergency data into a custom field so we don't destroy the floor plan geometry
    const payload = {
      ...currentFloorPlanData,
      EmergencyStudyJson: JSON.stringify(emergencyDoc),
    };

    const response = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Failed to save study: ${response.statusText}`);
    }
    return response.json();
  }
};