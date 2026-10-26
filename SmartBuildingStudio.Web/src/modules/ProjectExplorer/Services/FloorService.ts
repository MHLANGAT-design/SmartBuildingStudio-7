import { Floor } from '@/modules/ProjectExplorer/Models';

export class FloorService {
  public readonly baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  public async createFloor(buildingId: string, payload: { name: string; levelNumber: number; elevationMeters: number; floorAreaSqMeters: number }): Promise<Floor> {
    const response = await fetch(`${this.baseUrl}/v1/project-explorer/buildings/${buildingId}/floors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`[FloorService] Failed to index system floor level parameters under asset: ${buildingId}`);
    }

    return await response.json();
  }

  public async updateFloor(floorId: string, payload: { name: string; levelNumber: number; elevationMeters: number; floorAreaSqMeters: number }): Promise<Floor> {
    const response = await fetch(`${this.baseUrl}/v1/project-explorer/floors/${floorId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`[FloorService] Engineering modification rejected on floor record: ${floorId}`);
    }

    return await response.json();
  }

  public async deleteFloor(floorId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/v1/project-explorer/floors/${floorId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`[FloorService] Internal constraint blocked deletion of level target: ${floorId}`);
    }
  }
}
