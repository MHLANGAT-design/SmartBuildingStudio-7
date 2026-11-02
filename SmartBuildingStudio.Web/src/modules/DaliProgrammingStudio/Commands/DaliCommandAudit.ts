// src/modules/DaliProgrammingStudio/Commands/DaliCommandAudit.ts

import type { DaliCommandResult } from '@/modules/DaliProgrammingStudio/Commands/DaliCommandResult';

export class DaliCommandAudit {
  private records: DaliCommandResult[] = [];

  public record(result: DaliCommandResult): void {
    this.records.push(result);
    // In a real implementation, this would also push to a backend audit log
  }

  public getRecords(): DaliCommandResult[] {
    return [...this.records];
  }

  public getFailures(): DaliCommandResult[] {
    return this.records.filter(r => r.status === 'FAILED' || r.status === 'TIMEOUT');
  }
}