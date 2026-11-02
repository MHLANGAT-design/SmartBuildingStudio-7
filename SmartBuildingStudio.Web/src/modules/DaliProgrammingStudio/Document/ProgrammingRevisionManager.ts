// src/modules/DaliProgrammingStudio/Document/ProgrammingRevisionManager.ts

import type { ProgrammingDocument } from '@/modules/DaliProgrammingStudio/Document/ProgrammingDocument';

export interface ProgrammingRevision {
  revisionId: string;
  timestamp: string;
  documentSnapshot: ProgrammingDocument;
  comment?: string;
}

export class ProgrammingRevisionManager {
  private revisions: ProgrammingRevision[] = [];

  public createRevision(doc: ProgrammingDocument, comment?: string): ProgrammingRevision {
    const revision: ProgrammingRevision = {
      revisionId: `rev_${Date.now()}`,
      timestamp: new Date().toISOString(),
      documentSnapshot: JSON.parse(JSON.stringify(doc)), // Deep clone
      comment,
    };
    this.revisions.push(revision);
    return revision;
  }

  public getRevisions(): ProgrammingRevision[] {
    return [...this.revisions];
  }

  public getRevision(revisionId: string): ProgrammingRevision | undefined {
    return this.revisions.find(r => r.revisionId === revisionId);
  }
}