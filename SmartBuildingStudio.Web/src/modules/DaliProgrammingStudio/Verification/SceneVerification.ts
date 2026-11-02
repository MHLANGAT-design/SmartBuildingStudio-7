// src/modules/DaliProgrammingStudio/Verification/SceneVerification.ts

import type { VerificationResult } from '@/modules/DaliProgrammingStudio/Verification/VerificationResult';
import { VERIFICATION_CHECK_RESULTS } from '@/modules/DaliProgrammingStudio/constants/verificationConstants';

export class SceneVerification {
  public verifyScenes(
    expected: { sceneId: number; level: number }[],
    actual: { sceneId: number; level: number }[],
    deviceId: string
  ): VerificationResult[] {
    const results: VerificationResult[] = [];

    for (const expScene of expected) {
      const actScene = actual.find(a => a.sceneId === expScene.sceneId);
      
      results.push({
        checkId: `scene_${expScene.sceneId}_${deviceId}`,
        deviceId,
        parameter: `scene_${expScene.sceneId}`,
        expectedValue: expScene.level,
        actualValue: actScene?.level,
        result: actScene?.level === expScene.level ? VERIFICATION_CHECK_RESULTS.PASS : VERIFICATION_CHECK_RESULTS.FAIL,
      });
    }

    return results;
  }
}