// src/modules/Commissioning/store/commissioningThunks.ts

import { createAsyncThunk } from '@reduxjs/toolkit';
import type { RootState } from '@/Application/ConfigureStore';
import type { CommissioningSession } from '@/modules/Commissioning/models/CommissioningSession';
import { CommissioningApi } from '@/modules/Commissioning/services/CommissioningApi';
import { CommissioningWorkflow } from '@/modules/Commissioning/Workflows/commissioningWorkflow';
import {
  setSession,
  setDiscovering,
  setAddressing,
  setTesting,
  setError,
  setGeneratingReport,
  setFinalReport,
  setTestResults,
} from '@/modules/Commissioning/store/commissioningSlice';

export const startCommissioningSession = createAsyncThunk<
  CommissioningSession,
  { projectId: string; floorId: string },
  { rejectValue: string }
>(
  'commissioning/startSession',
  async ({ projectId, floorId }, { dispatch, rejectWithValue }) => {
    try {
      const session = await CommissioningApi.startSession(projectId, floorId);
      dispatch(setSession(session));
      return session;
    } catch (e: any) {
      dispatch(setError(e.message));
      return rejectWithValue(e.message);
    }
  },
);

export const runFullCommissioningWorkflow = createAsyncThunk<
  CommissioningSession,
  { gatewayId: string; lineId: string; sceneIds: string[] },
  { state: RootState; rejectValue: string }
>(
  'commissioning/runFullWorkflow',
  async ({ gatewayId, lineId, sceneIds }, { dispatch, getState, rejectWithValue }) => {
    const state = getState() as any;
    const session = state.commissioning.activeSession;

    if (!session) {
      return rejectWithValue('No active session to run workflow on.');
    }

    dispatch(setDiscovering(true));
    dispatch(setAddressing(true));
    dispatch(setTesting(true));

    try {
      const updatedSession = await CommissioningWorkflow.runFullSequence(
        session,
        gatewayId,
        lineId,
        sceneIds,
      );

      dispatch(setSession(updatedSession));

      // FIX: mirror the session's test results into recentTestResults so the
      // ValidationGroup gating (testResultCount > 0) un-greys Generate Report.
      if (updatedSession.testResults?.length) {
        dispatch(setTestResults(updatedSession.testResults));
      }

      return updatedSession;
    } catch (e: any) {
      dispatch(setError(e.message));
      return rejectWithValue(e.message);
    } finally {
      dispatch(setDiscovering(false));
      dispatch(setAddressing(false));
      dispatch(setTesting(false));
    }
  },
);

export const generateCommissioningReport = createAsyncThunk<
  void,
  void,
  { state: RootState; rejectValue: string }
>(
  'commissioning/generateReport',
  async (_, { dispatch, getState, rejectWithValue }) => {
    const state = getState() as any;
    const session = state.commissioning.activeSession;

    if (!session) {
      return rejectWithValue('No active session to generate report for.');
    }

    dispatch(setGeneratingReport(true));

    try {
      const report = await CommissioningApi.generateReport(session.sessionId);
      dispatch(setFinalReport(report));
      return undefined;
    } catch (e: any) {
      dispatch(setError(e.message));
      return rejectWithValue(e.message);
    } finally {
      dispatch(setGeneratingReport(false));
    }
  },
);