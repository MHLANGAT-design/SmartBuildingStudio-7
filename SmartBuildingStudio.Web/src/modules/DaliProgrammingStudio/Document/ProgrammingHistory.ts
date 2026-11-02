// src/modules/DaliProgrammingStudio/Document/ProgrammingHistory.ts

export interface HistoryEntry {
  entryId: string;
  timestamp: string;
  userId: string;
  action: string;
  details?: string;
}

export class ProgrammingHistory {
  private entries: HistoryEntry[] = [];

  public record(userId: string, action: string, details?: string): HistoryEntry {
    const entry: HistoryEntry = {
      entryId: `hist_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toISOString(),
      userId,
      action,
      details,
    };
    this.entries.push(entry);
    return entry;
  }

  public getEntries(): HistoryEntry[] {
    return [...this.entries];
  }

  public clear(): void {
    this.entries = [];
  }
}