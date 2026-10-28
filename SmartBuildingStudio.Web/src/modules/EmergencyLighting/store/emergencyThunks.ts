// src/modules/EmergencyLighting/store/emergencyThunks.ts

import { createAsyncThunk } from '@reduxjs/toolkit';
import { nanoid } from 'nanoid';
import { ThunkApiConfig } from '@/Application/ConfigureStore';
import { API_ROUTES } from '@/Application/ApiRoutes';
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
import {
  createProductCatalogPhotometricResolver,
} from '@/modules/FixturePlacementStudio/services/ProductCatalogPhotometricResolver';
import type { PhotometricData } from '@/modules/FixturePlacementStudio/models/PhotometricData';
import {
  convertToFixtureLayout,
  extractBarriers,
} from '@/modules/EmergencyLighting/Document/heatmapConverter';
import { registerPhotometricCacheClearer } from '@/modules/Shared/Photometry/photometricCacheRegistry';
import { projectRoutesToElements } from '@/modules/EmergencyLighting/Document/projectRoutes';
import { setDocument, incrementChangeTrigger } from '@/modules/FloorPlanDesigner/Store/FloorPlanSlice';
import {
  bumpDocumentVersion,
  recordDocumentLoaded,
} from '@/modules/Shared/DocumentVersion/documentVersionSlice';
import { selectCurrentDocumentVersion } from '@/modules/Shared/DocumentVersion/selectDocumentFresh';

// =====================================================================
// Floorplan
// =====================================================================

export const loadEmergencyFloorplan = createAsyncThunk<
  any,
  string,
  ThunkApiConfig
>('emergency/loadFloorplan', async (floorplanId, { getState, dispatch, rejectWithValue }) => {
  const versionAtLoad = selectCurrentDocumentVersion(getState());

  const outcome = await EmergencyFloorplanLoader.load(floorplanId, false);
  if (!outcome.ok) return rejectWithValue(outcome.error);

  dispatch(recordDocumentLoaded({ documentId: floorplanId, version: versionAtLoad }));
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
// Photometric service
// =====================================================================

let sharedPhotometricService: PhotometricService | null = null;
let sharedResolver: ReturnType<typeof createProductCatalogPhotometricResolver> | null = null;

function getPhotometricService(): PhotometricService {
  if (!sharedPhotometricService) {
    sharedResolver = createProductCatalogPhotometricResolver();
    sharedPhotometricService = new PhotometricService(sharedResolver);
  }
  return sharedPhotometricService;
}

export function clearPhotometricCache(): void {
  if (sharedResolver && typeof sharedResolver.clearCache === 'function') {
    sharedResolver.clearCache();
  }
  sharedResolver = null;
  sharedPhotometricService = null;
}

registerPhotometricCacheClearer(clearPhotometricCache);

// =====================================================================
// Heatmap
// =====================================================================

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
// Simulation
// =====================================================================

export const runEmergencySimulation = createAsyncThunk<
  { issues: ComplianceIssue[]; timestamp: string },
  void,
  ThunkApiConfig
>('emergency/runSimulation', async (_, { getState, dispatch, rejectWithValue }) => {
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
    };

    let heatmapData: PhotometricData | null = emergency.heatmap?.data ?? null;
    if (!heatmapData) {
      const result = await dispatch(runEmergencyHeatmap({}) as any);
      if (runEmergencyHeatmap.fulfilled.match(result)) {
        heatmapData = result.payload;
      }
    }

    const issues = ComplianceEngine.validate(emergencyDoc as any, model, heatmapData);
    return { issues, timestamp: new Date().toISOString() };
  } catch (error: any) {
    return rejectWithValue(error?.message ?? 'Simulation failed');
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

// =====================================================================
// Save routes — bump version on success
// =====================================================================

export const saveEmergencyRoutes = createAsyncThunk<
  void,
  void,
  ThunkApiConfig
>('emergency/saveRoutes', async (_, { getState, dispatch, rejectWithValue }) => {
  const state = getState() as any;
  const emergency = state.emergency;
  const model = emergency.floorplan.model;
  if (!model) return rejectWithValue('Floorplan not loaded.');

  const documentId = model.documentId;
  if (!documentId) return rejectWithValue('Missing documentId.');

  const getUrl = API_ROUTES.PROJECT_EXPLORER_SERVICE.DOCUMENTS.GET(documentId);
  let currentPayload: any;
  try {
    const getRes = await fetch(getUrl, { headers: { Accept: 'application/json' } });
    if (!getRes.ok) {
      const text = await getRes.text().catch(() => '');
      return rejectWithValue(`Pre-save fetch failed (${getRes.status}): ${text}`);
    }
    currentPayload = await getRes.json();
  } catch (err: any) {
    return rejectWithValue(err?.message ?? 'Pre-save fetch error');
  }

  const currentDrawnWallsRaw =
    currentPayload.drawnWallsJson ?? currentPayload.DrawnWallsJson;
  let currentDrawnWalls: any;
  try {
    currentDrawnWalls = typeof currentDrawnWallsRaw === 'string'
      ? JSON.parse(currentDrawnWallsRaw)
      : (currentDrawnWallsRaw || {});
  } catch {
    currentDrawnWalls = {};
  }

  const existingElements: any[] = Array.isArray(currentDrawnWalls.elements)
    ? currentDrawnWalls.elements
    : [];

  const updatedElements = projectRoutesToElements(
    emergency.routes || [],
    existingElements
  );

  const updatedDrawnWalls = {
    ...currentDrawnWalls,
    elements: updatedElements,
  };

  const savePayload = {
    DrawnWallsJson: JSON.stringify(updatedDrawnWalls),
    DefinedRoomsJson:
      currentPayload.definedRoomsJson ?? currentPayload.DefinedRoomsJson ?? '[]',
    PlacedFixturesJson:
      currentPayload.placedFixturesJson ?? currentPayload.PlacedFixturesJson ?? '{}',
    PixelsToMetresScale:
      currentPayload.pixelsToMetresScale ??
      currentPayload.PixelsToMetresScale ??
      1,
  };

  const putUrl = API_ROUTES.PROJECT_EXPLORER_SERVICE.DOCUMENTS.UPDATE(documentId);
  try {
    const putRes = await fetch(putUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(savePayload),
    });
    if (!putRes.ok) {
      const text = await putRes.text().catch(() => '');
      return rejectWithValue(`Save failed (${putRes.status}): ${text}`);
    }
  } catch (err: any) {
    return rejectWithValue(err?.message ?? 'Save error');
  }

  try {
    const floorPlanDoc = state.floorPlan?.document;
    if (floorPlanDoc) {
      const existingFloorPlanElements = Array.isArray(floorPlanDoc.elements)
        ? floorPlanDoc.elements.filter(
            (el: any) => String(el?.type ?? '').toLowerCase() !== 'exitroute'
          )
        : [];
      const newRouteElements = updatedElements.filter(
        (el: any) => String(el?.type ?? '').toLowerCase() === 'exitroute'
      );
      dispatch(
        setDocument({
          ...floorPlanDoc,
          elements: [...existingFloorPlanElements, ...newRouteElements],
        })
      );
      dispatch(incrementChangeTrigger());
    }
  } catch (syncErr) {
    // eslint-disable-next-line no-console
    console.warn('[saveEmergencyRoutes] Same-session sync failed', syncErr);
  }

  dispatch(bumpDocumentVersion());
  return;
});