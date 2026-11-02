// src/modules/DaliProgrammingStudio/Services/DaliProgrammingApi.ts

import type { ProgrammingDocument } from '@/modules/DaliProgrammingStudio/Document/ProgrammingDocument';
import type { ApprovedDaliDesign } from '@/modules/DaliProgrammingStudio/types/dali.types';

export class DaliProgrammingApi {
  private baseUrl = '/api/dali-programming';

  public async fetchApprovedDesign(projectId: string): Promise<ApprovedDaliDesign> {
    const res = await fetch(`${this.baseUrl}/designs/${projectId}`);
    if (!res.ok) throw new Error('Failed to fetch approved design');
    return res.json();
  }

  public async saveDocument(doc: ProgrammingDocument): Promise<void> {
    const res = await fetch(`${this.baseUrl}/documents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(doc),
    });
    if (!res.ok) throw new Error('Failed to save programming document');
  }

  public async loadDocument(documentId: string): Promise<ProgrammingDocument> {
    const res = await fetch(`${this.baseUrl}/documents/${documentId}`);
    if (!res.ok) throw new Error('Failed to load programming document');
    return res.json();
  }
}