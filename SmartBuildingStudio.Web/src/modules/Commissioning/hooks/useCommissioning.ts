// src/modules/Commissioning/hooks/useCommissioning.ts

import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/Application/ConfigureStore';
import { 
  selectActiveSession, 
  selectSessionStatus,
  selectError
} from '@/modules/Commissioning/store/commissioningSelectors';
import { 
  startCommissioningSession 
} from '@/modules/Commissioning/store/commissioningThunks';
import { clearSession } from '@/modules/Commissioning/store/commissioningSlice';

export function useCommissioning() {
  const dispatch = useAppDispatch();
  
  const session = useAppSelector(selectActiveSession);
  const status = useAppSelector(selectSessionStatus);
  const error = useAppSelector(selectError);

  const startSession = useCallback(async (projectId: string, floorId: string) => {
    return dispatch(startCommissioningSession({ projectId, floorId })).unwrap();
  }, [dispatch]);

  const resetSession = useCallback(() => {
    dispatch(clearSession());
  }, [dispatch]);

  return {
    session,
    status,
    error,
    startSession,
    resetSession,
    isActive: session !== null,
  };
}