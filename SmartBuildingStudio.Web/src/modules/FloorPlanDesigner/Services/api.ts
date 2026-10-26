import { ArchitecturalPlan } from '../core/types';

/**
 * 📡 ENTERPRISE BACKEND GATEWAY CONFIGURATION
 * Directs multi-part vector streams explicitly to your active 
 * production host microservice container listening on port 49235.
 */
const API_BASE_URL = 'https://localhost:49235/api/v1/floorplan-designer'; 

/**
 * Uploads a raw DXF CAD file asset to the specialized C# geometry-driven 
 * extraction service pipeline to isolate walls, doors, and windows.
 */
export async function uploadDxfFile(file: File): Promise<ArchitecturalPlan> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/import`, {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Server execution process failed.');
  }

  return response.json();
}
