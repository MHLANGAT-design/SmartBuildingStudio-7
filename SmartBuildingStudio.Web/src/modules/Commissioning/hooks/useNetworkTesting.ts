// src/modules/Commissioning/hooks/useNetworkTesting.ts

import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/Application/ConfigureStore';
import {
  selectIsTesting,
  selectRecentTestResults,
  selectActiveSession,
} from '@/modules/Commissioning/store/commissioningSelectors';
import { NetworkVerificationFlow } from '@/modules/Commissioning/Workflows/networkVerificationFlow';
import {
  setSession,
  setTesting,
  setError,
  setTestResults,
} from '@/modules/Commissioning/store/commissioningSlice';
import type { TestResult } from '@/modules/Commissioning/models/TestResult';

export function useNetworkTesting() {
  const dispatch = useAppDispatch();

  const isTesting = useAppSelector(selectIsTesting);
  const testResults = useAppSelector(selectRecentTestResults);
  const session = useAppSelector(selectActiveSession);

  const runNetworkTest = useCallback(
    async (gatewayId: string, lineId: string) => {
      if (!session) return null;

      dispatch(setTesting(true));
      try {
        const updatedSession = await NetworkVerificationFlow.execute(
          session,
          gatewayId,
          lineId,
        );

        // The flow stores results on updatedSession.testResults — mirror
        // them into recentTestResults so TestResultsPanel renders them.
        const results: TestResult[] =
          (updatedSession as any).testResults ?? [];
        if (results.length > 0) {
          dispatch(setTestResults(results));
        }

        dispatch(setSession(updatedSession));
        return updatedSession;
      } catch (e: any) {
        dispatch(setError(e?.message || 'Network test failed'));
        throw new Error(e?.message ?? 'Network test failed');
      } finally {
        dispatch(setTesting(false));
      }
    },
    [dispatch, session],
  );

  return {
    isTesting,
    testResults,
    runNetworkTest,
    hasTestResults: testResults.length > 0,
  };
}