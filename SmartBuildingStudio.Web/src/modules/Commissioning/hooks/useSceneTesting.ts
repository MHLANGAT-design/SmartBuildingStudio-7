// src/modules/Commissioning/hooks/useSceneTesting.ts

import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/Application/ConfigureStore';
import { 
  selectIsTesting,
  selectActiveSession
} from '@/modules/Commissioning/store/commissioningSelectors';
import { SceneValidationFlow } from '@/modules/Commissioning/Workflows/sceneValidationFlow';
import { setSession, setTesting, setError } from '@/modules/Commissioning/store/commissioningSlice';

export function useSceneTesting() {
  const dispatch = useAppDispatch();
  
  const isTesting = useAppSelector(selectIsTesting);
  const session = useAppSelector(selectActiveSession);

  const runSceneTests = useCallback(async (sceneIds: string[]) => {
    if (!session) return null;

    dispatch(setTesting(true));
    try {
      const updatedSession = await SceneValidationFlow.execute(session, sceneIds);
      dispatch(setSession(updatedSession));
      return updatedSession;
    } catch (e: any) {
      dispatch(setError(e.message || 'Scene testing failed'));
      return null;
    } finally {
      dispatch(setTesting(false));
    }
  }, [dispatch, session]);

  return {
    isTesting,
    runSceneTests,
  };
}