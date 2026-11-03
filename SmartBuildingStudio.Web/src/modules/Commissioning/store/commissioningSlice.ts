// src/modules/Commissioning/store/commissioningSlice.ts

import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { CommissioningState } from '@/modules/Commissioning/store/commissioningTypes';
import type { CommissioningSession } from '@/modules/Commissioning/models/CommissioningSession';
import type { CommissioningReport } from '@/modules/Commissioning/models/CommissioningReport';
import type { TestResult } from '@/modules/Commissioning/models/TestResult';
import type { Fault } from '@/modules/Commissioning/models/Fault';

const initialState: CommissioningState = {
  activeSession: null,
  recentTestResults: [],
  finalReport: null,
  isDiscovering: false,
  isAddressing: false,
  isTesting: false,
  isGeneratingReport: false,
  error: null,
};

export const commissioningSlice = createSlice({
  name: 'commissioning',
  initialState,
  reducers: {
    // Session management
    setSession: (state, action: PayloadAction<CommissioningSession>) => {
      state.activeSession = action.payload;
      state.error = null;
    },
    clearSession: (state) => {
      state.activeSession = null;
      state.recentTestResults = [];
      state.finalReport = null;
      state.error = null;
    },
    
    // Status flags
    setDiscovering: (state, action: PayloadAction<boolean>) => {
      state.isDiscovering = action.payload;
    },
    setAddressing: (state, action: PayloadAction<boolean>) => {
      state.isAddressing = action.payload;
    },
    setTesting: (state, action: PayloadAction<boolean>) => {
      state.isTesting = action.payload;
    },
    setGeneratingReport: (state, action: PayloadAction<boolean>) => {
      state.isGeneratingReport = action.payload;
    },

    // Results
    setTestResults: (state, action: PayloadAction<TestResult[]>) => {
      state.recentTestResults = action.payload;
    },
    setFinalReport: (state, action: PayloadAction<CommissioningReport>) => {
      state.finalReport = action.payload;
    },
    addFaultToSession: (state, action: PayloadAction<Fault>) => {
      if (state.activeSession) {
        state.activeSession.activeFaults.push(action.payload);
      }
    },
    resolveFaultInSession: (state, action: PayloadAction<string>) => {
      if (state.activeSession) {
        const fault = state.activeSession.activeFaults.find(f => f.faultId === action.payload);
        if (fault) {
          fault.isResolved = true;
          fault.resolvedAt = new Date().toISOString();
        }
      }
    },

    // Errors
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const {
  setSession,
  clearSession,
  setDiscovering,
  setAddressing,
  setTesting,
  setGeneratingReport,
  setTestResults,
  setFinalReport,
  addFaultToSession,
  resolveFaultInSession,
  setError,
} = commissioningSlice.actions;

export default commissioningSlice.reducer;