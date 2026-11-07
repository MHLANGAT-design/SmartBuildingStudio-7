// src/modules/Commissioning/hooks/useFaultDetection.ts

import { useCallback, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/Application/ConfigureStore';
import {
  selectActiveFaults,
  selectActiveSession,
} from '@/modules/Commissioning/store/commissioningSelectors';
import { FaultResolutionFlow } from '@/modules/Commissioning/Workflows/faultResolutionFlow';
import { FaultDetectionFlow } from '@/modules/Commissioning/Workflows/faultDetectionFlow';
import {
  setSession,
  setError,
} from '@/modules/Commissioning/store/commissioningSlice';

export function useFaultDetection() {
  const dispatch = useAppDispatch();

  const faults = useAppSelector(selectActiveFaults);
  const session = useAppSelector(selectActiveSession);
  const [isDetecting, setIsDetecting] = useState(false);

  /** Sweep the session for faults (network state, devices, test results). */
  const detectFaults = useCallback(async () => {
    if (!session) {
      const msg = 'No active commissioning session.';
      dispatch(setError(msg));
      throw new Error(msg);
    }
    setIsDetecting(true);
    try {
      const updatedSession = await FaultDetectionFlow.execute(session);
      dispatch(setSession(updatedSession));
      return updatedSession;
    } catch (e: any) {
      const msg = e?.message || 'Fault detection failed';
      dispatch(setError(msg));
      throw new Error(msg);
    } finally {
      setIsDetecting(false);
    }
  }, [dispatch, session]);

  /** Resolve a single fault (unchanged behaviour, now throws on failure). */
  const resolveFault = useCallback(
    async (faultId: string, notes: string) => {
      if (!session) {
        const msg = 'No active commissioning session.';
        dispatch(setError(msg));
        throw new Error(msg);
      }
      try {
        const updatedSession = await FaultResolutionFlow.execute(
          session,
          faultId,
          notes,
        );
        dispatch(setSession(updatedSession));
        return updatedSession;
      } catch (e: any) {
        const msg = e?.message || 'Fault resolution failed';
        dispatch(setError(msg));
        throw new Error(msg);
      }
    },
    [dispatch, session],
  );

  return {
    faults,
    faultCount: faults.length,
    hasCriticalFaults: faults.some((f) => f.severity === 'CRITICAL'),
    isDetecting,
    detectFaults,
    resolveFault,
  };
}