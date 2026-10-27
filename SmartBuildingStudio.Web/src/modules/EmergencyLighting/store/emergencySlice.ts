// src/modules/EmergencyLighting/store/emergencySlice.ts

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { EmergencyState } from '@/modules/EmergencyLighting/store/emergencyTypes';
import { loadEmergencyFloorplan, loadRawGeometry } from '@/modules/EmergencyLighting/store/emergencyThunks';

const initialState: EmergencyState = {
  floorplan: { model: null, status: 'idle', error: null },
  rawGeometry: { elements: [], status: 'idle' },
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
      });
  },
});

export const { 
  setViewport, 
  toggleLayer, 
  setActivePanel, 
  setSimulationDialogOpen, 
  setReportDialogOpen 
} = emergencySlice.actions;

export const emergencyReducer = emergencySlice.reducer;
export default emergencySlice.reducer;