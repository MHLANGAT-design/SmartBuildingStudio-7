// src/modules/EmergencyLighting/store/emergencyThunks.ts

import { createAsyncThunk } from '@reduxjs/toolkit';
import { ThunkApiConfig } from '@/Application/ConfigureStore';
import { EmergencyFloorplanLoader } from '@/modules/EmergencyLighting/Document/EmergencyFloorplanLoader';

export const loadEmergencyFloorplan = createAsyncThunk<
  any,
  string,
  ThunkApiConfig
>('emergency/loadFloorplan', async (floorplanId, { rejectWithValue }) => {
  const outcome = await EmergencyFloorplanLoader.load(floorplanId, false);
  if (!outcome.ok) return rejectWithValue(outcome.error);
  return outcome.model;
});

export const loadRawGeometry = createAsyncThunk<
  any[],
  void,
  ThunkApiConfig
>('emergency/loadRawGeometry', async (_, { getState, rejectWithValue }) => {
  const state = getState() as any;
  const rawPayload = state.emergency.floorplan.model?._rawPayload;

  if (!rawPayload) {
    return rejectWithValue('No raw payload available');
  }

  try {
    return EmergencyFloorplanLoader.extractRawGeometry(rawPayload);
  } catch (error: any) {
    return rejectWithValue(error.message);
  }
});