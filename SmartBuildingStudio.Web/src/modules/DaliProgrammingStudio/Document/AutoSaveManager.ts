// src/modules/DaliProgrammingStudio/Document/AutoSaveManager.ts

import type { ProgrammingDocument } from '@/modules/DaliProgrammingStudio/Document/ProgrammingDocument';
import { ProgrammingDocumentSerializer } from '@/modules/DaliProgrammingStudio/Document/ProgrammingDocumentSerializer';

export class AutoSaveManager {
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private lastSavedDoc: string | null = null;

  constructor(private saveCallback: (jsonString: string) => Promise<void>) {}

  public start(getDoc: () => ProgrammingDocument, intervalMs: number = 30000): void {
    this.stop(); // Clear existing timer
    this.intervalId = setInterval(async () => {
      const doc = getDoc();
      const serialized = ProgrammingDocumentSerializer.serialize(doc);
      
      if (serialized !== this.lastSavedDoc) {
        await this.saveCallback(serialized);
        this.lastSavedDoc = serialized;
      }
    }, intervalMs);
  }

  public stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}