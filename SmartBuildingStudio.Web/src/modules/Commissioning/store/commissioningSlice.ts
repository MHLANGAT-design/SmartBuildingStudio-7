// src/modules/Commissioning/store/commissioningSlice.ts

import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { CommissioningState, CommissioningInspectorSelection } from '@/modules/Commissioning/store/commissioningTypes';
import type { CommissioningSession } from '@/modules/Commissioning/models/CommissioningSession';
import type { CommissioningReport } from '@/modules/Commissioning/models/CommissioningReport';
import type { TestResult } from '@/modules/Commissioning/models/TestResult';
import type { Fault } from '@/modules/Commissioning/models/Fault';
import type { CommissioningFloorplanRenderModel } from '@/modules/Commissioning/Document/CommissioningFloorplanLoader';

const DEFAULT_LAYERS = {
  walls: true, doors: true, windows: true, rooms: true, fixtures: true,
  rawgeometry: false, devices: true, faults: true, signals: true, topology: true,
};

const initialState: CommissioningState = {
  activeSession: null,
  recentTestResults: [],
  finalReport: null,
  isDiscovering: false,
  isAddressing: false,
  isTesting: false,
  isGeneratingReport: false,
  error: null,
  floorplanId: null,
  floorplan: null,
  floorplanLoading: false,
  floorplanError: null,
  viewport: { offsetX: 0, offsetY: 0, zoom: 1 },
  layerVisibility: { ...DEFAULT_LAYERS },
  inspectorSelection: null, // <-- NEW
};

export const commissioningSlice = createSlice({
  name: 'commissioning',
  initialState,
  reducers: {
    setSession: (state, action: PayloadAction<CommissioningSession>) => {
      const incoming = action.payload;
      state.activeSession = {
        ...incoming,
        activeFaults: incoming.activeFaults ?? [],
        deviceStates: incoming.deviceStates ?? {},
        networkStates: incoming.networkStates ?? {},
      };
      state.error = null;
    },
    clearSession: (state) => {
      state.activeSession = null;
      state.recentTestResults = [];
      state.finalReport = null;
      state.error = null;
      state.inspectorSelection = null;
    },
    clearCommissioningContext: (state) => {
      state.activeSession = null;
      state.recentTestResults = [];
      state.finalReport = null;
      state.error = null;
      state.floorplanId = null;
      state.floorplan = null;
      state.floorplanError = null;
      state.floorplanLoading = false;
      state.viewport = { offsetX: 0, offsetY: 0, zoom: 1 };
      state.layerVisibility = { ...DEFAULT_LAYERS };
      state.inspectorSelection = null;
    },
    setFloorplan: (state, action: PayloadAction<{ id: string; model: CommissioningFloorplanRenderModel }>) => {
      state.floorplanId = action.payload.id;
      state.floorplan = action.payload.model;
      state.floorplanLoading = false;
      state.floorplanError = null;
    },
    setFloorplanLoading: (state, action: PayloadAction<boolean>) => {
      state.floorplanLoading = action.payload;
    },
    setFloorplanError: (state, action: PayloadAction<string | null>) => {
      state.floorplanError = action.payload;
      state.floorplanLoading = false;
    },
    toggleLayer: (state, action: PayloadAction<string>) => {
      const layer = action.payload;
      state.layerVisibility[layer] = !state.layerVisibility[layer];
    },
    
    // NEW: Unified selection action
    setInspectorSelection: (state, action: PayloadAction<CommissioningInspectorSelection>) => {
      // If clicking the same thing, toggle it off
      if (action.payload && state.inspectorSelection && 
          action.payload.kind === state.inspectorSelection.kind && 
          (action.payload as any).id === (state.inspectorSelection as any).id) {
        state.inspectorSelection = null;
      } else {
        state.inspectorSelection = action.payload;
      }
    },

    setViewport: (state, action: PayloadAction<Partial<{ offsetX: number; offsetY: number; zoom: number }>>) => {
      state.viewport = { ...state.viewport, ...action.payload };
    },
    setDiscovering: (state, action: PayloadAction<boolean>) => { state.isDiscovering = action.payload; },
    setAddressing: (state, action: PayloadAction<boolean>) => { state.isAddressing = action.payload; },
    setTesting: (state, action: PayloadAction<boolean>) => { state.isTesting = action.payload; },
    setGeneratingReport: (state, action: PayloadAction<boolean>) => { state.isGeneratingReport = action.payload; },
    setTestResults: (state, action: PayloadAction<TestResult[]>) => { state.recentTestResults = action.payload; },
    setFinalReport: (state, action: PayloadAction<CommissioningReport>) => { state.finalReport = action.payload; },
    addFaultToSession: (state, action: PayloadAction<Fault>) => {
      if (state.activeSession) (state.activeSession.activeFaults ??= []).push(action.payload);
    },
    resolveFaultInSession: (state, action: PayloadAction<string>) => {
      if (state.activeSession) {
        const fault = state.activeSession.activeFaults?.find((f) => f.faultId === action.payload);
        if (fault) {
          fault.isResolved = true;
          fault.resolvedAt = new Date().toISOString();
        }
      }
    },
    setError: (state, action: PayloadAction<string | null>) => { state.error = action.payload; },
  },
});

export const {
  setSession, clearSession, clearCommissioningContext, setFloorplan, setFloorplanLoading,
  setFloorplanError, toggleLayer, setInspectorSelection, setViewport, setDiscovering, 
  setAddressing, setTesting, setGeneratingReport, setTestResults, setFinalReport, 
  addFaultToSession, resolveFaultInSession, setError
} = commissioningSlice.actions;

export default commissioningSlice.reducer;