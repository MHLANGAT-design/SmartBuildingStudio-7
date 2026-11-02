// src/modules/DaliProgrammingStudio/Services/AuditService.ts

import type { DaliCommandAudit } from '@/modules/DaliProgrammingStudio/Commands/DaliCommandAudit';
import type { DaliCommandResult } from '@/modules/DaliProgrammingStudio/Commands/DaliCommandResult';

export class AuditService {
  constructor(private audit: DaliCommandAudit) {}

  public getAllRecords(): DaliCommandResult[] {
    return this.audit.getRecords();
  }

  public getFailures(): DaliCommandResult[] {
    return this.audit.getFailures();
  }

  public exportAuditAsJson(): string {
    return JSON.stringify(this.audit.getRecords(), null, 2);
  }
}