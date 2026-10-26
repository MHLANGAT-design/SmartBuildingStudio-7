import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { validateNetwork } from "@/modules/DaliDesigner/store/daliThunks";
import { selectValidationIssues, selectDocument } from "@/modules/DaliDesigner/store/daliSelectors";
import { CommissioningService } from "@/modules/DaliDesigner/services/CommissioningService";

export function useCommissioning() {
  const dispatch = useAppDispatch();
  const issues = useAppSelector(selectValidationIssues);
  const doc = useAppSelector(selectDocument);
  return {
    issues,
    validate: () => dispatch(validateNetwork()),
    commission: () => CommissioningService.run(doc),
  };
}