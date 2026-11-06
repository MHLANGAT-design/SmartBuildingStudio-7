// src/modules/DeviceDiscovery/Hooks/useDiscoveryProgress.ts

import { useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/Application/ConfigureStore';

import {
  selectSession,
  selectSessionId,
  selectSessionPhase,
  selectSessionProgress,
  selectIsDiscovering,
  selectSessionError,
} from '@/modules/DeviceDiscovery/Store/deviceDiscoverySelectors';

import { refreshSession } from '@/modules/DeviceDiscovery/Store/deviceDiscoveryThunks';

import { isSessionActive } from '@/modules/DeviceDiscovery/Models/DiscoverySession';

export interface UseDiscoveryProgressOptions {
  /** Poll interval in ms while the session is active. 0 disables polling. */
  pollMs?: number;
}

export const useDiscoveryProgress = (options: UseDiscoveryProgressOptions = {}) => {
  const { pollMs = 0 } = options;
  const dispatch = useAppDispatch();

  const session = useAppSelector(selectSession);
  const sessionId = useAppSelector(selectSessionId);
  const phase = useAppSelector(selectSessionPhase);
  const progress = useAppSelector(selectSessionProgress);
  const isDiscovering = useAppSelector(selectIsDiscovering);
  const error = useAppSelector(selectSessionError);

  const isActive = isSessionActive(session);

  // Poll while active and pollMs > 0.
  useEffect(() => {
    if (!pollMs || pollMs <= 0) return;
    if (!isActive || !sessionId) return;

    const handle = window.setInterval(() => {
      // Only refresh if the session is still active to prevent overwriting COMPLETED
      const currentSession = session;
      if (currentSession?.status === 'RUNNING' || currentSession?.status === 'STARTING') {
        void dispatch(refreshSession({ sessionId }));
      }
    }, pollMs);

    return () => window.clearInterval(handle);
  }, [dispatch, isActive, sessionId, pollMs, session]);

  const percent = progress?.percent ?? 0;
  const discoveredCount = progress?.discoveredCount ?? 0;
  const identifiedCount = progress?.identifiedCount ?? 0;
  const matchedCount = progress?.matchedCount ?? 0;
  const exceptionCount = progress?.exceptionCount ?? 0;

  return useMemo(
    () => ({
      session,
      sessionId,
      phase,
      isDiscovering,
      isActive,
      error,
      percent,
      discoveredCount,
      identifiedCount,
      matchedCount,
      exceptionCount,
      label: session?.statusMessage ?? phase,
    }),
    [
      session, sessionId, phase, isDiscovering, isActive, error,
      percent, discoveredCount, identifiedCount, matchedCount, exceptionCount,
    ]
  );
};

export type UseDiscoveryProgressReturn = ReturnType<typeof useDiscoveryProgress>;