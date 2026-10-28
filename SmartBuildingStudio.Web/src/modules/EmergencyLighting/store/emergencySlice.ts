// src/modules/EmergencyLighting/store/emergencySlice.ts

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { EmergencyState } from '@/modules/EmergencyLighting/store/emergencyTypes';
import {
  loadEmergencyFloorplan,
  loadRawGeometry,
  runEmergencySimulation,
  runEmergencyHeatmap,
} from '@/modules/EmergencyLighting/store/emergencyThunks';
import { EvacuationRoute } from '@/modules/EmergencyLighting/models/EvacuationRoute';

const initialState: EmergencyState = {
  floorplan: { model: null, status: 'idle', error: null },
  rawGeometry: { elements: [], status: 'idle' },
  simulation: {
    issues: [],
    status: 'idle',
    error: null,
    lastRunAt: null,
  },
  heatmap: {
    data: null,
    status: 'idle',
    error: null,
    lastRunAt: null,
  },
  routes: [],
  routeDrawing: {
    isDrawing: false,
    startPoint: null as { x: number; y: number } | null,
    cursorPoint: null as { x: number; y: number } | null,
    pendingPoints: [] as Array<{ x: number; y: number }>,
  },
  viewport: { zoom: 1, offsetX: 0, offsetY: 0 },
  layerVisibility: {
    heatmap: false,
    visibilityCones: true,
    coverageZones: true,
    exitRoutes: true,
    exitSigns: true,
    rawgeometry: false,
  },
  ui: {
    activePanel: 'simulation',
    isSimulationDialogOpen: false,
    isReportDialogOpen: false,
    selectedRouteId: null,
  },
};

const emergencySlice = createSlice({
  name: 'emergency',
  initialState,
  reducers: {
    setViewport(state, action: PayloadAction<Partial<{ zoom: number; offsetX: number; offsetY: number }>>) {
      state.viewport = { ...state.viewport, ...action.payload };
    },
    toggleLayer(state, action: PayloadAction<keyof typeof initialState.layerVisibility>) {
      state.layerVisibility[action.payload] = !state.layerVisibility[action.payload];
    },
    setActivePanel(state, action: PayloadAction<'simulation' | 'compliance' | 'routes'>) {
      state.ui.activePanel = action.payload;
    },
    setSimulationDialogOpen(state, action: PayloadAction<boolean>) {
      state.ui.isSimulationDialogOpen = action.payload;
    },
    setReportDialogOpen(state, action: PayloadAction<boolean>) {
      state.ui.isReportDialogOpen = action.payload;
    },
    setSelectedRouteId(state, action: PayloadAction<string | null>) {
      state.ui.selectedRouteId = action.payload;
    },
    clearSelectedRouteId(state) {
      state.ui.selectedRouteId = null;
    },
    clearSimulation(state) {
      state.simulation = { issues: [], status: 'idle', error: null, lastRunAt: null };
    },
    clearHeatmap(state) {
      state.heatmap = { data: null, status: 'idle', error: null, lastRunAt: null };
    },
    addEvacuationRouteAction(state, action: PayloadAction<EvacuationRoute>) {
      state.routes.push(action.payload);
    },
    removeEvacuationRouteAction(state, action: PayloadAction<string>) {
      state.routes = state.routes.filter((r) => r.id !== action.payload);
      if (state.ui.selectedRouteId === action.payload) {
        state.ui.selectedRouteId = null;
      }
    },
    renameEvacuationRouteAction(state, action: PayloadAction<{ id: string; name: string }>) {
      const route = state.routes.find((r) => r.id === action.payload.id);
      if (route) route.name = action.payload.name;
    },
    clearRoutes(state) {
      state.routes = [];
      state.ui.selectedRouteId = null;
    },
    beginRouteDrawing(state) {
      state.routeDrawing = {
        isDrawing: true,
        startPoint: null,
        cursorPoint: null,
        pendingPoints: [],
      };
    },
    cancelRouteDrawing(state) {
      state.routeDrawing = {
        isDrawing: false,
        startPoint: null,
        cursorPoint: null,
        pendingPoints: [],
      };
    },
    setRouteStartPoint(state, action: PayloadAction<{ x: number; y: number } | null>) {
      state.routeDrawing.startPoint = action.payload;
      state.routeDrawing.cursorPoint = action.payload;
      state.routeDrawing.pendingPoints = action.payload ? [action.payload] : [];
    },
    setRouteCursorPoint(state, action: PayloadAction<{ x: number; y: number } | null>) {
      state.routeDrawing.cursorPoint = action.payload;
    },
    appendRoutePoint(state, action: PayloadAction<{ x: number; y: number }>) {
      state.routeDrawing.pendingPoints.push(action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadEmergencyFloorplan.pending, (state) => {
        state.floorplan.status = 'loading';
        state.floorplan.error = null;
      })
      .addCase(loadEmergencyFloorplan.fulfilled, (state, action) => {
        state.floorplan.status = 'ready';
        state.floorplan.model = action.payload;
        state.rawGeometry.elements = [];
        state.rawGeometry.status = 'idle';
        state.simulation = { issues: [], status: 'idle', error: null, lastRunAt: null };
        state.heatmap = { data: null, status: 'idle', error: null, lastRunAt: null };
        state.ui.selectedRouteId = null;
      })
      .addCase(loadEmergencyFloorplan.rejected, (state, action) => {
        state.floorplan.status = 'error';
        state.floorplan.error = action.payload as string;
      })

      .addCase(loadRawGeometry.pending, (state) => {
        state.rawGeometry.status = 'loading';
      })
      .addCase(loadRawGeometry.fulfilled, (state, action) => {
        state.rawGeometry.status = 'ready';
        state.rawGeometry.elements = action.payload;
      })
      .addCase(loadRawGeometry.rejected, (state) => {
        state.rawGeometry.status = 'error';
      })

      .addCase(runEmergencySimulation.pending, (state) => {
        state.simulation.status = 'running';
        state.simulation.error = null;
      })
      .addCase(runEmergencySimulation.fulfilled, (state, action) => {
        state.simulation.status = 'complete';
        state.simulation.issues = action.payload.issues;
        state.simulation.lastRunAt = action.payload.timestamp;
      })
      .addCase(runEmergencySimulation.rejected, (state, action) => {
        state.simulation.status = 'error';
        state.simulation.error = action.payload as string;
      })

      .addCase(runEmergencyHeatmap.pending, (state) => {
        state.heatmap.status = 'running';
        state.heatmap.error = null;
      })
      .addCase(runEmergencyHeatmap.fulfilled, (state, action) => {
        state.heatmap.status = 'complete';
        state.heatmap.data = action.payload;
        state.heatmap.lastRunAt = action.payload.computedAt ?? new Date().toISOString();
      })
      .addCase(runEmergencyHeatmap.rejected, (state, action) => {
        state.heatmap.status = 'error';
        state.heatmap.error = action.payload as string;
      });
  },
});

export const {
  setViewport,
  toggleLayer,
  setActivePanel,
  setSimulationDialogOpen,
  setReportDialogOpen,
  setSelectedRouteId,
  clearSelectedRouteId,
  clearSimulation,
  clearHeatmap,
  addEvacuationRouteAction,
  removeEvacuationRouteAction,
  renameEvacuationRouteAction,
  clearRoutes,
  beginRouteDrawing,
  cancelRouteDrawing,
  setRouteStartPoint,
  setRouteCursorPoint,
  appendRoutePoint,
} = emergencySlice.actions;

export const emergencyReducer = emergencySlice.reducer;
export default emergencySlice.reducer;