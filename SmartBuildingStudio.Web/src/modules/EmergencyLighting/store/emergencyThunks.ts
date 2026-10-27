// src/modules/EmergencyLighting/store/emergencyThunks.ts

import { createAsyncThunk } from '@reduxjs/toolkit';
import { nanoid } from 'nanoid';
import { ThunkApiConfig } from '@/Application/ConfigureStore';
import { EmergencyFloorplanLoader } from '@/modules/EmergencyLighting/Document/EmergencyFloorplanLoader';
import { ComplianceEngine } from '@/modules/EmergencyLighting/Document/ComplianceEngine';
import { EvacuationRouteEngine } from '@/modules/EmergencyLighting/Document/EvacuationRouteEngine';
import { EvacuationRoute } from '@/modules/EmergencyLighting/models/EvacuationRoute';
import {
  ComplianceIssue,
  EmergencyDocument,
} from '@/modules/EmergencyLighting/store/emergencyTypes';
import { addEvacuationRouteAction } from '@/modules/EmergencyLighting/store/emergencySlice';
import { PhotometricService } from '@/modules/FixturePlacementStudio/services/PhotometricService';
import { createProductCatalogPhotometricResolver } from '@/modules/FixturePlacementStudio/services/ProductCatalogPhotometricResolver';
import type { PhotometricData } from '@/modules/FixturePlacementStudio/models/PhotometricData';
import {
  convertToFixtureLayout,
  extractBarriers,
} from '@/modules/EmergencyLighting/Document/heatmapConverter';

// =====================================================================
// Floorplan
// =====================================================================

export const loadEmergencyFloorplan = createAsyncThunk<
  any,
  string,
  ThunkApiConfig
>('emergency/loadFloorplan', async (floorplanId, { rejectWithValue }) => {
  const outcome = await EmergencyFloorplanLoader.load(floorplanId, false);
  if (!outcome.ok) return rejectWithValue(outcome.error);
  return outcome.model;
});

// =====================================================================
// Raw geometry
// =====================================================================

export const loadRawGeometry = createAsyncThunk<
  any[],
  void,
  ThunkApiConfig
>('emergency/loadRawGeometry', async (_, { getState, rejectWithValue }) => {
  const state = getState() as any;
  const rawPayload = state.emergency.floorplan.model?._rawPayload;
  if (!rawPayload) return rejectWithValue('No raw payload available');
  try {
    return EmergencyFloorplanLoader.extractRawGeometry(rawPayload);
  } catch (error: any) {
    return rejectWithValue(error.message);
  }
});

// =====================================================================
// Simulation
// =====================================================================

export const runEmergencySimulation = createAsyncThunk<
  { issues: ComplianceIssue[]; timestamp: string },
  void,
  ThunkApiConfig
>('emergency/runSimulation', async (_, { getState, rejectWithValue }) => {
  const state = getState() as any;
  const emergency = state.emergency;
  const model = emergency.floorplan.model;
  if (!model) return rejectWithValue('Floorplan not loaded. Cannot run simulation.');

  try {
    const emergencyDoc: EmergencyDocument = {
      id: model.documentId ?? '',
      projectId: '',
      floorplanId: model.documentId ?? '',
      name: model.documentName ?? 'Emergency Study',
      revision: 0,
      updatedAt: new Date().toISOString(),
      exitRoutes: emergency.routes ?? [],
      complianceIssues: [],
      lastRunAt: null,
      simulationStatus: 'idle',
    } as any;

    // Pull heatmap data (if computed) so visibility analysis can run.
    // If it's null the engine emits a single info issue asking the user
    // to compute it — no per-room errors, since without lux data we
    // can't judge.
    const heatmapData: PhotometricData | null = emergency.heatmap?.data ?? null;

    const issues = ComplianceEngine.validate(emergencyDoc as any, model, heatmapData);
    return { issues, timestamp: new Date().toISOString() };
  } catch (error: any) {
    return rejectWithValue(error?.message ?? 'Simulation failed');
  }
});

// =====================================================================
// Heatmap — FPS PhotometricService
// =====================================================================

let sharedPhotometricService: PhotometricService | null = null;
function getPhotometricService(): PhotometricService {
  if (!sharedPhotometricService) {
    sharedPhotometricService = new PhotometricService(
      createProductCatalogPhotometricResolver()
    );
  }
  return sharedPhotometricService;
}

export const runEmergencyHeatmap = createAsyncThunk<
  PhotometricData,
  { resolutionMeters?: number; heightMeters?: number } | void,
  ThunkApiConfig
>('emergency/runHeatmap', async (args, { getState, rejectWithValue }) => {
  const state = getState() as any;
  const model = state.emergency.floorplan.model;
  if (!model) return rejectWithValue('Floorplan not loaded. Cannot compute heatmap.');

  try {
    const documentId = model.documentId ?? 'emergency-heatmap';
    const layout = convertToFixtureLayout(model, documentId);
    if (layout.fixtures.length === 0) {
      return rejectWithValue('No fixtures on this floorplan.');
    }

    const walls = extractBarriers(model);
    const photometric = getPhotometricService();

    const data = await photometric.compute(layout, {
      resolutionMeters: (args as any)?.resolutionMeters ?? 0.5,
      heightMeters: (args as any)?.heightMeters ?? 0.8,
      walls,
    });

    if (data.status !== 'complete') {
      return rejectWithValue(data.error ?? 'Heatmap computation failed.');
    }
    return data;
  } catch (error: any) {
    return rejectWithValue(error?.message ?? 'Heatmap computation failed.');
  }
});

// =====================================================================
// Route commit
// =====================================================================

export const commitEvacuationRoute = createAsyncThunk<
  void,
  { name: string; points: Array<{ x: number; y: number }> },
  ThunkApiConfig
>('emergency/commitRoute', async ({ name, points }, { dispatch }) => {
  if (!Array.isArray(points) || points.length < 2) return;

  const draft: EvacuationRoute = {
    id: `route-${nanoid(6)}`,
    name,
    points,
    startNode: points[0],
    endNode: points[points.length - 1],
    lengthMeters: 0,
    isCompliant: false,
  };

  const evaluated = EvacuationRouteEngine.evaluateRoute(draft);
  dispatch(addEvacuationRouteAction(evaluated));
  await dispatch(runEmergencySimulation());
});