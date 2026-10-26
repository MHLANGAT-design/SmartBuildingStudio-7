// src/modules/FixturePlacementStudio/services/LuxCalculationService.ts

import type { FixtureLayout } from '@/modules/FixturePlacementStudio/models/FixtureLayout';
import type { PhotometricData } from '@/modules/FixturePlacementStudio/models/PhotometricData';
import type {
  LightingCalculation,
  CalculationScope,
  CalculationInputs,
  CalculationKind,
  LuxAverageResult,
  UniformityResult,
  IlluminanceMapResult,
} from '@/modules/FixturePlacementStudio/models/LightingCalculation';
import { createCalculation } from '@/modules/FixturePlacementStudio/models/LightingCalculation';
import type { PhotometricService, WallSegment } from '@/modules/FixturePlacementStudio/services/PhotometricService';
import { stableStringify } from '@/modules/FixturePlacementStudio/Document/FixtureDocumentSerializer';

export interface LuxCalculationOptions {
  resolutionMeters?: number;
  heightMeters?: number;
  targetLux?: number;
  /** Wall/door/window segments for occlusion. Empty array = no occlusion. */
  walls?: WallSegment[];
}

export class LuxCalculationService {
  private readonly photometric: PhotometricService;
  private counter = 0;

  constructor(photometric: PhotometricService) {
    this.photometric = photometric;
  }

  async run(
    layout: FixtureLayout,
    kind: CalculationKind = 'lux-average',
    scope: CalculationScope = { type: 'document' },
    options?: LuxCalculationOptions
  ): Promise<LightingCalculation> {
    const inputsHash = LuxCalculationService.hashInputs(layout, options);
    const inputs = LuxCalculationService.buildInputs(layout, options);

    const calc = createCalculation({
      id: `calc-${Date.now()}-${this.counter++}`,
      documentId: layout.documentId,
      kind,
      scope,
      inputs,
      inputsHash,
    });
    calc.status = 'running';

    const startedAt = performance.now();

    try {
      const photometric = await this.photometric.compute(layout, {
        resolutionMeters: options?.resolutionMeters,
        heightMeters: options?.heightMeters,
        targetLux: options?.targetLux,
        walls: options?.walls,
      });

      calc.status = 'complete';
      calc.result = LuxCalculationService.photometricToResult(kind, photometric);
      calc.finishedAt = new Date().toISOString();
      calc.durationMs = performance.now() - startedAt;
      return calc;
    } catch (error: any) {
      calc.status = 'failed';
      calc.error = error?.message ?? 'Unknown calculation error';
      calc.finishedAt = new Date().toISOString();
      calc.durationMs = performance.now() - startedAt;
      return calc;
    }
  }

  private static photometricToResult(
    kind: CalculationKind,
    data: PhotometricData
  ): LightingCalculation['result'] {
    switch (kind) {
      case 'lux-average': {
        const result: LuxAverageResult = {
          kind: 'lux-average',
          averageLux: data.summary?.averageLux ?? 0,
          areaM2: data.summary?.areaM2 ?? 0,
        };
        return result;
      }
      case 'uniformity': {
        const result: UniformityResult = {
          kind: 'uniformity',
          minToAvg: data.summary?.uniformityU0 ?? 0,
          minToMax: data.summary?.uniformityUd ?? 0,
          minLux: data.summary?.minLux ?? 0,
          maxLux: data.summary?.maxLux ?? 0,
          averageLux: data.summary?.averageLux ?? 0,
        };
        return result;
      }
      case 'illuminance-map': {
        const samples = (data.samples || []).map((s) => ({
          x: s.x,
          y: s.y,
          z: s.z,
          lux: s.lux,
        }));

        const result: IlluminanceMapResult = {
          kind: 'illuminance-map',
          resolutionMeters: data.resolutionMeters,
          heightMeters: data.heightMeters,
          bounds: data.bounds,
          gridWidth: 0,
          gridHeight: 0,
          values: samples.map((s) => s.lux),
          samples,
          minLux: data.summary?.minLux ?? 0,
          maxLux: data.summary?.maxLux ?? 0,
          averageLux: data.summary?.averageLux ?? 0,
        };
        return result;
      }
      default:
        return {
          kind: 'lux-average',
          averageLux: data.summary?.averageLux ?? 0,
          areaM2: data.summary?.areaM2 ?? 0,
        };
    }
  }

  static hashInputs(
    layout: FixtureLayout,
    options?: LuxCalculationOptions
  ): string {
    const relevant = {
      fixtures: layout.fixtures.map((f) => ({
        id: f.id,
        productId: f.productId,
        x: f.x,
        y: f.y,
        rotation: f.rotation,
        elevation: f.elevation ?? 0,
      })),
      zones: layout.zones.map((z) => ({
        id: z.id,
        memberFixtureIds: z.memberFixtureIds,
      })),
      // Include wall count so a document-level change forces a
      // recalculation. A full geometry hash would be expensive.
      wallCount: options?.walls?.length ?? 0,
      options: {
        resolutionMeters: options?.resolutionMeters,
        heightMeters: options?.heightMeters,
        targetLux: options?.targetLux,
      },
    };
    return LuxCalculationService.djb2(stableStringify(relevant));
  }

  private static djb2(str: string): string {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
    }
    return (hash >>> 0).toString(16);
  }

  private static buildInputs(
    layout: FixtureLayout,
    _options?: LuxCalculationOptions
  ): CalculationInputs {
    return {
      productIds: Array.from(new Set(layout.fixtures.map((f) => f.productId))),
      fixtureIds: layout.fixtures.map((f) => f.id),
      zoneIds: layout.zones.map((z) => z.id),
    };
  }
}

export default LuxCalculationService;