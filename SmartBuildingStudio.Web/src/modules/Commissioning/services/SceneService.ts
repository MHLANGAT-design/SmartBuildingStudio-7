// src/modules/Commissioning/services/SceneService.ts

import { CommissioningApi } from '@/modules/Commissioning/services/CommissioningApi';
import type { SceneTest } from '@/modules/Commissioning/models/SceneTest';

export class SceneService {
  public static async executeSceneTest(sceneId: string): Promise<SceneTest> {
    return CommissioningApi.executeSceneTest(sceneId);
  }
}