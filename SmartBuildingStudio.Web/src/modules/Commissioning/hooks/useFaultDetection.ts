// src/modules/Commissioning/hooks/useFaultDetection.ts

import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/Application/ConfigureStore';
import { 
  selectActiveFaults,
  selectActiveSession
} from '@/modules/Commissioning/store/commissioningSelectors';
import { FaultResolutionFlow } from '@/modules/Commissioning/Workflows/faultResolutionFlow';
import { setSession, setError } from '@/modules/Commissioning/store/commissioningSlice';

export function useFaultDetection() {
  const dispatch = useAppDispatch();
  
  const faults = useAppSelector(selectActiveFaults);
  const session = useAppSelector(selectActiveSession);

  const resolveFault = useCallback(async (faultId: string, notes: string) => {
    if (!session) return null;

    try {
      const updatedSession = await FaultResolutionFlow.execute(session, faultId, notes);
      dispatch(setSession(updatedSession));
      return updatedSession;
    } catch (e: any) {
      dispatch(setError(e.message || 'Fault resolution failed'));
      return null;
    }
  }, [dispatch, session]);

  return {
    faults,
    faultCount: faults.length,
    hasCriticalFaults: faults.some(f => f.severity === 'CRITICAL'),
    resolveFault,
  };
}