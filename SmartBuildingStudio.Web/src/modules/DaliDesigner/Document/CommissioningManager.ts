import { DaliDocument } from "@/modules/DaliDesigner/Document/DaliDocument";
import { ValidationIssue } from "@/modules/DaliDesigner/services/ValidationService";

export interface CommissionResult {
  status: DaliDocument["commissioning"];
  issues: ValidationIssue[];
}

export const CommissioningManager = {
  commission(doc: DaliDocument, issues: ValidationIssue[]): CommissionResult {
    const blocking = issues.filter((i) => i.severity === "error");
    if (blocking.length > 0) return { status: "failed", issues };
    return { status: "commissioned", issues };
  },

  reset(doc: DaliDocument): DaliDocument {
    return { ...doc, commissioning: "not-commissioned" };
  },
};