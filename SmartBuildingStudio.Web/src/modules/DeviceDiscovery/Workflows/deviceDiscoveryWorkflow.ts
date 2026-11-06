// src/modules/DeviceDiscovery/Workflows/deviceDiscoveryWorkflow.ts

import type { ThunkDispatch, UnknownAction } from '@reduxjs/toolkit';
import type { RootState } from '@/Application/ConfigureStore';

import {
  setSession,
  setDevices,
  upsertDevice,
  setIdentification,
  setMatches,
  setResult,
  setError,
} from '@/modules/DeviceDiscovery/Store/deviceDiscoverySlice';
import {
  createSession as createSessionThunk,
  startDiscovery as startDiscoveryThunk,
  fetchDiscoveredDevices,
} from '@/modules/DeviceDiscovery/Store/deviceDiscoveryThunks';

import { DeviceDiscoveryEngine } from '@/modules/DeviceDiscovery/Engine/DeviceDiscoveryEngine';
import { DiscoverySessionEngine } from '@/modules/DeviceDiscovery/Engine/DiscoverySessionEngine';
import { DeviceIdentificationEngine } from '@/modules/DeviceDiscovery/Engine/DeviceIdentificationEngine';
import { DeviceMatchingEngine, type DesignFixture } from '@/modules/DeviceDiscovery/Engine/DeviceMatchingEngine';
import { DiscoveryResultEngine } from '@/modules/DeviceDiscovery/Engine/DiscoveryResultEngine';

import type {
  DiscoverySession,
  DiscoverySessionScope,
} from '@/modules/DeviceDiscovery/Models/DiscoverySession';
import type { DiscoveredDevice } from '@/modules/DeviceDiscovery/Models/DiscoveredDevice';
import type { DeviceIdentification } from '@/modules/DeviceDiscovery/Models/DeviceIdentification';
import type { DeviceMatch } from '@/modules/DeviceDiscovery/Models/DeviceMatch';
import type { DiscoveryResult } from '@/modules/DeviceDiscovery/Models/DiscoveryResult';

export interface WorkflowContext {
  dispatch: ThunkDispatch<RootState, unknown, UnknownAction>;
  getState: () => RootState;
  now?: () => string;
}

export interface WorkflowAbortSignal {
  aborted: boolean;
}

export class WorkflowCancelledError extends Error {
  constructor(message = 'Workflow cancelled.') {
    super(message);
    this.name = 'WorkflowCancelledError';
  }
}

const throwIfAborted = (signal?: WorkflowAbortSignal): void => {
  if (signal?.aborted) throw new WorkflowCancelledError();
};

export interface DeviceDiscoveryWorkflowInput {
  gatewayId: string;
  scope: DiscoverySessionScope;
  designFixtures: DesignFixture[];
  initiatedBy?: string | null;
  reuseSession?: DiscoverySession | null;
  simulate?: boolean;
  devicesPerLine?: number;
  signal?: WorkflowAbortSignal;
}

export interface DeviceDiscoveryWorkflowResult {
  session: DiscoverySession;
  devices: DiscoveredDevice[];
  identifications: Record<string, DeviceIdentification>;
  matches: DeviceMatch[];
  result: DiscoveryResult;
}

/** Derive the status a device should have based on its match. */
function deriveDeviceStatus(match: DeviceMatch | undefined): DiscoveredDevice['status'] {
  if (!match) return 'IDENTIFIED';
  if (match.status === 'MATCHED') return 'MATCHED';
  if (match.status === 'CONFLICT' || match.status === 'AMBIGUOUS') return 'EXCEPTION';
  if (match.status === 'UNMATCHED' && match.discrepancies.length === 0) return 'IDENTIFIED';
  return 'EXCEPTION';
}

export const deviceDiscoveryWorkflow = {
  async run(
    ctx: WorkflowContext,
    input: DeviceDiscoveryWorkflowInput
  ): Promise<DeviceDiscoveryWorkflowResult> {
    const { dispatch, getState } = ctx;
    const now = ctx.now ?? (() => new Date().toISOString());

    if (!input.gatewayId) {
      throw new Error('A gateway must be selected before starting discovery.');
    }
    if (!input.scope?.daliLineIds?.length) {
      throw new Error('At least one DALI line must be selected.');
    }

    /* ---- 1. Session ---- */
    throwIfAborted(input.signal);

    let session: DiscoverySession;
    if (input.reuseSession && input.reuseSession.sessionId) {
      session = input.reuseSession;
    } else {
      const created = await dispatch(
        createSessionThunk({
          gatewayId: input.gatewayId,
          scope: input.scope,
          initiatedBy: input.initiatedBy ?? null,
        })
      ).unwrap();
      session = created;
    }
    session = DiscoverySessionEngine.toStarting(session, { now });
    dispatch(setSession(session));

    /* ---- 2. Physical discovery ---- */
    throwIfAborted(input.signal);
    session = DiscoverySessionEngine.toRunning(session, {
      message: 'Discovering devices…',
      now,
    });
    dispatch(setSession(session));

    const run = await DeviceDiscoveryEngine.run({
      sessionId: session.sessionId,
      gatewayId: session.gatewayId,
      scope: session.scope,
      designFixtures: input.designFixtures,
      devicesPerLine: input.devicesPerLine,
      simulate: input.simulate !== false,
      now,
    });
    const devices = run.devices;
    dispatch(setDevices(devices));
    session = DiscoverySessionEngine.withProgress(session, {
      percent: devices.length > 0 ? 25 : 0,
      discoveredCount: devices.length,
    });
    dispatch(setSession(session));

    /* ---- 3. Identification ---- */
    throwIfAborted(input.signal);
    session = { ...session, phase: 'IDENTIFYING', statusMessage: 'Identifying devices…' };
    dispatch(setSession(session));

    const identifications: Record<string, DeviceIdentification> = {};
    for (const device of devices) {
      throwIfAborted(input.signal);
      const ident = await DeviceIdentificationEngine.identify({ device, now });
      identifications[device.deviceId] = ident;
      dispatch(setIdentification(ident));
    }
    const identifiedCount = Object.values(identifications).filter(
      i => i.status === 'SUCCEEDED' || i.status === 'PARTIAL'
    ).length;
    session = DiscoverySessionEngine.withProgress(session, {
      percent: devices.length > 0 ? 25 + Math.round((identifiedCount / devices.length) * 40) : 0,
      identifiedCount,
    });
    dispatch(setSession(session));

    /* ---- 4. Matching ---- */
    throwIfAborted(input.signal);
    session = { ...session, phase: 'MATCHING', statusMessage: 'Matching to design…' };
    dispatch(setSession(session));

    const matches = DeviceMatchingEngine.match({
      sessionId: session.sessionId,
      devices,
      designFixtures: input.designFixtures ?? [],
      now,
    });
    dispatch(setMatches(matches));

    // ── Update each device with its match result so the canvas layer sees it ──
    const matchByDeviceId = new Map<string, DeviceMatch>();
    for (const m of matches) {
      if (m.deviceId) matchByDeviceId.set(m.deviceId, m);
    }
    const updatedDevices: DiscoveredDevice[] = devices.map(d => {
      const m = matchByDeviceId.get(d.deviceId);
      const status = deriveDeviceStatus(m);
      return {
        ...d,
        status,
        matchedFixtureId: m?.fixtureId ?? null,
        matchConfidence: m?.confidence ?? null,
      };
    });
    // Re-emit the updated device list so `selectDiscoveredDevices` (and the
    // overlay layer) sees the matched/exceptional statuses.
    dispatch(setDevices(updatedDevices));

    const matchedCount = matches.filter(m => m.status === 'MATCHED').length;
    session = DiscoverySessionEngine.withProgress(session, {
      percent: 90,
      matchedCount,
    });
    dispatch(setSession(session));

    /* ---- 5. Result ---- */
    throwIfAborted(input.signal);
    const result = DiscoveryResultEngine.compute({
      sessionId: session.sessionId,
      devices: updatedDevices,
      identifications,
      matches,
      now,
    });
    dispatch(setResult(result));

    /* ---- 6. Complete ---- */
    session = DiscoverySessionEngine.toCompleted(session, {
      message: `Discovery complete — ${matchedCount}/${devices.length} matched.`,
      progress: { exceptionCount: result.counts.exceptions },
      now,
    });
    dispatch(setSession(session));

    return {
      session,
      devices: updatedDevices,
      identifications,
      matches,
      result,
    };
  },

  async rehydrate(ctx: WorkflowContext): Promise<void> {
    const session = ctx.getState().deviceDiscovery.session;
    if (!session?.sessionId) return;
    try {
      await ctx.dispatch(fetchDiscoveredDevices({ sessionId: session.sessionId })).unwrap();
    } catch {
      /* device fetch already wrote the error slot; swallow so rehydrate is non-fatal */
    }
  },
};