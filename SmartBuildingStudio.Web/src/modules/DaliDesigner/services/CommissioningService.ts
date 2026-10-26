import { DaliDocument } from "@/modules/DaliDesigner/Document/DaliDocument";
import { CommissioningManager } from "@/modules/DaliDesigner/Document/CommissioningManager";
import { ValidationService } from "@/modules/DaliDesigner/services/ValidationService";

export const CommissioningService = {
  run(doc: DaliDocument) {
    const issues = ValidationService.validate(doc);
    return CommissioningManager.commission(doc, issues);
  },
  reset: CommissioningManager.reset,
};