import { Building } from '@/modules/ProjectExplorer/Models';

export class BuildingService {
  public readonly baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  public async createBuilding(projectId: string, payload: { name: string; code: string; address?: string }): Promise<Building> {
    const response = await fetch(`${this.baseUrl}/v1/project-explorer/projects/${projectId}/buildings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`[BuildingService] Failed to build structural configuration profile under project: ${projectId}`);
    }

    return await response.json();
  }

  public async updateBuilding(buildingId: string, payload: { name: string; code: string; address?: string }): Promise<Building> {
    const response = await fetch(`${this.baseUrl}/v1/project-explorer/buildings/${buildingId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`[BuildingService] Processing failure during modification of building profile: ${buildingId}`);
    }

    return await response.json();
  }

  public async deleteBuilding(buildingId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/v1/project-explorer/buildings/${buildingId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`[BuildingService] Network server rejected delete request for building target: ${buildingId}`);
    }
  }
}
