// src/modules/Commissioning/hooks/useDeviceDiscovery.ts

import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/Application/ConfigureStore';
import {
  selectIsDiscovering,
  selectDeviceCount,
  selectActiveSession,
} from '@/modules/Commissioning/store/commissioningSelectors';
import {
  setSession,
  setDiscovering,
  setError,
} from '@/modules/Commissioning/store/commissioningSlice';
import type { DeviceState } from '@/modules/Commissioning/models/DeviceState';
import type { DiscoveryFixture } from '@/modules/DeviceDiscovery/Document/DeviceDiscoveryFloorplanLoader';
import type { DiscoverySummary } from '@/modules/Commissioning/Dialogs/DiscoverySummaryDialog';

export function useDeviceDiscovery() {
  const dispatch = useAppDispatch();
  const isDiscovering = useAppSelector(selectIsDiscovering);
  const deviceCount = useAppSelector(selectDeviceCount);
  const session = useAppSelector(selectActiveSession);

  const discoverDevices = useCallback(
    async (
      gatewayId: string,
      lineId: string,
      fixtures: DiscoveryFixture[],
    ): Promise<{ session: any; summary: DiscoverySummary }> => {
      if (!session?.sessionId) {
        const msg = 'No active commissioning session. Start a session first.';
        dispatch(setError(msg));
        throw new Error(msg);
      }

      dispatch(setDiscovering(true));
      try {
        const devicesOnLine = fixtures.filter((f) => f.lineId === lineId);

        const updatedDeviceStates = { ...session.deviceStates };
        for (const f of devicesOnLine) {
          updatedDeviceStates[f.id] = {
            deviceId: f.id,
            shortAddress: f.shortAddress ?? null,
            connectionStatus: 'ONLINE',
            lastResponseAt: new Date().toISOString(),
            isAddressed: f.shortAddress != null,
            metadata: {
              position: { x: f.x, y: f.y },
              productId: f.productId,
              productName: f.productName,
              roomId: f.roomId,
              gatewayId,
              lineId,
            },
          } as unknown as DeviceState;
        }

        const updatedSession = {
          ...session,
          deviceStates: updatedDeviceStates,
          status: 'ADDRESSING',
        };
        dispatch(setSession(updatedSession));

        // Compute the summary from what's in the session now.
        const all = Object.values(updatedSession.deviceStates) as any[];
        const matched = all.filter(
          (d) => d.matchedFixtureId != null || d.metadata?.matchStatus === 'MATCHED',
        ).length;
        const exceptions = all.filter(
          (d) =>
            d.metadata?.matchStatus === 'EXCEPTION' ||
            d.connectionStatus === 'FAULTY',
        ).length;
        const unmatched = all.filter(
          (d) =>
            d.matchedFixtureId == null &&
            d.metadata?.matchStatus == null &&
            d.connectionStatus !== 'FAULTY',
        ).length;

        const summary: DiscoverySummary = {
          totalDiscovered: all.length,
          matched,
          unmatched,
          exceptions,
        };

        return { session: updatedSession, summary };
      } catch (e: any) {
        const msg = e?.message ?? 'Discovery failed';
        dispatch(setError(msg));
        throw new Error(msg);
      } finally {
        dispatch(setDiscovering(false));
      }
    },
    [dispatch, session],
  );

  return {
    isDiscovering,
    deviceCount,
    discoverDevices,
    hasDiscovered: deviceCount > 0,
  };
}