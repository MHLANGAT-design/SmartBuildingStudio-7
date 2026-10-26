// src/modules/FloorPlanDesigner/Services/FloorPlanApi.ts

import type { FloorPlanDocumentDto } from "@/modules/FloorPlanDesigner/Store/FloorPlanDocumentDto";
import { API_ROUTES } from "@/Application/ApiRoutes";

export interface IFloorPlanApi {
  open(documentId: string): Promise<FloorPlanDocumentDto>;
  save(dto: FloorPlanDocumentDto): Promise<void>;
  getDocumentManager?(): any;
}

export class FloorPlanApi implements IFloorPlanApi {
  // 🚀 FIXED: Use HTTPS with port 49235
  private baseUrl: string;

  constructor(baseUrl: string = "https://localhost:49235") {
    this.baseUrl = baseUrl;
  }

  async open(documentId: string): Promise<FloorPlanDocumentDto> {
    console.log("[API] Opening document:", documentId);

    const endpoint = API_ROUTES.PROJECT_EXPLORER.DOCUMENTS(documentId);
    const url = `${this.baseUrl}${endpoint}`;
    console.log("[API] Request URL:", url);

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        }
      });

      console.log("[API] Response status:", response.status, response.statusText);

      if (!response.ok) {
        const responseText = await response.text();
        console.error("[API] Response body:", responseText.substring(0, 500));
        throw new Error(`Failed to open document: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log("[API] Document loaded:", data);
      return data;
    } catch (error) {
      console.error("[API] Error:", error);
      throw error;
    }
  }

  async save(dto: FloorPlanDocumentDto): Promise<void> {
    console.log("[API] Saving document:", dto.id);

    const endpoint = API_ROUTES.PROJECT_EXPLORER.DOCUMENTS(dto.id);
    const url = `${this.baseUrl}${endpoint}`;
    console.log("[API] Save URL:", url);

    try {
      const response = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(dto)
      });

      if (!response.ok) {
        throw new Error(`Failed to save document: ${response.status} ${response.statusText}`);
      }

      console.log("[API] Document saved:", dto.id);
    } catch (error) {
      console.error("[API] Save error:", error);
      throw error;
    }
  }
}