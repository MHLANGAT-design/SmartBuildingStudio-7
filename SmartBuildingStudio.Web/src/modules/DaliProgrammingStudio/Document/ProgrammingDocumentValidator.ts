// src/modules/DaliProgrammingStudio/Document/ProgrammingDocumentValidator.ts

import type { ProgrammingDocument } from '@/modules/DaliProgrammingStudio/Document/ProgrammingDocument';

export interface DocumentValidationResult {
  isValid: boolean;
  errors: string[];
}

export class ProgrammingDocumentValidator {
  public validate(doc: ProgrammingDocument): DocumentValidationResult {
    const errors: string[] = [];

    if (!doc.documentId) {
      errors.push('Document is missing an ID.');
    }

    if (!doc.projectId) {
      errors.push('Document is missing a project ID.');
    }

    if (!doc.approvedDesign) {
      errors.push('Document has no approved design loaded.');
    }

    // If the state is past Draft, we should have a plan
    if (doc.state !== 'Draft' && !doc.programmingPlan) {
      errors.push(`Document is in state ${doc.state} but has no compiled plan.`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}