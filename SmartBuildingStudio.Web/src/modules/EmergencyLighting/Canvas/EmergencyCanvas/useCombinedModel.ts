// src/modules/EmergencyLighting/Canvas/EmergencyCanvas/useCombinedModel.ts

import { useMemo } from 'react';
import { dropOutliers, getPoints } from './geometry';
import type { Pt } from './geometry';

export interface CombinedModelInput {
  floorplanModel: any | null;
  rawGeometry: any[];
  showRawGeometry: boolean;
}

export function useCombinedModel({
  floorplanModel,
  rawGeometry,
  showRawGeometry,
}: CombinedModelInput): any | null {
  return useMemo(() => {
    if (!floorplanModel) return null;

    let cx = 0;
    let cy = 0;
    let count = 0;
    for (const el of floorplanModel.elements || []) {
      for (const p of getPoints(el)) {
        cx += p.x;
        cy += p.y;
        count++;
      }
    }
    const semanticCenter: Pt =
      count > 0 ? { x: cx / count, y: cy / count } : { x: 0, y: 0 };

    const baseElements = dropOutliers(floorplanModel.elements || [], semanticCenter);

    const elements = [...baseElements];
    if (showRawGeometry && rawGeometry.length > 0) {
      const cleanRaw = dropOutliers(rawGeometry, semanticCenter);
      elements.push(...cleanRaw);
    }

    return { ...floorplanModel, elements };
  }, [floorplanModel, rawGeometry, showRawGeometry]);
}