// src/modules/DaliProgrammingStudio/hooks/useDeployment.ts

import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/Application/ConfigureStore';
import { 
  selectDeploymentProgress, 
  selectDeploymentResult,
  selectIsDeploying,
  selectDeploymentPercentage,
  selectError
} from '@/modules/DaliProgrammingStudio/store/programmingSelectors';
import { deployPlan } from '@/modules/DaliProgrammingStudio/store/programmingThunks';
import type { ProgrammingService } from '@/modules/DaliProgrammingStudio/Services/ProgrammingService';
import type { ProgrammingPlan } from '@/modules/DaliProgrammingStudio/Compiler/ProgrammingPlanBuilder';

export function useDeployment(service: ProgrammingService) {
  const dispatch = useAppDispatch();
  const progress = useAppSelector(selectDeploymentProgress);
  const result = useAppSelector(selectDeploymentResult);
  const isDeploying = useAppSelector(selectIsDeploying);
  const percentage = useAppSelector(selectDeploymentPercentage);
  const error = useAppSelector(selectError);

  const deploy = useCallback(async (
    plan: ProgrammingPlan,
    gatewayId: string,
    lineId: string,
    projectId: string,     // ← ADDED
    floorplanId: string,   // ← ADDED
  ) => {
    return dispatch(deployPlan({ service, plan, gatewayId, lineId, projectId, floorplanId })).unwrap();
  }, [dispatch, service]);

  return {
    progress,
    result,
    isDeploying,
    percentage,
    error,
    deploy,
    hasResult: result !== null,
    success: result?.success ?? false,
  };
}