// src/modules/DeviceDiscovery/Workflows/deviceMatchingWorkflow.ts

/**
 * deviceMatchingWorkflow
 *
 * Matches the current session's discovered devices against the ProjectExplorer
 * design, then recomputes the aggregate DiscoveryResult.
 *
 * This is the "re-match" path used by DeviceMatching/ when the design has been
 * updated in ProjectExplorer and the engineer wants to re-check discrepancies
 * without re-running physical discovery.
 *
 * Read-only on ProjectExplorer: fixtures are passed in as DesignFixture[].
 */

import type { ThunkDispatch, UnknownAction } from '@reduxjs/toolkit';
import type { RootState } from '@/Application/ConfigureStore';

import {
  setMatches,
  setResult,
  setSession,
} from '@/modules/DeviceDiscovery/Store/deviceDiscoverySlice';

import {
  DeviceMatchingEngine,
  type DesignFixture,
} from '@/modules/DeviceDiscovery/Engine/DeviceMatchingEngine';
import { DiscoveryResultEngine } from '@/modules/DeviceDiscovery/Engine/DiscoveryResultEngine';

import type { DeviceMatch } from '@/modules/DeviceDiscovery/Models/DeviceMatch';
import type { DiscoveryResult } from '@/modules/DeviceDiscovery/Models/DiscoveryResult';
import type { DeviceIdentification } from '@/modules/DeviceDiscovery/Models/DeviceIdentification';
import type { DiscoveredDevice } from '@/modules/DeviceDiscovery/Models/DiscoveredDevice';
import {
  WorkflowCancelledError,
  type WorkflowAbortSignal,
} from '@/modules/DeviceDiscovery/Workflows/deviceDiscoveryWorkflow';

export interface MatchingWorkflowContext {
  dispatch: ThunkDispatch<RootState, unknown, UnknownAction>;
  getState: () => RootState;
  now?: () => string;
}

export interface MatchingWorkflowInput {
  designFixtures: DesignFixture[];
  signal?: WorkflowAbortSignal;
}

export interface MatchingWorkflowResult {
  matches: DeviceMatch[];
  result: DiscoveryResult;
  matchedCount: number;
  conflictCount: number;
}

const throwIfAborted = (signal?: WorkflowAbortSignal): void => {
  if (signal?.aborted) throw new WorkflowCancelledError();
};

export const deviceMatchingWorkflow = {
  async run(
    ctx: MatchingWorkflowContext,
    input: MatchingWorkflowInput
  ): Promise<MatchingWorkflowResult> {
    const { dispatch, getState } = ctx;
    const now = ctx.now ?? (() => new Date().toISOString());

    const state = getState().deviceDiscovery;
    const session = state.session;
    if (!session?.sessionId) {
      throw new Error('Matching requires an active session.');
    }
    if (!input.designFixtures) {
      throw new Error('Design fixtures from ProjectExplorer are required for matching.');
    }

    const devices: DiscoveredDevice[] = state.deviceIds
      .map(id => state.devicesById[id])
      .filter((d): d is DiscoveredDevice => !!d);

    if (devices.length === 0) {
      throw new Error('No discovered devices to match.');
    }

    throwIfAborted(input.signal);
    dispatch(setSession({ ...session, phase: 'MATCHING', statusMessage: 'Matching to design…' }));

    /* ---- Match ---- */
    const matches = DeviceMatchingEngine.match({
      sessionId: session.sessionId,
      devices,
      designFixtures: input.designFixtures,
      now,
    });
    dispatch(setMatches(matches));

    /* ---- Recompute result ---- */
    throwIfAborted(input.signal);
    const identifications: Record<string, DeviceIdentification> = state.identificationsByDeviceId;
    const result = DiscoveryResultEngine.compute({
      sessionId: session.sessionId,
      devices,
      identifications,
      matches,
      now,
    });
    dispatch(setResult(result));

    const matchedCount = matches.filter(m => m.status === 'MATCHED').length;
    const conflictCount = matches.filter(m => m.status === 'CONFLICT').length;

    dispatch(
      setSession({
        ...session,
        phase: 'MATCHING',
        statusMessage: `${matchedCount}/${devices.length} matched, ${conflictCount} conflicts.`,
        progress: {
          ...session.progress,
          matchedCount,
          exceptionCount: result.counts.exceptions,
        },
      })
    );

    return { matches, result, matchedCount, conflictCount };
  },
};