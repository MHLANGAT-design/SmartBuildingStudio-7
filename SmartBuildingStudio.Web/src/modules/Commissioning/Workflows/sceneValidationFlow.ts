// src/modules/Commissioning/Workflows/sceneValidationFlow.ts

import type { CommissioningSession } from '@/modules/Commissioning/models/CommissioningSession';
import { SceneTestEngine } from '@/modules/Commissioning/Engine/SceneTestEngine';
import type { Fault } from '@/modules/Commissioning/models/Fault';
import { FaultClassifier } from '@/modules/Commissioning/utils/faultClassifier';

export class SceneValidationFlow {
  /**
   * Executes scene tests and updates the session.
   */
  public static async execute(
    session: CommissioningSession,
    sceneIds: string[],
  ): Promise<CommissioningSession> {
    try {
      const sceneTests = await SceneTestEngine.runSceneTests(sceneIds);

      // Convert failed scenes into faults
      const newFaults: Fault[] = [];
      for (const test of sceneTests) {
        if (test.status === 'FAILED') {
          newFaults.push(
            FaultClassifier.classify(
              'SCENE_FAILURE',
              test.sceneId,
              `Scene "${test.sceneName}" failed to execute correctly.`,
            ),
          );
        }
      }

      // Merge faults
      // FIX: ?? [] guard so a partial session doesn't throw on .map.
      const existingFaults = session.activeFaults ?? [];
      const existingFaultIds = new Set(existingFaults.map((f) => f.faultId));
      const uniqueNewFaults = newFaults.filter((f) => !existingFaultIds.has(f.faultId));

      return {
        ...session,
        activeFaults: [...existingFaults, ...uniqueNewFaults],
      };
    } catch (e: any) {
      console.error('[SceneValidationFlow] Failed:', e);
      return session;
    }
  }
}