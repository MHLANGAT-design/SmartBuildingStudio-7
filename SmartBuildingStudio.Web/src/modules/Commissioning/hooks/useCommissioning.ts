// src/modules/Commissioning/hooks/useCommissioning.ts

import { useCallback, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/Application/ConfigureStore';
import {
  selectActiveSession,
  selectSessionStatus,
  selectError,
} from '@/modules/Commissioning/store/commissioningSelectors';
import { startCommissioningSession } from '@/modules/Commissioning/store/commissioningThunks';
import { clearSession } from '@/modules/Commissioning/store/commissioningSlice';

export function useCommissioning() {
  const dispatch = useAppDispatch();

  const session = useAppSelector(selectActiveSession);
  const status = useAppSelector(selectSessionStatus);
  const error = useAppSelector(selectError);

  const [isStarting, setIsStarting] = useState(false);

  const startSession = useCallback(
    async (projectId: string, floorId: string) => {
      setIsStarting(true);
      try {
        return await dispatch(
          startCommissioningSession({ projectId, floorId }),
        ).unwrap();
      } finally {
        setIsStarting(false);
      }
    },
    [dispatch],
  );

  const resetSession = useCallback(() => {
    dispatch(clearSession());
  }, [dispatch]);

  return {
    session,
    status,
    error,
    isStarting,
    startSession,
    resetSession,
    isActive: session !== null,
  };
}