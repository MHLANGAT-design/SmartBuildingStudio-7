// src/modules/Commissioning/Engine/SceneTestEngine.ts

import type { SceneTest } from '@/modules/Commissioning/models/SceneTest';
import { SceneService } from '@/modules/Commissioning/services/SceneService';

export class SceneTestEngine {
  /**
   * Runs tests for multiple scenes in sequence.
   */
  public static async runSceneTests(sceneIds: string[]): Promise<SceneTest[]> {
    const results: SceneTest[] = [];
    
    for (const sceneId of sceneIds) {
      try {
        const test = await SceneService.executeSceneTest(sceneId);
        results.push(test);
      } catch (e: any) {
        // Push a failed test result if the service throws
        results.push({
          sceneTestId: `failed-${Date.now()}`,
          sceneId,
          sceneName: 'Unknown Scene',
          status: 'FAILED',
          startedAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
          steps: [],
        });
      }
    }

    return results;
  }
}