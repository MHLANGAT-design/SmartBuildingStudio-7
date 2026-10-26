// DrawingSessionController.ts
// COMPLETE FILE - Replace everything

import { API_ROUTES } from '@/Application/ApiRoutes';

export class DrawingSessionController {
  private session: any = null;
  private documentId: string | null = null;

  async initializeDocumentSession(documentId: string, projectId?: string) {
    try {
      console.log('[DrawingSessionController] Initializing session for:', documentId);
      
      let documentData;
      try {
        // ✅ Use API_ROUTES for fetching
        documentData = await this.fetchDocument(documentId);
        console.log('[DrawingSessionController] ✅ Document fetched successfully');
      } catch (fetchError) {
        console.warn('[DrawingSessionController] Document not found, creating new one');
        documentData = await this.createDocument({
          id: documentId,
          projectId: projectId || 'default-project',
          name: 'New Document'
        });
      }

      this.session = {
        documentId,
        documentData,
        isLocked: false,
      };

      this.documentId = documentId;
      return this.session;
    } catch (error) {
      console.error('[DrawingSessionController] Failed to initialize session:', error);
      throw error;
    }
  }

  /**
   * ✅ Fetch document using API_ROUTES
   */
  private async fetchDocument(documentId: string): Promise<any> {
    try {
      // ✅ Use API_ROUTES for the fetch URL
      const url = API_ROUTES.PROJECT_EXPLORER_SERVICE.DOCUMENTS.GET(documentId);
      console.log('[DrawingSessionController] 📡 Fetching document:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch document: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('[DrawingSessionController] ✅ Document fetched successfully');
      return data;
    } catch (error) {
      console.error('[DrawingSessionController] ❌ Error fetching document:', error);
      throw error;
    }
  }

  /**
   * ✅ Fetch document with full floor plan data using API_ROUTES
   */
  private async fetchDocumentWithFloorPlan(documentId: string): Promise<any> {
    try {
      // ✅ Use API_ROUTES for the fetch URL with floor plan data
      const url = API_ROUTES.PROJECT_EXPLORER_SERVICE.DOCUMENTS.GET_WITH_FLOORPLAN(documentId);
      console.log('[DrawingSessionController] 📡 Fetching document with floor plan:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch document with floor plan: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('[DrawingSessionController] ✅ Document with floor plan fetched successfully');
      return data;
    } catch (error) {
      console.error('[DrawingSessionController] ❌ Error fetching document with floor plan:', error);
      throw error;
    }
  }

  /**
   * ✅ Create document using API_ROUTES
   */
  private async createDocument(payload: any): Promise<any> {
    try {
      // ✅ Use API_ROUTES for the create URL
      const url = API_ROUTES.PROJECT_EXPLORER_SERVICE.DOCUMENTS.CREATE;
      console.log('[DrawingSessionController] 📡 Creating document at:', url);
      
      const createPayload = {
        Name: payload.name || 'Untitled Layout',
        DrawnWallsJson: JSON.stringify({ walls: [], doors: [], windows: [] }),
        DefinedRoomsJson: JSON.stringify([]),
        PlacedFixturesJson: JSON.stringify({ importedDrawings: [], electricalFixtures: [] }),
        PixelsToMetresScale: 1.0
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(createPayload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create document: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('[DrawingSessionController] ✅ Document created successfully');
      return data;
    } catch (error) {
      console.error('[DrawingSessionController] ❌ Error creating document:', error);
      throw error;
    }
  }

  /**
   * ✅ Update document using API_ROUTES
   */
  async updateDocument(documentId: string, data: any): Promise<any> {
    try {
      // ✅ Use API_ROUTES for the update URL
      const url = API_ROUTES.PROJECT_EXPLORER_SERVICE.DOCUMENTS.UPDATE(documentId);
      console.log('[DrawingSessionController] 📡 Updating document:', url);
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update document: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('[DrawingSessionController] ✅ Document updated successfully');
      return result;
    } catch (error) {
      console.error('[DrawingSessionController] ❌ Error updating document:', error);
      throw error;
    }
  }

  /**
   * ✅ Lock document using API_ROUTES
   */
  async lockDocument(documentId: string): Promise<any> {
    try {
      const url = API_ROUTES.PROJECT_EXPLORER_SERVICE.DOCUMENTS.LOCK(documentId);
      console.log('[DrawingSessionController] 📡 Locking document:', url);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to lock document: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('[DrawingSessionController] ✅ Document locked successfully');
      return result;
    } catch (error) {
      console.error('[DrawingSessionController] ❌ Error locking document:', error);
      throw error;
    }
  }

  /**
   * ✅ Unlock document using API_ROUTES
   */
  async unlockDocument(documentId: string): Promise<any> {
    try {
      const url = API_ROUTES.PROJECT_EXPLORER_SERVICE.DOCUMENTS.UNLOCK(documentId);
      console.log('[DrawingSessionController] 📡 Unlocking document:', url);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to unlock document: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('[DrawingSessionController] ✅ Document unlocked successfully');
      return result;
    } catch (error) {
      console.error('[DrawingSessionController] ❌ Error unlocking document:', error);
      throw error;
    }
  }

  /**
   * ✅ Get document with full floor plan using API_ROUTES
   */
  async getDocumentWithFloorPlan(documentId: string): Promise<any> {
    try {
      const url = API_ROUTES.PROJECT_EXPLORER_SERVICE.DOCUMENTS.GET_WITH_FLOORPLAN(documentId);
      console.log('[DrawingSessionController] 📡 Fetching document with floor plan:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch document with floor plan: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('[DrawingSessionController] ✅ Document with floor plan fetched successfully');
      return data;
    } catch (error) {
      console.error('[DrawingSessionController] ❌ Error fetching document with floor plan:', error);
      throw error;
    }
  }

  getSession() {
    return this.session;
  }

  getDocumentId() {
    return this.documentId;
  }
}

export default DrawingSessionController;