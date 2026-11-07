// src/modules/Commissioning/hooks/useFloorplanDaliLines.ts

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { API_ROUTES } from '@/Application/ApiRoutes';
import {
  DeviceDiscoveryFloorplanLoader,
  type DiscoveryDaliLine,
  type DiscoveryFixture,
} from '@/modules/DeviceDiscovery/Document/DeviceDiscoveryFloorplanLoader';

export interface DaliLineRef {
  lineId: string;
  name: string;
}

export interface DaliSceneRef {
  sceneId: string;
  name: string;
}

export function useFloorplanDaliLines() {
  const { projectId, floorplanId } = useParams<{
    projectId: string;
    floorplanId: string;
  }>();

  const [lines, setLines] = useState<DaliLineRef[]>([]);
  const [fixtures, setFixtures] = useState<DiscoveryFixture[]>([]);
  const [scenes, setScenes] = useState<DaliSceneRef[]>([]);
  const [isLoading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!floorplanId || !projectId) {
      setLines([]);
      setFixtures([]);
      setScenes([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        // 1. Lines + fixtures (same loader the dialog's line select already uses).
        const outcome = await DeviceDiscoveryFloorplanLoader.load(
          floorplanId,
          projectId,
          true,
        );
        if (cancelled) return;
        if (!outcome.ok) throw new Error(outcome.error);

        setLines(
          (outcome.model.daliLines ?? []).map((l: DiscoveryDaliLine) => ({
            lineId: l.lineId,
            name: l.name,
          })),
        );
        setFixtures(outcome.model.fixtures ?? []);

        // 2. Scenes live on the DALI network detail, next to lines and groups.
        //    Fetch the same network(s) the loader just fetched and read
        //    detail.scenes.
        const networksUrl = API_ROUTES.DALI_DESIGNER_SERVICE.NETWORKS_FOR_FLOORPLAN(
          projectId,
          floorplanId,
        );
        const networksRes = await fetch(networksUrl, {
          headers: { Accept: 'application/json' },
        });
        const networks: Array<{ id: string }> =
          networksRes.ok ? await networksRes.json() : [];

        const collectedScenes: DaliSceneRef[] = [];
        const seen = new Set<string>();

        for (const net of networks) {
          if (cancelled) return;
          const detailUrl = API_ROUTES.DALI_DESIGNER_SERVICE.NETWORK(
            projectId,
            net.id,
          );
          const detailRes = await fetch(detailUrl, {
            headers: { Accept: 'application/json' },
          });
          if (!detailRes.ok) continue;
          const detail: any = await detailRes.json();

          const rawScenes: any[] = Array.isArray(detail?.scenes) ? detail.scenes : [];
          for (const s of rawScenes) {
            const sceneId = String(
              s?.id ?? s?.sceneId ?? s?.SceneId ?? s?.Id ?? '',
            );
            if (!sceneId || seen.has(sceneId)) continue;
            seen.add(sceneId);
            collectedScenes.push({
              sceneId,
              name: String(
                s?.name ?? s?.sceneName ?? s?.Name ?? s?.label ?? sceneId,
              ),
            });
          }
        }

        setScenes(collectedScenes);
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? 'Failed to load floorplan data.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [projectId, floorplanId]);

  return { lines, fixtures, scenes, isLoading, error };
}