// src/modules/DaliProgrammingStudio/hooks/useConfigurationVerification.ts

import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/Application/ConfigureStore';
import { 
  selectVerificationReport, 
  selectIsVerifying,
  selectIsFullyVerified,
  selectError
} from '@/modules/DaliProgrammingStudio/store/programmingSelectors';
import { verifyDeployment } from '@/modules/DaliProgrammingStudio/store/programmingThunks';
import type { VerificationService } from '@/modules/DaliProgrammingStudio/Services/VerificationService';
import type { DaliDeviceDefinition } from '@/modules/DaliProgrammingStudio/types/device.types';

export function useConfigurationVerification(service: VerificationService) {
  const dispatch = useAppDispatch();
  const report = useAppSelector(selectVerificationReport);
  const isVerifying = useAppSelector(selectIsVerifying);
  const isFullyVerified = useAppSelector(selectIsFullyVerified);
  const error = useAppSelector(selectError);

  const verify = useCallback(async (deploymentId: string, devices: DaliDeviceDefinition[]) => {
    return dispatch(verifyDeployment({ service, deploymentId, devices })).unwrap();
  }, [dispatch, service]);

  return {
    report,
    isVerifying,
    isFullyVerified,
    error,
    verify,
    hasReport: report !== null,
    summary: report?.summary,
  };
}