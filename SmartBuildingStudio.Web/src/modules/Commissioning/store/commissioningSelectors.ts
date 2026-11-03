// src/modules/Commissioning/store/commissioningSelectors.ts

import type { RootState } from '@/Application/ConfigureStore';
import type { CommissioningState } from '@/modules/Commissioning/store/commissioningTypes';
import type { Fault } from '@/modules/Commissioning/models/Fault';

const selectCommissioningState = (state: RootState): CommissioningState => (state as any).commissioning;

// Session
export const selectActiveSession = (state: RootState) => selectCommissioningState(state).activeSession;
export const selectSessionStatus = (state: RootState) => selectCommissioningState(state).activeSession?.status || 'IDLE';

// Status flags
export const selectIsDiscovering = (state: RootState) => selectCommissioningState(state).isDiscovering;
export const selectIsAddressing = (state: RootState) => selectCommissioningState(state).isAddressing;
export const selectIsTesting = (state: RootState) => selectCommissioningState(state).isTesting;
export const selectIsGeneratingReport = (state: RootState) => selectCommissioningState(state).isGeneratingReport;

// Results
export const selectRecentTestResults = (state: RootState) => selectCommissioningState(state).recentTestResults;
export const selectFinalReport = (state: RootState) => selectCommissioningState(state).finalReport;

// Derived
export const selectActiveFaults = (state: RootState): Fault[] => {
  const session = selectActiveSession(state);
  if (!session) return [];
  return session.activeFaults.filter(f => !f.isResolved);
};

export const selectDeviceCount = (state: RootState): number => {
  const session = selectActiveSession(state);
  if (!session) return 0;
  return Object.keys(session.deviceStates).length;
};

export const selectError = (state: RootState) => selectCommissioningState(state).error;