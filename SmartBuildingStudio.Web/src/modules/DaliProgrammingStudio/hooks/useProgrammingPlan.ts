// src/modules/DaliProgrammingStudio/hooks/useProgrammingPlan.ts

import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/Application/ConfigureStore';
import { 
  selectProgrammingPlan, 
  selectIsCompiling,
  selectJobState,
  selectWarnings,
  selectError
} from '@/modules/DaliProgrammingStudio/store/programmingSelectors';
import { compileDesign } from '@/modules/DaliProgrammingStudio/store/programmingThunks';
import { ProgrammingService } from '@/modules/DaliProgrammingStudio/Services/ProgrammingService';

export function useProgrammingPlan(service: ProgrammingService) {
  const dispatch = useAppDispatch();
  const plan = useAppSelector(selectProgrammingPlan);
  const isCompiling = useAppSelector(selectIsCompiling);
  const jobState = useAppSelector(selectJobState);
  const warnings = useAppSelector(selectWarnings);
  const error = useAppSelector(selectError);

  const compile = useCallback(async () => {
    try {
      // We wrap the unwrap in try/catch so we don't throw an object to the UI
      await dispatch(compileDesign({ service })).unwrap();
    } catch (e: any) {
      // Thunk rejected. The store now has the errors via setCompileErrors.
      // We just swallow the rejection here so the UI doesn't crash.
      console.warn("Compile thunk rejected (handled by UI):", e);
    }
  }, [dispatch, service]);

  return {
    plan,
    isCompiling,
    jobState,
    warnings,
    error,
    compile,
    hasPlan: plan !== null,
    totalCommands: plan?.totalCommands ?? 0,
    targetDeviceCount: plan?.targetDeviceCount ?? 0,
  };
}