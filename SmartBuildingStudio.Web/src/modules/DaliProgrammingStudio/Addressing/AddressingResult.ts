// src/modules/DaliProgrammingStudio/Addressing/AddressingResult.ts

import type { AddressMapping } from '@/modules/DaliProgrammingStudio/Addressing/AddressMapping';
import type { DiagnosticIssue } from '@/modules/DaliProgrammingStudio/types/diagnostics.types';

export interface AddressingResult {
  success: boolean;
  mappings: AddressMapping[];
  conflicts: DiagnosticIssue[];
  unassignedDevices: string[];  // Device IDs that could not be assigned
  assignedCount: number;
}