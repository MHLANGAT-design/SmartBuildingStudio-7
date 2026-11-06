// src/modules/DeviceDiscovery/Workflows/gatewaySelectionWorkflow.ts

/**
 * gatewaySelectionWorkflow
 *
 * Validates the chosen gateway and applies it to the selection. Also blocks
 * changing the gateway while a session is active (you cannot switch mid-run).
 *
 * Reads GatewayManagement data via the caller-supplied `gateway` argument —
 * DeviceDiscovery does not import GatewayManagement types.
 */

import type { ThunkDispatch, UnknownAction } from '@reduxjs/toolkit';
import type { RootState } from '@/Application/ConfigureStore';

import {
  selectGateway,
  clearSession,
} from '@/modules/DeviceDiscovery/Store/deviceDiscoverySlice';
import {
  selectIsDiscovering,
  selectSession,
} from '@/modules/DeviceDiscovery/Store/deviceDiscoverySelectors';

export interface GatewaySummaryForSelection {
  gatewayId: string;
  name: string;
  /** Per the frozen architecture: DeviceDiscovery cannot call a disconnected gateway. */
  isConnected: boolean;
}

export interface GatewaySelectionContext {
  dispatch: ThunkDispatch<RootState, unknown, UnknownAction>;
  getState: () => RootState;
}

export interface GatewaySelectionResult {
  gatewayId: string;
  clearedSession: boolean;
}

export const gatewaySelectionWorkflow = {
  /**
   * Select (or clear) a gateway.
   *
   * - Throws if the gateway is disconnected.
   * - Throws if a discovery session is active.
   * - Clears the current session when switching to a *different* gateway.
   */
  select(
    ctx: GatewaySelectionContext,
    gateway: GatewaySummaryForSelection | null
  ): GatewaySelectionResult {
    const { dispatch, getState } = ctx;
    const state = getState();

    // Deselect is always allowed.
    if (!gateway) {
      const cleared = !!selectSession(state);
      dispatch(selectGateway(null));
      if (cleared) dispatch(clearSession());
      return { gatewayId: '', clearedSession: cleared };
    }

    if (!gateway.isConnected) {
      throw new Error(`Gateway "${gateway.name}" is not connected.`);
    }

    if (selectIsDiscovering(state)) {
      throw new Error('Cannot change gateway while discovery is running.');
    }

    const previous = state.deviceDiscovery.selection.selectedGatewayId;
    dispatch(selectGateway(gateway.gatewayId));

    const cleared = !!previous && previous !== gateway.gatewayId && !!selectSession(state);
    if (cleared) dispatch(clearSession());

    return { gatewayId: gateway.gatewayId, clearedSession: cleared };
  },
};