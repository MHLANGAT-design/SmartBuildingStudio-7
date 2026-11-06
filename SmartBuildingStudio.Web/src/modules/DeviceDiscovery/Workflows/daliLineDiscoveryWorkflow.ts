// src/modules/DeviceDiscovery/Workflows/daliLineDiscoveryWorkflow.ts

/**
 * daliLineDiscoveryWorkflow
 *
 * Discovery scoped to a single DALI line. This is the "re-discover one line"
 * path used by the DaliLineSelector when an engineer wants to refresh a single
 * line without re-running the whole floor.
 *
 * Reuses deviceDiscoveryWorkflow but with a single-line scope, and merges
 * results back into the existing session rather than replacing it.
 */

import type { ThunkDispatch, UnknownAction } from '@reduxjs/toolkit';
import type { RootState } from '@/Application/ConfigureStore';

import {
  setDevices,
  setIdentification,
  setMatches,
  setResult,
  setSession,
} from '@/modules/DeviceDiscovery/Store/deviceDiscoverySlice';

import { DeviceDiscoveryEngine } from '@/modules/DeviceDiscovery/Engine/DeviceDiscoveryEngine';
import { DeviceIdentificationEngine } from '@/modules/DeviceDiscovery/Engine/DeviceIdentificationEngine';
import { DeviceMatchingEngine, type DesignFixture } from '@/modules/DeviceDiscovery/Engine/DeviceMatchingEngine';
import { DiscoveryResultEngine } from '@/modules/DeviceDiscovery/Engine/DiscoveryResultEngine';

import type { DiscoveredDevice } from '@/modules/DeviceDiscovery/Models/DiscoveredDevice';
import type { DeviceIdentification } from '@/modules/DeviceDiscovery/Models/DeviceIdentification';
import type { DeviceMatch } from '@/modules/DeviceDiscovery/Models/DeviceMatch';
import type { DiscoverySession } from '@/modules/DeviceDiscovery/Models/DiscoverySession';
import {
  WorkflowCancelledError,
  type WorkflowAbortSignal,
  type WorkflowContext,
} from '@/modules/DeviceDiscovery/Workflows/deviceDiscoveryWorkflow';

export interface DaliLineDiscoveryInput {
  daliLineId: string;
  designFixtures: DesignFixture[]; // fixtures *on this line only*
  simulate?: boolean;
  devicesPerLine?: number;
  signal?: WorkflowAbortSignal;
}

export interface DaliLineDiscoveryResult {
  session: DiscoverySession;
  lineDevices: DiscoveredDevice[];
  mergedDevices: DiscoveredDevice[];
  mergedMatches: DeviceMatch[];
}

const throwIfAborted = (signal?: WorkflowAbortSignal): void => {
  if (signal?.aborted) throw new WorkflowCancelledError();
};

export const daliLineDiscoveryWorkflow = {
  async run(
    ctx: WorkflowContext,
    input: DaliLineDiscoveryInput
  ): Promise<DaliLineDiscoveryResult> {
    const { dispatch, getState } = ctx;
    const now = ctx.now ?? (() => new Date().toISOString());

    const session = getState().deviceDiscovery.session;
    if (!session?.sessionId) {
      throw new Error('Start a discovery session before re-discovering a line.');
    }
    if (!input.daliLineId) {
      throw new Error('A DALI line must be selected.');
    }
    if (session.status !== 'RUNNING' && session.status !== 'STOPPING') {
      throw new Error(`Cannot re-discover a line while session is ${session.status}.`);
    }

    /* ---- Discover only this line ---- */
    throwIfAborted(input.signal);
    dispatch(setSession({ ...session, phase: 'DISCOVERING', statusMessage: `Re-discovering ${input.daliLineId}…` }));

    const run = await DeviceDiscoveryEngine.run({
      sessionId: session.sessionId,
      gatewayId: session.gatewayId,
      scope: { ...session.scope, daliLineIds: [input.daliLineId] },
      devicesPerLine: input.devicesPerLine,
      simulate: input.simulate !== false,
      now,
    });
    const lineDevices = run.devices;

    /* ---- Identify only the new devices ---- */
    throwIfAborted(input.signal);
    const identifications: Record<string, DeviceIdentification> = {};
    const existingIdentifications = getState().deviceDiscovery.identificationsByDeviceId;
    for (const device of lineDevices) {
      throwIfAborted(input.signal);
      const ident = await DeviceIdentificationEngine.identify({ device, now });
      identifications[device.deviceId] = ident;
      dispatch(setIdentification(ident));
    }

    /* ---- Match only this line ---- */
    throwIfAborted(input.signal);
    const lineMatches = DeviceMatchingEngine.match({
      sessionId: session.sessionId,
      devices: lineDevices,
      designFixtures: input.designFixtures ?? [],
      now,
    });

    /* ---- Merge into the existing session's collections ---- */
    const state = getState().deviceDiscovery;
    const mergedDevicesById: Record<string, DiscoveredDevice> = { ...state.devicesById };
    const mergedDeviceIds: string[] = [...state.deviceIds];
    for (const d of lineDevices) {
      if (!mergedDevicesById[d.deviceId]) mergedDeviceIds.push(d.deviceId);
      mergedDevicesById[d.deviceId] = d;
    }

    // Drop old devices on this line first, so re-discovery doesn't duplicate.
    const deviceIdsOnOtherLines = mergedDeviceIds.filter(
      id => mergedDevicesById[id]?.daliLineId !== input.daliLineId
    );
    const finalDeviceIds = [
      ...deviceIdsOnOtherLines,
      ...lineDevices.map(d => d.deviceId),
    ];
    const finalDevices = finalDeviceIds.map(id => mergedDevicesById[id]).filter(Boolean);
    dispatch(setDevices(finalDevices));

    // Matches: drop matches whose device is on this line (stale), then add new.
    const staleMatchDeviceIds = new Set(
      lineDevices.map(d => d.deviceId)
    );
    const otherMatches = state.matchIds
      .map(id => state.matchesById[id])
      .filter(m => m && !staleMatchDeviceIds.has(m.deviceId));
    const mergedMatches = [...otherMatches, ...lineMatches];
    dispatch(setMatches(mergedMatches));

    /* ---- Recompute result over the merged set ---- */
    throwIfAborted(input.signal);
    const mergedIdentifications: Record<string, DeviceIdentification> = {
      ...existingIdentifications,
      ...identifications,
    };
    const result = DiscoveryResultEngine.compute({
      sessionId: session.sessionId,
      devices: finalDevices,
      identifications: mergedIdentifications,
      matches: mergedMatches,
      now,
    });
    dispatch(setResult(result));

    const updatedSession = {
      ...session,
      phase: 'MATCHING' as const,
      statusMessage: `Line ${input.daliLineId} refreshed.`,
      progress: {
        ...session.progress,
        discoveredCount: finalDevices.length,
        matchedCount: mergedMatches.filter(m => m.status === 'MATCHED').length,
        exceptionCount: result.counts.exceptions,
      },
    };
    dispatch(setSession(updatedSession));

    return {
      session: updatedSession,
      lineDevices,
      mergedDevices: finalDevices,
      mergedMatches,
    };
  },
};