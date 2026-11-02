// src/modules/DaliProgrammingStudio/Document/ProgrammingDocumentSerializer.ts

import type { ProgrammingDocument } from '@/modules/DaliProgrammingStudio/Document/ProgrammingDocument';

export class ProgrammingDocumentSerializer {
  public static serialize(doc: ProgrammingDocument): string {
    return JSON.stringify(doc, null, 2);
  }

  public static deserialize(jsonString: string): ProgrammingDocument {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed.documentId || !parsed.projectId) {
        throw new Error('Invalid document structure.');
      }
      return parsed as ProgrammingDocument;
    } catch (e: any) {
      throw new Error(`Failed to deserialize programming document: ${e.message}`);
    }
  }
}