import { ProjectDocument, DocumentTypeContract } from '@/modules/ProjectExplorer/Models';

export class DocumentService {
  public readonly baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  public async createDocument(floorId: string, payload: { name: string; documentType: DocumentTypeContract; routePath: string }): Promise<ProjectDocument> {
    const response = await fetch(`${this.baseUrl}/v1/project-explorer/floors/${floorId}/documents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`[DocumentService] Failed to bind document profile reference to target level: ${floorId}`);
    }

    return await response.json();
  }

  public async toggleDocumentLock(documentId: string, lock: boolean): Promise<ProjectDocument> {
    const response = await fetch(`${this.baseUrl}/v1/project-explorer/documents/${documentId}/lock`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isLocked: lock }),
    });

    if (!response.ok) {
      throw new Error(`[DocumentService] Failed to alter document concurrency lock parameters for asset: ${documentId}`);
    }

    return await response.json();
  }

  public async removeDocument(documentId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/v1/project-explorer/documents/${documentId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`[DocumentService] Failed to clear document profile entry from index context: ${documentId}`);
    }
  }
}
