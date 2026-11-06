// src/modules/DeviceDiscovery/Store/deviceDiscoveryThunks.ts

import { createAsyncThunk } from '@reduxjs/toolkit';
import type { ThunkDispatch, UnknownAction } from '@reduxjs/toolkit';
import type { RootState } from '@/Application/ConfigureStore';

import { DiscoverySessionService } from '@/modules/DeviceDiscovery/Services/DiscoverySessionService';
import { DeviceIdentificationService } from '@/modules/DeviceDiscovery/Services/DeviceIdentificationService';
import { DeviceMatchingService } from '@/modules/DeviceDiscovery/Services/DeviceMatchingService';
import { DiscoveryHistoryService } from '@/modules/DeviceDiscovery/Services/DiscoveryHistoryService';
import { DeviceDiscoveryApi } from '@/modules/DeviceDiscovery/Services/DeviceDiscoveryApi';

import type {
  DiscoverySession,
  DiscoverySessionScope,
} from '@/modules/DeviceDiscovery/Models/DiscoverySession';
import type { DiscoveredDevice } from '@/modules/DeviceDiscovery/Models/DiscoveredDevice';
import type { DeviceIdentification } from '@/modules/DeviceDiscovery/Models/DeviceIdentification';
import type { DeviceMatch } from '@/modules/DeviceDiscovery/Models/DeviceMatch';
import type { DiscoveryResult } from '@/modules/DeviceDiscovery/Models/DiscoveryResult';

import {
  setAsyncFlag,
  setError,
  setSession,
  setDevices,
  setIdentification,
  setMatches,
  setResult,
  setHistory,
  upsertHistoryEntry,
} from '@/modules/DeviceDiscovery/Store/deviceDiscoverySlice';

import type {
  AsyncFlags,
  ErrorBag,
} from '@/modules/DeviceDiscovery/Store/deviceDiscoveryTypes';

type DDispatch = ThunkDispatch<RootState, unknown, UnknownAction>;

const toMessage = (err: unknown): string =>
  err instanceof Error ? err.message : String(err);

const withFlag = async <T>(
  dispatch: DDispatch,
  flag: keyof AsyncFlags,
  slot: keyof ErrorBag,
  fn: () => Promise<T>
): Promise<T> => {
  dispatch(setAsyncFlag({ flag, value: true }));
  dispatch(setError({ slot, message: null }));
  try {
    return await fn();
  } catch (err) {
    dispatch(setError({ slot, message: toMessage(err) }));
    throw err;
  } finally {
    dispatch(setAsyncFlag({ flag, value: false }));
  }
};

const guard = (
  dispatch: DDispatch,
  slot: keyof ErrorBag,
  condition: unknown,
  message: string
): void => {
  if (!condition) {
    dispatch(setError({ slot, message }));
    throw new Error(message);
  }
};

const sessionIdOf = (
  args: { sessionId?: string },
  getState: () => RootState
): string =>
  args.sessionId ?? getState().deviceDiscovery.session?.sessionId ?? '';

/* ------------------------------------------------------------------ */
/* Session lifecycle                                                   */
/* ------------------------------------------------------------------ */

export interface CreateSessionArgs {
  gatewayId: string;
  scope: DiscoverySessionScope;
  initiatedBy?: string | null;
}

export interface SessionActionArgs {
  sessionId?: string; // defaults to current store session
}

export const createSession = createAsyncThunk<
  DiscoverySession,
  CreateSessionArgs,
  { state: RootState }
>('deviceDiscovery/createSession', async (args, { dispatch }) => {
  const session = await withFlag(
    dispatch,
    'createSession',
    'session',
    () => DiscoverySessionService.create(args)
  );
  dispatch(setSession(session));
  return session;
});

export const startDiscovery = createAsyncThunk<
  DiscoverySession,
  SessionActionArgs,
  { state: RootState }
>('deviceDiscovery/startDiscovery', async (args, { getState, dispatch }) => {
  const current = getState().deviceDiscovery.session;
  const sessionId = sessionIdOf(args, getState);
  guard(dispatch, 'session', sessionId, 'No session to start.');

  const updated = await withFlag(
    dispatch,
    'startDiscovery',
    'session',
    () => DiscoverySessionService.start(sessionId, current)
  );
  dispatch(setSession(updated));
  return updated;
});

export const stopDiscovery = createAsyncThunk<
  DiscoverySession,
  SessionActionArgs,
  { state: RootState }
>('deviceDiscovery/stopDiscovery', async (args, { getState, dispatch }) => {
  const current = getState().deviceDiscovery.session;
  const sessionId = sessionIdOf(args, getState);
  guard(dispatch, 'session', sessionId, 'No session to stop.');

  // Optimistically update the UI to "STOPPING" so the button doesn't flash
  if (current) {
    dispatch(setSession({ ...current, status: 'STOPPING', phase: 'MATCHING' }));
  }

  const updated = await withFlag(
    dispatch,
    'stopDiscovery',
    'session',
    () => DiscoverySessionService.stop(sessionId, current)
  );
  dispatch(setSession(updated));
  return updated;
});

export const cancelDiscovery = createAsyncThunk<
  DiscoverySession,
  SessionActionArgs,
  { state: RootState }
>('deviceDiscovery/cancelDiscovery', async (args, { getState, dispatch }) => {
  const sessionId = sessionIdOf(args, getState);
  guard(dispatch, 'session', sessionId, 'No session to cancel.');

  const updated = await withFlag(
    dispatch,
    'cancelDiscovery',
    'session',
    () => DiscoverySessionService.cancel(sessionId)
  );
  dispatch(setSession(updated));
  return updated;
});

export const refreshSession = createAsyncThunk<
  DiscoverySession,
  SessionActionArgs,
  { state: RootState }
>('deviceDiscovery/refreshSession', async (args, { getState, dispatch }) => {
  const sessionId = sessionIdOf(args, getState);
  guard(dispatch, 'session', sessionId, 'No session to refresh.');

  const updated = await withFlag(
    dispatch,
    'refreshSession',
    'session',
    () => DiscoverySessionService.get(sessionId)
  );
  dispatch(setSession(updated));
  return updated;
});

/* ------------------------------------------------------------------ */
/* Devices                                                             */
/* ------------------------------------------------------------------ */

export const fetchDiscoveredDevices = createAsyncThunk<
  DiscoveredDevice[],
  SessionActionArgs,
  { state: RootState }
>('deviceDiscovery/fetchDiscoveredDevices', async (args, { getState, dispatch }) => {
  const sessionId = sessionIdOf(args, getState);
  guard(dispatch, 'devices', sessionId, 'No session to fetch devices for.');

  const devices = await withFlag(
    dispatch,
    'fetchDevices',
    'devices',
    () => DeviceDiscoveryApi.getDiscoveredDevices(sessionId)
  );
  dispatch(setDevices(devices));
  return devices;
});

/* ------------------------------------------------------------------ */
/* Identification                                                      */
/* ------------------------------------------------------------------ */

export interface IdentifyDeviceArgs {
  deviceId: string;
  sessionId?: string;
}

export const identifyDevice = createAsyncThunk<
  DeviceIdentification,
  IdentifyDeviceArgs,
  { state: RootState }
>('deviceDiscovery/identifyDevice', async (args, { getState, dispatch }) => {
  const sessionId = sessionIdOf(args, getState);
  guard(dispatch, 'identification', sessionId, 'Identification requires a session.');
  guard(dispatch, 'identification', args.deviceId, 'Identification requires a device.');

  const result = await withFlag(
    dispatch,
    'identifyDevice',
    'identification',
    () => DeviceIdentificationService.identify(sessionId, args.deviceId)
  );
  dispatch(setIdentification(result));
  return result;
});

/* ------------------------------------------------------------------ */
/* Matching                                                            */
/* ------------------------------------------------------------------ */

export const matchDiscoveredDevices = createAsyncThunk<
  DeviceMatch[],
  SessionActionArgs,
  { state: RootState }
>('deviceDiscovery/matchDiscoveredDevices', async (args, { getState, dispatch }) => {
  const sessionId = sessionIdOf(args, getState);
  guard(dispatch, 'matching', sessionId, 'Matching requires a session.');

  const matches = await withFlag(
    dispatch,
    'matchDevices',
    'matching',
    () => DeviceMatchingService.match(sessionId)
  );
  dispatch(setMatches(matches));
  return matches;
});

export const fetchMatches = createAsyncThunk<
  DeviceMatch[],
  SessionActionArgs,
  { state: RootState }
>('deviceDiscovery/fetchMatches', async (args, { getState, dispatch }) => {
  const sessionId = sessionIdOf(args, getState);
  guard(dispatch, 'matching', sessionId, 'No session to fetch matches for.');

  const matches = await withFlag(
    dispatch,
    'fetchMatches',
    'matching',
    () => DeviceMatchingService.list(sessionId)
  );
  dispatch(setMatches(matches));
  return matches;
});

/* ------------------------------------------------------------------ */
/* Results                                                             */
/* ------------------------------------------------------------------ */

export const fetchResults = createAsyncThunk<
  DiscoveryResult,
  SessionActionArgs,
  { state: RootState }
>('deviceDiscovery/fetchResults', async (args, { getState, dispatch }) => {
  const sessionId = sessionIdOf(args, getState);
  guard(dispatch, 'results', sessionId, 'No session to fetch results for.');

  const result = await withFlag(
    dispatch,
    'fetchResults',
    'results',
    () => DeviceDiscoveryApi.getResults(sessionId)
  );
  dispatch(setResult(result));
  return result;
});

/* ------------------------------------------------------------------ */
/* History                                                             */
/* ------------------------------------------------------------------ */

export const fetchHistory = createAsyncThunk<
  DiscoverySession[],
  void,
  { state: RootState }
>('deviceDiscovery/fetchHistory', async (_args, { dispatch }) => {
  const list = await withFlag(
    dispatch,
    'fetchHistory',
    'history',
    () => DiscoveryHistoryService.list()
  );
  dispatch(setHistory(list));
  return list;
});

export const fetchHistoryEntry = createAsyncThunk<
  DiscoverySession,
  { sessionId: string },
  { state: RootState }
>('deviceDiscovery/fetchHistoryEntry', async (args, { dispatch }) => {
  guard(dispatch, 'history', args.sessionId, 'A session id is required.');

  const session = await withFlag(
    dispatch,
    'fetchHistoryEntry',
    'history',
    () => DiscoveryHistoryService.get(args.sessionId)
  );
  dispatch(upsertHistoryEntry(session));
  return session;
});