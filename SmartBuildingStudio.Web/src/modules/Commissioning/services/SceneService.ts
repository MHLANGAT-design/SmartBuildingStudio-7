// src/modules/Commissioning/services/SceneService.ts

import type { SceneTest } from '@/modules/Commissioning/models/SceneTest';

export class SceneService {
  /**
   * Triggers a physical scene and reads back device levels to verify.
   */
  public static async executeSceneTest(sceneId: string): Promise<SceneTest> {
    const res = await fetch(`/api/commissioning/scenes/${sceneId}/test`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error(`Failed to execute scene test for ${sceneId}`);
    return res.json();
  }
}