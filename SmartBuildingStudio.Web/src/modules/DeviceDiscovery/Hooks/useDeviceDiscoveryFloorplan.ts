// src/modules/DeviceDiscovery/Hooks/useDeviceDiscoveryFloorplan.ts

import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/Application/ConfigureStore';
import { DeviceDiscoveryFloorplanLoader } from '@/modules/DeviceDiscovery/Document/DeviceDiscoveryFloorplanLoader';
import {
  selectFloorplanId,
  selectFloorplanLoading,
} from '@/modules/DeviceDiscovery/Store/deviceDiscoverySelectors';
import {
  setFloorplan,
  setFloorplanLoading,
  setFloorplanError,
  clearSession,
  clearFloorplan,
} from '@/modules/DeviceDiscovery/Store/deviceDiscoverySlice';

export function useDeviceDiscoveryFloorplan(
  floorplanId: string | undefined,
  projectId: string | undefined,
) {
  const dispatch = useAppDispatch();
  const loadedId = useAppSelector(selectFloorplanId);
  const loading = useAppSelector(selectFloorplanLoading);

  useEffect(() => {
    if (!floorplanId || !projectId) return;
    if (loadedId === floorplanId) return;
    if (loading) return;

    // Document changed → wipe the old plan AND the old session so no
    // ghost devices/plan remain.
    if (loadedId !== null && loadedId !== floorplanId) {
      dispatch(clearSession());
      dispatch(clearFloorplan());
    }

    dispatch(setFloorplanLoading(true));

    DeviceDiscoveryFloorplanLoader.load(floorplanId, projectId, true)
      .then((outcome) => {
        if (!outcome.ok) {
          dispatch(setFloorplanError(outcome.error));
          return;
        }
        dispatch(setFloorplan({ id: floorplanId, model: outcome.model }));
      })
      .catch((e: any) => {
        dispatch(setFloorplanError(e?.message ?? 'Failed to load floorplan'));
      });
  }, [floorplanId, projectId, loadedId, loading, dispatch]);
}