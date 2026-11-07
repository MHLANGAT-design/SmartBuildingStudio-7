// src/modules/Commissioning/hooks/useSceneTesting.ts

import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/Application/ConfigureStore';
import {
  selectIsTesting,
  selectRecentTestResults,
  selectActiveSession,
} from '@/modules/Commissioning/store/commissioningSelectors';
import { SceneValidationFlow } from '@/modules/Commissioning/Workflows/sceneValidationFlow';
import {
  setSession,
  setTesting,
  setError,
  setTestResults,
} from '@/modules/Commissioning/store/commissioningSlice';
import type { TestResult } from '@/modules/Commissioning/models/TestResult';

export function useSceneTesting() {
  const dispatch = useAppDispatch();

  const isTesting = useAppSelector(selectIsTesting);
  const testResults = useAppSelector(selectRecentTestResults);
  const session = useAppSelector(selectActiveSession);

  const runSceneTests = useCallback(
    async (sceneIds: string[]) => {
      // ─── DIAGNOSTIC ───
      console.log('[useSceneTesting] runSceneTests called with:', sceneIds);
      console.log('[useSceneTesting] session id:', session?.sessionId);
      // ──────────────────

      if (!session) {
        console.warn('[useSceneTesting] no session — returning null');
        return null;
      }

      dispatch(setTesting(true));
      try {
        const updatedSession = await SceneValidationFlow.execute(
          session,
          sceneIds,
        );

        // ─── DIAGNOSTIC ───
        console.log(
          '[useSceneTesting] flow returned — updatedSession.testResults:',
          (updatedSession as any).testResults,
        );
        // ──────────────────

        const results: TestResult[] = (updatedSession as any).testResults ?? [];
        if (results.length > 0) {
          console.log(
            '[useSceneTesting] dispatching setTestResults with',
            results.length,
            'results',
          );
          dispatch(setTestResults(results));
        } else {
          console.warn('[useSceneTesting] flow returned 0 results');
        }

        dispatch(setSession(updatedSession));
        return updatedSession;
      } catch (e: any) {
        console.error('[useSceneTesting] flow threw:', e);
        dispatch(setError(e?.message || 'Scene testing failed'));
        throw new Error(e?.message ?? 'Scene testing failed');
      } finally {
        dispatch(setTesting(false));
      }
    },
    [dispatch, session],
  );

  return {
    isTesting,
    testResults,
    runSceneTests,
    hasTestResults: testResults.length > 0,
  };
}