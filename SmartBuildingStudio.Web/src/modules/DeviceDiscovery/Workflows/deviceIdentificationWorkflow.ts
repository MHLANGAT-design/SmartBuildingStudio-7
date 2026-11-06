// src/modules/DeviceDiscovery/Workflows/deviceIdentificationWorkflow.ts

/**
 * deviceIdentificationWorkflow
 *
 * Identifies either a single device or every discovered device in the current
 * session. Used by DeviceIdentification/ when the engineer clicks "Identify"
 * on a single device, and by the bulk "Identify all" action.
 *
 * Updates the session's progress after each device so the progress bar moves
 * without needing the full pipeline.
 */

import type { ThunkDispatch, UnknownAction } from '@reduxjs/toolkit';
import type { RootState } from '@/Application/ConfigureStore';

import {
  setIdentification,
  setSession,
} from '@/modules/DeviceDiscovery/Store/deviceDiscoverySlice';
import { identifyDevice as identifyDeviceThunk } from '@/modules/DeviceDiscovery/Store/deviceDiscoveryThunks';

import { DeviceIdentificationEngine } from '@/modules/DeviceDiscovery/Engine/DeviceIdentificationEngine';
import type { DeviceIdentification } from '@/modules/DeviceDiscovery/Models/DeviceIdentification';
import type { DiscoveredDevice } from '@/modules/DeviceDiscovery/Models/DiscoveredDevice';
import {
  WorkflowCancelledError,
  type WorkflowAbortSignal,
} from '@/modules/DeviceDiscovery/Workflows/deviceDiscoveryWorkflow';

export interface IdentificationWorkflowContext {
  dispatch: ThunkDispatch<RootState, unknown, UnknownAction>;
  getState: () => RootState;
  now?: () => string;
}

export interface IdentificationWorkflowInput {
  /** If provided, identify only this device. Otherwise all discovered devices. */
  deviceId?: string;
  /** Mock mode: run the engine directly (skips the network). Default true. */
  simulate?: boolean;
  signal?: WorkflowAbortSignal;
}

export interface IdentificationWorkflowResult {
  identifications: DeviceIdentification[];
  succeededCount: number;
  failedCount: number;
}

const throwIfAborted = (signal?: WorkflowAbortSignal): void => {
  if (signal?.aborted) throw new WorkflowCancelledError();
};

export const deviceIdentificationWorkflow = {
  async run(
    ctx: IdentificationWorkflowContext,
    input: IdentificationWorkflowInput = {}
  ): Promise<IdentificationWorkflowResult> {
    const { dispatch, getState } = ctx;
    const now = ctx.now ?? (() => new Date().toISOString());

    const state = getState().deviceDiscovery;
    const session = state.session;
    if (!session?.sessionId) {
      throw new Error('Identification requires an active session.');
    }

    const allDevices = state.deviceIds
      .map(id => state.devicesById[id])
      .filter((d): d is DiscoveredDevice => !!d);

    const targets: DiscoveredDevice[] = input.deviceId
      ? allDevices.filter(d => d.deviceId === input.deviceId)
      : allDevices;

    if (targets.length === 0) {
      throw new Error(
        input.deviceId
          ? `Device ${input.deviceId} is not in the current session.`
          : 'No devices to identify.'
      );
    }

    const identifications: DeviceIdentification[] = [];
    const simulate = input.simulate !== false;

    for (const device of targets) {
      throwIfAborted(input.signal);

      if (simulate) {
        const ident = await DeviceIdentificationEngine.identify({ device, now });
        dispatch(setIdentification(ident));
        identifications.push(ident);
      } else {
        const ident = await dispatch(
          identifyDeviceThunk({ deviceId: device.deviceId, sessionId: session.sessionId })
        ).unwrap();
        identifications.push(ident);
      }

      // Progress after each device so the bar moves on long runs.
      const succeeded = identifications.filter(
        i => i.status === 'SUCCEEDED' || i.status === 'PARTIAL'
      ).length;
      const total = targets.length;
      const percent = total > 0 ? Math.round((identifications.length / total) * 100) : 0;
      dispatch(
        setSession({
          ...session,
          phase: 'IDENTIFYING',
          progress: {
            ...session.progress,
            percent,
            identifiedCount: succeeded,
          },
        })
      );
    }

    const succeededCount = identifications.filter(
      i => i.status === 'SUCCEEDED' || i.status === 'PARTIAL'
    ).length;
    return {
      identifications,
      succeededCount,
      failedCount: identifications.length - succeededCount,
    };
  },
};