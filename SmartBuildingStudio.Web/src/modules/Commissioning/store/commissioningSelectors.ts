// src/modules/Commissioning/store/commissioningSelectors.ts

import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@/Application/ConfigureStore';
import type { CommissioningState, CommissioningInspectorSelection } from '@/modules/Commissioning/store/commissioningTypes';
import type { Fault } from '@/modules/Commissioning/models/Fault';
import type { CommissioningFloorplanRenderModel } from '@/modules/Commissioning/Document/CommissioningFloorplanLoader';

const selectCommissioningState = (state: RootState): CommissioningState =>
  (state as any).commissioning;

const EMPTY_FAULTS: Fault[] = [];

export const selectActiveSession = (state: RootState) =>
  selectCommissioningState(state)?.activeSession ?? null;
export const selectSessionStatus = (state: RootState) =>
  selectCommissioningState(state)?.activeSession?.status || 'IDLE';
export const selectIsDiscovering = (state: RootState) =>
  selectCommissioningState(state)?.isDiscovering ?? false;
export const selectIsAddressing = (state: RootState) =>
  selectCommissioningState(state)?.isAddressing ?? false;
export const selectIsTesting = (state: RootState) =>
  selectCommissioningState(state)?.isTesting ?? false;
export const selectIsGeneratingReport = (state: RootState) =>
  selectCommissioningState(state)?.isGeneratingReport ?? false;
export const selectRecentTestResults = (state: RootState) =>
  selectCommissioningState(state)?.recentTestResults ?? [];
export const selectFinalReport = (state: RootState) =>
  selectCommissioningState(state)?.finalReport ?? null;
export const selectActiveFaults = createSelector(
  [(state: RootState) => selectActiveSession(state)?.activeFaults ?? EMPTY_FAULTS],
  (faults): Fault[] => faults.filter((f) => !f.isResolved),
);
export const selectDeviceCount = (state: RootState): number =>
  Object.keys(selectActiveSession(state)?.deviceStates ?? {}).length;
export const selectError = (state: RootState) =>
  selectCommissioningState(state)?.error ?? null;
export const selectCommissioningFloorplanId = (state: RootState): string | null =>
  selectCommissioningState(state)?.floorplanId ?? null;
export const selectCommissioningFloorplan = (state: RootState): CommissioningFloorplanRenderModel | null =>
  selectCommissioningState(state)?.floorplan ?? null;
export const selectCommissioningFloorplanLoading = (state: RootState): boolean =>
  selectCommissioningState(state)?.floorplanLoading ?? false;
export const selectCommissioningFloorplanError = (state: RootState): string | null =>
  selectCommissioningState(state)?.floorplanError ?? null;
export const selectCommissioningViewport = (state: RootState): { offsetX: number; offsetY: number; zoom: number } =>
  selectCommissioningState(state)?.viewport ?? { offsetX: 0, offsetY: 0, zoom: 1 };
export const selectLayerVisibility = (state: RootState): Record<string, boolean> =>
  selectCommissioningState(state)?.layerVisibility ?? {};

// NEW: Unified selection selector
export const selectInspectorSelection = (state: RootState): CommissioningInspectorSelection =>
  selectCommissioningState(state)?.inspectorSelection ?? null;

// Backwards compatibility for canvas layers that only look for device IDs
export const selectSelectedDeviceId = (state: RootState): string | null => {
  const sel = selectInspectorSelection(state);
  return sel?.kind === 'device' ? sel.id : null;
};