// src/modules/Commissioning/hooks/useCommissioningFloorplan.ts

import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/Application/ConfigureStore';
import { CommissioningFloorplanLoader } from '@/modules/Commissioning/Document/CommissioningFloorplanLoader';
import {
  selectCommissioningFloorplanId,
  selectCommissioningFloorplanLoading,
} from '@/modules/Commissioning/store/commissioningSelectors';
import {
  setFloorplan,
  setFloorplanLoading,
  setFloorplanError,
  clearCommissioningContext,
} from '@/modules/Commissioning/store/commissioningSlice';

export function useCommissioningFloorplan(floorplanId: string | undefined) {
  const dispatch = useAppDispatch();
  const loadedId = useAppSelector(selectCommissioningFloorplanId);
  const loading = useAppSelector(selectCommissioningFloorplanLoading);

  useEffect(() => {
    if (!floorplanId) return;

    if (loadedId === floorplanId) return;
    if (loading) return;

    // Wipe the old plan AND the old session so no ghost devices remain.
    if (loadedId !== null && loadedId !== floorplanId) {
      dispatch(clearCommissioningContext());
    }

    dispatch(setFloorplanLoading(true));

    CommissioningFloorplanLoader.load(floorplanId, true)
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
  }, [floorplanId, loadedId, loading, dispatch]);
}