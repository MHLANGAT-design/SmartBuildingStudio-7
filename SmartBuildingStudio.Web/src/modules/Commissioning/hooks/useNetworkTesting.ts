// src/modules/Commissioning/hooks/useNetworkTesting.ts

import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/Application/ConfigureStore';
import { 
  selectIsTesting,
  selectRecentTestResults,
  selectActiveSession
} from '@/modules/Commissioning/store/commissioningSelectors';
import { NetworkVerificationFlow } from '@/modules/Commissioning/Workflows/networkVerificationFlow';
import { setSession, setTesting, setError } from '@/modules/Commissioning/store/commissioningSlice';

export function useNetworkTesting() {
  const dispatch = useAppDispatch();
  
  const isTesting = useAppSelector(selectIsTesting);
  const testResults = useAppSelector(selectRecentTestResults);
  const session = useAppSelector(selectActiveSession);

  const runNetworkTest = useCallback(async (gatewayId: string, lineId: string) => {
    if (!session) return null;

    dispatch(setTesting(true));
    try {
      const updatedSession = await NetworkVerificationFlow.execute(session, gatewayId, lineId);
      dispatch(setSession(updatedSession));
      return updatedSession;
    } catch (e: any) {
      dispatch(setError(e.message || 'Network test failed'));
      return null;
    } finally {
      dispatch(setTesting(false));
    }
  }, [dispatch, session]);

  return {
    isTesting,
    testResults,
    runNetworkTest,
    hasTestResults: testResults.length > 0,
  };
}