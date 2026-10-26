/**
 * 🚀 SYSTEM ROUTE REGISTRY
 * Centralized mapping of all cross-module endpoints. 
 * This unifies frontend paths and decouples the service layer from hardcoded strings.
 */
export const API_ROUTES = {
  PROJECT_EXPLORER: {
    GET_TREE: "/api/v1/project-explorer/tree",
    LOAD_DOCUMENT: (id: string) => `/api/v1/project-explorer/documents/${id}`,
    LOCK_DOCUMENT: (id: string) => `/api/v1/project-explorer/documents/${id}/lock`,
    UNLOCK_DOCUMENT: (id: string) => `/api/v1/project-explorer/documents/${id}/unlock`
  },
  FLOORPLAN_DESIGNER: {
    SAVE_DESIGN: "/api/v1/floorplan-designer/save-document",
    VALIDATE_LAYOUT: "/api/v1/floorplan-designer/validate-layout"
  }
} as const;

/**
 * 🛠️ CONSOLIDATED NETWORK SERVICE LAYER
 * Handles explicit HTTP communications for both localized designer behavior 
 * and external cross-module data dependencies from the Project Explorer engine.
 */
export class FloorPlanNetworkService {
  
  /**
   * Helper utility to wrap generic HTTP request logic and guarantee 
   * centralized error parsing and status reporting.
   */
  private static async request<T>(url: string, options: RequestInit): Promise<T> {
    const defaultHeaders = {
      "Content-Type": "application/json",
      "Accept": "application/json"
    };

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers
      }
    };

    const response = await fetch(url, config);

    if (!response.ok) {
      let errorMessage = `HTTP Request Failed: ${response.status} ${response.statusText}`;
      try {
        const errorBody = await response.json();
        if (errorBody && errorBody.message) {
          errorMessage = errorBody.message;
        }
      } catch {
        // Fallback if response body is not JSON format
      }
      throw new Error(errorMessage);
    }

    if (response.status === 204) {
      return {} as T;
    }

    return await response.json() as T;
  }

  // ==========================================
  // 📁 PROJECT EXPLORER INTEGRATIONS (Cross-Module)
  // ==========================================

  /**
   * Fetches the hierarchical folder/file tree directly from the Project Explorer domain.
   */
  public static async fetchProjectTree(): Promise<any> {
    const url = API_ROUTES.PROJECT_EXPLORER.GET_TREE;
    return this.request<any>(url, { method: "GET" });
  }

  /**
   * Pulls a structural file data layout from the Project Explorer asset inventory.
   */
  public static async loadDocument(documentId: string): Promise<any> {
    const url = API_ROUTES.PROJECT_EXPLORER.LOAD_DOCUMENT(documentId);
    return this.request<any>(url, { method: "GET" });
  }

  /**
   * Obtains an exclusive runtime editing lock on a file managed by the Project Explorer.
   */
  public static async lockDocument(documentId: string): Promise<{ success: boolean }> {
    const url = API_ROUTES.PROJECT_EXPLORER.LOCK_DOCUMENT(documentId);
    return this.request<{ success: boolean }>(url, { method: "POST" });
  }

  /**
   * Explicitly releases an active file edit lock back to the project state tree.
   */
  public static async unlockDocument(documentId: string): Promise<{ success: boolean }> {
    const url = API_ROUTES.PROJECT_EXPLORER.UNLOCK_DOCUMENT(documentId);
    return this.request<{ success: boolean }>(url, { method: "POST" });
  }

  // ==========================================
  // 📐 FLOORPLAN DESIGNER UTILITIES (Local Domain)
  // ==========================================

  /**
   * Posts structural design modifications back to the local persistence engine.
   */
  public static async saveDesign(documentId: string, layoutData: any): Promise<{ savedAt: string }> {
    const url = API_ROUTES.FLOORPLAN_DESIGNER.SAVE_DESIGN;
    return this.request<{ savedAt: string }>(url, {
      method: "POST",
      body: JSON.stringify({ documentId, layoutData })
    });
  }

  /**
   * Submits active geometric boundaries to the specialized validation rule service.
   */
  public static async validateLayout(layoutData: any): Promise<{ valid: boolean; issues: string[] }> {
    const url = API_ROUTES.FLOORPLAN_DESIGNER.VALIDATE_LAYOUT;
    return this.request<{ valid: boolean; issues: string[] }>(url, {
      method: "POST",
      body: JSON.stringify({ layoutData })
    });
  }
}
