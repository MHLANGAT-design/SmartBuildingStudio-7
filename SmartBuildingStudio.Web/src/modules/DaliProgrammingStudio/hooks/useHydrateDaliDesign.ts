// src/modules/DaliProgrammingStudio/hooks/useHydrateDaliDesign.ts

import { useEffect, useLayoutEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/Application/ConfigureStore';

import {
  loadDaliNetwork,
  loadFloorplan,
} from '@/modules/DaliDesigner/store/daliThunks';
import { resetDaliDocument } from '@/modules/DaliDesigner/store/daliSlice';
import { DaliApi } from '@/modules/DaliDesigner/services/DaliApi';
import {
  selectStatus,
  selectError,
  selectDocument,
  selectFloorplanModel,
  selectFloorplanStatus,
} from '@/modules/DaliDesigner/store/daliSelectors';
import { selectDocumentFresh } from '@/modules/Shared/DocumentVersion/selectDocumentFresh';

export interface HydrationState {
  ready: boolean;
  loading: boolean;
  error: string | null;
}

/**
 * Bootstraps the DaliDesigner Redux slice for the current URL.
 * Uses the exact same pattern as DaliDesignerPage.
 */
export function useHydrateDaliDesign(): HydrationState {
  const { projectId, floorplanId, networkId } = useParams<{
    projectId: string;
    floorplanId: string;
    networkId?: string;
  }>();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const status = useAppSelector(selectStatus);
  const error = useAppSelector(selectError);
  const documentId = useAppSelector(selectDocument).id;
  const storeFloorplanId = useAppSelector(
    (s: any) => s.dali?.document?.floorplanId ?? null,
  );
  const floorplanModel = useAppSelector(selectFloorplanModel);
  const floorplanStatus = useAppSelector(selectFloorplanStatus);

  const [resolving, setResolving] = useState(false);

  const sliceMatchesUrl =
    !!storeFloorplanId &&
    !!floorplanId &&
    storeFloorplanId === floorplanId &&
    (!networkId || documentId === networkId);

  const floorplanModelId = (floorplanModel as any)?.documentId ?? null;
  const floorplanReady =
    floorplanStatus === 'ready' &&
    !!floorplanModel &&
    !!floorplanId &&
    floorplanModelId === floorplanId;

  const isFresh = useAppSelector(selectDocumentFresh(floorplanId || ''));

  // 1. Reset before paint on cache miss
  useLayoutEffect(() => {
    if (!floorplanId) return;
    if (sliceMatchesUrl && floorplanReady) return;
    dispatch(resetDaliDocument());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, floorplanId, networkId]);

  // 2. Load DALI network
  useEffect(() => {
    if (!projectId || !floorplanId) return;
    if (sliceMatchesUrl) return;

    if (networkId) {
      dispatch(loadDaliNetwork({ projectId, floorplanId, networkId }));
      return;
    }

    let cancelled = false;
    setResolving(true);
    DaliApi.listNetworksForFloorplan(projectId, floorplanId)
      .then((networks: any[]) => {
        if (cancelled) return;
        if (networks.length > 0) {
          // Redirect to the specific programming URL with networkId
          navigate(
            `/projects/${projectId}/floorplans/${floorplanId}/programming/${networks[0].id}`,
            { replace: true },
          );
        } else {
          dispatch(loadDaliNetwork({ projectId, floorplanId }));
        }
      })
      .catch((e: any) => {
        if (cancelled) return;
        console.warn('[useHydrateDaliDesign] network lookup failed:', e);
        dispatch(loadDaliNetwork({ projectId, floorplanId }));
      })
      .finally(() => {
        if (!cancelled) setResolving(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, projectId, floorplanId, networkId, navigate]);

  // 3. Load floorplan geometry
  useEffect(() => {
    if (!floorplanId) return;
    if (floorplanStatus === 'loading') return;
    if (floorplanReady && isFresh) return;
    dispatch(loadFloorplan({ floorplanId }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, floorplanId, floorplanStatus, floorplanReady, isFresh]);

  // 4. Adopt loaded network id into URL
  useEffect(() => {
    if (!projectId || !floorplanId) return;
    if (!documentId) return;
    if (networkId === documentId) return;
    if (storeFloorplanId !== floorplanId) return;

    navigate(
      `/projects/${projectId}/floorplans/${floorplanId}/programming/${documentId}`,
      { replace: true },
    );
  }, [documentId, networkId, storeFloorplanId, navigate, projectId, floorplanId]);

  const loading = status === 'loading' || !sliceMatchesUrl || !floorplanReady || resolving;

  return {
    ready: !loading && !error,
    loading,
    error,
  };
}