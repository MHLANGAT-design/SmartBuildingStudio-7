// src/modules/Commissioning/hooks/useCommissioningWorkflow.ts

import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/Application/ConfigureStore';
import { 
  selectActiveSession,
  selectFinalReport,
  selectIsGeneratingReport,
  selectError
} from '@/modules/Commissioning/store/commissioningSelectors';
import { 
  runFullCommissioningWorkflow, 
  generateCommissioningReport 
} from '@/modules/Commissioning/store/commissioningThunks';

export function useCommissioningWorkflow() {
  const dispatch = useAppDispatch();
  
  const session = useAppSelector(selectActiveSession);
  const report = useAppSelector(selectFinalReport);
  const isGenerating = useAppSelector(selectIsGeneratingReport);
  const error = useAppSelector(selectError);

  const runFullWorkflow = useCallback(async (
    gatewayId: string, 
    lineId: string, 
    sceneIds: string[]
  ) => {
    return dispatch(runFullCommissioningWorkflow({ gatewayId, lineId, sceneIds })).unwrap();
  }, [dispatch]);

  const generateReport = useCallback(async () => {
    return dispatch(generateCommissioningReport()).unwrap();
  }, [dispatch]);

  return {
    session,
    report,
    isGenerating,
    error,
    runFullWorkflow,
    generateReport,
    isComplete: session?.status === 'COMPLETED',
  };
}