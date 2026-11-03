// src/modules/Commissioning/store/commissioningThunks.ts

import { createAsyncThunk } from '@reduxjs/toolkit';
import type { RootState } from '@/Application/ConfigureStore';
import type { CommissioningSession } from '@/modules/Commissioning/models/CommissioningSession';
import { CommissioningApi } from '@/modules/Commissioning/services/CommissioningApi';
import { CommissioningEngine } from '@/modules/Commissioning/Engine/CommissioningEngine';
import { CommissioningWorkflow } from '@/modules/Commissioning/Workflows/commissioningWorkflow';
import {
  setSession,
  setDiscovering,
  setAddressing,
  setTesting,
  setError,
  setGeneratingReport,
  setFinalReport,
} from '@/modules/Commissioning/store/commissioningSlice';

/**
 * Starts a new commissioning session.
 */
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
  }
);

/**
 * Runs the full discovery -> addressing -> testing sequence.
 */
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
        sceneIds
      );

      dispatch(setSession(updatedSession));
      return updatedSession;
    } catch (e: any) {
      dispatch(setError(e.message));
      return rejectWithValue(e.message);
    } finally {
      dispatch(setDiscovering(false));
      dispatch(setAddressing(false));
      dispatch(setTesting(false));
    }
  }
);

/**
 * Generates the final report.
 */
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
      return undefined; // explicit — satisfies noImplicitReturns alongside the rejectWithValue path
    } catch (e: any) {
      dispatch(setError(e.message));
      return rejectWithValue(e.message);
    } finally {
      dispatch(setGeneratingReport(false));
    }
  }
);