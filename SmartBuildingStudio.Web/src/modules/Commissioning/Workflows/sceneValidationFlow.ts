// src/modules/Commissioning/Workflows/sceneValidationFlow.ts

import type { CommissioningSession } from '@/modules/Commissioning/models/CommissioningSession';
import { SceneTestEngine } from '@/modules/Commissioning/Engine/SceneTestEngine';
import type { Fault } from '@/modules/Commissioning/models/Fault';
import type { TestResult } from '@/modules/Commissioning/models/TestResult';
import { FaultClassifier } from '@/modules/Commissioning/utils/faultClassifier';

export class SceneValidationFlow {
  /**
   * Executes scene tests and updates the session.
   *
   * - Runs SceneTestEngine.runSceneTests for the given scene ids.
   * - Classifies failed scene tests as faults (deduped against existing).
   * - Merges the new scene test results onto `session.testResults` so
   *   downstream hooks (useSceneTesting → setTestResults → TestResultsPanel)
   *   can render them.
   */
  public static async execute(
    session: CommissioningSession,
    sceneIds: string[],
  ): Promise<CommissioningSession> {
    try {
      const sceneTests = await SceneTestEngine.runSceneTests(
        sceneIds,
        session.sessionId,
      );

      // ── Fault extraction ──
      const newFaults: Fault[] = [];
      for (const test of sceneTests) {
        if (test.status === 'FAILED') {
          newFaults.push(
            FaultClassifier.classify(
              'SCENE_FAILURE',
              test.sceneId,
              `Scene "${(test as any).sceneName ?? test.sceneId}" failed to execute correctly.`,
            ),
          );
        }
      }

      const existingFaults = session.activeFaults ?? [];
      const existingFaultIds = new Set(existingFaults.map((f) => f.faultId));
      const uniqueNewFaults = newFaults.filter((f) => !existingFaultIds.has(f.faultId));

      // ── Convert SceneTest → TestResult and append to the session ──
      const sceneTestResults: TestResult[] = sceneTests.map((t: any) => ({
        testId: t.testId ?? `scene-${t.sceneId}-${Date.now()}`,
        deviceId: t.sceneId ?? '',
        testType: 'SCENE',
        status:
          t.status === 'PASSED' || t.status === 'PASS'
            ? 'PASS'
            : t.status === 'FAILED'
            ? 'FAIL'
            : t.status ?? 'UNKNOWN',
        executedAt: t.executedAt ?? new Date().toISOString(),
        durationMs: t.durationMs ?? 0,
        details:
          t.details ??
          (t.status === 'FAILED'
            ? `Scene "${t.sceneName ?? t.sceneId}" failed`
            : `Scene "${t.sceneName ?? t.sceneId}" passed`),
      }) as unknown as TestResult);

      const existingTestResults = (session as any).testResults ?? [];

      return {
        ...session,
        activeFaults: [...existingFaults, ...uniqueNewFaults],
        testResults: [...existingTestResults, ...sceneTestResults],
      } as CommissioningSession;
    } catch (e: any) {
      console.error('[SceneValidationFlow] Failed:', e);
      // Re-throw so useSceneTesting's catch surfaces the failure in the
      // dialog's error banner instead of silently returning the old session.
      throw e;
    }
  }
}